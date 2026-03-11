import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus, Clock, X, Calendar as CalendarIcon, AlignLeft, Trash2, Loader2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { logActivity } from "../lib/activityLogger";

// --- TYPES ---
interface CalendarEvent {
  id: string;
  title: string;
  time: string; // "HH:MM"
  duration: number; // in hours
  color: string;
  description?: string;
  dateStr: string; // FORMAT: "YYYY-MM-DD"
}

// --- CALENDAR UTILS ---
const daysOfWeek = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const fullDaysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const generateCalendarDays = () => {
  const days = [];
  for (let i = 28; i <= 30; i++) {
    days.push({ day: i, month: 8, prev: true, dateStr: `2023-09-${String(i).padStart(2, '0')}` });
  }
  for (let i = 1; i <= 31; i++) {
    days.push({ day: i, month: 9, prev: false, dateStr: `2023-10-${String(i).padStart(2, '0')}` });
  }
  days.push({ day: 1, month: 10, prev: true, dateStr: `2023-11-01` });
  return days;
};

const calendarDays = generateCalendarDays();
const hours = Array.from({ length: 10 }, (_, i) => `${String(i + 8).padStart(2, '0')}:00`);

export default function CalendarPage() {
  const { toast } = useToast();
  const [selectedDateStr, setSelectedDateStr] = useState("2023-10-24");
  const [viewMode, setViewMode] = useState<"Day" | "Week" | "Month">("Week");
  
  // --- DATABASE STATES ---
  const [allEvents, setAllEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // --- MODAL STATES ---
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  
  // --- FORM STATES ---
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDateStr, setNewEventDateStr] = useState("2023-10-24");
  const [newEventTime, setNewEventTime] = useState("09:00");
  const [newEventDuration, setNewEventDuration] = useState(1);
  const [newEventColor, setNewEventColor] = useState("bg-primary");

  // --- FETCH & REAL-TIME SUPABASE ---
  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      const { data, error } = await supabase.from('calendar_events').select('*');
      
      if (error) {
        console.error("Gagal menarik jadwal:", error);
      } else if (data) {
        // Mapping kolom DB (date_str) ke interface UI (dateStr)
        const formatted = data.map((d: any) => ({
          id: d.id,
          title: d.title,
          time: d.time,
          duration: d.duration,
          color: d.color,
          description: d.description,
          dateStr: d.date_str
        }));
        setAllEvents(formatted);
      }
      setIsLoading(false);
    };

    fetchEvents();

    const channel = supabase.channel('calendar-room')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'calendar_events' }, (payload) => {
        setAllEvents((current) => {
          if (payload.eventType === 'INSERT') {
            const newEv = { ...payload.new, dateStr: payload.new.date_str };
            return [...current, newEv as CalendarEvent];
          }
          if (payload.eventType === 'DELETE') {
            return current.filter(e => e.id !== payload.old.id);
          }
          if (payload.eventType === 'UPDATE') {
            const updatedEv = { ...payload.new, dateStr: payload.new.date_str };
            return current.map(e => e.id === payload.new.id ? (updatedEv as CalendarEvent) : e);
          }
          return current;
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // --- DERIVED DATA ---
  const getDayInfo = (dateStr: string) => {
    const dateObj = new Date(dateStr);
    return { dayNum: dateObj.getDate(), dayName: fullDaysOfWeek[dateObj.getDay()] };
  };

  const currentWeekDays = useMemo(() => {
    const selectedDate = new Date(selectedDateStr);
    const dayOfWeek = selectedDate.getDay();
    const diffToMonday = selectedDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    
    const weekStart = new Date(selectedDate.setDate(diffToMonday));
    const week = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      week.push({ dateStr: d.toISOString().split('T')[0], dayNum: d.getDate(), dayName: fullDaysOfWeek[d.getDay()] });
    }
    return week;
  }, [selectedDateStr]);

  const upcomingEvents = useMemo(() => {
    return [...allEvents]
      .sort((a, b) => new Date(`${a.dateStr}T${a.time}`).getTime() - new Date(`${b.dateStr}T${b.time}`).getTime())
      .filter(e => new Date(`${e.dateStr}T${e.time}`).getTime() >= new Date("2023-10-23T00:00").getTime()) // Menampilkan dari tgl aktif ke depan
      .slice(0, 4);
  }, [allEvents]);

  // --- HANDLERS ---
  const handleOpenCreateForm = (specificDateStr?: string) => {
    setEditingEventId(null);
    setNewEventTitle("");
    setNewEventDateStr(specificDateStr || selectedDateStr);
    setNewEventTime("09:00");
    setNewEventDuration(1);
    setNewEventColor("bg-primary");
    setIsFormModalOpen(true);
  };

  const handleEditClick = () => {
    if (selectedEvent) {
      setNewEventTitle(selectedEvent.title);
      setNewEventDateStr(selectedEvent.dateStr);
      setNewEventTime(selectedEvent.time);
      setNewEventDuration(selectedEvent.duration);
      setNewEventColor(selectedEvent.color);
      setEditingEventId(selectedEvent.id);
      setSelectedEvent(null);
      setIsFormModalOpen(true);
    }
  };

  const handleSaveEvent = async () => {
    if (!newEventTitle.trim()) return;

    const eventPayload = {
      title: newEventTitle,
      date_str: newEventDateStr,
      time: newEventTime,
      duration: Number(newEventDuration),
      color: newEventColor,
      description: "Managed via Xenith App Calendar.",
    };

    if (editingEventId) {
      // UPDATE KE DB
      const { error } = await supabase.from('calendar_events').update(eventPayload).eq('id', editingEventId);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Jadwal berhasil diperbarui." });
        
        // 🚀 SUNTIKAN NOTIFIKASI: JADWAL DIUPDATE
        await logActivity({
          user: "You",
          action: "updated the schedule for",
          target: newEventTitle,
          type: "success",
          iconName: "CheckCircle",
          iconBg: "bg-info/10 text-info"
        });
      }
    } else {
      // INSERT KE DB
      const { error } = await supabase.from('calendar_events').insert([eventPayload]);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Jadwal baru ditambahkan." });
        
        // 🚀 SUNTIKAN NOTIFIKASI: JADWAL BARU
        await logActivity({
          user: "You",
          action: "scheduled a new event:",
          target: newEventTitle,
          message: `Set for ${newEventDateStr} at ${newEventTime}`,
          type: "invite",
          iconName: "AtSign",
          iconBg: "bg-primary/10 text-primary"
        });
      }
    }

    setIsFormModalOpen(false);
  };

  // --- HANDLER HAPUS JADWAL ---
  const handleDeleteEvent = async (id: string) => {
    // Ambil nama judul sebelum dihapus untuk notifikasi
    const eventTitle = selectedEvent?.title || "an event"; 
    
    const { error } = await supabase.from('calendar_events').delete().eq('id', id);
    
    if (error) {
      toast({ title: "Error", description: "Gagal menghapus jadwal.", variant: "destructive" });
    } else {
      toast({ title: "Terhapus", description: "Jadwal berhasil dihapus dari sistem." });
      
      // 🚀 SUNTIKAN NOTIFIKASI: JADWAL DIBATALKAN
      await logActivity({
        user: "You",
        action: "canceled the event",
        target: eventTitle,
        type: "warning",
        iconName: "AlertTriangle",
        iconBg: "bg-destructive/10 text-destructive"
      });
      
      setSelectedEvent(null);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-full overflow-hidden relative">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-50 bg-background/50 backdrop-blur-sm flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {/* --- SIDEBAR --- */}
      <aside className="w-full lg:w-72 border-b lg:border-b-0 lg:border-r border-border bg-card flex flex-col shrink-0 p-6 overflow-y-auto">
        <motion.button
          onClick={() => handleOpenCreateForm()}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-primary hover:opacity-90 text-primary-foreground font-medium py-2.5 px-4 rounded-xl shadow-primary-glow transition-all flex items-center justify-center gap-2 mb-8"
        >
          <Plus className="h-4 w-4" /> Create Event
        </motion.button>

        {/* Mini Calendar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4 px-1">
            <span className="font-semibold text-foreground">October 2023</span>
            <div className="flex gap-2">
              <button className="text-muted-foreground hover:text-foreground transition-colors"><ChevronLeft className="h-4 w-4" /></button>
              <button className="text-muted-foreground hover:text-foreground transition-colors"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-y-3 gap-x-1 text-center text-xs text-muted-foreground mb-2">
            {daysOfWeek.map((d) => <span key={d}>{d}</span>)}
          </div>
          <div className="grid grid-cols-7 gap-y-1 gap-x-1 text-center text-sm font-medium">
            {calendarDays.map((d, i) => (
              <span
                key={i}
                onClick={() => { if(!d.prev) setSelectedDateStr(d.dateStr); }}
                onDoubleClick={() => !d.prev && handleOpenCreateForm(d.dateStr)}
                className={`py-1.5 rounded cursor-pointer transition-all ${
                  d.prev
                    ? "text-muted-foreground/30"
                    : d.dateStr === selectedDateStr
                    ? "bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center mx-auto shadow-primary-glow"
                    : "text-foreground hover:bg-muted"
                }`}
                title="Click to select, double-click to add event"
              >
                {d.day}
              </span>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground text-center mt-2">Double-click a date to add an event.</p>
        </div>

        {/* Upcoming Events */}
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-1">Upcoming Events</h3>
          <div className="space-y-3">
            <AnimatePresence>
              {upcomingEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground italic px-1">No upcoming events.</p>
              ) : (
                upcomingEvents.map((event, i) => {
                  const dayInfo = getDayInfo(event.dateStr);
                  return (
                    <motion.div
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ delay: i * 0.05 }}
                      className="group flex items-start gap-3 p-2 rounded-xl hover:bg-muted transition-colors cursor-pointer"
                    >
                      <div className={`w-1 h-full min-h-[2.5rem] ${event.color} rounded-full shrink-0`} />
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">{event.title}</h4>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5 font-medium">
                          Oct {dayInfo.dayNum} <span className="mx-1">•</span> <Clock className="h-3 w-3" /> {event.time}
                        </p>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>
        </div>
      </aside>

      {/* --- MAIN CALENDAR AREA --- */}
      <main className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            {viewMode === "Month" ? "October 2023" : 
             viewMode === "Day" ? `${getDayInfo(selectedDateStr).dayName}, Oct ${getDayInfo(selectedDateStr).dayNum}, 2023` : 
             `Week of Oct ${currentWeekDays[0].dayNum} - ${currentWeekDays[6].dayNum}, 2023`}
          </h1>
          <div className="flex bg-muted rounded-xl p-1 relative">
            {(["Day", "Week", "Month"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setViewMode(v)}
                className={`relative z-10 px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  viewMode === v ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {viewMode === v && (
                  <motion.div layoutId="view-mode-tab" className="absolute inset-0 bg-card shadow-sm rounded-lg -z-10" transition={{ type: "spring", stiffness: 300, damping: 30 }} />
                )}
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* CONDITIONAL CALENDAR VIEWS */}
        <motion.div
          key={viewMode}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
          className="border border-border rounded-2xl overflow-hidden bg-card shadow-sm"
        >
          {/* VIEW: WEEK OR DAY */}
          {(viewMode === "Week" || viewMode === "Day") && (
            <>
              <div className={`grid ${viewMode === "Week" ? "grid-cols-7" : "grid-cols-1"} border-b border-border`}>
                {(viewMode === "Week" ? currentWeekDays : currentWeekDays.filter(d => d.dateStr === selectedDateStr)).map((d) => (
                  <div key={d.dateStr} className={`text-center py-3 text-sm font-medium border-r border-border last:border-r-0 ${d.dateStr === selectedDateStr ? "text-primary bg-primary/5" : "text-muted-foreground"}`}>
                    {d.dayName}
                    {viewMode === "Week" && <div className="text-xs opacity-70 mt-0.5">{d.dayNum}</div>}
                  </div>
                ))}
              </div>

              <div className="relative" style={{ height: "600px" }}>
                {hours.map((h, i) => (
                  <div key={h} className="absolute w-full border-t border-border/50 text-[10px] text-muted-foreground pl-2" style={{ top: `${i * 60}px` }}>
                    {h}
                  </div>
                ))}

                <div className={`grid ${viewMode === "Week" ? "grid-cols-7" : "grid-cols-1"} h-full absolute inset-0 pl-10 pr-2`}>
                  {(viewMode === "Week" ? currentWeekDays : currentWeekDays.filter(d => d.dateStr === selectedDateStr)).map((day) => {
                    const dayEvents = allEvents.filter(e => e.dateStr === day.dateStr);
                    
                    return (
                      <div key={day.dateStr} className="relative border-r border-border/50 last:border-r-0" onDoubleClick={() => handleOpenCreateForm(day.dateStr)}>
                        {dayEvents.map((ev, ei) => {
                          const startHour = parseInt(ev.time.split(":")[0]) - 8;
                          return (
                            <motion.div
                              key={ev.id}
                              onClick={(e) => { e.stopPropagation(); setSelectedEvent(ev); }}
                              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 + ei * 0.05 }}
                              className={`absolute mx-1 ${ev.color} text-white rounded-xl p-2.5 text-xs font-medium cursor-pointer hover:shadow-md hover:opacity-90 transition-all border border-black/10 overflow-hidden`}
                              style={{ top: `${startHour * 60}px`, height: `${ev.duration * 60 - 4}px`, left: "4px", right: "4px" }}
                            >
                              <span className="block font-bold truncate">{ev.title}</span>
                              <span className="block font-normal opacity-90 mt-0.5">{ev.time}</span>
                            </motion.div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* VIEW: MONTH */}
          {viewMode === "Month" && (
            <div className="h-[600px] flex flex-col">
              <div className="grid grid-cols-7 border-b border-border bg-muted/20">
                {daysOfWeek.map((d) => (
                  <div key={d} className="text-center py-3 text-sm font-semibold text-muted-foreground border-r border-border last:border-r-0">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 flex-1">
                {calendarDays.map((d, i) => {
                  const dayEvents = allEvents.filter(e => e.dateStr === d.dateStr);
                  
                  return (
                    <div 
                      key={i} 
                      onClick={() => !d.prev && setSelectedDateStr(d.dateStr)}
                      onDoubleClick={() => !d.prev && handleOpenCreateForm(d.dateStr)}
                      className={`border-r border-b border-border/50 p-2 min-h-[100px] transition-colors hover:bg-muted/30 cursor-pointer overflow-hidden ${d.prev ? "bg-muted/10 text-muted-foreground/40" : "text-foreground"}`}
                    >
                      <span className={`inline-flex items-center justify-center w-6 h-6 text-xs font-medium rounded-full ${d.dateStr === selectedDateStr && !d.prev ? "bg-primary text-primary-foreground" : ""}`}>
                        {d.day}
                      </span>
                      
                      <div className="mt-1 space-y-1">
                        {dayEvents.slice(0, 2).map((ev) => {
                           let textClass = "text-white"; 
                           if (ev.color === "bg-warning" || ev.color === "bg-muted") textClass = "text-slate-800"; 

                          return (
                            <div 
                              key={ev.id} 
                              onClick={(e) => { e.stopPropagation(); setSelectedEvent(ev); }}
                              className={`${ev.color} ${textClass} text-[10px] font-bold px-1.5 py-0.5 rounded truncate cursor-pointer hover:opacity-80 transition-opacity`}
                            >
                              {ev.time.split(":")[0]}:00 {ev.title}
                            </div>
                          );
                        })}
                        {dayEvents.length > 2 && (
                          <div className="text-[10px] text-muted-foreground font-medium px-1">+{dayEvents.length - 2} more</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>
      </main>

      {/* --- MODALS AREA --- */}
      
      {/* 1. Modal Event Details */}
      <AnimatePresence>
        {selectedEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedEvent(null)} className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl overflow-hidden z-10">
              <div className={`h-2 w-full ${selectedEvent.color}`} />
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-bold text-foreground pr-4">{selectedEvent.title}</h2>
                  <button onClick={() => setSelectedEvent(null)} className="p-1 text-muted-foreground hover:text-foreground bg-muted rounded-full"><X className="w-4 h-4" /></button>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-sm text-foreground">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground"><Clock className="w-4 h-4" /></div>
                    <div>
                      <p className="font-medium text-foreground">
                        {getDayInfo(selectedEvent.dateStr).dayName}, Oct {getDayInfo(selectedEvent.dateStr).dayNum}
                      </p>
                      <p className="text-muted-foreground">{selectedEvent.time} ({selectedEvent.duration} hr)</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-sm text-foreground">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0"><AlignLeft className="w-4 h-4" /></div>
                    <p className="pt-1.5 text-muted-foreground leading-relaxed">{selectedEvent.description || "No specific details provided."}</p>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-sm text-foreground">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground"><CalendarIcon className="w-4 h-4" /></div>
                      <p className="font-medium text-foreground">My Calendar</p>
                    </div>
                    <button onClick={() => handleDeleteEvent(selectedEvent.id)} className="text-destructive hover:bg-destructive/10 p-2 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold">
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  </div>
                </div>
                <div className="mt-8 flex gap-3">
                  <button onClick={handleEditClick} className="flex-1 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-xl hover:opacity-90 transition-opacity">Edit Event</button>
                  <button onClick={() => setSelectedEvent(null)} className="px-4 py-2.5 bg-muted text-foreground text-sm font-medium rounded-xl hover:bg-muted/80 transition-colors">Close</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Modal Create / Edit Form */}
      <AnimatePresence>
        {isFormModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsFormModalOpen(false)} className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl overflow-hidden z-10">
              <div className="p-6 border-b border-border flex justify-between items-center">
                <h2 className="text-xl font-bold text-foreground">
                  {editingEventId ? "Edit Event" : "Create New Event"}
                </h2>
                <button onClick={() => setIsFormModalOpen(false)} className="p-1 text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Event Title</label>
                  <input type="text" value={newEventTitle} onChange={(e) => setNewEventTitle(e.target.value)} autoFocus placeholder="e.g., Marketing Sync" className="w-full bg-muted/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4 py-2.5 text-sm outline-none transition-all text-foreground" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Date</label>
                    <input type="date" min="2023-10-01" max="2023-11-01" value={newEventDateStr} onChange={(e) => setNewEventDateStr(e.target.value)} className="w-full bg-muted/50 border border-border focus:border-primary rounded-xl px-4 py-2.5 text-sm outline-none text-foreground" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Time</label>
                    <select value={newEventTime} onChange={(e) => setNewEventTime(e.target.value)} className="w-full bg-muted/50 border border-border focus:border-primary rounded-xl px-4 py-2.5 text-sm outline-none text-foreground appearance-none">
                      {hours.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Duration (Hours)</label>
                    <input type="number" step="0.5" min="0.5" max="5" value={newEventDuration} onChange={(e) => setNewEventDuration(Number(e.target.value))} className="w-full bg-muted/50 border border-border focus:border-primary rounded-xl px-4 py-2.5 text-sm outline-none text-foreground" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Color</label>
                    <select value={newEventColor} onChange={(e) => setNewEventColor(e.target.value)} className="w-full bg-muted/50 border border-border focus:border-primary rounded-xl px-4 py-2.5 text-sm outline-none text-foreground appearance-none">
                      <option value="bg-primary">Blue (Primary)</option>
                      <option value="bg-info">Cyan (Info)</option>
                      <option value="bg-success">Green (Success)</option>
                      <option value="bg-warning">Yellow (Warning)</option>
                      <option value="bg-destructive">Red (Urgent)</option>
                      <option value="bg-violet-500">Purple</option>
                    </select>
                  </div>
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button onClick={() => setIsFormModalOpen(false)} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
                  <button onClick={handleSaveEvent} disabled={!newEventTitle.trim()} className="px-5 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-2">
                    {editingEventId ? "Save Changes" : <><Plus className="w-4 h-4" /> Create</>}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
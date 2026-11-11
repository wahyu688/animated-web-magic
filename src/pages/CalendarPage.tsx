import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Clock, Plus } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { logActivity } from "../lib/activityLogger";
import { useCompany } from "@/hooks/use-company";
import { safeRemoveChannel, withSupabaseTimeout } from "@/lib/supabaseLifecycle";
import { useSupabaseResumeRecovery } from "@/hooks/use-supabase-resume-recovery";
import { EventDetailDialog, EventFormDialog, type EventDraft } from "@/components/calendar/EventDialogs";
import DeleteConfirmModal from "@/components/modals/DeleteConfirmModal";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  addDays, addMonths, formatDuration, layoutDay, minutesToTime, monthGrid, normalizeDateStr, parseDate,
  timeToMinutes, todayStr, weekOf, type CalendarEvent,
} from "@/lib/calendar";
import { toneClasses, toneFromClass } from "@/lib/tones";
import { cn } from "@/lib/utils";

interface CalendarEventRow {
  id: string;
  title: string;
  time: string;
  duration: number;
  color: string;
  description?: string | null;
  date_str: string;
}

type ViewMode = "Day" | "Week" | "Month";

const HOUR_HEIGHT = 58;
const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];
const WEEKDAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const formatEvent = (d: CalendarEventRow): CalendarEvent => ({
  id: d.id,
  title: d.title,
  time: (d.time || "09:00").slice(0, 5),
  duration: Number(d.duration) || 1,
  color: d.color,
  description: d.description,
  dateStr: normalizeDateStr(d.date_str),
});

function useNowMinutes() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);
  return { minutes: now.getHours() * 60 + now.getMinutes(), dateStr: todayStr() };
}

function EventBlock({ event, compact, onOpen }: { event: CalendarEvent; compact?: boolean; onOpen: () => void }) {
  const tone = toneClasses[toneFromClass(event.color)];
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onOpen();
      }}
      onDoubleClick={(e) => e.stopPropagation()}
      className={cn(
        "h-full w-full overflow-hidden rounded-md border-l-[3px] px-2 py-1 text-left transition-[filter] hover:brightness-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:hover:brightness-110",
        tone.soft, tone.border, tone.text
      )}
    >
      <span className="block text-[13px] font-semibold leading-4">{event.title}</span>
      {!compact && (
        <span className="mt-0.5 block text-micro opacity-80 tabular">{event.time} · {formatDuration(event.duration)}</span>
      )}
    </button>
  );
}

export default function CalendarPage() {
  const { toast } = useToast();
  const { companyId, isCompanyLoading } = useCompany();
  const now = useNowMinutes();

  const [selectedDateStr, setSelectedDateStr] = useState(todayStr());
  const [miniMonthStr, setMiniMonthStr] = useState(todayStr());
  // Phones start on the day view; seven columns don't fit at 390px.
  const [viewMode, setViewMode] = useState<ViewMode>(() => (window.innerWidth < 640 ? "Day" : "Week"));

  const [allEvents, setAllEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isMountedRef = useRef(false);
  const fetchRequestIdRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CalendarEvent | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<EventDraft>({ title: "", dateStr: todayStr(), time: "09:00", duration: 1, color: "bg-primary", description: "" });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isCompanyLoading && !companyId) {
      setIsLoading(false);
      setAllEvents([]);
    }
  }, [companyId, isCompanyLoading]);

  const fetchEvents = useCallback(async (showLoading = false) => {
    if (!companyId) {
      if (showLoading) setIsLoading(false);
      return;
    }
    const requestId = ++fetchRequestIdRef.current;

    try {
      if (showLoading) setIsLoading(true);
      const { data, error } = await withSupabaseTimeout(
        supabase
          .from('calendar_events')
          .select('*')
          .eq('company_id', companyId)
          .order('date_str', { ascending: true })
          .order('time', { ascending: true }),
        "calendar events"
      );
      if (error) throw error;
      if (!isMountedRef.current || requestId !== fetchRequestIdRef.current) return;
      setAllEvents((data ?? []).map(formatEvent));
    } catch (error) {
      console.error("Gagal menarik jadwal:", error);
      toast({ title: "Couldn't load the calendar", description: "Check your connection and refresh.", variant: "destructive" });
    } finally {
      if (isMountedRef.current && (showLoading || requestId === fetchRequestIdRef.current)) setIsLoading(false);
    }
  }, [companyId, toast]);

  useSupabaseResumeRecovery({
    enabled: Boolean(companyId),
    onRecover: () => fetchEvents(false),
  });

  useEffect(() => {
    isMountedRef.current = true;
    if (!companyId) return;
    fetchEvents(true);

    const channel = supabase.channel(`calendar-events-realtime:${companyId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'calendar_events', filter: `company_id=eq.${companyId}` }, () => fetchEvents())
      .subscribe((status, error) => {
        if (status === 'SUBSCRIBED') fetchEvents();
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          console.warn("[calendar realtime] disconnected; mutation fetch fallback remains active.", { status, error });
        }
      });

    return () => {
      isMountedRef.current = false;
      safeRemoveChannel(channel);
    };
  }, [companyId, fetchEvents]);

  // --- Derived ---
  const visibleDays = useMemo(() => (viewMode === "Day" ? [selectedDateStr] : weekOf(selectedDateStr)), [viewMode, selectedDateStr]);
  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of allEvents) {
      const list = map.get(event.dateStr) ?? [];
      list.push(event);
      map.set(event.dateStr, list);
    }
    return map;
  }, [allEvents]);

  // Grid spans 08:00–19:00, widened to fit any earlier/later event in view.
  const [gridStart, gridEnd] = useMemo(() => {
    let start = 8 * 60;
    let end = 19 * 60;
    for (const day of visibleDays) {
      for (const event of eventsByDay.get(day) ?? []) {
        const s = timeToMinutes(event.time);
        start = Math.min(start, Math.floor(s / 60) * 60);
        end = Math.max(end, Math.ceil((s + event.duration * 60) / 60) * 60);
      }
    }
    return [start, Math.min(end, 24 * 60)];
  }, [eventsByDay, visibleDays]);

  const hourMarks = Array.from({ length: (gridEnd - gridStart) / 60 }, (_, i) => gridStart + i * 60);

  const upcomingEvents = useMemo(() => {
    const nowKey = `${now.dateStr} ${minutesToTime(now.minutes)}`;
    return allEvents
      .filter((e) => `${e.dateStr} ${e.time}` >= nowKey)
      .sort((a, b) => `${a.dateStr} ${a.time}`.localeCompare(`${b.dateStr} ${b.time}`))
      .slice(0, 4);
  }, [allEvents, now.dateStr, now.minutes]);

  // Start each new week/day at the top of the time grid.
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [viewMode, selectedDateStr]);

  // --- Navigation ---
  const step = (direction: 1 | -1) => {
    const next = viewMode === "Month" ? addMonths(selectedDateStr, direction) : addDays(selectedDateStr, direction * (viewMode === "Week" ? 7 : 1));
    setSelectedDateStr(next);
    setMiniMonthStr(next);
  };

  const goToday = () => {
    setSelectedDateStr(todayStr());
    setMiniMonthStr(todayStr());
  };

  const selectedDate = parseDate(selectedDateStr);
  const title = (() => {
    if (viewMode === "Month") return selectedDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    if (viewMode === "Day") return selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
    const [first, last] = [parseDate(visibleDays[0]), parseDate(visibleDays[6])];
    const sameMonth = first.getMonth() === last.getMonth();
    return `Week of ${first.toLocaleDateString("en-US", { month: "long" })} ${first.getDate()} – ${sameMonth ? "" : `${last.toLocaleDateString("en-US", { month: "short" })} `}${last.getDate()}`;
  })();

  // --- Mutations ---
  const openCreate = (dateStr = selectedDateStr, time = "09:00") => {
    setEditingId(null);
    setDraft({ title: "", dateStr, time, duration: 1, color: "bg-primary", description: "" });
    setFormOpen(true);
  };

  const openEdit = (event: CalendarEvent) => {
    setSelectedEvent(null);
    setEditingId(event.id);
    setDraft({ title: event.title, dateStr: event.dateStr, time: event.time, duration: event.duration, color: event.color, description: event.description ?? "" });
    setFormOpen(true);
  };

  const handleSaveEvent = async (values: EventDraft) => {
    if (!companyId) return;
    setIsSaving(true);
    const payload = {
      company_id: companyId,
      title: values.title.trim(),
      date_str: values.dateStr,
      time: values.time,
      duration: values.duration,
      color: values.color,
      description: values.description.trim(),
    };

    const { error } = editingId
      ? await supabase.from('calendar_events').update(payload).eq('company_id', companyId).eq('id', editingId)
      : await supabase.from('calendar_events').insert([payload]);
    setIsSaving(false);

    if (error) {
      toast({ title: "Couldn't save the event", description: error.message, variant: "destructive" });
      return;
    }

    setFormOpen(false);
    await fetchEvents();
    toast({ title: editingId ? "Event updated" : "Event created", description: `${payload.title} · ${parseDate(values.dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${values.time}` });
    await logActivity(editingId
      ? { user: "You", action: "updated the schedule for", target: payload.title, type: "success", iconName: "CheckCircle", iconBg: "bg-info/10 text-info", companyId }
      : { user: "You", action: "scheduled a new event:", target: payload.title, message: `Set for ${values.dateStr} at ${values.time}`, type: "invite", iconName: "AtSign", iconBg: "bg-primary/10 text-primary", hasAction: true, companyId });
  };

  const handleDeleteEvent = async (event: CalendarEvent) => {
    if (!companyId) return;
    const { error } = await supabase.from('calendar_events').delete().eq('company_id', companyId).eq('id', event.id);
    if (error) {
      toast({ title: "Couldn't delete the event", description: "Try again.", variant: "destructive" });
      return;
    }
    setSelectedEvent(null);
    await fetchEvents();
    toast({ title: "Event deleted", description: `${event.title} was removed from the calendar.` });
    await logActivity({ user: "You", action: "canceled the event", target: event.title, type: "warning", iconName: "AlertTriangle", iconBg: "bg-destructive/10 text-destructive", companyId });
  };

  const slotFromClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const minutes = gridStart + Math.floor(((e.clientY - rect.top) / HOUR_HEIGHT) * 2) * 30;
    return minutesToTime(Math.max(gridStart, Math.min(minutes, 21 * 60 + 30)));
  };

  const showSkeleton = (isCompanyLoading && !companyId) || (Boolean(companyId) && isLoading);
  const miniDate = parseDate(miniMonthStr);

  return (
    <div className="grid gap-5 px-4 pb-12 pt-6 sm:px-6 lg:px-8 lg:pt-7 xl:grid-cols-[272px_minmax(0,1fr)]">
      {/* Left pane */}
      <div className="order-2 space-y-5 xl:order-1">
        <Button size="lg" className="hidden w-full xl:inline-flex" onClick={() => openCreate()}>
          <Plus className="!size-[18px]" /> Create Event
        </Button>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-1">
          <section aria-label="Month navigator" className="rounded-xl border border-border bg-card p-4 shadow-xs">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-label text-foreground">{miniDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</h2>
              <div className="flex gap-0.5">
                <Button variant="ghost" size="icon-sm" className="h-7 w-7" aria-label="Previous month" onClick={() => setMiniMonthStr(addMonths(miniMonthStr, -1))}>
                  <ChevronLeft strokeWidth={1.75} />
                </Button>
                <Button variant="ghost" size="icon-sm" className="h-7 w-7" aria-label="Next month" onClick={() => setMiniMonthStr(addMonths(miniMonthStr, 1))}>
                  <ChevronRight strokeWidth={1.75} />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-7 text-center">
              {WEEKDAYS.map((d, i) => <span key={i} className="pb-2 text-micro font-semibold text-subtle" aria-hidden="true">{d}</span>)}
              {monthGrid(miniMonthStr).map((cell) => {
                const isSelected = cell.dateStr === selectedDateStr;
                const isToday = cell.dateStr === now.dateStr;
                const hasEvents = eventsByDay.has(cell.dateStr);
                return (
                  <button
                    key={cell.dateStr}
                    type="button"
                    onClick={() => setSelectedDateStr(cell.dateStr)}
                    onDoubleClick={() => openCreate(cell.dateStr)}
                    aria-label={parseDate(cell.dateStr).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                    aria-pressed={isSelected}
                    className="group flex h-[42px] flex-col items-center justify-center"
                  >
                    <span
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-full text-small transition-colors tabular",
                        isSelected ? "bg-primary font-semibold text-primary-foreground"
                          : isToday ? "font-semibold text-primary-text"
                          : cell.inMonth ? "text-foreground group-hover:bg-surface-2" : "text-subtle group-hover:bg-surface-2"
                      )}
                    >
                      {cell.day}
                    </span>
                    <span className={cn("mt-0.5 h-1 w-1 rounded-full", hasEvents && !isSelected ? "bg-primary/60" : "bg-transparent")} />
                  </button>
                );
              })}
            </div>
          </section>

          <section aria-label="Upcoming events" className="rounded-xl border border-border bg-card p-4 shadow-xs">
            <h2 className="mb-3 text-card-title text-foreground">Upcoming Events</h2>
            {upcomingEvents.length === 0 ? (
              <p className="text-small text-muted-foreground">Nothing coming up. Double-click a day to add an event.</p>
            ) : (
              <ul className="space-y-3">
                {upcomingEvents.map((event) => {
                  const tone = toneClasses[toneFromClass(event.color)];
                  const date = parseDate(event.dateStr);
                  return (
                    <li key={event.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedEvent(event)}
                        className={cn("w-full border-l-[3px] pl-3 text-left transition-colors hover:bg-surface-2", tone.border)}
                      >
                        <span className="block truncate text-label text-foreground">{event.title}</span>
                        <span className="flex items-center gap-1.5 text-caption font-normal text-muted-foreground tabular">
                          {date.toLocaleDateString("en-US", { weekday: "short" })}, {date.getDate()}
                          <Clock className="h-3 w-3" strokeWidth={2} />
                          {event.time}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </div>

      {/* Calendar */}
      <section aria-label="Calendar" className="order-1 flex min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xs xl:order-2">
        <header className="flex flex-wrap items-center gap-2.5 border-b border-border px-4 py-4 sm:px-5">
          <h1 className="basis-full text-[20px] font-semibold leading-7 tracking-[-0.015em] text-foreground sm:mr-auto sm:basis-auto sm:text-h3" aria-live="polite">{title}</h1>
          <Button variant="secondary" size="sm" className="h-9" onClick={goToday}>Today</Button>
          <div className="flex gap-1">
            <Button variant="secondary" size="icon-sm" className="h-9 w-9" aria-label={`Previous ${viewMode.toLowerCase()}`} onClick={() => step(-1)}>
              <ChevronLeft strokeWidth={1.75} />
            </Button>
            <Button variant="secondary" size="icon-sm" className="h-9 w-9" aria-label={`Next ${viewMode.toLowerCase()}`} onClick={() => step(1)}>
              <ChevronRight strokeWidth={1.75} />
            </Button>
          </div>
          <div role="radiogroup" aria-label="View" className="flex h-9 items-center gap-0.5 rounded-[9px] border border-border bg-surface-2 p-[3px]">
            {(["Day", "Week", "Month"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                role="radio"
                aria-checked={viewMode === mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  "h-7 rounded-[7px] px-3.5 text-label transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  viewMode === mode ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {mode}
              </button>
            ))}
          </div>
          <Button size="icon-sm" className="ml-auto h-9 w-9 sm:ml-0 xl:hidden" aria-label="Create event" onClick={() => openCreate()}>
            <Plus />
          </Button>
        </header>

        {showSkeleton ? (
          <div className="space-y-3 p-5">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-[480px] w-full rounded-lg" />
          </div>
        ) : viewMode === "Month" ? (
          <motion.div key="month" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }} className="overflow-x-auto">
            <div className="min-w-[640px]">
              <div className="grid grid-cols-7 border-b border-border">
                {WEEKDAY_NAMES.map((d) => <div key={d} className="py-2.5 text-center text-caption font-semibold text-muted-foreground">{d}</div>)}
              </div>
              <div className="grid grid-cols-7">
                {monthGrid(selectedDateStr).map((cell) => {
                  const dayEvents = (eventsByDay.get(cell.dateStr) ?? []).sort((a, b) => a.time.localeCompare(b.time));
                  const isToday = cell.dateStr === now.dateStr;
                  return (
                    <div
                      key={cell.dateStr}
                      onClick={() => setSelectedDateStr(cell.dateStr)}
                      onDoubleClick={() => openCreate(cell.dateStr)}
                      className={cn(
                        "min-h-[112px] cursor-pointer space-y-1 border-b border-r border-border p-1.5 transition-colors hover:bg-surface-2/60 [&:nth-child(7n)]:border-r-0",
                        !cell.inMonth && "bg-surface-2/50"
                      )}
                    >
                      <span
                        className={cn(
                          "inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-caption font-semibold tabular",
                          isToday ? "bg-primary text-primary-foreground" : cell.inMonth ? "text-foreground" : "text-subtle"
                        )}
                      >
                        {cell.day}
                      </span>
                      {dayEvents.slice(0, 3).map((event) => (
                        <div key={event.id} className="h-6">
                          <EventBlock event={event} compact onOpen={() => setSelectedEvent(event)} />
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDateStr(cell.dateStr);
                            setViewMode("Day");
                          }}
                          className="px-1 text-micro font-semibold text-muted-foreground hover:text-foreground"
                        >
                          +{dayEvents.length - 3} more
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div key={viewMode} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }} className="overflow-x-auto">
            <div className={cn(viewMode === "Week" && "min-w-[720px]")}>
              {/* Day heads */}
              <div className="grid border-b border-border" style={{ gridTemplateColumns: `60px repeat(${visibleDays.length}, minmax(0, 1fr))` }}>
                <div className="border-r border-border" />
                {visibleDays.map((dateStr) => {
                  const date = parseDate(dateStr);
                  const isToday = dateStr === now.dateStr;
                  return (
                    <button
                      key={dateStr}
                      type="button"
                      onClick={() => {
                        setSelectedDateStr(dateStr);
                        if (viewMode === "Week") setViewMode("Day");
                      }}
                      className="flex flex-col items-center gap-0.5 border-r border-border py-2 last:border-r-0 hover:bg-surface-2/60"
                    >
                      <span className={cn("text-micro font-semibold", isToday ? "text-primary-text" : "text-muted-foreground")}>
                        {date.toLocaleDateString("en-US", { weekday: "short" })}
                      </span>
                      <span
                        className={cn(
                          "flex h-7 min-w-7 items-center justify-center rounded-full px-1 text-[17px] font-semibold tabular",
                          isToday ? "bg-primary text-primary-foreground" : "text-foreground"
                        )}
                      >
                        {date.getDate()}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Time grid */}
              <div ref={scrollRef} className="max-h-[640px] overflow-y-auto">
                <div className="relative grid" style={{ gridTemplateColumns: `60px repeat(${visibleDays.length}, minmax(0, 1fr))`, height: hourMarks.length * HOUR_HEIGHT }}>
                  <div className="relative border-r border-border">
                    {hourMarks.map((m, i) => (
                      <span key={m} className="absolute left-3 text-micro text-subtle tabular" style={{ top: i * HOUR_HEIGHT + 4 }}>
                        {minutesToTime(m)}
                      </span>
                    ))}
                  </div>
                  {visibleDays.map((dateStr) => {
                    const date = parseDate(dateStr);
                    const weekend = date.getDay() === 0 || date.getDay() === 6;
                    const isToday = dateStr === now.dateStr;
                    return (
                      <div
                        key={dateStr}
                        className={cn("relative border-r border-border last:border-r-0", weekend && "bg-surface-2/50")}
                        onDoubleClick={(e) => openCreate(dateStr, slotFromClick(e))}
                        title="Double-click to add an event"
                      >
                        {hourMarks.map((m, i) => (
                          <div key={m} className="absolute inset-x-0 border-t border-border" style={{ top: i * HOUR_HEIGHT }} aria-hidden="true" />
                        ))}
                        {layoutDay(eventsByDay.get(dateStr) ?? []).map(({ event, start, end, lane, lanes }) => (
                          <div
                            key={event.id}
                            className="absolute p-[3px]"
                            style={{
                              top: ((start - gridStart) / 60) * HOUR_HEIGHT,
                              height: Math.max(26, ((end - start) / 60) * HOUR_HEIGHT),
                              left: `${(lane / lanes) * 100}%`,
                              width: `${100 / lanes}%`,
                            }}
                          >
                            <EventBlock event={event} compact={end - start < 45} onOpen={() => setSelectedEvent(event)} />
                          </div>
                        ))}
                        {isToday && now.minutes >= gridStart && now.minutes <= gridEnd && (
                          <div
                            className="pointer-events-none absolute inset-x-0 z-10 flex items-center"
                            style={{ top: ((now.minutes - gridStart) / 60) * HOUR_HEIGHT }}
                            aria-label={`Now, ${minutesToTime(now.minutes)}`}
                          >
                            <span className="-ml-1 h-2.5 w-2.5 rounded-full bg-destructive" />
                            <span className="h-0.5 flex-1 bg-destructive" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </section>

      <EventDetailDialog
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onEdit={openEdit}
        onDelete={(event) => {
          setSelectedEvent(null);
          setDeleteTarget(event);
        }}
      />
      <EventFormDialog
        open={formOpen}
        editingId={editingId}
        initial={draft}
        saving={isSaving}
        onClose={() => setFormOpen(false)}
        onSave={handleSaveEvent}
      />
      <DeleteConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && void handleDeleteEvent(deleteTarget)}
        title="Delete event?"
        itemName={deleteTarget?.title}
        description="It will be removed from everyone's calendar."
      />
    </div>
  );
}

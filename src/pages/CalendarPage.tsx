import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus, Clock } from "lucide-react";

const daysOfWeek = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const calendarDays = [
  { day: 28, prev: true }, { day: 29, prev: true }, { day: 30, prev: true },
  ...Array.from({ length: 31 }, (_, i) => ({ day: i + 1, prev: false })),
];

const events = [
  { title: "Design System Sync", time: "10:00 AM - 11:00 AM", color: "bg-info" },
  { title: "Sprint Planning", time: "2:00 PM - 3:30 PM", color: "bg-primary" },
  { title: "1:1 with Manager", time: "4:00 PM - 4:30 PM", color: "bg-success" },
];

const weekEvents = [
  { day: "Mon", events: [{ title: "Team Standup", time: "9:00", duration: 1, color: "bg-primary" }] },
  { day: "Tue", events: [{ title: "Design Review", time: "10:00", duration: 2, color: "bg-info" }, { title: "Lunch & Learn", time: "12:00", duration: 1, color: "bg-success" }] },
  { day: "Wed", events: [{ title: "Sprint Planning", time: "14:00", duration: 2, color: "bg-warning" }] },
  { day: "Thu", events: [{ title: "Client Call", time: "11:00", duration: 1, color: "bg-destructive" }] },
  { day: "Fri", events: [{ title: "Demo Day", time: "15:00", duration: 2, color: "bg-violet-500" }] },
  { day: "Sat", events: [] },
  { day: "Sun", events: [] },
];

const hours = Array.from({ length: 10 }, (_, i) => `${i + 8}:00`);

export default function CalendarPage() {
  const [selectedDay, setSelectedDay] = useState(24);

  return (
    <div className="flex flex-col lg:flex-row h-full overflow-hidden">
      {/* Sidebar */}
      <aside className="w-full lg:w-72 border-b lg:border-b-0 lg:border-r border-border bg-card flex flex-col shrink-0 p-6 overflow-y-auto">
        <motion.button
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
                onClick={() => !d.prev && setSelectedDay(d.day)}
                className={`py-1.5 rounded cursor-pointer transition-all ${
                  d.prev
                    ? "text-muted-foreground/30"
                    : d.day === selectedDay
                    ? "bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center mx-auto shadow-primary-glow"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                {d.day}
              </span>
            ))}
          </div>
        </div>

        {/* Upcoming Events */}
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-1">Upcoming</h3>
          <div className="space-y-3">
            {events.map((event, i) => (
              <motion.div
                key={event.title}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="group flex items-start gap-3 p-2 rounded-xl hover:bg-muted transition-colors cursor-pointer"
              >
                <div className={`w-1 h-full min-h-[2.5rem] ${event.color} rounded-full`} />
                <div>
                  <h4 className="text-sm font-medium text-foreground">{event.title}</h4>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Clock className="h-3 w-3" /> {event.time}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Calendar Area */}
      <main className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Week of Oct 23 - 29, 2023</h1>
          <div className="flex bg-muted rounded-xl p-1">
            {["Day", "Week", "Month"].map((v, i) => (
              <button
                key={v}
                className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
                  i === 1 ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Week Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="border border-border rounded-2xl overflow-hidden bg-card"
        >
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-border">
            {weekEvents.map((d, i) => (
              <div
                key={d.day}
                className={`text-center py-3 text-sm font-medium border-r border-border last:border-r-0 ${
                  i === 1 ? "text-primary bg-primary/5" : "text-muted-foreground"
                }`}
              >
                {d.day}
              </div>
            ))}
          </div>

          {/* Time grid */}
          <div className="relative" style={{ height: "500px" }}>
            {/* Hour lines */}
            {hours.map((h, i) => (
              <div key={h} className="absolute w-full border-t border-border/50 text-[10px] text-muted-foreground pl-2" style={{ top: `${i * 50}px` }}>
                {h}
              </div>
            ))}

            {/* Events overlay */}
            <div className="grid grid-cols-7 h-full absolute inset-0">
              {weekEvents.map((day) => (
                <div key={day.day} className="relative border-r border-border/50 last:border-r-0">
                  {day.events.map((ev, ei) => {
                    const startHour = parseInt(ev.time) - 8;
                    return (
                      <motion.div
                        key={ei}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 + ei * 0.1 }}
                        className={`absolute mx-1 ${ev.color} text-primary-foreground rounded-lg p-2 text-xs font-medium cursor-pointer hover:opacity-90 transition-opacity`}
                        style={{
                          top: `${startHour * 50}px`,
                          height: `${ev.duration * 50 - 4}px`,
                          left: "4px",
                          right: "4px",
                        }}
                      >
                        {ev.title}
                      </motion.div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

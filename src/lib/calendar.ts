// Date helpers for the calendar. Dates are local "YYYY-MM-DD" strings, times are "HH:MM".

export interface CalendarEvent {
  id: string;
  title: string;
  time: string;
  duration: number;
  color: string;
  description?: string | null;
  dateStr: string;
}

export const EVENT_COLORS = [
  { value: "bg-primary", label: "Blue" },
  { value: "bg-info", label: "Teal" },
  { value: "bg-success", label: "Green" },
  { value: "bg-warning", label: "Amber" },
  { value: "bg-destructive", label: "Red" },
  { value: "bg-violet", label: "Purple" },
] as const;

export const DURATIONS = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

/** 06:00 – 21:30 in half-hour steps. */
export const TIME_OPTIONS = Array.from({ length: 32 }, (_, i) => {
  const minutes = 6 * 60 + i * 30;
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
});

export const toDateStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const todayStr = () => toDateStr(new Date());

export const parseDate = (dateStr: string) => {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const addDays = (dateStr: string, days: number) => {
  const d = parseDate(dateStr);
  d.setDate(d.getDate() + days);
  return toDateStr(d);
};

export const addMonths = (dateStr: string, months: number) => {
  const d = parseDate(dateStr);
  return toDateStr(new Date(d.getFullYear(), d.getMonth() + months, 1));
};

/** Accepts legacy values (ISO timestamps, "2026-11-10T00:00:00") and returns YYYY-MM-DD. */
export const normalizeDateStr = (value: string) => (/^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0, 10) : toDateStr(new Date(value)));

export const timeToMinutes = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

export const minutesToTime = (minutes: number) =>
  `${String(Math.floor(minutes / 60) % 24).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

export const formatDuration = (hours: number) =>
  hours < 1 ? `${Math.round(hours * 60)} min` : `${Number.isInteger(hours) ? hours : hours.toFixed(1)} hr`;

/** Monday-first week containing the date. */
export function weekOf(dateStr: string) {
  const d = parseDate(dateStr);
  const offset = (d.getDay() + 6) % 7;
  const monday = toDateStr(new Date(d.getFullYear(), d.getMonth(), d.getDate() - offset));
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

/** Monday-first month grid (always whole weeks). */
export function monthGrid(dateStr: string) {
  const d = parseDate(dateStr);
  const first = new Date(d.getFullYear(), d.getMonth(), 1);
  const start = new Date(first);
  start.setDate(1 - ((first.getDay() + 6) % 7));
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  const cells = Math.ceil((((first.getDay() + 6) % 7) + last.getDate()) / 7) * 7;
  return Array.from({ length: cells }, (_, i) => {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    return { dateStr: toDateStr(day), day: day.getDate(), inMonth: day.getMonth() === d.getMonth() };
  });
}

export interface PositionedEvent {
  event: CalendarEvent;
  start: number;
  end: number;
  /** Side-by-side slot when events overlap. */
  lane: number;
  lanes: number;
}

/** Splits overlapping events into lanes so none of them hides another. */
export function layoutDay(events: CalendarEvent[]): PositionedEvent[] {
  const sorted = [...events]
    .map((event) => {
      const start = timeToMinutes(event.time);
      return { event, start, end: start + Math.max(15, Number(event.duration || 1) * 60) };
    })
    .sort((a, b) => a.start - b.start || b.end - a.end);

  const result: PositionedEvent[] = [];
  let cluster: PositionedEvent[] = [];
  let clusterEnd = -1;

  const flush = () => {
    const lanes = Math.max(1, ...cluster.map((item) => item.lane + 1));
    cluster.forEach((item) => result.push({ ...item, lanes }));
    cluster = [];
  };

  for (const item of sorted) {
    if (item.start >= clusterEnd && cluster.length) flush();
    const laneEnds: number[] = [];
    cluster.forEach((c) => { laneEnds[c.lane] = Math.max(laneEnds[c.lane] ?? 0, c.end); });
    let lane = laneEnds.findIndex((end) => end <= item.start);
    if (lane === -1) lane = laneEnds.length;
    cluster.push({ ...item, lane, lanes: 1 });
    clusterEnd = Math.max(clusterEnd, item.end);
  }
  if (cluster.length) flush();
  return result;
}

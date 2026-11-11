import { useEffect, useState } from "react";
import { CalendarDays, Check, Clock, Info, Pencil, Plus, Trash2, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DURATIONS, EVENT_COLORS, TIME_OPTIONS, formatDuration, minutesToTime, parseDate, timeToMinutes, type CalendarEvent,
} from "@/lib/calendar";
import { toneClasses, toneFromClass } from "@/lib/tones";
import { cn } from "@/lib/utils";

interface EventDetailDialogProps {
  event: CalendarEvent | null;
  onClose: () => void;
  onEdit: (event: CalendarEvent) => void;
  onDelete: (event: CalendarEvent) => void;
}

export function EventDetailDialog({ event, onClose, onEdit, onDelete }: EventDetailDialogProps) {
  const tone = toneClasses[toneFromClass(event?.color)];
  const start = event ? timeToMinutes(event.time) : 0;
  const end = event ? start + Math.round(Number(event.duration || 1) * 60) : 0;

  return (
    <Dialog open={!!event} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[440px] gap-0 overflow-hidden rounded-2xl p-0 [&>button:last-child]:hidden">
        {event && (
          <>
            <div className={cn("h-1.5", tone.solid)} aria-hidden="true" />
            <div className="space-y-[18px] p-6">
              <div className="flex items-start gap-3">
                <DialogTitle className="flex-1 text-[22px] font-semibold leading-7 tracking-[-0.015em]">{event.title}</DialogTitle>
                <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close">
                  <X strokeWidth={1.75} />
                </Button>
              </div>
              <DialogDescription asChild>
                <div className="space-y-3.5 text-small text-foreground">
                  <p className="flex gap-3">
                    <Clock className="h-[18px] w-[18px] shrink-0 text-muted-foreground" strokeWidth={1.75} />
                    <span className="tabular">
                      {parseDate(event.dateStr).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                      {" · "}{event.time} – {minutesToTime(end)} ({formatDuration(Number(event.duration || 1))})
                    </span>
                  </p>
                  {event.description && (
                    <p className="flex gap-3">
                      <Info className="h-[18px] w-[18px] shrink-0 text-muted-foreground" strokeWidth={1.75} />
                      <span className="whitespace-pre-line">{event.description}</span>
                    </p>
                  )}
                </div>
              </DialogDescription>
              <div className="flex items-center gap-2 pt-2">
                <Button className="bg-destructive-soft text-destructive shadow-none hover:bg-destructive/15" onClick={() => onDelete(event)}>
                  <Trash2 strokeWidth={1.75} /> Delete
                </Button>
                <div className="flex-1" />
                <Button variant="secondary" onClick={onClose}>Close</Button>
                <Button onClick={() => onEdit(event)}>
                  <Pencil strokeWidth={1.75} /> Edit Event
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export interface EventDraft {
  title: string;
  dateStr: string;
  time: string;
  duration: number;
  color: string;
  description: string;
}

interface EventFormDialogProps {
  open: boolean;
  /** Present when editing an existing event. */
  editingId: string | null;
  initial: EventDraft;
  saving: boolean;
  onClose: () => void;
  onSave: (draft: EventDraft) => void;
}

export function EventFormDialog({ open, editingId, initial, saving, onClose, onSave }: EventFormDialogProps) {
  const [draft, setDraft] = useState(initial);

  useEffect(() => {
    if (open) setDraft(initial);
  }, [open, initial]);

  const update = <K extends keyof EventDraft>(key: K, value: EventDraft[K]) => setDraft((d) => ({ ...d, [key]: value }));
  // Keep times that aren't on the half-hour grid (older events) selectable.
  const timeOptions = TIME_OPTIONS.includes(draft.time) ? TIME_OPTIONS : [...TIME_OPTIONS, draft.time].sort();

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-[480px] gap-5 rounded-2xl p-6 [&>button:last-child]:hidden">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-primary-soft text-primary">
            <CalendarDays className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <div className="flex-1 space-y-1">
            <DialogTitle className="text-[18px] font-semibold leading-6">{editingId ? "Edit Event" : "New Event"}</DialogTitle>
            <DialogDescription className="text-small">Events show on everyone's calendar in this workspace.</DialogDescription>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close">
            <X strokeWidth={1.75} />
          </Button>
        </div>

        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (draft.title.trim()) onSave(draft);
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="event-title">Event Title</Label>
            <Input id="event-title" value={draft.title} onChange={(e) => update("title", e.target.value)} placeholder="e.g., Marketing Sync" autoFocus required />
          </div>

          <div className="grid grid-cols-[minmax(0,1fr)_130px] gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="event-date">Date</Label>
              <Input id="event-date" type="date" value={draft.dateStr} onChange={(e) => e.target.value && update("dateStr", e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="event-time">Time</Label>
              <Select value={draft.time} onValueChange={(value) => update("time", value)}>
                <SelectTrigger id="event-time" className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-64">
                  {timeOptions.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="event-duration">Duration (hours)</Label>
            <Select value={String(draft.duration)} onValueChange={(value) => update("duration", Number(value))}>
              <SelectTrigger id="event-duration" className="h-10" aria-describedby="duration-hint"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(DURATIONS.includes(draft.duration) ? DURATIONS : [...DURATIONS, draft.duration].sort((a, b) => a - b)).map((d) => (
                  <SelectItem key={d} value={String(d)}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p id="duration-hint" className="text-caption font-normal text-muted-foreground">From 0.5 to 5 hours, in steps of 0.5.</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="event-description">Description <span className="font-normal text-subtle">(optional)</span></Label>
            <textarea
              id="event-description"
              value={draft.description}
              onChange={(e) => update("description", e.target.value)}
              rows={2}
              placeholder="Agenda, links or anything people should bring"
              className="w-full resize-none rounded-lg border border-input bg-card px-3 py-2 text-small text-foreground shadow-xs outline-none transition-[border-color,box-shadow] placeholder:text-subtle focus:border-primary focus:ring-[3px] focus:ring-primary/15"
            />
          </div>

          <fieldset className="space-y-2">
            <legend className="text-label text-foreground">Color</legend>
            <div className="flex gap-2.5" role="radiogroup" aria-label="Event color">
              {EVENT_COLORS.map((color) => {
                const tone = toneClasses[toneFromClass(color.value)];
                const selected = toneFromClass(draft.color) === toneFromClass(color.value);
                return (
                  <button
                    key={color.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    aria-label={color.label}
                    onClick={() => update("color", color.value)}
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full text-white transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                      tone.solid,
                      selected && cn("ring-2 ring-offset-2 ring-offset-card", tone.ring)
                    )}
                  >
                    {selected && <Check className="h-4 w-4" strokeWidth={3} />}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={!draft.title.trim()} loading={saving}>
              {!saving && (editingId ? <Check /> : <Plus />)}
              {editingId ? "Save Changes" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

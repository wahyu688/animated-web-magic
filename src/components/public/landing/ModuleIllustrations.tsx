import {
  CircleCheck, Clock, Eye, MessageSquare, Paperclip, Pencil, ShieldCheck, TriangleAlert, Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Static product mock-ups for the Landing "The product" section. Purely decorative.

type Tone = "primary" | "success" | "warning" | "info" | "violet";

const avatarTones: Record<Tone, string> = {
  primary: "bg-primary-soft text-primary-text",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  info: "bg-info-soft text-info",
  violet: "bg-violet-soft text-violet",
};

function MiniAvatar({ initials, tone, size = 22 }: { initials: string; tone: Tone; size?: number }) {
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full text-[9px] font-semibold", avatarTones[tone])}
      style={{ width: size, height: size }}
    >
      {initials}
    </span>
  );
}

const tasks = [
  {
    column: "To Do",
    dot: "bg-amber",
    tag: { label: "Marketing", variant: "warning" as const },
    high: true,
    title: "Write launch post for AI workflows",
    avatar: { initials: "RR", tone: "warning" as Tone },
    comments: 4,
    files: 2,
    due: "Nov 13",
  },
  {
    column: "In Progress",
    dot: "bg-primary",
    tag: { label: "Backend", variant: "info" as const },
    high: true,
    title: "Sync Financial entries to dashboard charts",
    progress: { done: 3, total: 5, bar: "bg-primary" },
    avatar: { initials: "WB", tone: "primary" as Tone },
    comments: 6,
    files: 1,
    due: "Nov 12",
  },
  {
    column: "Done",
    dot: "bg-success",
    tag: { label: "Backend", variant: "info" as const },
    high: false,
    title: "Row Level Security for team table",
    progress: { done: 4, total: 4, bar: "bg-success" },
    avatar: { initials: "WB", tone: "primary" as Tone },
    comments: 2,
    due: "Nov 4",
  },
];

export function BoardIllustration() {
  return (
    <div className="grid gap-2.5 rounded-xl bg-surface-2 p-3.5 sm:grid-cols-3" aria-hidden="true">
      {tasks.map((task) => (
        <div key={task.column} className="space-y-2">
          <p className="flex items-center gap-1.5 text-caption font-semibold text-foreground">
            <span className={cn("h-[7px] w-[7px] rounded-full", task.dot)} />
            {task.column}
          </p>
          <div className="space-y-2.5 rounded-[10px] border border-border bg-card p-3 shadow-xs">
            <div className="flex gap-1.5">
              <Badge variant={task.tag.variant} size="sm">{task.tag.label}</Badge>
              {task.high && (
                <Badge variant="destructive" size="sm">
                  <TriangleAlert strokeWidth={2} /> High
                </Badge>
              )}
            </div>
            <p className="text-sm font-semibold leading-5 text-foreground">{task.title}</p>
            {task.progress && (
              <div className="flex items-center gap-2 text-caption font-normal text-muted-foreground">
                <CircleCheck className="h-3.5 w-3.5" strokeWidth={1.75} />
                {task.progress.done}/{task.progress.total}
                <span className="h-1 w-24 overflow-hidden rounded-full bg-track">
                  <span
                    className={cn("block h-full rounded-full", task.progress.bar)}
                    style={{ width: `${(task.progress.done / task.progress.total) * 100}%` }}
                  />
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 text-caption font-normal text-muted-foreground">
              <MiniAvatar {...task.avatar} />
              <span className="flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" strokeWidth={1.75} />{task.comments}</span>
              {task.files && (
                <span className="flex items-center gap-1"><Paperclip className="h-3.5 w-3.5" strokeWidth={1.75} />{task.files}</span>
              )}
              <span className="ml-auto flex items-center gap-1"><Clock className="h-3.5 w-3.5" strokeWidth={1.75} />{task.due}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

const eventTones = {
  primary: "border-primary bg-primary-soft text-primary-text",
  success: "border-success bg-success-soft text-success",
  warning: "border-amber bg-warning-soft text-warning",
  violet: "border-violet bg-violet-soft text-violet",
};

const events = [
  { title: "Marketing Sync", time: "09:00 · 1 hr", tone: "primary" as const },
  { title: "Hiring: COO interview", time: "11:00 · 1 hr", tone: "success" as const },
  { title: "Investor prep", time: "14:00 · 2 hr", tone: "warning" as const },
  { title: "Sprint review", time: "16:00 · 1 hr", tone: "violet" as const },
];

export function CalendarIllustration() {
  return (
    <div className="space-y-2 rounded-xl bg-surface-2 p-3.5" aria-hidden="true">
      {events.map((event) => (
        <div key={event.title} className={cn("rounded-lg border-l-[3px] px-3 py-2", eventTones[event.tone])}>
          <p className="text-[13px] font-semibold leading-[18px]">{event.title}</p>
          <p className="text-micro opacity-80">{event.time}</p>
        </div>
      ))}
    </div>
  );
}

export function FinancialIllustration() {
  return (
    <div className="rounded-xl bg-surface-2 p-4" aria-hidden="true">
      <p className="text-label text-foreground">Subscription Revenue</p>
      <div className="mt-2 flex h-9 items-center gap-2.5 rounded-lg border border-border-strong bg-card px-3 text-[15px] text-foreground">
        <span className="text-subtle">$</span>120,000
      </div>
      <div className="my-2.5 flex items-center gap-2 text-caption font-semibold text-primary-text">
        <span className="h-px flex-1 bg-border" />
        <Zap className="h-3.5 w-3.5" strokeWidth={1.75} /> Synced
        <span className="h-px flex-1 bg-border" />
      </div>
      <div className="flex items-end justify-between rounded-[10px] border border-border bg-card px-3 py-2.5">
        <div>
          <p className="text-micro text-muted-foreground">Total Revenue</p>
          <p className="text-[17px] font-bold leading-6 tracking-[-0.01em] text-foreground">$174,000</p>
        </div>
        <svg viewBox="0 0 80 24" className="h-6 w-20 text-success" fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M1 22c8-2 12-4 18-3s10 2 16-1 10-6 16-6 10-4 13-6 9-4 15-5" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}

const roles = [
  { initials: "WB", name: "Wahyu A. Barmawi", tone: "primary" as Tone, role: "Admin", variant: "default" as const, Icon: ShieldCheck },
  { initials: "RR", name: "Rif'at Rifqi", tone: "warning" as Tone, role: "Editor", variant: "info" as const, Icon: Pencil },
  { initials: "SG", name: "Samuel G. Lowfrint", tone: "info" as Tone, role: "Viewer", variant: "neutral" as const, Icon: Eye },
];

export function TeamIllustration() {
  return (
    <div className="space-y-2 rounded-xl bg-surface-2 p-3.5" aria-hidden="true">
      {roles.map((member) => (
        <div key={member.name} className="flex items-center gap-2.5 rounded-[10px] border border-border bg-card px-2.5 py-2">
          <MiniAvatar initials={member.initials} tone={member.tone} size={26} />
          <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-foreground">{member.name}</span>
          <Badge variant={member.variant} size="sm">
            <member.Icon strokeWidth={2} /> {member.role}
          </Badge>
        </div>
      ))}
    </div>
  );
}

export function ActivityIllustration() {
  return (
    <div className="space-y-2 rounded-xl bg-surface-2 p-3.5" aria-hidden="true">
      <div className="flex items-center gap-2.5 rounded-[10px] border border-border bg-card px-2.5 py-2 text-[13px] text-muted-foreground">
        <MiniAvatar initials="RR" tone="warning" size={26} />
        <span><b className="font-semibold text-foreground">Rif'at</b> mentioned you</span>
      </div>
      <div className="flex items-center gap-2.5 rounded-[10px] border border-border bg-card px-2.5 py-2 text-[13px] text-muted-foreground">
        <MiniAvatar initials="VH" tone="success" size={26} />
        <span><b className="font-semibold text-foreground">Valerian</b> moved a task to Review</span>
      </div>
      <div className="flex items-center gap-2.5 rounded-[10px] border border-border bg-card px-2.5 py-2 text-[13px] text-muted-foreground">
        <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-primary-soft text-primary-text">
          <Zap className="h-3.5 w-3.5" strokeWidth={2} />
        </span>
        <span><b className="font-semibold text-foreground">October report</b> synced</span>
      </div>
    </div>
  );
}

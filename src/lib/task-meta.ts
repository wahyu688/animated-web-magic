import { toneFromClass, type Tone } from "@/lib/tones";

export const TASK_COLUMNS: { id: string; title: string; tone: Tone }[] = [
  { id: "backlog", title: "Backlog", tone: "neutral" },
  { id: "todo", title: "To Do", tone: "warning" },
  { id: "progress", title: "In Progress", tone: "primary" },
  { id: "review", title: "Review", tone: "violet" },
  { id: "done", title: "Done", tone: "success" },
];

/** Tags offered in the task editor. tag_color keeps the legacy class string the DB already stores. */
export const TASK_TAGS: { name: string; tone: Tone; tagColor: string }[] = [
  { name: "Design", tone: "violet", tagColor: "bg-violet/10 text-violet" },
  { name: "Backend", tone: "info", tagColor: "bg-info/10 text-info" },
  { name: "Marketing", tone: "warning", tagColor: "bg-warning/10 text-warning" },
  { name: "Bug", tone: "danger", tagColor: "bg-destructive/10 text-destructive" },
  { name: "Research", tone: "success", tagColor: "bg-success/10 text-success" },
  { name: "Draft", tone: "neutral", tagColor: "bg-secondary text-secondary-foreground" },
];

export const TASK_PRIORITIES = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
] as const;

export type TaskPriority = (typeof TASK_PRIORITIES)[number]["value"];

export function tagTone(tag: string | null | undefined, tagColor?: string | null): Tone {
  const known = TASK_TAGS.find((t) => t.name.toLowerCase() === (tag ?? "").toLowerCase());
  if (known) return known.tone;
  return toneFromClass(tagColor, "neutral");
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** due_date is free text in the DB: new tasks store YYYY-MM-DD, older rows may hold "Nov 12". */
export function formatDue(due: string | null | undefined, style: "short" | "long" = "short") {
  if (!due) return null;
  if (!ISO_DATE.test(due)) return due;
  const [y, m, d] = due.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return style === "long"
    ? date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })
    : date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function initialsOf(name: string | null | undefined) {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

const AVATAR_TONES: Tone[] = ["primary", "success", "warning", "violet", "info"];

/** Stable soft color per person so the same teammate always gets the same avatar tint. */
export function avatarTone(key: string | null | undefined): Tone {
  if (!key) return "neutral";
  let hash = 0;
  for (const ch of key) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_TONES[hash % AVATAR_TONES.length];
}

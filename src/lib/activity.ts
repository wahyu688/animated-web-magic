// Helpers for the Activity feed (rows from the notifications table).

/** Fired on window after this tab changes read state, so the sidebar badge updates immediately. */
export const NOTIFICATIONS_CHANGED_EVENT = "nexusflow:notifications-changed";

export function announceNotificationsChanged() {
  window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT));
}

export type ActivityCategory = "mention" | "task" | "system";

/** mention/invite → Mentions; upload/commit → task updates; everything else → system. */
export function categoryOf(type: string | null | undefined): ActivityCategory {
  if (type === "mention" || type === "invite") return "mention";
  if (type === "upload" || type === "commit") return "task";
  return "system";
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function relativeTime(iso: string | null | undefined, now = new Date()) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const diff = now.getTime() - date.getTime();
  if (diff < MINUTE) return "Just now";
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}m ago`;
  if (sameDay(date, now)) return `${Math.floor(diff / HOUR)}h ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function dayGroup(iso: string | null | undefined, now = new Date()) {
  if (!iso) return "Earlier";
  const date = new Date(iso);
  if (sameDay(date, now)) return "Today";
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay(date, yesterday)) return "Yesterday";
  return date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

/** Where a notification's "View" link goes, guessed from what was logged. */
export function destinationOf(action: string, type: string | null | undefined): { path: string; label: string } | null {
  const text = action.toLowerCase();
  if (/task|moved|board/.test(text)) return { path: "/kanban", label: "View task" };
  if (/invit|member|role|team/.test(text)) return { path: "/team", label: "Open team" };
  if (/report|financial|synced/.test(text)) return { path: "/financial", label: "Open financial" };
  // Calendar logs use type "invite" ("scheduled a new event"), so check it after the team wording.
  if (/event|schedule|calendar/.test(text) || type === "invite") return { path: "/calendar", label: "Open calendar" };
  return null;
}

import { Eye, Pencil, ShieldCheck, type LucideIcon } from "lucide-react";

export type UiRole = "Admin" | "Editor" | "Viewer";

export const ROLE_OPTIONS: { role: UiRole; icon: LucideIcon; description: string }[] = [
  { role: "Admin", icon: ShieldCheck, description: "Full access, including billing and members." },
  { role: "Editor", icon: Pencil, description: "Create and edit tasks, events and reports." },
  { role: "Viewer", icon: Eye, description: "Read-only access to the workspace." },
];

/** company_members.role → UI label. Owners show as Admin. */
export const toUiRole = (role?: string | null): UiRole => {
  if (role === "owner" || role === "admin") return "Admin";
  if (role === "editor") return "Editor";
  return "Viewer";
};

export const toDbRole = (role: UiRole) => (role === "Admin" ? "admin" : role === "Editor" ? "editor" : "member");

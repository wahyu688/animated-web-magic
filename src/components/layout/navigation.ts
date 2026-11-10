import {
  Activity, BarChart3, Calendar, DollarSign, Home, Settings, SquareKanban, Users, type LucideIcon,
} from "lucide-react";

export interface NavItem {
  icon: LucideIcon;
  label: string;
  path: string;
}

export const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: "Overview",
    items: [
      { icon: Home, label: "Dashboard", path: "/dashboard" },
      { icon: BarChart3, label: "Analytics", path: "/analytics" },
    ],
  },
  {
    label: "Work",
    items: [
      { icon: SquareKanban, label: "Project Board", path: "/kanban" },
      { icon: Calendar, label: "Calendar", path: "/calendar" },
      { icon: Activity, label: "Activity", path: "/activity" },
    ],
  },
  {
    label: "Business",
    items: [
      { icon: DollarSign, label: "Financial", path: "/financial" },
      { icon: Users, label: "Team", path: "/team" },
    ],
  },
];

export const settingsNavItem: NavItem = { icon: Settings, label: "Settings", path: "/settings" };

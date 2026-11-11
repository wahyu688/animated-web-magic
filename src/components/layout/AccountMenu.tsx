import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { CreditCard, LogOut, Moon, Settings, User } from "lucide-react";
import {
  DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import UserAvatar from "@/components/layout/UserAvatar";

export interface AccountProfile {
  fullName: string;
  email: string;
  initials: string;
  avatarUrl?: string | null;
}

interface AccountMenuContentProps {
  profile: AccountProfile;
  onLogout: () => void;
  onNavigate?: () => void;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
}

/** Dropdown body shared by the topbar account pill and the sidebar user row. */
export default function AccountMenuContent({ profile, onLogout, onNavigate, side = "bottom", align = "end" }: AccountMenuContentProps) {
  const navigate = useNavigate();
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const go = (path: string) => {
    onNavigate?.();
    navigate(path);
  };

  return (
    <DropdownMenuContent side={side} align={align} sideOffset={8} className="w-[260px]">
      <div className="flex items-center gap-2.5 p-2.5">
        <UserAvatar initials={profile.initials} imageUrl={profile.avatarUrl} size={34} />
        <div className="min-w-0">
          <p className="truncate text-label text-foreground">{profile.fullName}</p>
          <p className="truncate text-caption text-muted-foreground">{profile.email}</p>
        </div>
      </div>
      <DropdownMenuSeparator />
      <DropdownMenuItem onSelect={() => go("/settings?tab=general")}>
        <User strokeWidth={1.75} /> Profile
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={() => go("/settings?tab=billing")}>
        <CreditCard strokeWidth={1.75} /> Billing
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={() => go("/settings")}>
        <Settings strokeWidth={1.75} /> Settings
      </DropdownMenuItem>
      <DropdownMenuItem
        onSelect={(event) => {
          // Keep the menu open so the switch visibly flips.
          event.preventDefault();
          setTheme(isDark ? "light" : "dark");
        }}
      >
        <Moon strokeWidth={1.75} />
        <span className="flex-1">Dark mode</span>
        <Switch checked={isDark} tabIndex={-1} aria-hidden="true" className="pointer-events-none" />
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onSelect={onLogout} className="text-destructive focus:text-destructive [&_svg]:text-destructive">
        <LogOut strokeWidth={1.75} /> Log out
      </DropdownMenuItem>
    </DropdownMenuContent>
  );
}

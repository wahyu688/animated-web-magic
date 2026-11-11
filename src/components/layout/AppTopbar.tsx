import { Link } from "react-router-dom";
import { useTheme } from "next-themes";
import { Bell, ChevronDown, Menu, Moon, Search, Sun } from "lucide-react";
import Logo from "@/components/brand/Logo";
import UserAvatar from "@/components/layout/UserAvatar";
import AccountMenuContent, { type AccountProfile } from "@/components/layout/AccountMenu";
import { DropdownMenu, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface AppTopbarProps {
  profile: AccountProfile;
  firstName: string;
  unreadCount: number;
  onOpenSearch: () => void;
  onOpenMenu: () => void;
  onLogout: () => void;
}

const iconButton =
  "relative flex items-center justify-center rounded-lg text-foreground transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const options = [
    { value: "light", icon: Sun, label: "Light theme" },
    { value: "dark", icon: Moon, label: "Dark theme" },
  ] as const;

  return (
    <div role="radiogroup" aria-label="Theme" className="flex h-9 items-center gap-0.5 rounded-[9px] border border-border bg-surface-2 p-[3px]">
      {options.map(({ value, icon: Icon, label }) => {
        const active = resolvedTheme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            onClick={() => setTheme(value)}
            className={cn(
              "flex h-7 w-11 items-center justify-center rounded-[7px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" strokeWidth={1.75} />
          </button>
        );
      })}
    </div>
  );
}

export default function AppTopbar({ profile, firstName, unreadCount, onOpenSearch, onOpenMenu, onLogout }: AppTopbarProps) {
  const notificationsLabel = unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications";

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-card pl-3 pr-4 lg:px-8">
      {/* Mobile: menu + logo */}
      <button type="button" onClick={onOpenMenu} aria-label="Open menu" className={cn(iconButton, "h-10 w-10 lg:hidden")}>
        <Menu className="h-5 w-5" strokeWidth={1.75} />
      </button>
      <Link to="/dashboard" aria-label="NexusFlow home" className="lg:hidden">
        <Logo size="sm" />
      </Link>

      {/* Desktop search */}
      <button
        type="button"
        onClick={onOpenSearch}
        className="hidden h-[38px] w-full max-w-[380px] items-center gap-2 rounded-lg border border-border-strong bg-card pl-3 pr-2 text-left transition-colors hover:border-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:flex"
      >
        <Search className="h-4 w-4 shrink-0 text-subtle" strokeWidth={1.75} />
        <span className="flex-1 truncate text-small text-subtle">Search tasks, people, events…</span>
        <kbd className="rounded-[5px] border border-border bg-surface-2 px-1.5 py-0.5 font-display text-micro text-muted-foreground">Ctrl K</kbd>
      </button>

      <div className="flex-1" />

      {/* Mobile search */}
      <button type="button" onClick={onOpenSearch} aria-label="Search" className={cn(iconButton, "h-10 w-10 lg:hidden")}>
        <Search className="h-5 w-5" strokeWidth={1.75} />
      </button>

      <div className="hidden lg:block">
        <ThemeToggle />
      </div>

      <Link
        to="/activity"
        aria-label={notificationsLabel}
        className={cn(iconButton, "h-10 w-10 lg:h-[38px] lg:w-[38px] lg:border lg:border-border")}
      >
        <Bell className="h-5 w-5 lg:h-[18px] lg:w-[18px]" strokeWidth={1.75} />
        {unreadCount > 0 && (
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive ring-2 ring-card" />
        )}
      </Link>

      <div className="hidden h-6 w-px bg-border lg:block" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="hidden h-[38px] items-center gap-2 rounded-full border border-border py-[3px] pl-[3px] pr-2 transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:flex"
          >
            <UserAvatar initials={profile.initials} imageUrl={profile.avatarUrl} size={30} />
            <span className="max-w-[120px] truncate text-label text-foreground">{firstName}</span>
            <ChevronDown className="h-4 w-4 text-subtle" strokeWidth={1.75} />
          </button>
        </DropdownMenuTrigger>
        <AccountMenuContent profile={profile} onLogout={onLogout} />
      </DropdownMenu>
    </header>
  );
}

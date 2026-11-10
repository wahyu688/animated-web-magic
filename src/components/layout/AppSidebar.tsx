import { Link, useLocation, useNavigate } from "react-router-dom";
import { Check, ChevronsLeft, ChevronsRight, ChevronsUpDown, Ellipsis, Sparkles, X } from "lucide-react";
import Logo from "@/components/brand/Logo";
import { navGroups, settingsNavItem, type NavItem } from "@/components/layout/navigation";
import UserAvatar from "@/components/layout/UserAvatar";
import AccountMenuContent, { type AccountProfile } from "@/components/layout/AccountMenu";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { WorkspaceSummary } from "@/hooks/use-workspace-summary";
import { cn } from "@/lib/utils";

const TRIAL_LENGTH_DAYS = 14;

interface AppSidebarProps {
  collapsed?: boolean;
  /** Drawer mode: shows a close button instead of the collapse toggle. */
  onClose?: () => void;
  onToggleCollapsed?: () => void;
  onNavigate?: () => void;
  unreadCount: number;
  workspace: WorkspaceSummary | null;
  profile: AccountProfile;
  onLogout: () => void;
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "W";
}

function formatPlan(plan: string | null) {
  if (!plan) return "No active plan";
  return `${plan.charAt(0).toUpperCase()}${plan.slice(1)} plan`;
}

function getTrial(workspace: WorkspaceSummary | null) {
  if (!workspace?.expiresAt) return null;
  if (!["trial", "trialing"].includes(workspace.status ?? "")) return null;

  const expiresAt = new Date(workspace.expiresAt);
  const msLeft = expiresAt.getTime() - Date.now();
  if (Number.isNaN(msLeft) || msLeft <= 0) return null;

  const daysLeft = Math.ceil(msLeft / 86_400_000);
  return {
    daysLeft,
    progress: Math.min(1, Math.max(0, 1 - daysLeft / TRIAL_LENGTH_DAYS)),
    endsOn: expiresAt.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  };
}

export default function AppSidebar({
  collapsed = false,
  onClose,
  onToggleCollapsed,
  onNavigate,
  unreadCount,
  workspace,
  profile,
  onLogout,
}: AppSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const trial = getTrial(workspace);
  const workspaceName = workspace?.name ?? "Workspace";

  const renderNavItem = (item: NavItem) => {
    const isActive = location.pathname.startsWith(item.path);
    const showBadge = item.path === "/activity" && unreadCount > 0;

    const link = (
      <Link
        to={item.path}
        onClick={onNavigate}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "relative flex h-[38px] items-center gap-2.5 rounded-lg text-sm transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          collapsed ? "w-11 justify-center" : "px-2.5",
          isActive
            ? "bg-primary-soft font-semibold text-primary-text"
            : "text-foreground hover:bg-surface-2"
        )}
      >
        <item.icon
          className={cn("h-[18px] w-[18px] shrink-0", isActive ? "text-primary" : "text-muted-foreground")}
          strokeWidth={1.75}
        />
        {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
        {showBadge && !collapsed && (
          <span className="flex h-5 min-w-6 items-center justify-center rounded-full bg-primary px-2 text-caption font-semibold text-primary-foreground tabular">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
        {showBadge && collapsed && (
          <span className="absolute right-2.5 top-2 h-1.5 w-1.5 rounded-full bg-destructive ring-2 ring-card" />
        )}
      </Link>
    );

    if (!collapsed) return <li key={item.path}>{link}</li>;

    return (
      <li key={item.path}>
        <Tooltip>
          <TooltipTrigger asChild>{link}</TooltipTrigger>
          <TooltipContent side="right">
            {item.label}
            {showBadge ? ` (${unreadCount})` : ""}
          </TooltipContent>
        </Tooltip>
      </li>
    );
  };

  return (
    <TooltipProvider delayDuration={150}>
      <div
        className={cn(
          "flex h-full flex-col bg-card",
          collapsed ? "items-center px-3.5 pb-3 pt-3.5" : "px-3 pb-3 pt-3.5"
        )}
      >
        {/* Header */}
        <div className={cn("flex h-10 shrink-0 items-center", collapsed ? "justify-center" : "justify-between pl-1.5 pr-1")}>
          <Link to="/dashboard" onClick={onNavigate} aria-label="NexusFlow home" className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Logo markOnly={collapsed} />
          </Link>
          {!collapsed && onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close menu"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-subtle transition-colors hover:bg-surface-2 hover:text-foreground"
            >
              <X className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </button>
          )}
          {!collapsed && !onClose && onToggleCollapsed && (
            <button
              type="button"
              onClick={onToggleCollapsed}
              aria-label="Collapse sidebar"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-subtle transition-colors hover:bg-surface-2 hover:text-foreground"
            >
              <ChevronsLeft className="h-4 w-4" strokeWidth={1.75} />
            </button>
          )}
        </div>

        {collapsed && onToggleCollapsed && (
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label="Expand sidebar"
            className="mt-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-subtle transition-colors hover:bg-surface-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronsRight className="h-4 w-4" strokeWidth={1.75} />
          </button>
        )}

        {/* Workspace */}
        {!collapsed && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="mt-[18px] flex h-[52px] w-full shrink-0 items-center gap-2.5 rounded-[10px] border border-border bg-surface-2 py-2 pl-2 pr-2.5 text-left transition-colors hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg bg-violet text-caption font-semibold text-white">
                  {getInitials(workspaceName)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-label text-foreground">{workspaceName}</span>
                  <span className="block truncate text-micro text-muted-foreground">{formatPlan(workspace?.plan ?? null)}</span>
                </span>
                <ChevronsUpDown className="h-4 w-4 shrink-0 text-subtle" strokeWidth={1.75} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[223px]">
              <DropdownMenuLabel className="text-micro font-semibold uppercase tracking-wide text-subtle">Workspace</DropdownMenuLabel>
              <DropdownMenuItem className="gap-2">
                <span className="flex-1 truncate">{workspaceName}</span>
                <Check className="h-4 w-4 text-primary" />
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => {
                  onNavigate?.();
                  navigate("/settings?tab=workspace");
                }}
              >
                Workspace settings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Navigation */}
        <nav aria-label="Main" className={cn("mt-3 min-h-0 flex-1 overflow-y-auto", collapsed && "w-full")}>
          {navGroups.map((group, index) => (
            <div key={group.label} className={cn("mt-1", collapsed && index > 0 && "mt-4")}>
              {!collapsed && (
                <p className="mb-1 px-2.5 pb-1.5 pt-3 text-micro font-semibold text-subtle">{group.label}</p>
              )}
              <ul className={cn("space-y-1", collapsed && "flex flex-col items-center")}>
                {group.items.map(renderNavItem)}
              </ul>
            </div>
          ))}
        </nav>

        {/* Trial */}
        {trial && !collapsed && (
          <div className="mb-3.5 shrink-0 space-y-2.5 rounded-[10px] bg-primary-soft p-3.5">
            <p className="flex items-center gap-2 text-label text-primary-text">
              <Sparkles className="h-4 w-4" strokeWidth={1.75} />
              Trial ends in {trial.daysLeft} {trial.daysLeft === 1 ? "day" : "days"}
            </p>
            <div className="h-1.5 overflow-hidden rounded-full bg-track" role="progressbar" aria-valuenow={Math.round(trial.progress * 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Trial used">
              <div className="h-full rounded-full bg-primary" style={{ width: `${trial.progress * 100}%` }} />
            </div>
            <p className="text-caption text-muted-foreground">
              Your {formatPlan(workspace?.plan ?? null).replace(" plan", "")} trial is active until {trial.endsOn}.
            </p>
          </div>
        )}

        {/* Footer */}
        <ul className={cn("shrink-0", collapsed && "flex w-full flex-col items-center")}>
          {renderNavItem(settingsNavItem)}
        </ul>
        <div className={cn("my-1 h-px shrink-0 bg-border", collapsed ? "w-11" : "w-full")} />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Account"
              className={cn(
                "flex shrink-0 items-center gap-2.5 rounded-lg text-left transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                collapsed ? "mt-1 p-1" : "w-full px-1.5 pb-1 pt-2"
              )}
            >
              <UserAvatar initials={profile.initials} size={34} online />
              {!collapsed && (
                <>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-label text-foreground">{profile.fullName}</span>
                    <span className="block truncate text-caption font-normal text-muted-foreground">{profile.email}</span>
                  </span>
                  <Ellipsis className="h-[18px] w-[18px] shrink-0 text-subtle" strokeWidth={1.75} />
                </>
              )}
            </button>
          </DropdownMenuTrigger>
          <AccountMenuContent
            profile={profile}
            onLogout={onLogout}
            onNavigate={onNavigate}
            side={collapsed ? "right" : "top"}
            align={collapsed ? "end" : "start"}
          />
        </DropdownMenu>
      </div>
    </TooltipProvider>
  );
}

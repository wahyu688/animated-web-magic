import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, Navigate, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useCompany } from "@/hooks/use-company";
import { useWorkspaceSummary } from "@/hooks/use-workspace-summary";
import { clearCompanyCache } from "@/lib/company";
import DashboardSkeleton from "../DashboardSkeleton";
import { safeRemoveChannel, withSupabaseTimeout } from "@/lib/supabaseLifecycle";
import { useSupabaseResumeRecovery } from "@/hooks/use-supabase-resume-recovery";
import { useAuth } from "@/contexts/AuthContext";
import AppSidebar from "./AppSidebar";
import AppTopbar from "./AppTopbar";
import CommandPalette from "./CommandPalette";
import Banner from "@/components/feedback/Banner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const COLLAPSED_STORAGE_KEY = "nexusflow:sidebar-collapsed";

function readCollapsed() {
  try {
    return window.localStorage.getItem(COLLAPSED_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    clearCompanyCache();
    navigate("/login");
  };

  // --- STATE PROFIL & NOTIFIKASI ---
  const [profile, setProfile] = useState({ firstName: "Loading...", lastName: "", email: "..." });
  const [unreadCount, setUnreadCount] = useState(0);
  const isMountedRef = useRef(false);
  const { companyId, isCompanyLoading, isCompanyRefreshing, companyError, refreshCompany } = useCompany();
  const { user, isAuthRefreshing } = useAuth();
  const workspace = useWorkspaceSummary(companyId);

  // --- EFFECT UNTUK PROFIL ---
  useEffect(() => {
    isMountedRef.current = true;
    const fetchProfile = async () => {
      try {
        if (user && isMountedRef.current) {
          const { data, error: profileError } = await withSupabaseTimeout(
            supabase.from("user_profiles").select('first_name, last_name').eq('id', user.id).maybeSingle(),
            "layout profile"
          );
          if (profileError) console.error("Profile fetch error:", profileError);

          setProfile({
            firstName: data?.first_name || user.user_metadata?.first_name || "User",
            lastName: data?.last_name || user.user_metadata?.last_name || "",
            email: user.email || ""
          });
        }
      } catch (error) {
        console.warn("Profile fetch timed out or failed:", error);
      }
    };
    fetchProfile();

    return () => {
      isMountedRef.current = false;
    };
  }, [user]);

  // --- EFFECT UNTUK REAL-TIME NOTIFIKASI ---
  const fetchUnreadCount = useCallback(async () => {
    if (!companyId) {
      setUnreadCount(0);
      return;
    }

    const { count, error } = await withSupabaseTimeout(
      supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('unread', true),
      "layout unread notifications"
    );

    if (error) {
      console.error("Unread notification count error:", error);
      return;
    }

    if (isMountedRef.current && count !== null) {
      setUnreadCount(count);
    }
  }, [companyId]);

  const isResumeRecovering = useSupabaseResumeRecovery({
    enabled: Boolean(companyId),
    onRecover: fetchUnreadCount,
  });

  useEffect(() => {
    isMountedRef.current = true;
    if (!companyId) return;
    fetchUnreadCount();

    const channel = supabase
      .channel(`navbar-notifications-realtime:${companyId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `company_id=eq.${companyId}`
        },
        () => {
          setUnreadCount((prev) => prev + 1);
          fetchUnreadCount();
        }
      )
      .subscribe((status, error) => {
        if (status === 'SUBSCRIBED') fetchUnreadCount();
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          console.warn("[navbar realtime] disconnected; unread count will refresh on reconnect/page activity.", { status, error });
        }
      });

    return () => {
      isMountedRef.current = false;
      safeRemoveChannel(channel);
    };
  }, [companyId, fetchUnreadCount]);

  // --- SHELL BEHAVIOUR ---
  useEffect(() => {
    try {
      window.localStorage.setItem(COLLAPSED_STORAGE_KEY, collapsed ? "1" : "0");
    } catch {
      // Storage unavailable (private mode); the toggle still works for this session.
    }
  }, [collapsed]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(" ");
  const accountProfile = {
    fullName,
    email: profile.email,
    initials: `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase(),
  };

  if (isCompanyLoading && !companyId) {
    return <DashboardSkeleton />;
  }

  if (!companyId && !companyError) {
    return <Navigate to="/pricing" replace />;
  }

  const isRefreshing = isCompanyRefreshing || isAuthRefreshing || isResumeRecovering;

  const sidebarProps = {
    unreadCount,
    workspace,
    profile: accountProfile,
    onLogout: handleLogout,
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden shrink-0 border-r border-border transition-[width] duration-200 lg:block",
          collapsed ? "w-[72px]" : "w-[248px]"
        )}
      >
        <AppSidebar
          {...sidebarProps}
          collapsed={collapsed}
          onToggleCollapsed={() => setCollapsed((value) => !value)}
        />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="scrim"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-40 bg-[#0b1220]/45 lg:hidden"
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />
            <motion.aside
              key="drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.2, ease: "easeOut" }}
              className="fixed inset-y-0 left-0 z-50 w-[288px] max-w-[85vw] shadow-lg lg:hidden"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation"
            >
              <AppSidebar
                {...sidebarProps}
                onClose={() => setMobileOpen(false)}
                onNavigate={() => setMobileOpen(false)}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        {isRefreshing && (
          <div className="absolute inset-x-0 top-0 z-30 h-[3px] overflow-hidden bg-track" role="progressbar" aria-label="Refreshing">
            <div className="h-full w-1/3 animate-loading-bar bg-primary motion-reduce:animate-none" />
          </div>
        )}

        <AppTopbar
          profile={accountProfile}
          firstName={profile.firstName}
          unreadCount={unreadCount}
          onOpenSearch={() => setSearchOpen(true)}
          onOpenMenu={() => setMobileOpen(true)}
          onLogout={handleLogout}
        />

        <main className="flex-1 overflow-y-auto">
          {(companyError || !isOnline) && (
            <div className="space-y-3 px-4 pt-6 sm:px-6 lg:px-8">
              {companyError && (
                <Banner
                  tone="danger"
                  title="Failed to load company context."
                  description="Please refresh or sign in again."
                  action={
                    <Button variant="secondary" size="sm" onClick={() => void refreshCompany()} loading={isCompanyRefreshing}>
                      {!isCompanyRefreshing && <RefreshCw strokeWidth={1.75} />}
                      Refresh
                    </Button>
                  }
                />
              )}
              {!isOnline && (
                <Banner
                  tone="info"
                  title="Reconnecting…"
                  description="Changes you make will sync when the connection is back."
                />
              )}
            </div>
          )}

          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="h-full"
          >
            {children}
          </motion.div>
        </main>
      </div>

      <CommandPalette open={searchOpen} onOpenChange={setSearchOpen} companyId={companyId} />
    </div>
  );
}

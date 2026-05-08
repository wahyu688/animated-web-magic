import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../lib/supabase";
import {
  BarChart3, Calendar, ChevronLeft, Home, Kanban,
  Bell, Search, Settings, Users, Zap, CreditCard, Activity, Menu, BookOpen, DollarSign
} from "lucide-react";
import { useCompany } from "@/hooks/use-company";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

const navItems = [
  { icon: Home, label: "Dashboard", path: "/dashboard" },
  { icon: BarChart3, label: "Analytics", path: "/analytics" },
  { icon: Kanban, label: "Project Board", path: "/kanban" },
  { icon: Calendar, label: "Calendar", path: "/calendar" },
  { icon: Users, label: "Team", path: "/team" },
  { icon: Activity, label: "Activity", path: "/activity" },
  { icon: Settings, label: "Settings", path: "/settings" },
  { icon: DollarSign, label: "Financial", path: "/financial" },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  // -- LOGOUT BUTTON ---
    const handleLogout = async () => {
    await supabase.auth.signOut();

    navigate("/login");
  };
  
  // --- STATE PROFIL & NOTIFIKASI ---
  const [profile, setProfile] = useState({ firstName: "Loading...", lastName: "", email: "..." });
  const [unreadCount, setUnreadCount] = useState(0);
  const isMountedRef = useRef(false);
  const { companyId } = useCompany();

  // --- EFFECT UNTUK PROFIL ---
  useEffect(() => {
    isMountedRef.current = true;
    const fetchProfile = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) console.error("Profile auth fetch error:", error);
      if (user && isMountedRef.current) {
        // Ambil data dari tabel user_profiles
        const { data, error: profileError } = await supabase.from('user_profiles').select('first_name, last_name').eq('id', user.id).single();
        if (profileError) console.error("Profile fetch error:", profileError);
        
        setProfile({
          firstName: data?.first_name || user.user_metadata?.first_name || "User",
          lastName: data?.last_name || user.user_metadata?.last_name || "",
          email: user.email || ""
        });
      }
    };
    fetchProfile();

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // --- EFFECT UNTUK REAL-TIME NOTIFIKASI ---
  const fetchUnreadCount = useCallback(async () => {
    if (!companyId) {
      setUnreadCount(0);
      return;
    }

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('unread', true);
    
    if (error) {
      console.error("Unread notification count error:", error);
      return;
    }

    if (isMountedRef.current && count !== null) {
      setUnreadCount(count);
    }
  }, [companyId]);

  useEffect(() => {
    isMountedRef.current = true;
    if (!companyId) return;
    fetchUnreadCount();

    const channel = supabase
      .channel('navbar-notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `company_id=eq.${companyId}`
        },
        (payload) => {
          console.log("[navbar realtime] new notification:", payload);

          setUnreadCount((prev) => prev + 1);

          fetchUnreadCount();
        }
      )
      .subscribe((status, error) => {
        console.info("[navbar realtime] status:", status, error ?? "");
        if (status === 'SUBSCRIBED') fetchUnreadCount();
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          console.warn("[navbar realtime] disconnected; unread count will refresh on reconnect/page activity.", { status, error });
        }
      });

    return () => {
      isMountedRef.current = false;
      channel.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [companyId, fetchUnreadCount]);

  // Membuat inisial nama (Misal: "Wahyu Saputra" jadi "WS")
  const getInitials = () => {
    const first = profile.firstName.charAt(0).toUpperCase();
    const last = profile.lastName ? profile.lastName.charAt(0).toUpperCase() : '';
    return `${first}${last}`;
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm md:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      <aside
        className={`fixed md:relative z-50 h-full flex flex-col border-r border-border bg-card transition-all duration-300 ${
          collapsed ? "w-[72px]" : "w-64"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl gradient-primary shadow-primary-glow">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="text-lg font-bold tracking-tight text-foreground overflow-hidden"
              >
                Nexus<span className="text-primary">Flow</span>
              </motion.span>
            )}
          </Link>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <ChevronLeft className={`h-4 w-4 transition-transform ${collapsed ? "rotate-180" : ""}`} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={`h-5 w-5 shrink-0 transition-transform group-hover:scale-110 ${isActive ? "text-primary" : ""}`} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </div>
                
                {!collapsed && item.label === "Activity" && unreadCount > 0 && (
                  <span className="bg-primary text-primary-foreground text-[10px] px-2 py-0.5 rounded-full font-bold">
                    {unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* --- PROFIL SIDEBAR DINAMIS --- */}
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-muted transition-colors cursor-pointer">
            <div className="relative shrink-0">
              <div className="h-9 w-9 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                {getInitials()}
              </div>
              <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-success ring-2 ring-card" />
            </div>
            {!collapsed && (
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-semibold text-foreground truncate">
                  {profile.firstName} {profile.lastName}
                </p>
                <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b border-border bg-card/80 backdrop-blur-md px-4 md:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="md:hidden p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors">
              <Menu className="h-5 w-5" />
            </button>
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input placeholder="Search anything..." className="h-10 w-72 rounded-xl border-none bg-muted pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            
             <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-white hover:bg-muted transition-colors text-sm font-medium"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>

            <Link to="/activity" className="relative p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors cursor-pointer block">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive ring-2 ring-card animate-pulse" />
              )}
            </Link>
            
            <div className="h-8 w-px bg-border" />
            
            {/* --- PROFIL HEADER DINAMIS --- */}
            <div className="h-9 w-9 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm cursor-pointer hover:opacity-90 transition-opacity">
              {getInitials()}
            </div>
            
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="h-full"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}

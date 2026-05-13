import { useCallback, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import DashboardLayout from "./DashboardLayout";
import DashboardSkeleton from "../DashboardSkeleton"; 
import { useSupabaseResumeRecovery } from "@/hooks/use-supabase-resume-recovery";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const recoverAuth = useCallback(async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error("Auth session recovery error:", error);
      return;
    }

    setIsAuthenticated(Boolean(session));
    setIsLoading(false);
  }, []);

  useSupabaseResumeRecovery({ onRecover: recoverAuth });

  useEffect(() => {
    let isMounted = true;

    // 1. Cek sesi saat komponen pertama kali dimuat
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) console.error("Auth session check error:", error);
        if (!isMounted) return;
        setIsAuthenticated(!!session);
      } catch (error) {
        console.error("Auth session check crashed:", error);
      } finally {
        if (isMounted) setIsLoading(false); // Selesai loading
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      setIsAuthenticated(!!session);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // MENAMPILKAN SKELETON ANIMATION
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // Jika tidak punya tiket login, kembali ke halaman login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Jika aman, Langsung di bantu dengan dashboatd layout yang real
  return <DashboardLayout>{children}</DashboardLayout>;
}

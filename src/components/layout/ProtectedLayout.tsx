import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import DashboardLayout from "./DashboardLayout";
import DashboardSkeleton from "../DashboardSkeleton"; 

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // 1. Cek sesi saat komponen pertama kali dimuat
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      setIsLoading(false); // Selesai loading
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
      setIsLoading(false);
    });

    return () => {
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
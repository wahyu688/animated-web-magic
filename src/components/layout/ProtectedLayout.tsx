import { Navigate } from "react-router-dom";
import DashboardLayout from "./DashboardLayout";
import DashboardSkeleton from "../DashboardSkeleton"; 
import { useAuth } from "@/contexts/AuthContext";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { session, isAuthLoading } = useAuth();

  // MENAMPILKAN SKELETON ANIMATION
  if (isAuthLoading) {
    return <DashboardSkeleton />;
  }

  // Jika tidak punya tiket login, kembali ke halaman login
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Jika aman, Langsung di bantu dengan dashboatd layout yang real
  return <DashboardLayout>{children}</DashboardLayout>;
}

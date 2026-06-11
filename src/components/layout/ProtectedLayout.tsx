import { Navigate } from "react-router-dom";
import DashboardLayout from "./DashboardLayout";
import DashboardSkeleton from "../DashboardSkeleton"; 
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/hooks/use-company";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { session, isAuthLoading } = useAuth();
  const { companyId, isCompanyLoading } = useCompany();

  if (isAuthLoading || isCompanyLoading) {
    return <DashboardSkeleton />;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (!companyId) {
    return <Navigate to="/subscription" replace />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}

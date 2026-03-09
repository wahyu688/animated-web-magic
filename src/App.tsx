import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardLayout from "./components/layout/DashboardLayout";
import DashboardPage from "./pages/DashboardPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import LoginPage from "./pages/LoginPage";
import SettingsPage from "./pages/SettingsPage";
import PricingPage from "./pages/PricingPage";
import TeamPage from "./pages/TeamPage";
import KanbanPage from "./pages/KanbanPage";
import ActivityPage from "./pages/ActivityPage";
import CalendarPage from "./pages/CalendarPage";
import DocsPage from "./pages/DocsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const DashboardRoute = ({ children }: { children: React.ReactNode }) => (
  <DashboardLayout>{children}</DashboardLayout>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<DashboardRoute><DashboardPage /></DashboardRoute>} />
          <Route path="/analytics" element={<DashboardRoute><AnalyticsPage /></DashboardRoute>} />
          <Route path="/settings" element={<DashboardRoute><SettingsPage /></DashboardRoute>} />
          <Route path="/pricing" element={<DashboardRoute><PricingPage /></DashboardRoute>} />
          <Route path="/team" element={<DashboardRoute><TeamPage /></DashboardRoute>} />
          <Route path="/kanban" element={<DashboardRoute><KanbanPage /></DashboardRoute>} />
          <Route path="/activity" element={<DashboardRoute><ActivityPage /></DashboardRoute>} />
          <Route path="/calendar" element={<DashboardRoute><CalendarPage /></DashboardRoute>} />
          <Route path="/docs" element={<DashboardRoute><DocsPage /></DashboardRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

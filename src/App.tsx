import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { MotionConfig } from "framer-motion";

// --- HALAMAN PUBLIK ---
import LandingPage from "./pages/LandingPage";
import PricingPage from "./pages/PricingPage";
import LoginPage from "./pages/LoginPage";
import AboutPage from "./pages/AboutPage";

// --- HALAMAN PRIVAT ---
import DashboardPage from "./pages/DashboardPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import KanbanPage from "./pages/KanbanPage";
import CalendarPage from "./pages/CalendarPage";
import TeamPage from "./pages/TeamPage";
import ActivityPage from "./pages/ActivityPage";
import SettingsPage from "./pages/SettingsPage";
import FinancialPage from "./pages/FinancialPage";

// --- LAYOUT ---
// Pastikan path ini sesuai dengan tempat Anda menyimpan ProtectedLayout.tsx
import ProtectedLayout from "./components/layout/ProtectedLayout";
import { Toaster } from "./components/ui/toaster";

const PUBLIC_PATHS = ["/", "/pricing", "/subscription", "/login", "/about"];

/** Scrolls to the top on page change, or to the #anchor when the URL has one. */
function ScrollManager() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      // Wait a frame so the target section has rendered.
      requestAnimationFrame(() => document.getElementById(hash.slice(1))?.scrollIntoView());
      return;
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
}

function AppShell({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  // Public pages are only designed in light mode; the app follows the user's choice.
  const forcedTheme = PUBLIC_PATHS.includes(pathname) ? "light" : undefined;

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange forcedTheme={forcedTheme}>
      <MotionConfig reducedMotion="user">
        <ScrollManager />
        {children}
      </MotionConfig>
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <Router>
      <AppShell>
        <Routes>
          {/* ============================== */}
          {/* RUTE PUBLIK (Bisa diakses tanpa login) */}
          {/* ============================== */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/subscription" element={<PricingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/about" element={<AboutPage />} />
        
          {/* ============================== */}
          {/* RUTE PRIVAT (Harus login, dilindungi oleh ProtectedLayout) */}
          {/* ============================== */}
          <Route 
            path="/dashboard" 
            element={<ProtectedLayout><DashboardPage /></ProtectedLayout>} 
          />
          <Route 
            path="/analytics" 
            element={<ProtectedLayout><AnalyticsPage /></ProtectedLayout>} 
          />
          <Route 
            path="/kanban" 
            element={<ProtectedLayout><KanbanPage /></ProtectedLayout>} 
          />
          <Route 
            path="/calendar" 
            element={<ProtectedLayout><CalendarPage /></ProtectedLayout>} 
          />
          <Route 
            path="/team" 
            element={<ProtectedLayout><TeamPage /></ProtectedLayout>} 
          />
          <Route 
            path="/activity" 
            element={<ProtectedLayout><ActivityPage /></ProtectedLayout>} 
          />
          <Route 
            path="/settings" 
            element={<ProtectedLayout><SettingsPage /></ProtectedLayout>} 
          />
          <Route path="/financial" element={<ProtectedLayout><FinancialPage /></ProtectedLayout>} />

          {/* Tangkap semua URL yang tidak valid, tendang kembali ke Landing Page */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster />
      </AppShell>
    </Router>
  );
}
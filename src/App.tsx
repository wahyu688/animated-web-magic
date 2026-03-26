import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

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

export default function App() {
  return (
    <Router>
      <Routes>
        {/* ============================== */}
        {/* RUTE PUBLIK (Bisa diakses tanpa login) */}
        {/* ============================== */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/pricing" element={<PricingPage />} />
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
    </Router>
  );
}
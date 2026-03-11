import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import KanbanPage from "./pages/KanbanPage";
import CalendarPage from "./pages/CalendarPage";
import DashboardLayout from "./components/layout/DashboardLayout";

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Rute Publik (Tanpa Sidebar/Navbar) */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* Rute Privat (DashboardPage dimasukkan sebagai 'children' ke dalam Layout) */}
        <Route 
          path="/" 
          element={
            <DashboardLayout>
              <DashboardPage />
            </DashboardLayout>
          } 
        />
        
        {/* { Nanti untuk halaman lain, formatnya sama persis seperti ini: } */}
        { <Route 
          path="/analytics" 
          element={
            <DashboardLayout>
              <AnalyticsPage />
            </DashboardLayout>
          } 
        /> 
        }

        { <Route 
          path="/kanban" 
          element={
            <DashboardLayout>
              <KanbanPage />
            </DashboardLayout>
          } 
        /> 
        }

        { <Route 
          path="/calendar" 
          element={
            <DashboardLayout>
              <CalendarPage />
            </DashboardLayout>
          } 
        /> 
        }

        {/* Tangkap semua URL yang tidak valid, kembalikan ke Root */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
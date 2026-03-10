import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage"; // Memanggil halaman login yang sudah kita perbaiki
import DashboardPage from "./pages/DashboardPage";

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Rute utama untuk halaman Login */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        
        {/* Sementara waktu, jika user membuka web "/", langsung arahkan ke /login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Nanti Anda bisa menambahkan rute dashboard di sini */}
        {/* <Route path="/dashboard" element={<DashboardPage />} /> */}
      </Routes>
    </Router>
  );
}
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Import semua Halaman (Pages)
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import DashboardContent from './pages/DashboardContent';
import Perangkat from './pages/Perangkat';
import ManajemenAdmin from './pages/ManajemenAdmin';
import PengaturanAplikasi from './pages/PengaturanAplikasi';
import RekapitulasiAparatur from './pages/RekapitulasiAparatur';

// --- Komponen baru untuk mengatur rute berdasarkan status login ---
const AppRoutes = () => {
    const { currentUser } = useAuth();

    return (
        <Routes>
            {/* Rute untuk Halaman Login */}
            {/* Jika user SUDAH login, jangan tampilkan halaman login, arahkan ke dashboard */}
            <Route path="/login" element={currentUser ? <Navigate to="/" /> : <LoginPage />} />

            {/* Rute untuk Halaman Utama (Dashboard dan isinya) */}
            {/* Jika user BELUM login, jangan izinkan masuk, arahkan ke halaman login */}
            <Route path="/" element={!currentUser ? <Navigate to="/login" /> : <Dashboard />}>
                
                {/* Halaman-halaman yang akan tampil di dalam layout Dashboard */}
                <Route index element={<DashboardContent />} />
                <Route path="perangkat" element={<Perangkat />} />
                
                {/* Halaman yang hanya bisa diakses oleh Admin Kecamatan */}
                {currentUser && currentUser.role === 'admin_kecamatan' && (
                    <>
                        <Route path="rekapitulasi-aparatur" element={<RekapitulasiAparatur />} />
                        <Route path="manajemen-admin" element={<ManajemenAdmin />} />
                        <Route path="pengaturan" element={<PengaturanAplikasi />} />
                    </>
                )}
            </Route>

            {/* Jika user mengakses URL yang tidak ada, arahkan ke halaman utama */}
            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
};


// --- Komponen App utama sekarang hanya membungkus Router dan Context ---
function App() {
    return (
        <Router>
            <AppRoutes />
        </Router>
    );
}

export default App;

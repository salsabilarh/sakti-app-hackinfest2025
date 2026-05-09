/**
 * App.jsx
 *
 * Root aplikasi SAKTI Platform.
 * Mengatur routing, autentikasi, dan inisialisasi komponen global (Botpress).
 *
 * ============================================================
 * FITUR UTAMA
 * ============================================================
 * - Routing dengan React Router v6
 * - Proteksi route berdasarkan status autentikasi dan role
 * - Inisialisasi Botpress chatbot (hanya sekali di root App)
 * - Redirect yang aman (tidak loop) untuk user sudah login
 *
 * ============================================================
 * STRUKTUR ROUTE
 * ============================================================
 * Public routes:
 *   /login, /register, /forgot-password
 * Protected routes (require authentication):
 *   /dashboard, /daftar-jasa, /tambah-jasa, /jasa/:id,
 *   /edit-jasa/:id, /edit-profil
 * Role-protected routes:
 *   /marketing-kit (admin + management) → menggunakan MARKETING_KIT_ROLES
 *   /admin (hanya admin)
 *
 * ============================================================
 * PANDUAN MAINTENANCE
 * ============================================================
 * - Jangan tambahkan logika inisialisasi Botpress di komponen lain.
 * - Jika ada role baru, update ROLES constants dan sesuaikan protected routes.
 * - Pastikan route layout (DashboardLayout) membungkus komponen yang memerlukan sidebar.
 */

import React, { useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider, useAuth } from '@/contexts/AuthContext.jsx';

import LoginPage from '@/pages/LoginPage.jsx';
import RegistrationPage from '@/pages/RegistrationPage.jsx';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage.jsx';
import DashboardLayout from '@/components/layout/DashboardLayout.jsx';
import Dashboard from '@/pages/Dashboard.jsx';
import DaftarJasa from '@/pages/DaftarJasa.jsx';
import DetailService from '@/pages/DetailService.jsx';
import MarketingKit from '@/pages/MarketingKit.jsx';
import AdminPanel from '@/pages/AdminPanel.jsx';
import EditProfilePage from '@/pages/EditProfilePage.jsx';
import TambahJasa from '@/pages/TambahJasa.jsx';
import EditService from '@/pages/EditJasa.jsx';
import { ROLES, MARKETING_KIT_ROLES } from '@/lib/constants';

// ============================================================
// Route Guards
// ============================================================

/**
 * ProtectedRoute - Memastikan user sudah login.
 * Jika belum, redirect ke halaman login dengan menyimpan lokasi asal.
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @returns {JSX.Element}
 */
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

/**
 * RoleProtectedRoute - Memastikan user memiliki role yang diizinkan.
 * @param {Object} props
 * @param {string[]} props.allowedRoles - Daftar role yang diizinkan
 * @param {React.ReactNode} props.children
 * @returns {JSX.Element}
 */
function RoleProtectedRoute({ allowedRoles, children }) {
  const { user } = useAuth();
  if (!allowedRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

// ============================================================
// Botpress Initializer
// ============================================================

/**
 * BotpressInitializer - Komponen yang menangani inisialisasi Botpress chatbot.
 * Dipasang sekali di root App, bukan di Dashboard.
 *
 * Hanya membuka widget saat user berada di halaman /dashboard.
 *
 * @returns {null}
 */
function BotpressInitializer() {
  const location = useLocation();

  // Inisialisasi script dan botpress hanya sekali saat komponen mount
  useEffect(() => {
    const injectScript = () =>
      new Promise((resolve, reject) => {
        if (window.botpress) return resolve();
        const existingScript = document.getElementById('botpress-webchat-script');
        if (existingScript) {
          existingScript.addEventListener('load', resolve, { once: true });
          return;
        }
        const script = document.createElement('script');
        script.src = 'https://cdn.botpress.cloud/webchat/v3.1/inject.js';
        script.async = true;
        script.id = 'botpress-webchat-script';
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
      });

    const initBotpress = () => {
      if (!window.botpress || window.__botpressInitialized) return;
      window.__botpressInitialized = true;
      window.botpress.init({
        botId: 'ca0e2a53-b7b1-4b4d-90e2-7b93d67b28e0',
        clientId: '48967a19-c892-47f0-8f46-e7cfd3153a98',
        selector: '#webchat',
        configuration: {
          version: 'v1',
          botName: 'SAKTI Assistant',
          botAvatar: 'https://files.bpcontent.cloud/2025/07/27/09/20250727092708-YXL6QMAF.png',
          color: '#000476',
          variant: 'solid',
          headerVariant: 'solid',
          themeMode: 'dark',
          fontFamily: 'inter',
          radius: 4,
          feedbackEnabled: false,
          footer: '',
        },
      });
    };

    injectScript()
      .then(initBotpress)
      .catch((e) => console.error('Botpress load failed:', e));
  }, []);

  // Buka widget hanya saat user berada di halaman /dashboard
  useEffect(() => {
    if (location.pathname !== '/dashboard') return;
    const timeout = setTimeout(() => {
      if (window.botpress) window.botpress.open();
    }, 400);
    return () => clearTimeout(timeout);
  }, [location.pathname]);

  return null;
}

// ============================================================
// App Routes
// ============================================================

/**
 * AppRoutes - Mendefinisikan semua route aplikasi dengan guard yang sesuai.
 * @returns {JSX.Element}
 */
function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegistrationPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Root Redirect */}
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Protected Routes (require authentication) */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Dashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/daftar-jasa"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <DaftarJasa />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/tambah-jasa"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <TambahJasa />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/jasa/:id"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <DetailService />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/edit-jasa/:id"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <EditService />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/edit-profil"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <EditProfilePage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Role-Protected Routes */}
      {/* Hanya admin & management yang boleh akses marketing kit */}
      <Route
        path="/marketing-kit"
        element={
          <ProtectedRoute>
            <RoleProtectedRoute allowedRoles={MARKETING_KIT_ROLES}>
              <DashboardLayout>
                <MarketingKit />
              </DashboardLayout>
            </RoleProtectedRoute>
          </ProtectedRoute>
        }
      />

      {/* Admin only */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <RoleProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <DashboardLayout>
                <AdminPanel />
              </DashboardLayout>
            </RoleProtectedRoute>
          </ProtectedRoute>
        }
      />

      {/* 404 Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

// ============================================================
// App Root
// ============================================================

/**
 * App - Komponen root aplikasi.
 * Membungkus dengan AuthProvider, Router, BotpressInitializer, dan Toaster.
 * @returns {JSX.Element}
 */
export default function App() {
  return (
    <AuthProvider>
      <Router>
        <BotpressInitializer />
        <div className="min-h-screen w-full bg-gray-50">
          <AppRoutes />
          <Toaster />
        </div>
      </Router>
    </AuthProvider>
  );
}
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import TambahJasa from './pages/TambahJasa.jsx';
import EditJasa from './pages/EditJasa.jsx';

// ----- route guards -----
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

function RoleProtectedRoute({ allowedRoles, children }) {
  const { user } = useAuth();
  if (!allowedRoles.includes(user?.role)) return <Navigate to="/" replace />;
  return children;
}

// ----- Botpress global init (hanya sekali, buka otomatis di /dashboard) -----
function BotpressInitializer() {
  const location = useLocation();

  useEffect(() => {
    const injectBotpressScript = () =>
      new Promise((resolve, reject) => {
        if (window.botpress) return resolve();
        let script = document.getElementById('botpress-webchat-script');
        if (script) {
          script.onload = resolve;
          script.onerror = reject;
          return;
        }
        script = document.createElement('script');
        script.src = 'https://cdn.botpress.cloud/webchat/v3.1/inject.js';
        script.async = true;
        script.id = 'botpress-webchat-script';
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
      });

    const initBotpress = () => {
      if (!window.botpress) return;
      // init sekali saja; widget akan render ke #webchat saat elemen itu ada (di Dashboard)
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

    injectBotpressScript().then(initBotpress).catch((e) => console.error('Botpress load fail:', e));

    // setiap pindah route, kalau di dashboard -> buka widget
    if (location.pathname === '/dashboard') {
      const t = setTimeout(() => {
        if (window.botpress) window.botpress.open();
      }, 300);
      return () => clearTimeout(t);
    }
  }, [location.pathname]);

  return null;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegistrationPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      <Route
        path="/"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />}
      />

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
        path="/service/:id"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <DetailService />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/edit-service/:id"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <EditJasa />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/marketing-kit"
        element={
          <ProtectedRoute>
            <RoleProtectedRoute allowedRoles={['admin', 'management', 'pdo']}>
              <DashboardLayout>
                <MarketingKit />
              </DashboardLayout>
            </RoleProtectedRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <RoleProtectedRoute allowedRoles={['admin']}>
              <DashboardLayout>
                <AdminPanel />
              </DashboardLayout>
            </RoleProtectedRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/edit-profile"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <EditProfilePage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

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

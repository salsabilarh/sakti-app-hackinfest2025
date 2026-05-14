/**
 * pages/LoginPage.jsx
 *
 * Halaman login untuk autentikasi pengguna ke SAKTI Platform.
 * Menggunakan sistem dual-token (access + refresh) yang dikelola oleh AuthContext.
 *
 * ============================================================
 * FITUR UTAMA
 * ============================================================
 * - Form login dengan validasi dasar (required field)
 * - Toggle visibility password (show/hide)
 * - Redirect setelah login ke halaman yang diminta sebelumnya (dari state location)
 * - Loading state dengan indikator
 * - Tautan ke halaman lupa password dan registrasi
 * - Integrasi Botpress chatbot (via useBotpressLoader hook)
 *
 * ============================================================
 * ALUR LOGIN
 * ============================================================
 * 1. User mengisi email dan password
 * 2. Submit form → memanggil useAuth().login(email, password)
 * 3. AuthContext mengirim POST /api/auth/login
 * 4. Server mengembalikan access_token dan refresh_token
 * 5. Token disimpan di localStorage, user profile di-fetch
 * 6. Redirect ke halaman sebelumnya atau dashboard
 *
 * ============================================================
 * KEAMANAN
 * ============================================================
 * - Password tidak boleh ditampilkan dalam log (default input type=password)
 * - Rate limiting diterapkan di backend untuk endpoint login
 * - Pesan error tidak membocorkan informasi spesifik (email terdaftar atau tidak)
 *
 * ============================================================
 * PANDUAN MAINTENANCE
 * ============================================================
 * - Gaya khusus untuk body class "login-page" dapat digunakan untuk mengubah
 *   background di level global (didefinisikan di CSS global jika perlu)
 * - Botpress loader hook dipanggil untuk memuat widget chat; pastikan script
 *   Botpress sudah dimuat dengan benar.
 * - Redirect setelah login menggunakan state location dari react-router-dom.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useToast } from '@/components/ui/use-toast.js';
import { Eye, EyeOff } from 'lucide-react';
import useBotpressLoader from '../hooks/useBotpressLoader';

// ============================================================
// Helper Functions (tidak ada, tapi disediakan untuk perluasan)
// ============================================================

// ============================================================
// Komponen Utama
// ============================================================

/**
 * LoginPage - Halaman login untuk autentikasi pengguna.
 * @returns {JSX.Element}
 */
function LoginPage() {
  // State form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Botpress chat integration (load script jika diperlukan)
  const [botpressLoaded, setBotpressLoaded] = useState(false);
  useBotpressLoader();

  // Auth context
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Halaman tujuan setelah login (state sebelumnya, atau default ke dashboard)
  const from = location.state?.from?.pathname || '/dashboard';

  // ============================================================
  // Effect: Tambahkan class CSS khusus untuk halaman login
  // ============================================================
  // Ini memungkinkan styling berbeda (misal background fullscreen) tanpa mengganggu layout lain.
  useEffect(() => {
    document.body.classList.add('login-page');
    return () => document.body.classList.remove('login-page');
  }, []);

  // ============================================================
  // Effect: Redirect otomatis jika sudah terautentikasi
  // ============================================================
  // Jika user sudah login (misal token masih valid), tidak perlu login lagi.
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  // ============================================================
  // Handler: Submit login
  // ============================================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        toast({
          title: 'Login berhasil!',
          description: 'Selamat datang di SAKTI Platform',
          variant: 'success',
          duration: 3000,
        });
        // Redirect ke halaman yang diminta sebelumnya
        navigate(from, { replace: true });
      } else {
        toast({
          title: 'Login gagal',
          description: result.error || 'Email atau password salah',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('[LoginPage] Login error:', error);
      toast({
        title: 'Terjadi kesalahan',
        description: 'Silakan coba lagi',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // Render
  // ============================================================
  return (
    <>
      <Helmet>
        <title>Login | SAKTI Platform</title>
        <meta
          name="description"
          content="Login to SAKTI - Service Knowledge Platform with integrated chatbot assistance."
        />
        {/* Gaya inline untuk menyesuaikan widget Botpress agar tidak menampilkan tombol fab custom */}
        <style>{`
          #webchat .bpWebchat iframe {
            width: 100% !important;
            height: 100% !important;
            border: none !important;
            border-radius: 0.75rem !important;
          }
          #webchat .bpFab,
          #webchat .bp-header .bp-close {
            display: none !important;
          }
        `}</style>
      </Helmet>

      {/* Layout: grid satu kolom (kiri: form, kanan: dapat ditambahkan ilustrasi jika diperlukan) */}
      <div className="min-h-screen grid lg:grid-cols-1">
        {/* Kolom Form Login */}
        <div className="flex flex-col items-center justify-center bg-white px-8 md:px-16">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-md space-y-6"
          >
            {/* Header: Logo + Teks Selamat Datang */}
            <div className="text-center mb-6">
              <img
                src="/sakti.png"
                alt="SAKTI Logo"
                className="h-32 mx-auto mb-3 object-contain"
              />
              <h2 className="text-3xl font-bold text-gray-900">Selamat Datang</h2>
              <p className="text-gray-600 mt-2 text-center">
                Masuk ke akun Anda untuk mengakses <b>SAKTI Platform</b>.
              </p>
            </div>

            {/* Form Login */}
            <form
              onSubmit={handleSubmit}
              className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 space-y-5"
            >
              {/* Field Email */}
              <div>
                <Label htmlFor="email" className="text-gray-700 font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@sucofindo.co.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 mt-2"
                />
              </div>

              {/* Field Password dengan Toggle Visibility */}
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-gray-700 font-medium">
                    Password
                  </Label>
                  <Link
                    to="/forgot-password"
                    className="text-sm text-[#000476] hover:underline"
                  >
                    Lupa Password?
                  </Link>
                </div>
                <div className="relative mt-2">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Masukkan password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 pr-10"
                  />
                  <div
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-gray-500 hover:text-gray-700"
                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </div>
                </div>
              </div>

              {/* Tombol Submit */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 text-white font-medium bg-[#000476] hover:bg-[#0202a3] transition-all"
              >
                {loading ? 'Memproses...' : 'Masuk'}
              </Button>
            </form>

            {/* Tautan Registrasi */}
            <div className="text-center mt-4">
              <Link to="/register">
                <Button
                  variant="outline"
                  className="w-full h-11 border-[#000476] text-[#000476] hover:bg-blue-50 transition-colors"
                >
                  Belum punya akun? Daftar di sini
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Animasi tambahan (opsional, dapat dihapus jika tidak digunakan) */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </>
  );
}

export default LoginPage;
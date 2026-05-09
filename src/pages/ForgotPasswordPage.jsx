/**
 * pages/ForgotPasswordPage.jsx
 *
 * Halaman untuk mengajukan permintaan reset password.
 * User memasukkan email, backend mencatat permintaan ke tabel password_reset_requests.
 * Admin kemudian memproses permintaan secara manual (admin-driven flow).
 *
 * ============================================================
 * ALUR BISNIS
 * ============================================================
 * 1. User mengisi email dan submit form.
 * 2. Frontend memvalidasi format email.
 * 3. Backend menerima POST /api/auth/forgot-password.
 * 4. Backend membuat entri di password_reset_requests (tanpa mengirim email otomatis).
 * 5. Admin melihat permintaan di halaman admin dan melakukan reset password.
 * 6. Admin memberikan password baru ke user melalui kanal resmi (email/telepon).
 *
 * ============================================================
 * KEAMANAN
 * ============================================================
 * - Backend mengembalikan pesan yang sama untuk email terdaftar maupun tidak,
 *   untuk mencegah email enumeration.
 * - Frontend hanya melakukan validasi format email, tidak melakukan pengecekan
 *   apakah email terdaftar.
 * - Rate limiting diterapkan di backend untuk endpoint ini.
 *
 * ============================================================
 * STRUKTUR API
 * ============================================================
 * POST /api/auth/forgot-password
 *   Request: { email: string }
 *   Response: { success: boolean, message: string, already_pending?: boolean }
 *
 * ============================================================
 * PANDUAN MAINTENANCE
 * ============================================================
 * - Gunakan konstanta HTTP dan RATE_LIMIT_MESSAGES dari lib/constants.
 * - Redirect ke login setelah 2.5 detik (timeout dibersihkan saat unmount).
 * - Validasi email menggunakan regex yang konsisten dengan backend.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';
import { RATE_LIMIT_MESSAGES, HTTP } from '@/lib/constants';

// ============================================================
// Helper Functions
// ============================================================

/**
 * Memvalidasi format email.
 * @param {string} value - Alamat email yang akan divalidasi
 * @returns {boolean}
 */
function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value).trim());
}

// ============================================================
// Komponen Utama
// ============================================================

/**
 * ForgotPasswordPage - Halaman lupa password.
 * @returns {JSX.Element}
 */
function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const redirectRef = useRef(null);

  // Bersihkan timeout jika komponen di-unmount sebelum redirect
  useEffect(() => {
    return () => {
      if (redirectRef.current) clearTimeout(redirectRef.current);
    };
  }, []);

  // ============================================================
  // Handler Submit
  // ============================================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);

    // Validasi format email
    if (!isValidEmail(email)) return;

    setLoading(true);
    try {
      const response = await api.post('/auth/forgot-password', {
        email: email.trim().toLowerCase(),
      });
      const isAlreadyPending = response?.data?.already_pending === true;

      toast({
        title: isAlreadyPending ? 'Permintaan Sedang Diproses' : 'Permintaan Terkirim',
        description:
          response?.data?.message ||
          (isAlreadyPending
            ? 'Permintaan Anda masih dalam antrean admin. Mohon bersabar.'
            : 'Admin akan mengirimkan password baru ke email Anda.'),
      });

      // Redirect ke login setelah 2.5 detik
      redirectRef.current = setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      const status = err.response?.status;
      let message = 'Terjadi kesalahan. Silakan coba beberapa saat lagi.';

      if (status === HTTP.TOO_MANY_REQUESTS) {
        message = RATE_LIMIT_MESSAGES.FORGOT_PASSWORD;
      } else if (err.response?.data?.error) {
        message = err.response.data.error;
      }

      toast({
        title: 'Gagal Mengirim Permintaan',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Tampilkan error hanya jika field sudah disentuh dan email tidak valid
  const emailInvalid = touched && email && !isValidEmail(email);

  // ============================================================
  // Render
  // ============================================================
  return (
    <>
      <Helmet>
        <title>Lupa Password | SAKTI Platform</title>
        <meta name="description" content="Reset kata sandi SAKTI Platform" />
      </Helmet>

      <div className="relative min-h-screen w-full overflow-hidden bg-white">
        {/* Dekorasi blur di background */}
        <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[#000476]/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-blue-300/20 blur-3xl" />

        <div className="relative z-10 flex min-h-screen items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            {/* Logo dan Judul */}
            <div className="mb-6">
              <img src="/sakti.png" alt="SAKTI Logo" className="h-20 object-contain" />
              <h1 className="mt-2 text-3xl font-bold text-gray-900">Reset Password</h1>
              <p className="mt-1 text-sm text-gray-600">
                Masukkan email yang terdaftar untuk diproses oleh admin.
              </p>
            </div>

            <Card className="border-0 shadow-xl">
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} noValidate className="space-y-4">
                  {/* Email Input */}
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="nama@sucofindo.co.id"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onBlur={() => setTouched(true)}
                        required
                        aria-invalid={emailInvalid ? 'true' : 'false'}
                        aria-describedby={emailInvalid ? 'email-error' : undefined}
                        className={`h-11 pl-10 transition-colors ${
                          emailInvalid ? 'border-red-400 focus:border-red-500' : ''
                        }`}
                      />
                    </div>
                    {emailInvalid && (
                      <p id="email-error" className="text-xs text-red-600">
                        Format email tidak valid.
                      </p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={loading}
                    className="h-11 w-full bg-[#000476] hover:bg-indigo-900 text-white"
                  >
                    {loading ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Mengirim…
                      </span>
                    ) : (
                      'Kirim Permintaan Reset Password'
                    )}
                  </Button>

                  <p className="text-center text-xs text-gray-500">
                    Mohon periksa email secara berkala untuk mendapatkan password terbaru.
                  </p>
                </form>
              </CardContent>

              <CardFooter className="flex flex-col gap-3 pt-0">
                <Link to="/login" className="w-full">
                  <Button
                    variant="outline"
                    className="h-11 w-full border-[#000476] text-[#000476] hover:bg-blue-50"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Kembali ke Login
                  </Button>
                </Link>
                <p className="text-center text-xs text-gray-500">
                  Butuh bantuan?{' '}
                  <a
                    href="mailto:customer.service@sucofindo.co.id"
                    className="font-medium text-[#000476] hover:underline"
                  >
                    customer.service@sucofindo.co.id
                  </a>
                </p>
              </CardFooter>
            </Card>
          </motion.div>
        </div>
      </div>
    </>
  );
}

export default ForgotPasswordPage;
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

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [botpressLoaded, setBotpressLoaded] = useState(false);
  useBotpressLoader();

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const from = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    document.body.classList.add('login-page');
    return () => document.body.classList.remove('login-page');
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

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
          duration: 3000
        });
        navigate(from, { replace: true });
      } else {
        toast({
          title: 'Login gagal',
          description: result.error || 'Email atau password salah',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Terjadi kesalahan',
        description: 'Silakan coba lagi',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Login | SAKTI Platform</title>
        <meta
          name="description"
          content="Login to SAKTI - Service Knowledge Platform with integrated chatbot assistance."
        />
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

      <div className="min-h-screen grid lg:grid-cols-1">
        {/* Left Column - Login Form */}
        <div className="flex flex-col items-center justify-center bg-white px-8 md:px-16">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-md space-y-6"
          >
            {/* Header */}
            <div className="text-center mb-6">
              <img
                src="sakti.png"
                alt="SAKTI Logo"
                className="h-32 mx-auto mb-3 object-contain"
              />
              <h2 className="text-3xl font-bold text-gray-900">Selamat Datang</h2>
              <p className="text-gray-600 mt-2 text-center">
                Masuk ke akun Anda untuk mengakses <b>SAKTI Platform</b>.
              </p>
            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 space-y-5"
            >
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
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 text-white font-medium bg-[#000476] hover:bg-[#0202a3] transition-all"
              >
                {loading ? 'Memproses...' : 'Masuk'}
              </Button>
            </form>

            {/* Register Link */}
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

      {/* Small animation for illustration */}
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

/**
 * pages/Dashboard.jsx
 *
 * Halaman dashboard utama SAKTI Platform yang menampilkan:
 * - Hero section dengan sambutan personal untuk user
 * - Integrated Botpress chatbot (asisten virtual SAKTI)
 * - Animasi entry menggunakan Framer Motion
 *
 * ============================================================
 * FITUR UTAMA
 * ============================================================
 * - Menampilkan nama user yang login
 * - Menampilkan ilustrasi (gambar unsplash) di desktop
 * - Chatbot Botpress yang diinisialisasi hanya di halaman /dashboard
 * - Otomatis membuka/menutup widget berdasarkan visibility dan fokus
 * - Gaya kustom untuk widget (border-radius, shadow, dll)
 *
 * ============================================================
 * CATATAN BOTPRESS
 * ============================================================
 * - Inisialisasi Botpress juga dilakukan di App.jsx. Dashboard.jsx
 *   melakukan inisialisasi ulang untuk memastikan widget berfungsi
 *   di halaman ini. Jika terjadi double-init, ini bisa dioptimalkan.
 * - Saat ini, jika widget sudah diinisialisasi di App, inisialisasi
 *   ulang tidak akan merusak, namun dapat menyebabkan event handler
 *   ganda. Disarankan untuk memusatkan inisialisasi di satu tempat.
 *
 * ============================================================
 * PANDUAN MAINTENANCE
 * ============================================================
 * - Jika ingin mengubah tampilan chatbot, sesuaikan konfigurasi
 *   di dalam initBotpress().
 * - Pastikan botId dan clientId sesuai dengan yang terdaftar di
 *   dashboard Botpress.
 * - Gambar background ilustrasi dapat diganti dengan gambar lokal.
 * - Gaya kustom Botpress didefinisikan di useEffect dengan style
 *   yang diinject ke head.
 */

import React, { useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useLocation } from 'react-router-dom';

// ============================================================
// Konfigurasi Botpress
// ============================================================

/** URL script Botpress (versi v3.1) */
const BOTPRESS_SCRIPT_URL = 'https://cdn.botpress.cloud/webchat/v3.1/inject.js';

/** Konfigurasi inisialisasi Botpress */
const BOTPRESS_CONFIG = {
  botId: 'ca0e2a53-b7b1-4b4d-90e2-7b93d67b28e0',
  clientId: '48967a19-c892-47f0-8f46-e7cfd3153a98',
  selector: '#webchat',
  configuration: {
    version: 'v1',
    botName: 'SAKTI Assistant',
    botAvatar: 'https://files.bpcontent.cloud/2025/07/27/09/20250727092708-YXL6QMAF.png',
    color: '#000476',
    variant: 'solid',
    avatarBackground: '#ffffff',
    headerVariant: 'solid',
    themeMode: 'dark',
    fontFamily: 'inter',
    radius: 4,
    feedbackEnabled: false,
    footer: '',
  },
};

/**
 * Menyisipkan script Botpress ke dalam dokumen.
 * @returns {Promise<void>}
 */
function injectBotpressScript() {
  return new Promise((resolve, reject) => {
    if (window.botpress) return resolve();

    let script = document.getElementById('botpress-webchat-script');
    if (script) {
      script.onload = resolve;
      script.onerror = reject;
      return;
    }

    script = document.createElement('script');
    script.src = BOTPRESS_SCRIPT_URL;
    script.async = true;
    script.id = 'botpress-webchat-script';
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

/**
 * Menginisialisasi Botpress dengan konfigurasi yang telah ditentukan.
 * Membuka widget setelah 300ms.
 */
function initBotpress() {
  if (!window.botpress) {
    console.error('Botpress tidak tersedia di window');
    return;
  }
  window.botpress.init(BOTPRESS_CONFIG);
  setTimeout(() => window.botpress.open(), 300);
}

/**
 * Menginject gaya kustom untuk widget Botpress.
 * @returns {HTMLStyleElement} Elemen style yang dapat di-remove saat cleanup.
 */
function injectCustomStyles() {
  const style = document.createElement('style');
  style.innerHTML = `
    #webchat .bpWebchat {
      position: unset !important;
      width: 100% !important;
      height: 100% !important;
      max-height: 100% !important;
      max-width: 100% !important;
      border-radius: 0.75rem !important;
      box-shadow: 0 8px 24px rgba(0,0,0,0.1) !important;
    }
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
  `;
  document.head.appendChild(style);
  return style;
}

// ============================================================
// Komponen Utama
// ============================================================

/**
 * Dashboard - Halaman utama setelah login.
 * @returns {JSX.Element}
 */
function Dashboard() {
  const { user } = useAuth();
  const webchatRef = useRef(null);
  const location = useLocation();

  // ============================================================
  // Effect: Inisialisasi Botpress hanya jika di halaman /dashboard
  // ============================================================
  useEffect(() => {
    if (location.pathname !== '/dashboard') return;

    let isMounted = true;

    injectBotpressScript()
      .then(() => {
        if (isMounted && window.botpress) {
          initBotpress();
        }
      })
      .catch((err) => console.error('Botpress gagal load:', err));

    return () => {
      isMounted = false;
    };
  }, [location.pathname]);

  // ============================================================
  // Effect: Inject custom styles sekali saat komponen mount
  // ============================================================
  useEffect(() => {
    const styleElement = injectCustomStyles();
    return () => {
      if (styleElement && document.head.contains(styleElement)) {
        document.head.removeChild(styleElement);
      }
    };
  }, []);

  // ============================================================
  // Effect: Buka Botpress saat window menerima fokus
  // ============================================================
  useEffect(() => {
    const handleFocus = () => {
      if (window.botpress) window.botpress.open();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // ============================================================
  // Effect: Buka Botpress saat tab menjadi visible (user kembali ke tab)
  // ============================================================
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isDashboard = location.pathname === '/dashboard';
      if (document.visibilityState === 'visible' && isDashboard && window.botpress) {
        window.botpress.open();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () =>
      document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [location.pathname]);

  // ============================================================
  // Effect: Cleanup total ketika komponen unmount
  // Hapus script dan destroy instance Botpress
  // ============================================================
  useEffect(() => {
    return () => {
      const script = document.getElementById('botpress-webchat-script');
      if (script) script.remove();
      if (window.botpress) {
        try {
          window.botpress.close();
        } catch {}
        delete window.botpress;
      }
    };
  }, []);

  // ============================================================
  // Render
  // ============================================================
  return (
    <>
      <Helmet>
        <title>Dashboard | SAKTI Platform</title>
        <meta
          name="description"
          content="Welcome to SAKTI Dashboard - Your central hub for service management and analytics"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Helmet>

      <div className="space-y-6 sm:space-y-8">
        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-2xl p-6 sm:p-8 text-white bg-gradient-to-r from-[#000476] to-indigo-800"
        >
          {/* Logo kecil di pojok kiri */}
          <div className="absolute top-3 left-3 hidden sm:block">
            <div className="bg-white/95 p-3 sm:p-4 rounded-2xl shadow-lg">
              <img
                src="/simbol.png"
                alt="SAKTI Symbol Logo"
                className="h-8 w-8 sm:h-12 sm:w-12"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-center">
            <div className="pl-0 sm:pl-20">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                Selamat Datang, {user?.full_name}
              </h1>
              <p className="text-blue-100 text-base sm:text-lg">
                Jelajahi layanan dan dokumentasi dengan mudah melalui platform SAKTI
              </p>
            </div>

            <div className="justify-center hidden md:flex">
              <img
                className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg object-contain"
                alt="Dashboard illustration showing teamwork and exploration"
                src="https://images.unsplash.com/photo-1531497258014-b5736f376b1b"
                loading="lazy"
              />
            </div>
          </div>
        </motion.section>

        {/* Botpress Chatbot Card */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <Card className="border-0 shadow-lg">
            <CardHeader className="space-y-1">
              <CardTitle className="text-lg sm:text-xl">Asisten Virtual SAKTI</CardTitle>
              <p className="text-gray-600 text-sm sm:text-base">
                Tanyakan apa saja tentang layanan dan dokumentasi kami
              </p>
            </CardHeader>

            <CardContent>
              <div className="relative w-full h-[60vh] sm:h-[65vh] lg:h-[70vh] rounded-xl overflow-hidden border">
                <div
                  ref={webchatRef}
                  id="webchat"
                  className="absolute inset-0 w-full h-full transition-all duration-300 ease-in-out"
                />
              </div>
            </CardContent>
          </Card>
        </motion.section>
      </div>
    </>
  );
}

export default Dashboard;
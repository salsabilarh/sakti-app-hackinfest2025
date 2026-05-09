/**
 * hooks/useBotpressLoader.js
 *
 * Custom hook untuk memuat dan menginisialisasi widget Botpress chatbot.
 * Botpress hanya dimuat pada halaman tertentu (login dan register) untuk
 * memberikan bantuan interaktif kepada pengguna sebelum/login.
 *
 * ============================================================
 * ALUR BEKERJA
 * ============================================================
 * 1. Hook mendeteksi path saat ini dari `useLocation()`.
 * 2. Jika path termasuk dalam `ALLOWED_PATHS` ([/login, /register]):
 *    - Inject script Botpress (jika belum ada)
 *    - Init Botpress dengan konfigurasi (botId, clientId, warna, dll)
 * 3. Jika path TIDAK termasuk (misal: /dashboard, /admin):
 *    - Hapus script dari DOM
 *    - Tutup dan hancurkan instance window.botpress
 *    - Hapus elemen floating button (`.bpFab`) jika ada
 * 4. Cleanup saat unmount atau path berubah: tutup dan hancurkan botpress.
 *
 * ============================================================
 * KONFIGURASI BOTPRESS
 * ============================================================
 * - script.src: 'https://cdn.botpress.cloud/webchat/v3.3/inject.js'
 * - botId dan clientId dari environment / dashboard Botpress
 * - Konfigurasi tampilan: warna tema, font, radius, kontak support
 *
 * ============================================================
 * PANDUAN MAINTENANCE
 * ============================================================
 * - Jika ada halaman publik lain yang ingin menampilkan chatbot,
 *   tambahkan path ke array `ALLOWED_PATHS`.
 * - Jika versi Botpress berubah, update URL script dan pastikan
 *   parameter init kompatibel.
 * - Jangan biarkan chatbot termuat di halaman yang memerlukan autentikasi
 *   untuk menghindari kebocoran informasi token (Botpress berjalan di
 *   sisi client, harus aman). Saat ini hanya login & register.
 *
 * ============================================================
 * KEAMANAN
 * ============================================================
 * - Botpress diinisialisasi hanya setelah script selesai dimuat.
 * - Setiap kali path berubah, hook melakukan cleanup yang bersih.
 * - Tidak ada data sensitif yang dikirim ke Botpress secara otomatis.
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// ============================================================
// Konstanta
// ============================================================

/** Halaman-halaman yang diizinkan menampilkan chatbot */
const ALLOWED_PATHS = ['/login', '/register'];

/** URL script Botpress (versi v3.3) */
const BOTPRESS_SCRIPT_URL = 'https://cdn.botpress.cloud/webchat/v3.3/inject.js';

/** Konfigurasi Botpress (botId, clientId, tampilan) */
const BOTPRESS_CONFIG = {
  botId: 'af2b4fff-fd14-404d-8184-543b5bc9349b',
  clientId: '471604bd-75df-43c1-80b9-908e3cdf7338',
  configuration: {
    version: 'v1',
    botName: 'SAKTI Assistant',
    botAvatar: 'https://files.bpcontent.cloud/2025/07/27/09/20250727093652-HSRR0UDX.png',
    website: {
      title: 'https://www.sucofindo.co.id/',
      link: 'https://www.sucofindo.co.id/',
    },
    email: {
      title: 'customer.service@sucofindo.co.id',
      link: 'customer.service@sucofindo.co.id',
    },
    phone: {
      title: '+62217983666',
      link: '+62217983666',
    },
    termsOfService: {},
    privacyPolicy: {},
    color: '#000476',
    variant: 'solid',
    headerVariant: 'solid',
    themeMode: 'dark',
    fontFamily: 'inter',
    radius: 4,
    feedbackEnabled: false,
    footer: '',
  },
};

// ============================================================
// Helper Functions
// ============================================================

/**
 * Menyisipkan script Botpress ke dalam dokumen jika belum ada.
 * @returns {Promise<void>}
 */
function injectBotpressScript() {
  return new Promise((resolve, reject) => {
    // Jika script sudah dimuat, langsung selesai
    if (window.botpress) return resolve();

    const existingScript = document.getElementById('botpress-webchat-script');
    if (existingScript) {
      // Tunggu script yang sudah ada selesai loading
      existingScript.onload = resolve;
      existingScript.onerror = reject;
      return;
    }

    const script = document.createElement('script');
    script.src = BOTPRESS_SCRIPT_URL;
    script.async = true;
    script.id = 'botpress-webchat-script';
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

/**
 * Membersihkan widget Botpress dari halaman.
 * Menghapus script, menutup/destroy instance, dan menghapus floating button.
 */
function cleanupBotpress() {
  const script = document.getElementById('botpress-webchat-script');
  if (script) script.remove();

  if (window.botpress) {
    try {
      window.botpress.close();
    } catch {}
    try {
      window.botpress.destroy();
    } catch {}
    delete window.botpress;
  }

  const fab = document.querySelector('.bpFab');
  if (fab) fab.remove();
}

// ============================================================
// Custom Hook
// ============================================================

/**
 * useBotpressLoader - Memuat dan menginisialisasi Botpress hanya pada halaman tertentu.
 *
 * Hook ini harus dipanggil di dalam komponen yang berada di Router (menggunakan useLocation).
 * Biasanya dipanggil di App.jsx atau di komponen layout/root.
 *
 * @returns {void}
 */
export default function useBotpressLoader() {
  const location = useLocation();

  useEffect(() => {
    const isAllowed = ALLOWED_PATHS.includes(location.pathname);

    if (!isAllowed) {
      // Jika path tidak diizinkan, bersihkan chatbot
      cleanupBotpress();
      return;
    }

    // Inisialisasi Botpress untuk halaman yang diizinkan
    let isMounted = true;

    const init = async () => {
      try {
        await injectBotpressScript();
        if (!isMounted) return;
        if (window.botpress) {
          await window.botpress.init(BOTPRESS_CONFIG);
        }
      } catch (err) {
        console.error('[useBotpressLoader] Gagal memuat Botpress:', err);
      }
    };

    init();

    // Cleanup saat komponen unmount atau path berubah (sebelum efek berikutnya)
    return () => {
      isMounted = false;
      // Jangan cleanup di sini untuk semua kasus karena kita sudah melakukan cleanup di atas
      // berdasarkan allowed paths; tetapi kita tetap tutup instance untuk mencegah memory leak.
      if (window.botpress) {
        try {
          window.botpress.close();
        } catch {}
      }
    };
  }, [location.pathname]);
}
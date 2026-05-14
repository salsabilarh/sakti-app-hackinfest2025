/**
 * lib/api.js
 *
 * Instance Axios tunggal untuk seluruh aplikasi SAKTI.
 * Menangani:
 * - Base URL dari environment variable
 * - Auto-attach access token ke setiap request
 * - Auto-refresh token saat menerima 401 (kecuali endpoint refresh itu sendiri)
 * - Guard terhadap infinite loop refresh
 * - Force logout jika refresh gagal atau refresh token tidak tersedia
 *
 * ============================================================
 * ALUR AUTO-REFRESH TOKEN
 * ============================================================
 * 1. Request asli → interceptor request → attach access token dari localStorage.
 * 2. Jika server merespon 401 (Unauthorized):
 *    - Cek apakah sudah pernah di-retry (`_retry` flag)
 *    - Cek apakah request bukan ke endpoint `/auth/refresh` (loop guard)
 *    - Ambil refresh token dari localStorage
 *    - Kirim request refresh ke server
 * 3. Jika refresh berhasil:
 *    - Simpan access token baru ke localStorage
 *    - Update header Authorization request asli
 *    - Retry request asli
 * 4. Jika refresh gagal (refresh token invalid/expired):
 *    - Hapus semua token dari localStorage
 *    - Redirect ke halaman login
 * 5. Jika request asli sudah ke `/auth/refresh` dan gagal (401):
 *    - Langsung force logout (tidak retry)
 *
 * ============================================================
 * KEAMANAN & HANDLING
 * ============================================================
 * - Timeout 15 detik untuk mencegah hanging request
 * - Guard terhadap infinite recursive loop
 * - Redirect ke login hanya jika tidak sedang di halaman login
 * - Tidak menggunakan React Router (karena interceptor di luar component tree)
 *
 * ============================================================
 * DEPENDENSI
 * ============================================================
 * - TOKEN_KEYS dari './constants' (harus memiliki ACCESS dan REFRESH)
 * - Environment variable: VITE_API_URL (default: http://localhost:3000)
 */

import axios from 'axios';
import { TOKEN_KEYS } from './constants';

// ============================================================
// Konfigurasi Instance Axios
// ============================================================

/** Durasi timeout maksimum (ms) untuk setiap request */
const REQUEST_TIMEOUT_MS = 15000;

/**
 * Instance axios yang telah dikonfigurasi dengan base URL dan timeout.
 */
const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api`,
  timeout: REQUEST_TIMEOUT_MS,
});

// ============================================================
// Request Interceptor: Attach Access Token
// ============================================================

/**
 * Menambahkan header Authorization: Bearer <access_token> ke setiap request.
 * Jika token tidak tersedia, request tetap dilanjutkan (akan mendapat 401 dari server).
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEYS.ACCESS);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ============================================================
// Response Interceptor: Auto-Refresh Token pada 401
// ============================================================

/**
 * Menangani respons error, terutama 401 Unauthorized.
 * Melakukan auto-refresh token satu kali, lalu retry request asli.
 * Jika refresh gagal, force logout.
 */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // ========== Kondisi untuk mencoba refresh ==========
    // 1. Status error adalah 401 (Unauthorized)
    // 2. Request belum pernah di-retry (tanda _retry)
    // 3. Bukan request ke endpoint /auth/refresh (cegah infinite loop)
    const isUnauthorized = error.response?.status === 401;
    const isNotRetried = !originalRequest._retry;
    const isNotRefreshEndpoint = !originalRequest.url?.includes('/auth/refresh');

    if (isUnauthorized && isNotRetried && isNotRefreshEndpoint) {
      originalRequest._retry = true; // Tandai sudah pernah di-retry

      try {
        const refreshToken = localStorage.getItem(TOKEN_KEYS.REFRESH);
        if (!refreshToken) {
          // Tidak ada refresh token → tidak bisa refresh → force logout
          forceLogout();
          return Promise.reject(error);
        }

        // Gunakan axios biasa (bukan instance api) agar tidak memicu interceptor ini lagi
        const refreshResponse = await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/auth/refresh`,
          { refresh_token: refreshToken }
        );

        const { access_token } = refreshResponse.data;

        // Simpan token baru
        localStorage.setItem(TOKEN_KEYS.ACCESS, access_token);

        // Update header Authorization di request asli dengan token baru
        originalRequest.headers.Authorization = `Bearer ${access_token}`;

        // Retry request asli
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh gagal (token invalid, expired, atau server error)
        forceLogout();
        return Promise.reject(refreshError);
      }
    }

    // Jika tidak memenuhi kondisi refresh, lempar error asli
    return Promise.reject(error);
  }
);

// ============================================================
// Helper: Force Logout
// ============================================================

/**
 * Menghapus semua token dari localStorage dan mengarahkan user ke halaman login.
 * Fungsi ini dipanggil di luar React component tree, sehingga tidak bisa menggunakan
 * hook useNavigate. Menggunakan window.location.href sebagai solusi.
 *
 * Menghindari redirect loop dengan mengecek apakah user sudah di halaman login.
 */
function forceLogout() {
  localStorage.removeItem(TOKEN_KEYS.ACCESS);
  localStorage.removeItem(TOKEN_KEYS.REFRESH);

  // Redirect hanya jika belum berada di halaman login
  if (!window.location.pathname.includes('/login')) {
    window.location.href = '/login';
  }
}

// ============================================================
// Ekspor Instance
// ============================================================
export default api;
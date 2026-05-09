/**
 * contexts/AuthContext.jsx
 *
 * Context provider untuk autentikasi dan manajemen sesi pengguna.
 * Mengelola state login, logout, profile, dan token (access + refresh).
 *
 * ============================================================
 * ALUR AUTENTIKASI DUAL-TOKEN
 * ============================================================
 * 1. Login sukses:
 *    - Server mengembalikan { access_token, refresh_token }
 *    - Keduanya disimpan di localStorage
 * 2. Setiap request API:
 *    - Interceptor menambahkan `Authorization: Bearer <access_token>`
 * 3. Jika access_token expired (res 401):
 *    - Harus di-refresh via endpoint /api/auth/refresh (belum diimplementasikan di context ini)
 * 4. Logout:
 *    - Kirim refresh_token ke DELETE /api/auth/logout untuk revoke di server
 *    - Hapus token dari localStorage
 *    - Reset state context
 *
 * ============================================================
 * PERBAIKAN YANG TELAH DITERAPKAN
 * ============================================================
 * [C1] Backend mengembalikan `access_token` bukan `token`
 * [C2] Profile data ada di `res.data.data` bukan `res.data.user`
 * [C6] Simpan refresh_token di localStorage
 * [M1] Logout mengirim `refresh_token` di body (bukan header)
 *
 * ============================================================
 * PENGGUNAAN
 * ============================================================
 * const { user, login, logout, isAuthenticated } = useAuth();
 * login(email, password) → { success, error }
 * logout() → void
 *
 * ============================================================
 * PANDUAN MAINTENANCE
 * ============================================================
 * - Gunakan `useAuth` hook untuk mengakses context, jangan langsung useContext.
 * - Jika ada perubahan struktur response API, sesuaikan di `login` dan `getProfile`.
 * - Untuk menambahkan auto-refresh token, buat interceptor response 401.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// ============================================================
// Konstanta Role (sinkron dengan backend)
// ============================================================
export const ROLES = {
  ADMIN: 'admin',
  MANAJEMEN: 'management',
  PDO: 'pdo',
  VIEWER: 'viewer',
};

// ============================================================
// Helper: Membuat instance axios dengan baseURL dan interceptor
// ============================================================
const createApiInstance = () => {
  const instance = axios.create({
    baseURL: `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api`,
  });

  // Interceptor request: attach access token ke setiap request
  instance.interceptors.request.use((config) => {
    const token = localStorage.getItem('sakti_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  return instance;
};

// ============================================================
// Auth Context
// ============================================================
const AuthContext = createContext(null);

/**
 * Hook untuk mengakses AuthContext.
 * @throws {Error} Jika digunakan di luar AuthProvider
 * @returns {Object} Nilai context (user, login, logout, dll)
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// ============================================================
// Provider Component
// ============================================================
export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Instance axios yang sudah dikonfigurasi
  const api = createApiInstance();

  // ============================================================
  // Effect: Inisialisasi token dan profil saat mount
  // ============================================================
  useEffect(() => {
    const token = localStorage.getItem('sakti_token');
    if (token) {
      setAuthToken(token);
      // Ambil profil user, lalu matikan loading
      getProfile().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // ============================================================
  // Fungsi: Login
  // ============================================================
  /**
   * Melakukan login dengan email dan password.
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      // [C1] Response mengandung access_token, bukan token
      const { access_token, refresh_token } = res.data;

      // Simpan token di localStorage
      localStorage.setItem('sakti_token', access_token);
      localStorage.setItem('sakti_refresh_token', refresh_token); // [C6]
      setAuthToken(access_token);

      // Ambil profil user setelah login sukses
      await getProfile();
      setIsAuthenticated(true);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.pesan || 'Login gagal',
      };
    }
  };

  // ============================================================
  // Fungsi: Ambil profil user
  // ============================================================
  /**
   * Mengambil data profil dari endpoint /auth/profile.
   * Menyimpan user di state, atau menghapus token jika gagal.
   */
  const getProfile = async () => {
    try {
      const res = await api.get('/auth/profile');
      // [C2] Data profil ada di res.data.data
      setUser(res.data.data);
      setIsAuthenticated(true);
    } catch (err) {
      // Jika token tidak valid, hapus semua sesi lokal
      localStorage.removeItem('sakti_token');
      localStorage.removeItem('sakti_refresh_token');
      setIsAuthenticated(false);
      setUser(null);
      setAuthToken(null);
    }
  };

  // ============================================================
  // Fungsi: Logout
  // ============================================================
  /**
   * Melakukan logout: revoke refresh token di server dan hapus token lokal.
   * Selalu sukses secara lokal meskipun server error (best effort).
   */
  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('sakti_refresh_token');
      if (refreshToken) {
        // [M1] Kirim refresh_token di body (bukan header)
        await api.delete('/auth/logout', { data: { refresh_token: refreshToken } });
      }
    } catch (error) {
      // Tetap lanjutkan logout lokal meskipun server error
      console.warn('[AuthContext] Logout server error:', error.message);
    } finally {
      localStorage.removeItem('sakti_token');
      localStorage.removeItem('sakti_refresh_token');
      setIsAuthenticated(false);
      setUser(null);
      setAuthToken(null);
    }
  };

  // ============================================================
  // Fungsi: Update user secara lokal (misal setelah edit profil)
  // ============================================================
  /**
   * Memperbarui data user di state (tanpa request ke server).
   * Berguna setelah melakukan update profil.
   * @param {Object} updatedData - Data user baru (partial)
   */
  const updateUser = (updatedData) => {
    setUser((prev) => ({ ...prev, ...updatedData }));
  };

  // ============================================================
  // Nilai context yang diekspos
  // ============================================================
  const value = {
    isAuthenticated,
    user,
    authToken,
    login,
    logout,
    updateUser,
    loading,
    ROLES, // konstanta role
  };

  return (
    <AuthContext.Provider value={value}>
      {/* Jangan render children sampai loading selesai */}
      {!loading && children}
    </AuthContext.Provider>
  );
}
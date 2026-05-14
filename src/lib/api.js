/**
 * lib/api.js
 *
 * Instance Axios tunggal untuk seluruh aplikasi SAKTI.
 */

import axios from 'axios';
import { TOKEN_KEYS } from './constants';

// ============================================================
// Konfigurasi Instance Axios
// ============================================================

const REQUEST_TIMEOUT_MS = 30000; // Tambah jadi 30 detik untuk koneksi Railway

/**
 * Mendapatkan base URL yang benar berdasarkan environment
 * - Production (Vercel): Gunakan VITE_API_URL dari environment variable
 * - Development: Gunakan localhost
 */
const getBaseURL = () => {
  // Di production Vercel, gunakan environment variable yang sudah di-set
  if (import.meta.env.PROD) {
    const apiUrl = import.meta.env.VITE_API_URL;
    if (!apiUrl) {
      console.error('VITE_API_URL is not set in production!');
      return 'https://saktiapi-hackinfest2025-production.up.railway.app/api';
    }
    return `${apiUrl}/api`;
  }
  
  // Development mode
  return `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api`;
};

/**
 * Instance axios yang telah dikonfigurasi
 */
const api = axios.create({
  baseURL: getBaseURL(),
  timeout: REQUEST_TIMEOUT_MS,
  withCredentials: true, // Penting: mengirim cookies jika menggunakan session
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// ============================================================
// Request Interceptor: Attach Access Token
// ============================================================

api.interceptors.request.use(
  (config) => {
    // Logging untuk debugging (hanya di development)
    if (import.meta.env.DEV) {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    }
    
    const token = localStorage.getItem(TOKEN_KEYS.ACCESS);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// ============================================================
// Response Interceptor: Auto-Refresh Token pada 401
// ============================================================

api.interceptors.response.use(
  (response) => {
    // Logging untuk debugging (hanya di development)
    if (import.meta.env.DEV) {
      console.log(`[API Response] ${response.status} ${response.config.url}`);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Cek apakah error karena network (backend down)
    if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
      console.error('[Network Error] Backend tidak dapat dijangkau:', error.message);
      // Bisa tampilkan notifikasi ke user
      return Promise.reject({
        ...error,
        userMessage: 'Koneksi ke server gagal. Periksa koneksi internet Anda.'
      });
    }

    // ========== Kondisi untuk mencoba refresh ==========
    const isUnauthorized = error.response?.status === 401;
    const isNotRetried = !originalRequest._retry;
    const isNotRefreshEndpoint = !originalRequest.url?.includes('/auth/refresh');
    const isNotLoginEndpoint = !originalRequest.url?.includes('/auth/login');

    if (isUnauthorized && isNotRetried && isNotRefreshEndpoint && isNotLoginEndpoint) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem(TOKEN_KEYS.REFRESH);
        if (!refreshToken) {
          console.log('[Auth] No refresh token, forcing logout');
          forceLogout();
          return Promise.reject(error);
        }

        console.log('[Auth] Attempting to refresh token...');
        
        // Gunakan axios instance baru untuk menghindari interceptor loop
        const refreshResponse = await axios.post(
          `${getBaseURL()}/auth/refresh`,
          { refresh_token: refreshToken },
          {
            timeout: 10000,
            headers: { 'Content-Type': 'application/json' }
          }
        );

        const { access_token } = refreshResponse.data;
        
        if (access_token) {
          console.log('[Auth] Token refreshed successfully');
          localStorage.setItem(TOKEN_KEYS.ACCESS, access_token);
          
          // Update header di request original
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          
          // Retry original request
          return api(originalRequest);
        } else {
          throw new Error('No access token in refresh response');
        }
        
      } catch (refreshError) {
        console.error('[Auth] Refresh token failed:', refreshError);
        forceLogout();
        return Promise.reject(refreshError);
      }
    }

    // Jika error 401 pada login endpoint, biarkan saja (jangan force logout)
    if (isUnauthorized && originalRequest.url?.includes('/auth/login')) {
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

// ============================================================
// Helper: Force Logout
// ============================================================

function forceLogout() {
  console.log('[Auth] Force logout triggered');
  
  localStorage.removeItem(TOKEN_KEYS.ACCESS);
  localStorage.removeItem(TOKEN_KEYS.REFRESH);
  
  // Hapus juga data user jika ada
  localStorage.removeItem('user');
  
  // Redirect hanya jika tidak sedang di halaman login
  const isLoginPage = window.location.pathname.includes('/login') || 
                      window.location.pathname.includes('/auth/login');
  
  if (!isLoginPage) {
    // Simpan URL saat ini untuk redirect setelah login (opsional)
    sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
    window.location.href = '/login';
  }
}

// ============================================================
// Helper Functions untuk debugging
// ============================================================

/**
 * Cek koneksi ke backend
 */
export const checkHealth = async () => {
  try {
    const response = await api.get('/health');
    return { status: 'ok', data: response.data };
  } catch (error) {
    console.error('[Health Check] Failed:', error.message);
    return { status: 'error', message: error.message };
  }
};

/**
 * Get current API configuration (for debugging)
 */
export const getApiConfig = () => ({
  baseURL: api.defaults.baseURL,
  timeout: api.defaults.timeout,
  withCredentials: api.defaults.withCredentials,
  env: import.meta.env.MODE,
  hasToken: !!localStorage.getItem(TOKEN_KEYS.ACCESS),
});

// ============================================================
// Ekspor Instance
// ============================================================
export default api;
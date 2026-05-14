/**
 * lib/constants.js
 *
 * Single source of truth untuk konstanta yang digunakan di seluruh aplikasi SAKTI.
 * Mengurangi duplikasi string dan memudahkan maintenance ketika ada perubahan.
 *
 * ============================================================
 * ISI FILE
 * ============================================================
 * - API_BASE                 : Base URL backend
 * - TOKEN_KEYS               : Nama key di localStorage
 * - ROLES & otorisasi        : Definisi role dan akses
 * - USER_FIELDS              : Mapping field user (snake_case backend)
 * - PAYLOAD_KEYS             : Key untuk request body ke backend
 * - RESPONSE_KEYS            : Key dalam response JSON dari backend
 * - PAGINATION               : Batas default dan maksimum
 * - UPLOAD                   : Batasan upload file
 * - RATE_LIMIT_MESSAGES      : Pesan error rate limiting
 * - HTTP                     : HTTP status codes
 *
 * ============================================================
 * PANDUAN PENGGUNAAN & SEARCH/REPLACE
 * ============================================================
 * 🔍 Hardcode 'http://localhost:3000'           → ganti dengan API_BASE
 * 🔍 Hardcode 'sakti_token'                     → ganti dengan TOKEN_KEYS.ACCESS
 * 🔍 Hardcode 'sakti_refresh_token'             → ganti dengan TOKEN_KEYS.REFRESH
 * 🔍 User object property 'name'                → ganti dengan USER_FIELDS.FULL_NAME
 * 🔍 Payload key 'workUnitId'                   → ganti dengan PAYLOAD_KEYS.UNIT_ID
 * 🔍 Payload key 'fullName'                     → ganti dengan PAYLOAD_KEYS.FULL_NAME
 * 🔍 Payload key 'currentPw'                    → ganti dengan PAYLOAD_KEYS.CURRENT_PASSWORD
 *
 * ============================================================
 * CATATAN PENTING
 * ============================================================
 * - Role 'pdo' dan 'ppk_manager' TIDAK ADA di backend. Hapus semua referensi.
 * - Semua payload ke backend harus menggunakan snake_case (unit_kerja_id, full_name, dll)
 * - Lihat dokumentasi di masing-masing bagian untuk detail lebih lanjut.
 */

// ============================================================
// API Base URL
// ============================================================

/**
 * Base URL untuk API backend.
 * Diambil dari environment variable VITE_API_URL, fallback ke localhost:3000.
 * JANGAN hardcode URL di komponen.
 */
export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// ============================================================
// LocalStorage Keys
// ============================================================

/**
 * Nama key yang digunakan di localStorage untuk menyimpan token dan data user.
 */
export const TOKEN_KEYS = {
  /** JWT access token (expire 1 jam) */
  ACCESS: 'sakti_token',
  /** Refresh token (expire 7 hari) */
  REFRESH: 'sakti_refresh_token',
  /** Cached user object (opsional) */
  USER: 'sakti_user',
};

// ============================================================
// Role Definitions (sinkron dengan backend)
// ============================================================

/**
 * Role pengguna yang valid sesuai dengan backend (authMiddleware.js).
 * Jangan tambahkan role baru di sini tanpa sinkronisasi dengan backend.
 */
export const ROLES = {
  /** Admin: akses penuh ke semua fitur */
  ADMIN: 'admin',
  /** Management: dapat menulis/mengelola layanan dan marketing kit (unit SBU/PPK) */
  MANAGEMENT: 'management',
  /** Viewer: hanya baca, tidak bisa mengunduh marketing kit */
  VIEWER: 'viewer',
};

/**
 * Role yang diizinkan untuk mengakses fitur Marketing Kit (melihat daftar & download).
 */
export const MARKETING_KIT_ROLES = [ROLES.ADMIN, ROLES.MANAGEMENT];

/**
 * Role yang diizinkan untuk operasi write (buat/edit layanan, marketing kit, portfolio, sektor).
 */
export const WRITE_ROLES = [ROLES.ADMIN, ROLES.MANAGEMENT];

/**
 * Tipe unit kerja yang diizinkan untuk operasi write (untuk role selain admin).
 * Sesuai dengan validasi di backend (authorizeAdvanced).
 */
export const WRITE_UNIT_TYPES = ['sbu', 'ppk'];

// ============================================================
// User Field Names (snake_case dari backend → referensi frontend)
// ============================================================

/**
 * Mapping nama field pada objek user yang diterima dari backend.
 * Backend menggunakan snake_case, jangan diubah ke camelCase di sini.
 *
 * Contoh penggunaan:
 *   const userName = user?.[USER_FIELDS.FULL_NAME];  // user.full_name
 *   const userUnitId = user?.[USER_FIELDS.UNIT_ID];  // user.unit_kerja_id
 */
export const USER_FIELDS = {
  /** Nama lengkap (bukan 'name') */
  FULL_NAME: 'full_name',
  /** Email */
  EMAIL: 'email',
  /** Role (admin, management, viewer) */
  ROLE: 'role',
  /** Objek unit { id, name, type } */
  UNIT: 'unit',
  /** ID unit (UUID) */
  UNIT_ID: 'unit_kerja_id',
  /** Status aktif */
  IS_ACTIVE: 'is_active',
  /** Status verifikasi */
  IS_VERIFIED: 'is_verified',
};

// ============================================================
// Payload Keys (yang dikirim ke backend)
// ============================================================

/**
 * Nama field yang digunakan dalam request body ke backend.
 * Semua harus snake_case sesuai ekspektasi backend.
 *
 * ⚠️ BUG UMUM:
 *   - workUnitId → seharusnya unit_kerja_id
 *   - fullName   → seharusnya full_name
 *   - currentPw  → seharusnya current_password
 *   - newPw      → seharusnya new_password
 */
export const PAYLOAD_KEYS = {
  // Auth
  FULL_NAME: 'full_name',
  EMAIL: 'email',
  PASSWORD: 'password',
  CURRENT_PASSWORD: 'current_password',
  NEW_PASSWORD: 'new_password',
  CONFIRM_PASSWORD: 'confirm_password',
  REFRESH_TOKEN: 'refresh_token',
  UNIT_CHANGE: 'requested_unit_id',

  // User management (admin)
  UNIT_ID: 'unit_kerja_id',
  ROLE: 'role',
  IS_ACTIVE: 'is_active',
  IS_VERIFIED: 'is_verified',

  // Service
  PORTFOLIO_ID: 'portfolio_id',
  SUB_PORTFOLIO_ID: 'sub_portfolio_id',
  SBU_OWNER_ID: 'sbu_owner_id',
  SECTORS: 'sectors',
  SUB_SECTORS: 'sub_sectors',

  // Revenue
  CUSTOMER_NAME: 'customer_name',
  REVENUE: 'revenue',     // harus Number, bukan string

  // Marketing Kit
  FILE_TYPE: 'file_type',
  SERVICE_IDS: 'service_ids',
  PURPOSE: 'purpose',     // wajib untuk download
};

// ============================================================
// Response Keys (yang diterima dari backend)
// ============================================================

/**
 * Nama field dalam response JSON dari backend.
 * Backend selalu menggunakan snake_case.
 */
export const RESPONSE_KEYS = {
  // Auth
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',

  // Collections
  SERVICES: 'services',
  PORTFOLIOS: 'portfolios',
  SECTORS: 'sectors',
  UNITS: 'units',
  USERS: 'users',
  MARKETING_KITS: 'marketing_kits',
  REQUESTS: 'requests',
  LOGS: 'logs',
  STATS: 'stats',

  // Pagination
  TOTAL: 'total',
  PAGE: 'page',
  TOTAL_PAGES: 'total_pages',
};

// ============================================================
// Pagination Constants
// ============================================================

/**
 * Konfigurasi default pagination.
 * - MAX_LIMIT harus sinkron dengan backend (MAX_PAGINATION_LIMIT = 100).
 */
export const PAGINATION = {
  /** Default limit untuk umum */
  DEFAULT_LIMIT: 10,
  /** Limit untuk halaman admin (lebih besar) */
  ADMIN_LIMIT: 30,
  /** Batas maksimum yang diizinkan backend (jangan kirim limit > ini) */
  MAX_LIMIT: 100,
};

// ============================================================
// Upload Constraints (sinkron dengan backend uploadCloudinary.js)
// ============================================================

/**
 * Batasan upload file marketing kit.
 * Nilai-nilai ini harus sinkron dengan konfigurasi di backend.
 */
export const UPLOAD = {
  /** Ukuran maksimum per file (MB) */
  MAX_FILE_SIZE_MB: 10,
  /** Ukuran maksimum per file (bytes) */
  MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024,
  /** Jumlah maksimum file per batch upload */
  MAX_FILES_PER_BATCH: 10,
  /** Format file yang diterima (string untuk atribut accept input) */
  ACCEPTED_FORMATS: '.pdf,.doc,.docx,.ppt,.pptx',
  /** Daftar MIME types yang diterima (untuk validasi tambahan) */
  ACCEPTED_MIME: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ],
  /** Pilihan tipe file untuk dropdown */
  FILE_TYPES: ['Flyer', 'Pitch Deck', 'Brochure', 'Technical Document', 'Others'],
};

// ============================================================
// Rate Limit Error Messages
// ============================================================

/**
 * Pesan error yang ditampilkan saat backend merespon dengan status 429 (Too Many Requests).
 * Disarankan untuk menampilkan pesan yang informatif kepada user.
 */
export const RATE_LIMIT_MESSAGES = {
  /** Saat endpoint login terkena rate limit */
  LOGIN: 'Terlalu banyak percobaan login. Coba lagi dalam 15 menit.',
  /** Saat endpoint forgot-password terkena rate limit */
  FORGOT_PASSWORD: 'Terlalu banyak permintaan. Coba lagi dalam 15 menit.',
  /** Rate limit umum untuk endpoint lain */
  GLOBAL: 'Terlalu banyak permintaan. Harap tunggu sebentar.',
};

// ============================================================
// HTTP Status Codes
// ============================================================

/**
 * Named constants untuk HTTP status codes.
 * Memudahkan pengecekan status di kode tanpa magic numbers.
 */
export const HTTP = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
};
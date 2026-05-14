# 🏆 SAKTI APP — Frontend Client

<div align="center">

[![Champion](https://img.shields.io/badge/🥇_Juara_1-Hackin_Fest_2025-FFD700?style=for-the-badge&labelColor=1B3A6B)](https://www.sucofindo.co.id)
[![Category](https://img.shields.io/badge/Kategori-Inovasi_Layanan-2E86AB?style=for-the-badge)](https://www.sucofindo.co.id)
[![Organizer](https://img.shields.io/badge/Organizer-PT_Sucofindo-00A651?style=for-the-badge)](https://www.sucofindo.co.id)

[![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react&logoColor=white&style=flat-square)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-4.x-646CFF?logo=vite&logoColor=white&style=flat-square)](https://vitejs.dev)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.x-06B6D4?logo=tailwindcss&logoColor=white&style=flat-square)](https://tailwindcss.com)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-10.x-0055FF?logo=framer&logoColor=white&style=flat-square)](https://www.framer.com/motion)
[![Axios](https://img.shields.io/badge/Axios-1.x-5A29E4?logo=axios&logoColor=white&style=flat-square)](https://axios-http.com)
[![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?logo=vercel&logoColor=white&style=flat-square)](https://sakti-drab.vercel.app)

**React SPA frontend untuk aplikasi SAKTI — platform manajemen dan distribusi layanan inspeksi & sertifikasi PT Sucofindo.**

*Dibangun sebagai pemenang pertama Hackin Fest 2025, kategori Inovasi Layanan.*

🌐 **Live Demo**: [sakti-drab.vercel.app](https://sakti-drab.vercel.app) | 🔗 **Backend Repo**: [`sakti-api-hackinfest2025`](https://github.com)

</div>

---

## 📖 Daftar Isi

- [Executive Summary](#-executive-summary)
- [Tech Stack](#️-tech-stack)
- [Arsitektur Aplikasi](#️-arsitektur-aplikasi)
- [State Management & Auth Flow](#-state-management--auth-flow)
- [Edge Case Handling](#-edge-case-handling)
- [Struktur Halaman & Komponen](#️-struktur-halaman--komponen)
- [Integrasi API dengan Backend](#-integrasi-api-dengan-backend)
- [Instalasi & Setup Lokal](#️-instalasi--setup-lokal)
- [Environment Variables](#-environment-variables)
- [Deployment](#-deployment)
- [Keputusan Teknis (Why)](#-keputusan-teknis-why)

---

## 📋 Executive Summary

**SAKTI App** adalah Single Page Application (SPA) berbasis React yang menjadi antarmuka utama platform SAKTI — Sistem Administrasi Katalog dan Teknis Informasi PT Sucofindo. Aplikasi ini ditujukan untuk seluruh unit kerja perusahaan, mulai dari Unit Bisnis (SBU) hingga Manajemen Pusat, dengan pengalaman pengguna yang intuitif meskipun domain bisnisnya kompleks.

### Konteks Bisnis

PT Sucofindo menangani ratusan layanan inspeksi dan sertifikasi yang perlu didistribusikan secara terstandarisasi ke seluruh unit. Frontend SAKTI menyelesaikan tiga masalah sekaligus:

- **Aksesibilitas informasi** — katalog layanan terpusat, bisa dicari dan difilter secara real-time
- **Distribusi marketing material** — download marketing kit dengan audit trail yang aman
- **Administrasi terpusat** — manajemen user, verifikasi akun, dan approval permintaan, semua dalam satu panel

### Peran Pengembang

Dibangun oleh **Fullstack Developer Utama (pihak eksternal)** dari nol hingga production-ready dalam waktu kompetisi. Tanggung jawab penuh atas:

- Seluruh arsitektur frontend: routing, state management, component design
- Implementasi dual-token authentication seamlessly (tanpa logout paksa saat token expire)
- Integrasi 40+ endpoint backend dengan error handling yang konsisten
- UX design yang menyeimbangkan kemudahan akses dengan keamanan data sensitif BUMN
- Deep-scan audit untuk memastikan tidak ada race condition, mismatch naming convention, atau broken API contract dengan backend

### Scope Frontend

| Dimensi | Detail |
|---|---|
| **Halaman utama** | 11 halaman (Login, Register, ForgotPassword, Dashboard, DaftarJasa, DetailService, TambahJasa, EditJasa, MarketingKit, AdminPanel, EditProfile) |
| **Komponen admin** | 6 komponen (AdminStats, UsersManagement, WaitingUsers, UnitChangeRequests, PasswordResetRequests, DownloadLogs) |
| **Komponen layout** | DashboardLayout, Header, Sidebar (role-adaptive navigation) |
| **Role yang dilayani** | `admin`, `management`, `viewer` |
| **Deployed** | Vercel — [sakti-drab.vercel.app](https://sakti-drab.vercel.app) |

---

## 🛠️ Tech Stack

### Core Framework

| Teknologi | Versi | Alasan Pemilihan |
|---|---|---|
| **React** | ^18.2 | Component-based, hooks ecosystem matang, ideal untuk SPA dengan state kompleks |
| **Vite** | ^4.4 | Build tool modern — HMR instan, cold start cepat, bundle production optimal |
| **React Router DOM** | ^6.16 | Deklaratif routing, nested routes, state-based redirect (location.state.from) |

### Styling & Animasi

| Library | Versi | Fungsi |
|---|---|---|
| **Tailwind CSS** | ^3.3 | Utility-first CSS — konsistensi desain, tidak perlu custom CSS file |
| **Framer Motion** | ^10.16 | Animasi halaman dan komponen — `initial/animate/exit` untuk transisi halus |
| **tailwindcss-animate** | ^1.0.7 | Animasi Tailwind untuk komponen Radix UI |
| **clsx + tailwind-merge** | latest | Conditional class merging yang aman tanpa konflik Tailwind |

### Komponen UI

| Library | Fungsi |
|---|---|
| **Radix UI** (alert-dialog, dialog, dropdown-menu, label, popover, select, tabs, toast, checkbox, slider, avatar) | Headless, accessible UI primitives — keyboard navigation, ARIA compliant |
| **Lucide React** | ^0.285 | Icon library yang konsisten dan tree-shakeable |
| **cmdk** | ^0.2 | Command palette / combobox untuk dropdown layanan yang searchable |
| **shadcn/ui patterns** | Custom | Toast system, Card, Table, Badge, Input, Button — semua dikustomisasi untuk brand SAKTI |

### HTTP & State

| Library | Fungsi |
|---|---|
| **Axios** | ^1.10 | HTTP client dengan interceptor — response interceptor untuk auto-refresh JWT |
| **React Context API** | Built-in | Global state untuk auth (user, token, isAuthenticated, loading) |

### Utilitas

| Library | Fungsi |
|---|---|
| **React Helmet** | ^6.1 | Dynamic `<title>` dan `<meta>` per halaman untuk SEO dan tab labeling |
| **React Quill** | ^2.0 | Rich text editor untuk field deskripsi layanan (overview, scope, benefit, output) |
| **xlsx** | ^0.18.5 | Export data ke format spreadsheet |
| **DOMPurify** | ^3.2 | Sanitasi HTML dari rich text editor sebelum render |
| **Sonner** | ^2.0 | Toast notification alternatif |

### Build & Development

| Tool | Fungsi |
|---|---|
| **@vitejs/plugin-react** | Babel transform untuk JSX dan Fast Refresh |
| **Terser** | Minifikasi JavaScript di production build |
| **ESLint** | Static analysis — `eslint-config-react-app` |
| **PostCSS + Autoprefixer** | CSS post-processing untuk browser compatibility |

### Integrasi Eksternal

| Layanan | Fungsi |
|---|---|
| **Botpress Webchat** | AI assistant terintegrasi di halaman Login dan Dashboard — context-aware chatbot untuk panduan platform |
| **Vercel** | Deployment dan CDN global |

---

## 🏗️ Arsitektur Aplikasi

### Struktur Direktori

```
sakti-app-hackinfest2025/
│
├── index.html                          # Entry HTML — mount point #root
├── vite.config.js                      # Build config: alias @/, plugins, CSP headers
├── tailwind.config.js                  # Design tokens, dark mode config
├── postcss.config.js                   # PostCSS plugins
│
├── src/
│   ├── main.jsx                        # ReactDOM.createRoot → render <App />
│   ├── App.jsx                         # Root: AuthProvider, Router, Guards, BotpressInitializer
│   ├── index.css                       # Global CSS: CSS variables, Tailwind directives
│   │
│   ├── lib/
│   │   ├── api.js                      # Axios instance + response interceptor (auto-refresh JWT)
│   │   ├── utils.js                    # cn() — class name merger (clsx + tailwind-merge)
│   │   ├── youtube.js                  # YouTube URL parser / embed helper
│   │   └── customSupabaseClient.js     # Supabase client (legacy / opsional)
│   │
│   ├── contexts/
│   │   └── AuthContext.jsx             # Global auth state: user, token, login, logout, updateUser
│   │
│   ├── hooks/
│   │   ├── use-auth.js                 # Re-export useAuth dari AuthContext (convenience hook)
│   │   └── useBotpressLoader.js        # Custom hook: inject/destroy Botpress per route
│   │
│   ├── pages/                          # Route-level components (satu file per halaman)
│   │   ├── LoginPage.jsx               # Form login + redirect ke halaman asal (location.state.from)
│   │   ├── RegistrationPage.jsx        # Form pendaftaran akun baru
│   │   ├── ForgotPasswordPage.jsx      # Request reset password ke admin
│   │   ├── Dashboard.jsx               # Landing page post-login + SAKTI AI Assistant (Botpress)
│   │   ├── DaftarJasa.jsx              # Katalog layanan: search, filter, sort, pagination, revenue modal
│   │   ├── DetailService.jsx           # Detail layanan + marketing kit download
│   │   ├── TambahJasa.jsx              # Form buat layanan baru + inline master data management
│   │   ├── EditJasa.jsx                # Form edit layanan existing
│   │   ├── MarketingKit.jsx            # Daftar file marketing + upload + download + delete
│   │   ├── AdminPanel.jsx              # Tab-based admin dashboard (5 modul)
│   │   └── EditProfilePage.jsx         # Ganti nama, password, dan unit kerja
│   │
│   ├── components/
│   │   ├── DownloadFormModal.jsx       # Modal konfirmasi download (isi purpose, audit trail)
│   │   ├── PortfolioDropdown.jsx       # Searchable dropdown untuk portfolio selection
│   │   │
│   │   ├── layout/
│   │   │   ├── DashboardLayout.jsx     # Wrapper: Sidebar + Header + main content
│   │   │   ├── Sidebar.jsx             # Role-adaptive navigation: navConfig per role
│   │   │   └── Header.jsx              # Top bar: mobile menu toggle, user info
│   │   │
│   │   ├── admin/
│   │   │   ├── AdminStats.jsx          # Dashboard statistik: 6 metric cards
│   │   │   ├── UsersManagement.jsx     # CRUD user: create, edit, delete, view temp password
│   │   │   ├── WaitingUsers.jsx        # Approval/rejection pendaftaran user baru
│   │   │   ├── UnitChangeRequests.jsx  # Approval perubahan unit kerja user
│   │   │   ├── PasswordResetRequests.jsx # Proses reset password untuk user
│   │   │   ├── DownloadLogs.jsx        # Audit log semua aktivitas download marketing kit
│   │   │   ├── UploadFile.jsx          # Upload marketing kit dengan service assignment
│   │   │   ├── EditFormModal.jsx       # Modal edit metadata marketing kit
│   │   │   └── mockData.js             # Fallback data untuk development
│   │   │
│   │   └── ui/                         # shadcn/ui komponen (dikustomisasi)
│   │       ├── button.jsx, card.jsx, input.jsx, label.jsx
│   │       ├── table.jsx, badge.jsx, skeleton.jsx
│   │       ├── dialog.jsx, alert-dialog.jsx
│   │       ├── select.jsx, popover.jsx, command.jsx, dropdown-menu.jsx
│   │       ├── toast.jsx, toaster.jsx, use-toast.js, textarea.jsx
│   │       └── ResponsiveSelect.jsx    # Select wrapper dengan fallback mobile-friendly
│
├── public/                             # Static assets
│   └── sakti.png, simbol.png           # Brand logo
│
└── tools/
    └── generate-llms.js                # Pre-build script untuk LLM context generation
```

### Application Flow

```
Browser
  │
  ▼
main.jsx → ReactDOM.createRoot()
  │
  ▼
App.jsx
  ├── <AuthProvider>          # Inisialisasi state auth dari localStorage saat startup
  │     └── Baca sakti_token → getProfile() → setUser() → setIsAuthenticated(true)
  │
  ├── <Router>
  │     ├── <BotpressInitializer>    # Listen location.pathname → inject/open Botpress
  │     │
  │     └── <AppRoutes>
  │           ├── /login, /register, /forgot-password  → Publik
  │           ├── /dashboard, /daftar-jasa, ...        → <ProtectedRoute>
  │           │     └── Cek isAuthenticated → redirect ke /login jika false
  │           └── /marketing-kit, /admin               → <RoleProtectedRoute>
  │                 └── Cek user.role → redirect ke / jika tidak diizinkan
  │
  └── <Toaster>              # Global toast notifications
```

### Role-Based Navigation (Sidebar)

Sidebar menyesuaikan navigasi secara otomatis berdasarkan role user yang login:

| Route | `admin` | `management` | `viewer` |
|---|---|---|---|
| Dashboard | ✅ | ✅ | ✅ |
| Daftar Layanan | ✅ | ✅ | ✅ |
| Marketing Kit | ✅ | ✅ | — |
| Admin Panel | ✅ | — | — |

---

## 🔐 State Management & Auth Flow

### AuthContext — Single Source of Truth

Seluruh state autentikasi dikelola dalam satu `AuthContext` yang di-provide di root aplikasi:

```javascript
// Nilai yang tersedia di seluruh aplikasi via useAuth()
{
  isAuthenticated: boolean,
  user: {
    id, full_name, email, role,
    unit: { id, name, type },
    is_active, is_verified, last_login
  },
  authToken: string,          // access token (JWT)
  login(email, password),     // → simpan token, fetch profile
  logout(),                   // → revoke refresh token, clear localStorage
  updateUser(data),           // → update user state lokal
  loading: boolean,           // → cegah render sebelum auth resolve
  ROLES: { ADMIN, MANAJEMEN, PDO, VIEWER }
}
```

### Token Lifecycle

```
[Startup]
  localStorage.getItem('sakti_token')
    → ada  → getProfile() → setUser() → render app
    → tidak ada → setLoading(false) → render /login

[Login]
  POST /auth/login { email, password }
    → response: { access_token, refresh_token }
    → localStorage.setItem('sakti_token', access_token)
    → localStorage.setItem('sakti_refresh_token', refresh_token)
    → getProfile() → setUser()
    → navigate ke halaman asal (location.state.from)

[Setiap API Request]
  AuthContext axios instance (request interceptor)
    → attach Authorization: Bearer <sakti_token>

[Token Expire → Auto-Refresh — api.js response interceptor]
  Jika response 401 && !config._retry:
    → config._retry = true
    → POST /auth/refresh { refresh_token }
    → simpan access_token baru ke localStorage
    → retry request asli dengan token baru
    → user tidak merasakan logout

[Refresh Gagal]
  → removeItem('sakti_token'), removeItem('sakti_refresh_token')
  → window.location.href = '/login'

[Logout]
  → DELETE /auth/logout { refresh_token } (revoke di backend)
  → clear localStorage
  → setIsAuthenticated(false), setUser(null)
```

### Dua Axios Instance — Pembagian Tanggung Jawab

| Instance | File | Interceptor | Digunakan untuk |
|---|---|---|---|
| `api` (AuthContext) | `AuthContext.jsx` | Request: attach token | Semua call yang membutuhkan `getProfile`, `login`, `logout` |
| `api` (default) | `lib/api.js` | Response: auto-refresh 401 | Semua API call dari halaman dan komponen |

---

## 🛡️ Edge Case Handling

### 1. Loading States

Setiap halaman memiliki loading state yang eksplisit untuk menghindari flash of empty content:

```jsx
// Skeleton loader di DetailService.jsx
if (loading) return (
  <div className="animate-pulse space-y-6">
    <div className="h-40 rounded-3xl bg-gradient-to-r from-indigo-100 to-blue-100" />
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="h-40 bg-white rounded-2xl border" />
      </div>
    </div>
  </div>
);
```

Pattern yang konsisten di seluruh aplikasi:
- **Skeleton animation** untuk konten yang belum loaded (`animate-pulse` + placeholder shapes)
- **Disabled button** dengan teks "Memproses..." saat form di-submit
- **Loading spinner** untuk operasi async yang panjang
- **Auth loading gate** — `AuthProvider` tidak render children sampai `loading === false`, mencegah flash redirect

### 2. HTTP Error Handling

| Status | Handling |
|---|---|
| **401 Unauthorized** | Auto-refresh via response interceptor di `api.js` — user tidak logout paksa |
| **401 (refresh gagal)** | Clear storage + redirect `/login` |
| **429 Too Many Requests** | Toast error dengan pesan spesifik — ForgotPasswordPage menginformasikan user |
| **403 Forbidden** | `RoleProtectedRoute` — redirect ke `/` sebelum request bahkan dibuat |
| **404 Not Found** | Halaman menampilkan state kosong yang informatif |
| **500 Server Error** | Toast error dengan pesan generik + log ke console |
| **Network Error** | Catch block dengan toast "Terjadi kesalahan, silakan coba lagi" |

### 3. Race Condition Prevention

**Debounce pada search input** di `DaftarJasa.jsx` dan `MarketingKit.jsx`:

```jsx
// DaftarJasa.jsx — useMemo debounce pattern
const debouncedSearch = useMemo(() => {
  let t;
  return (val) => {
    clearTimeout(t);
    t = setTimeout(() => setSearchTerm(val), 300);
  };
}, []);

// MarketingKit.jsx — useEffect cleanup debounce
const [inputSearch, setInputSearch] = useState('');
useEffect(() => {
  const t = setTimeout(() => setSearchTerm(inputSearch), 300);
  return () => clearTimeout(t); // cleanup mencegah state update setelah unmount
}, [inputSearch]);
```

**Auth loading gate** mencegah render sebelum status autentikasi diketahui:

```jsx
// AuthProvider — tidak render app sampai auth resolve
return (
  <AuthContext.Provider value={value}>
    {!loading && children}
  </AuthContext.Provider>
);
```

### 4. Form Validation

- **Client-side validation** sebelum request dikirim (field kosong, format email, kekuatan password)
- **Password strength meter** di `EditProfilePage.jsx` — 5-level visual feedback (rose → amber → lime → emerald)
- **Rich text sanitization** — konten dari ReactQuill disanitasi dengan DOMPurify sebelum disimpan
- **Duplicate submission prevention** — tombol submit di-disable saat `loading === true`

### 5. Responsive Design

Layout yang sepenuhnya responsive dengan breakpoint Tailwind:

```
Mobile (< 768px)
  → Sidebar tersembunyi, toggle via hamburger di Header
  → Grid layout collapse ke single column
  → Table dengan horizontal scroll
  → Modal full-screen

Tablet (768px – 1024px)
  → Sidebar semi-visible, overlay on toggle
  → 2-column grid untuk cards

Desktop (> 1024px)
  → Sidebar fixed 256px (lg:ml-64 pada main content)
  → Multi-column grid untuk dashboard cards
  → Modal centered dengan max-width
```

---

## 🗺️ Struktur Halaman & Komponen

### Halaman Publik (tanpa autentikasi)

**`/login` — LoginPage**
- Form login dengan show/hide password toggle
- Redirect ke halaman asal setelah login berhasil (`location.state.from`)
- Integrasi Botpress Assistant sebagai panduan login
- Framer Motion entrance animation

**`/register` — RegistrationPage**
- Form pendaftaran: nama, email, password, konfirmasi password, unit kerja, role
- Unit kerja di-fetch dari public endpoint `/api/units` (tidak butuh token)
- Status akun pending verifikasi admin setelah daftar

**`/forgot-password` — ForgotPasswordPage**
- Form email untuk request reset password ke admin
- Response selalu sukses (tidak bocorkan info email terdaftar)

### Halaman Protected (butuh login)

**`/dashboard` — Dashboard**
- Welcome card dengan nama dan unit kerja user
- SAKTI AI Assistant (Botpress) terintegrasi penuh — chatbot kontekstual untuk panduan platform
- Botpress hanya di-init sekali via `BotpressInitializer` di `App.jsx`

**`/daftar-jasa` — DaftarJasa**
- Tabel layanan dengan server-side pagination (10 per halaman)
- Multi-filter: portfolio, sektor, search (debounce 300ms)
- Server-side sort: nama layanan (asc/desc)
- Revenue modal: tambah data pelanggan per layanan
- Delete confirmation dialog (AlertDialog)
- Role guard: `viewer` dan `cabang` tidak bisa edit/hapus

**`/service/:id` — DetailService**
- Detail lengkap layanan: overview, scope, benefit, output, regulasi
- Marketing kit list dengan download modal (audit purpose)
- Data pelanggan (revenue) per layanan
- Skeleton loader saat fetching

**`/tambah-jasa` — TambahJasa**
- Form lengkap dengan rich text editor (ReactQuill) untuk deskripsi
- Searchable dropdown (cmdk Command) untuk portfolio, sub-portfolio, sektor
- Inline master data management: buat portfolio/sektor baru langsung dari form
- Multi-select sektor dan sub-sektor

**`/edit-service/:id` — EditJasa**
- Form edit dengan data pre-filled dari API
- Semua field dari TambahJasa tersedia untuk di-update

**`/marketing-kit` — MarketingKit** *(admin + management)*
- Grid/list marketing kit dengan filter tipe dan layanan
- Upload modal: multi-file dengan assignment ke layanan
- Download modal: isi tujuan penggunaan → audit trail
- Edit metadata modal
- Delete dengan konfirmasi

**`/admin` — AdminPanel** *(admin only)*

Tab-based dashboard dengan 5 modul:

| Tab | Komponen | Fungsi |
|---|---|---|
| Management User | `UsersManagement` | CRUD user, filter, sort, lihat password sementara |
| Pending Users | `WaitingUsers` | Approve/reject pendaftaran baru |
| Pending Unit Change | `UnitChangeRequests` | Approve/reject permintaan pindah unit |
| Reset Password Requests | `PasswordResetRequests` | Proses reset password dengan password sementara |
| Log Download | `DownloadLogs` | Audit trail semua aktivitas download marketing kit |

**`/edit-profile` — EditProfilePage**
- Update nama profil
- Ganti password dengan strength meter visual (5 level)
- Request pindah unit kerja (dikirim ke admin untuk approval)
- Show/hide password toggle

---

## 🔗 Integrasi API dengan Backend

### Base URL & Konfigurasi

```javascript
// lib/api.js — instance utama untuk semua halaman dan komponen
const api = axios.create({
  baseURL: 'http://localhost:3000/api',  // ganti dengan VITE_API_URL di production
});

// AuthContext.jsx — instance terpisah dengan request interceptor
const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api`,
});
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sakti_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

### Naming Convention — Kontrak dengan Backend

Seluruh payload yang dikirim menggunakan `snake_case` sesuai kontrak Backend:

| Field Frontend | Field Backend | Keterangan |
|---|---|---|
| `access_token` | `access_token` | Dari response login |
| `refresh_token` | `refresh_token` | Dari response login, disimpan di localStorage |
| `full_name` | `full_name` | Profil user (bukan `name`) |
| `unit_kerja_id` | `unit_kerja_id` | ID unit kerja user |
| `portfolio_id` | `portfolio_id` | FK layanan ke portfolio |
| `sub_portfolio_id` | `sub_portfolio_id` | FK layanan ke sub portfolio |
| `sbu_owner_id` | `sbu_owner_id` | ID unit pemilik layanan |
| `customer_name` | `customer_name` | Nama pelanggan di revenue |
| `file_type` | `file_type` | Tipe file marketing kit |
| `service_ids[]` | `service_ids[]` | Array ID layanan terkait kit |
| `current_password` | `current_password` | Untuk ganti password |
| `new_password` | `new_password` | Password baru |

### Endpoint yang Digunakan

| Endpoint | Halaman/Komponen | Method |
|---|---|---|
| `/auth/login` | LoginPage | POST |
| `/auth/refresh` | api.js interceptor | POST |
| `/auth/profile` | AuthContext | GET |
| `/auth/logout` | AuthContext | DELETE |
| `/auth/forgot-password` | ForgotPasswordPage | POST |
| `/auth/update-password` | EditProfilePage | PUT |
| `/auth/unit-change-request` | EditProfilePage | POST |
| `/services` | DaftarJasa | GET |
| `/services/:id` | DetailService | GET |
| `/services` | TambahJasa | POST |
| `/services/:id` | EditJasa | GET, PUT |
| `/services/:id` | DaftarJasa | DELETE |
| `/services/:id/revenue` | DaftarJasa | POST |
| `/portfolios` | TambahJasa, DaftarJasa | GET, POST |
| `/portfolios/:id/sub-portfolios` | TambahJasa | GET, POST |
| `/sectors` | TambahJasa, DaftarJasa | GET, POST |
| `/sectors/:id/sub-sectors` | TambahJasa | GET, POST |
| `/units` | RegistrationPage, EditProfilePage | GET |
| `/marketing-kits` | MarketingKit | GET |
| `/marketing-kits` | UploadFile | POST |
| `/marketing-kits/:id` | EditFormModal | PUT |
| `/marketing-kits/:id` | MarketingKit | DELETE |
| `/marketing-kits/:id/download` | DownloadFormModal | POST |
| `/admin/dashboard` | AdminStats | GET |
| `/admin/users` | UsersManagement | GET, POST, PUT, DELETE |
| `/admin/users/:id/temporary-password` | UsersManagement | GET |
| `/admin/waiting-users` | WaitingUsers | GET |
| `/admin/waiting-users/:id/approve` | WaitingUsers | POST |
| `/admin/waiting-users/:id/reject` | WaitingUsers | POST |
| `/admin/unit-change-requests` | UnitChangeRequests | GET |
| `/admin/unit-change-requests/:id/process` | UnitChangeRequests | PUT |
| `/admin/password-reset-requests` | PasswordResetRequests | GET |
| `/admin/password-reset-requests/:id/reset` | PasswordResetRequests | POST |
| `/admin/download-logs` | DownloadLogs | GET |

---

## ⚙️ Instalasi & Setup Lokal

### Prasyarat

- Node.js >= 18.x
- npm >= 9.x
- Backend `sakti-api-hackinfest2025` berjalan di `localhost:3000`

### Langkah Instalasi

```bash
# 1. Clone repository
git clone https://github.com/[username]/sakti-app-hackinfest2025.git
cd sakti-app-hackinfest2025

# 2. Install dependencies
npm install

# 3. Buat file environment
cp .env.example .env
# Edit .env — minimal set VITE_API_URL

# 4. Jalankan development server
npm run dev
# App berjalan di http://localhost:5173
```

### Scripts yang Tersedia

```bash
npm run dev      # Development server dengan HMR (Vite)
npm run build    # Production build ke dist/
npm run preview  # Preview production build secara lokal
```

### Prasyarat Backend

Pastikan backend sudah berjalan dan `.env` backend sudah dikonfigurasi dengan benar sebelum menjalankan frontend. Frontend akan mencoba fetch ke `VITE_API_URL` atau fallback ke `http://localhost:3000`.

---

## 🔧 Environment Variables

```env
# URL Backend API — wajib diisi untuk production
# Development fallback: http://localhost:3000
VITE_API_URL=https://your-backend-api.railway.app
```

> **Catatan**: Semua variabel environment di Vite harus diawali `VITE_` agar terbaca di browser. Jangan menyimpan secret di sini karena akan ter-bundle ke JavaScript publik.

### Konfigurasi Vercel

Buat file `vercel.json` di root untuk SPA routing:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

Tanpa ini, direct URL access ke `/dashboard` atau `/daftar-jasa` akan mengembalikan 404 dari Vercel.

---

## 🚀 Deployment

Aplikasi di-deploy ke Vercel dengan konfigurasi berikut:

1. **Connect repository** ke Vercel
2. **Build command**: `npm run build`
3. **Output directory**: `dist`
4. **Environment variables**: Set `VITE_API_URL` ke URL backend production (Railway)
5. **Routing**: File `vercel.json` sudah dikonfigurasi untuk SPA fallback

Live URL: [sakti-drab.vercel.app](https://sakti-drab.vercel.app)

---

## 💡 Keputusan Teknis (Why)

### Mengapa React, bukan Vue atau Svelte?

React memiliki ekosistem komponen terkaya untuk use case enterprise — khususnya Radix UI yang menyediakan accessible, headless UI primitives. Untuk dashboard admin yang kompleks dengan banyak modal, dialog, dan dropdown, Radix UI menghemat waktu implementasi yang signifikan tanpa mengorbankan accessibility.

### Mengapa Vite, bukan Create React App?

CRA sudah deprecated dan bundle yang dihasilkan lebih besar. Vite dengan plugin React memberikan HMR instan, cold start dalam milidetik, dan bundle production yang lebih kecil berkat Rollup. Untuk timeline hackathon, produktivitas development sangat krusial.

### Mengapa Tailwind CSS?

Utility-first memungkinkan konsistensi desain tanpa perlu mendefinisikan class name custom. Seluruh tim bisa membaca dan menulis styling langsung di JSX tanpa berpindah konteks ke file CSS terpisah. `tailwind-merge` + `clsx` memastikan tidak ada konflik class ketika kondisional.

### Mengapa React Context API, bukan Redux atau Zustand?

State yang perlu dishare secara global hanya satu: auth state (user, token, isAuthenticated). Untuk scope ini, Context API lebih dari cukup dan tidak membutuhkan dependency tambahan. Redux over-engineered untuk use case ini; Zustand bisa jadi alternatif valid tapi tidak diperlukan.

### Mengapa dua Axios instance?

`AuthContext.jsx` membutuhkan request interceptor untuk attach token ke setiap call. `lib/api.js` membutuhkan response interceptor untuk auto-refresh JWT. Memisahkan keduanya mencegah circular dependency: jika satu instance, response interceptor yang memanggil `/auth/refresh` akan kembali masuk ke interceptor yang sama, menciptakan infinite loop.

### Mengapa Framer Motion?

Animasi masuk/keluar yang halus membuat aplikasi terasa lebih polished dan profesional — penting untuk kesan pertama saat demo ke juri. `initial/animate` pattern membuat semua animasi deklaratif dan mudah dikustomisasi tanpa CSS keyframes manual.

### Mengapa Botpress di Dashboard?

AI assistant yang kontekstual memberikan nilai tambah nyata bagi pengguna baru yang belum familiar dengan struktur layanan Sucofindo. Ini adalah diferensiasi kompetitif yang kuat dalam konteks "Inovasi Layanan" — bukan sekadar fitur kosmetik.

### Mengapa debounce 300ms pada search?

Tanpa debounce, setiap keystroke akan memicu API call. Dengan debounce 300ms, API hanya dipanggil setelah user berhenti mengetik — mengurangi beban server ~80% untuk query search. Ini juga memberikan UX yang lebih baik karena hasil tidak berkedip setiap karakter.

### Mengapa `location.state.from` pada redirect login?

Jika user mengakses `/daftar-jasa` tanpa login, mereka di-redirect ke `/login` dengan state `{ from: '/daftar-jasa' }`. Setelah login berhasil, mereka langsung dikembalikan ke halaman yang awalnya dituju — bukan selalu ke `/dashboard`. Ini detail UX kecil yang membuat pengalaman terasa lebih natural.

---

*Dibuat untuk Hackin Fest 2025 — PT Sucofindo | 🥇 Juara 1 Kategori Inovasi Layanan*

*Backend API: [`sakti-api-hackinfest2025`](https://github.com) | Frontend App: `sakti-app-hackinfest2025`*

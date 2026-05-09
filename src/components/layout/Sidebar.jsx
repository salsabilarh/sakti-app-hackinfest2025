/**
 * components/Sidebar.jsx
 *
 * Komponen sidebar navigasi aplikasi yang responsif untuk desktop dan mobile.
 * Menampilkan menu navigasi berdasarkan role user, dengan animasi active state.
 * Mendukung toggle untuk mobile (drawer).
 *
 * ============================================================
 * PROPS
 * ============================================================
 * @param {boolean} isMobileOpen - Status buka/tutup sidebar di mobile (controlled)
 * @param {function} onToggleMobile - Callback untuk toggle sidebar mobile
 *
 * ============================================================
 * STRUKTUR NAVIGASI BERDASARKAN ROLE
 * ============================================================
 * ADMIN       : Dashboard, Daftar Layanan, Marketing Kit, Admin Panel
 * MANAJEMEN   : Dashboard, Daftar Layanan, Marketing Kit
 * PDO         : Dashboard, Daftar Layanan, Marketing Kit
 * VIEWER      : Dashboard, Daftar Layanan
 *
 * ============================================================
 * PANDUAN MAINTENANCE
 * ============================================================
 * - Ubah `navConfig` jika ada perubahan role atau menu baru.
 * - Semua menu diambil dari `allNavigation`; filter berdasarkan role.
 * - Sidebar memiliki dua mode: desktop (fixed, visible) dan mobile (drawer).
 * - Menggunakan Framer Motion untuk animasi background active item.
 * - User card footer dapat diaktifkan/dinonaktifkan sesuai kebutuhan.
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, Briefcase, FolderDown, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { ROLES } from '@/constants/roles';

// ============================================================
// Konfigurasi Navigasi Berdasarkan Role
// ============================================================

/**
 * Mapping role ke daftar nama menu yang dapat diakses.
 * Nama menu harus sesuai dengan `name` di `allNavigation`.
 */
const navConfig = {
  [ROLES.ADMIN]: ['Dashboard', 'Daftar Layanan', 'Marketing Kit', 'Admin Panel'],
  [ROLES.MANAJEMEN]: ['Dashboard', 'Daftar Layanan', 'Marketing Kit'],
  [ROLES.PDO]: ['Dashboard', 'Daftar Layanan', 'Marketing Kit'],
  [ROLES.VIEWER]: ['Dashboard', 'Daftar Layanan'],
};

/**
 * Daftar semua item navigasi yang tersedia di aplikasi.
 * Setiap item memiliki:
 * - name: nama tampilan (harus match dengan navConfig)
 * - href: path URL
 * - icon: komponen ikon dari lucide-react
 */
const allNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Daftar Layanan', href: '/daftar-jasa', icon: Briefcase },
  { name: 'Marketing Kit', href: '/marketing-kit', icon: FolderDown },
  { name: 'Admin Panel', href: '/admin', icon: ShieldCheck },
];

// ============================================================
// Subkomponen: UserMiniCard (untuk footer sidebar)
// ============================================================

/**
 * Menampilkan kartu kecil informasi user di footer sidebar.
 * @param {Object} props
 * @param {Object} props.user - Data user dari AuthContext
 * @returns {JSX.Element|null}
 */
function UserMiniCard({ user }) {
  if (!user) return null;

  // Ambil inisial dari nama (max 2 huruf)
  const initials = (user.full_name || '')
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() || '')
    .join('');

  const roleLabel = user.role || 'user';

  return (
    <div className="m-3 p-3 rounded-2xl border border-gray-100 bg-gradient-to-b from-white to-gray-50">
      <div className="flex items-center gap-3">
        <div className="size-9 rounded-xl grid place-items-center bg-indigo-50 text-[#000476] font-bold">
          {initials || '?'}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold truncate">{user.full_name}</div>
          <div className="text-[11px] text-gray-500 truncate">{user.email}</div>
        </div>
      </div>
      <div className="mt-2">
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-blue-50 text-[#000476]">
          {roleLabel}
        </span>
      </div>
    </div>
  );
}

// ============================================================
// Komponen Utama: Sidebar
// ============================================================

/**
 * Sidebar navigasi yang responsif.
 * @param {Object} props
 * @param {boolean} props.isMobileOpen - Status sidebar mobile (open/closed)
 * @param {function} props.onToggleMobile - Fungsi toggle untuk mobile drawer
 * @returns {JSX.Element}
 */
function Sidebar({ isMobileOpen, onToggleMobile }) {
  const location = useLocation();
  const { user } = useAuth();

  // Filter menu berdasarkan role user
  const accessibleMenus = user?.role && navConfig[user.role] ? navConfig[user.role] : [];
  const visibleNavigation = allNavigation.filter((item) =>
    accessibleMenus.includes(item.name)
  );

  // ============================================================
  // Komponen Item Navigasi (dengan animasi active)
  // ============================================================
  const NavItem = ({ item }) => {
    // Deteksi apakah item sedang aktif (exact match atau starts with)
    const isActive =
      location.pathname === item.href || location.pathname.startsWith(item.href + '/');

    return (
      <Link
        key={item.name}
        to={item.href}
        onClick={() => {
          if (onToggleMobile) onToggleMobile();
        }}
        className={cn(
          'group relative flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors',
          isActive
            ? 'text-[#000476]'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
        )}
      >
        {/* Active rail (garis vertikal di kiri) */}
        <span
          className={cn(
            'absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-gradient-to-b from-indigo-500 to-sky-400 transition-opacity',
            isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'
          )}
        />
        {/* Icon container */}
        <div
          className={cn(
            'relative z-10 grid place-items-center size-8 rounded-lg ring-1 ring-gray-100',
            isActive
              ? 'bg-indigo-50 text-[#000476]'
              : 'bg-white text-gray-400 group-hover:text-gray-700'
          )}
        >
          <item.icon className="w-4.5 h-4.5" />
        </div>
        {/* Label */}
        <span className="relative z-10">{item.name}</span>

        {/* Floating background untuk active item (Framer Motion) */}
        {isActive && (
          <motion.div
            layoutId="sidebar-active-blob"
            className="absolute inset-0 rounded-xl -z-10 bg-gradient-to-r from-indigo-50 to-white"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        )}
      </Link>
    );
  };

  // ============================================================
  // Konten Sidebar (dipakai untuk desktop dan mobile)
  // ============================================================
  const sidebarContent = (
    <div className="w-64 h-full flex flex-col bg-white border-r border-gray-200">
      {/* Brand / Logo */}
      <div className="border-b border-gray-200">
        <Link to="/dashboard" className="flex items-center justify-center h-20">
          <img
            src="../../sakti.png"
            alt="SAKTI Logo"
            className="h-15 object-contain"
          />
        </Link>
      </div>

      {/* Navigasi menu */}
      <nav className="flex-1 p-3 overflow-y-auto bg-gradient-to-b from-white to-gray-50/60">
        <div className="space-y-1">
          {visibleNavigation.map((item) => (
            <NavItem key={item.name} item={item} />
          ))}
        </div>
      </nav>

      {/* Footer: versi aplikasi (UserMiniCard dikomentari karena tidak digunakan) */}
      <div className="border-t border-gray-200 bg-white">
        {/* <UserMiniCard user={user} /> */}
        <div className="px-4 pb-3 text-[10px] text-gray-400">v1.0 • © SAKTI</div>
      </div>
    </div>
  );

  // ============================================================
  // Render: Mobile Overlay + Drawer + Desktop Sidebar
  // ============================================================
  return (
    <>
      {/* Mobile overlay (transparan hitam, klik untuk tutup) */}
      <div
        className={cn(
          'lg:hidden fixed inset-0 bg-black/50 z-40 transition-opacity',
          isMobileOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        )}
        onClick={onToggleMobile}
      />

      {/* Mobile drawer (bergeser dari kiri) */}
      <div
        className={cn(
          'lg:hidden fixed top-0 left-0 h-full w-64 z-50 transform transition-transform duration-300',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="h-full shadow-2xl">{sidebarContent}</div>
      </div>

      {/* Desktop sidebar (selalu tampil di kiri) */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:h-full lg:fixed">
        <div className="h-full shadow-sm">{sidebarContent}</div>
      </div>
    </>
  );
}

export default Sidebar;
/**
 * components/Header.jsx
 *
 * Komponen header aplikasi yang menampilkan informasi user, menu dropdown,
 * dan tombol logout. Header bersifat sticky di bagian atas halaman.
 *
 * ============================================================
 * PROPS
 * ============================================================
 * @param {function} onToggleMobile - Callback untuk toggle sidebar mobile
 *
 * ============================================================
 * PANDUAN MAINTENANCE
 * ============================================================
 * - Role badge colors: dapat disesuaikan di object `roleColorMap`
 * - Inisial nama diambil dari 2 kata pertama (max 2 huruf)
 * - Menggunakan useAuth context untuk data user dan fungsi logout
 * - Navigasi menggunakan react-router-dom's useNavigate
 */

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Button } from '@/components/ui/button';
import { LogOut, User, Settings, Menu } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,  // 👈 PERBAIKAN: huruf M besar (bukan dropdownMenuItem)
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// ============================================================
// Helper Functions
// ============================================================

/**
 * Mendapatkan inisial dari nama (max 2 huruf).
 * Contoh: "John Doe" → "JD", "Jane" → "J".
 * @param {string} name - Nama lengkap
 * @returns {string} Inisial (huruf besar)
 */
function getInitials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() || '')
    .join('');
}

/**
 * Komponen badge role dengan warna berbeda sesuai role.
 * @param {Object} props
 * @param {string} props.role - Role user
 * @returns {JSX.Element|null}
 */
function RoleChip({ role }) {
  if (!role) return null;

  const roleColorMap = {
    admin: 'bg-rose-100 text-rose-700',
    management: 'bg-emerald-100 text-emerald-700',
    pdo: 'bg-amber-100 text-amber-700',
    viewer: 'bg-gray-100 text-gray-700',
  };
  const colorClass = roleColorMap[role] || 'bg-gray-100 text-gray-700';

  return (
    <span
      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${colorClass}`}
    >
      {role}
    </span>
  );
}

RoleChip.propTypes = {
  role: PropTypes.oneOf(['admin', 'management', 'pdo', 'viewer']),
};

// ============================================================
// Komponen Utama: Header
// ============================================================

/**
 * Header aplikasi yang menampilkan sidebar toggle, avatar user,
 * dan dropdown menu profil.
 *
 * @param {Object} props
 * @param {function} props.onToggleMobile - Fungsi untuk toggle sidebar mobile
 * @returns {JSX.Element}
 */
function Header({ onToggleMobile }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const initials = useMemo(() => getInitials(user?.full_name || ''), [user?.full_name]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header
      className="
        sticky top-0 z-40
        border-b border-gray-200/80
        backdrop-blur supports-[backdrop-filter]:bg-white/70 bg-white
        px-4 py-3 sm:px-6 md:px-8 lg:pl-72
      "
    >
      <div className="flex items-center gap-3">
        {/* Tombol Menu untuk mobile */}
        <button
          className="lg:hidden text-gray-700 hover:text-gray-900 active:scale-95 transition"
          onClick={onToggleMobile}
          aria-label="Toggle Menu"
          type="button"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Area kanan: dropdown akun */}
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="
                  group h-9 px-2 sm:px-3
                  border border-transparent hover:border-gray-200
                  rounded-xl transition
                "
              >
                <div className="flex items-center gap-2">
                  {/* Avatar dengan inisial */}
                  <div
                    className="
                      size-7 rounded-lg grid place-items-center
                      bg-gradient-to-br from-indigo-100 to-blue-50
                      text-[#000476] text-xs font-bold
                      ring-1 ring-indigo-200/70
                    "
                    aria-hidden
                  >
                    {initials || <User className="w-4 h-4" />}
                  </div>
                  {/* Informasi user (nama + role) - hanya tampil di layar >= sm */}
                  <div className="hidden sm:flex flex-col items-start leading-tight">
                    <span className="text-xs text-gray-500">Signed in as</span>
                    <span className="text-sm font-medium text-gray-800 truncate max-w-[180px]">
                      {user?.full_name || 'User'}
                    </span>
                  </div>
                  <RoleChip role={user?.role} />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuLabel className="flex items-center gap-2">
                <div
                  className="size-8 rounded-md grid place-items-center bg-indigo-50 text-[#000476] text-xs font-bold"
                  aria-hidden
                >
                  {initials || <User className="w-4 h-4" />}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">{user?.full_name}</div>
                  <div className="text-xs text-gray-500 truncate">{user?.email}</div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/edit-profil')}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-rose-600 focus:text-rose-700"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

Header.propTypes = {
  onToggleMobile: PropTypes.func.isRequired,
};

export default Header;
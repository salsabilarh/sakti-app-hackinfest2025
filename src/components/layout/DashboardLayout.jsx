/**
 * components/layout/DashboardLayout.jsx
 *
 * Layout utama untuk halaman yang memerlukan sidebar dan header.
 * Mengatur tata letak responsif dengan sidebar yang dapat dilipat di mobile.
 *
 * ============================================================
 * STRUKTUR KOMPONEN
 * ============================================================
 * - Sidebar: navigasi utama (fixed di desktop, drawer di mobile)
 * - Header: bar atas dengan menu toggle untuk mobile
 * - Main: area konten dinamis (children)
 *
 * ============================================================
 * FITUR RESPONSIF
 * ============================================================
 * - Desktop (> 1024px): sidebar fixed di kiri, main content memiliki margin-left
 * - Mobile (< 1024px): sidebar disembunyikan dan muncul sebagai drawer saat di-togg
 * - Sidebar state dikelola di komponen ini melalui useState(isMobileOpen)
 *
 * ============================================================
 * PROPS
 * ============================================================
 * @param {React.ReactNode} children - Konten halaman yang akan ditampilkan di area main
 *
 * ============================================================
 * PANDUAN MAINTENANCE
 * ============================================================
 * - Gunakan komponen ini sebagai wrapper untuk semua halaman yang memerlukan sidebar.
 * - Jangan lupa untuk menyediakan fungsi onToggleMobile ke Header dan Sidebar.
 * - State isMobileOpen hanya untuk tampilan mobile; desktop tidak terpengaruh.
 */

import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

/**
 * DashboardLayout - Membungkus halaman dengan sidebar dan header.
 * @param {Object} props
 * @param {React.ReactNode} props.children - Konten halaman
 * @returns {JSX.Element}
 */
function DashboardLayout({ children }) {
  // State untuk mengontrol tampilan sidebar di perangkat mobile
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Fungsi untuk toggle sidebar mobile (diteruskan ke Header dan Sidebar)
  const toggleMobileSidebar = () => setIsMobileOpen((prev) => !prev);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar: di desktop fixed, di mobile sebagai drawer */}
      <Sidebar
        isMobileOpen={isMobileOpen}
        onToggleMobile={toggleMobileSidebar}
      />

      {/* Kontainer utama (header + konten) */}
      <div className="flex flex-col flex-1 lg:ml-64">
        {/* Header dengan tombol menu untuk mobile */}
        <Header onToggleMobile={toggleMobileSidebar} />

        {/* Area konten dinamis */}
        <main className="flex-1 overflow-auto bg-gray-50 p-5">
          {children}
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
/**
 * pages/AdminPanel.jsx
 *
 * Halaman utama panel admin yang mengintegrasikan berbagai komponen manajemen:
 * - Statistik dashboard (AdminStats)
 * - Manajemen pengguna (UsersManagement)
 * - Verifikasi pendaftaran (WaitingUsers)
 * - Permintaan perubahan unit dan atau role (ChangeRequests)
 * - Permintaan reset password (PasswordResetRequests)
 * - Log download (DownloadLogs)
 *
 * ============================================================
 * FITUR UTAMA
 * ============================================================
 * - Menampilkan Hero section dengan judul dan deskripsi
 * - Menampilkan kartu statistik (ringkasan data) via AdminStats
 * - Tab navigasi untuk mengakses berbagai modul admin
 * - Setiap tab memiliki komponen spesifik yang dirender secara dinamis
 * - Animasi masuk/keluar tab menggunakan Framer Motion
 * - Hanya user dengan role ADMIN yang dapat mengakses halaman ini
 *
 * ============================================================
 * STRUKTUR OTORISASI
 * ============================================================
 * - Jika user.role !== ROLES.ADMIN, tampilkan pesan "Akses Ditolak"
 * - Tidak ada pengecekan role tambahan di level komponen anak
 *   (setiap komponen sudah memiliki guard internal sendiri)
 *
 * ============================================================
 * PANDUAN MAINTENANCE
 * ============================================================
 * - Menambah tab baru:
 *   1. Impor komponen baru di bagian atas
 *   2. Tambahkan objek ke array TABS dengan properti:
 *      id, label, icon (lucide-react), component
 *   3. Urutan tab sesuai dengan urutan dalam array
 * - Mengubah label atau ikon: edit langsung di TABS
 * - Menambah statistik baru: edit AdminStats.jsx, bukan di sini
 * - Animasi tab dapat disesuaikan dengan mengubah properti motion.div
 *
 * ============================================================
 * KOMPONEN YANG DIGUNAKAN
 * ============================================================
 * - AdminStats          : menampilkan kartu statistik ringkasan
 * - UsersManagement     : CRUD pengguna (admin role required di dalamnya)
 * - WaitingUsers        : daftar pengguna menunggu verifikasi
 * - ChangeRequests      : daftar permintaan perubahan unit dan atau role
 * - PasswordResetRequests : daftar permintaan reset password
 * - DownloadLogs        : log aktivitas download marketing kit
 */

import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Users, UserCheck, GitPullRequest, Key, Download, Layers } from 'lucide-react';
import { useAuth, ROLES } from '@/contexts/AuthContext.jsx';
import AdminStats from '@/components/admin/AdminStats.jsx';
import UsersManagement from '@/components/admin/UsersManagement.jsx';
import WaitingUsers from '@/components/admin/WaitingUsers.jsx';
import ChangeRequests from '@/components/admin/ChangeRequests.jsx';
import PasswordResetRequests from '@/components/admin/PasswordResetRequests.jsx';
import DownloadLogs from '@/components/admin/DownloadLogs.jsx';

// ============================================================
// Konfigurasi Tabs
// ============================================================

/**
 * Daftar tab yang tersedia di panel admin.
 * Setiap tab memiliki:
 * - id        : identifier unik (digunakan untuk state activeTab)
 * - label     : teks yang ditampilkan di tombol tab
 * - icon      : komponen ikon dari lucide-react
 * - component : komponen React yang akan dirender saat tab aktif
 */
const TABS = [
  { id: 'users', label: 'Manajemen User', icon: Users, component: UsersManagement },
  { id: 'waiting', label: 'Persetujuan Pendaftaran', icon: UserCheck, component: WaitingUsers },
  { id: 'changeRequests', label: 'Permintaan Perubahan', icon: GitPullRequest, component: ChangeRequests },
  { id: 'resetPassword', label: 'Permintaan Reset Password', icon: Key, component: PasswordResetRequests },
  { id: 'logs', label: 'Log Download', icon: Download, component: DownloadLogs },
];

// ============================================================
// Komponen Utama
// ============================================================

/**
 * AdminPanel - Halaman administrator untuk mengelola sistem.
 * @returns {JSX.Element}
 */
const AdminPanel = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('users');

  // ============================================================
  // Guard: hanya ADMIN yang boleh mengakses
  // ============================================================
  if (user?.role !== ROLES.ADMIN) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Akses Ditolak</h2>
        <p className="text-gray-600">Anda tidak memiliki akses ke halaman admin.</p>
      </div>
    );
  }

  // ============================================================
  // Ambil komponen yang sesuai dengan tab aktif
  // ============================================================
  const ActiveComponent = TABS.find((tab) => tab.id === activeTab)?.component;

  // ============================================================
  // Render
  // ============================================================
  return (
    <>
      <Helmet>
        <title>Admin Panel | SAKTI Platform</title>
        <meta name="description" content="Panel admin untuk mengelola pengguna, layanan, dan log aktivitas." />
      </Helmet>

      {/* Hero Section */}
      <motion.div
        className="relative overflow-hidden rounded-3xl p-8 sm:p-10 text-white shadow-lg mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#000476] to-indigo-800" />
        <div className="absolute inset-0 bg-[radial-gradient(900px_circle_at_20%_-10%,rgba(255,255,255,0.15),transparent)]" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2 flex items-center gap-2">
              <Layers className="w-7 h-7" />
              Admin Panel
            </h1>
            <p className="text-blue-100 text-sm sm:text-base">
              Kelola pengguna, persetujuan, dan aktivitas
            </p>
          </div>
        </div>
      </motion.div>

      {/* Statistik Dashboard (selalu ditampilkan di atas) */}
      <div className="space-y-6 mt-6">
        <AdminStats />

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div className="bg-gray-100 p-1 rounded-2xl overflow-x-auto flex items-center gap-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all flex-shrink-0 ${
                    isActive
                      ? 'bg-white text-[#000476] shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Komponen Dinamis berdasarkan Tab Aktif */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {ActiveComponent && <ActiveComponent />}
        </motion.div>
      </div>
    </>
  );
};

export default AdminPanel;
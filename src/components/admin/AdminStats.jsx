/**
 * components/admin/AdminStats.js
 *
 * Komponen untuk menampilkan statistik ringkasan di dashboard admin.
 * Data diambil dari endpoint GET /api/admin/dashboard.
 *
 * Menampilkan kartu statistik dengan ikon dan nilai, dilengkapi animasi loading skeleton.
 *
 * ============================================================
 * STRUKTUR DATA RESPONSE API
 * ============================================================
 * Response dari GET /admin/dashboard:
 * {
 *   success: true,
 *   data: {
 *     total_pengguna: number,
 *     menunggu_verifikasi: number,
 *     pengguna_aktif_30_hari: number,
 *     total_download: number,
 *     permintaan_pindah_unit: number,
 *     permintaan_reset_password: number
 *   }
 * }
 *
 * ============================================================
 * PANDUAN MAINTENANCE
 * ============================================================
 * - Jika ada statistik baru yang ditambahkan di backend, tambahkan entri
 *   di `statsList` dengan label, value (sesuai properti response), dan ikon.
 * - Pastikan ikon diimpor dari lucide-react dan sesuai.
 * - Komponen ini bersifat presentasional (hanya menerima data dari API).
 */

import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { Users, Clock, Repeat, KeyRound, Activity, Download } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';

// ============================================================
// Helper: Konfigurasi item statistik
// ============================================================

/**
 * Mendefinisikan daftar statistik yang akan ditampilkan.
 * Setiap item memiliki:
 * - label: teks yang ditampilkan
 * - valueKey: nama properti di response.data yang menyimpan nilai
 * - icon: komponen ikon dari lucide-react
 */
const STAT_ITEMS = [
  { label: 'Total Pengguna', valueKey: 'total_pengguna', icon: Users },
  { label: 'Menunggu Verifikasi', valueKey: 'menunggu_verifikasi', icon: Clock },
  { label: 'Pengguna Aktif (30 hari)', valueKey: 'pengguna_aktif_30_hari', icon: Activity },
  { label: 'Total Download', valueKey: 'total_download', icon: Download },
  { label: 'Permintaan Pindah Unit', valueKey: 'permintaan_pindah_unit', icon: Repeat },
  { label: 'Permintaan Reset Password', valueKey: 'permintaan_reset_password', icon: KeyRound },
];

// ============================================================
// Komponen Skeleton Loading
// ============================================================

/**
 * Menampilkan placeholder kartu statistik saat loading.
 * Jumlah kartu sesuai dengan panjang STAT_ITEMS.
 */
const StatsSkeleton = () => (
  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
    {STAT_ITEMS.map((_, index) => (
      <Card key={index} className="border-0 shadow-lg rounded-2xl animate-pulse">
        <CardContent className="p-6">
          <div className="h-16 bg-gray-200 rounded" />
        </CardContent>
      </Card>
    ))}
  </div>
);

// ============================================================
// Komponen Utama
// ============================================================

/**
 * AdminStats - Menampilkan kartu statistik dashboard admin.
 *
 * Komponen ini melakukan fetch data dari API saat mount,
 * menampilkan loading skeleton, kemudian menampilkan kartu-kartu statistik.
 *
 * @returns {JSX.Element}
 */
function AdminStats() {
  const { toast } = useToast();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Effect: Fetch data statistik saat komponen pertama kali dirender
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/admin/dashboard');
        // Asumsikan response.data = { success: true, data: { ... } }
        const data = response.data?.data || {};
        setStats(data);
      } catch (error) {
        console.error('[AdminStats] Error fetching stats:', error);
        toast({
          title: 'Gagal memuat statistik',
          description: error.response?.data?.message || 'Terjadi kesalahan saat memuat data dashboard.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [toast]);

  // Tampilkan skeleton loading jika masih loading
  if (loading) {
    return <StatsSkeleton />;
  }

  // Bangun daftar statistik yang akan dirender berdasarkan data dari API
  const statsList = STAT_ITEMS.map((item) => ({
    label: item.label,
    value: stats?.[item.valueKey] ?? 0,
    icon: item.icon,
  }));

  // Animasi fade-in untuk container
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      {statsList.map((stat, index) => (
        <Card
          key={index}
          className="border-0 shadow-lg hover:shadow-xl transition-shadow rounded-2xl"
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-3xl font-bold text-[#000476]">{stat.value}</p>
              </div>
              <stat.icon className="w-8 h-8 text-[#000476]" />
            </div>
          </CardContent>
        </Card>
      ))}
    </motion.div>
  );
}

// PropTypes untuk dokumentasi dan validasi runtime (opsional)
AdminStats.propTypes = {
  // Tidak ada props yang diharapkan
};

export default AdminStats;
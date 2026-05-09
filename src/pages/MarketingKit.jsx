/**
 * pages/MarketingKit.jsx
 *
 * Halaman untuk mengelola marketing kit (file dokumen pemasaran).
 * Menampilkan daftar file dengan filter, pencarian, dan aksi download/edit/hapus.
 *
 * ============================================================
 * FITUR UTAMA
 * ============================================================
 * - Tabel daftar marketing kit dengan kolom: Nama File, Tipe, Layanan Terkait,
 *   Diupload Oleh, Tanggal Upload, Aksi
 * - Pencarian teks (nama file, kode/nama layanan)
 * - Filter berdasarkan tipe file dan layanan
 * - Role-based access:
 *   - Viewer: tidak dapat mengakses halaman sama sekali (403)
 *   - Management/Admin: dapat upload, edit, hapus
 *   - Semua user kecuali viewer dapat download (dengan form purpose)
 * - Upload file (multiple) via modal UploadFile
 * - Edit metadata file via modal EditFormModal
 * - Download file via modal DownloadFormModal (wajib isi purpose)
 *
 * ============================================================
 * STRUKTUR DATA API
 * ============================================================
 * GET    /marketing-kits           → daftar file (dengan query params)
 * POST   /marketing-kits           → upload file (multipart/form-data)
 * PUT    /marketing-kits/:id       → update metadata
 * DELETE /marketing-kits/:id       → hapus file
 * GET    /services                 → daftar layanan untuk dropdown filter
 *
 * ============================================================
 * PANDUAN MAINTENANCE
 * ============================================================
 * - Gunakan constants ROLES, WRITE_ROLES, PAGINATION dari lib/constants.js
 * - Jangan hardcode role string
 * - Setiap aksi yang mengubah data memanggil fetchMarketingKits() untuk refresh
 * - Validasi purpose di DownloadFormModal
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import {
  Download, Search, Filter, Upload, Trash2, Layers,
} from 'lucide-react';

import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table.jsx';
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import DownloadFormModal from '@/components/DownloadFormModal.jsx';
import UploadFile from '@/components/admin/UploadFile.jsx';
import EditFormModal from '@/components/admin/EditFormModal.jsx';
import { useToast } from '@/components/ui/use-toast.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import api from '@/lib/api';
import { ROLES, WRITE_ROLES, PAGINATION } from '@/lib/constants';
import ResponsiveSelect from '@/components/ui/ResponsiveSelect.jsx';

// ============================================================
// Helper Functions (tidak ada yang signifikan di file ini)
// ============================================================

// ============================================================
// Komponen Utama
// ============================================================

/**
 * MarketingKit - Halaman manajemen marketing kit.
 * @returns {JSX.Element}
 */
function MarketingKit() {
  const { user } = useAuth();
  const { toast } = useToast();

  // ========== Role Guards ==========
  const canWrite = WRITE_ROLES.includes(user?.role); // admin + management
  const isViewer = user?.role === ROLES.VIEWER;

  // ========== Data State ==========
  const [kits, setKits] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);

  // ========== Filter State ==========
  const [inputSearch, setInputSearch] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFileType, setSelectedFileType] = useState('');
  const [selectedService, setSelectedService] = useState('');

  // ========== Modal State ==========
  const [showDownloadForm, setShowDownloadForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingKit, setDeletingKit] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ============================================================
  // Debounce pencarian (300ms)
  // ============================================================
  useEffect(() => {
    const timer = setTimeout(() => setSearchTerm(inputSearch), 300);
    return () => clearTimeout(timer);
  }, [inputSearch]);

  // ============================================================
  // Fetch Marketing Kits
  // ============================================================
  const fetchMarketingKits = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (selectedFileType) params.file_type = selectedFileType;
      if (selectedService) params.service = selectedService;

      const response = await api.get('/marketing-kits', { params });
      // Response: { success: true, data: [...] }
      setKits(response.data?.data || []);
    } catch (err) {
      toast({
        title: 'Gagal memuat marketing kit',
        description: err.response?.data?.error || err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedFileType, selectedService, toast]);

  // Reload ketika filter berubah
  useEffect(() => {
    fetchMarketingKits();
  }, [fetchMarketingKits]);

  // ============================================================
  // Fetch Services untuk dropdown filter (limit MAX_LIMIT)
  // ============================================================
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await api.get('/services', {
          params: { limit: PAGINATION.MAX_LIMIT }, // maks 100
        });
        // Normalisasi response
        let serviceList = [];
        if (res.data?.services) serviceList = res.data.services;
        else if (res.data?.data?.layanan) serviceList = res.data.data.layanan;
        else if (Array.isArray(res.data)) serviceList = res.data;
        else serviceList = res.data?.data || [];
        setServices(serviceList);
      } catch (err) {
        // Tidak critical, cukup console error
        console.error('[MarketingKit] Failed to fetch services:', err);
      }
    };
    fetchServices();
  }, []);

  // ============================================================
  // Derived data: daftar tipe file yang tersedia (untuk filter dropdown)
  // ============================================================
  const fileTypes = useMemo(
    () => [...new Set(kits.map((k) => k.file_type).filter(Boolean))],
    [kits]
  );

  // ============================================================
  // Handlers
  // ============================================================
  const handleDownloadClick = (file) => {
    setSelectedFile(file);
    setShowDownloadForm(true);
  };

  const handleAskDelete = (kit) => {
    setDeletingKit(kit);
    setShowDeleteModal(true);
  };

  const handleDeleteKit = async () => {
    if (!deletingKit) return;
    setIsDeleting(true);
    try {
      await api.delete(`/marketing-kits/${deletingKit.id}`);
      // Refresh local state
      setKits((prev) => prev.filter((k) => k.id !== deletingKit.id));
      setShowDeleteModal(false);
      setDeletingKit(null);
      toast({
        title: 'File Dihapus',
        description: `${deletingKit.name} berhasil dihapus dari sistem.`,
      });
    } catch (err) {
      toast({
        title: 'Gagal menghapus',
        description: err.response?.data?.error || err.message,
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const resetFilters = () => {
    setInputSearch('');
    setSearchTerm('');
    setSelectedFileType('');
    setSelectedService('');
  };

  // ============================================================
  // Guard: Viewer tidak boleh mengakses halaman ini
  // ============================================================
  if (isViewer) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <div className="mb-4 h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center">
          <Search className="w-7 h-7 text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Akses Ditolak</h2>
        <p className="text-gray-500 text-sm">
          Role Viewer tidak memiliki akses ke Marketing Kit.
        </p>
      </div>
    );
  }

  // ============================================================
  // Render Utama
  // ============================================================
  return (
    <>
      <Helmet>
        <title>Marketing Kit | SAKTI Platform</title>
        <meta
          name="description"
          content="Download materi pemasaran, brosur, dan dokumentasi layanan."
        />
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
              <Layers className="w-7 h-7" /> Marketing Kit
            </h1>
            <p className="text-blue-100 text-sm sm:text-base">
              Unduh materi pemasaran, brosur, dan dokumentasi layanan
            </p>
          </div>

          {canWrite && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <button
                onClick={() => setDialogOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-white
                           px-4 py-2.5 text-sm font-medium text-[#000476]
                           hover:bg-blue-50 transition-colors"
              >
                <Upload className="w-4 h-4" />
                Upload File
              </button>
              <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-[#000476]">
                    <Upload className="w-5 h-5" />
                    Upload File Marketing Kit
                  </DialogTitle>
                  <DialogDescription>
                    Tambahkan file marketing baru ke dalam sistem.
                  </DialogDescription>
                </DialogHeader>
                <UploadFile
                  onUploadSuccess={() => {
                    fetchMarketingKits();
                    setDialogOpen(false);
                  }}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </motion.div>

      {/* Filter Card */}
      <Card className="border-0 shadow-lg mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-[#000476]" />
            Filter & Pencarian
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Cari nama file, kode layanan, atau nama layanan…"
              value={inputSearch}
              onChange={(e) => setInputSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {/* Filter Tipe File */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipe File</label>
              <select
                value={selectedFileType}
                onChange={(e) => setSelectedFileType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm"
              >
                <option value="">Semua Tipe File</option>
                {fileTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Filter Layanan */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Layanan</label>
              <select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm"
              >
                <option value="">Semua Layanan</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Tombol Reset Filter */}
            <div className="flex items-end">
              <Button variant="outline" onClick={resetFilters} className="w-full">
                Reset Filter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info jumlah data */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-600">
          {loading ? 'Memuat data…' : `Menampilkan ${kits.length} file`}
        </p>
      </div>

      {/* Tabel Marketing Kit */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="border-0 shadow-lg">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table className="min-w-full">
                <TableHeader className="bg-gray-50 sticky top-0 z-10">
                  <TableRow>
                    <TableHead>Nama File</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead>Layanan Terkait</TableHead>
                    <TableHead>Diupload Oleh</TableHead>
                    <TableHead>Tanggal Upload</TableHead>
                    <TableHead className="text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Loading skeleton */}
                  {loading &&
                    Array.from({ length: 6 }).map((_, i) => (
                      <TableRow key={`sk-${i}`} className="animate-pulse">
                        {Array.from({ length: 6 }).map((__, j) => (
                          <TableCell key={j}>
                            <div className="h-4 bg-gray-200 rounded" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}

                  {/* Data kosong */}
                  {!loading && kits.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        Tidak ada file marketing kit yang ditemukan.
                      </TableCell>
                    </TableRow>
                  )}

                  {/* Data list */}
                  {!loading &&
                    kits.map((kit, idx) => (
                      <motion.tr
                        key={kit.id}
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: idx * 0.02 }}
                        className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
                      >
                        <TableCell className="font-medium text-gray-900">
                          {kit.name}
                        </TableCell>
                        <TableCell>
                          <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700 border">
                            {kit.file_type || '-'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {kit.services?.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {kit.services.slice(0, 4).map((svc) => (
                                <span
                                  key={svc.id}
                                  className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium border border-blue-100"
                                >
                                  {svc.code ? `${svc.code} — ` : ''}
                                  {svc.name}
                                </span>
                              ))}
                              {kit.services.length > 4 && (
                                <span className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded text-xs">
                                  +{kit.services.length - 4}
                                </span>
                              )}
                            </div>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>{kit.uploader?.full_name || '-'}</TableCell>
                        <TableCell className="text-gray-600 whitespace-nowrap">
                          {kit.created_at
                            ? new Date(kit.created_at).toLocaleDateString('id-ID')
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center items-center gap-2">
                            {canWrite && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedFile(kit);
                                    setShowEditModal(true);
                                  }}
                                >
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-700 border-red-300 hover:bg-red-50"
                                  onClick={() => handleAskDelete(kit)}
                                >
                                  <Trash2 className="w-4 h-4 mr-1" /> Hapus
                                </Button>
                              </>
                            )}
                            <Button
                              size="sm"
                              className="bg-[#000476] hover:bg-indigo-900 text-white"
                              onClick={() => handleDownloadClick(kit)}
                              title={`Unduh ${kit.name}`}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ========== MODALS ========== */}

      {/* Modal Edit */}
      <EditFormModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        file={selectedFile}
        services={services}
        onUpdateSuccess={() => {
          fetchMarketingKits();
          setShowEditModal(false);
        }}
      />

      {/* Modal Download */}
      {showDownloadForm && (
        <DownloadFormModal
          file={selectedFile}
          onClose={() => {
            setShowDownloadForm(false);
            setSelectedFile(null);
          }}
        />
      )}

      {/* Modal Konfirmasi Hapus */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus File Marketing Kit?</DialogTitle>
            <DialogDescription>
              Tindakan ini tidak bisa dibatalkan. File akan dihapus dari sistem
              dan Cloudinary secara permanen.
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-gray-700 mt-2">
            Anda akan menghapus{' '}
            <span className="font-semibold text-gray-900">
              {deletingKit?.name || '—'}
            </span>
            .
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
              disabled={isDeleting}
            >
              Batal
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDeleteKit}
              disabled={isDeleting}
            >
              {isDeleting ? 'Menghapus…' : 'Hapus'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default MarketingKit;
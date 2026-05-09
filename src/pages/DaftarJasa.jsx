/**
 * pages/DaftarJasa.jsx
 *
 * Halaman daftar layanan (services) dengan fitur filter, sorting, pagination,
 * serta aksi tambah revenue dan hapus layanan (jika role/wewenang sesuai).
 *
 * ============================================================
 * FITUR UTAMA
 * ============================================================
 * - Menampilkan daftar layanan dalam bentuk tabel dengan kolom:
 *   Nama, Kode, Sub-Portfolio, Portfolio, Sektor, Aksi
 * - Filter berdasarkan:
 *   - Pencarian teks (nama/kode)
 *   - Portfolio (dropdown)
 *   - Sektor (dropdown)
 * - Sorting pada kolom Nama, Portfolio, Sektor (asc/desc)
 * - Pagination client-side (data diambil dari backend sesuai page & limit)
 * - Modal untuk menambah data revenue (pelanggan + nilai pendapatan)
 * - Modal konfirmasi hapus layanan (dengan peringatan irreversible)
 *
 * ============================================================
 * KEAMANAN & OTORISASI
 * ============================================================
 * - User dengan role VIEWER atau unit tipe 'cabang' tidak dapat:
 *   - Menambah layanan (tombol hide)
 *   - Menambah revenue (tombol tidak muncul)
 *   - Menghapus layanan (tombol tidak muncul)
 * - Kondisi ini diatur oleh variabel `cannotEdit`
 *
 * ============================================================
 * STRUKTUR DATA API
 * ============================================================
 * GET /services
 *   Query params: search, portfolio_id, sector_id, sort, order, page, limit
 *   Response: { data: { layanan: [...], total: number, ... } }
 *
 * POST /services/:id/revenue
 *   Body: { customer_name, revenue, unit_id }
 *
 * DELETE /services/:id
 *
 * ============================================================
 * PANDUAN MAINTENANCE
 * ============================================================
 * - Perhatikan penggunaan kata kunci yang benar dari constants:
 *   ROLES.VIEWER, bukan 'viewer' hardcoded.
 * - PAGINATION.DEFAULT_LIMIT harus sinkron dengan back end.
 * - Setiap aksi yang membutuhkan reload data memanggil fetchServices().
 * - Modal revenue dan hapus menggunakan state lokal dan validasi sederhana.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Search, Filter, Eye, ChevronUp, ChevronDown,
  ArrowUpDown, Trash2, Plus, Layers,
} from 'lucide-react';

import { Input } from '@/components/ui/input.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table.jsx';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog.jsx';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext.jsx';
import api from '@/lib/api';
import { ROLES, PAGINATION } from '@/lib/constants';

// ============================================================
// Helper Functions
// ============================================================

/**
 * Validasi form revenue sebelum dikirim ke server.
 * @param {Object} form - { customer_name, revenue, unit_id }
 * @returns {Object} Errors object (field: message)
 */
function validateRevenueForm(form) {
  const errors = {};
  if (!form.customer_name?.trim()) {
    errors.customer_name = 'Nama pelanggan wajib diisi.';
  }
  const rev = Number(form.revenue);
  if (!form.revenue || isNaN(rev) || rev <= 0) {
    errors.revenue = 'Pendapatan harus berupa angka positif.';
  }
  if (!form.unit_id) {
    errors.unit_id = 'Unit wajib dipilih.';
  }
  return errors;
}

// ============================================================
// Komponen Utama
// ============================================================

/**
 * DaftarJasa - Halaman menampilkan layanan dengan berbagai fitur.
 * @returns {JSX.Element}
 */
function DaftarJasa() {
  const { user } = useAuth();
  const { toast } = useToast();

  // ========== Hak akses ==========
  const cannotEdit = user?.role === ROLES.VIEWER || user?.unit?.type === 'cabang';

  // ========== State data utama ==========
  const [services, setServices] = useState([]);
  const [portfolioList, setPortfolioList] = useState([]);
  const [sectorList, setSectorList] = useState([]);
  const [unitList, setUnitList] = useState([]);
  const [loading, setLoading] = useState(false);

  // ========== State filter & pagination ==========
  const [inputSearch, setInputSearch] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPortfolioId, setSelectedPortfolioId] = useState('');
  const [selectedSectorId, setSelectedSectorId] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = PAGINATION.DEFAULT_LIMIT; // 10

  // ========== State modal Revenue ==========
  const [showRevenueModal, setShowRevenueModal] = useState(false);
  const [revenueForm, setRevenueForm] = useState({
    service_id: null,
    customer_name: '',
    revenue: '',
    unit_id: '',
  });
  const [savingRevenue, setSavingRevenue] = useState(false);
  const [revenueErrors, setRevenueErrors] = useState({});

  // ========== State modal Delete ==========
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState({ id: null, name: '' });
  const [isDeleting, setIsDeleting] = useState(false);

  // ============================================================
  // Effect: Debounce pencarian
  // ============================================================
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(inputSearch);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [inputSearch]);

  // ============================================================
  // Fetch opsi filter (portfolio, sektor, unit)
  // ============================================================
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [portfolioRes, sectorRes, unitRes] = await Promise.all([
          api.get('/portfolios'),
          api.get('/sectors'),
          api.get('/units'),
        ]);
        // Normalisasi response: bisa langsung data.data atau data dengan key lain
        const portfolios = portfolioRes.data?.data ?? portfolioRes.data?.portfolios ?? [];
        const sectors = sectorRes.data?.data ?? sectorRes.data?.sectors ?? [];
        const units = unitRes.data?.data ?? unitRes.data?.units ?? [];
        setPortfolioList(portfolios);
        setSectorList(sectors);
        setUnitList(units);
      } catch (err) {
        toast({
          title: 'Gagal memuat opsi filter',
          description: err.response?.data?.error || err.message,
          variant: 'destructive',
        });
      }
    };
    fetchOptions();
  }, [toast]);

  // ============================================================
  // Fetch daftar layanan dengan parameter yang sesuai
  // ============================================================
  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/services', {
        params: {
          search: searchTerm || undefined,
          portfolio_id: selectedPortfolioId || undefined,
          sector_id: selectedSectorId || undefined,
          sort: sortBy,
          order: sortOrder,
          page,
          limit,
        },
      });
      const data = response.data?.data ?? response.data;
      setServices(data.layanan ?? []);
      setTotal(data.total ?? 0);
    } catch (error) {
      console.error('[DaftarJasa] fetchServices error:', error);
      toast({
        title: 'Gagal memuat layanan',
        description: error.response?.data?.error || error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedPortfolioId, selectedSectorId, sortBy, sortOrder, page, limit, toast]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  // ============================================================
  // Handler: Reset semua filter
  // ============================================================
  const clearFilters = () => {
    setInputSearch('');
    setSearchTerm('');
    setSelectedPortfolioId('');
    setSelectedSectorId('');
    setPage(1);
  };

  // ============================================================
  // Handler: Sorting
  // ============================================================
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const renderSortIcon = (field) => {
    if (sortBy !== field) {
      return <ArrowUpDown className="w-4 h-4 ml-1 text-gray-400" />;
    }
    return sortOrder === 'asc'
      ? <ChevronUp className="w-4 h-4 ml-1 text-gray-600" />
      : <ChevronDown className="w-4 h-4 ml-1 text-gray-600" />;
  };

  // ============================================================
  // Handler: Hapus layanan
  // ============================================================
  const openDelete = (id, name) => {
    setDeleting({ id, name });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleting.id) return;
    setIsDeleting(true);
    try {
      await api.delete(`/services/${deleting.id}`);
      setServices((prev) => prev.filter((s) => s.id !== deleting.id));
      setTotal((prev) => Math.max(prev - 1, 0));
      setShowDeleteModal(false);
      toast({
        title: 'Layanan Dihapus',
        description: `${deleting.name} berhasil dihapus.`,
      });
    } catch (err) {
      toast({
        title: 'Gagal menghapus layanan',
        description: err.response?.data?.error || err.message,
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // ============================================================
  // Handler: Revenue modal
  // ============================================================
  const openRevenueModal = (serviceId) => {
    setRevenueForm({
      service_id: serviceId,
      customer_name: '',
      revenue: '',
      unit_id: '',
    });
    setRevenueErrors({});
    setShowRevenueModal(true);
  };

  const handleRevenueSubmit = async () => {
    const errors = validateRevenueForm(revenueForm);
    if (Object.keys(errors).length > 0) {
      setRevenueErrors(errors);
      return;
    }

    setSavingRevenue(true);
    try {
      await api.post(`/services/${revenueForm.service_id}/revenue`, {
        customer_name: revenueForm.customer_name.trim(),
        revenue: Number(revenueForm.revenue),
        unit_id: revenueForm.unit_id,
      });
      setShowRevenueModal(false);
      toast({
        title: 'Pendapatan Ditambahkan',
        description: `Data pelanggan ${revenueForm.customer_name} berhasil disimpan.`,
      });
    } catch (err) {
      toast({
        title: 'Gagal tambah pendapatan',
        description: err.response?.data?.error || err.message,
        variant: 'destructive',
      });
    } finally {
      setSavingRevenue(false);
    }
  };

  // Pagination helpers
  const totalPages = Math.ceil(total / limit);

  // ============================================================
  // Render
  // ============================================================
  return (
    <>
      <Helmet>
        <title>Daftar Layanan | SAKTI Platform</title>
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
              Daftar Layanan
            </h1>
            <p className="text-blue-100 text-sm sm:text-base">
              Jelajahi katalog layanan PT Sucofindo
            </p>
          </div>
          {!cannotEdit && (
            <Link to="/tambah-jasa">
              <Button className="bg-white text-[#000476] hover:bg-blue-50 font-medium">
                <Plus className="w-4 h-4 mr-2" />
                Tambah Layanan
              </Button>
            </Link>
          )}
        </div>
      </motion.div>

      {/* Filter Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filter & Pencarian
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Cari nama layanan atau kode…"
                value={inputSearch}
                onChange={(e) => setInputSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Portfolio</label>
                <select
                  value={selectedPortfolioId}
                  onChange={(e) => {
                    setSelectedPortfolioId(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm"
                >
                  <option value="">Semua Portfolio</option>
                  {portfolioList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sektor</label>
                <select
                  value={selectedSectorId}
                  onChange={(e) => {
                    setSelectedSectorId(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm"
                >
                  <option value="">Semua Sektor</option>
                  {sectorList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} — {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <Button variant="outline" onClick={clearFilters} className="w-full">
                  Reset Filter
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabel Layanan */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="border-0 shadow-lg">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead onClick={() => handleSort('name')} className="cursor-pointer select-none">
                    <div className="flex items-center">Nama Layanan {renderSortIcon('name')}</div>
                  </TableHead>
                  <TableHead>Kode</TableHead>
                  <TableHead>Sub-Portfolio</TableHead>
                  <TableHead onClick={() => handleSort('portfolio')} className="cursor-pointer select-none">
                    <div className="flex items-center">Portfolio {renderSortIcon('portfolio')}</div>
                  </TableHead>
                  <TableHead onClick={() => handleSort('sector')} className="cursor-pointer select-none">
                    <div className="flex items-center">Sektor {renderSortIcon('sector')}</div>
                  </TableHead>
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

                {/* Kondisi kosong */}
                {!loading && services.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      Tidak ada layanan yang ditemukan.
                    </TableCell>
                  </TableRow>
                )}

                {/* Data layanan */}
                {!loading &&
                  services.map((service, idx) => (
                    <motion.tr
                      key={service.id}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: idx * 0.025 }}
                      className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
                    >
                      <TableCell className="font-medium text-gray-900">{service.name}</TableCell>
                      <TableCell>
                        <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700 border">
                          {service.code || '-'}
                        </span>
                      </TableCell>
                      <TableCell>{service.sub_portfolio || '-'}</TableCell>
                      <TableCell>{service.portfolio || '-'}</TableCell>
                      <TableCell>
                        {service.sectors?.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {service.sectors.map((sec, i) => (
                              <span
                                key={`${service.id}-s-${i}`}
                                className="px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-700 border border-blue-100"
                              >
                                {sec}
                              </span>
                            ))}
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center items-center gap-2">
                          <Link to={`/jasa/${service.id}`}>
                            <Button variant="outline" size="sm" className="py-5">
                              <Eye className="w-4 h-4 mr-1" />
                              Detail
                            </Button>
                          </Link>
                          {!cannotEdit && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-green-700 border-green-600 py-5"
                                onClick={() => openRevenueModal(service.id)}
                              >
                                Tambah Pelanggan
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-700 border-red-600 py-5"
                                onClick={() => openDelete(service.id, service.name)}
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Hapus
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {!loading && services.length > 0 && (
              <div className="flex items-center justify-end gap-2 pt-2 pb-7 pr-6">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600">
                  Halaman {page} dari {totalPages || 1}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Modal Tambah Pendapatan (Revenue) */}
      {showRevenueModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Tambah Pendapatan Layanan</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Nama Pelanggan <span className="text-red-500">*</span>
                </label>
                <Input
                  value={revenueForm.customer_name}
                  onChange={(e) => {
                    setRevenueForm({ ...revenueForm, customer_name: e.target.value });
                    if (revenueErrors.customer_name) {
                      setRevenueErrors({ ...revenueErrors, customer_name: '' });
                    }
                  }}
                  placeholder="Nama perusahaan / pelanggan"
                  className={revenueErrors.customer_name ? 'border-red-400' : ''}
                />
                {revenueErrors.customer_name && (
                  <p className="text-xs text-red-500 mt-1">{revenueErrors.customer_name}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Pendapatan (Rp) <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  min="0"
                  step="1000"
                  value={revenueForm.revenue}
                  onChange={(e) => {
                    setRevenueForm({ ...revenueForm, revenue: e.target.value });
                    if (revenueErrors.revenue) {
                      setRevenueErrors({ ...revenueErrors, revenue: '' });
                    }
                  }}
                  placeholder="Contoh: 5000000"
                  className={revenueErrors.revenue ? 'border-red-400' : ''}
                />
                {revenueErrors.revenue && (
                  <p className="text-xs text-red-500 mt-1">{revenueErrors.revenue}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Unit <span className="text-red-500">*</span>
                </label>
                <select
                  className={`w-full border rounded-md px-2 py-2 text-sm ${
                    revenueErrors.unit_id ? 'border-red-400' : 'border-gray-300'
                  }`}
                  value={revenueForm.unit_id}
                  onChange={(e) => {
                    setRevenueForm({ ...revenueForm, unit_id: e.target.value });
                    if (revenueErrors.unit_id) {
                      setRevenueErrors({ ...revenueErrors, unit_id: '' });
                    }
                  }}
                >
                  <option value="">Pilih Unit</option>
                  {unitList.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
                {revenueErrors.unit_id && (
                  <p className="text-xs text-red-500 mt-1">{revenueErrors.unit_id}</p>
                )}
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRevenueModal(false);
                  setRevenueErrors({});
                }}
                disabled={savingRevenue}
              >
                Batal
              </Button>
              <Button
                onClick={handleRevenueSubmit}
                disabled={savingRevenue}
                className="bg-[#000476] hover:bg-indigo-900 text-white"
              >
                {savingRevenue ? 'Menyimpan…' : 'Simpan'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Layanan?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Kamu akan menghapus{' '}
            <span className="font-semibold text-gray-900">{deleting.name || '—'}</span>.
            Tindakan ini <strong>tidak bisa dibatalkan</strong> dan akan menghapus semua data
            terkait (marketing kit, revenue, relasi sektor).
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)} disabled={isDeleting}>
              Batal
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={confirmDelete}
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

export default DaftarJasa;
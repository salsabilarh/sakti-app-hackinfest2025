import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Search, Filter, Eye, ChevronUp, ChevronDown, ArrowUpDown, Trash2, Plus, Layers } from 'lucide-react';

import { Input } from '@/components/ui/input.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table.jsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog.jsx';

import { useAuth } from '@/contexts/AuthContext.jsx';

function DaftarJasa() {
  const { user, authToken } = useAuth();

  const [services, setServices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPortfolioId, setSelectedPortfolioId] = useState('');
  const [selectedSectorId, setSelectedSectorId] = useState('');
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);

  const [portfolioList, setPortfolioList] = useState([]);
  const [sectorList, setSectorList] = useState([]);

  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  const cannotEdit = user?.role === 'viewer' || user?.role === 'pdo' || user?.unit?.type === 'cabang';
  const canViewDetail = !!user;

  // Revenue modal state (tetap)
  const [showRevenueModal, setShowRevenueModal] = useState(false);
  const [revenueForm, setRevenueForm] = useState({ service_id: null, customer_name: '', revenue: '', unit_id: '' });
  const [unitList, setUnitList] = useState([]);

  // DELETE modal state (baru)
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState({ id: null, name: '' });
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch data filter portfolio & sektor
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [portfolioRes, sectorRes] = await Promise.all([
          fetch('http://localhost:3000/api/portfolios', { headers: { Authorization: `Bearer ${authToken}` } }),
          fetch('http://localhost:3000/api/sectors', { headers: { Authorization: `Bearer ${authToken}` } }),
        ]);

        const [portfolioData, sectorData] = await Promise.all([portfolioRes.json(), sectorRes.json()]);
        setPortfolioList(portfolioData.portfolios || []);
        setSectorList(sectorData.sectors || []);
      } catch (err) {
        console.error('Gagal mengambil data filter:', err);
      }
    };
    if (authToken) fetchOptions();
  }, [authToken]);

  // Fetch units (untuk modal revenue)
  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/units', {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        const data = await res.json();
        setUnitList(data.units || []);
      } catch (err) {
        console.error('Gagal mengambil data unit:', err);
      }
    };
    if (authToken) fetchUnits();
  }, [authToken]);

  // Debounce search
  const debouncedSearch = useMemo(() => {
    let t;
    return (val) => {
      clearTimeout(t);
      t = setTimeout(() => setSearchTerm(val), 300);
    };
  }, []);

  // Fetch daftar jasa
  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (searchTerm) params.append('search', searchTerm);
        if (selectedPortfolioId) params.append('portfolio', selectedPortfolioId);
        if (selectedSectorId) params.append('sector', selectedSectorId);
        if (sortBy) params.append('sort', sortBy);
        if (sortOrder) params.append('order', sortOrder);
        params.append('page', page);
        params.append('limit', limit);

        const res = await fetch(`http://localhost:3000/api/services?${params.toString()}`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData?.error || 'Gagal mengambil data layanan');
        }

        const data = await res.json();
        setServices(data.services || []);
        setTotal(data.total || 0);
      } catch (error) {
        console.error('Gagal mengambil data layanan:', error.message);
      } finally {
        setLoading(false);
      }
    };
    if (authToken) fetchServices();
  }, [searchTerm, selectedPortfolioId, selectedSectorId, page, limit, sortBy, sortOrder, authToken]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedPortfolioId('');
    setSelectedSectorId('');
    setPage(1);
  };

  const totalPages = Math.ceil(total / limit);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  // Modal delete open
  const openDelete = (id, name) => {
    setDeleting({ id, name });
    setShowDeleteModal(true);
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!deleting.id) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`http://localhost:3000/api/services/${deleting.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData?.error || 'Gagal menghapus layanan');
      }
      // Update list lokal
      setServices((prev) => prev.filter((s) => s.id !== deleting.id));
      setTotal((prev) => Math.max(prev - 1, 0));
      setShowDeleteModal(false);
      setDeleting({ id: null, name: '' });
    } catch (err) {
      console.error('Gagal menghapus layanan:', err);
      // Bisa tambahkan toast di sini jika kamu pakai useToast
    } finally {
      setIsDeleting(false);
    }
  };

  const renderSortIcon = (field) => {
    if (sortBy !== field) return <ArrowUpDown className="w-4 h-4 ml-1 text-gray-400" />;
    return sortOrder === 'asc'
      ? <ChevronUp className="w-4 h-4 ml-1 text-gray-600" />
      : <ChevronDown className="w-4 h-4 ml-1 text-gray-600" />;
  };

  return (
    <>
      <Helmet><title>Daftar Layanan | SAKTI Platform</title></Helmet>

      {/* HERO */}
      <motion.div
        className="relative overflow-hidden rounded-3xl p-8 sm:p-10 text-white shadow-lg mb-6"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#000476] to-indigo-800" />
        <div className="absolute inset-0 bg-[radial-gradient(900px_circle_at_20%_-10%,rgba(255,255,255,0.15),transparent)]" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2 flex items-center gap-2">
              <Layers className="w-7 h-7 text-white" /> Daftar Layanan
            </h1>
            <p className="text-blue-100 text-sm sm:text-base">
              Jelajahi katalog layanan
            </p>
          </div>
          {!cannotEdit && (
            <Link to="/tambah-jasa">
              <Button className="bg-white text-[#000476] hover:bg-blue-50 font-medium">
                <Plus className="w-4 h-4 mr-2" /> Tambah Layanan
              </Button>
            </Link>
          )}
        </div>
      </motion.div>

      {/* FILTERS */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2">
              <Filter className="w-5 h-5" /><span>Filter & Pencarian</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Cari nama layanan atau kode…"
                onChange={(e) => { debouncedSearch(e.target.value); setPage(1); }}
                className="pl-10"
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Portfolio</label>
                <select
                  value={selectedPortfolioId}
                  onChange={(e) => { setSelectedPortfolioId(e.target.value); setPage(1); }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md"
                >
                  <option value="">Semua Portfolio</option>
                  {portfolioList.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sektor</label>
                <select
                  value={selectedSectorId}
                  onChange={(e) => { setSelectedSectorId(e.target.value); setPage(1); }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md"
                >
                  <option value="">Semua Sektor</option>
                  {sectorList.map((s) => <option key={s.id} value={s.id}>{s.code} — {s.name}</option>)}
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

      {/* STATUS BAR */}
      <motion.div
        className="flex items-center justify-between mt-6"
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.05 }}
      >
        <p className="text-gray-600">
          {loading ? 'Memuat layanan…' : `Menampilkan ${services.length} layanan dari total ${total}`}
        </p>
      </motion.div>

      {/* TABLE */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="mt-3">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead onClick={() => handleSort('name')} className="cursor-pointer select-none">
                    <div className="flex items-center">Nama Layanan {renderSortIcon('name')}</div>
                  </TableHead>
                  <TableHead><div className="flex items-center">Kode</div></TableHead>
                  <TableHead><div className="flex items-center">Sub-Portfolio</div></TableHead>
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
                {loading && Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`} className="animate-pulse">
                    <TableCell><div className="h-4 w-48 bg-gray-200 rounded" /></TableCell>
                    <TableCell><div className="h-4 w-24 bg-gray-200 rounded" /></TableCell>
                    <TableCell><div className="h-4 w-40 bg-gray-200 rounded" /></TableCell>
                    <TableCell><div className="h-4 w-32 bg-gray-200 rounded" /></TableCell>
                    <TableCell><div className="h-4 w-56 bg-gray-200 rounded" /></TableCell>
                    <TableCell className="text-center"><div className="h-8 w-40 bg-gray-200 rounded mx-auto" /></TableCell>
                  </TableRow>
                ))}

                {!loading && services.map((service, index) => (
                  <motion.tr
                    key={service.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25, delay: index * 0.03 }}
                    className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
                  >
                    <TableCell className="font-medium text-gray-900">{service.name}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-800 border">
                        {service.code || '-'}
                      </span>
                    </TableCell>
                    <TableCell>{service.subPortfolio || '-'}</TableCell>
                    <TableCell>{service.portfolio || '-'}</TableCell>
                    <TableCell>
                      {(service.sectors || []).length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {service.sectors.map((sec, i) => (
                            <span key={`${service.id}-sec-${i}`} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-700 border border-blue-100">
                              {sec}
                            </span>
                          ))}
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center items-center gap-2">
                        {canViewDetail && (
                          <Link to={`/service/${service.id}`}>
                            <Button variant="outline" size="sm" className="py-5"> <Eye className="w-4 h-4 mr-1" /> Detail </Button>
                          </Link>
                        )}
                        {!cannotEdit && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-green-700 border-green-600 py-5"
                              onClick={() => {
                                setRevenueForm({ service_id: service.id, customer_name: '', revenue: '', unit_id: '' });
                                setShowRevenueModal(true);
                              }}
                            >
                              Tambah Pelanggan
                            </Button>

                            <Link to={`/edit-service/${service.id}`}>
                              <Button variant="outline" size="sm" className="text-blue-700 border-blue-600 py-5">
                                Edit
                              </Button>
                            </Link>

                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-700 border-red-600 py-5"
                              onClick={() => openDelete(service.id, service.name)}
                            >
                              <Trash2 className="w-4 h-4 mr-1" /> Hapus
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>

            {/* Empty state */}
            {!loading && services.length === 0 && (
              <div className="text-center py-14">
                <p className="text-gray-600">Tidak ada layanan yang ditemukan.</p>
                <Button variant="outline" onClick={clearFilters} className="mt-4">Reset Filter</Button>
              </div>
            )}

            {/* Pagination */}
            {!loading && services.length > 0 && (
              <div className="flex justify-between items-center px-4 py-4">
                <p className="text-sm text-gray-600">Halaman {page} dari {totalPages}</p>
                <div className="space-x-2">
                  <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => Math.max(p - 1, 1))}>
                    Sebelumnya
                  </Button>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(p + 1, totalPages))}>
                    Selanjutnya
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* MODAL: Tambah Pendapatan */}
      {showRevenueModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Tambah Pendapatan Layanan</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Nama Pelanggan</label>
                <Input value={revenueForm.customer_name} onChange={(e) => setRevenueForm({ ...revenueForm, customer_name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm mb-1">Pendapatan (Rp)</label>
                <Input type="number" value={revenueForm.revenue} onChange={(e) => setRevenueForm({ ...revenueForm, revenue: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm mb-1">Unit</label>
                <select
                  className="w-full border border-gray-300 rounded-md px-2 py-2"
                  value={revenueForm.unit_id}
                  onChange={(e) => setRevenueForm({ ...revenueForm, unit_id: e.target.value })}
                >
                  <option value="">Pilih Unit</option>
                  {unitList.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowRevenueModal(false)}>Batal</Button>
              <Button onClick={async () => {
                try {
                  const res = await fetch(`http://localhost:3000/api/services/${revenueForm.service_id}/revenue`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
                    body: JSON.stringify({
                      customer_name: revenueForm.customer_name,
                      revenue: revenueForm.revenue,
                      unit_id: revenueForm.unit_id,
                    }),
                  });
                  const result = await res.json();
                  if (!res.ok) throw new Error(result.error || 'Gagal tambah revenue');
                  setShowRevenueModal(false);
                } catch (err) {
                  alert(`Gagal tambah pendapatan: ${err.message}`);
                }
              }}>
                Simpan
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Konfirmasi Hapus */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Layanan?</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-gray-600">
            Kamu akan menghapus <span className="font-semibold text-gray-900">{deleting.name || '—'}</span>. Tindakan ini tidak bisa dibatalkan.
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>Batal</Button>
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

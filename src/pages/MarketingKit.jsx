import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Download, Search, Filter, Upload, Trash2, Layers, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table.jsx';
import DownloadFormModal from '@/components/DownloadFormModal.jsx';
import { useAuth, ROLES } from '@/contexts/AuthContext.jsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import UploadFile from '@/components/admin/UploadFile.jsx';
import EditFormModal from '@/components/admin/EditFormModal.jsx';
import { useToast } from '@/components/ui/use-toast.js';
import ResponsiveSelect from '@/components/ui/ResponsiveSelect.jsx';

function MarketingKit() {
  const [kits, setKits] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPortfolio, setSelectedPortfolio] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [showDownloadForm, setShowDownloadForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState([]);
  const { user, authToken } = useAuth();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Delete confirmation modal state (baru)
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingKit, setDeletingKit] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const canAccess = user && user.role !== ROLES.VIEWER;
  const isAdmin = user && user.role === ROLES.ADMIN;
  const cannotEdit = user?.role === 'viewer' || user?.role === 'pdo' || user?.unit?.type === 'cabang';

  // Debounce kecil buat search
  const [inputSearch, setInputSearch] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setSearchTerm(inputSearch), 300);
    return () => clearTimeout(t);
  }, [inputSearch]);

  const fetchMarketingKits = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedPortfolio) params.append('file_type', selectedPortfolio);
      if (selectedService) params.append('service', selectedService);

      const response = await fetch(
        `http://localhost:3000/api/marketing-kits?${params.toString()}`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      const data = await response.json();
      setKits(data.marketing_kits || []);
    } catch (error) {
      console.error('Gagal mengambil marketing kits:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authToken) fetchMarketingKits();
  }, [searchTerm, selectedPortfolio, selectedService, authToken]);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/services?limit=9999', {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        const data = await res.json();
        setServices(data.services || []);
      } catch (error) {
        console.error('Gagal mengambil layanan:', error.message);
      }
    };
    if (authToken) fetchServices();
  }, [authToken]);

  const portfolios = useMemo(() => {
    return [...new Set(kits.map(kit => kit.file_type).filter(Boolean))];
  }, [kits]);

  const filteredKits = useMemo(() => {
    return kits.filter(kit => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        kit.name?.toLowerCase().includes(q) ||
        (kit.services || []).some(s => s.name?.toLowerCase().includes(q) || s.code?.toLowerCase().includes(q));
      const matchesPortfolio = !selectedPortfolio || kit.file_type === selectedPortfolio;
      const matchesService = !selectedService || (kit.services || []).some(s => s.id.toString() === selectedService);
      return matchesSearch && matchesPortfolio && matchesService;
    });
  }, [kits, searchTerm, selectedPortfolio, selectedService]);

  const handleDownloadClick = (file) => {
    setSelectedFile(file);
    setShowDownloadForm(true);
  };

  // OPEN delete modal
  const handleAskDelete = (kit) => {
    setDeletingKit(kit);
    setShowDeleteModal(true);
  };

  // CONFIRM delete action
  const handleDeleteKit = async () => {
    if (!deletingKit) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`http://localhost:3000/api/marketing-kits/${deletingKit.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Gagal menghapus file.');
      }
      setKits(prev => prev.filter(k => k.id !== deletingKit.id));
      setShowDeleteModal(false);
      setDeletingKit(null);
      toast({ title: "Berhasil", description: "File marketing kit berhasil dihapus." });
    } catch (error) {
      console.error('Error saat menghapus file:', error);
      toast({ title: "Gagal menghapus", description: error.message, variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!canAccess) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Akses Ditolak</h2>
        <p className="text-gray-600">Anda tidak memiliki akses ke halaman ini.</p>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Marketing Kit | SAKTI Platform</title>
        <meta name="description" content="Download marketing materials, brochures, and documentation for our services" />
      </Helmet>

      {/* HERO: konsisten & profesional */}
      <motion.div
        className="relative overflow-hidden rounded-3xl p-8 sm:p-10 text-white shadow-lg mb-6"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#000476] to-indigo-800" />
        <div className="absolute inset-0 bg-[radial-gradient(900px_circle_at_20%_-10%,rgba(255,255,255,0.15),transparent)]" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2 flex items-center gap-2">
              <Layers className="w-7 h-7 text-white" /> Marketing Kit
            </h1>
            <p className="text-blue-100 text-sm sm:text-base">
              Unduh materi pemasaran, brosur, dan dokumentasi layanan
            </p>
          </div>
          {isAdmin && !cannotEdit && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-white text-[#000476] hover:bg-blue-50 font-medium">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload File
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                  <DialogTitle className="text-lg font-semibold text-[#000476] tracking-wide flex items-center gap-2">
                    <Upload className="w-5 h-5 text-[#000476]" />
                    Upload File Marketing Kit
                  </DialogTitle>
                  <DialogDescription>Tambahkan file marketing baru ke dalam sistem.</DialogDescription>
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

      {/* FILTERS */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-[#000476]" />
              <span>Filter & Pencarian</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Cari nama file, kode layanan, atau nama layanan…"
                value={inputSearch}
                onChange={(e) => setInputSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <ResponsiveSelect
                label="Tipe File"
                value={selectedPortfolio}
                onChange={(e) => setSelectedPortfolio(e.target.value)}
                options={portfolios.map((p) => ({ value: p, label: p }))}
                placeholder="Semua Tipe File"
              />
              <ResponsiveSelect
                label="Layanan"
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                options={services.map((s) => ({ value: s.id, label: s.name }))}
                placeholder="Semua Layanan"
              />
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setInputSearch('');
                    setSearchTerm('');
                    setSelectedPortfolio('');
                    setSelectedService('');
                  }}
                  className="w-full"
                >
                  Reset Filter
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* STATUS */}
      <motion.div
        className="flex items-center justify-between mt-6"
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.05 }}
      >
        <p className="text-gray-600">
          {loading ? 'Memuat data…' : `Menampilkan ${filteredKits.length} file`}
        </p>
      </motion.div>

      {/* TABLE */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="mt-3">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table className="min-w-full">
                <TableHeader className="bg-gray-50 sticky top-0 z-10">
                  <TableRow>
                    <TableHead>Nama File</TableHead>
                    <TableHead>Tipe File</TableHead>
                    <TableHead>Layanan Terkait</TableHead>
                    <TableHead>Diupload Oleh</TableHead>
                    <TableHead>Tanggal Upload</TableHead>
                    <TableHead className="text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Skeleton loading */}
                  {loading && Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={`sk-${i}`} className="animate-pulse">
                      <TableCell><div className="h-4 w-48 bg-gray-200 rounded" /></TableCell>
                      <TableCell><div className="h-4 w-24 bg-gray-200 rounded" /></TableCell>
                      <TableCell><div className="h-4 w-72 bg-gray-200 rounded" /></TableCell>
                      <TableCell><div className="h-4 w-40 bg-gray-200 rounded" /></TableCell>
                      <TableCell><div className="h-4 w-28 bg-gray-200 rounded" /></TableCell>
                      <TableCell className="text-center"><div className="h-8 w-40 bg-gray-200 rounded mx-auto" /></TableCell>
                    </TableRow>
                  ))}

                  {!loading && filteredKits.map((kit, idx) => (
                    <motion.tr
                      key={kit.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.25, delay: idx * 0.02 }}
                      className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
                    >
                      <TableCell className="font-medium text-gray-900">{kit.name}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-800 border">
                          {kit.file_type || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {kit.services && kit.services.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {kit.services.slice(0, 4).map(service => (
                              <span
                                key={service.id}
                                className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium border border-blue-100"
                              >
                                {service.code ? `${service.code} — ` : ''}{service.name}
                              </span>
                            ))}
                            {kit.services.length > 4 && (
                              <span className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded text-xs font-medium">
                                +{kit.services.length - 4}
                              </span>
                            )}
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>{kit.uploader?.full_name || '-'}</TableCell>
                      <TableCell>{kit.created_at ? new Date(kit.created_at).toLocaleDateString() : '-'}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center items-center gap-2">
                          {!cannotEdit && (
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
                                className="text-red-700 border-red-600"
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
                            title="Download"
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

            {/* Empty state */}
            {!loading && filteredKits.length === 0 && (
              <div className="text-center py-14">
                <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center">
                  <Search className="w-7 h-7 text-gray-400" />
                </div>
                <p className="text-gray-700 font-medium">Tidak ada data ditemukan</p>
                <p className="text-gray-500 text-sm mt-1">Coba ubah kata kunci atau reset filter</p>
                <Button variant="outline" onClick={() => {
                  setInputSearch(''); setSearchTerm(''); setSelectedPortfolio(''); setSelectedService('');
                }} className="mt-4">
                  Reset Filter
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* MODAL: Edit */}
      <EditFormModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        file={selectedFile}
        services={services}
        authToken={authToken}
        onUpdateSuccess={() => {
          fetchMarketingKits();
          setShowEditModal(false);
        }}
      />

      {/* MODAL: Download form */}
      {showDownloadForm && (
        <DownloadFormModal file={selectedFile} onClose={() => setShowDownloadForm(false)} />
      )}

      {/* MODAL: Konfirmasi Hapus */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus File Marketing Kit?</DialogTitle>
            <DialogDescription>
              Tindakan ini tidak bisa dibatalkan. File akan dihapus permanen.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 text-sm text-gray-700">
            Kamu akan menghapus{' '}
            <span className="font-semibold text-gray-900">
              {deletingKit?.name || '—'}
            </span>
            .
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>Batal</Button>
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

/**
 * components/admin/PasswordResetRequests.jsx
 *
 * Komponen untuk mengelola permintaan reset password dari pengguna (admin-driven flow).
 * Menampilkan daftar permintaan yang belum diproses, dengan filter, sorting, dan pagination.
 * Admin dapat mereset password user → menghasilkan password sementara yang ditampilkan modal.
 *
 * ============================================================
 * STRUKTUR DATA RESPONSE API
 * ============================================================
 * GET /admin/password-reset-requests:
 * {
 *   success: true,
 *   data: {
 *     requests: [{ id, user: { full_name, email, role, unit: { name } }, created_at }],
 *     pagination: { total_pages, current_page, total, limit }
 *   }
 * }
 *
 * POST /admin/password-reset-requests/:id/reset:
 * {
 *   success: true,
 *   data: { temp_password: string, email: string, full_name: string }
 * }
 *
 * ============================================================
 * PANDUAN MAINTENANCE
 * ============================================================
 * - Semua state dan efek dikelola dengan hooks
 * - Sorting dan filter dilakukan di client (karena jumlah permintaan terbatas)
 * - Pagination diteruskan ke backend untuk efisiensi
 * - Modal menampilkan password sementara dengan fitur toggle dan copy
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectValue,
  SelectItem,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Search, ArrowUpDown, KeyRound, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { PAGINATION } from '@/lib/constants';

// ============================================================
// Helper Functions
// ============================================================

/**
 * Mengubah string ke Title Case (setiap kata dimulai huruf besar).
 * @param {string} str
 * @returns {string}
 */
function toTitleCase(str) {
  if (!str) return '';
  return str.replace(/\w\S*/g, (txt) =>
    txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase()
  );
}

/**
 * Menormalisasi data response dari API ke format internal yang konsisten.
 * @param {Array} rawRequests - Data mentah dari API
 * @returns {Array} Array objek request yang sudah dinormalisasi
 */
function normalizeRequests(rawRequests = []) {
  return rawRequests.map((r) => ({
    id: r.id,
    name: r.user?.full_name || '—',
    email: r.user?.email || '—',
    role: r.user?.role || '—',
    workUnit: r.user?.unit?.name || '-',
    createdAt: r.created_at,
  }));
}

// ============================================================
// Komponen Utama
// ============================================================

/**
 * PasswordResetRequests - Tabel permintaan reset password dengan fitur lengkap.
 * @returns {JSX.Element}
 */
const PasswordResetRequests = () => {
  const { toast } = useToast();
  const { authToken } = useAuth(); // Tersedia untuk keperluan auth, tidak digunakan langsung

  // State data utama
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  // State filter & pencarian
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ role: '', workUnit: '' });

  // State sorting
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'ascending' });

  // State pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // State modal hasil reset password
  const [showResultModal, setShowResultModal] = useState(false);
  const [resetResult, setResetResult] = useState({ email: '', password: '' });
  const [showResetPw, setShowResetPw] = useState(false);

  // ============================================================
  // Data Fetch: Mendapatkan daftar permintaan reset password
  // ============================================================
  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/password-reset-requests', {
        params: { page: currentPage, limit: PAGINATION.ADMIN_LIMIT },
      });
      // Normalisasi response (mendukung struktur { data: { requests } } atau langsung)
      const responseData = res.data?.data ?? res.data;
      const rawRequests = responseData?.requests ?? responseData?.items ?? [];
      const normalized = normalizeRequests(rawRequests);
      setRequests(normalized);
      setTotalPages(responseData?.pagination?.total_pages ?? 1);
    } catch (err) {
      console.error('[PasswordResetRequests] Fetch error:', err);
      toast({
        title: 'Gagal memuat permintaan reset password',
        description: err.response?.data?.error || err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, toast]);

  // Reload data setiap kali halaman berubah
  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // ============================================================
  // Handler Reset Password
  // ============================================================
  const handleResetPassword = async (id, name) => {
    setProcessingId(id);
    try {
      const res = await api.post(`/admin/password-reset-requests/${id}/reset`);
      // Response bisa mengembalikan data di berbagai properti
      const newPassword = res.data?.temp_password || res.data?.password;
      const userEmail = res.data?.email || name;
      if (newPassword) {
        setResetResult({ email: userEmail, password: newPassword });
        setShowResetPw(false);
        setShowResultModal(true);
      }
      toast({
        title: 'Password Berhasil Direset',
        description: `Password baru untuk ${name} sudah di-generate.`,
      });
      // Refresh daftar permintaan
      fetchRequests();
    } catch (err) {
      toast({
        title: 'Gagal mereset password',
        description: err.response?.data?.error || err.message,
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  // ============================================================
  // Filtering & Sorting (client-side)
  // ============================================================
  const filteredRequests = useMemo(() => {
    let filtered = requests;
    // Pencarian nama/email
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (r) => r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q)
      );
    }
    // Filter role
    if (filters.role) {
      filtered = filtered.filter((r) => r.role === filters.role);
    }
    // Filter unit kerja
    if (filters.workUnit) {
      filtered = filtered.filter((r) => r.workUnit === filters.workUnit);
    }
    return filtered;
  }, [requests, searchTerm, filters]);

  const sortedRequests = useMemo(() => {
    const copy = [...filteredRequests];
    if (!sortConfig.key) return copy;
    copy.sort((a, b) => {
      const aVal = a[sortConfig.key] ?? '';
      const bVal = b[sortConfig.key] ?? '';
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortConfig.direction === 'ascending' ? cmp : -cmp;
    });
    return copy;
  }, [filteredRequests, sortConfig]);

  const requestSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction:
        prev.key === key && prev.direction === 'ascending' ? 'descending' : 'ascending',
    }));
  };

  // ============================================================
  // Data untuk dropdown filter
  // ============================================================
  const uniqueRoles = [...new Set(requests.map((r) => r.role).filter(Boolean))];
  const uniqueUnits = [
    ...new Set(requests.map((r) => r.workUnit).filter((w) => w && w !== '-')),
  ];

  // ============================================================
  // Render
  // ============================================================
  return (
    <>
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle>Permintaan Reset Password</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filter Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Cari nama atau email…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            {/* Filter Role */}
            <Select
              value={filters.role || 'all'}
              onValueChange={(v) =>
                setFilters((f) => ({ ...f, role: v === 'all' ? '' : v }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Role</SelectItem>
                {uniqueRoles.map((r) => (
                  <SelectItem key={r} value={r}>
                    {toTitleCase(r)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Filter Unit Kerja */}
            <Select
              value={filters.workUnit || 'all'}
              onValueChange={(v) =>
                setFilters((f) => ({ ...f, workUnit: v === 'all' ? '' : v }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter Unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Unit</SelectItem>
                {uniqueUnits.map((u) => (
                  <SelectItem key={u} value={u}>
                    {u}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Reset Button */}
            <Button
              variant="outline"
              onClick={() => {
                setFilters({ role: '', workUnit: '' });
                setSearchTerm('');
              }}
            >
              Reset Filter
            </Button>
          </div>

          {/* Table */}
          <div className="rounded-xl border border-gray-100 overflow-hidden">
            {loading ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-10 bg-gray-100 animate-pulse rounded" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-gray-50 sticky top-0 z-10">
                  <TableRow>
                    <TableHead className="min-w-[200px]">
                      <Button variant="ghost" onClick={() => requestSort('name')}>
                        Nama <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Unit Kerja</TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => requestSort('createdAt')}>
                        Diminta Pada <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedRequests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                        Tidak ada permintaan reset password.
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedRequests.map((req, idx) => (
                      <TableRow
                        key={req.id}
                        className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}
                      >
                        <TableCell className="font-medium">{req.name}</TableCell>
                        <TableCell>{req.email}</TableCell>
                        <TableCell>{toTitleCase(req.role)}</TableCell>
                        <TableCell>{req.workUnit}</TableCell>
                        <TableCell>
                          {new Date(req.createdAt).toLocaleString('id-ID')}
                        </TableCell>
                        <TableCell className="text-center">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="outline">
                                <KeyRound className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Reset Password?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Password baru akan di-generate otomatis untuk{' '}
                                  <strong>{req.name}</strong>.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleResetPassword(req.id, req.name)}
                                  disabled={processingId === req.id}
                                  className="bg-[#000476] hover:bg-indigo-900"
                                >
                                  {processingId === req.id ? 'Memproses…' : 'Reset Password'}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-end gap-2 py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1 || loading}
            >
              Previous
            </Button>
            <span className="text-sm">
              Halaman {currentPage} dari {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || loading}
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modal Hasil Reset Password */}
      <Dialog open={showResultModal} onOpenChange={setShowResultModal}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Password Baru</DialogTitle>
            <DialogDescription>
              Berikan password ini kepada pengguna. Hanya ditampilkan sekali.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs text-gray-500">Email</Label>
              <p className="text-sm bg-gray-50 px-3 py-2 rounded-lg mt-1">
                {resetResult.email}
              </p>
            </div>
            <div>
              <Label className="text-xs text-gray-500">Password Baru</Label>
              <div className="flex items-center gap-2 mt-1">
                <p className="flex-1 text-sm font-mono bg-gray-50 px-3 py-2 rounded-lg tracking-wider">
                  {showResetPw ? resetResult.password : '••••••••••••'}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowResetPw((v) => !v)}
                >
                  {showResetPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(resetResult.password);
                    toast({ title: 'Password disalin ke clipboard' });
                  }}
                >
                  Salin
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">Tutup</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

// PropTypes untuk dokumentasi (opsional)
PasswordResetRequests.propTypes = {
  // Tidak ada props yang diharapkan
};

export default PasswordResetRequests;
/**
 * components/admin/WaitingUsers.jsx
 *
 * Komponen untuk menampilkan daftar pengguna yang menunggu verifikasi (is_verified = null).
 * Admin dapat menyetujui (approve) atau menolak (reject) pendaftaran.
 *
 * ============================================================
 * STRUKTUR DATA API
 * ============================================================
 * GET /admin/waiting-users
 *   Query params: page, limit, search (optional)
 *   Response: { data: { users: [...], pagination: { total_pages, current_page, ... } } }
 *
 * POST /admin/waiting-users/:id/approve
 * POST /admin/waiting-users/:id/reject
 *   Response: success message
 *
 * ============================================================
 * PANDUAN MAINTENANCE
 * ============================================================
 * - Pencarian menggunakan debounce (350ms) untuk mengurangi request.
 * - Pagination dikontrol dari backend, data diambil ulang saat halaman atau search berubah.
 * - Modal konfirmasi sebelum approve/reject untuk mencegah kesalahan.
 * - Skeleton loading ditampilkan saat fetching data.
 * - Setelah aksi, daftar di-refresh dan halaman tetap sama (kecuali kosong, fallback ke halaman sebelumnya).
 */

import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Check, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
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
  return str.replace(/\w\S*/g, (t) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase());
}

// ============================================================
// Konstanta
// ============================================================

/** Durasi debounce pencarian (ms) */
const SEARCH_DEBOUNCE_DELAY = 350;

/** State awal untuk modal konfirmasi */
const INITIAL_MODAL_STATE = {
  open: false,
  action: '', // 'approve' | 'reject'
  user: null,
};

// ============================================================
// Komponen Skeleton Loading
// ============================================================

/**
 * Menampilkan placeholder baris tabel saat loading.
 * @returns {JSX.Element}
 */
const TableSkeleton = () => (
  <div className="space-y-2">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="h-10 bg-gray-100 animate-pulse rounded" />
    ))}
  </div>
);

// ============================================================
// Komponen Utama
// ============================================================

/**
 * WaitingUsers - Daftar pengguna menunggu verifikasi dengan aksi approve/reject.
 * @returns {JSX.Element}
 */
function WaitingUsers() {
  const { toast } = useToast();

  // State data utama
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  // State pencarian (dengan debounce)
  const [inputSearch, setInputSearch] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // State pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // State modal konfirmasi
  const [modal, setModal] = useState(INITIAL_MODAL_STATE);

  // ============================================================
  // Effect: Debounce pencarian
  // ============================================================
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(inputSearch);
      setCurrentPage(1); // Reset halaman saat pencarian berubah
    }, SEARCH_DEBOUNCE_DELAY);
    return () => clearTimeout(timer);
  }, [inputSearch]);

  // ============================================================
  // Fetch Data: Mendapatkan daftar user yang menunggu verifikasi
  // ============================================================
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: PAGINATION.ADMIN_LIMIT,
      };
      if (searchTerm) params.search = searchTerm;

      const response = await api.get('/admin/waiting-users', { params });
      const responseData = response.data?.data ?? response.data;
      setUsers(responseData.users || []);
      setTotalPages(responseData.pagination?.total_pages || 1);
    } catch (err) {
      console.error('[WaitingUsers] Fetch error:', err);
      toast({
        title: 'Gagal Memuat Data',
        description: err.response?.data?.error || 'Tidak dapat mengambil data dari server.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, toast]);

  // Efek untuk mengambil data saat halaman atau pencarian berubah
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ============================================================
  // Handler: Approve / Reject
  // ============================================================
  const handleConfirm = async () => {
    const { user, action } = modal;
    if (!user) return;

    setProcessing(true);
    try {
      await api.post(`/admin/waiting-users/${user.id}/${action}`);
      toast({
        title: action === 'approve' ? `${user.full_name} disetujui` : `${user.full_name} ditolak`,
        description:
          action === 'approve'
            ? 'Akun pengguna telah diaktifkan.'
            : 'Pendaftaran ditolak.',
      });
      // Refresh daftar setelah aksi
      await fetchUsers();
      // Jika setelah refresh halaman kosong dan bukan halaman 1, mundur ke halaman sebelumnya
      if (users.length === 1 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      }
    } catch (err) {
      toast({
        title: 'Gagal Memproses',
        description:
          err.response?.data?.error || `Terjadi kesalahan saat memproses ${user.full_name}.`,
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
      setModal(INITIAL_MODAL_STATE);
    }
  };

  // ============================================================
  // Render
  // ============================================================
  return (
    <>
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>User Menunggu Persetujuan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Input */}
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Cari nama atau email…"
              value={inputSearch}
              onChange={(e) => setInputSearch(e.target.value)}
              className="pl-10"
              disabled={loading}
            />
          </div>

          {/* Tabel Data */}
          {loading ? (
            <TableSkeleton />
          ) : (
            <div className="rounded-xl border border-gray-100 overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Unit Kerja</TableHead>
                    <TableHead>Tanggal Daftar</TableHead>
                    <TableHead className="text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                        {searchTerm
                          ? `Tidak ada hasil untuk "${searchTerm}".`
                          : 'Tidak ada user yang menunggu persetujuan.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user, idx) => (
                      <TableRow
                        key={user.id}
                        className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}
                      >
                        <TableCell className="font-medium">{user.full_name}</TableCell>
                        <TableCell className="text-gray-600">{user.email}</TableCell>
                        <TableCell>{toTitleCase(user.role)}</TableCell>
                        <TableCell>{user.unit?.name || '-'}</TableCell>
                        <TableCell className="text-gray-600 whitespace-nowrap">
                          {new Date(user.created_at).toLocaleDateString('id-ID')}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center gap-2">
                            <Button
                              size="sm"
                              className="bg-green-500 hover:bg-green-600 text-white"
                              onClick={() =>
                                setModal({
                                  open: true,
                                  action: 'approve',
                                  user,
                                })
                              }
                              disabled={loading}
                              title="Setujui pendaftaran"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() =>
                                setModal({
                                  open: true,
                                  action: 'reject',
                                  user,
                                })
                              }
                              disabled={loading}
                              title="Tolak pendaftaran"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1 || loading}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
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
          )}
        </CardContent>
      </Card>

      {/* Modal Konfirmasi Approve/Reject */}
      <Dialog
        open={modal.open}
        onOpenChange={(open) => !processing && setModal((m) => ({ ...m, open }))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {modal.action === 'approve' ? 'Setujui Pendaftaran' : 'Tolak Pendaftaran'}
            </DialogTitle>
            <DialogDescription>
              Anda akan{' '}
              <strong>{modal.action === 'approve' ? 'menyetujui' : 'menolak'}</strong>{' '}
              pendaftaran <span className="font-medium">{modal.user?.full_name}</span>.
              {modal.action === 'approve'
                ? ' Akun akan diaktifkan dan user bisa login.'
                : ' Pendaftaran akan ditolak dan tidak diproses lebih lanjut.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setModal(INITIAL_MODAL_STATE)}
              disabled={processing}
            >
              Batal
            </Button>
            <Button
              className={
                modal.action === 'approve'
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }
              onClick={handleConfirm}
              disabled={processing}
            >
              {processing ? 'Memproses…' : modal.action === 'approve' ? 'Setujui' : 'Tolak'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// PropTypes untuk dokumentasi (opsional)
WaitingUsers.propTypes = {
  // Tidak ada props yang diharapkan
};

export default WaitingUsers;
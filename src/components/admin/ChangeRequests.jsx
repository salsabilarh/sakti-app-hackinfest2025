/**
 * components/admin/ChangeRequests.jsx
 *
 * Komponen untuk mengelola permintaan perubahan unit kerja dan/atau role dari pengguna.
 * (Catatan: Backend saat ini hanya mendukung perubahan unit kerja, bukan role.
 *  Komponen ini tetap dapat diadaptasi jika nanti role change request ditambahkan.)
 *
 * Data diambil dari endpoint:
 *   GET  /api/admin/change-requests   (daftar permintaan, support pagination)
 *   PUT  /api/admin/change-requests/:id/process (action: 'approve' | 'reject')
 *
 * ============================================================
 * STRUKTUR DATA RESPONSE API
 * ============================================================
 * GET /admin/change-requests:
 * {
 *   success: true,
 *   data: {
 *     requests: [{
 *       id: string,
 *       user: { id, full_name, email, role? },
 *       current_unit: { id, name },
 *       requested_unit: { id, name },
 *       status: 'pending' | 'approved' | 'rejected',
 *       admin_notes?: string,
 *       diajukan_pada: string
 *     }],
 *     pagination: { total, page, limit, total_pages }
 *   }
 * }
 *
 * ============================================================
 * PANDUAN MAINTENANCE
 * ============================================================
 * - Gunakan konstanta untuk status dan pesan error.
 * - Tampilkan badge status dengan warna berbeda.
 * - Tombol approve/reject hanya muncul jika status pending.
 * - Dukungan pagination dari backend.
 * - Loading skeleton untuk pengalaman pengguna yang lebih baik.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  return str.replace(/\w\S*/g, (t) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase());
}

/**
 * Mendapatkan nama user dari objek user yang mungkin memiliki properti berbeda.
 * @param {Object} user
 * @returns {string}
 */
function getUserName(user) {
  return user?.full_name || user?.name || '-';
}

/**
 * Mendapatkan email user.
 * @param {Object} user
 * @returns {string}
 */
function getUserEmail(user) {
  return user?.email || '-';
}

/**
 * Mendapatkan nama unit dari objek unit.
 * @param {Object} unit
 * @returns {string}
 */
function getUnitName(unit) {
  return unit?.name || '-';
}

// ============================================================
// Subkomponen: Status Badge
// ============================================================

/**
 * Menampilkan badge status permintaan dengan warna sesuai.
 * @param {Object} props
 * @param {string} props.status - 'pending' | 'approved' | 'rejected'
 */
const StatusBadge = ({ status }) => {
  const statusConfig = {
    pending: { label: 'Pending', className: 'bg-amber-500' },
    approved: { label: 'Disetujui', className: 'bg-green-600' },
    rejected: { label: 'Ditolak', className: 'bg-red-600' },
  };
  const config = statusConfig[status] || { label: status || '-', className: 'bg-gray-500' };
  return <Badge className={`${config.className} text-white`}>{config.label}</Badge>;
};

// ============================================================
// Subkomponen: Tombol Aksi (Approve/Reject)
// ============================================================

/**
 * Tombol aksi untuk permintaan pending.
 * @param {Object} props
 * @param {string} props.id - ID permintaan
 * @param {string} props.status - Status saat ini
 * @param {boolean} props.isLoading - Apakah sedang diproses (disable)
 * @param {Function} props.onProcess - Callback saat approve/reject diklik
 */
const ActionButtons = ({ id, status, isLoading = false, onProcess }) => {
  if (status !== 'pending') {
    return <StatusBadge status={status} />;
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        onClick={() => onProcess(id, 'approve')}
        disabled={isLoading}
        className="bg-green-600 hover:bg-green-700 text-white"
      >
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="w-4 h-4" />}
        <span className="ml-1">Setujui</span>
      </Button>
      <Button
        variant="destructive"
        size="sm"
        onClick={() => onProcess(id, 'reject')}
        disabled={isLoading}
      >
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="w-4 h-4" />}
        <span className="ml-1">Tolak</span>
      </Button>
    </div>
  );
};

// ============================================================
// Subkomponen: Loading Skeleton
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
 * ChangeRequestPage - Halaman daftar permintaan perubahan unit/role.
 * Admin dapat menyetujui atau menolak permintaan.
 * @returns {JSX.Element}
 */
const ChangeRequestPage = () => {
  const { toast } = useToast();
  const { user } = useAuth();

  // State data
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // ============================================================
  // Data Fetching
  // ============================================================
  const fetchRequests = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const res = await api.get('/admin/change-requests', {
          params: { page, limit: PAGINATION.ADMIN_LIMIT },
        });
        const responseData = res.data?.data ?? res.data;
        const list = responseData?.requests ?? responseData?.items ?? [];
        const total = responseData?.pagination?.total_pages ?? 1;
        setRequests(Array.isArray(list) ? list : []);
        setTotalPages(Number(total) || 1);
        setCurrentPage(page);
      } catch (error) {
        console.error('[ChangeRequestPage] Fetch error:', error);
        toast({
          title: 'Gagal memuat data',
          description: error.response?.data?.message || 'Terjadi kesalahan.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  // Reload data setiap kali halaman berubah
  useEffect(() => {
    fetchRequests(currentPage);
  }, [currentPage, fetchRequests]);

  // ============================================================
  // Handler: Approve / Reject
  // ============================================================
  const handleProcess = async (id, action) => {
    setActionId(id);
    try {
      // Endpoint yang benar sesuai adminController.js
      await api.put(`/admin/change-requests/${id}/process`, { action });
      toast({
        title: action === 'approve' ? 'Permintaan Disetujui' : 'Permintaan Ditolak',
        description:
          action === 'approve'
            ? 'Unit kerja pengguna telah diperbarui.'
            : 'Permintaan ditolak.',
      });
      // Refresh daftar setelah aksi
      await fetchRequests(currentPage);
    } catch (error) {
      toast({
        title: 'Gagal memproses permintaan',
        description: error.response?.data?.message || 'Terjadi kesalahan.',
        variant: 'destructive',
      });
    } finally {
      setActionId(null);
    }
  };

  // ============================================================
  // Helper: Render informasi "Dari" (current)
  // ============================================================
  const renderCurrentInfo = (item) => {
    const parts = [];
    if (item.user?.role) {
      parts.push(
        <Badge key="role" variant="secondary" className="mr-1">
          Role: {toTitleCase(item.user.role)}
        </Badge>
      );
    }
    if (item.current_unit?.name) {
      parts.push(
        <Badge key="unit" variant="outline" className="mr-1">
          Unit: {item.current_unit.name}
        </Badge>
      );
    } else if (item.current_unit_id && !item.current_unit) {
      parts.push(
        <Badge key="unit" variant="outline" className="mr-1">
          Unit ID: {item.current_unit_id}
        </Badge>
      );
    }
    if (parts.length === 0) return '-';
    return <div className="flex flex-wrap gap-1">{parts}</div>;
  };

  // ============================================================
  // Helper: Render informasi "Ke" (requested)
  // ============================================================
  const renderRequestedChange = (item) => {
    const parts = [];
    // Catatan: Backend saat ini hanya mendukung perubahan unit.
    // Jika nanti role change ditambahkan, properti `requested_role` bisa digunakan.
    if (item.requested_role) {
      parts.push(
        <Badge key="role" variant="secondary" className="mr-1">
          Role: {toTitleCase(item.requested_role)}
        </Badge>
      );
    }
    if (item.requested_unit?.name) {
      parts.push(
        <Badge key="unit" variant="outline" className="mr-1">
          Unit: {item.requested_unit.name}
        </Badge>
      );
    } else if (item.requested_unit_id && !item.requested_unit) {
      parts.push(
        <Badge key="unit" variant="outline" className="mr-1">
          Unit ID: {item.requested_unit_id}
        </Badge>
      );
    }
    if (parts.length === 0) return '-';
    return <div className="flex flex-wrap gap-1">{parts}</div>;
  };

  // ============================================================
  // Render
  // ============================================================
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle>Permintaan Perubahan Role / Unit Kerja</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <TableSkeleton />
        ) : (
          <>
            <div className="rounded-xl border border-gray-100 overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Dari</TableHead>
                    <TableHead>Ke</TableHead>
                    <TableHead>Status / Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                        Tidak ada permintaan perubahan.
                      </TableCell>
                    </TableRow>
                  ) : (
                    requests.map((item, index) => (
                      <TableRow
                        key={item.id ?? index}
                        className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}
                      >
                        <TableCell>{getUserName(item.user)}</TableCell>
                        <TableCell>{getUserEmail(item.user)}</TableCell>
                        <TableCell>{renderCurrentInfo(item)}</TableCell>
                        <TableCell>{renderRequestedChange(item)}</TableCell>
                        <TableCell>
                          <ActionButtons
                            id={item.id}
                            status={item.status}
                            isLoading={actionId === item.id}
                            onProcess={handleProcess}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-end gap-2 py-4">
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
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ChangeRequestPage;
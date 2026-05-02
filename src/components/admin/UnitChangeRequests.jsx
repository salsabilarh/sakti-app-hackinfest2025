import React, { useEffect, useState, useCallback } from 'react';
import { Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';

const ITEMS_PER_PAGE = 30;

const UnitChangeRequestPage = () => {
  const { toast } = useToast();
  const { authToken } = useAuth();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const safeGetList = (payload) =>
    // urutan prioritas: data.requests -> requests -> data -> items
    payload?.requests ??
    payload?.data ??
    payload?.items ??
    [];

  const safeGetTotalPages = (payload) =>
    payload?.pagination?.total_pages ??
    payload?.pagination?.totalPages ??
    payload?.meta?.total_pages ??
    1;

  const fetchRequests = useCallback(async (page = 1) => {
    if (!authToken) return;
    setLoading(true);
    try {
      const res = await api.get('/admin/unit-change-requests', {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
        params: { page, limit: ITEMS_PER_PAGE, _t: Date.now() },
      });

      const body = res?.data ?? {};
      const list = safeGetList(body);
      const total = safeGetTotalPages(body);

      setRequests(Array.isArray(list) ? list : []);
      setTotalPages(Number(total) || 1);
      setCurrentPage(page);
    } catch (error) {
      const status = error?.response?.status;
      const msg =
        error?.response?.data?.message ||
        (status === 401
          ? 'Sesi berakhir. Silakan login kembali.'
          : status === 403
          ? 'Akses ditolak. Hanya admin yang dapat melihat data ini.'
          : 'Terjadi kesalahan saat memuat data.');
      toast({ title: 'Gagal memuat', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [authToken, toast]);

  useEffect(() => {
    if (authToken) fetchRequests(currentPage);
  }, [authToken, currentPage, fetchRequests]);

  const handleProcess = async (id, newStatus) => {
    if (!authToken) return;
    setActionId(id);
    try {
      await api.patch(
        `/admin/unit-change-requests/${id}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      toast({
        title: 'Berhasil',
        description: newStatus === 'approved' ? 'Permintaan disetujui.' : 'Permintaan ditolak.',
      });
      await fetchRequests(currentPage);
    } catch (error) {
      const msg = error?.response?.data?.message || 'Gagal memproses permintaan.';
      toast({ title: 'Gagal', description: msg, variant: 'destructive' });
    } finally {
      setActionId(null);
    }
  };

  const StatusBadge = ({ status }) => {
    const map = { pending: 'bg-amber-500', approved: 'bg-green-600', rejected: 'bg-red-600' };
    return <Badge className={`${map[status] || 'bg-gray-500'}`}>{status || '-'}</Badge>;
  };

  const ActionButtons = ({ id, status }) => {
    if (status !== 'pending') return <StatusBadge status={status} />;
    const busy = actionId === id;
    return (
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={() => handleProcess(id, 'approved')}
          disabled={busy}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          <span className="ml-1">Approve</span>
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => handleProcess(id, 'rejected')}
          disabled={busy}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
          <span className="ml-1">Reject</span>
        </Button>
      </div>
    );
  };

  // Helper aman buat akses field beda gaya (snake vs camel, name vs full_name)
  const getUserName = (u) => u?.full_name || u?.fullName || u?.name || '-';
  const getEmail = (u) => u?.email || '-';
  const getUnitName = (obj) => obj?.name || obj?.unit_name || obj?.unitName || '-';

  const getCurrentUnit = (row) =>
    getUnitName(row?.current_unit || row?.currentUnit);

  const getRequestedUnit = (row) =>
    getUnitName(row?.requested_unit || row?.requestedUnit || row?.target_unit || row?.targetUnit);

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle>Permintaan Perubahan Unit Kerja</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 animate-pulse rounded" />
            ))}
          </div>
        ) : (
          <>
            <div className="rounded-xl border border-gray-100 overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead>No</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Unit Sekarang</TableHead>
                    <TableHead>Unit Dituju</TableHead>
                    <TableHead>Status / Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.length > 0 ? (
                    requests.map((item, index) => (
                      <TableRow
                        key={item.id || `${index}`}
                        className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}
                      >
                        <TableCell>{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</TableCell>
                        <TableCell>{getUserName(item?.user)}</TableCell>
                        <TableCell>{getEmail(item?.user)}</TableCell>
                        <TableCell>{getCurrentUnit(item)}</TableCell>
                        <TableCell>{getRequestedUnit(item)}</TableCell>
                        <TableCell>
                          <ActionButtons id={item.id} status={item?.status} />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-500 py-6">
                        Tidak ada permintaan.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-end gap-2 py-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1 || loading}
              >
                Previous
              </Button>
              <span className="text-sm">Page {currentPage} of {totalPages}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages || loading}
              >
                Next
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default UnitChangeRequestPage;

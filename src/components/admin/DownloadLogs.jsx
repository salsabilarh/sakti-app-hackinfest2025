import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-toastify';

const ITEMS_PER_PAGE = 30;

function DownloadLogs() {
  const { authToken } = useAuth();
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchDownloadLogs = async (page = 1) => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3000/api/admin/download-logs?page=${page}&limit=${ITEMS_PER_PAGE}`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      if (!response.ok) throw new Error('Gagal mengambil data log download');
      const data = await response.json();
      setLogs(data.logs);
      setPagination(data.pagination);
    } catch (error) {
      toast.error('Terjadi kesalahan saat mengambil log download.');
    } finally { setLoading(false); }
  };

  useEffect(() => { if (authToken) fetchDownloadLogs(currentPage); }, [authToken, currentPage]);

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader><CardTitle>Log Download</CardTitle></CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-10 bg-gray-100 animate-pulse rounded" />)}</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-14">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center">
              <Search className="w-7 h-7 text-gray-400" />
            </div>
            <p className="text-gray-700 font-medium">Tidak ada log download ditemukan</p>
            <p className="text-gray-500 text-sm mt-1">Aktivitas download akan muncul di sini.</p>
          </div>
        ) : (
          <>
            <div className="rounded-xl border border-gray-100 overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead>Nama File</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Tujuan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log, idx) => (
                    <TableRow key={log.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}>
                      <TableCell className="font-medium">{log.marketing_kit?.name || '-'}</TableCell>
                      <TableCell>{log.user?.full_name || '-'}</TableCell>
                      <TableCell>{log.user?.email || '-'}</TableCell>
                      <TableCell>{new Date(log.created_at).toLocaleString()}</TableCell>
                      <TableCell>{log.purpose || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {pagination && (
              <div className="flex items-center justify-end gap-2 py-4">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
                  Sebelumnya
                </Button>
                <span className="text-sm">Halaman {pagination.page} dari {pagination.total_pages}</span>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.min(pagination.total_pages, p + 1))} disabled={currentPage === pagination.total_pages}>
                  Selanjutnya
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default DownloadLogs;

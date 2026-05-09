/**
 * components/admin/DownloadLogs.jsx
 *
 * Komponen untuk menampilkan log download marketing kit di dashboard admin.
 * Data diambil dari endpoint GET /api/admin/download-logs dengan dukungan:
 * - Pencarian (search) berdasarkan nama file, nama user, atau tujuan download
 * - Pagination
 * - Loading skeleton
 *
 * ============================================================
 * STRUKTUR DATA RESPONSE API
 * ============================================================
 * Response dari GET /admin/download-logs:
 * {
 *   success: true,
 *   data: {
 *     logs: [
 *       {
 *         id: string,
 *         purpose: string,
 *         created_at: string (ISO),
 *         marketing_kit: { id, name },
 *         user: { id, full_name, email }
 *       }
 *     ],
 *     pagination: {
 *       total: number,
 *       current_page: number,
 *       per_page: number,
 *       total_pages: number
 *     }
 *   }
 * }
 *
 * ============================================================
 * PANDUAN MAINTENANCE
 * ============================================================
 * - PAGINATION.ADMIN_LIMIT didefinisikan di lib/constants.js
 * - Debounce pencarian 350ms untuk mengurangi request ke server
 * - Reset ke halaman 1 setiap kali search term berubah
 * - Sticky header tabel untuk kemudahan scrolling
 */

import React, { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';
import { PAGINATION } from '@/lib/constants';

// ============================================================
// Konstanta
// ============================================================

/** Jumlah kolom pada tabel (digunakan untuk colspan saat tidak ada data) */
const TABLE_COLUMNS_COUNT = 5;

/** Jumlah baris skeleton yang ditampilkan saat loading */
const SKELETON_ROWS_COUNT = 6;

/** Durasi debounce pencarian (ms) */
const SEARCH_DEBOUNCE_DELAY = 350;

// ============================================================
// Komponen Skeleton Loading
// ============================================================

/**
 * Menampilkan placeholder baris tabel saat loading.
 * @returns {JSX.Element[]} Array dari TableRow skeleton
 */
const TableSkeleton = () => {
  return Array.from({ length: SKELETON_ROWS_COUNT }).map((_, index) => (
    <TableRow key={`skeleton-${index}`} className="animate-pulse">
      {Array.from({ length: TABLE_COLUMNS_COUNT }).map((__, colIndex) => (
        <TableCell key={colIndex}>
          <div className="h-4 bg-gray-200 rounded" />
        </TableCell>
      ))}
    </TableRow>
  ));
};

// ============================================================
// Komponen Utama
// ============================================================

/**
 * DownloadLogs - Menampilkan tabel log download marketing kit
 * dengan pencarian dan pagination.
 *
 * @returns {JSX.Element}
 */
const DownloadLogs = () => {
  const { toast } = useToast();

  // State data
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);

  // State pagination & pencarian
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [inputSearch, setInputSearch] = useState('');

  // ============================================================
  // Effect: Debounce pencarian
  // ============================================================
  // Ketika inputSearch berubah, setelah delay, set searchTerm
  // SearchTerm memicu fetch ulang data
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(inputSearch);
    }, SEARCH_DEBOUNCE_DELAY);
    return () => clearTimeout(timer);
  }, [inputSearch]);

  // Reset halaman ke 1 setiap kali search term berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // ============================================================
  // Effect: Fetch data ketika currentPage atau searchTerm berubah
  // ============================================================
  const fetchDownloadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: PAGINATION.ADMIN_LIMIT,
      };
      if (searchTerm) {
        params.search = searchTerm;
      }

      const response = await api.get('/admin/download-logs', { params });
      // Normalisasi response: bisa langsung data atau dalam wrapper { success, data }
      const responseData = response.data?.data ?? response.data;
      setLogs(responseData.logs || []);
      setPagination(responseData.pagination || null);
    } catch (err) {
      console.error('[DownloadLogs] Error fetching logs:', err);
      toast({
        title: 'Gagal memuat log download',
        description: err.response?.data?.error || err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, toast]);

  useEffect(() => {
    fetchDownloadLogs();
  }, [fetchDownloadLogs]);

  // ============================================================
  // Render Helper: Tombol pagination
  // ============================================================
  const totalPages = pagination?.total_pages || 1;
  const currentPageNum = pagination?.current_page || currentPage;

  const handlePreviousPage = () => {
    if (currentPageNum > 1) setCurrentPage((prev) => prev - 1);
  };

  const handleNextPage = () => {
    if (currentPageNum < totalPages) setCurrentPage((prev) => prev + 1);
  };

  // ============================================================
  // Render
  // ============================================================
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle>Log Download Marketing Kit</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pencarian */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Cari file, user, atau tujuan…"
            value={inputSearch}
            onChange={(e) => setInputSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tabel Log */}
        <div className="rounded-xl border border-gray-100 overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-50 sticky top-0 z-10">
              <TableRow>
                <TableHead>Nama File</TableHead>
                <TableHead>Diunduh Oleh</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Tujuan</TableHead>
                <TableHead>Tanggal &amp; Waktu</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableSkeleton />
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={TABLE_COLUMNS_COUNT}
                    className="text-center py-8 text-gray-500"
                  >
                    {searchTerm
                      ? 'Tidak ada hasil untuk pencarian ini.'
                      : 'Belum ada log download.'}
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log, index) => (
                  <TableRow
                    key={log.id}
                    className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}
                  >
                    <TableCell className="font-medium">
                      {log.marketing_kit?.name || '—'}
                    </TableCell>
                    <TableCell>{log.user?.full_name || '—'}</TableCell>
                    <TableCell className="text-gray-600">
                      {log.user?.email || '—'}
                    </TableCell>
                    <TableCell
                      className="max-w-[200px] truncate"
                      title={log.purpose}
                    >
                      {log.purpose || '-'}
                    </TableCell>
                    <TableCell className="text-gray-600 whitespace-nowrap">
                      {log.created_at
                        ? new Date(log.created_at).toLocaleString('id-ID')
                        : '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Controls */}
        {pagination && pagination.total_pages > 1 && (
          <div className="flex justify-between items-center pt-2">
            <p className="text-sm text-gray-600">
              Halaman {pagination.current_page} dari {pagination.total_pages}
            </p>
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.current_page === 1}
                onClick={handlePreviousPage}
              >
                Sebelumnya
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.current_page === pagination.total_pages}
                onClick={handleNextPage}
              >
                Selanjutnya
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// PropTypes untuk dokumentasi (opsional)
DownloadLogs.propTypes = {
  // Tidak ada props yang diharapkan
};

export default DownloadLogs;
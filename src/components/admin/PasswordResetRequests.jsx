// UI polish + sticky header + zebra + dialog confirm
import React, { useState, useMemo, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectValue, SelectItem } from '@/components/ui/select';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Search, ArrowUpDown, KeyRound } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const ITEMS_PER_PAGE = 30;

const PasswordResetRequests = () => {
  const { authToken } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ role: '', workUnit: '' });
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'ascending' });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [processingId, setProcessingId] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3000/api/admin/password-reset-requests?page=${currentPage}&limit=${ITEMS_PER_PAGE}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const transformed = data.requests.map((r) => ({
        id: r.id, name: r.user?.full_name, email: r.user?.email, role: r.user?.role,
        workUnit: r.user?.unit?.name || '-', createdAt: r.created_at,
      }));
      setRequests(transformed);
      setTotalPages(data.pagination?.total_pages || 1);
    } catch {
      toast({ title: 'Gagal memuat permintaan reset password', variant: 'destructive' });
    } finally { setLoading(false); }
  };

  useEffect(() => { if (authToken) fetchRequests(); }, [authToken, currentPage]);

  const filteredRequests = useMemo(() => {
    return requests
      .filter((r) => r.name.toLowerCase().includes(searchTerm.toLowerCase()) || r.email.toLowerCase().includes(searchTerm.toLowerCase()))
      .filter((r) => (filters.role ? r.role === filters.role : true))
      .filter((r) => (filters.workUnit ? r.workUnit === filters.workUnit : true));
  }, [requests, searchTerm, filters]);

  const sortedRequests = useMemo(() => {
    const sorted = [...filteredRequests];
    if (sortConfig.key) {
      sorted.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return sorted;
  }, [filteredRequests, sortConfig]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') direction = 'descending';
    setSortConfig({ key, direction });
  };

  const handleResetPassword = async (id, name) => {
    setProcessingId(id);
    try {
      const res = await fetch(`v/admin/password-reset-requests/${id}/reset`, {
        method: 'POST', headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!res.ok) throw new Error();
      toast({ title: 'Berhasil', description: `Password untuk ${name} berhasil direset ke "Password123!"` });
      fetchRequests();
    } catch {
      toast({ title: 'Gagal mereset password', variant: 'destructive' });
    } finally { setProcessingId(null); }
  };

  const uniqueRoles = [...new Set(requests.map((r) => r.role).filter(Boolean))];
const uniqueUnits = [...new Set(requests.map((r) => r.workUnit).filter(Boolean))];

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle>Permintaan Reset Password</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input placeholder="Cari nama/email…" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
          <Select
            value={filters.role || 'all'}
            onValueChange={(v) => setFilters(f => ({ ...f, role: v === 'all' ? '' : v }))}>
            <SelectTrigger><SelectValue placeholder="Filter Role" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Role</SelectItem>  // ✅ aman
              {uniqueRoles.map(r => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.workUnit || 'all'}
            onValueChange={(v) => setFilters(f => ({ ...f, workUnit: v === 'all' ? '' : v }))}>
            <SelectTrigger><SelectValue placeholder="Filter Unit" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Unit</SelectItem>
              {uniqueUnits.map(u => (
                <SelectItem key={u} value={u}>{u}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => { setFilters({ role: '', workUnit: '' }); setSearchTerm(''); }}>Reset Filter</Button>
        </div>

        <div className="rounded-xl border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="space-y-2 p-4">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-10 bg-gray-100 animate-pulse rounded" />)}</div>
          ) : (
            <Table>
              <TableHeader className="bg-gray-50 sticky top-0 z-10">
                <TableRow>
                  <TableHead className="min-w-[220px]">
                    <Button variant="ghost" onClick={() => requestSort('name')}>Nama <ArrowUpDown className="ml-2 h-4 w-4" /></Button>
                  </TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Unit Kerja</TableHead>
                  <TableHead>Diminta Pada</TableHead>
                  <TableHead className="text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedRequests.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-gray-500 py-6">Tidak ada permintaan reset password.</TableCell></TableRow>
                ) : (
                  sortedRequests.map((user, idx) => (
                    <TableRow key={user.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.role}</TableCell>
                      <TableCell>{user.workUnit}</TableCell>
                      <TableCell>{new Date(user.createdAt).toLocaleString()}</TableCell>
                      <TableCell className="text-center">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline"><KeyRound className="w-4 h-4" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Reset Password?</AlertDialogTitle>
                              <AlertDialogDescription>Reset password untuk <strong>{user.name}</strong> ke default "Password123!"?</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleResetPassword(user.id, user.name)} disabled={processingId === user.id}>
                                {processingId === user.id ? 'Memproses…' : 'Reset'}
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

        <div className="flex items-center justify-end gap-2 py-4">
          <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Previous</Button>
          <span className="text-sm">Page {currentPage} of {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PasswordResetRequests;

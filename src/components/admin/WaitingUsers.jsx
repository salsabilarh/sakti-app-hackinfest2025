import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Check, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

const ITEMS_PER_PAGE = 30;
const BASE_URL = 'http://localhost:3000';

function toTitleCase(str) {
  if (!str) return '';
  return str.replace(/\w\S*/g, (txt) =>
    txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase()
  );
}

function WaitingUsers() {
  const { toast } = useToast();
  const { authToken } = useAuth();
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [modalState, setModalState] = useState({
    open: false,
    action: '',
    user: null,
  });

  const fetchUsers = async () => {
    if (!authToken) return;

    setLoading(true);
    try {
      const response = await axios.get(
        `${BASE_URL}/api/admin/waiting-users?page=${currentPage}&limit=${ITEMS_PER_PAGE}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      setUsers(response.data.users);
      setTotalPages(response.data.pagination?.total_pages || 1);
    } catch (error) {
      toast({
        title: 'Gagal Memuat Data',
        description: 'Tidak dapat mengambil data dari server.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentPage, authToken]);

  const confirmAction = (action, user) => {
    setModalState({
      open: true,
      action,
      user,
    });
  };

  const handleConfirm = async () => {
    const { user, action } = modalState;
    if (!authToken || !user) return;

    const url = `${BASE_URL}/api/admin/waiting-users/${user.id}/${action}`;

    try {
      await axios.post(url, null, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      toast({
        title: `Berhasil ${action === 'approve' ? 'menyetujui' : 'menolak'} user`,
        description: `Aksi berhasil untuk ${user.full_name}`,
      });

      fetchUsers();
    } catch (error) {
      toast({
        title: 'Gagal Melakukan Aksi',
        description: `Terjadi kesalahan saat memproses user ${user.full_name}`,
        variant: 'destructive',
      });
    } finally {
      setModalState({ open: false, action: '', user: null });
    }
  };

  const filteredUsers = users.filter((user) =>
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>User Menunggu Persetujuan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center py-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Cari user..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                disabled={loading}
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center text-gray-600 font-medium mt-8">
              Memuat data pengguna...
            </div>
          ) : (
            <>
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
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-gray-500">
                          Tidak ada user ditemukan
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.full_name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            {user.role === 'pdo' ? 'PDO' : toTitleCase(user.role)}
                          </TableCell>
                          <TableCell>{user.unit?.name || '-'}</TableCell>
                          <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center gap-2">
                              <Button
                                size="sm"
                                className="bg-green-500 hover:bg-green-600"
                                onClick={() => confirmAction('approve', user)}
                                disabled={loading}
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => confirmAction('reject', user)}
                                disabled={loading}
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

              <div className="flex items-center justify-end space-x-2 py-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1 || loading}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages || loading}
                >
                  Next
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal Konfirmasi */}
      <Dialog open={modalState.open} onOpenChange={(v) => setModalState({ ...modalState, open: v })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {modalState.action === 'approve' ? 'Setujui Pengguna' : 'Tolak Pengguna'}
            </DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin{' '}
              <span className="font-bold">
                {modalState.action === 'approve' ? 'menyetujui' : 'menolak'}
              </span>{' '}
              user <span className="font-medium">{modalState.user?.full_name}</span>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setModalState({ open: false, action: '', user: null })}>
              Batal
            </Button>
            <Button
              className={modalState.action === 'approve' ? 'bg-green-500 hover:bg-green-600' : ''}
              variant={modalState.action === 'reject' ? 'destructive' : 'default'}
              onClick={handleConfirm}
            >
              {modalState.action === 'approve' ? 'Setujui' : 'Tolak'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default WaitingUsers;

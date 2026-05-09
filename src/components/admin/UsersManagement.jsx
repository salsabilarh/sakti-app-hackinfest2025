/**
 * components/admin/UsersManagement.jsx
 *
 * Komponen untuk manajemen pengguna (CRUD) oleh admin.
 * Menampilkan daftar user dengan filter, sorting, pagination.
 * Mendukung tambah, edit, hapus, dan lihat password sementara.
 *
 * ============================================================
 * STRUKTUR DATA API
 * ============================================================
 * GET    /admin/users          → daftar user (dengan query params)
 * POST   /admin/users          → buat user baru (return temporary password)
 * PUT    /admin/users/:id      → update user
 * DELETE /admin/users/:id      → hapus user
 * GET    /admin/users/:id/temporary-password → ambil password sementara
 * GET    /units                → daftar unit kerja (untuk dropdown)
 *
 * ============================================================
 * PANDUAN MAINTENANCE
 * ============================================================
 * - Semua operasi CRUD menggunakan konfirmasi (AlertDialog) untuk hapus.
 * - Modal edit dan tambah menggunakan Dialog dari shadcn/ui.
 * - Password sementara ditampilkan dalam modal khusus dengan fitur toggle & copy.
 * - Admin tidak dapat menghapus admin terakhir (cek adminCount).
 * - Setiap perubahan akan refresh daftar user (fetchUsers).
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Edit,
  KeyRound,
  Search,
  ArrowUpDown,
  Trash2,
  UserPlus,
  Eye,
  EyeOff,
} from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';
import { ROLES, PAGINATION } from '@/lib/constants';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
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

// ============================================================
// Constants & Helper Functions
// ============================================================

/** Daftar role yang tersedia (berasal dari konstanta global) */
const ROLE_OPTIONS = [ROLES.ADMIN, ROLES.MANAGEMENT, ROLES.VIEWER];

/** Objek kosong untuk form user baru */
const EMPTY_NEW_USER = {
  full_name: '',
  email: '',
  role: '',
  unitKerjaId: '',
  is_active: true,
};

/**
 * Mengubah string ke Title Case (setiap kata diawali huruf besar).
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
 * Mendapatkan komponen Badge untuk role tertentu.
 * @param {string} role
 * @returns {JSX.Element}
 */
function getRoleBadge(role) {
  const colorMap = {
    [ROLES.ADMIN]: 'bg-purple-600',
    [ROLES.MANAGEMENT]: 'bg-blue-600',
    [ROLES.VIEWER]: 'bg-gray-500',
  };
  const className = colorMap[role] || 'bg-gray-400';
  return (
    <Badge className={`${className} text-white text-xs`}>
      {toTitleCase(role)}
    </Badge>
  );
}

// ============================================================
// Komponen Utama
// ============================================================

/**
 * UsersManagement - Halaman manajemen pengguna (admin only).
 * @returns {JSX.Element}
 */
function UsersManagement() {
  const { toast } = useToast();

  // State data utama
  const [users, setUsers] = useState([]);
  const [allUnits, setAllUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [adminCount, setAdminCount] = useState(0);

  // Pagination & Filter
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ role: '', status: '', workUnit: '' });
  const [sortConfig, setSortConfig] = useState({
    key: 'full_name',
    direction: 'ascending',
  });

  // State modal Edit
  const [editingUser, setEditingUser] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);

  // State modal Tambah
  const [newUser, setNewUser] = useState(EMPTY_NEW_USER);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addSaving, setAddSaving] = useState(false);

  // State modal hasil create (temporary password)
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState({
    email: '',
    password: '',
  });
  const [showCreatedPw, setShowCreatedPw] = useState(false);

  // State modal lihat password sementara (existing user)
  const [showTempModal, setShowTempModal] = useState(false);
  const [tempPwData, setTempPwData] = useState({ email: '', password: '' });
  const [showTempPw, setShowTempPw] = useState(false);
  const [loadingTempPw, setLoadingTempPw] = useState(false);

  // ============================================================
  // Derived Data: unique roles & units (untuk filter dropdown)
  // ============================================================
  const uniqueRoles = useMemo(
    () => [...new Set(users.map((u) => u.role).filter(Boolean))],
    [users]
  );
  const uniqueUnits = useMemo(
    () => [...new Set(users.map((u) => u.unitName).filter((w) => w && w !== '-'))],
    [users]
  );

  // ============================================================
  // Data Fetching
  // ============================================================

  /**
   * Mengambil daftar user dari server dengan parameter pencarian, filter, dan pagination.
   */
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: PAGINATION.ADMIN_LIMIT,
      };
      if (searchTerm) params.search = searchTerm;
      if (filters.role) params.role = filters.role;
      if (filters.status === 'active') params.is_active = true;
      if (filters.status === 'inactive') params.is_active = false;

      const response = await api.get('/admin/users', { params });
      const responseData = response.data?.data ?? response.data;
      const rawUsers = responseData.users || [];
      // Normalisasi data user
      const normalized = rawUsers.map((u) => ({
        id: u.id,
        full_name: u.full_name,
        email: u.email,
        role: u.role,
        unitName: u.unit?.name || '-',
        unitKerjaId: u.unit?.id || '',
        is_active: u.is_active,
        is_verified: u.is_verified,
        has_temp_password: Boolean(u.has_temp_password),
      }));
      setUsers(normalized);
      setAdminCount(normalized.filter((u) => u.role === ROLES.ADMIN).length);
      setTotalPages(responseData.pagination?.total_pages || 1);
    } catch (err) {
      console.error('[UsersManagement] Fetch users error:', err);
      toast({
        title: 'Gagal memuat data pengguna',
        description: err.response?.data?.error || err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filters, currentPage, toast]);

  /**
   * Mengambil daftar semua unit kerja untuk dropdown.
   */
  const fetchAllUnits = useCallback(async () => {
    setLoadingUnits(true);
    try {
      const response = await api.get('/units');
      // Normalisasi response yang mungkin berbeda struktur
      let unitsData = [];
      if (response.data?.data?.units) {
        unitsData = response.data.data.units;
      } else if (response.data?.units) {
        unitsData = response.data.units;
      } else if (Array.isArray(response.data)) {
        unitsData = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        unitsData = response.data.data;
      }
      setAllUnits(unitsData);
    } catch (err) {
      console.error('[UsersManagement] Fetch units error:', err);
      toast({
        title: 'Gagal memuat data unit kerja',
        description: err.response?.data?.error || err.message,
        variant: 'destructive',
      });
    } finally {
      setLoadingUnits(false);
    }
  }, [toast]);

  // Eksekusi fetch saat dependensi berubah
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchAllUnits();
  }, [fetchAllUnits]);

  // Reset halaman ke 1 saat filter atau pencarian berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters]);

  // Saat role berubah di form add/edit, reset unit kerja jika memilih admin
  useEffect(() => {
    if (newUser.role === ROLES.ADMIN) {
      setNewUser((prev) => ({ ...prev, unitKerjaId: '' }));
    }
  }, [newUser.role]);

  useEffect(() => {
    if (editingUser?.role === ROLES.ADMIN) {
      setEditingUser((prev) => ({ ...prev, unitKerjaId: '' }));
    }
  }, [editingUser?.role]);

  // ============================================================
  // Sorting
  // ============================================================

  const requestSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction:
        prev.key === key && prev.direction === 'ascending' ? 'descending' : 'ascending',
    }));
  };

  const sortedUsers = useMemo(() => {
    const copy = [...users];
    if (!sortConfig.key) return copy;
    return copy.sort((a, b) => {
      const aVal = a[sortConfig.key] ?? '';
      const bVal = b[sortConfig.key] ?? '';
      const comparison = String(aVal).localeCompare(String(bVal));
      return sortConfig.direction === 'ascending' ? comparison : -comparison;
    });
  }, [users, sortConfig]);

  // ============================================================
  // Handler: Edit User
  // ============================================================

  const handleEditClick = (user) => {
    setEditingUser({ ...user });
    setIsEditModalOpen(true);
  };

  const handleSaveUser = async () => {
    if (!editingUser.full_name?.trim()) {
      toast({ title: 'Nama tidak boleh kosong', variant: 'destructive' });
      return;
    }
    if (editingUser.role !== ROLES.ADMIN && !editingUser.unitKerjaId) {
      toast({ title: 'Unit Kerja wajib dipilih', variant: 'destructive' });
      return;
    }

    setEditSaving(true);
    try {
      await api.put(`/admin/users/${editingUser.id}`, {
        full_name: editingUser.full_name.trim(),
        email: editingUser.email.trim().toLowerCase(),
        role: editingUser.role,
        unit_kerja_id: editingUser.role === ROLES.ADMIN ? null : editingUser.unitKerjaId,
        is_active: editingUser.is_active,
        is_verified: editingUser.is_verified,
      });
      await fetchUsers();
      setIsEditModalOpen(false);
      setEditingUser(null);
      toast({
        title: 'Pengguna Diperbarui',
        description: `Data ${toTitleCase(editingUser.full_name)} berhasil disimpan.`,
      });
    } catch (err) {
      toast({
        title: 'Gagal memperbarui',
        description: err.response?.data?.error || err.message,
        variant: 'destructive',
      });
    } finally {
      setEditSaving(false);
    }
  };

  // ============================================================
  // Handler: Add User
  // ============================================================

  const handleAddUser = async () => {
    const { full_name, email, role, unitKerjaId, is_active } = newUser;

    if (!full_name.trim()) {
      toast({ title: 'Nama tidak boleh kosong', variant: 'destructive' });
      return;
    }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      toast({ title: 'Format email tidak valid', variant: 'destructive' });
      return;
    }
    if (!role) {
      toast({ title: 'Role wajib dipilih', variant: 'destructive' });
      return;
    }
    if (role !== ROLES.ADMIN && !unitKerjaId) {
      toast({ title: 'Unit Kerja wajib dipilih', variant: 'destructive' });
      return;
    }

    setAddSaving(true);
    try {
      const response = await api.post('/admin/users', {
        full_name: full_name.trim(),
        email: email.trim().toLowerCase(),
        role,
        unit_kerja_id: role === ROLES.ADMIN ? null : unitKerjaId,
        is_active,
      });
      const responseData = response.data?.data ?? response.data;
      const createdUser = responseData?.user ?? responseData;
      const tempPassword = responseData?.password ?? createdUser?.password;
      await fetchUsers();
      setIsAddModalOpen(false);
      setNewUser(EMPTY_NEW_USER);
      if (tempPassword) {
        setCreatedCredentials({
          email: email.trim().toLowerCase(),
          password: tempPassword,
        });
        setShowCreatedPw(false);
        setShowPasswordModal(true);
      }
      toast({
        title: 'Pengguna Ditambahkan',
        description: `${toTitleCase(full_name)} berhasil ditambahkan.`,
      });
    } catch (err) {
      toast({
        title: 'Gagal menambahkan pengguna',
        description: err.response?.data?.error || err.message,
        variant: 'destructive',
      });
    } finally {
      setAddSaving(false);
    }
  };

  // ============================================================
  // Handler: Delete User
  // ============================================================

  const handleDeleteUser = async (userToDelete) => {
    try {
      await api.delete(`/admin/users/${userToDelete.id}`);
      toast({
        title: 'Pengguna Dihapus',
        description: `${toTitleCase(userToDelete.full_name)} telah dihapus.`,
      });
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
      if (userToDelete.role === ROLES.ADMIN) {
        setAdminCount((prev) => prev - 1);
      }
    } catch (err) {
      toast({
        title: 'Gagal menghapus',
        description: err.response?.data?.error || err.message,
        variant: 'destructive',
      });
    }
  };

  // ============================================================
  // Handler: View Temporary Password
  // ============================================================

  const viewTempPassword = async (userId) => {
    setLoadingTempPw(true);
    setShowTempModal(true);
    try {
      const response = await api.get(`/admin/users/${userId}/temporary-password`);
      const responseData = response.data?.data ?? response.data;
      setTempPwData({
        email: responseData?.email || '—',
        password: responseData?.temp_password || responseData?.password || '—',
      });
      setShowTempPw(false);
    } catch (err) {
      console.error('[UsersManagement] Get temp password error:', err);
      toast({
        title: 'Gagal mengambil password sementara',
        description: err.response?.data?.error || err.message,
        variant: 'destructive',
      });
      setShowTempModal(false);
    } finally {
      setLoadingTempPw(false);
    }
  };

  // ============================================================
  // Handler: Reset Filter
  // ============================================================

  const resetFilters = () => {
    setFilters({ role: '', status: '', workUnit: '' });
    setSearchTerm('');
    setCurrentPage(1);
  };

  // ============================================================
  // Render
  // ============================================================
  return (
    <>
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Manajemen Pengguna</CardTitle>
            <Button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-[#000476] hover:bg-indigo-900 text-white"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Tambah Pengguna
            </Button>
          </div>
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
              onValueChange={(v) => setFilters((f) => ({ ...f, role: v === 'all' ? '' : v }))}
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
              onValueChange={(v) => setFilters((f) => ({ ...f, workUnit: v === 'all' ? '' : v }))}
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
            <Button variant="outline" onClick={resetFilters}>
              Reset Filter
            </Button>
          </div>

          {/* Tabel User */}
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-10 bg-gray-100 animate-pulse rounded" />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-gray-100 overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-50 sticky top-0 z-10">
                  <TableRow>
                    <TableHead className="min-w-[200px]">
                      <Button variant="ghost" onClick={() => requestSort('full_name')}>
                        Nama <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Unit Kerja</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 text-gray-500">
                        Tidak ada pengguna ditemukan.
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedUsers.map((user, idx) => (
                      <TableRow
                        key={user.id}
                        className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}
                      >
                        <TableCell className="font-medium">
                          {toTitleCase(user.full_name)}
                        </TableCell>
                        <TableCell className="text-gray-600">{user.email}</TableCell>
                        <TableCell>{getRoleBadge(user.role)}</TableCell>
                        <TableCell>{user.unitName}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge
                              className={`w-fit text-xs ${
                                user.is_active
                                  ? 'bg-green-500 text-white'
                                  : 'bg-gray-300 text-gray-700'
                              }`}
                            >
                              {user.is_active ? 'Aktif' : 'Nonaktif'}
                            </Badge>
                            <Badge
                              className={`w-fit text-xs ${
                                user.is_verified
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-amber-400 text-white'
                              }`}
                            >
                              {user.is_verified ? 'Terverifikasi' : 'Pending'}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditClick(user)}
                              title="Edit pengguna"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            {user.has_temp_password && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => viewTempPassword(user.id)}
                                title="Lihat password sementara"
                              >
                                <KeyRound className="w-4 h-4" />
                              </Button>
                            )}
                            {/* Cegah hapus admin terakhir */}
                            {!(user.role === ROLES.ADMIN && adminCount <= 1) && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="destructive" title="Hapus pengguna">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Hapus Pengguna?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tindakan ini permanen dan tidak bisa dibatalkan.{' '}
                                      <strong>{toTitleCase(user.full_name)}</strong> akan
                                      dihapus dari sistem beserta seluruh datanya.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteUser(user)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Hapus
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
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
        </CardContent>
      </Card>

      {/* ========================= Modal Edit User ========================= */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Edit Pengguna</DialogTitle>
            <DialogDescription>
              Perubahan akan langsung tersimpan ke database.
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="grid gap-4 py-2">
              <div className="grid grid-cols-4 items-center gap-3">
                <Label className="text-right">Nama</Label>
                <Input
                  className="col-span-3"
                  value={editingUser.full_name}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, full_name: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-3">
                <Label className="text-right">Email</Label>
                <Input
                  className="col-span-3"
                  type="email"
                  value={editingUser.email}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, email: e.target.value.trim() })
                  }
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-3">
                <Label className="text-right">Role</Label>
                <Select
                  value={editingUser.role}
                  onValueChange={(v) => setEditingUser({ ...editingUser, role: v })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map((r) => (
                      <SelectItem key={r} value={r}>
                        {toTitleCase(r)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {editingUser.role !== ROLES.ADMIN && (
                <div className="grid grid-cols-4 items-center gap-3">
                  <Label className="text-right">Unit Kerja</Label>
                  <Select
                    value={editingUser.unitKerjaId}
                    onValueChange={(v) =>
                      setEditingUser({ ...editingUser, unitKerjaId: v })
                    }
                    disabled={loadingUnits}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue
                        placeholder={loadingUnits ? 'Memuat...' : 'Pilih unit…'}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {allUnits.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id.toString()}>
                          {unit.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="grid grid-cols-4 items-center gap-3">
                <Label className="text-right">Status Aktif</Label>
                <Select
                  value={editingUser.is_active ? 'true' : 'false'}
                  onValueChange={(v) =>
                    setEditingUser({ ...editingUser, is_active: v === 'true' })
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Aktif</SelectItem>
                    <SelectItem value="false">Nonaktif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-3">
                <Label className="text-right">Verifikasi</Label>
                <Select
                  value={editingUser.is_verified ? 'true' : 'false'}
                  onValueChange={(v) =>
                    setEditingUser({ ...editingUser, is_verified: v === 'true' })
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Terverifikasi</SelectItem>
                    <SelectItem value="false">Belum Terverifikasi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary" disabled={editSaving}>
                Batal
              </Button>
            </DialogClose>
            <Button
              onClick={handleSaveUser}
              disabled={editSaving}
              className="bg-[#000476] hover:bg-indigo-900 text-white"
            >
              {editSaving ? 'Menyimpan…' : 'Simpan Perubahan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================= Modal Tambah User ========================= */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Tambah Pengguna Baru</DialogTitle>
            <DialogDescription>
              Password sementara akan di-generate otomatis oleh sistem.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-4 items-center gap-3">
              <Label className="text-right">Nama</Label>
              <Input
                className="col-span-3"
                placeholder="Nama lengkap"
                value={newUser.full_name}
                onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-3">
              <Label className="text-right">Email</Label>
              <Input
                className="col-span-3"
                type="email"
                placeholder="nama@sucofindo.co.id"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value.trim() })}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-3">
              <Label className="text-right">Role</Label>
              <Select
                value={newUser.role}
                onValueChange={(v) => setNewUser({ ...newUser, role: v })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Pilih role…" />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {toTitleCase(r)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {newUser.role && newUser.role !== ROLES.ADMIN && (
              <div className="grid grid-cols-4 items-center gap-3">
                <Label className="text-right">Unit Kerja</Label>
                <Select
                  value={newUser.unitKerjaId}
                  onValueChange={(v) => setNewUser({ ...newUser, unitKerjaId: v })}
                  disabled={loadingUnits}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue
                      placeholder={loadingUnits ? 'Memuat...' : 'Pilih unit kerja…'}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {allUnits.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id.toString()}>
                        {unit.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-4 items-center gap-3">
              <Label className="text-right">Status</Label>
              <Select
                value={newUser.is_active ? 'true' : 'false'}
                onValueChange={(v) =>
                  setNewUser({ ...newUser, is_active: v === 'true' })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Aktif</SelectItem>
                  <SelectItem value="false">Nonaktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary" disabled={addSaving}>
                Batal
              </Button>
            </DialogClose>
            <Button
              onClick={handleAddUser}
              disabled={addSaving}
              className="bg-[#000476] hover:bg-indigo-900 text-white"
            >
              {addSaving ? 'Menyimpan…' : 'Tambah Pengguna'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================= Modal Password Setelah Create ========================= */}
      <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Password Sementara</DialogTitle>
            <DialogDescription>
              Berikan informasi ini kepada pengguna. Password hanya ditampilkan sekali —
              simpan sebelum menutup dialog ini.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs text-gray-500">Email</Label>
              <p className="text-sm font-medium bg-gray-50 px-3 py-2 rounded-lg mt-1">
                {createdCredentials.email}
              </p>
            </div>
            <div>
              <Label className="text-xs text-gray-500">Password Sementara</Label>
              <div className="flex items-center gap-2 mt-1">
                <p className="flex-1 text-sm font-mono bg-gray-50 px-3 py-2 rounded-lg tracking-wider">
                  {showCreatedPw ? createdCredentials.password : '••••••••••••'}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCreatedPw((v) => !v)}
                >
                  {showCreatedPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(createdCredentials.password);
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

      {/* ========================= Modal Lihat Password Sementara (Existing User) ========================= */}
      <Dialog open={showTempModal} onOpenChange={setShowTempModal}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Password Sementara</DialogTitle>
            <DialogDescription>
              Password ini hanya untuk login pertama. User harus menggantinya.
            </DialogDescription>
          </DialogHeader>
          {loadingTempPw ? (
            <div className="py-8 text-center text-gray-500 text-sm">Mengambil data…</div>
          ) : (
            <div className="space-y-4 py-2">
              <div>
                <Label className="text-xs text-gray-500">Email</Label>
                <p className="text-sm bg-gray-50 px-3 py-2 rounded-lg mt-1">
                  {tempPwData.email}
                </p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Password</Label>
                <div className="flex items-center gap-2 mt-1">
                  <p className="flex-1 text-sm font-mono bg-gray-50 px-3 py-2 rounded-lg">
                    {showTempPw ? tempPwData.password : '••••••••••••'}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowTempPw((v) => !v)}
                  >
                    {showTempPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(tempPwData.password);
                      toast({ title: 'Disalin ke clipboard' });
                    }}
                  >
                    Salin
                  </Button>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">Tutup</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// PropTypes untuk dokumentasi (opsional)
UsersManagement.propTypes = {
  // Tidak ada props yang diharapkan
};

export default UsersManagement;
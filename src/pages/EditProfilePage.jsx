/**
 * pages/EditProfilePage.jsx
 *
 * Halaman untuk mengelola profil pengguna, termasuk:
 * - Mengubah nama lengkap
 * - Mengubah password
 * - Mengajukan permintaan perubahan role dan/atau unit kerja (untuk non-admin)
 *
 * ============================================================
 * FITUR UTAMA
 * ============================================================
 * 1. Identity Card: menampilkan informasi ringkas user (nama, email, role, unit)
 * 2. Form Edit Profil: hanya dapat mengubah nama (email, role, unit bersifat read-only)
 * 3. Form Ubah Password: validasi kekuatan password, konfirmasi, dan submit ke API
 * 4. Dialog Ajukan Perubahan Role/Unit: untuk user non-admin, mengirim permintaan
 *    ke admin (endpoint /api/auth/change-request)
 *
 * ============================================================
 * STRUKTUR DATA API
 * ============================================================
 * PUT    /auth/profile          → update profil (full_name)
 * PUT    /auth/update-password  → ganti password
 * POST   /auth/change-request   → ajukan perubahan role/unit (body: { requested_role?, requested_unit_id? })
 * GET    /units                 → daftar unit kerja untuk dropdown
 *
 * ============================================================
 * PANDUAN MAINTENANCE
 * ============================================================
 * - Perhatikan bahwa endpoint /auth/change-request belum tentu ada di backend;
 *   pastikan sudah diimplementasikan sesuai kebutuhan.
 * - Validasi password menggunakan regex yang sama dengan backend.
 * - Score kekuatan password dihitung secara client-side untuk UX.
 * - Role yang dapat diminta hanya 'management' dan 'viewer', kecuali jika backend mendukung lain.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { useToast } from '@/components/ui/use-toast.js';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogClose, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Eye, EyeOff, ShieldCheck, AtSign,
  Building2, User2, CheckCircle2, AlertCircle,
} from 'lucide-react';
import api from '@/lib/api';

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
 * Mendapatkan inisial dari nama (max 2 huruf).
 * @param {string} name
 * @returns {string}
 */
function getInitials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('');
}

/**
 * Menghitung skor kekuatan password (0-5).
 * @param {string} pw - Password yang akan dinilai
 * @returns {number} Skor antara 0-5
 */
function strengthScore(pw = '') {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[@$!%*?&]/.test(pw)) score++;
  return Math.min(score, 5);
}

/**
 * Mapping skor ke class Tailwind untuk bar kekuatan password.
 */
const strengthBarClasses = [
  'bg-gray-200',   // skor 0
  'bg-rose-400',   // skor 1
  'bg-amber-400',  // skor 2
  'bg-yellow-400', // skor 3
  'bg-lime-500',   // skor 4
  'bg-emerald-600',// skor 5
];

// ============================================================
// Komponen Utama
// ============================================================

/**
 * EditProfilePage - Halaman edit profil pengguna.
 * @returns {JSX.Element}
 */
function EditProfilePage() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();

  // ========== EDIT PROFIL: Nama ==========
  const [formData, setFormData] = useState({ full_name: user?.full_name || '' });
  const [savingInfo, setSavingInfo] = useState(false);

  // Saat user berubah, reset form nama
  useEffect(() => {
    setFormData({ full_name: user?.full_name || '' });
  }, [user?.full_name]);

  /**
   * Submit perubahan nama.
   * @param {Event} e
   */
  const handleInfoSubmit = async (e) => {
    e.preventDefault();
    const trimmed = formData.full_name?.trim();
    if (!trimmed) {
      toast({ title: 'Nama tidak boleh kosong', variant: 'destructive' });
      return;
    }
    if (trimmed === user?.full_name) {
      toast({ title: 'Tidak ada perubahan', description: 'Nama masih sama dengan sebelumnya.' });
      return;
    }
    setSavingInfo(true);
    try {
      // API call untuk update profil (endpoint disesuaikan dengan backend)
      await api.put('/auth/profile', { full_name: trimmed });
      // Update context user lokal
      updateUser({ ...user, full_name: trimmed });
      toast({ title: 'Profil Diperbarui', description: 'Nama berhasil disimpan ke profil Anda.' });
    } catch (err) {
      toast({
        title: 'Gagal memperbarui profil',
        description: err?.response?.data?.message || err.message,
        variant: 'destructive',
      });
    } finally {
      setSavingInfo(false);
    }
  };

  // ========== UBAH PASSWORD ==========
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [show, setShow] = useState({ current: false, next: false, confirm: false });
  const [changingPw, setChangingPw] = useState(false);

  // Hitung skor kekuatan password baru
  const passwordScore = useMemo(() => strengthScore(passwordData.newPassword), [passwordData.newPassword]);

  /**
   * Submit perubahan password.
   * @param {Event} e
   */
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    // Validasi kekuatan password (sama dengan aturan backend)
    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!strongRegex.test(passwordData.newPassword)) {
      toast({
        title: 'Password Lemah',
        description: 'Min. 8 karakter, huruf besar, huruf kecil, angka, dan simbol.',
        variant: 'destructive',
      });
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: 'Password Tidak Cocok',
        description: 'Password baru dan konfirmasi tidak sama.',
        variant: 'destructive',
      });
      return;
    }
    setChangingPw(true);
    try {
      await api.put('/auth/update-password', {
        current_password: passwordData.currentPassword,
        new_password: passwordData.newPassword,
        confirm_password: passwordData.confirmPassword,
      });
      toast({ title: 'Password Diubah', description: 'Password berhasil diubah.' });
      // Reset form password
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast({
        title: 'Gagal Mengubah Password',
        description: error.response?.data?.message || 'Silakan coba lagi.',
        variant: 'destructive',
      });
    } finally {
      setChangingPw(false);
    }
  };

  // ========== AJUKAN PERUBAHAN ROLE / UNIT ==========
  const [units, setUnits] = useState([]);
  const [requestedRole, setRequestedRole] = useState('');
  const [requestedUnitId, setRequestedUnitId] = useState('');
  const [requestingChange, setRequestingChange] = useState(false);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [openChangeModal, setOpenChangeModal] = useState(false);

  // Role yang dapat diminta (tidak termasuk admin, dan tidak sama dengan role saat ini)
  const availableRoles = ['management', 'viewer'].filter(r => r !== user?.role);

  /**
   * Fetch daftar unit kerja untuk dropdown.
   */
  useEffect(() => {
    const fetchUnits = async () => {
      setLoadingUnits(true);
      try {
        const response = await api.get('/units');
        // Normalisasi response (berbagai kemungkinan struktur)
        let unitsData = [];
        if (response.data?.data?.units) unitsData = response.data.data.units;
        else if (response.data?.units) unitsData = response.data.units;
        else if (response.data?.data && Array.isArray(response.data.data)) unitsData = response.data.data;
        else if (Array.isArray(response.data)) unitsData = response.data;
        else {
          console.warn('Struktur response /units tidak dikenali:', response.data);
          toast({ title: 'Gagal memuat unit kerja', description: 'Struktur data tidak sesuai.', variant: 'destructive' });
          setUnits([]);
          return;
        }
        const validUnits = unitsData.filter(u => u.id && u.name);
        setUnits(validUnits);
      } catch (error) {
        console.error('Error fetching units:', error);
        toast({
          title: 'Gagal memuat daftar unit',
          description: error.response?.data?.message || error.message,
          variant: 'destructive',
        });
        setUnits([]);
      } finally {
        setLoadingUnits(false);
      }
    };
    fetchUnits();
  }, [toast]);

  /**
   * Kirim permintaan perubahan role/unit ke backend.
   */
  const handleChangeRequest = async () => {
    if (!requestedRole && !requestedUnitId) {
      toast({
        title: 'Pilih Perubahan',
        description: 'Pilih minimal satu: role baru atau unit baru.',
        variant: 'destructive',
      });
      return;
    }
    if (requestedRole && requestedRole === user?.role) {
      toast({ title: 'Role Sama', description: 'Role yang dipilih sama dengan role Anda saat ini.', variant: 'destructive' });
      return;
    }
    if (requestedUnitId && user?.unit?.id === requestedUnitId) {
      toast({ title: 'Unit Sama', description: 'Unit yang dipilih sama dengan unit Anda saat ini.', variant: 'destructive' });
      return;
    }
    setRequestingChange(true);
    try {
      const payload = {};
      if (requestedRole) payload.requested_role = requestedRole;
      if (requestedUnitId) payload.requested_unit_id = requestedUnitId;
      await api.post('/auth/change-request', payload);
      let successMessage = '';
      if (requestedRole && requestedUnitId) successMessage = 'Permintaan perubahan role dan unit berhasil diajukan.';
      else if (requestedRole) successMessage = 'Permintaan perubahan role berhasil diajukan.';
      else successMessage = 'Permintaan perubahan unit berhasil diajukan.';
      toast({ title: 'Permintaan Terkirim', description: successMessage });
      // Reset form dan tutup modal
      setRequestedRole('');
      setRequestedUnitId('');
      setOpenChangeModal(false);
    } catch (error) {
      toast({
        title: 'Gagal Mengirim Permintaan',
        description: error.response?.data?.message || 'Silakan coba lagi.',
        variant: 'destructive',
      });
    } finally {
      setRequestingChange(false);
    }
  };

  /**
   * Handler modal close: reset form jika ditutup tanpa submit.
   */
  const handleModalClose = (open) => {
    if (!open) {
      setRequestedRole('');
      setRequestedUnitId('');
    }
    setOpenChangeModal(open);
  };

  // ========== Derived data untuk tampilan ==========
  const initials = useMemo(() => getInitials(user?.full_name || ''), [user?.full_name]);
  const roleLabel = useMemo(() => toTitleCase(user?.role), [user?.role]);

  // ============================================================
  // Render
  // ============================================================
  return (
    <>
      <Helmet>
        <title>Edit Profile | SAKTI Platform</title>
        <meta name="description" content="Kelola profil, unit kerja, role, dan kata sandi Anda." />
      </Helmet>

      <div className="space-y-6">
        {/* Identity Card */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl border border-gray-100 bg-gradient-to-r from-indigo-50 to-white"
        >
          <div className="absolute inset-0 bg-[radial-gradient(600px_200px_at_20%_-40%,rgba(99,102,241,0.18),transparent)]" />
          <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="size-14 sm:size-16 rounded-2xl grid place-items-center bg-indigo-100 text-[#000476] font-bold text-lg ring-1 ring-indigo-200/70">
                {initials || <User2 className="w-6 h-6" />}
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
                  {user?.full_name || '—'}
                </h1>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-gray-600">
                  <span className="inline-flex items-center gap-1">
                    <AtSign className="w-4 h-4 text-indigo-600" />
                    {user?.email || '—'}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    {roleLabel || '-'}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    {user?.unit?.name || '-'}
                  </span>
                </div>
              </div>
            </div>

            {/* Tombol Ajukan Perubahan Role/Unit (khusus non-admin) */}
            {user?.role !== 'admin' && (
              <Dialog open={openChangeModal} onOpenChange={handleModalClose}>
                <DialogTrigger asChild>
                  <Button className="bg-[#000476] hover:bg-indigo-900 text-white rounded-xl">
                    Ajukan Perubahan Role / Unit
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[480px]">
                  <DialogHeader>
                    <DialogTitle>Ajukan Perubahan Role / Unit Kerja</DialogTitle>
                    <DialogDescription>
                      Pilih role baru dan/atau unit kerja baru. Minimal salah satu harus diisi.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    {/* Role baru */}
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right">Role Baru</Label>
                      <div className="col-span-3">
                        <Select
                          value={requestedRole}
                          onValueChange={setRequestedRole}
                          disabled={availableRoles.length === 0}
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={availableRoles.length === 0 ? "Tidak ada role lain" : "Pilih role (opsional)"}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {availableRoles.map(r => (
                              <SelectItem key={r} value={r}>{toTitleCase(r)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="mt-1 text-xs text-gray-500">Role yang tersedia: Management, Viewer</p>
                      </div>
                    </div>
                    {/* Unit baru */}
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right">Unit Baru</Label>
                      <div className="col-span-3">
                        <Select
                          value={requestedUnitId}
                          onValueChange={setRequestedUnitId}
                          disabled={loadingUnits}
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={loadingUnits ? "Memuat unit..." : "Pilih unit (opsional)"}
                            />
                          </SelectTrigger>
                          <SelectContent className="max-h-72 overflow-y-auto">
                            {units.map(unit => (
                              <SelectItem key={unit.id} value={String(unit.id)}>
                                {unit.name}
                              </SelectItem>
                            ))}
                            {units.length === 0 && !loadingUnits && (
                              <div className="px-2 py-1 text-sm text-gray-500">Tidak ada unit tersedia</div>
                            )}
                          </SelectContent>
                        </Select>
                        <p className="mt-1 text-xs text-gray-500">Pastikan unit sesuai dengan struktur organisasi.</p>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="secondary" onClick={() => setOpenChangeModal(false)}>
                      Batal
                    </Button>
                    <Button
                      onClick={handleChangeRequest}
                      disabled={requestingChange || (!requestedRole && !requestedUnitId)}
                      className="bg-[#000476] hover:bg-indigo-900"
                    >
                      {requestingChange ? 'Mengirim…' : 'Kirim Permintaan'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </motion.div>

        {/* Grid dua kolom: Kiri = Edit Profil, Kanan = Ubah Password */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Edit Profil (nama) */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.05 }}
          >
            <Card className="border-0 shadow-lg rounded-2xl">
              <CardHeader>
                <CardTitle>Informasi Profil</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleInfoSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nama Lengkap</Label>
                    <Input
                      id="name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ full_name: e.target.value })}
                      placeholder="Nama lengkap Anda"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" value={user?.email || ''} disabled className="bg-gray-50" />
                    </div>
                    <div>
                      <Label htmlFor="role">Role</Label>
                      <Input id="role" value={roleLabel || ''} disabled className="bg-gray-50" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="unit_kerja">Unit Kerja</Label>
                    <Input id="unit_kerja" value={user?.unit?.name || '-'} disabled className="bg-gray-50" />
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      type="submit"
                      className="bg-[#000476] hover:bg-indigo-900 text-white"
                      disabled={savingInfo}
                    >
                      {savingInfo ? 'Menyimpan…' : 'Simpan Perubahan'}
                    </Button>
                    <span className="text-xs text-gray-500">
                      <CheckCircle2 className="inline w-3.5 h-3.5 mr-1 text-emerald-600" />
                      Perubahan nama tersimpan ke profil.
                    </span>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Ubah Password */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
          >
            <Card className="border-0 shadow-lg rounded-2xl">
              <CardHeader>
                <CardTitle>Ubah Password</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  {/* Current Password */}
                  <div className="relative">
                    <Label htmlFor="currentPassword">Password Saat Ini</Label>
                    <Input
                      id="currentPassword"
                      type={show.current ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShow(s => ({ ...s, current: !s.current }))}
                      className="absolute right-3 top-[38px] text-gray-500"
                    >
                      {show.current ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  {/* New Password */}
                  <div className="relative">
                    <Label htmlFor="newPassword">Password Baru</Label>
                    <Input
                      id="newPassword"
                      type={show.next ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShow(s => ({ ...s, next: !s.next }))}
                      className="absolute right-3 top-[38px] text-gray-500"
                    >
                      {show.next ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                    {/* Strength indicator */}
                    <div className="mt-2">
                      <div className="flex gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div
                            key={i}
                            className={`h-1.5 flex-1 rounded transition-colors ${
                              i < passwordScore ? strengthBarClasses[passwordScore] : 'bg-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-[11px] mt-1 text-gray-500 flex items-center gap-1">
                        {passwordScore < 3 ? (
                          <>
                            <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                            Tambahkan huruf besar, angka, dan simbol.
                          </>
                        ) : passwordScore < 5 ? (
                          'Lumayan. Tambahkan variasi untuk lebih kuat.'
                        ) : (
                          'Password kuat.'
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="relative">
                    <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
                    <Input
                      id="confirmPassword"
                      type={show.confirm ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShow(s => ({ ...s, confirm: !s.confirm }))}
                      className="absolute right-3 top-[38px] text-gray-500"
                    >
                      {show.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                    {passwordData.confirmPassword && passwordData.confirmPassword !== passwordData.newPassword && (
                      <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Password tidak cocok.
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      type="submit"
                      className="bg-[#000476] hover:bg-indigo-900 text-white"
                      disabled={changingPw}
                    >
                      {changingPw ? 'Memproses…' : 'Ubah Password'}
                    </Button>
                    <p className="text-xs text-gray-500">
                      Min. 8 karakter: huruf besar, huruf kecil, angka, simbol.
                    </p>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </>
  );
}

export default EditProfilePage;
import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { useToast } from '@/components/ui/use-toast.js';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Eye, EyeOff, ShieldCheck, AtSign, Building2, User2, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '@/lib/api';

function toTitleCase(str) {
  if (!str) return '';
  return str.replace(/\w\S*/g, (txt) =>
    txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase()
  );
}

function getInitials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('');
}

function strengthScore(pw = '') {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[@$!%*?&]/.test(pw)) score++;
  return Math.min(score, 5);
}

const barClasses = [
  'bg-gray-200',
  'bg-rose-400',
  'bg-amber-400',
  'bg-yellow-400',
  'bg-lime-500',
  'bg-emerald-600',
];

function EditProfilePage() {
  const { user, updateUser, authToken } = useAuth();
  const { toast } = useToast();

  // Profile info
  const [formData, setFormData] = useState({
    name: user?.full_name || '',
  });
  const [savingInfo, setSavingInfo] = useState(false);

  // Password
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [show, setShow] = useState({
    current: false,
    next: false,
    confirm: false,
  });
  const score = useMemo(() => strengthScore(passwordData.newPassword), [passwordData.newPassword]);
  const [changingPw, setChangingPw] = useState(false);

  // Units
  const [units, setUnits] = useState([]);
  const [newUnitId, setNewUnitId] = useState('');
  const [requestingUnit, setRequestingUnit] = useState(false);

  // Fetch units
  useEffect(() => {
    async function fetchUnits() {
      try {
        const response = await api.get('/units');
        setUnits(response.data.units || []);
      } catch (error) {
        toast({
          title: 'Gagal memuat data unit',
          description: 'Tidak dapat mengambil daftar unit kerja.',
          variant: 'destructive',
        });
      }
    }
    fetchUnits();
  }, [toast]);

  const initials = useMemo(() => getInitials(user?.name || ''), [user?.name]);
  const roleLabel = useMemo(() => (user?.role === 'pdo' ? 'PDO' : toTitleCase(user?.role)), [user?.role]);

  // const handleInfoSubmit = async (e) => {
  //   e.preventDefault();
  //   if (!formData.name?.trim()) {
  //     toast({ title: 'Nama tidak boleh kosong', variant: 'destructive' });
  //     return;
  //   }
  //   try {
  //     setSavingInfo(true);
  //     // Jika ada endpoint update profile di server, panggil juga:
  //     await api.put('/auth/profile', { full_name: formData.name }, { headers: { Authorization: `Bearer ${authToken}` } });
  //     updateUser({ name: formData.name }); // sinkronkan context
  //     toast({
  //       title: 'Profil Diperbarui',
  //       description: 'Informasi profil Anda berhasil disimpan.',
  //     });
  //   } catch (err) {
  //     toast({
  //       title: 'Gagal memperbarui profil',
  //       description: err?.response?.data?.message || err.message,
  //       variant: 'destructive',
  //     });
  //   } finally {
  //     setSavingInfo(false);
  //   }
  // };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const strongPasswordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (!strongPasswordRegex.test(passwordData.newPassword)) {
      toast({
        title: 'Password Lemah',
        description: 'Min. 8 karakter, huruf besar, kecil, angka, dan simbol.',
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

    try {
      setChangingPw(true);
      const response = await api.put(
        '/auth/update-password',
        {
          current_password: passwordData.currentPassword,
          new_password: passwordData.newPassword,
          confirm_password: passwordData.confirmPassword,
        },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      toast({
        title: 'Password Diubah',
        description: response.data.message || 'Password berhasil diubah.',
      });
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

  const handleUnitChangeRequest = async () => {
    if (!newUnitId) {
      toast({
        title: 'Pilih Unit Kerja',
        description: 'Silakan pilih unit kerja baru.',
        variant: 'destructive',
      });
      return;
    }
    try {
      setRequestingUnit(true);
      await api.post(
        '/auth/unit-change-request',
        { requested_unit_id: newUnitId },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      toast({
        title: 'Permintaan Terkirim',
        description: 'Menunggu persetujuan admin.',
      });
      setNewUnitId('');
    } catch (error) {
      toast({
        title: 'Gagal Mengirim Permintaan',
        description: error.response?.data?.message || 'Silakan coba lagi.',
        variant: 'destructive',
      });
    } finally {
      setRequestingUnit(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Edit Profile | SAKTI Platform</title>
        <meta name="description" content="Kelola profil, unit kerja, dan kata sandi Anda." />
      </Helmet>

      <div className="space-y-6">
        {/* Hero / Identity Card */}
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
                  {user?.full_name}
                </h1>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-gray-600">
                  <span className="inline-flex items-center gap-1">
                    <AtSign className="w-4 h-4 text-indigo-600" />
                    {user?.email}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    {user?.role ? (user?.role === 'pdo' ? 'PDO' : toTitleCase(user?.role)) : '-'}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    {user?.unit?.name || user?.unit_kerja || '-'}
                  </span>
                </div>
              </div>
            </div>
            {user?.role !== 'admin' && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-[#000476] hover:bg-indigo-900 text-white rounded-xl">
                    Ajukan Ganti Unit
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[480px]">
                  <DialogHeader>
                    <DialogTitle>Request Perubahan Unit Kerja</DialogTitle>
                    <DialogDescription>
                      Pilih unit kerja baru. Permintaan akan dikirim ke admin untuk persetujuan.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right">Unit Baru</Label>
                      <div className="col-span-3">
                        <Select value={newUnitId} onValueChange={setNewUnitId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih unit..." />
                          </SelectTrigger>
                          <SelectContent className="max-h-72">
                            {units.map((unit) => (
                              <SelectItem key={unit.id} value={String(unit.id)}>
                                {unit.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="mt-2 text-xs text-gray-500">
                          Pastikan unit sesuai struktur organisasi Anda.
                        </p>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="secondary">
                        Batal
                      </Button>
                    </DialogClose>
                    <DialogClose asChild>
                      <Button
                        onClick={handleUnitChangeRequest}
                        className="bg-[#000476] hover:bg-indigo-900"
                        disabled={requestingUnit}
                      >
                        {requestingUnit ? 'Mengirim…' : 'Kirim Permintaan'}
                      </Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </motion.div>

        {/* Content */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Profile Info */}
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
                <form className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nama Lengkap</Label>
                    <Input
                      id="name"
                      value={user?.full_name}
                      disabled
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" value={user?.email || ''} disabled />
                    </div>
                    <div>
                      <Label htmlFor="role">Role</Label>
                      <Input
                        id="role"
                        value={user?.role === 'pdo' ? 'PDO' : toTitleCase(user?.role)}
                        disabled
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="unit_kerja">Unit Kerja</Label>
                    <Input
                      id="unit_kerja"
                      value={user?.unit?.name || user?.unit_kerja || ''}
                      disabled
                    />
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
                      Perubahan nama langsung tersimpan ke profil.
                    </span>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Change Password */}
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
                      onClick={() => setShow((s) => ({ ...s, current: !s.current }))}
                      className="absolute right-3 top-[38px] text-gray-500"
                      aria-label={show.current ? 'Sembunyikan password' : 'Tampilkan password'}
                    >
                      {show.current ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>

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
                      onClick={() => setShow((s) => ({ ...s, next: !s.next }))}
                      className="absolute right-3 top-[38px] text-gray-500"
                      aria-label={show.next ? 'Sembunyikan password' : 'Tampilkan password'}
                    >
                      {show.next ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>

                    {/* Strength meter */}
                    <div className="mt-2">
                      <div className="flex gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div
                            key={i}
                            className={`h-1.5 flex-1 rounded ${i < score ? barClasses[score] : 'bg-gray-200'}`}
                          />
                        ))}
                      </div>
                      <div className="text-[11px] mt-1 text-gray-500 flex items-center gap-1">
                        {score < 3 ? (
                          <>
                            <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                            Kuatkan dengan huruf besar, angka, dan simbol.
                          </>
                        ) : score < 5 ? (
                          <>Lumayan. Tambahkan variasi untuk lebih kuat.</>
                        ) : (
                          <>Mantap. Password kuat.</>
                        )}
                      </div>
                    </div>
                  </div>

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
                      onClick={() => setShow((s) => ({ ...s, confirm: !s.confirm }))}
                      className="absolute right-3 top-[38px] text-gray-500"
                      aria-label={show.confirm ? 'Sembunyikan password' : 'Tampilkan password'}
                    >
                      {show.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="submit"
                      className="bg-[#000476] hover:bg-indigo-900 text-white"
                      disabled={changingPw}
                    >
                      {changingPw ? 'Memproses…' : 'Ubah Password'}
                    </Button>
                    <p className="text-xs text-gray-500">
                      Minimal 8 karakter: huruf besar, kecil, angka, simbol.
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

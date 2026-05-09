/**
 * pages/RegistrationPage.jsx
 *
 * Halaman pendaftaran akun baru untuk pengguna SAKTI Platform.
 * Pengguna dapat memilih role dan unit kerja (jika bukan admin).
 *
 * ============================================================
 * FITUR UTAMA
 * ============================================================
 * - Form registrasi dengan validasi client-side (password kuat, konfirmasi, field wajib)
 * - Pemilihan role (admin, management, viewer) → unit kerja hanya ditampilkan untuk role non-admin
 * - Fetch daftar unit kerja dari API /units
 * - Submit data ke endpoint /api/auth/register
 * - Integrasi Botpress chatbot (via useBotpressLoader)
 * - Redirect ke halaman login setelah registrasi berhasil
 *
 * ============================================================
 * STRUKTUR API
 * ============================================================
 * POST /api/auth/register
 *   Request body: {
 *     email, password, confirm_password, full_name,
 *     unit_kerja_id (optional jika role == admin),
 *     role
 *   }
 *   Response: { success: true, pesan: string, data: ... }
 *
 * ============================================================
 * VALIDASI PASSWORD (konsisten dengan backend)
 * ============================================================
 * - Minimal 8 karakter
 * - Minimal 1 huruf besar (A-Z)
 * - Minimal 1 huruf kecil (a-z)
 * - Minimal 1 angka (0-9)
 * - Minimal 1 simbol (non-alfanumerik)
 *
 * ============================================================
 * PANDUAN MAINTENANCE
 * ============================================================
 * - Gunakan validRoles dari konstanta, jangan hardcode di handler
 * - Pastikan field name sesuai dengan yang diharapkan backend (snake_case)
 * - Jika diperlukan role baru, tambahkan di validRoles dan sesuaikan aturan unit kerja
 * - Unit kerja fetch menggunakan api instance, response dinormalisasi support berbagai struktur
 */

import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import api from '@/lib/api';
import useBotpressLoader from '../hooks/useBotpressLoader';

// ============================================================
// Konstanta & Helper Functions
// ============================================================

/** Role yang valid sesuai backend (jangan tambah tanpa sinkronisasi) */
const VALID_ROLES = ['admin', 'management', 'viewer'];

/**
 * Memeriksa kekuatan password dengan regex yang sama seperti backend.
 * @param {string} password
 * @returns {boolean}
 */
function isStrongPassword(password) {
  const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/;
  return strongRegex.test(password);
}

// ============================================================
// Komponen Utama
// ============================================================

/**
 * RegistrationPage - Pendaftaran akun baru.
 * @returns {JSX.Element}
 */
function RegistrationPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // State data master
  const [workUnits, setWorkUnits] = useState([]);
  const [loadingUnits, setLoadingUnits] = useState(false);

  // State loading form
  const [loading, setLoading] = useState(false);

  // Toggle visibility password
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // State form
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    workUnit: '',
    role: '',
  });

  // Muat chatbot (Botpress)
  useBotpressLoader();

  // ============================================================
  // Effect: Tambah class khusus untuk background halaman login/register
  // ============================================================
  useEffect(() => {
    document.body.classList.add('login-page');
    return () => document.body.classList.remove('login-page');
  }, []);

  // ============================================================
  // Effect: Fetch daftar unit kerja
  // ============================================================
  useEffect(() => {
    const fetchWorkUnits = async () => {
      setLoadingUnits(true);
      try {
        const response = await api.get('/units');
        // Normalisasi struktur respons
        const units = response.data?.data || response.data?.units || [];
        setWorkUnits(units);
      } catch (error) {
        console.error('Gagal memuat data unit kerja:', error);
        toast({
          title: 'Gagal memuat unit kerja',
          description: error.response?.data?.error || error.message,
          variant: 'destructive',
        });
      } finally {
        setLoadingUnits(false);
      }
    };
    fetchWorkUnits();
  }, [toast]);

  // ============================================================
  // Effect: Reset unit kerja jika role berubah menjadi admin
  // ============================================================
  // Admin tidak memiliki unit kerja, sehingga field harus kosong dan tidak wajib.
  useEffect(() => {
    if (formData.role === 'admin') {
      setFormData((prev) => ({ ...prev, workUnit: '' }));
    }
  }, [formData.role]);

  // ============================================================
  // Handler: Perubahan input teks biasa
  // ============================================================
  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  // ============================================================
  // Handler: Submit registrasi
  // ============================================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validasi konfirmasi password
    if (formData.password !== formData.confirmPassword) {
      toast({ title: 'Konfirmasi password tidak cocok', variant: 'destructive' });
      setLoading(false);
      return;
    }

    // Validasi kekuatan password
    if (!isStrongPassword(formData.password)) {
      toast({
        title: 'Password tidak kuat',
        description: 'Minimal 8 karakter dan mengandung huruf besar, kecil, angka, dan simbol.',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    // Validasi role
    if (!VALID_ROLES.includes(formData.role)) {
      toast({
        title: 'Role tidak valid',
        description: 'Silakan pilih peran yang valid.',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    // Jika role bukan admin, unit kerja wajib diisi
    const shouldShowUnitKerja = formData.role && !['admin'].includes(formData.role);
    if (shouldShowUnitKerja && !formData.workUnit) {
      toast({
        title: 'Unit kerja wajib diisi',
        description: 'Silakan pilih unit kerja untuk role yang dipilih.',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    try {
      const payload = {
        email: formData.email,
        password: formData.password,
        confirm_password: formData.confirmPassword,
        full_name: formData.fullName,
        unit_kerja_id: formData.workUnit,
        role: formData.role,
      };
      await api.post('/auth/register', payload);
      toast({
        title: 'Pendaftaran berhasil!',
        description: 'Akun Anda telah dibuat. Silakan login.',
      });
      navigate('/login');
    } catch (error) {
      toast({
        title: 'Gagal mendaftar',
        description: error.response?.data?.error || error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Apakah field unit kerja perlu ditampilkan?
  const shouldShowUnitKerja = formData.role && !['admin'].includes(formData.role);

  // ============================================================
  // Render
  // ============================================================
  return (
    <>
      <Helmet>
        <title>Registrasi | SAKTI Platform</title>
        <meta name="description" content="Buat akun SAKTI - Service Knowledge Platform" />
        {/* Gaya untuk menyesuaikan widget Botpress agar tidak mengganggu layout */}
        <style>{`
          #webchat .bpWebchat { position: unset !important; width: 100% !important; height: 100% !important; }
          #webchat .bpFab { display: none !important; }
        `}</style>
      </Helmet>

      <div className="min-h-screen grid lg:grid-cols-1 bg-gray-50">
        <div className="flex flex-col items-center justify-center px-8 md:px-16">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg border border-gray-100 space-y-6"
          >
            {/* Logo & Judul */}
            <div className="text-center mb-4">
              <img src="/sakti.png" alt="SAKTI Logo" className="h-32 mx-auto mb-3 object-contain" />
              <h2 className="text-3xl font-bold text-gray-900">Buat Akun Baru</h2>
              <p className="text-gray-600 mt-2 text-center">
                Daftarkan diri Anda untuk mulai menggunakan <b>SAKTI Platform</b>.
              </p>
            </div>

            {/* Form Registrasi */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nama Lengkap */}
              <div>
                <Label htmlFor="fullName">Nama Lengkap</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Masukkan nama lengkap"
                  required
                  className="h-11 mt-1"
                />
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="nama@sucofindo.co.id"
                  required
                  className="h-11 mt-1"
                />
              </div>

              {/* Password */}
              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative mt-1">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Masukkan password"
                    required
                    className="h-11 pr-10"
                  />
                  <div
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-gray-500 hover:text-gray-700"
                    aria-label="Toggle visibility"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </div>
                </div>
              </div>

              {/* Konfirmasi Password */}
              <div>
                <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
                <div className="relative mt-1">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Ulangi password"
                    required
                    className="h-11 pr-10"
                  />
                  <div
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-gray-500 hover:text-gray-700"
                    aria-label="Toggle visibility"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </div>
                </div>
              </div>

              {/* Role */}
              <div>
                <Label htmlFor="role">Peran</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                  required
                >
                  <SelectTrigger className="h-11 mt-1">
                    <SelectValue placeholder="Pilih peran" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="management">Management</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                    {/* Role 'pdo' dihapus karena tidak ada di backend */}
                  </SelectContent>
                </Select>
              </div>

              {/* Unit Kerja (hanya untuk role non-admin) */}
              {shouldShowUnitKerja && (
                <div>
                  <Label htmlFor="workUnit">Unit Kerja</Label>
                  <Select
                    value={formData.workUnit}
                    onValueChange={(value) => setFormData({ ...formData, workUnit: value })}
                    required
                    disabled={loadingUnits}
                  >
                    <SelectTrigger className="h-11 mt-1">
                      <SelectValue placeholder={loadingUnits ? "Memuat unit..." : "Pilih unit kerja"} />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto">
                      {workUnits.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id.toString()}>
                          {unit.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Tombol Submit */}
              <Button
                type="submit"
                className="w-full h-11 text-white font-medium bg-[#000476] hover:bg-[#0202a3] transition-all"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" /> Memproses...
                  </>
                ) : (
                  'Daftar'
                )}
              </Button>
            </form>

            {/* Tautan ke Login */}
            <div className="text-center mt-4">
              <Link to="/login">
                <Button
                  variant="outline"
                  className="w-full h-11 border-[#000476] text-[#000476] hover:bg-blue-50 transition-colors"
                >
                  Sudah punya akun? Masuk di sini
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}

export default RegistrationPage;
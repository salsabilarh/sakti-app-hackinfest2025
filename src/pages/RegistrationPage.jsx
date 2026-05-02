import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import useBotpressLoader from '../hooks/useBotpressLoader';

function RegistrationPage() {
  const navigate = useNavigate();
  const [workUnits, setWorkUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    workUnit: '',
    role: '',
  });

  const shouldShowUnitKerja = formData.role && !['admin'].includes(formData.role);
  const validRoles = ['admin', 'management', 'viewer', 'pdo'];
  useBotpressLoader();

  useEffect(() => {
    document.body.classList.add('login-page');
    return () => document.body.classList.remove('login-page');
  }, []);

  useEffect(() => {
    const fetchWorkUnits = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/units');
        const data = await response.json();
        setWorkUnits(data.units || []);
      } catch (error) {
        console.error('Gagal memuat data unit kerja:', error);
      }
    };
    fetchWorkUnits();
  }, []);

  useEffect(() => {
    if (formData.role === 'admin') {
      setFormData((prev) => ({ ...prev, workUnit: '' }));
    }
  }, [formData.role]);

  const isStrongPassword = (password) =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/.test(password);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prevState) => ({ ...prevState, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      toast({ title: 'Konfirmasi password tidak cocok', variant: 'destructive' });
      setLoading(false);
      return;
    }

    if (!isStrongPassword(formData.password)) {
      toast({
        title: 'Password tidak kuat',
        description: 'Minimal 8 karakter dan mengandung huruf besar, kecil, angka, dan simbol.',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    if (!validRoles.includes(formData.role)) {
      toast({
        title: 'Role tidak valid',
        description: 'Silakan pilih peran yang valid.',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

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
      const response = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          confirm_password: formData.confirmPassword,
          full_name: formData.fullName,
          unit_kerja_id: formData.workUnit,
          role: formData.role,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Registrasi gagal');

      toast({
        title: 'Pendaftaran berhasil!',
        description: 'Akun Anda telah dibuat. Silakan login.',
      });
      navigate('/login');
    } catch (error) {
      toast({
        title: 'Gagal mendaftar',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Registrasi | SAKTI Platform</title>
        <meta name="description" content="Buat akun SAKTI - Service Knowledge Platform" />
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
            <div className="text-center mb-4">
              <img src="sakti.png" alt="SAKTI Logo" className="h-32 mx-auto mb-3 object-contain" />
              <h2 className="text-3xl font-bold text-gray-900">Buat Akun Baru</h2>
              <p className="text-gray-600 mt-2 text-center">
                Daftarkan diri Anda untuk mulai menggunakan <b>SAKTI Platform</b>.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
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
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </div>
                </div>
              </div>

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
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </div>
                </div>
              </div>

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
                    <SelectItem value="pdo">PDO</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {shouldShowUnitKerja && (
                <div>
                  <Label htmlFor="workUnit">Unit Kerja</Label>
                  <Select
                    value={formData.workUnit}
                    onValueChange={(value) => setFormData({ ...formData, workUnit: value })}
                    required
                  >
                    <SelectTrigger className="h-11 mt-1">
                      <SelectValue placeholder="Pilih unit kerja" />
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

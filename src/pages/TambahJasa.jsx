/**
 * pages/TambahJasa.jsx
 *
 * Halaman untuk membuat layanan (service) baru.
 * Menyediakan form lengkap dengan field: informasi dasar, portfolio & sub portfolio,
 * sektor & sub sektor, manfaat, output, ruang lingkup, video pengantar, regulasi.
 *
 * ============================================================
 * FITUR UTAMA
 * ============================================================
 * - Form create service dengan validasi client-side
 * - Mendukung pembuatan master data (portfolio, sub portfolio, sektor, sub sektor)
 *   langsung dari form (jika user memiliki role admin/management)
 * - Preview video YouTube dari URL yang dimasukkan
 * - Integrasi dengan API untuk menyimpan data
 * - Redirect ke halaman daftar layanan setelah sukses
 *
 * ============================================================
 * STRUKTUR DATA API
 * ============================================================
 * POST  /services                         → buat layanan baru
 * GET   /portfolios                       → daftar portfolio untuk dropdown
 * GET   /sectors                          → daftar sektor
 * GET   /units                            → daftar unit (filter type='sbu')
 * POST  /portfolios                       → buat portfolio baru
 * POST  /portfolios/:id/sub-portfolios   → buat sub portfolio
 * POST  /sectors                          → buat sektor baru
 * POST  /sectors/:id/sub-sectors         → buat sub sektor
 *
 * ============================================================
 * PANDUAN MAINTENANCE
 * ============================================================
 * - Perhatikan penggunaan `canCreateMasterData` yang bergantung pada role user.
 * - Sub sektor hanya dapat dipilih setelah sektor induk dipilih.
 * - Form submission mengubah daftar sektor terpilih menjadi sektor yang memiliki
 *   setidaknya satu sub sektor yang dipilih (sesuai kebutuhan backend).
 * - Semua API call menggunakan instance `api` yang sudah dikonfigurasi.
 * - Response dari API dinormalisasi untuk mendukung berbagai struktur.
 */

import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Button } from '@/components/ui/button.jsx';
import { useToast } from '@/components/ui/use-toast.js';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.jsx';

import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover.jsx';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command.jsx';

import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

import {
  Sparkles,
  Building,
  Package,
  Globe,
  Star,
  FileText,
  LayoutDashboard,
  Video,
  ScrollText,
  Save,
  ArrowLeft,
  Check,
  Search,
  Info,
} from 'lucide-react';

import api from '@/lib/api';

// ============================================================
// Helper Functions
// ============================================================

/**
 * Mendapatkan URL embed YouTube dari berbagai format URL.
 * @param {string} url
 * @returns {string|null}
 */
function getYoutubeEmbedUrl(url) {
  if (!url) return null;
  try {
    if (url.includes('youtu.be')) {
      const videoId = url.split('youtu.be/')[1].split(/[?&#]/)[0];
      return `https://www.youtube-nocookie.com/embed/${videoId}`;
    }
    const parsed = new URL(url);
    let videoId = parsed.searchParams.get('v');
    if (!videoId && parsed.pathname.includes('/shorts/')) {
      videoId = parsed.pathname.split('/shorts/')[1];
    }
    if (videoId) {
      return `https://www.youtube-nocookie.com/embed/${videoId.split(/[?&#]/)[0]}`;
    }
  } catch {}
  return null;
}

// ============================================================
// Subkomponen Presentasional
// ============================================================

/**
 * Form field dengan label di kiri (grid) untuk layout yang konsisten.
 */
const FormField = ({ label, htmlFor, children, required = false }) => (
  <div className="grid grid-cols-1 md:grid-cols-[160px,1fr] gap-3 items-start">
    <Label htmlFor={htmlFor} className="font-medium text-gray-700 pt-2">
      {label} {required && <span className="text-red-500">*</span>}
    </Label>
    <div>{children}</div>
  </div>
);

/**
 * Kartu info dengan ikon dan judul, digunakan untuk mengelompokkan field.
 */
const InfoCard = ({ icon, title, children, className }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    className={cn("w-full", className)}
  >
    <Card className="border border-gray-200/70 shadow-sm hover:shadow-md rounded-2xl transition-all duration-300 h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-[#000476]">
          {icon}
          <span>{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  </motion.div>
);

/**
 * Hero card menampilkan judul halaman "Tambah Layanan Baru" dengan background gradient.
 */
const HeroCard = () => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.45 }}
    className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#000476] to-indigo-800 p-6 sm:p-8 text-white shadow-lg"
  >
    <div className="absolute inset-0 bg-[radial-gradient(800px_circle_at_20%_-10%,rgba(255,255,255,0.14),transparent)]" />
    <div className="relative">
      <h1 className="text-2xl sm:text-3xl font-bold leading-tight">Tambah Layanan Baru</h1>
    </div>
  </motion.div>
);

// ============================================================
// Komponen Utama
// ============================================================

/**
 * TambahJasa - Halaman untuk membuat layanan baru.
 * @returns {JSX.Element}
 */
export default function TambahJasa() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Hak akses untuk membuat master data (portfolio, sektor, dll)
  const canCreateMasterData = user?.role === 'admin' || user?.role === 'management';

  // State loading
  const [loading, setLoading] = useState(false);

  // Data master
  const [portfolios, setPortfolios] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [subSectors, setSubSectors] = useState([]);
  const [sbuUnits, setSbuUnits] = useState([]);

  // State form
  const [form, setForm] = useState({
    name: '',
    group: '',
    code: '',
    intro_video_url: '',
    overview: '',
    scope: '',
    benefit: '',
    output: '',
    regulation_ref: '',
    portfolio_id: '',
    sub_portfolio_id: '',
    sbu_owner_id: '',
    sectors: [],
    sub_sectors: [],
  });

  // Modal states untuk membuat master data
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [newPortfolioName, setNewPortfolioName] = useState('');

  const [showSubPortfolioModal, setShowSubPortfolioModal] = useState(false);
  const [selectedPortfolioForSub, setSelectedPortfolioForSub] = useState('');
  const [newSubPortfolioName, setNewSubPortfolioName] = useState('');
  const [newSubPortfolioCode, setNewSubPortfolioCode] = useState('');

  const [showSectorModal, setShowSectorModal] = useState(false);
  const [newSectorName, setNewSectorName] = useState('');
  const [newSectorCode, setNewSectorCode] = useState('');

  const [showSubSectorModal, setShowSubSectorModal] = useState(false);
  const [selectedSectorForSub, setSelectedSectorForSub] = useState('');
  const [newSubSectorName, setNewSubSectorName] = useState('');
  const [newSubSectorCode, setNewSubSectorCode] = useState('');

  const [openSector, setOpenSector] = useState(false);

  // ============================================================
  // useEffect: Ambil data master (portfolio, sektor, unit)
  // ============================================================
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [portfolioRes, sectorRes, unitRes] = await Promise.all([
          api.get('/portfolios'),
          api.get('/sectors'),
          api.get('/units'),
        ]);
        // Normalisasi response
        const portfoliosData = portfolioRes.data?.data || portfolioRes.data?.portfolios || [];
        const sectorsData = sectorRes.data?.data || sectorRes.data?.sectors || [];
        const allUnits = unitRes.data?.data || unitRes.data?.units || [];
        setPortfolios(portfoliosData);
        setSectors(sectorsData);
        setSbuUnits(allUnits.filter((unit) => unit.type === 'sbu'));
      } catch (err) {
        toast({
          variant: 'destructive',
          title: 'Gagal memuat data',
          description: err.message,
        });
      }
    };
    fetchInitialData();
  }, [toast]);

  // ============================================================
  // useEffect: Update daftar sub sektor yang tersedia berdasarkan sektor terpilih
  // ============================================================
  useEffect(() => {
    // Ambil semua sub sektor dari sektor yang dipilih
    const selectedSubs = sectors
      .filter((s) => form.sectors.includes(s.id.toString()))
      .flatMap((s) => s.sub_sectors || []);
    setSubSectors(selectedSubs);
    // Hapus sub sektor yang tidak lagi valid
    const validSubIds = selectedSubs.map((s) => s.id.toString());
    setForm((prev) => ({
      ...prev,
      sub_sectors: prev.sub_sectors.filter((id) => validSubIds.includes(id)),
    }));
  }, [form.sectors, sectors]);

  // ============================================================
  // Handler: Perubahan input biasa
  // ============================================================
  const handleChange = (e) => {
    const { name, value } = e.target;
    // Deteksi opsi khusus untuk membuat master data dari dropdown
    if (name === 'portfolio_id' && value === '__new__') {
      setShowPortfolioModal(true);
      return;
    }
    if (name === 'sub_portfolio_id' && value === '__new__') {
      setShowSubPortfolioModal(true);
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // ============================================================
  // Handler: Submit form untuk membuat layanan baru
  // ============================================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validasi field wajib
    if (!form.name || !form.portfolio_id || !form.sbu_owner_id) {
      toast({
        variant: 'destructive',
        title: 'Form tidak lengkap',
        description: 'Harap isi nama layanan, portfolio, dan unit pemilik.',
      });
      setLoading(false);
      return;
    }

    try {
      // Transformasi: sektor yang dipilih = sektor yang memiliki setidaknya satu sub sektor dipilih
      const filteredSectors = sectors
        .filter((s) => s.sub_sectors?.some((sub) => form.sub_sectors.includes(sub.id.toString())))
        .map((s) => s.id.toString());
      const payload = { ...form, sectors: filteredSectors, sub_sectors: form.sub_sectors };
      await api.post('/services', payload);
      toast({ title: 'Berhasil', description: 'Layanan berhasil ditambahkan!' });
      navigate('/daftar-jasa');
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Gagal',
        description: err.response?.data?.error || err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // Handlers: Create master data (Portfolio, Sub Portfolio, Sektor, Sub Sektor)
  // ============================================================
  const handleCreatePortfolio = async () => {
    if (!newPortfolioName.trim()) {
      toast({ variant: 'destructive', title: 'Nama tidak boleh kosong' });
      return;
    }
    try {
      const res = await api.post('/portfolios', {
        name: newPortfolioName,
        code: newPortfolioName.slice(0, 4).toUpperCase(),
      });
      const newPortfolio = res.data?.data || res.data;
      setPortfolios((prev) => [...prev, newPortfolio]);
      setForm((prev) => ({
        ...prev,
        portfolio_id: newPortfolio.id.toString(),
        sub_portfolio_id: '',
      }));
      setShowPortfolioModal(false);
      setNewPortfolioName('');
      toast({ title: 'Berhasil', description: 'Portfolio berhasil dibuat' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Gagal', description: err.message });
    }
  };

  const handleCreateSubPortfolio = async () => {
    if (!selectedPortfolioForSub || !newSubPortfolioName.trim() || !newSubPortfolioCode.trim()) {
      toast({ variant: 'destructive', title: 'Form belum lengkap' });
      return;
    }
    try {
      const res = await api.post(`/portfolios/${selectedPortfolioForSub}/sub-portfolios`, {
        name: newSubPortfolioName,
        code: newSubPortfolioCode,
      });
      const newSubPortfolio = res.data?.data || res.data;
      setPortfolios((prev) =>
        prev.map((p) =>
          p.id.toString() === selectedPortfolioForSub.toString()
            ? { ...p, sub_portfolios: [...(p.sub_portfolios || []), newSubPortfolio] }
            : p
        )
      );
      setForm((prev) => ({ ...prev, sub_portfolio_id: newSubPortfolio.id.toString() }));
      setShowSubPortfolioModal(false);
      setSelectedPortfolioForSub('');
      setNewSubPortfolioName('');
      setNewSubPortfolioCode('');
      toast({ title: 'Berhasil', description: 'Sub Portfolio berhasil dibuat' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Gagal', description: err.message });
    }
  };

  const handleCreateSector = async () => {
    if (!newSectorName.trim() || !newSectorCode.trim()) {
      toast({ variant: 'destructive', title: 'Form belum lengkap' });
      return;
    }
    try {
      const res = await api.post('/sectors', { name: newSectorName, code: newSectorCode });
      const newSector = res.data?.data || res.data;
      setSectors((prev) => [...prev, { ...newSector, sub_sectors: [] }]);
      setShowSectorModal(false);
      setNewSectorName('');
      setNewSectorCode('');
      toast({ title: 'Berhasil', description: 'Sektor berhasil ditambahkan' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Gagal', description: err.message });
    }
  };

  const handleCreateSubSector = async () => {
    if (!selectedSectorForSub || !newSubSectorName.trim() || !newSubSectorCode.trim()) {
      toast({ variant: 'destructive', title: 'Form belum lengkap' });
      return;
    }
    try {
      const res = await api.post(`/sectors/${selectedSectorForSub}/sub-sectors`, {
        name: newSubSectorName,
        code: newSubSectorCode,
      });
      const newSubSector = res.data?.data || res.data;
      setSectors((prev) =>
        prev.map((s) =>
          s.id.toString() === selectedSectorForSub.toString()
            ? { ...s, sub_sectors: [...(s.sub_sectors || []), newSubSector] }
            : s
        )
      );
      setForm((prev) => ({
        ...prev,
        sub_sectors: [...prev.sub_sectors, newSubSector.id.toString()],
      }));
      setShowSubSectorModal(false);
      setSelectedSectorForSub('');
      setNewSubSectorName('');
      setNewSubSectorCode('');
      toast({ title: 'Berhasil', description: 'Sub Sektor berhasil ditambahkan' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Gagal', description: err.message });
    }
  };

  // Preview video
  const videoEmbed = getYoutubeEmbedUrl(form.intro_video_url);

  // ============================================================
  // Render
  // ============================================================
  return (
    <>
      <Helmet>
        <title>Tambah Layanan - SAKTI</title>
      </Helmet>

      <div className="bg-gray-50 min-h-screen">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          {/* Navigation bar */}
          <div className="flex justify-between items-center mb-3">
            <Link to="/daftar-jasa">
              <Button variant="outline" className="shadow-sm">
                <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Daftar
              </Button>
            </Link>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-[#000476] hover:bg-indigo-900 text-white"
            >
              <Save className="w-4 h-4 mr-2" /> {loading ? 'Menyimpan...' : 'Simpan Layanan'}
            </Button>
          </div>

          <HeroCard />

          <form onSubmit={handleSubmit} className="mt-6 grid lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Kolom kiri (2/3) */}
            <div className="lg:col-span-2 space-y-6">
              {/* INFORMASI DASAR */}
              <InfoCard icon={<Info className="w-5 h-5 text-indigo-600" />} title="Informasi Dasar">
                <div className="space-y-4">
                  <FormField label="Nama Layanan" htmlFor="name" required>
                    <Input
                      id="name"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Masukkan nama layanan"
                    />
                  </FormField>
                  <FormField label="Unit Pemilik (SBU)" htmlFor="sbu_owner_id" required>
                    <select
                      id="sbu_owner_id"
                      name="sbu_owner_id"
                      value={form.sbu_owner_id}
                      onChange={handleChange}
                      className="w-full border rounded px-3 py-2"
                    >
                      <option value="">-- Pilih Unit --</option>
                      {sbuUnits.map((unit) => (
                        <option key={unit.id} value={unit.id}>
                          {unit.name}
                        </option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label="Group Layanan" htmlFor="group">
                    <Input
                      id="group"
                      name="group"
                      value={form.group}
                      onChange={handleChange}
                      placeholder="Contoh: Inspeksi / Sertifikasi"
                    />
                  </FormField>
                  <FormField label="Kode Layanan" htmlFor="code">
                    <Input
                      id="code"
                      name="code"
                      value={form.code}
                      onChange={handleChange}
                      placeholder="Kode unik layanan"
                    />
                  </FormField>
                  <FormField label="Deskripsi" htmlFor="overview">
                    <Textarea
                      id="overview"
                      name="overview"
                      value={form.overview}
                      onChange={handleChange}
                      rows={4}
                      placeholder="Gambaran singkat layanan"
                      className="resize-none"
                    />
                  </FormField>
                </div>
              </InfoCard>

              {/* PORTFOLIO & SUB PORTFOLIO */}
              <InfoCard icon={<Package className="w-5 h-5 text-indigo-600" />} title="Portfolio & Sub Portfolio">
                <div className="space-y-4">
                  <FormField label="Portfolio" htmlFor="portfolio_id" required>
                    <select
                      id="portfolio_id"
                      name="portfolio_id"
                      value={form.portfolio_id}
                      onChange={handleChange}
                      className="w-full border rounded px-3 py-2"
                    >
                      <option value="">-- Pilih Portfolio --</option>
                      {portfolios.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                      {canCreateMasterData && <option value="__new__">+ Tambah Portfolio Baru</option>}
                    </select>
                  </FormField>
                  <FormField label="Sub Portfolio" htmlFor="sub_portfolio_id">
                    <select
                      id="sub_portfolio_id"
                      name="sub_portfolio_id"
                      value={form.sub_portfolio_id}
                      onChange={handleChange}
                      className="w-full border rounded px-3 py-2"
                    >
                      <option value="">-- Pilih Sub Portfolio --</option>
                      {portfolios
                        .find((p) => p.id.toString() === form.portfolio_id)
                        ?.sub_portfolios?.map((sp) => (
                          <option key={sp.id} value={sp.id}>
                            {sp.name}
                          </option>
                        ))}
                      {canCreateMasterData && <option value="__new__">+ Tambah Sub Portfolio Baru</option>}
                    </select>
                  </FormField>
                </div>
              </InfoCard>

              {/* SEKTOR & SUB SEKTOR */}
              <InfoCard icon={<Globe className="w-5 h-5 text-indigo-600" />} title="Sektor & Sub Sektor">
                <div className="space-y-4">
                  <FormField label="Sektor">
                    <div className="space-y-2">
                      <Popover open={openSector} onOpenChange={setOpenSector}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="w-full flex-wrap justify-start gap-2 text-left min-h-[2.75rem]"
                          >
                            {form.sectors.length > 0 ? (
                              form.sectors.map((id) => {
                                const s = sectors.find((sec) => sec.id.toString() === id);
                                return s && (
                                  <span
                                    key={s.id}
                                    className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-indigo-50 text-indigo-800"
                                  >
                                    {(s.code ? `${s.code} - ` : '')}
                                    {s.name}
                                  </span>
                                );
                              })
                            ) : (
                              <span className="text-muted-foreground">Pilih sektor...</span>
                            )}
                            <Search className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="min-w-full max-w-sm p-0">
                          <Command>
                            <CommandInput placeholder="Cari sektor..." />
                            <CommandList>
                              <CommandEmpty>Sektor tidak ditemukan.</CommandEmpty>
                              <CommandGroup>
                                {sectors.map((s) => {
                                  const isSelected = form.sectors.includes(s.id.toString());
                                  return (
                                    <CommandItem
                                      key={s.id}
                                      onSelect={() => {
                                        const newSelected = isSelected
                                          ? form.sectors.filter((id) => id !== s.id.toString())
                                          : [...form.sectors, s.id.toString()];
                                        setForm((prev) => ({ ...prev, sectors: newSelected }));
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          'mr-2 h-4 w-4',
                                          isSelected ? 'opacity-100' : 'opacity-0'
                                        )}
                                      />
                                      <div>
                                        <span className="font-medium">{s.name}</span>
                                        <span className="text-xs text-gray-500"> {s.code}</span>
                                      </div>
                                    </CommandItem>
                                  );
                                })}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      {canCreateMasterData && (
                        <Button
                          type="button"
                          onClick={() => setShowSectorModal(true)}
                          size="sm"
                          variant="outline"
                        >
                          + Tambah Sektor
                        </Button>
                      )}
                    </div>
                  </FormField>

                  {form.sectors.length > 0 && (
                    <FormField label="Sub Sektor">
                      <div className="space-y-2 border rounded-xl p-3 bg-gray-50 max-h-48 overflow-auto">
                        {subSectors.map((sub) => (
                          <label key={sub.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              value={sub.id}
                              checked={form.sub_sectors.includes(sub.id.toString())}
                              onChange={(e) => {
                                const val = e.target.value;
                                setForm((prev) => ({
                                  ...prev,
                                  sub_sectors: e.target.checked
                                    ? [...prev.sub_sectors, val]
                                    : prev.sub_sectors.filter((v) => v !== val),
                                }));
                              }}
                              className="rounded border-gray-300"
                            />
                            <span className="text-sm">
                              {sub.code} - {sub.name}
                            </span>
                          </label>
                        ))}
                        {canCreateMasterData && (
                          <Button
                            type="button"
                            onClick={() => setShowSubSectorModal(true)}
                            size="sm"
                            variant="outline"
                          >
                            + Tambah Sub Sektor
                          </Button>
                        )}
                      </div>
                    </FormField>
                  )}
                </div>
              </InfoCard>

              {/* MANFAAT LAYANAN */}
              <InfoCard icon={<Star className="w-5 h-5 text-amber-500" />} title="Manfaat Layanan">
                <Textarea
                  name="benefit"
                  value={form.benefit}
                  onChange={handleChange}
                  rows={6}
                  placeholder="Tulis manfaat layanan (satu baris satu manfaat)"
                  className="resize-none w-full"
                />
              </InfoCard>

              {/* OUTPUT LAYANAN */}
              <InfoCard icon={<FileText className="w-5 h-5 text-indigo-600" />} title="Output Layanan">
                <Textarea
                  name="output"
                  value={form.output}
                  onChange={handleChange}
                  rows={6}
                  placeholder="Tulis output layanan (satu baris satu output)"
                  className="resize-none w-full"
                />
              </InfoCard>

              {/* RUANG LINGKUP */}
              <InfoCard icon={<LayoutDashboard className="w-5 h-5 text-indigo-600" />} title="Ruang Lingkup">
                <Textarea
                  name="scope"
                  value={form.scope}
                  onChange={handleChange}
                  rows={10}
                  placeholder="Tulis ruang lingkup (bisa dengan angka dan bullet)"
                  className="resize-none w-full"
                />
              </InfoCard>
            </div>

            {/* Sidebar kanan (1/3) */}
            <aside className="space-y-6 lg:sticky lg:top-6 self-start">
              {/* Video Pengantar */}
              <InfoCard icon={<Video className="w-5 h-5 text-red-600" />} title="Video Pengantar">
                <Input
                  name="intro_video_url"
                  value={form.intro_video_url}
                  onChange={handleChange}
                  placeholder="https://youtu.be/..."
                />
                {videoEmbed && (
                  <div className="mt-3 aspect-video rounded-xl overflow-hidden border">
                    <iframe
                      src={videoEmbed}
                      title="Preview Video"
                      className="w-full h-full"
                      allowFullScreen
                    />
                  </div>
                )}
              </InfoCard>

              {/* Regulasi Terkait */}
              <InfoCard icon={<ScrollText className="w-5 h-5 text-indigo-600" />} title="Regulasi Terkait">
                <Textarea
                  name="regulation_ref"
                  value={form.regulation_ref}
                  onChange={handleChange}
                  rows={6}
                  placeholder="Tulis regulasi/standar yang menjadi acuan"
                  className="resize-none"
                />
              </InfoCard>
            </aside>
          </form>
        </div>
      </div>

      {/* ========== MODAL CREATE MASTER DATA ========== */}

      {/* Modal Portfolio */}
      <Dialog open={showPortfolioModal} onOpenChange={setShowPortfolioModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Portfolio Baru</DialogTitle>
          </DialogHeader>
          <Input
            value={newPortfolioName}
            onChange={(e) => setNewPortfolioName(e.target.value)}
            placeholder="Nama Portfolio"
          />
          <Button onClick={handleCreatePortfolio} className="mt-3">
            Simpan
          </Button>
        </DialogContent>
      </Dialog>

      {/* Modal Sub Portfolio */}
      <Dialog open={showSubPortfolioModal} onOpenChange={setShowSubPortfolioModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Sub Portfolio Baru</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <select
              value={selectedPortfolioForSub}
              onChange={(e) => setSelectedPortfolioForSub(e.target.value)}
              className="w-full border rounded p-2"
            >
              <option value="">Pilih Portfolio Induk</option>
              {portfolios.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <Input
              placeholder="Kode Sub Portfolio"
              value={newSubPortfolioCode}
              onChange={(e) => setNewSubPortfolioCode(e.target.value)}
            />
            <Input
              placeholder="Nama Sub Portfolio"
              value={newSubPortfolioName}
              onChange={(e) => setNewSubPortfolioName(e.target.value)}
            />
            <Button onClick={handleCreateSubPortfolio}>Simpan</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Sektor */}
      <Dialog open={showSectorModal} onOpenChange={setShowSectorModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Sektor Baru</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Kode Sektor"
              value={newSectorCode}
              onChange={(e) => setNewSectorCode(e.target.value)}
            />
            <Input
              placeholder="Nama Sektor"
              value={newSectorName}
              onChange={(e) => setNewSectorName(e.target.value)}
            />
            <Button onClick={handleCreateSector}>Simpan</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Sub Sektor */}
      <Dialog open={showSubSectorModal} onOpenChange={setShowSubSectorModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Sub Sektor Baru</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <select
              value={selectedSectorForSub}
              onChange={(e) => setSelectedSectorForSub(e.target.value)}
              className="w-full border rounded p-2"
            >
              <option value="">Pilih Sektor Induk</option>
              {sectors.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} - {s.name}
                </option>
              ))}
            </select>
            <Input
              placeholder="Kode Sub Sektor"
              value={newSubSectorCode}
              onChange={(e) => setNewSubSectorCode(e.target.value)}
            />
            <Input
              placeholder="Nama Sub Sektor"
              value={newSubSectorName}
              onChange={(e) => setNewSubSectorName(e.target.value)}
            />
            <Button onClick={handleCreateSubSector}>Simpan</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
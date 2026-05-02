import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card.jsx';
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

import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

import {
  Sparkles,
  Layers,
  Building,
  FolderKanban,
  FileText,
  FileSearch,
  Save,
  ArrowLeft,
  Check,
  Search,
  PlaySquare,
} from 'lucide-react';

function TambahJasa() {
  const { authToken, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: '',
    group: '',
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

  const [portfolios, setPortfolios] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [subSectors, setSubSectors] = useState([]);
  const [sbuUnits, setSbuUnits] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modals (master data)
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

  // Popover state
  const [openSektor, setOpenSektor] = useState(false);

  const canCreateMasterData = user.role === 'admin' || user.role === 'ppk_manager';

  // Quill toolbar
  const quillModules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link', 'clean'],
    ],
  };

  const getYoutubeEmbedUrl = (url) => {
    try {
      if (!url) return null;
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
    } catch {
      return null;
    }
    return null;
  };

  // Fetch initial master data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [portfolioRes, sectorRes, unitRes] = await Promise.all([
          fetch('http://localhost:3000/api/portfolios', {
            headers: { Authorization: `Bearer ${authToken}` },
          }),
          fetch('http://localhost:3000/api/sectors', {
            headers: { Authorization: `Bearer ${authToken}` },
          }),
          fetch('http://localhost:3000/api/units?type=sbu', {
            headers: { Authorization: `Bearer ${authToken}` },
          }),
        ]);

        const portfolioData = await portfolioRes.json();
        const sectorData = await sectorRes.json();
        const unitData = await unitRes.json();

        setPortfolios(portfolioData.portfolios || []);
        setSectors(sectorData.sectors || []);
        setSbuUnits(unitData.units || []);
      } catch (err) {
        toast({
          variant: 'destructive',
          title: 'Gagal memuat data awal',
          description: err.message,
        });
      }
    };
    if (authToken) fetchInitialData();
  }, [authToken, toast]);

  // Cascade sub-sectors based on selected sectors
  useEffect(() => {
    const selectedSubs = sectors
      .filter((s) => form.sectors.includes(s.id.toString()))
      .flatMap((s) => s.sub_sectors || []);
    setSubSectors(selectedSubs);

    const validSubIds = selectedSubs.map((s) => s.id.toString());
    setForm((prev) => ({
      ...prev,
      sub_sectors: prev.sub_sectors.filter((id) => validSubIds.includes(id)),
    }));
  }, [form.sectors, sectors]);

  useEffect(() => {
    if (!showSubPortfolioModal) {
      setSelectedPortfolioForSub('');
      setNewSubPortfolioName('');
      setNewSubPortfolioCode('');
    }
  }, [showSubPortfolioModal]);

  // Handlers
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'portfolio_id' && value === '__new__') {
      setShowPortfolioModal(true);
      setForm((prev) => ({ ...prev, portfolio_id: '' }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const setQuill = (field) => (val) => {
    setForm((prev) => ({ ...prev, [field]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

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
      // sektor yang valid hanya yang punya sub sektor terpilih
      const validSectors = sectors
        .filter((s) => {
          const subIds = s.sub_sectors?.map((sub) => sub.id.toString()) || [];
          const selectedSub = form.sub_sectors.filter((sub) => subIds.includes(sub));
          return selectedSub.length > 0;
        })
        .map((s) => s.id.toString());

      const payload = {
        ...form,
        sectors: validSectors,
        sub_sectors: form.sub_sectors || [],
      };

      const res = await fetch('http://localhost:3000/api/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menambahkan layanan');

      toast({ title: 'Berhasil', description: 'Layanan berhasil ditambahkan!' });
      navigate('/daftar-jasa');
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Gagal',
        description: err.message || 'Terjadi kesalahan.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Create master data
  const handleCreatePortfolio = async () => {
    if (!newPortfolioName.trim()) {
      toast({ variant: 'destructive', title: 'Nama tidak boleh kosong' });
      return;
    }
    try {
      const res = await fetch('http://localhost:3000/api/portfolios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          name: newPortfolioName,
          code: newPortfolioName.slice(0, 4).toUpperCase(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal membuat portfolio');

      setPortfolios((prev) => [...prev, data.portfolio]);
      setForm((prev) => ({ ...prev, portfolio_id: data.portfolio.id }));
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
      const res = await fetch(
        `http://localhost:3000/api/portfolios/${selectedPortfolioForSub}/sub-portfolios`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ name: newSubPortfolioName, code: newSubPortfolioCode }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menambahkan sub portfolio');

      setPortfolios((prev) =>
        prev.map((p) => {
          if (p.id.toString() === selectedPortfolioForSub.toString()) {
            const updatedSub = [...(p.sub_portfolios || []), data.sub_portfolio];
            return { ...p, sub_portfolios: updatedSub };
          }
          return p;
        })
      );

      setForm((prev) => ({ ...prev, sub_portfolio_id: data.sub_portfolio.id }));
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
      const res = await fetch('http://localhost:3000/api/sectors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ name: newSectorName, code: newSectorCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menambahkan sektor');

      setSectors((prev) => [...prev, { ...data.sector, sub_sectors: [] }]);
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
      const res = await fetch(
        `http://localhost:3000/api/sectors/${selectedSectorForSub}/sub-sectors`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ name: newSubSectorName, code: newSubSectorCode }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menambahkan sub sektor');

      setSectors((prev) =>
        prev.map((s) => {
          if (s.id.toString() === selectedSectorForSub.toString()) {
            const updatedSub = [...(s.sub_sectors || []), data.sub_sector];
            return { ...s, sub_sectors: updatedSub };
          }
          return s;
        })
      );

      setForm((prev) => ({
        ...prev,
        sub_sectors: [...prev.sub_sectors, data.sub_sector.id.toString()],
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

  const videoEmbed = getYoutubeEmbedUrl(form.intro_video_url);

  return (
    <>
      <Helmet>
        <title>Tambah Layanan - SAKTI</title>
      </Helmet>

      <motion.div
        className="max-w-6xl mx-auto p-6 space-y-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* HEADER / HERO */}
        <div className="relative overflow-hidden rounded-3xl p-8 sm:p-10 text-white shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-r from-[#000476] to-indigo-800" />
          <div className="absolute inset-0 bg-[radial-gradient(800px_circle_at_20%_-10%,rgba(255,255,255,0.15),transparent)]" />
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-2 flex items-center gap-2">
                <Sparkles className="w-7 h-7 text-white" />
                Tambah Layanan Jasa
              </h1>
              <p className="text-blue-100 text-sm sm:text-base">
                Lengkapi informasi layanan agar tampil rapi di SAKTI. Keep it clean and complete.
              </p>
            </div>
            <Link to="/daftar-jasa">
              <Button variant="outline" className="bg-white/10 text-white border-white/30 hover:bg-white/20">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali ke Daftar
              </Button>
            </Link>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* INFORMASI UMUM */}
          <Card className="shadow-md border border-gray-100 rounded-2xl hover:shadow-lg transition duration-300">
            <CardHeader className="pb-2 border-b bg-gradient-to-r from-indigo-50 to-white rounded-t-2xl">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-[#000476]">
                <Layers className="w-5 h-5 text-indigo-600" />
                Informasi Umum
              </CardTitle>
            </CardHeader>

            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6">
              <div>
                <Label className="text-gray-700">Nama Layanan</Label>
                <Input name="name" value={form.name} onChange={handleChange} placeholder="Masukkan nama layanan" className="mt-2" required />
              </div>

              <div>
                <Label className="text-gray-700">Group Layanan</Label>
                <Input name="group" value={form.group} onChange={handleChange} placeholder="Contoh: Inspeksi / Sertifikasi / Lab" className="mt-2" />
              </div>

              <div className="sm:col-span-2">
                <Label className="text-gray-700">Link Video Intro (YouTube)</Label>
                <div className="flex items-center gap-2 mt-2">
                  <PlaySquare className="w-4 h-4 text-indigo-600" />
                  <Input name="intro_video_url" value={form.intro_video_url} onChange={handleChange} placeholder="https://youtu.be/..." className="flex-1" />
                </div>
                {videoEmbed && (
                  <div className="mt-3">
                    <div className="aspect-video rounded-xl overflow-hidden border">
                      <iframe
                        title="Intro Video"
                        src={videoEmbed}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <Label className="text-gray-700">Portfolio</Label>
                <div className="flex items-center gap-2 mt-2">
                  <FolderKanban className="w-4 h-4 text-indigo-600" />
                  <select
                    name="portfolio_id"
                    value={form.portfolio_id}
                    onChange={handleChange}
                    className="border rounded px-3 py-2 w-full"
                    required
                  >
                    <option value="">-- Pilih Portfolio --</option>
                    {portfolios.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                    {canCreateMasterData && <option value="__new__">+ Tambah Portfolio Baru</option>}
                  </select>
                </div>
              </div>

              {form.portfolio_id && (
                <div>
                  <Label className="text-gray-700">Sub Portfolio</Label>
                  <select
                    name="sub_portfolio_id"
                    value={form.sub_portfolio_id}
                    onChange={(e) => {
                      if (e.target.value === '__new__') {
                        setShowSubPortfolioModal(true);
                        return;
                      }
                      handleChange(e);
                    }}
                    className="border rounded px-3 py-2 w-full mt-2"
                    required
                  >
                    <option value="">-- Pilih Sub Portfolio --</option>
                    {portfolios
                      .find((p) => p.id.toString() === form.portfolio_id.toString())
                      ?.sub_portfolios?.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name}
                        </option>
                      ))}
                    <option value="__new__">+ Tambah Sub Portfolio Baru</option>
                  </select>
                </div>
              )}

              <div>
                <Label className="text-gray-700">Unit Pemilik</Label>
                <div className="flex items-center gap-2 mt-2">
                  <Building className="w-4 h-4 text-indigo-600" />
                  <select
                    name="sbu_owner_id"
                    value={form.sbu_owner_id}
                    onChange={handleChange}
                    className="border rounded px-3 py-2 w-full"
                    required
                  >
                    <option value="">-- Pilih Unit --</option>
                    {sbuUnits.map((unit) => (
                      <option key={unit.id} value={unit.id}>{unit.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* KLASIFIKASI & SEKTOR */}
          <Card className="shadow-md border border-gray-100 rounded-2xl hover:shadow-lg transition duration-300">
            <CardHeader className="pb-2 border-b bg-gradient-to-r from-indigo-50 to-white rounded-t-2xl">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-[#000476]">
                <FileSearch className="w-5 h-5 text-indigo-600" />
                Klasifikasi & Sektor
              </CardTitle>
            </CardHeader>

            <CardContent className="grid grid-cols-1 gap-6 pt-6">
              <div>
                <Label className="text-gray-700 mb-1 block">Sektor</Label>
                <Popover open={openSektor} onOpenChange={setOpenSektor}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full flex-wrap justify-start gap-2 text-left min-h-[2.75rem]"
                    >
                      {form.sectors.length > 0 ? (
                        form.sectors.map((id) => {
                          const sektor = sectors.find((s) => s.id.toString() === id.toString());
                          if (!sektor) return null;
                          return (
                            <span
                              key={sektor.id}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800 mr-1"
                            >
                              {sektor.code} - {sektor.name}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setForm((prev) => ({
                                    ...prev,
                                    sectors: prev.sectors.filter((sid) => sid !== sektor.id.toString()),
                                  }));
                                }}
                                className="ml-1 text-red-600 hover:text-red-800 font-bold"
                                title="Hapus"
                              >
                                &times;
                              </button>
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-muted-foreground">Pilih sektor...</span>
                      )}
                      <Search className="ml-auto h-4 w-4 shrink-0 opacity-50" />
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
                                <Check className={cn('mr-2 h-4 w-4', isSelected ? 'opacity-100' : 'opacity-0')} />
                                <div className="flex flex-col">
                                  <span className="font-medium">{s.name}</span>
                                  <span className="text-xs text-muted-foreground">{s.code}</span>
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
                  <Button type="button" onClick={() => setShowSectorModal(true)} size="sm" className="mt-2">
                    + Tambah Sektor Baru
                  </Button>
                )}
              </div>

              {form.sectors.length > 0 && (
                <div>
                  <Label className="text-gray-700">Sub Sektor</Label>
                  <div className="space-y-1 border rounded-xl p-3 mt-2">
                    {subSectors.map((sub) => (
                      <label key={sub.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          value={sub.id.toString()}
                          checked={form.sub_sectors.includes(sub.id.toString())}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            const value = e.target.value;
                            const updated = checked
                              ? [...form.sub_sectors, value]
                              : form.sub_sectors.filter((id) => id !== value);
                            setForm((prev) => ({ ...prev, sub_sectors: updated }));
                          }}
                        />
                        <span>{sub.code} - {sub.name}</span>
                      </label>
                    ))}
                    {canCreateMasterData && (
                      <Button type="button" onClick={() => setShowSubSectorModal(true)} size="sm">
                        + Tambah Sub Sektor Baru
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* DESKRIPSI / KONTEN LAYANAN */}
          <Card className="shadow-md border border-gray-100 rounded-2xl hover:shadow-lg transition duration-300">
            <CardHeader className="pb-2 border-b bg-gradient-to-r from-indigo-50 to-white rounded-t-2xl">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-[#000476]">
                <FileText className="w-5 h-5 text-indigo-600" />
                Konten Layanan
              </CardTitle>
            </CardHeader>

            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6">
              <div className="sm:col-span-2">
                <Label className="text-gray-700 mb-2 block">Gambaran Umum</Label>
                <Textarea name="overview" value={form.overview} onChange={handleChange} />
              </div>

              <div className="sm:col-span-2">
                <Label className="text-gray-700 mb-2 block">Ruang Lingkup</Label>
                <Textarea name="scope" value={form.scope} onChange={handleChange} />
              </div>

              <div>
                <Label className="text-gray-700 mb-2 block">Manfaat</Label>
                <Textarea name="benefit" value={form.benefit} onChange={handleChange} />
              </div>

              <div>
                <Label className="text-gray-700 mb-2 block">Output</Label>
                <Textarea name="output" value={form.output} onChange={handleChange} />
              </div>

              <div className="sm:col-span-2">
                <Label className="text-gray-700">Referensi Regulasi</Label>
                <Textarea
                  name="regulation_ref"
                  value={form.regulation_ref}
                  onChange={handleChange}
                  placeholder="Tuliskan regulasi/standar"
                  className="mt-2"
                />
              </div>
            </CardContent>
          </Card>

          {/* SUBMIT */}
          <div className="flex justify-end">
            <Button
              type="submit"
              className="px-6 py-2 bg-[#000476] hover:bg-indigo-900 text-white rounded-xl flex items-center gap-2"
              disabled={loading}
            >
              <Save className="w-4 h-4" />
              {loading ? 'Menyimpan...' : 'Simpan Layanan'}
            </Button>
          </div>
        </form>
      </motion.div>

      {/* MODALS */}
      <Dialog open={showPortfolioModal} onOpenChange={setShowPortfolioModal}>
        <DialogContent aria-describedby="portfolio-desc">
          <DialogHeader>
            <DialogTitle>Tambah Portfolio Baru</DialogTitle>
          </DialogHeader>
          <p id="portfolio-desc" className="text-sm text-muted-foreground mb-2">
            Masukkan nama portfolio baru yang akan ditambahkan.
          </p>
          <Input
            value={newPortfolioName}
            onChange={(e) => setNewPortfolioName(e.target.value)}
            placeholder="Nama Portfolio"
            className="mb-4"
          />
          <Button onClick={handleCreatePortfolio}>Simpan</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={showSubPortfolioModal} onOpenChange={setShowSubPortfolioModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Sub Portfolio Baru</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label className="text-sm">Pilih Portfolio Induk</Label>
            <select
              value={selectedPortfolioForSub}
              onChange={(e) => setSelectedPortfolioForSub(e.target.value)}
              className="border px-3 py-2 rounded w-full"
            >
              <option value="">-- Pilih Portfolio --</option>
              {portfolios.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            <Label className="text-sm">Kode Sub Portfolio</Label>
            <Input
              value={newSubPortfolioCode}
              onChange={(e) => setNewSubPortfolioCode(e.target.value)}
              placeholder="Kode (misal: SUB1)"
            />

            <Label className="text-sm">Nama Sub Portfolio</Label>
            <Input
              value={newSubPortfolioName}
              onChange={(e) => setNewSubPortfolioName(e.target.value)}
              placeholder="Nama Sub Portfolio"
            />

            <Button onClick={handleCreateSubPortfolio}>Simpan</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showSectorModal} onOpenChange={setShowSectorModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Sektor Baru</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label className="text-sm">Kode Sektor</Label>
            <Input value={newSectorCode} onChange={(e) => setNewSectorCode(e.target.value)} />
            <Label className="text-sm">Nama Sektor</Label>
            <Input value={newSectorName} onChange={(e) => setNewSectorName(e.target.value)} />
            <Button onClick={handleCreateSector}>Simpan</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showSubSectorModal} onOpenChange={setShowSubSectorModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Sub Sektor Baru</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label className="text-sm">Pilih Sektor Induk</Label>
            <select
              value={selectedSectorForSub}
              onChange={(e) => setSelectedSectorForSub(e.target.value)}
              className="border px-3 py-2 rounded w-full"
            >
              <option value="">-- Pilih Sektor --</option>
              {sectors.map((s) => (
                <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
              ))}
            </select>

            <Label className="text-sm">Kode Sub Sektor</Label>
            <Input value={newSubSectorCode} onChange={(e) => setNewSubSectorCode(e.target.value)} />

            <Label className="text-sm">Nama Sub Sektor</Label>
            <Input value={newSubSectorName} onChange={(e) => setNewSubSectorName(e.target.value)} />

            <Button onClick={handleCreateSubSector}>Simpan</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default TambahJasa;

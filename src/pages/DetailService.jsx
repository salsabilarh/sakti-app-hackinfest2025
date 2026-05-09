/**
 * pages/DetailService.jsx
 *
 * Halaman detail layanan (service) yang menampilkan informasi lengkap:
 * - Informasi dasar (unit pemilik, grup, kode, deskripsi)
 * - Portfolio & Sub Portfolio
 * - Sektor & Sub Sektor
 * - Manfaat, output, ruang lingkup
 * - Video pengantar (YouTube embed)
 * - Daftar pelanggan (revenue)
 * - Marketing kit (file yang dapat diunduh)
 * - Regulasi terkait
 *
 * ============================================================
 * FITUR UTAMA
 * ============================================================
 * - Hero section dengan nama layanan
 * - Tampilan dua kolom (utama + sidebar)
 * - Download marketing kit dengan modal form (purpose wajib diisi)
 * - YouTube embed otomatis dari berbagai format URL (youtu.be, /watch?v=, /shorts/)
 * - Structured content untuk ruang lingkup (format angka + bullet)
 * - Tombol edit layanan (diarahkan ke halaman edit)
 * - Tombol kembali ke daftar layanan
 *
 * ============================================================
 * STRUKTUR DATA API
 * ============================================================
 * GET /services/:id
 *   Response: service object dengan properti:
 *   - name, code, group, overview, scope, benefit, output, regulation_ref, intro_video_url
 *   - sbu_owner: { id, name }
 *   - portfolio: { id, name }
 *   - sub_portfolio: { id, name, code }
 *   - sectors: array of { id, name, code }
 *   - sub_sectors: array of { id, name, code, sector_id }
 *   - revenues: array of { id, customer_name, revenue, unit: { name } }
 *   - marketing_kits: array of { id, name, file_type, file_path }
 *
 * ============================================================
 * PANDUAN MAINTENANCE
 * ============================================================
 * - Komponen-komponen kecil (InfoCard, HeroCard, LoadingSkeleton, ErrorState, NotFoundState)
 *   didefinisikan di dalam file karena hanya digunakan di sini.
 * - Helper functions (getYoutubeEmbedUrl, StructuredContent, formatList) dipisahkan ke luar
 *   untuk pengujian dan penggunaan ulang.
 * - Pastikan API response dinormalisasi di dalam useEffect.
 */

import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Download, Building, Youtube,
  Star, BarChart, ScrollText,
  FolderKanban, LayoutDashboard, Sparkles, AlertCircle,
  CheckCircle2, FileText, Hash, Video, Globe, Users,
  Info, Package, ChevronRight, Edit
} from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import DownloadFormModal from '@/components/DownloadFormModal.jsx';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

// ============================================================
// Helper Functions
// ============================================================

/**
 * Mendapatkan URL embed YouTube dari berbagai format URL.
 * Mendukung:
 *   - https://youtu.be/VIDEO_ID
 *   - https://www.youtube.com/watch?v=VIDEO_ID
 *   - https://www.youtube.com/shorts/VIDEO_ID
 *
 * @param {string} url - URL video YouTube
 * @returns {string|null} URL embed yang aman (dengan domain youtube-nocookie.com)
 */
function getYoutubeEmbedUrl(url) {
  if (!url) return null;
  try {
    // Format youtu.be/ID
    if (url.includes('youtu.be')) {
      const videoId = url.split('youtu.be/')[1].split(/[?&#]/)[0];
      return `https://www.youtube-nocookie.com/embed/${videoId}`;
    }
    const parsed = new URL(url);
    let videoId = parsed.searchParams.get('v');
    // Format shorts
    if (!videoId && parsed.pathname.includes('/shorts/')) {
      videoId = parsed.pathname.split('/shorts/')[1].split(/[?&#]/)[0];
    }
    if (videoId) {
      return `https://www.youtube-nocookie.com/embed/${videoId.split(/[?&#]/)[0]}`;
    }
  } catch {
    // URL tidak valid, return null
  }
  return null;
}

/**
 * Memformat teks ruang lingkup menjadi struktur dengan angka dan bullet points.
 * @param {string} text - Teks ruang lingkup (format baris per baris)
 * @returns {JSX.Element|null}
 */
function StructuredContent({ text }) {
  if (!text) return null;
  const lines = text.split('\n');
  const elements = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) { i++; continue; }
    // Pola angka diikuti titik: "1. Konten"
    const numberMatch = line.match(/^(\d+)\.\s+(.*)$/);
    if (numberMatch) {
      const number = numberMatch[1];
      const content = numberMatch[2];
      const subItems = [];
      let j = i + 1;
      while (j < lines.length) {
        const nextLine = lines[j].trim();
        const bulletMatch = nextLine.match(/^[•\-]\s+(.*)$/);
        if (bulletMatch) {
          subItems.push(bulletMatch[1]);
          j++;
        } else break;
      }
      elements.push(
        <div key={i} className="mb-4">
          <div className="flex gap-2 items-start">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-800 flex items-center justify-center text-sm font-bold">
              {number}
            </div>
            <div className="flex-1">
              <p className="text-gray-800 font-medium">{content}</p>
              {subItems.length > 0 && (
                <ul className="mt-2 space-y-1 ml-4">
                  {subItems.map((item, idx) => (
                    <li key={idx} className="flex gap-2 text-gray-600 text-sm">
                      <ChevronRight className="w-4 h-4 mt-0.5 text-indigo-400 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      );
      i = j;
      continue;
    }
    elements.push(<p key={i} className="text-gray-700 mb-2">{line}</p>);
    i++;
  }
  return <div className="space-y-3">{elements}</div>;
}

/**
 * Memformat teks menjadi array baris yang tidak kosong.
 * @param {string} text
 * @returns {string[]}
 */
function formatList(text) {
  if (!text) return [];
  return text.split('\n').filter(line => line.trim().length > 0);
}

// ============================================================
// Subkomponen Presentasional
// ============================================================

/**
 * Kartu info standar dengan ikon, judul, dan konten.
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
 * Hero card hanya menampilkan nama layanan dengan background gradient.
 */
const HeroCard = ({ name }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.45 }}
    className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#000476] to-indigo-800 p-6 sm:p-8 text-white shadow-lg"
  >
    <div className="absolute inset-0 bg-[radial-gradient(800px_circle_at_20%_-10%,rgba(255,255,255,0.14),transparent)]" />
    <div className="relative">
      <h1 className="text-2xl sm:text-3xl font-bold leading-tight">{name}</h1>
    </div>
  </motion.div>
);

const LoadingSkeleton = () => (
  <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
    <div className="animate-pulse space-y-6">
      <div className="h-24 rounded-3xl bg-gradient-to-r from-indigo-100 to-blue-100" />
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-64 bg-gray-100 rounded-2xl" />
          <div className="h-48 bg-gray-100 rounded-2xl" />
          <div className="h-40 bg-gray-100 rounded-2xl" />
        </div>
        <div className="space-y-6">
          <div className="h-56 bg-gray-100 rounded-2xl" />
          <div className="h-48 bg-gray-100 rounded-2xl" />
          <div className="h-40 bg-gray-100 rounded-2xl" />
        </div>
      </div>
    </div>
  </div>
);

const ErrorState = ({ message }) => (
  <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
      <AlertCircle className="h-8 w-8 text-red-400" />
    </div>
    <h2 className="text-xl font-semibold text-gray-900 mb-2">Gagal Memuat Layanan</h2>
    <p className="text-sm text-gray-500 max-w-sm mb-6">{message || 'Terjadi kesalahan. Silakan coba lagi.'}</p>
    <div className="flex gap-3 flex-wrap justify-center">
      <Button variant="outline" onClick={() => window.location.reload()}>Coba Lagi</Button>
      <Link to="/daftar-jasa">
        <Button className="bg-[#000476] hover:bg-indigo-900 text-white">Kembali ke Daftar Jasa</Button>
      </Link>
    </div>
  </div>
);

const NotFoundState = () => (
  <div className="text-center py-16">
    <h2 className="text-2xl font-bold text-gray-900 mb-2">Layanan Tidak Ditemukan</h2>
    <p className="text-gray-600 mb-6">Periksa kembali tautan atau pilih layanan lain.</p>
    <Link to="/daftar-jasa">
      <Button className="bg-[#000476] hover:bg-indigo-900 text-white">Kembali ke Daftar Jasa</Button>
    </Link>
  </div>
);

// ============================================================
// Komponen Utama
// ============================================================

/**
 * DetailService - Halaman detail layanan.
 * @returns {JSX.Element}
 */
export default function DetailService() {
  const { id } = useParams();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDownloadForm, setShowDownloadForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleDownloadClick = (file) => {
    setSelectedFile(file);
    setShowDownloadForm(true);
  };

  useEffect(() => {
    if (!id) return;

    let cancelled = false;
    const fetchDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/services/${id}`);
        // Normalisasi response: bisa langsung data atau di dalam data.service, data.data, dll.
        const serviceData = res.data?.service || res.data?.data?.service || res.data?.data || res.data;
        if (!cancelled) {
          setService(serviceData || null);
        }
      } catch (err) {
        if (!cancelled) {
          const status = err.response?.status;
          setError(status === 404 ? null : err.response?.data?.error || 'Gagal memuat detail layanan.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchDetail();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorState message={error} />;
  if (!service) return <NotFoundState />;

  const benefitList = formatList(service.benefit);
  const outputList = formatList(service.output);

  // Tabel portfolio & sub portfolio
  const hasPortfolio = Boolean(service.portfolio);

  // Mapping dan penggabungan sektor dengan sub sektor untuk tabel
  const buildSectorRows = () => {
    if (!service.sectors || service.sectors.length === 0) return [];
    const rows = [];
    service.sectors.forEach(sector => {
      const sectorId = typeof sector === 'object' ? sector.id : null;
      const sectorName = typeof sector === 'string' ? sector : sector.name;
      const sectorCode = typeof sector === 'object' ? sector.code : '';
      const displaySector = sectorCode ? `${sectorCode} - ${sectorName}` : sectorName;

      const relatedSubs = service.sub_sectors?.filter(sub => {
        const subParentId = typeof sub === 'object' ? sub.sector_id : null;
        return subParentId === sectorId;
      }) || [];

      if (relatedSubs.length > 0) {
        relatedSubs.forEach(sub => {
          const subName = typeof sub === 'string' ? sub : sub.name;
          const subCode = typeof sub === 'object' ? sub.code : '';
          const displaySub = subCode ? `${subCode} - ${subName}` : subName;
          rows.push({ sector: displaySector, subSector: displaySub });
        });
      } else {
        rows.push({ sector: displaySector, subSector: '-' });
      }
    });
    return rows;
  };

  const sectorRows = buildSectorRows();

  const embedUrl = getYoutubeEmbedUrl(service.intro_video_url);

  return (
    <>
      <Helmet>
        <title>{service.name} | SAKTI Platform</title>
        <meta name="description" content={`Detail layanan ${service.name}`} />
      </Helmet>

      <div className="bg-gray-50 min-h-screen">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          {/* Navigation bar (kembali + edit) */}
          <motion.div
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="flex justify-between items-center mb-3">
              <Link to="/daftar-jasa">
                <Button variant="outline" className="shadow-sm">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Daftar Jasa
                </Button>
              </Link>
              <Link to={`/edit-jasa/${id}`}>
                <Button className="bg-[#000476] hover:bg-indigo-900 text-white shadow-sm">
                  <Edit className="w-4 h-4 mr-2" /> Edit Layanan
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Hero */}
          <div className="mt-6">
            <HeroCard name={service.name} />
          </div>

          {/* Konten utama: 2 kolom */}
          <div className="mt-6 grid lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Kolom kiri (2/3) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Informasi Dasar */}
              <InfoCard icon={<Info className="w-5 h-5 text-indigo-600" />} title="Informasi Dasar">
                <div className="space-y-3">
                  <div className="grid grid-cols-[120px,1fr] items-start">
                    <span className="font-medium text-gray-500">Unit Pemilik:</span>
                    <span className="text-gray-800">{service.sbu_owner?.name || '-'}</span>
                  </div>
                  <div className="grid grid-cols-[120px,1fr] items-start">
                    <span className="font-medium text-gray-500">Group Layanan:</span>
                    <span className="text-gray-800">{service.group || '-'}</span>
                  </div>
                  <div className="grid grid-cols-[120px,1fr] items-start">
                    <span className="font-medium text-gray-500">Kode Layanan:</span>
                    <span className="font-mono text-gray-800">{service.code || '-'}</span>
                  </div>
                  <div className="grid grid-cols-[120px,1fr] items-start">
                    <span className="font-medium text-gray-500">Deskripsi:</span>
                    <span className="text-gray-700">{service.overview || '-'}</span>
                  </div>
                </div>
              </InfoCard>

              {/* Portfolio & Sub Portfolio */}
              <InfoCard icon={<Package className="w-5 h-5 text-indigo-600" />} title="Portfolio & Sub Portfolio">
                <div className="border rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr className="text-left text-gray-600 text-xs uppercase tracking-wide">
                        <th className="py-2 px-4">Portfolio</th>
                        <th className="py-2 px-4">Sub Portfolio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hasPortfolio ? (
                        <tr className="border-t">
                          <td className="py-2 px-4 text-gray-800">{service.portfolio.name}</td>
                          <td className="py-2 px-4 text-gray-600">{service.sub_portfolio?.name || '-'}</td>
                        </tr>
                      ) : (
                        <tr className="border-t">
                          <td colSpan="2" className="py-4 text-center text-gray-400">Tidak ada data</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </InfoCard>

              {/* Sektor & Sub Sektor */}
              <InfoCard icon={<Globe className="w-5 h-5 text-indigo-600" />} title="Sektor & Sub Sektor">
                {sectorRows.length > 0 ? (
                  <div className="border rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr className="text-left text-gray-600 text-xs uppercase tracking-wide">
                          <th className="py-2 px-4">Sektor</th>
                          <th className="py-2 px-4">Sub Sektor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sectorRows.map((row, idx) => (
                          <tr key={idx} className="border-t">
                            <td className="py-2 px-4 text-gray-800">{row.sector}</td>
                            <td className="py-2 px-4 text-gray-600">{row.subSector}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm italic">Tidak ada sektor/sub sektor yang tercatat</p>
                )}
              </InfoCard>

              {/* Manfaat Layanan */}
              <InfoCard icon={<Star className="w-5 h-5 text-amber-500" />} title="Manfaat Layanan">
                {benefitList.length > 0 ? (
                  <div className="space-y-2">
                    {benefitList.map((item, i) => (
                      <div key={i} className="flex gap-2 items-start">
                        <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm italic">Tidak ada manfaat yang tercatat</p>
                )}
              </InfoCard>

              {/* Output Layanan */}
              <InfoCard icon={<FileText className="w-5 h-5 text-indigo-600" />} title="Output Layanan">
                {outputList.length > 0 ? (
                  <div className="space-y-2">
                    {outputList.map((item, i) => (
                      <div key={i} className="flex gap-2 items-start">
                        <div className="w-4 h-4 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-[10px] font-bold text-indigo-700">{i + 1}</span>
                        </div>
                        <span className="text-gray-700 text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm italic">Tidak ada output yang tercatat</p>
                )}
              </InfoCard>

              {/* Ruang Lingkup */}
              <InfoCard icon={<LayoutDashboard className="w-5 h-5 text-indigo-600" />} title="Ruang Lingkup">
                {service.scope ? (
                  <StructuredContent text={service.scope} />
                ) : (
                  <p className="text-gray-500 text-sm italic">Tidak ada ruang lingkup yang tercatat</p>
                )}
              </InfoCard>
            </div>

            {/* Kolom kanan (sidebar) */}
            <aside className="space-y-6 lg:sticky lg:top-6 self-start">
              {/* Video Pengantar */}
              <InfoCard icon={<Video className="w-5 h-5 text-red-600" />} title="Video Pengantar">
                {service.intro_video_url ? (
                  embedUrl ? (
                    <div className="aspect-video rounded-xl overflow-hidden shadow-md">
                      <iframe
                        src={embedUrl}
                        title="Intro Video"
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <a href={service.intro_video_url} target="_blank" rel="noopener noreferrer" className="block">
                      <Button className="w-full bg-red-600 hover:bg-red-700 text-white">
                        <Youtube className="w-4 h-4 mr-2" /> Tonton Video di YouTube
                      </Button>
                    </a>
                  )
                ) : (
                  <p className="text-gray-500 text-sm italic">Tidak ada video pengantar</p>
                )}
              </InfoCard>

              {/* Pelanggan Jasa (Revenue) */}
              <InfoCard icon={<Building className="w-5 h-5 text-green-600" />} title="Pelanggan Jasa">
                {service.revenues?.length > 0 ? (
                  <div className="overflow-hidden rounded-xl border border-gray-200">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr className="text-left text-gray-600 text-xs uppercase tracking-wide">
                          <th className="py-2.5 px-4">Unit</th>
                          <th className="py-2.5 px-4">Pelanggan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {service.revenues.map(rev => (
                          <tr key={rev.id} className="border-t hover:bg-gray-50/60 transition-colors">
                            <td className="py-2.5 px-4 text-gray-600">{rev.unit?.name || '-'}</td>
                            <td className="py-2.5 px-4 font-medium text-gray-900">{rev.customer_name}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm italic">Belum ada pelanggan yang tercatat</p>
                )}
              </InfoCard>

              {/* Marketing Kit */}
              <InfoCard icon={<Download className="w-5 h-5 text-indigo-600" />} title="Marketing Kit">
                {service.marketing_kits?.length > 0 ? (
                  <div className="space-y-2">
                    {service.marketing_kits.map(file => (
                      <div key={file.id} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-gray-100 bg-white hover:shadow-sm transition-all">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-800 truncate text-sm">{file.name}</p>
                          <p className="text-xs text-gray-400">{file.file_type}</p>
                        </div>
                        <Button size="sm" onClick={() => handleDownloadClick(file)} className="bg-[#000476] hover:bg-indigo-900 text-white rounded-full px-3">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm italic">Belum ada marketing kit yang tersedia</p>
                )}
              </InfoCard>
            </aside>
          </div>

          {/* Regulasi Terkait (lebar penuh) */}
          <div className="mt-6">
            <InfoCard icon={<ScrollText className="w-5 h-5 text-indigo-600" />} title="Regulasi Terkait">
              {service.regulation_ref ? (
                <blockquote className="border-l-4 border-indigo-300 pl-4 py-1 text-gray-700 text-sm italic">
                  {service.regulation_ref}
                </blockquote>
              ) : (
                <p className="text-gray-500 text-sm italic">Tidak ada regulasi terkait yang tercatat</p>
              )}
            </InfoCard>
          </div>
        </div>
      </div>

      {/* Modal Download */}
      {showDownloadForm && (
        <DownloadFormModal
          file={selectedFile}
          onClose={() => {
            setShowDownloadForm(false);
            setSelectedFile(null);
          }}
        />
      )}
    </>
  );
}
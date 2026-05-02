import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Download, Building, Youtube, Star, BarChart,
  ExternalLink, ScrollText, FolderKanban, LayoutDashboard, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import DownloadFormModal from '@/components/DownloadFormModal.jsx';
import { useAuth } from '@/contexts/AuthContext.jsx';

const DetailCard = ({ icon, title, children, delay }) => (
  <motion.section
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    className="w-full"
  >
    <Card className="border border-gray-200/70 shadow-sm hover:shadow-md rounded-2xl transition duration-300 h-full">
      <CardHeader className="pb-1">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-[#000476]">
          {icon}
          <span>{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2">{children}</CardContent>
    </Card>
  </motion.section>
);

export default function DetailService() {
  const { id } = useParams();
  const { authToken } = useAuth();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDownloadForm, setShowDownloadForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleDownloadClick = (file) => {
    setSelectedFile(file);
    setShowDownloadForm(true);
  };

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/services/${id}`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        if (!res.ok) throw new Error('Gagal mengambil detail layanan');
        const data = await res.json();
        setService(data.service);
      } catch (err) {
        console.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (authToken) fetchDetail();
  }, [id, authToken]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="animate-pulse space-y-6">
          <div className="h-40 rounded-3xl bg-gradient-to-r from-indigo-100 to-blue-100" />
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-40 bg-white rounded-2xl border" />
              <div className="h-40 bg-white rounded-2xl border" />
            </div>
            <div className="space-y-6">
              <div className="h-32 bg-white rounded-2xl border" />
              <div className="h-48 bg-white rounded-2xl border" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Layanan Tidak Ditemukan</h2>
        <p className="text-gray-600 mb-6">Periksa kembali tautan atau pilih layanan lain.</p>
        <Link to="/daftar-jasa">
          <Button className="bg-[#000476] hover:bg-indigo-900 text-white">Kembali ke Daftar Jasa</Button>
        </Link>
      </div>
    );
  }

  const benefitList = service.benefit?.trim() ? service.benefit.split('\n') : [];
  const outputList = service.output?.trim() ? service.output.split('\n') : [];

  return (
    <>
      <Helmet>
        <title>{service.name} | SAKTI Platform</title>
        <meta name="description" content={`Informasi detail layanan ${service.name}`} />
      </Helmet>

      <div className="bg-gray-50 min-h-screen">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          {/* Back */}
          <motion.div initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }}>
            <Link to="/daftar-jasa">
              <Button variant="outline" className="mb-3">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali ke Daftar Jasa
              </Button>
            </Link>
          </motion.div>

          {/* Hero */}
          <motion.header
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="relative overflow-hidden rounded-3xl p-6 sm:p-8 text-white shadow"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#000476] to-indigo-800" />
            <div className="absolute inset-0 bg-[radial-gradient(800px_circle_at_20%_-10%,rgba(255,255,255,0.14),transparent)]" />
            <div className="relative">
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div className="flex-1 min-w-[260px]">
                  <div className="flex items-center flex-wrap gap-2 mb-3">
                    {service.group && (
                      <Badge variant="secondary" className="bg-white/15 text-white border-white/20">
                        {service.group}
                      </Badge>
                    )}
                    {service.code && (
                      <span className="bg-white/15 px-3 py-1 rounded text-xs font-mono tracking-wide">
                        {service.code}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 bg-white/10 rounded-full px-3 py-1 text-xs">
                      <Sparkles className="w-3.5 h-3.5" /> Layanan SAKTI
                    </span>
                  </div>

                  <h1 className="text-3xl sm:text-4xl font-bold leading-tight">{service.name}</h1>
                  {service.overview && (
                    <p className="text-blue-100/90 text-base sm:text-lg leading-relaxed mt-2">
                      {service.overview}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-x-6 gap-y-3 mt-4 text-sm text-blue-100">
                    {service.sbu_owner?.name && (
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4" />
                        <span>{service.sbu_owner.name}</span>
                      </div>
                    )}
                    {service.portfolio?.name && (
                      <div className="flex items-center gap-2">
                        <BarChart className="w-4 h-4" />
                        <span>{service.portfolio.name}</span>
                      </div>
                    )}
                    {service.sub_portfolio?.name && (
                      <div className="flex items-center gap-2">
                        <BarChart className="w-4 h-4" />
                        <span>
                          {service.sub_portfolio.name} ({service.sub_portfolio.code})
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.header>

          {/* Body */}
          <div className="grid lg:grid-cols-3 gap-6 lg:gap-8 mt-6">
            {/* Main */}
            <div className="lg:col-span-2 space-y-6">
            {benefitList.length > 0 && (
              <DetailCard icon={<Star className="w-5 h-5 text-indigo-500" />} title="Manfaat Layanan" delay={0.1}>
                <div className="space-y-2 text-gray-800">
                  {benefitList.map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-50 text-[#000476] font-semibold text-sm flex-shrink-0">
                        {i + 1}
                      </div>
                      <p className="leading-relaxed flex-1">{item.trim()}</p>
                    </div>
                  ))}
                </div>
              </DetailCard>
            )}

              {outputList.length > 0 && (
                <DetailCard icon={<BarChart className="w-5 h-5 text-indigo-600" />} title="Output Layanan" delay={0.1}>
                  <div className="space-y-2 text-gray-800">
                    {outputList.map((item, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-[#000476] font-bold text-xs flex-shrink-0">
                          <span className="w-1.5 h-1.5 bg-[#000476] rounded-full" />
                        </div>
                        <p className="leading-relaxed flex-1">{item.trim()}</p>
                      </div>
                    ))}
                  </div>
                </DetailCard>
              )}

              {service.scope && (
                <DetailCard icon={<LayoutDashboard className="w-5 h-5 text-indigo-600" />} title="Ruang Lingkup" delay={0.15}>
                  <p className="text-gray-800 leading-relaxed whitespace-pre-line">{service.scope}</p>
                </DetailCard>
              )}

              {service.sectors?.length > 0 && (
                <DetailCard icon={<FolderKanban className="w-5 h-5 text-indigo-600" />} title="Sektor Terkait" delay={0.2}>
                  <div className="flex flex-wrap gap-2">
                    {service.sectors.map((s) => (
                      <span
                        key={s.id}
                        className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-indigo-700 text-sm"
                      >
                        {s.name} <span className="text-indigo-500/70">({s.code})</span>
                      </span>
                    ))}
                  </div>
                </DetailCard>
              )}

              {service.sub_sectors?.length > 0 && (
                <DetailCard icon={<FolderKanban className="w-5 h-5 text-indigo-600" />} title="Sub Sektor Terkait" delay={0.25}>
                  <div className="flex flex-wrap gap-2">
                    {service.sub_sectors.map((s) => (
                      <span
                        key={s.id}
                        className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-gray-700 text-sm"
                      >
                        {s.name} <span className="text-gray-500/70">({s.code})</span>
                      </span>
                    ))}
                  </div>
                </DetailCard>
              )}
            </div>

            {/* Sidebar */}
            <aside className="space-y-6 lg:sticky lg:top-6 self-start">
              {service.intro_video_url && (
                <DetailCard icon={<Youtube className="w-5 h-5 text-red-600" />} title="Introduction Module" delay={0.05}>
                  <a href={service.intro_video_url} target="_blank" rel="noopener noreferrer">
                    <Button className="w-full bg-red-600 hover:bg-red-700 text-white">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Tonton Video Modul
                    </Button>
                  </a>
                </DetailCard>
              )}

              {service.regulation_ref && (
                <DetailCard icon={<ScrollText className="w-5 h-5 text-indigo-600" />} title="Regulasi Terkait" delay={0.1}>
                  <div className="prose prose-sm max-w-none text-gray-800">
                    <p className="whitespace-pre-line">{service.regulation_ref}</p>
                  </div>
                </DetailCard>
              )}

              {service.revenues?.length > 0 && (
                <DetailCard icon={<BarChart className="w-5 h-5 text-green-600" />} title="Pelanggan Jasa" delay={0.15}>
                  <div className="overflow-hidden rounded-xl border border-gray-200">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr className="text-left text-gray-600">
                          <th className="py-2.5 px-4">Unit</th>
                          <th className="py-2.5 px-4">Pelanggan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {service.revenues.map((rev) => (
                          <tr key={rev.id} className="border-t hover:bg-gray-50/60">
                            <td className="py-2.5 px-4">{rev.unit?.name || '-'}</td>
                            <td className="py-2.5 px-4">{rev.customer_name}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </DetailCard>
              )}

              {service.marketing_kits?.length > 0 && (
                <DetailCard icon={<Download className="w-5 h-5 text-indigo-600" />} title="Marketing Kit" delay={0.2}>
                  <div className="overflow-hidden rounded-xl border border-gray-200 divide-y">
                    {service.marketing_kits.map((file, i) => (
                      <div key={i} className="flex items-start justify-between gap-4 p-3 sm:p-4 hover:bg-gray-50">
                        <div>
                          <p className="font-medium text-gray-900">{file.name}</p>
                          <p className="text-xs text-gray-500">{file.file_type}</p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleDownloadClick(file)}
                          className="bg-[#000476] hover:bg-indigo-900 text-white"
                          aria-label={`Unduh ${file.name}`}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </DetailCard>
              )}
            </aside>
          </div>
        </div>
      </div>

      {showDownloadForm && (
        <DownloadFormModal file={selectedFile} onClose={() => setShowDownloadForm(false)} />
      )}
    </>
  );
}

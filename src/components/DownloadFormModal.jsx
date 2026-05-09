/**
 * components/DownloadFormModal.jsx
 *
 * Modal form untuk mencatat tujuan download marketing kit sebelum mengunduh.
 * User wajib mengisi alasan/purpose sebelum file dapat diunduh.
 *
 * ============================================================
 * FITUR
 * ============================================================
 * - Form dengan validasi input purpose (minimal 5 karakter, maksimal 255)
 * - Menampilkan informasi user yang mengunduh
 * - Animasi masuk/keluar menggunakan Framer Motion
 * - Submit → POST /api/marketing-kits/:id/download → redirect ke signed URL
 *
 * ============================================================
 * STRUKTUR DATA API
 * ============================================================
 * POST /marketing-kits/:id/download
 *   Request body: { purpose: string }
 *   Response: redirect ke signed Cloudinary URL (expire 60 detik)
 *   Atau jika error: response JSON dengan { error: string }
 *
 * ============================================================
 * PROPS
 * ============================================================
 * @param {Object} props
 * @param {Object} props.file - Data marketing kit (harus memiliki id dan name)
 * @param {function} props.onClose - Callback untuk menutup modal
 *
 * ============================================================
 * PANDUAN MAINTENANCE
 * ============================================================
 * - Gunakan HTTP status code constants dari lib/constants jika tersedia.
 * - Validasi purpose juga dilakukan di backend, frontend hanya untuk UX.
 * - Setelah submit sukses, browser diarahkan ke signed URL (window.location.href).
 * - Animasi motion menggunakan spring untuk efek modal yang lebih natural.
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { FileText, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Card, CardContent } from '@/components/ui/card.jsx';
import { useToast } from '@/components/ui/use-toast.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import api from '@/lib/api';
import { HTTP } from '@/lib/constants';

// ============================================================
// Konstanta
// ============================================================

/** Panjang minimal tujuan penggunaan (karakter) */
const MIN_PURPOSE_LENGTH = 5;

/** Panjang maksimal tujuan penggunaan (karakter) */
const MAX_PURPOSE_LENGTH = 255;

/**
 * Pesan error yang akan ditampilkan berdasarkan status HTTP.
 * Memberikan user feedback yang lebih baik daripada error generic.
 */
const ERROR_MESSAGES = {
  [HTTP.UNAUTHORIZED]: 'Sesi Anda telah berakhir. Silakan login kembali.',
  [HTTP.FORBIDDEN]: 'Anda tidak memiliki akses untuk mengunduh file ini.',
  [HTTP.NOT_FOUND]: 'File tidak ditemukan atau sudah dihapus.',
  [HTTP.TOO_MANY_REQUESTS]: 'Terlalu banyak permintaan. Coba lagi dalam beberapa menit.',
};

// ============================================================
// Komponen Utama
// ============================================================

/**
 * DownloadFormModal - Form untuk mengisi tujuan download sebelum mengunduh file.
 * Menampilkan modal dengan input purpose, informasi user, dan tombol submit.
 *
 * @param {Object} props
 * @param {Object} props.file - File yang akan diunduh (memiliki id, name)
 * @param {function} props.onClose - Callback untuk menutup modal
 * @returns {JSX.Element}
 */
function DownloadFormModal({ file, onClose }) {
  const { user } = useAuth();
  const { toast } = useToast();

  // State form
  const [purpose, setPurpose] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState('');

  // ============================================================
  // Handler: Submit form download
  // ============================================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedPurpose = purpose.trim();

    // Validasi client-side
    if (!trimmedPurpose) {
      setError('Tujuan penggunaan wajib diisi.');
      return;
    }
    if (trimmedPurpose.length < MIN_PURPOSE_LENGTH) {
      setError(`Tujuan terlalu singkat. Minimal ${MIN_PURPOSE_LENGTH} karakter.`);
      return;
    }

    setIsDownloading(true);
    try {
      const response = await api.post(`/marketing-kits/${file.id}/download`, {
        purpose: trimmedPurpose,
      });

      // Ekstrak URL download dari response (bisa di data.download_url atau langsung)
      const downloadUrl = response.data?.download_url || response.data?.url;
      if (!downloadUrl) {
        throw new Error('URL download tidak ditemukan dalam respons server.');
      }

      // Redirect browser ke signed URL (navigasi biasa, tidak fetch)
      window.location.href = downloadUrl;

      toast({
        title: 'Download Dimulai',
        description: `"${file.name}" sedang diunduh.`,
      });
      onClose();
    } catch (err) {
      const status = err.response?.status;
      const message = ERROR_MESSAGES[status]
        || err.response?.data?.error
        || err.response?.data?.message
        || err.message
        || 'Gagal memproses permintaan download.';

      setError(message);
      toast({
        title: 'Gagal Mengunduh',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  // ============================================================
  // Render
  // ============================================================
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.93, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.93, opacity: 0, y: 10 }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md"
      >
        <Card className="border-0 shadow-2xl bg-white rounded-2xl overflow-hidden">
          <CardContent className="p-6 space-y-5">
            {/* Header: Icon + Nama File */}
            <div className="flex items-center gap-3 border-b pb-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                <FileText className="w-5 h-5 text-[#000476]" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-[#000476] text-base leading-tight">
                  Unduh File
                </h3>
                <p
                  className="text-xs text-gray-500 truncate mt-0.5"
                  title={file?.name}
                >
                  {file?.name || '—'}
                </p>
              </div>
            </div>

            {/* Informasi User (yang mengunduh) */}
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Diunduh sebagai</Label>
              <p className="text-sm font-medium text-gray-800">
                {user?.full_name || '—'}
                <span className="text-gray-400 font-normal ml-2">
                  ({user?.email || '—'})
                </span>
              </p>
            </div>

            {/* Form Tujuan Penggunaan */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="purpose">
                  Tujuan Penggunaan
                  <span className="text-red-500 ml-0.5">*</span>
                </Label>
                <Input
                  id="purpose"
                  value={purpose}
                  onChange={(e) => {
                    setPurpose(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="Contoh: Presentasi klien, proposal bisnis…"
                  maxLength={MAX_PURPOSE_LENGTH}
                  autoFocus
                  className={`rounded-xl transition-colors ${
                    error
                      ? 'border-red-400 focus:border-red-500'
                      : 'border-gray-300 hover:border-[#000476] focus:border-[#000476]'
                  }`}
                />
                {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
                <p className="text-xs text-gray-400">
                  {purpose.length}/{MAX_PURPOSE_LENGTH} karakter
                </p>
              </div>

              {/* Tombol Aksi */}
              <div className="flex gap-3 pt-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isDownloading}
                  className="flex-1 rounded-xl"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isDownloading || !purpose.trim()}
                  className="flex-1 bg-[#000476] hover:bg-[#1919b3] text-white rounded-xl transition-all"
                >
                  {isDownloading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Memproses…
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Download className="w-4 h-4" />
                      Unduh File
                    </span>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

// ============================================================
// PropTypes (dokumentasi & validasi runtime)
// ============================================================
DownloadFormModal.propTypes = {
  /** Data marketing kit yang akan diunduh (harus memiliki id dan name) */
  file: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string,
  }).isRequired,
  /** Callback untuk menutup modal setelah sukses atau batal */
  onClose: PropTypes.func.isRequired,
};

export default DownloadFormModal;
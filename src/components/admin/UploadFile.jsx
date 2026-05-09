/**
 * components/admin/UploadFile.jsx
 *
 * Komponen untuk mengunggah satu atau lebih file marketing kit sekaligus.
 * Mendukung multiple file upload dengan metadata per file (tipe, nama display),
 * serta kaitan dengan layanan (services) yang dapat dipilih.
 *
 * ============================================================
 * PROPS
 * ============================================================
 * @param {function} onUploadSuccess - Callback setelah upload berhasil (untuk refresh daftar)
 * @param {function} onClose - Callback untuk menutup modal/drawer (opsional)
 *
 * ============================================================
 * STRUKTUR DATA
 * ============================================================
 * POST /api/marketing-kits (multipart/form-data):
 *   - files[]            : file-file yang diunggah
 *   - file_types[]       : tiap file memiliki tipe (Flyer, Brochure, dll)
 *   - names[]            : nama display (opsional, default dari nama file)
 *   - service_ids[]      : array ID layanan yang terkait (opsional)
 *
 * Response:
 * {
 *   success: true,
 *   data: [ { id, name, file_path, ... } ]
 * }
 *
 * ============================================================
 * PANDUAN MAINTENANCE
 * ============================================================
 * - Konstanta konfigurasi (batas file, ukuran, tipe) diambil dari UPLOAD constant.
 * - Daftar layanan diambil dari GET /services dengan limit besar.
 * - Validasi client-side: jumlah file, ukuran file, tipe file ada.
 * - Setiap file dalam daftar memiliki state lokal (file object, fileType, displayName).
 * - Komponen dapat berdiri sendiri atau dipanggil dari modal.
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Upload, Search, Check, FileText, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { UPLOAD, PAGINATION } from '@/lib/constants';

// ============================================================
// Konstanta (dengan fallback jika constants tidak terdefinisi)
// ============================================================

const DEFAULT_MAX_FILES = 10;
const DEFAULT_MAX_SIZE_MB = 10;
const DEFAULT_ACCEPTED_FORMATS = '.pdf,.doc,.docx,.ppt,.pptx';
const DEFAULT_FILE_TYPES = ['Flyer', 'Brochure', 'Pitch Deck', 'Technical Document', 'Others'];

const MAX_FILES = UPLOAD?.MAX_FILES_PER_BATCH || DEFAULT_MAX_FILES;
const MAX_SIZE_MB = UPLOAD?.MAX_FILE_SIZE_MB || DEFAULT_MAX_SIZE_MB;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
const ACCEPT_FORMATS = UPLOAD?.ACCEPTED_FORMATS || DEFAULT_ACCEPTED_FORMATS;
const FILE_TYPE_OPTIONS = UPLOAD?.FILE_TYPES || DEFAULT_FILE_TYPES;

// ============================================================
// Helper Functions
// ============================================================

/**
 * Mendapatkan nama default dari file (tanpa ekstensi).
 * @param {File} file
 * @returns {string}
 */
function getDefaultDisplayName(file) {
  return file.name.replace(/\.[^/.]+$/, '');
}

/**
 * Memeriksa apakah tipe file diizinkan (berdasarkan ekstensi).
 * @param {File} file
 * @returns {boolean}
 */
function isAllowedFileType(file) {
  const ext = '.' + file.name.split('.').pop().toLowerCase();
  return ACCEPT_FORMATS.split(',').includes(ext);
}

/**
 * Memformat ukuran file ke MB.
 * @param {number} bytes
 * @returns {string}
 */
function formatFileSize(bytes) {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ============================================================
// Komponen Utama
// ============================================================

/**
 * UploadFile - Form upload marketing kit dengan dukungan multiple file.
 * @param {Object} props
 * @returns {JSX.Element}
 */
function UploadFile({ onUploadSuccess, onClose }) {
  const { toast } = useToast();

  // State untuk file-file yang akan diupload (masing-masing punya metadata)
  const [uploadFiles, setUploadFiles] = useState([]); // { file, fileType, displayName }
  const [serviceIds, setServiceIds] = useState([]);
  const [services, setServices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  // ============================================================
  // Effect: Fetch daftar layanan untuk dropdown
  // ============================================================
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const limit = PAGINATION?.MAX_LIMIT || 100;
        const res = await api.get('/services', { params: { limit } });
        setServices(res.data.data?.layanan || []);
      } catch (error) {
        console.error('[UploadFile] Failed to fetch services:', error);
        // Tidak menampilkan toast error karena tidak kritis
      }
    };
    fetchServices();
  }, []);

  // ============================================================
  // Handler: Memilih file dari input
  // ============================================================
  const handleFileChange = (e) => {
    const incoming = Array.from(e.target.files);
    const remaining = MAX_FILES - uploadFiles.length;

    if (incoming.length > remaining) {
      toast({
        title: `Maksimal ${MAX_FILES} file per upload`,
        description: `Anda sudah punya ${uploadFiles.length} file. Hanya ${remaining} slot tersisa.`,
        variant: 'destructive',
      });
    }

    const toAdd = incoming.slice(0, remaining);
    const validFiles = [];

    for (const file of toAdd) {
      // Validasi ukuran file
      if (file.size > MAX_SIZE_BYTES) {
        toast({
          title: 'File terlalu besar',
          description: `"${file.name}" melebihi ${MAX_SIZE_MB} MB.`,
          variant: 'destructive',
        });
        continue;
      }
      // Validasi tipe file (berdasarkan ekstensi)
      if (!isAllowedFileType(file)) {
        toast({
          title: 'Tipe file tidak didukung',
          description: `"${file.name}" harus berformat PDF, DOC, DOCX, PPT, atau PPTX.`,
          variant: 'destructive',
        });
        continue;
      }
      validFiles.push({
        file,
        fileType: '',
        displayName: getDefaultDisplayName(file),
      });
    }

    if (validFiles.length > 0) {
      setUploadFiles((prev) => [...prev, ...validFiles]);
    }
    // Reset input value agar bisa memilih file yang sama lagi
    e.target.value = '';
  };

  // ============================================================
  // Handler: Menghapus file dari daftar
  // ============================================================
  const removeFile = (index) => {
    setUploadFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // ============================================================
  // Handler: Mengubah tipe file untuk satu file
  // ============================================================
  const setFileTypeForIndex = (index, value) => {
    setUploadFiles((prev) =>
      prev.map((item, i) => (i === index ? { ...item, fileType: value } : item))
    );
  };

  // ============================================================
  // Handler: Mengubah nama display file
  // ============================================================
  const setDisplayNameForIndex = (index, value) => {
    setUploadFiles((prev) =>
      prev.map((item, i) => (i === index ? { ...item, displayName: value } : item))
    );
  };

  // ============================================================
  // Handler: Toggle pilihan service
  // ============================================================
  const toggleService = (id) => {
    const strId = id.toString();
    setServiceIds((prev) =>
      prev.includes(strId) ? prev.filter((s) => s !== strId) : [...prev, strId]
    );
  };

  // ============================================================
  // Handler: Submit upload ke server
  // ============================================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validasi global
    if (uploadFiles.length === 0) {
      toast({
        title: 'Pilih minimal 1 file',
        variant: 'destructive',
      });
      return;
    }

    const missingType = uploadFiles.some((f) => !f.fileType);
    if (missingType) {
      toast({
        title: 'Tipe file belum dipilih',
        description: 'Pilih tipe untuk setiap file sebelum upload.',
        variant: 'destructive',
      });
      return;
    }

    const formData = new FormData();
    uploadFiles.forEach((item) => {
      formData.append('files', item.file);
      formData.append('file_types[]', item.fileType);
      // Kirim nama display; jika kosong, backend mungkin menggunakan nama file asli
      const name = item.displayName.trim() || getDefaultDisplayName(item.file);
      formData.append('names[]', name);
    });
    serviceIds.forEach((id) => formData.append('service_ids[]', id));

    setLoading(true);
    setUploadedFiles([]);

    try {
      const response = await api.post('/marketing-kits', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast({
        title: 'Upload Berhasil',
        description: `${uploadFiles.length} file berhasil diunggah.`,
      });
      // Simpan hasil upload untuk ditampilkan
      const uploadedData = response.data?.data || [];
      setUploadedFiles(uploadedData);

      // Reset form
      setUploadFiles([]);
      setServiceIds([]);

      // Panggil callback sukses
      if (onUploadSuccess) onUploadSuccess();
      // Tutup modal jika diperlukan
      if (onClose) onClose();
    } catch (err) {
      console.error('[UploadFile] Upload error:', err);
      toast({
        title: 'Upload Gagal',
        description: err.response?.data?.error || err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter layanan untuk popover
  const filteredServices = services.filter((s) => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return true;
    return (
      s.name?.toLowerCase().includes(keyword) ||
      s.code?.toLowerCase().includes(keyword)
    );
  });

  // ============================================================
  // Render
  // ============================================================
  return (
    <Card className="border-0 shadow-xl bg-white rounded-2xl">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Pilih Layanan (optional) */}
          <div>
            <Label className="font-medium text-gray-700 mb-2 block">
              Layanan Terkait{' '}
              <span className="text-gray-400 font-normal ml-1">(opsional)</span>
            </Label>
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  className="w-full min-h-[3.5rem] flex flex-wrap items-center gap-2 text-left rounded-xl border-gray-300 hover:border-[#000476]"
                >
                  {serviceIds.length > 0 ? (
                    serviceIds.map((id) => {
                      const svc = services.find((s) => s.id.toString() === id);
                      if (!svc) return null;
                      return (
                        <span
                          key={svc.id}
                          className="inline-flex items-center bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full text-xs font-medium"
                        >
                          {svc.code || svc.name}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleService(svc.id);
                            }}
                            className="ml-1 text-blue-500 hover:text-blue-800"
                          >
                            <XCircle size={13} />
                          </button>
                        </span>
                      );
                    })
                  ) : (
                    <span className="text-gray-400 text-sm">
                      Pilih layanan terkait…
                    </span>
                  )}
                  <Search className="ml-auto h-4 w-4 opacity-40 shrink-0" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0 shadow-md rounded-xl">
                <Command>
                  <CommandInput
                    placeholder="Cari layanan…"
                    onValueChange={(v) => setSearchTerm(v.toLowerCase())}
                  />
                  <CommandList className="max-h-64 overflow-y-auto">
                    <CommandEmpty>Layanan tidak ditemukan.</CommandEmpty>
                    <CommandGroup>
                      {filteredServices.map((svc) => {
                        const selected = serviceIds.includes(svc.id.toString());
                        return (
                          <CommandItem
                            key={svc.id}
                            value={`${svc.id}-${svc.name}`}
                            onSelect={() => toggleService(svc.id)}
                            className="cursor-pointer"
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                selected ? 'opacity-100' : 'opacity-0'
                              )}
                            />
                            <div className="flex flex-col min-w-0">
                              <span className="font-medium truncate">
                                {svc.name}
                              </span>
                              {svc.code && (
                                <span className="text-xs text-gray-500">
                                  {svc.code}
                                </span>
                              )}
                            </div>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Input File */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="font-medium text-gray-700">
                Pilih File <span className="text-red-500">*</span>
              </Label>
              <span className="text-xs text-gray-500">
                {uploadFiles.length} / {MAX_FILES} file
              </span>
            </div>
            <Input
              id="file-input"
              type="file"
              multiple
              accept={ACCEPT_FORMATS}
              onChange={handleFileChange}
              disabled={uploadFiles.length >= MAX_FILES}
              className="rounded-xl border-gray-300 hover:border-[#000476] transition-colors"
            />
            <p className="text-xs text-gray-500 mt-1">
              Format: PDF, DOC, DOCX, PPT, PPTX · Maks. {MAX_SIZE_MB} MB/file · Maks.{' '}
              {MAX_FILES} file
            </p>

            {/* List file yang siap diupload */}
            {uploadFiles.length > 0 && (
              <div className="mt-4 space-y-3">
                {uploadFiles.map((item, idx) => (
                  <div key={idx} className="border p-3 rounded-xl bg-gray-50">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="text-blue-600 w-5 h-5 shrink-0" />
                      <span className="flex-1 text-sm font-medium truncate">
                        {item.file.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <XCircle size={18} />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Select
                        value={item.fileType}
                        onValueChange={(val) => setFileTypeForIndex(idx, val)}
                      >
                        <SelectTrigger className="w-full rounded-lg">
                          <SelectValue placeholder="Tipe File *" />
                        </SelectTrigger>
                        <SelectContent>
                          {FILE_TYPE_OPTIONS.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        value={item.displayName}
                        onChange={(e) => setDisplayNameForIndex(idx, e.target.value)}
                        placeholder="Nama File (opsional)"
                        className="rounded-lg"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tombol Submit */}
          <div className="flex justify-end pt-4 border-t">
            <Button
              type="submit"
              className="bg-[#000476] hover:bg-[#1919b3] text-white px-6 rounded-xl"
              disabled={loading || uploadFiles.length === 0}
            >
              {loading ? (
                'Mengunggah…'
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload {uploadFiles.length > 0 && `(${uploadFiles.length} file)`}
                </>
              )}
            </Button>
          </div>

          {/* Hasil Upload (dalam kasus modal tidak langsung ditutup) */}
          {uploadedFiles.length > 0 && (
            <div className="p-4 rounded-xl bg-green-50 border border-green-200">
              <p className="text-sm text-green-700 font-medium mb-2">
                {uploadedFiles.length} file berhasil diunggah:
              </p>
              <ul className="space-y-1">
                {uploadedFiles.map((file) => (
                  <li key={file.id} className="text-sm">
                    <a
                      href={file.file_path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-700 underline"
                    >
                      {file.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

// ============================================================
// PropTypes (dokumentasi)
// ============================================================
UploadFile.propTypes = {
  /** Callback saat upload berhasil (biasanya untuk refresh daftar file) */
  onUploadSuccess: PropTypes.func,
  /** Callback untuk menutup modal/drawer setelah upload sukses */
  onClose: PropTypes.func,
};

UploadFile.defaultProps = {
  onUploadSuccess: () => {},
  onClose: () => {},
};

export default UploadFile;
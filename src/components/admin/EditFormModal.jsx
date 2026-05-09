/**
 * components/admin/EditFormModal.jsx
 *
 * Modal dialog untuk mengedit data marketing kit.
 * Mendukung update nama, tipe file, relasi layanan, dan mengganti file.
 *
 * ============================================================
 * PROPS
 * ============================================================
 * @param {boolean} open - Status buka/tutup modal
 * @param {function} onOpenChange - Callback saat modal ditutup
 * @param {object} file - Data marketing kit yang akan diedit
 * @param {array} services - Daftar layanan (opsional) untuk dropdown relasi
 * @param {function} onUpdateSuccess - Callback setelah update berhasil
 *
 * ============================================================
 * STRUKTUR DATA FILE
 * ============================================================
 * {
 *   id: string,
 *   name: string,
 *   file_type: string,
 *   services: [{ id, name, code }]
 * }
 *
 * ============================================================
 * PANDUAN MAINTENANCE
 * ============================================================
 * - Gunakan Dialog dari shadcn/ui untuk aksesibilitas
 * - Popover untuk multi-select layanan dengan pencarian
 * - FormData untuk upload file multipart
 * - Reset form setiap kali file berubah (via useEffect)
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Save, Check, Search, XCircle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
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
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import api from '@/lib/api';

// ============================================================
// Konstanta
// ============================================================

/** Daftar pilihan tipe file untuk dropdown */
const FILE_TYPE_OPTIONS = [
  { value: 'Flyer', label: 'Flyer' },
  { value: 'Pitch Deck', label: 'Pitch Deck' },
  { value: 'Brochure', label: 'Brochure' },
  { value: 'Technical Document', label: 'Technical Document' },
  { value: 'Others', label: 'Others' },
];

/** Pesan error validasi */
const VALIDATION_MESSAGES = {
  NAME_REQUIRED: 'Nama File wajib diisi',
  FILE_TYPE_REQUIRED: 'Tipe File wajib diisi',
};

// ============================================================
// Komponen Utama
// ============================================================

/**
 * EditFormModal - Modal edit marketing kit.
 * Menyediakan form untuk memperbarui metadata dan file kit.
 *
 * @param {Object} props
 * @returns {JSX.Element}
 */
function EditFormModal({ open, onOpenChange, file, services = [], onUpdateSuccess }) {
  const { toast } = useToast();

  // ========== State untuk form ==========
  const [displayName, setDisplayName] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [fileType, setFileType] = useState('');
  const [serviceIds, setServiceIds] = useState([]);
  const [loading, setLoading] = useState(false);

  // ========== State untuk Popover layanan ==========
  const [searchTerm, setSearchTerm] = useState('');
  const [popoverOpen, setPopoverOpen] = useState(false);

  // ============================================================
  // Effect: Inisialisasi form saat file berubah
  // ============================================================
  // Reset form dengan data dari file yang dipilih
  // Juga reset uploadFile karena file baru belum dipilih
  useEffect(() => {
    if (file) {
      setDisplayName(file.name || '');
      setFileType(file.file_type || '');
      // Ambil ID layanan dari relasi services (jika ada)
      setServiceIds((file.services || []).map((s) => s.id.toString()));
      setUploadFile(null); // file baru akan di-upload terpisah
    }
  }, [file]);

  // ============================================================
  // Handler: Submit form update
  // ============================================================
  const handleUpdate = async (e) => {
    e.preventDefault();

    // Validasi
    if (!displayName.trim()) {
      toast({
        title: VALIDATION_MESSAGES.NAME_REQUIRED,
        variant: 'destructive',
      });
      return;
    }
    if (!fileType) {
      toast({
        title: VALIDATION_MESSAGES.FILE_TYPE_REQUIRED,
        variant: 'destructive',
      });
      return;
    }

    // Siapkan FormData untuk upload multipart
    const formData = new FormData();
    formData.append('name', displayName.trim());
    formData.append('file_type', fileType);
    serviceIds.forEach((id) => formData.append('service_ids[]', id));
    if (uploadFile) {
      formData.append('file', uploadFile);
    }

    setLoading(true);
    try {
      await api.put(`/marketing-kits/${file.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast({
        title: 'Berhasil!',
        description: `File berhasil diperbarui.`,
      });
      // Panggil callback untuk refresh data di parent
      onUpdateSuccess?.();
      // Tutup modal
      onOpenChange?.(false);
    } catch (error) {
      toast({
        title: 'Gagal memperbarui',
        description: error.response?.data?.error || error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // Helper: Menambahkan/menghapus service ID dari state
  // ============================================================
  const toggleServiceId = (serviceId) => {
    setServiceIds((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  // ============================================================
  // Helper: Menampilkan chip layanan yang sudah dipilih di Popover trigger
  // ============================================================
  const renderSelectedServices = () => {
    if (serviceIds.length === 0) {
      return <span className="text-gray-400 text-sm">Pilih layanan terkait...</span>;
    }
    return serviceIds.map((id) => {
      const service = services.find((s) => s.id.toString() === id);
      if (!service) return null;
      return (
        <span
          key={service.id}
          className="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs"
        >
          {service.code}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleServiceId(id);
            }}
            className="ml-1 text-blue-600 hover:text-blue-800"
            aria-label="Hapus layanan"
          >
            <XCircle size={14} />
          </button>
        </span>
      );
    });
  };

  // ============================================================
  // Render
  // ============================================================
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] rounded-2xl shadow-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#000476]">
            <Save className="w-5 h-5" />
            Edit File Marketing Kit
          </DialogTitle>
          <DialogDescription>
            Ubah informasi file marketing kit atau unggah versi baru.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleUpdate} className="space-y-6 mt-4">
          {/* Nama File */}
          <div>
            <Label className="font-medium text-gray-700 mb-2 block">
              Nama File <span className="text-red-500">*</span>
            </Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Nama file"
              className="rounded-xl"
            />
          </div>

          {/* Layanan Terkait (Multi-select dengan Popover) */}
          <div>
            <Label className="font-medium text-gray-700 mb-2 block">
              Layanan Terkait
            </Label>
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full min-h-[3rem] flex flex-wrap items-center gap-2 text-left rounded-xl"
                >
                  {renderSelectedServices()}
                  <Search className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0 shadow-md rounded-xl">
                <Command>
                  <CommandInput
                    placeholder="Cari layanan..."
                    onValueChange={(v) => setSearchTerm(v.toLowerCase())}
                  />
                  <CommandList className="max-h-64 overflow-y-auto">
                    <CommandEmpty>Layanan tidak ditemukan.</CommandEmpty>
                    <CommandGroup>
                      {services
                        .filter(
                          (s) =>
                            !searchTerm ||
                            s.name?.toLowerCase().includes(searchTerm) ||
                            s.code?.toLowerCase().includes(searchTerm)
                        )
                        .map((service) => {
                          const isSelected = serviceIds.includes(
                            service.id.toString()
                          );
                          return (
                            <CommandItem
                              key={service.id}
                              onSelect={() => toggleServiceId(service.id.toString())}
                            >
                              <Check
                                className={cn(
                                  'mr-2 h-4 w-4',
                                  isSelected ? 'opacity-100' : 'opacity-0'
                                )}
                              />
                              <div className="flex flex-col">
                                <span className="font-medium">{service.name}</span>
                                <span className="text-xs text-gray-500">
                                  {service.code}
                                </span>
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

          {/* Tipe File (Select dropdown) */}
          <div>
            <Label className="font-medium text-gray-700 mb-2 block">
              Tipe File <span className="text-red-500">*</span>
            </Label>
            <Select value={fileType} onValueChange={setFileType}>
              <SelectTrigger className="w-full rounded-xl">
                <SelectValue placeholder="Pilih tipe file" />
              </SelectTrigger>
              <SelectContent>
                {FILE_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Ganti File (Opsional) */}
          <div>
            <Label className="font-medium text-gray-700 mb-2 block">
              Ganti File (Opsional)
            </Label>
            <Input
              type="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx"
              onChange={(e) => setUploadFile(e.target.files[0])}
              className="rounded-xl"
            />
            {uploadFile && (
              <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                <FileText className="w-4 h-4" />
                {uploadFile.name}
              </div>
            )}
          </div>

          {/* Tombol Submit */}
          <div className="flex justify-end pt-4 border-t">
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#000476] hover:bg-[#1919b3] text-white px-6 py-2 rounded-xl"
            >
              {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// PropTypes (untuk dokumentasi dan validasi runtime)
// ============================================================
EditFormModal.propTypes = {
  /** Status buka modal (controlled) */
  open: PropTypes.bool.isRequired,
  /** Callback saat modal berubah status */
  onOpenChange: PropTypes.func.isRequired,
  /** Data marketing kit yang diedit */
  file: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string,
    file_type: PropTypes.string,
    services: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string,
        code: PropTypes.string,
      })
    ),
  }),
  /** Daftar semua layanan (untuk dropdown) */
  services: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string,
      code: PropTypes.string,
    })
  ),
  /** Callback setelah update berhasil (biasanya untuk refresh data) */
  onUpdateSuccess: PropTypes.func,
};

EditFormModal.defaultProps = {
  services: [],
  onUpdateSuccess: () => {},
};

export default EditFormModal;
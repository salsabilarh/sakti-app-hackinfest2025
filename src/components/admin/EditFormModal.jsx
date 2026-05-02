import React, { useState, useEffect } from 'react';
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
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverTrigger,
  PopoverContent
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

function EditFormModal({ open, onOpenChange, file, services = [], authToken, onUpdateSuccess }) {
  const { toast } = useToast();

  const [uploadFile, setUploadFile] = useState(null);
  const [fileType, setFileType] = useState('');
  const [serviceIds, setServiceIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);

  useEffect(() => {
    if (file) {
      setFileType(file.file_type || '');
      setServiceIds((file.services || []).map(s => s.id.toString()));
      setUploadFile(null);
    }
  }, [file]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!fileType) {
      toast({ title: 'Tipe File wajib diisi', variant: 'destructive' });
      return;
    }

    const formData = new FormData();
    formData.append('file_type', fileType);
    serviceIds.forEach(id => formData.append('service_ids[]', id));
    if (uploadFile) formData.append('file', uploadFile);

    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3000/api/marketing-kits/${file.id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${authToken}` },
        body: formData,
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Gagal memperbarui file.');

      toast({
        title: 'Berhasil!',
        description: `File ${file.name} berhasil diperbarui.`,
      });

      onUpdateSuccess?.();
    } catch (error) {
      toast({
        title: 'Gagal memperbarui',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

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
          {/* === Layanan terkait === */}
          <div>
            <Label className="font-medium text-gray-700 mb-2 block">Layanan Terkait</Label>
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full min-h-[3rem] flex flex-wrap items-center gap-2 text-left rounded-xl border-gray-300 hover:border-[#000476] transition-all"
                >
                  {serviceIds.length > 0 ? (
                    serviceIds.map((id) => {
                      const service = services.find((s) => s.id.toString() === id.toString());
                      if (!service) return null;
                      return (
                        <span
                          key={service.id}
                          className="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium shadow-sm"
                        >
                          {service.code}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setServiceIds(prev => prev.filter(sid => sid !== id.toString()));
                            }}
                            className="ml-1 text-blue-600 hover:text-blue-900"
                          >
                            <XCircle size={14} />
                          </button>
                        </span>
                      );
                    })
                  ) : (
                    <span className="text-gray-400 text-sm">Pilih layanan terkait...</span>
                  )}
                  <Search className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="min-w-full max-w-sm p-0 shadow-md rounded-xl">
                <Command>
                  <CommandInput
                    placeholder="Cari layanan..."
                    onValueChange={(value) => setSearchTerm(value.toLowerCase())}
                    className="focus:ring-0 focus:border-none"
                  />
                  <CommandList className="max-h-64 overflow-y-auto">
                    <CommandEmpty>Layanan tidak ditemukan.</CommandEmpty>
                    <CommandGroup>
                      {services
                        .filter((s) => {
                          const keyword = searchTerm.trim().toLowerCase();
                          if (!keyword) return true;
                          return (
                            s.name?.toLowerCase().includes(keyword) ||
                            s.code?.toLowerCase().includes(keyword)
                          );
                        })
                        .map((service) => {
                          const isSelected = serviceIds.includes(service.id.toString());
                          return (
                            <CommandItem
                              key={service.id}
                              onSelect={() => {
                                setServiceIds((prev) =>
                                  isSelected
                                    ? prev.filter((id) => id !== service.id.toString())
                                    : [...prev, service.id.toString()]
                                );
                              }}
                              className="cursor-pointer"
                            >
                              <Check className={cn('mr-2 h-4 w-4', isSelected ? 'opacity-100' : 'opacity-0')} />
                              <div className="flex flex-col">
                                <span className="font-medium">{service.name}</span>
                                <span className="text-xs text-gray-500">{service.code}</span>
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

          {/* === Pilih Tipe File === */}
          <div>
            <Label className="font-medium text-gray-700 mb-2 block">Tipe File</Label>
            <Select value={fileType} onValueChange={setFileType}>
              <SelectTrigger className="w-full rounded-xl border-gray-300 hover:border-[#000476]">
                <SelectValue placeholder="Pilih tipe file" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Flyer">Flyer</SelectItem>
                <SelectItem value="Pitch Deck">Pitch Deck</SelectItem>
                <SelectItem value="Brochure">Brochure</SelectItem>
                <SelectItem value="Technical Document">Technical Document</SelectItem>
                <SelectItem value="Others">Others</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* === Ganti File (opsional) === */}
          <div>
            <Label className="font-medium text-gray-700 mb-2 block">Ganti File (Opsional)</Label>
            <Input
              type="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx"
              onChange={(e) => setUploadFile(e.target.files[0])}
              className="rounded-xl border-gray-300 hover:border-[#000476]"
            />
            {uploadFile && (
              <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>{uploadFile.name}</span>
              </div>
            )}
          </div>

          {/* === Tombol Simpan === */}
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

export default EditFormModal;

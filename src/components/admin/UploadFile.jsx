import React, { useState, useEffect } from 'react';
import { Upload, Search, Check, FileText, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

function UploadFile({ onUploadSuccess, onClose }) {
  const [uploadFiles, setUploadFiles] = useState([]);
  const [serviceIds, setServiceIds] = useState([]);
  const [open, setOpen] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { authToken } = useAuth();
  const [services, setServices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/services?limit=9999', {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        const data = await res.json();
        setServices(data.services || []);
      } catch (err) {
        console.error('Failed to load services:', err);
      }
    };
    if (authToken) fetchServices();
  }, [authToken]);

  const handleFileUpload = async (e) => {
    e.preventDefault();
    setUploadedFiles([]);

    if (uploadFiles.length === 0) {
      toast({ title: "Form tidak lengkap", description: "Minimal pilih 1 file", variant: "destructive" });
      return;
    }

    const formData = new FormData();
    uploadFiles.forEach(item => {
      formData.append("files", item.file);
      formData.append("file_types[]", item.fileType);
    });
    serviceIds.forEach(id => formData.append("service_ids[]", id));

    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/marketing-kits', {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || result.message || "Gagal mengunggah file");

      toast({
        title: 'Berhasil!',
        description: `${uploadFiles.length} file telah diunggah ke sistem.`,
      });

      setUploadedFiles(result.marketing_kits || []);
      setUploadFiles([]);
      setServiceIds([]);
      e.target.reset?.();
      onUploadSuccess?.();
      onClose?.();
    } catch (error) {
      toast({
        title: 'Upload Gagal',
        description: error.message || "Terjadi kesalahan saat upload",
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-md rounded-2xl">
      <CardContent className="p-6 space-y-8">
        <form onSubmit={handleFileUpload} className="space-y-6">
          {/* === Layanan terkait === */}
          <div>
            <Label className="font-medium text-gray-700 mb-2 block">Layanan Terkait</Label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full min-h-[4rem] flex flex-wrap items-center gap-2 text-left rounded-xl border-gray-300 hover:border-[#000476] transition-all"
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
                              setServiceIds((prev) =>
                                prev.filter((serviceId) => serviceId !== service.id.toString())
                              );
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
                        .filter((service) => {
                          const keyword = searchTerm.trim().toLowerCase();
                          if (!keyword) return true;
                          const nameMatch = service.name?.toLowerCase().includes(keyword);
                          const codeMatch = service.code?.toLowerCase().includes(keyword);
                          return nameMatch || codeMatch;
                        })
                        .map((service) => {
                          const isSelected = serviceIds.includes(service.id.toString());
                          return (
                            <CommandItem
                              key={service.id}
                              value={`${service.id}-${service.name}`}
                              onSelect={() => {
                                setServiceIds((prev) =>
                                  isSelected
                                    ? prev.filter((id) => id !== service.id.toString())
                                    : [...prev, service.id.toString()]
                                );
                              }}
                              className="cursor-pointer"
                            >
                              <Check className={cn("mr-2 h-4 w-4", isSelected ? "opacity-100" : "opacity-0")} />
                              <div className="flex flex-col">
                                <span className="font-medium">{service.name}</span>
                                {service.code && <span className="text-xs text-gray-500">{service.code}</span>}
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

          {/* === Upload File === */}
          <div>
            <Label className="font-medium text-gray-700 mb-2 block">Pilih File</Label>
            <Input
              id="file"
              type="file"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files);
                const MAX_FILE_SIZE_MB = 10;
                const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
                const validFiles = [];

                files.forEach((f) => {
                  if (f.size > MAX_FILE_SIZE_BYTES) {
                    toast({
                      title: "File terlalu besar",
                      description: `${f.name} melebihi ${MAX_FILE_SIZE_MB} MB`,
                      variant: "destructive",
                    });
                  } else {
                    validFiles.push({ file: f, fileType: "" });
                  }
                });

                if (validFiles.length > 0) setUploadFiles((prev) => [...prev, ...validFiles]);
                e.target.value = "";
              }}
              accept=".pdf,.doc,.docx,.ppt,.pptx"
              className="rounded-xl border-gray-300 hover:border-[#000476] focus:border-[#000476] transition-all"
            />
            <p className="text-sm text-gray-500 mt-1">Format: PDF, DOC, DOCX, PPT, PPTX (maks. 10MB)</p>

            {uploadFiles.length > 0 && (
              <div className="mt-4 space-y-3">
                {uploadFiles.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-4 p-3 border rounded-xl bg-gray-50 hover:bg-gray-100 transition-all"
                  >
                    <FileText className="text-blue-600 w-5 h-5" />
                    <span className="flex-1 text-sm font-medium truncate">{item.file.name}</span>
                    <Select
                      value={item.fileType}
                      onValueChange={(val) => {
                        const copy = [...uploadFiles];
                        copy[idx].fileType = val;
                        setUploadFiles(copy);
                      }}
                    >
                      <SelectTrigger className="w-48 rounded-lg">
                        <SelectValue placeholder="Tipe File" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Flyer">Flyer</SelectItem>
                        <SelectItem value="Pitch Deck">Pitch Deck</SelectItem>
                        <SelectItem value="Brochure">Brochure</SelectItem>
                        <SelectItem value="Technical Document">Technical Document</SelectItem>
                        <SelectItem value="Others">Others</SelectItem>
                      </SelectContent>
                    </Select>
                    <button
                      type="button"
                      onClick={() => setUploadFiles(prev => prev.filter((_, i) => i !== idx))}
                      className="text-red-600 hover:text-red-800 transition-colors"
                    >
                      <XCircle size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* === Submit === */}
          <div className="flex justify-end pt-4 border-t">
            <Button
              type="submit"
              className="bg-[#000476] hover:bg-[#1919b3] text-white px-6 py-2 rounded-xl transition-all"
              disabled={loading}
            >
              {loading ? 'Mengunggah...' : (
                <>
                  Upload File
                </>
              )}
            </Button>
          </div>

          {uploadedFiles.length > 0 && (
            <div className="mt-4 p-3 rounded-xl bg-green-50 border border-green-200">
              <p className="text-sm text-green-700 font-medium mb-2">
                {uploadedFiles.length} file berhasil diunggah:
              </p>
              <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
                {uploadedFiles.map((file) => (
                  <li key={file.id}>
                    <a href={file.file_url} target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-900">
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

export default UploadFile;

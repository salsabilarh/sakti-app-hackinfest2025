import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { useToast } from '@/components/ui/use-toast.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Card, CardContent } from '@/components/ui/card.jsx';
import { FileText } from 'lucide-react';

function DownloadFormModal({ file, onClose }) {
  const { user, authToken } = useAuth();
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    purpose: ''
  });

  const handleDownloadSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.purpose) {
      toast({
        title: "Form tidak lengkap",
        description: "Mohon lengkapi semua field yang diperlukan",
        variant: "destructive"
      });
      return;
    }

    setIsDownloading(true);
    try {
      const response = await fetch(
        `http://localhost:3000/api/marketing-kits/${file.id}/download`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ purpose: formData.purpose }),
        }
      );

      if (!response.ok && response.status !== 302) {
        throw new Error('Gagal memproses permintaan download');
      }

      const redirectUrl = response.url;
      window.open(redirectUrl, '_blank');

      toast({
        title: "Download File",
        description: `File ${file.name} telah berhasil diproses.`,
      });

      onClose();
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Gagal mengunduh",
        description: "Terjadi kesalahan saat mengunduh file",
        variant: "destructive"
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md border-0 shadow-xl bg-white/90 backdrop-blur-md rounded-2xl"
      >
        <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-md rounded-2xl">
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center gap-3 border-b pb-3">
              <FileText className="text-[#000476] w-6 h-6" />
              <h3 className="text-lg font-semibold text-[#000476] tracking-wide flex items-center gap-2">Download File</h3>
            </div>

            <p className="text-sm text-gray-600">
              Mohon lengkapi informasi berikut untuk mengunduh file:{" "}
              <span className="font-medium mt-1 text-[#000476]">
                {file.fileName || file.name}
              </span>
            </p>

            <form onSubmit={handleDownloadSubmit} className="space-y-5">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled
                  className="rounded-xl border-gray-300"
                />
              </div>

              <div>
                <Label htmlFor="purpose">Tujuan Penggunaan</Label>
                <Input
                  id="purpose"
                  value={formData.purpose}
                  onChange={(e) =>
                    setFormData({ ...formData, purpose: e.target.value })
                  }
                  placeholder="Contoh: Presentasi klien, proposal bisnis, dll."
                  required
                  className="rounded-xl border-gray-300 hover:border-[#000476] focus:border-[#000476] transition-all"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 rounded-xl"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-[#000476] hover:bg-[#1919b3] text-white rounded-xl transition-all"
                  disabled={isDownloading}
                >
                  {isDownloading ? 'Memproses...' : 'Download'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

export default DownloadFormModal;

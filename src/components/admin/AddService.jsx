/**
 * components/AddService.jsx
 *
 * Komponen form untuk menambah layanan baru.
 * Menyediakan input untuk informasi dasar layanan, portfolio, sektor, manfaat, ruang lingkup, dll.
 *
 * ============================================================
 * FITUR UTAMA
 * ============================================================
 * - Form dengan field: Nama Layanan, Kode Layanan, Portfolio, Sub-Portfolio,
 *   SBU Owner, Sektor Pelanggan, Kode Sektor, Kode Sub-Sektor, Link Modul LinkedIn,
 *   Manfaat Jasa, Ruang Lingkup, Output
 * - Validasi sederhana (nama dan kode wajib diisi)
 * - Menampilkan toast notifikasi setelah submit
 * - Reset form setelah berhasil menambah (opsional)
 *
 * ============================================================
 * CATATAN PENTING
 * ============================================================
 * - Saat ini komponen ini tidak terintegrasi dengan API backend.
 *   Data hanya dicetak ke console dan ditampilkan toast sukses.
 * - Field yang digunakan belum sepenuhnya sesuai dengan API service creation.
 * - Untuk integrasi, perlu disesuaikan dengan endpoint POST /services
 *   dan struktur payload yang diharapkan backend (lihat serviceController.js)
 *
 * ============================================================
 * PANDUAN MAINTENANCE
 * ============================================================
 * - Jika ingin mengintegrasikan dengan API, ganti handleAddService untuk
 *   memanggil api.post('/services', payload) dengan payload yang sesuai.
 * - Pastikan field name dan code dikirim dengan nama yang benar (snake_case)
 *   sesuai dengan yang diharapkan backend: name, code, portfolio_id, dll.
 * - Gunakan constants dari lib/constants.js untuk role dan nilai lainnya.
 * - Pertimbangkan untuk mengambil data portfolio, sub portfolio, dan SBU unit
 *   dari API (GET /portfolios, /units) untuk dropdown dinamis.
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

// ============================================================
// Konstanta & Helper
// ============================================================

/** State awal untuk form service baru */
const INITIAL_SERVICE_STATE = {
  name: '',
  code: '',
  portfolio: '',
  subPortfolio: '',
  sbuOwner: '',
  sectorCode: '',
  subSectorCode: '',
  customerSectorName: '',
  benefits: '',
  scope: '',
  output: '',
  linkedinUrl: '',
};

/**
 * Validasi form service.
 * @param {Object} service - Data service
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateService(service) {
  const errors = [];
  if (!service.name?.trim()) errors.push('Nama Layanan wajib diisi');
  if (!service.code?.trim()) errors.push('Kode Layanan wajib diisi');
  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================
// Komponen Utama
// ============================================================

/**
 * AddService - Form untuk menambahkan layanan baru.
 * @returns {JSX.Element}
 */
function AddService() {
  const { toast } = useToast();
  const [newService, setNewService] = useState(INITIAL_SERVICE_STATE);

  // ============================================================
  // Handler: Perubahan input teks
  // ============================================================
  const handleChange = (e) => {
    const { id, value } = e.target;
    setNewService((prev) => ({ ...prev, [id]: value }));
  };

  // ============================================================
  // Handler: Perubahan select
  // ============================================================
  const handleSelectChange = (id, value) => {
    setNewService((prev) => ({ ...prev, [id]: value }));
  };

  // ============================================================
  // Handler: Submit form
  // ============================================================
  const handleAddService = (e) => {
    e.preventDefault();
    const { valid, errors } = validateService(newService);
    if (!valid) {
      toast({
        title: 'Form tidak lengkap',
        description: errors.join('. '),
        variant: 'destructive',
      });
      return;
    }

    // TODO: Ganti dengan API call yang sebenarnya
    console.log('New Service Data:', newService);

    toast({
      title: 'Layanan Baru Ditambahkan!',
      description: `${newService.name} telah berhasil ditambahkan ke sistem.`,
    });

    // Reset form
    setNewService(INITIAL_SERVICE_STATE);
  };

  // ============================================================
  // Render
  // ============================================================
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle>Tambah Layanan Baru</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAddService} className="space-y-6">
          {/* Baris 1: Informasi Dasar */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <Label htmlFor="name">Nama Layanan</Label>
              <Input
                id="name"
                value={newService.name}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="code">Kode Layanan</Label>
              <Input
                id="code"
                value={newService.code}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="portfolio">Portfolio</Label>
              <Select
                onValueChange={(v) => handleSelectChange('portfolio', v)}
                value={newService.portfolio}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Portfolio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="digital-transformation">
                    Digital Transformation
                  </SelectItem>
                  <SelectItem value="cybersecurity">Cybersecurity</SelectItem>
                  <SelectItem value="mobile-solutions">Mobile Solutions</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="subPortfolio">Sub-Portfolio</Label>
              <Input
                id="subPortfolio"
                value={newService.subPortfolio}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label htmlFor="sbuOwner">SBU Owner (Unit Pemilik)</Label>
              <Select
                onValueChange={(v) => handleSelectChange('sbuOwner', v)}
                value={newService.sbuOwner}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih SBU Owner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sbu-1">SBU 1</SelectItem>
                  <SelectItem value="sbu-2">SBU 2</SelectItem>
                  <SelectItem value="sbu-3">SBU 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="customerSectorName">Nama Sektor Pelanggan</Label>
              <Input
                id="customerSectorName"
                value={newService.customerSectorName}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label htmlFor="sectorCode">Kode Sektor</Label>
              <Input
                id="sectorCode"
                value={newService.sectorCode}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label htmlFor="subSectorCode">Kode Sub-Sektor</Label>
              <Input
                id="subSectorCode"
                value={newService.subSectorCode}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label htmlFor="linkedinUrl">Link Modul LinkedIn</Label>
              <Input
                id="linkedinUrl"
                value={newService.linkedinUrl}
                onChange={handleChange}
                placeholder="https://linkedin.com/learning/..."
              />
            </div>
          </div>

          {/* Baris 2: Deskripsi Textarea */}
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <Label htmlFor="benefits">Manfaat Jasa</Label>
              <Textarea
                id="benefits"
                value={newService.benefits}
                onChange={handleChange}
                rows={5}
              />
            </div>
            <div>
              <Label htmlFor="scope">Ruang Lingkup</Label>
              <Textarea
                id="scope"
                value={newService.scope}
                onChange={handleChange}
                rows={5}
              />
            </div>
            <div>
              <Label htmlFor="output">Output</Label>
              <Textarea
                id="output"
                value={newService.output}
                onChange={handleChange}
                rows={5}
              />
            </div>
          </div>

          {/* Tombol Submit */}
          <Button type="submit" style={{ backgroundColor: '#000476' }}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Layanan
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// PropTypes (dokumentasi opsional)
AddService.propTypes = {
  // Tidak ada props yang diharapkan
};

export default AddService;
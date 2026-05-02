import React, { useState } from 'react'
import { Helmet } from 'react-helmet'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Zap, Mail, ArrowLeft, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card.jsx'
import { useToast } from '@/components/ui/use-toast.js'

function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()

  const validateEmail = (value) => {
    // basic email regex + trims spaces
    const v = String(value).trim()
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!email || !validateEmail(email)) {
      toast({
        title: 'Email tidak valid',
        description: 'Masukkan format email yang benar (contoh: nama@sucofindo.co.id).',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
      const response = await axios.post(
        `${baseUrl}/api/auth/forgot-password`,
        { email: email.trim() },
        { headers: { 'Content-Type': 'application/json' } }
      )

      const isAlreadyPending = response?.data?.already_pending === true

      toast({
        // ✅ Beda judul & deskripsi tergantung status
        title: isAlreadyPending ? 'Permintaan Sedang Diproses' : 'Permintaan Terkirim',
        description:
          response?.data?.message ||
          (isAlreadyPending
            ? 'Permintaan Anda masih dalam antrean admin. Mohon bersabar.'
            : 'Admin akan mengirimkan password baru ke email Anda.'),
        // Bukan error, tapi beda visual untuk pending
        variant: isAlreadyPending ? 'default' : 'default',
      })

      setTimeout(() => navigate('/login'), 2500)
    } catch (error) {
      const errMsg =
        error?.response?.data?.error ||
        'Terjadi kesalahan saat mengirim permintaan. Silakan coba beberapa saat lagi.'
      toast({ title: 'Gagal Mengirim Permintaan', description: errMsg, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Helmet>
        <title>Lupa Password | SAKTI Platform</title>
        <meta name="description" content="Reset your password for SAKTI Platform" />
      </Helmet>

      {/* Background layer to mirror LoginPage tone */}
      <div className="relative min-h-screen w-full overflow-hidden bg-white">
        {/* radial accents */}
        <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[#000476]/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-blue-300/20 blur-3xl" />

        {/* Content */}
        <div className="relative z-10 flex min-h-screen items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            {/* Brand header (aligns with LoginPage) */}
            <div className="mb-4">
              <img src="sakti.png" alt="SAKTI Logo" className="h-20 object-contain" />
              <h1 className="mt-1 text-3xl font-bold text-gray-900">Reset Password</h1>
              <p className="mt-1 text-sm text-gray-600">Masukkan email yang terdaftar untuk diproses oleh admin.</p>
            </div>

            <Card className="border-0 shadow-xl">
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Input
                        id="email"
                        type="email"
                        placeholder="nama@sucofindo.co.id"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="h-11 pl-10"
                        aria-invalid={email && !validateEmail(email) ? 'true' : 'false'}
                      />
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    </div>
                    {email && !validateEmail(email) && (
                      <p className="text-xs text-red-600">Format email tidak valid.</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="h-11 w-full text-white"
                    style={{ backgroundColor: '#000476' }}
                  >
                    {loading ? (
                      <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Mengirim…</span>
                    ) : (
                      'Kirim Permintaan Reset Password'
                    )}
                  </Button>

                  <div className="text-center">
                    <p className="text-xs text-gray-500">Mohon periksa email secara berkala untuk mendapatkan password terbaru</p>
                  </div>
                </form>
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <Link to="/login" className="w-full">
                  <Button variant="outline" className="h-11 w-full border-[#000476] text-[#000476] hover:bg-blue-50">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Login
                  </Button>
                </Link>
                <div className="w-full text-center text-xs text-gray-500">
                  <p>
                    Butuh bantuan? Hubungi <a href="mailto:customer.service@sucofindo.co.id" className="font-medium text-[#000476] hover:underline">customer.service@sucofindo.co.id</a>
                  </p>
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        </div>
      </div>
    </>
  )
}

export default ForgotPasswordPage

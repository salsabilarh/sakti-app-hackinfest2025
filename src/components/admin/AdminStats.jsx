import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Clock, Repeat, KeyRound, Activity, Download } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { toast } from '@/components/ui/use-toast';

function AdminStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/admin/dashboard', {
          headers: { Authorization: `Bearer ${user?.token}` },
        });
        setStats(response.data.stats);
      } catch (error) {
        toast({
          title: 'Gagal memuat statistik',
          description: error.response?.data?.message || 'Terjadi kesalahan saat memuat data dashboard.',
          variant: 'destructive',
        });
      } finally { setLoading(false); }
    };
    fetchStats();
  }, [user?.token]);

  const statsList = stats ? [
    { label: 'Total Users', value: stats.total_users, icon: Users },
    { label: 'Total Pending Users', value: stats.total_waiting_users, icon: Clock },
    { label: 'Pending Unit Change', value: stats.total_pending_unit_change_requests, icon: Repeat },
    { label: 'Password Reset Request', value: stats.total_password_reset_requests, icon: KeyRound },
    { label: 'Active Logged-In Users', value: stats.total_active_users, icon: Activity },
    { label: 'Total Downloads', value: stats.total_downloads, icon: Download },
  ] : [];

  if (loading) return <div className="text-center text-gray-600 font-medium mt-8">Memuat data statistik…</div>;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {statsList.map((stat, i) => (
        <Card key={i} className="border-0 shadow-lg hover:shadow-xl transition-shadow rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-3xl font-bold text-[#000476]">{stat.value}</p>
              </div>
              <stat.icon className="w-8 h-8 text-[#000476]" />
            </div>
          </CardContent>
        </Card>
      ))}
    </motion.div>
  );
}

export default AdminStats;

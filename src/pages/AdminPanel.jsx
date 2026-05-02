import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Users, UserCheck, GitPullRequest, Key, Download, Layers } from 'lucide-react';
import { useAuth, ROLES } from '@/contexts/AuthContext.jsx';
import AdminStats from '@/components/admin/AdminStats.jsx';
import UsersManagement from '@/components/admin/UsersManagement.jsx';
import WaitingUsers from '@/components/admin/WaitingUsers.jsx';
import UnitChangeRequests from '@/components/admin/UnitChangeRequests.jsx';
import PasswordResetRequests from '@/components/admin/PasswordResetRequests.jsx';
import DownloadLogs from '@/components/admin/DownloadLogs.jsx';

const AdminPanel = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('users');

  const TABS = [
    { id: 'users', label: 'Management User', icon: Users, component: UsersManagement },
    { id: 'waiting', label: 'Pending Users', icon: UserCheck, component: WaitingUsers },
    { id: 'unitChange', label: 'Pending Unit Change', icon: GitPullRequest, component: UnitChangeRequests },
    { id: 'resetPassword', label: 'Reset Password Requests', icon: Key, component: PasswordResetRequests },
    { id: 'logs', label: 'Log Download', icon: Download, component: DownloadLogs },
  ];

  if (user?.role !== ROLES.ADMIN) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Akses Ditolak</h2>
        <p className="text-gray-600">Anda tidak memiliki akses ke halaman admin.</p>
      </div>
    );
  }

  const ActiveComponent = TABS.find(t => t.id === activeTab)?.component;

  return (
    <>
      <Helmet>
        <title>Admin Panel | SAKTI Platform</title>
        <meta name="description" content="Administrative dashboard for managing users, services, and download logs" />
      </Helmet>

      {/* HERO */}
      <motion.div
        className="relative overflow-hidden rounded-3xl p-8 sm:p-10 text-white shadow-lg mb-6"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#000476] to-indigo-800" />
        <div className="absolute inset-0 bg-[radial-gradient(900px_circle_at_20%_-10%,rgba(255,255,255,0.15),transparent)]" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2 flex items-center gap-2">
              <Layers className="w-7 h-7 text-white" /> Admin Panel
            </h1>
            <p className="text-blue-100 text-sm sm:text-base">
              Kelola pengguna, persetujuan, dan aktivitas
            </p>
          </div>
        </div>
      </motion.div>

      {/* SEGMENTED TABS */}

      {/* STATS + ACTIVE TAB */}
      <div className="space-y-6 mt-6">
        <AdminStats />
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <div className="bg-gray-100 p-1 rounded-2xl overflow-x-auto flex items-center gap-1">
          {TABS.map(tab => {
            const ActiveIcon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all flex-shrink-0 ${
                  isActive
                    ? 'bg-white text-[#000476] shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                }`}
              >
                <ActiveIcon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </motion.div>
        <motion.div key={activeTab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          {ActiveComponent && <ActiveComponent />}
        </motion.div>
      </div>
    </>
  );
};

export default AdminPanel;

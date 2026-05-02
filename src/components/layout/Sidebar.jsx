import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, Briefcase, FolderDown, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth, ROLES } from '@/contexts/AuthContext';

const navConfig = {
  [ROLES.ADMIN]: ['Dashboard', 'Daftar Layanan', 'Marketing Kit', 'Admin Panel'],
  [ROLES.MANAJEMEN]: ['Dashboard', 'Daftar Layanan', 'Marketing Kit'],
  [ROLES.PDO]: ['Dashboard', 'Daftar Layanan', 'Marketing Kit'],
  [ROLES.VIEWER]: ['Dashboard', 'Daftar Layanan'],
};

const allNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Daftar Layanan', href: '/daftar-jasa', icon: Briefcase },
  { name: 'Marketing Kit', href: '/marketing-kit', icon: FolderDown },
  { name: 'Admin Panel', href: '/admin', icon: ShieldCheck },
];

function UserMiniCard({ user }) {
  if (!user) return null;
  const initials = (user.full_name || '')
    .split(/\s+/)
    .slice(0, 2)
    .map(s => s[0]?.toUpperCase() || '')
    .join('');

  const roleLabel = user.role || 'user';

  return (
    <div className="m-3 p-3 rounded-2xl border border-gray-100 bg-gradient-to-b from-white to-gray-50">
      <div className="flex items-center gap-3">
        <div className="size-9 rounded-xl grid place-items-center bg-indigo-50 text-[#000476] font-bold">
          {initials || '?'}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold truncate">{user.full_name}</div>
          <div className="text-[11px] text-gray-500 truncate">{user.email}</div>
        </div>
      </div>
      <div className="mt-2">
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-blue-50 text-[#000476]">
          {roleLabel}
        </span>
      </div>
    </div>
  );
}

function Sidebar({ isMobileOpen, onToggleMobile }) {
  const location = useLocation();
  const { user } = useAuth();

  const userNav = user?.role && navConfig[user.role] ? navConfig[user.role] : [];
  const visibleNavigation = allNavigation.filter(item => userNav.includes(item.name));

  const NavItem = ({ item }) => {
    const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');

    return (
      <Link
        key={item.name}
        to={item.href}
        onClick={() => { if (onToggleMobile) onToggleMobile(); }}
        className={cn(
          'group relative flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors',
          isActive
            ? 'text-[#000476]'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
        )}
      >
        {/* Active rail */}
        <span
          className={cn(
            'absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-gradient-to-b from-indigo-500 to-sky-400 transition-opacity',
            isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'
          )}
        />
        {/* Icon */}
        <div
          className={cn(
            'relative z-10 grid place-items-center size-8 rounded-lg ring-1 ring-gray-100',
            isActive ? 'bg-indigo-50 text-[#000476]' : 'bg-white text-gray-400 group-hover:text-gray-700'
          )}
        >
          <item.icon className="w-4.5 h-4.5" />
        </div>
        {/* Label */}
        <span className="relative z-10">{item.name}</span>

        {/* Floating active bg */}
        {isActive && (
          <motion.div
            layoutId="sidebar-active-blob"
            className="absolute inset-0 rounded-xl -z-10 bg-gradient-to-r from-indigo-50 to-white"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        )}
      </Link>
    );
  };

  const sidebarContent = (
    <div className="w-64 h-full flex flex-col bg-white border-r border-gray-200">
      {/* Top brand */}
      <div className="border-b border-gray-200">
        <Link to="/dashboard" className="flex items-center justify-center h-20">
          <img
            src="sakti.png"
            alt="SAKTI Logo"
            className="h-12 object-contain"
          />
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 overflow-y-auto bg-gradient-to-b from-white to-gray-50/60">
        <div className="space-y-1">
          {visibleNavigation.map((item) => <NavItem key={item.name} item={item} />)}
        </div>
      </nav>

      {/* Footer user card */}
      <div className="border-t border-gray-200 bg-white">
        <UserMiniCard user={user} />
        <div className="px-4 pb-3 text-[10px] text-gray-400">
          v1.0 • © SAKTI
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={cn(
          'lg:hidden fixed inset-0 bg-black/50 z-40 transition-opacity',
          isMobileOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        )}
        onClick={onToggleMobile}
      />

      {/* Mobile Sidebar */}
      <div
        className={cn(
          'lg:hidden fixed top-0 left-0 h-full w-64 z-50 transform transition-transform duration-300',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Shadow container for depth */}
        <div className="h-full shadow-2xl">{sidebarContent}</div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:h-full lg:fixed">
        <div className="h-full shadow-sm">{sidebarContent}</div>
      </div>
    </>
  );
}

export default Sidebar;

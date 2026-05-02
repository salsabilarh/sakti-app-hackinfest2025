import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

function DashboardLayout({ children }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <Sidebar isMobileOpen={isMobileOpen} onToggleMobile={() => setIsMobileOpen(!isMobileOpen)} />

      <div className="flex flex-col flex-1 lg:ml-64">
        <Header onToggleMobile={() => setIsMobileOpen(!isMobileOpen)} />
        <main className="flex-1 overflow-auto bg-gray-50 p-5">
          {children}
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;

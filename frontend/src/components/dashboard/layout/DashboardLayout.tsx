'use client';

import React, { useState } from 'react';
import { SideNavBar } from './SideNavBar';
import { TopNavBar } from './TopNavBar';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <SideNavBar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:ml-72 w-full transition-all duration-300">
        <TopNavBar onMenuClick={() => setIsSidebarOpen(true)} />
        
        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

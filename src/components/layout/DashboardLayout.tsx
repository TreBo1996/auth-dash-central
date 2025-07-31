
import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

interface DashboardLayoutProps {
  children: React.ReactNode;
  fullHeight?: boolean;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, fullHeight }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Mobile sidebar overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        ${isMobile ? 'fixed' : 'relative'}
        ${isMobile && !sidebarOpen ? '-translate-x-full' : 'translate-x-0'}
        transition-transform duration-300 ease-in-out z-50
      `}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>
      
      <main className={`flex-1 ${fullHeight ? 'overflow-hidden' : 'overflow-auto'}`}>
        {/* Mobile header with hamburger */}
        {isMobile && (
          <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-indigo-100 px-4 py-3 flex items-center justify-between z-30 shadow-sm">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
              className="p-2 hover:bg-indigo-50"
            >
              <Menu className="h-5 w-5 text-indigo-600" />
            </Button>
            <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              RezLit
            </h1>
            <div className="w-9" /> {/* Spacer for centering */}
          </div>
        )}
        
        <div className={`${fullHeight ? 'h-full' : 'p-4 md:p-6 lg:p-8 min-h-full'}`}>
          <div className="animate-fade-in">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

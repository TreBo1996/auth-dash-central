
import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { EmployerSidebar } from './EmployerSidebar';

interface EmployerDashboardLayoutProps {
  children?: React.ReactNode;
}

export const EmployerDashboardLayout: React.FC<EmployerDashboardLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <EmployerSidebar />
        <main className="flex-1 p-6 ml-64">
          <div className="max-w-7xl mx-auto">
            {children || <Outlet />}
          </div>
        </main>
      </div>
    </div>
  );
};

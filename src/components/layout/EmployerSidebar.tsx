
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Plus, 
  FileText, 
  Users, 
  Building, 
  BarChart3,
  Settings
} from 'lucide-react';

const menuItems = [
  {
    name: 'Dashboard',
    href: '/employer/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Post Job',
    href: '/employer/post-job',
    icon: Plus,
  },
  {
    name: 'Job Postings',
    href: '/employer/job-postings',
    icon: FileText,
  },
  {
    name: 'Applications',
    href: '/employer/applications',
    icon: Users,
  },
  {
    name: 'Company Profile',
    href: '/employer/profile',
    icon: Building,
  },
  {
    name: 'Analytics',
    href: '/employer/analytics',
    icon: BarChart3,
  },
  {
    name: 'Settings',
    href: '/employer/settings',
    icon: Settings,
  },
];

export const EmployerSidebar: React.FC = () => {
  const location = useLocation();

  return (
    <div className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white border-r border-gray-200 overflow-y-auto">
      <div className="p-4">
        <div className="flex items-center mb-4">
          <img 
            src="/lovable-uploads/41eb8276-f076-476b-93fb-6dab57a8c8b1.png" 
            alt="RezLit Logo" 
            className="h-8 w-auto"
          />
        </div>
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

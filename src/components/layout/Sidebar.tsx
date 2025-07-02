
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  Home, 
  Search, 
  FileText, 
  Upload, 
  Settings, 
  MessageSquare, 
  Briefcase,
  User,
  File,
  Mail
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Find Jobs', href: '/job-search', icon: Search },
  { name: 'Cover Letters', href: '/cover-letters', icon: Mail },
  { name: 'Upload Resume', href: '/upload-resume', icon: Upload },
  { name: 'Upload Job', href: '/upload-job', icon: FileText },
  { name: 'Resume Editor', href: '/resume-editor', icon: File },
  { name: 'Resume Templates', href: '/resume-templates', icon: File },
  { name: 'Interview Prep', href: '/interview-prep', icon: MessageSquare },
  { name: 'Profile', href: '/profile', icon: User },
];

interface SidebarProps {
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const location = useLocation();

  return (
    <div className="flex flex-col w-64 bg-gray-800">
      <div className="flex items-center justify-center h-16 px-4">
        <h1 className="text-xl font-bold text-white">JobSeeker</h1>
      </div>
      <nav className="flex-1 px-4 pb-4 space-y-1">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors',
                isActive
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              )}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

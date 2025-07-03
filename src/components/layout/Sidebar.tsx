import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Upload, FileText, User, LogOut, MessageSquare, Search, X, Sparkles, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
const navigation = [{
  name: 'Dashboard',
  href: '/dashboard',
  icon: Home
}, {
  name: 'Mock Interview Prep',
  href: '/interview-prep',
  icon: MessageSquare
}, {
  name: 'Cover Letters',
  href: '/cover-letters',
  icon: Mail
}, {
  name: 'Job Search',
  href: '/job-search',
  icon: Search
}, {
  name: 'Upload Resume',
  href: '/upload-resume',
  icon: Upload
}, {
  name: 'Upload Job Description',
  href: '/upload-job',
  icon: FileText
}, {
  name: 'Profile',
  href: '/profile',
  icon: User
}];
interface SidebarProps {
  onClose?: () => void;
}
export const Sidebar: React.FC<SidebarProps> = ({
  onClose
}) => {
  const location = useLocation();
  const {
    toast
  } = useToast();
  const isMobile = useIsMobile();
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive"
      });
    }
  };
  const handleLinkClick = () => {
    if (isMobile && onClose) {
      onClose();
    }
  };
  return <div className="flex h-screen w-64 flex-col bg-gradient-to-b from-white to-blue-50 border-r border-indigo-100 shadow-xl-modern">
      <div className="flex h-16 items-center justify-between px-6 border-b border-indigo-100 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-6 w-6 text-yellow-300" />
          <h1 className="text-xl font-bold bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">RezLitt</h1>
        </div>
        {isMobile && onClose && <Button variant="ghost" size="sm" onClick={onClose} className="p-2 text-white hover:bg-white/20">
            <X className="h-4 w-4" />
          </Button>}
      </div>
      
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map(item => {
        const isActive = location.pathname === item.href;
        return <Link key={item.name} to={item.href} onClick={handleLinkClick} className={`
                flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group
                ${isActive ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-105' : 'text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-indigo-700 hover:scale-102'}
              `}>
              <item.icon className={`mr-3 h-5 w-5 transition-colors ${isActive ? 'text-yellow-300' : 'group-hover:text-indigo-600'}`} />
              <span className={isMobile ? 'text-base' : ''}>{item.name}</span>
              {isActive && <div className="ml-auto h-2 w-2 rounded-full bg-yellow-300 animate-pulse"></div>}
            </Link>;
      })}
      </nav>
      
      <div className="p-4 border-t border-indigo-100 bg-gradient-to-r from-gray-50 to-blue-50">
        <Button onClick={handleLogout} variant="outline" className="w-full justify-start h-11 border-indigo-200 text-gray-700 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 hover:text-red-700 hover:border-red-200 transition-all duration-200">
          <LogOut className="mr-3 h-4 w-4" />
          Log Out
        </Button>
      </div>
    </div>;
};
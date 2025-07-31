import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Upload, FileText, User, LogOut, MessageSquare, Search, X, Mail, Lock, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
const navigation = [{
  name: 'Job Hub',
  href: '/job-hub',
  icon: Home,
  protected: true
}, {
  name: 'Resume Optimizer',
  href: '/dashboard',
  icon: Briefcase,
  protected: true
}, {
  name: 'AI Interview Coach',
  href: '/interview-prep',
  icon: MessageSquare,
  protected: true
}, {
  name: 'Cover Letters',
  href: '/cover-letters',
  icon: Mail,
  protected: true
}, {
  name: 'Job Search',
  href: '/job-search',
  icon: Search,
  protected: false
}, {
  name: 'Upload Resume',
  href: '/upload-resume',
  icon: Upload,
  protected: true
}, {
  name: 'Upload Job Description',
  href: '/upload-job',
  icon: FileText,
  protected: true
}, {
  name: 'Profile',
  href: '/profile',
  icon: User,
  protected: true
}];
interface SidebarProps {
  onClose?: () => void;
}
export const Sidebar: React.FC<SidebarProps> = ({
  onClose
}) => {
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
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

  const getFeatureDescription = (name: string) => {
    const descriptions: Record<string, string> = {
      'Job Hub': 'Unlock your AI-powered job application dashboard',
      'Resume Optimizer': 'Get AI-powered ATS optimization that beats 95% of job bots',
      'AI Interview Coach': 'Practice with personalized AI interview questions',
      'Cover Letters': 'Generate compelling, tailored cover letters in minutes',
      'Upload Resume': 'Upload and optimize your resume with AI analysis',
      'Upload Job Description': 'Save job descriptions and get personalized optimization',
      'Profile': 'Manage your professional profile and preferences'
    };
    return descriptions[name] || `Create an account to access ${name}`;
  };

  const handleLinkClick = (item: any) => {
    if (isMobile && onClose) {
      onClose();
    }
    
    // For non-authenticated users trying to access protected routes
    if (!user && item.protected) {
      toast({
        title: "🚀 Premium Feature",
        description: getFeatureDescription(item.name),
        action: (
          <Button 
            onClick={() => window.location.href = '/auth'}
            size="sm"
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
          >
            Sign Up Free
          </Button>
        )
      });
    }
  };

  const handleProtectedClick = (e: React.MouseEvent, item: any) => {
    if (!user && item.protected) {
      e.preventDefault();
      handleLinkClick(item);
    }
  };

  return (
    <div className="flex h-screen w-64 flex-col bg-gradient-to-b from-white to-blue-50 border-r border-indigo-100 shadow-xl-modern">
      <div className="flex h-16 items-center justify-between px-6 border-b border-indigo-100 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="flex items-center">
          <img 
            src="/lovable-uploads/41eb8276-f076-476b-93fb-6dab57a8c8b1.png" 
            alt="RezLit Logo" 
            className="h-8 w-auto"
          />
        </div>
        {isMobile && onClose && (
          <Button variant="ghost" size="sm" onClick={onClose} className="p-2 text-white hover:bg-white/20">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map(item => {
          const isActive = location.pathname === item.href;
          const isProtected = item.protected && !user;
          
          return (
            <Link 
              key={item.name} 
              to={isProtected ? '#' : item.href} 
              onClick={(e) => {
                handleProtectedClick(e, item);
                if (!isProtected) handleLinkClick(item);
              }}
              className={`
                flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group relative
                ${isActive ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-105' : 
                  isProtected ? 'text-gray-600 hover:bg-gradient-to-r hover:from-yellow-50 hover:to-orange-50 hover:text-orange-700 cursor-pointer border border-orange-100 bg-gradient-to-r from-yellow-25 to-orange-25' :
                  'text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-indigo-700 hover:scale-102'}
              `}
            >
              <item.icon className={`mr-3 h-5 w-5 transition-colors ${
                isActive ? 'text-yellow-300' : 
                isProtected ? 'text-orange-600' :
                'group-hover:text-indigo-600'
              }`} />
              <span className={isMobile ? 'text-base' : ''}>{item.name}</span>
              {isProtected && <Lock className="ml-auto h-3 w-3 text-orange-500" />}
              {isActive && <div className="ml-auto h-2 w-2 rounded-full bg-yellow-300 animate-pulse"></div>}
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-indigo-100 bg-gradient-to-r from-gray-50 to-blue-50">
        {user ? (
          <Button 
            onClick={handleLogout} 
            variant="outline" 
            className="w-full justify-start h-11 border-indigo-200 text-gray-700 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 hover:text-red-700 hover:border-red-200 transition-all duration-200"
          >
            <LogOut className="mr-3 h-4 w-4" />
            Log Out
          </Button>
        ) : (
          <div className="space-y-2">
            <Button 
              onClick={() => window.location.href = '/auth'}
              className="w-full justify-start h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
            >
              <User className="mr-3 h-4 w-4" />
              Sign Up / Login
            </Button>
            <p className="text-xs text-center text-gray-500">
              Unlock all RezLit features
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { LogOut, User, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { RoleSwitcher } from './RoleSwitcher';

export const Header: React.FC = () => {
  const {
    user,
    signOut
  } = useAuth();
  const {
    toast
  } = useToast();
  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "You have been signed out successfully."
    });
  };
  return (
    <header className="backdrop-blur-md bg-indigo-500/20 border-b border-indigo-300/20 sticky top-0 z-50">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to={user ? "/dashboard" : "/"} className="flex items-center">
            <div className="p-3">
              <img 
                src="/lovable-uploads/7efa04f5-0fb8-419e-9b8c-62b5d4411064.png" 
                alt="RezLit Logo" 
                className="h-12 w-auto"
              />
            </div>
          </Link>
          
          <div className="flex items-center gap-4">
            {user && <RoleSwitcher />}
            
            {user ? <>
                <Link to="/dashboard">
                  <Button variant="ghost" className="text-white hover:bg-white/20 hover:text-white border-0">
                    Dashboard
                  </Button>
                </Link>
                <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
                  <User className="h-4 w-4 text-yellow-300" />
                  <span className="text-sm text-white font-medium">{user.email}</span>
                </div>
                <Button variant="outline" onClick={handleSignOut} className="bg-white/10 backdrop-blur-sm text-white border-white/30 hover:bg-white/20 hover:text-white">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </> : <>
                <Link to="/auth">
                  <Button variant="ghost" className="text-white hover:bg-white/20 hover:text-white border-0">
                    Sign In
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button className="bg-white text-indigo-600 hover:bg-gray-100 font-semibold shadow-lg">
                    Get Started
                  </Button>
                </Link>
              </>}
          </div>
        </div>
      </div>
    </header>
  );
};

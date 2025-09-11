
import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { RoleSwitcher } from './RoleSwitcher';
import { WalletHeaderButton } from '@/components/wallet/WalletHeaderButton';

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
    <header className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 sticky top-0 z-50">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to={user ? "/job-hub" : "/"} className="flex items-center">
            <img 
              src="/lovable-uploads/41eb8276-f076-476b-93fb-6dab57a8c8b1.png" 
              alt="RezLit Logo" 
              className="h-8 w-auto"
            />
          </Link>
          
          <div className="flex items-center gap-4">
            {user && <RoleSwitcher />}
            
            {user ? <>
                <Link to="/job-hub">
                  <Button variant="ghost" className="text-white hover:bg-white/20 hover:text-white border-0">
                    Dashboard
                  </Button>
                </Link>
                {/* Wallet Connection Button */}
                <WalletHeaderButton />
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

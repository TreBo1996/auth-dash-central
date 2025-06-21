
import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const Header: React.FC = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "You have been signed out successfully.",
    });
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/home" className="text-2xl font-bold text-gray-900">
            Best Hire
          </Link>
          
          <nav className="flex items-center space-x-4">
            {user ? (
              <>
                <Link to="/dashboard">
                  <Button variant="ghost">Dashboard</Button>
                </Link>
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-600" />
                  <span className="text-sm text-gray-600">{user.email}</span>
                </div>
                <Button variant="outline" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Link to="/auth">
                  <Button>Get Started</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

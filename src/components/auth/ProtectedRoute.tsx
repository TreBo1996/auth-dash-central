
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/contexts/RoleContext';
import { Loader2 } from 'lucide-react';
import { RoleSelection } from './RoleSelection';
import { EmploymentPreferencesModal } from './EmploymentPreferencesModal';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const { isLoadingRoles, needsRoleSelection, needsEmploymentPreferences, setEmploymentPreferencesComplete } = useRole();

  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 mx-auto animate-spin text-blue-600 mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth if not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Show loading while roles are loading
  if (isLoadingRoles) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 mx-auto animate-spin text-blue-600 mb-4" />
          <p className="text-gray-600">Setting up your account...</p>
        </div>
      </div>
    );
  }

  // Show role selection if user needs to choose a role
  if (needsRoleSelection) {
    return <RoleSelection />;
  }

  // Show employment preferences modal if job seeker needs to set preferences
  if (needsEmploymentPreferences) {
    return (
      <EmploymentPreferencesModal
        onComplete={setEmploymentPreferencesComplete}
        onSkip={setEmploymentPreferencesComplete}
      />
    );
  }

  // User is authenticated and has roles - show protected content
  return <>{children}</>;
};


import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useRole } from '@/contexts/RoleContext';
import { Database } from '@/integrations/supabase/types';
import { Loader2 } from 'lucide-react';

type AppRole = Database['public']['Enums']['app_role'];

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  requiredRole: AppRole;
  fallbackPath?: string;
}

export const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({
  children,
  requiredRole,
  fallbackPath
}) => {
  const { hasRole, isLoadingRoles, userRoles } = useRole();
  const location = useLocation();

  if (isLoadingRoles) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Check if user has the required role
  if (!hasRole(requiredRole)) {
    // Determine the appropriate redirect path
    let redirectPath = fallbackPath;
    
    if (!redirectPath) {
      // Smart fallback based on user's actual roles
      if (userRoles.includes('employer') || userRoles.includes('both')) {
        redirectPath = '/employer/dashboard';
      } else {
        redirectPath = '/dashboard';
      }
    }
    
    console.log(`User does not have required role ${requiredRole}, redirecting to ${redirectPath}`);
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  // User has the required role, render the protected content
  return <>{children}</>;
};

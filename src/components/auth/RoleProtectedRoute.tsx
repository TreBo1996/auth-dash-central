
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useRole } from '@/contexts/RoleContext';
import { Database } from '@/integrations/supabase/types';
import { AppLoadingScreen } from '@/components/common/AppLoadingScreen';

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
  const { hasRole, isLoadingRoles, isInitializing, userRoles } = useRole();
  const location = useLocation();

  if (isLoadingRoles || isInitializing) {
    return <AppLoadingScreen message="Verifying access permissions..." />;
  }

  // Check if user has the required role
  if (!hasRole(requiredRole)) {
    // Determine the appropriate redirect path
    let redirectPath = fallbackPath;
    
    if (!redirectPath) {
      // Smart fallback based on user's actual roles - avoid redirecting to inaccessible routes
      if (requiredRole === 'job_seeker' && (userRoles.includes('employer') || userRoles.includes('both'))) {
        // If employer user tries to access job seeker route, redirect to employer dashboard
        redirectPath = '/employer/dashboard';
      } else if (requiredRole === 'employer' && (userRoles.includes('job_seeker') || userRoles.includes('both'))) {
        // If job seeker user tries to access employer route, redirect to job seeker dashboard
        redirectPath = '/dashboard';
      } else if (userRoles.includes('employer') || userRoles.includes('both')) {
        // Default for employer users
        redirectPath = '/employer/dashboard';
      } else {
        // Default for job seeker users
        redirectPath = '/dashboard';
      }
    }
    
    console.log(`User does not have required role ${requiredRole}, redirecting to ${redirectPath}`);
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  // User has the required role, render the protected content
  return <>{children}</>;
};

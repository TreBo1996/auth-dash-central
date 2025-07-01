
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
  fallbackPath = '/dashboard'
}) => {
  const { hasRole, isLoadingRoles, activeRole } = useRole();
  const location = useLocation();

  if (isLoadingRoles) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!hasRole(requiredRole)) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // Additional check for active role mismatch
  if (activeRole !== requiredRole && requiredRole !== 'both') {
    // If user has the required role but it's not active, redirect to switch
    if (hasRole(requiredRole)) {
      const redirectPath = requiredRole === 'employer' ? '/employer/dashboard' : '/dashboard';
      return <Navigate to={redirectPath} replace />;
    }
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

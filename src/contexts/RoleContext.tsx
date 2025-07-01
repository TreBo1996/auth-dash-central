
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface RoleContextType {
  userRoles: AppRole[];
  activeRole: AppRole | null;
  preferredRole: AppRole | null;
  isLoadingRoles: boolean;
  switchRole: (role: AppRole) => Promise<void>;
  hasRole: (role: AppRole) => boolean;
  canSwitchRoles: boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const useRole = () => {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};

interface RoleProviderProps {
  children: React.ReactNode;
}

export const RoleProvider: React.FC<RoleProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [userRoles, setUserRoles] = useState<AppRole[]>([]);
  const [activeRole, setActiveRole] = useState<AppRole | null>(null);
  const [preferredRole, setPreferredRole] = useState<AppRole | null>(null);
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);

  // Load user roles and preferences
  useEffect(() => {
    const loadUserRoles = async () => {
      if (!user) {
        setUserRoles([]);
        setActiveRole(null);
        setPreferredRole(null);
        setIsLoadingRoles(false);
        return;
      }

      try {
        // Get user roles
        const { data: rolesData, error: rolesError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        if (rolesError) throw rolesError;

        const roles = rolesData?.map(r => r.role) || [];
        setUserRoles(roles);

        // Get preferred role
        const { data: prefData, error: prefError } = await supabase
          .from('user_role_preferences')
          .select('preferred_role')
          .eq('user_id', user.id)
          .single();

        if (prefError && prefError.code !== 'PGRST116') throw prefError;

        const preferred = prefData?.preferred_role || roles[0] || 'job_seeker';
        setPreferredRole(preferred);

        // Set active role primarily based on preferred role, not URL
        const currentPath = window.location.pathname;
        let determinedRole: AppRole;

        // Priority 1: If user has preferred role and it's in their roles, use it
        if (preferred && roles.includes(preferred)) {
          determinedRole = preferred;
        } 
        // Priority 2: Check current URL context for manual navigation
        else if (currentPath.startsWith('/employer') && (roles.includes('employer') || roles.includes('both'))) {
          determinedRole = 'employer';
        }
        // Priority 3: Fallback to first available role
        else {
          determinedRole = roles[0] || 'job_seeker';
        }

        setActiveRole(determinedRole);

        // Auto-redirect logic based on preferred role
        const shouldRedirectToEmployer = preferred === 'employer' && 
          (roles.includes('employer') || roles.includes('both')) && 
          !currentPath.startsWith('/employer') &&
          currentPath !== '/verify-email' &&
          currentPath !== '/auth' &&
          currentPath !== '/employer/auth';

        const shouldRedirectToJobSeeker = preferred === 'job_seeker' && 
          currentPath.startsWith('/employer') &&
          !roles.includes('employer') &&
          !roles.includes('both');

        if (shouldRedirectToEmployer) {
          console.log('Auto-redirecting employer to employer dashboard');
          window.location.href = '/employer/dashboard';
        } else if (shouldRedirectToJobSeeker) {
          console.log('Auto-redirecting job seeker to job seeker dashboard');
          window.location.href = '/dashboard';
        }

      } catch (error) {
        console.error('Error loading user roles:', error);
        setUserRoles(['job_seeker']); // Default fallback
        setActiveRole('job_seeker');
        setPreferredRole('job_seeker');
      } finally {
        setIsLoadingRoles(false);
      }
    };

    loadUserRoles();
  }, [user]);

  const switchRole = async (role: AppRole) => {
    if (!user || !userRoles.includes(role)) return;

    try {
      // Update preferred role
      const { error } = await supabase
        .from('user_role_preferences')
        .upsert({
          user_id: user.id,
          preferred_role: role
        });

      if (error) throw error;

      setActiveRole(role);
      setPreferredRole(role);

      // Navigate to appropriate dashboard
      if (role === 'employer') {
        window.location.href = '/employer/dashboard';
      } else {
        window.location.href = '/dashboard';
      }

    } catch (error) {
      console.error('Error switching role:', error);
    }
  };

  const hasRole = (role: AppRole): boolean => {
    return userRoles.includes(role) || userRoles.includes('both');
  };

  const canSwitchRoles = userRoles.includes('both') || userRoles.length > 1;

  const value: RoleContextType = {
    userRoles,
    activeRole,
    preferredRole,
    isLoadingRoles,
    switchRole,
    hasRole,
    canSwitchRoles
  };

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  );
};

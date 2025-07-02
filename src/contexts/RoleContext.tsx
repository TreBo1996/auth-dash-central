
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  const navigate = useNavigate();
  const location = useLocation();
  const [userRoles, setUserRoles] = useState<AppRole[]>([]);
  const [activeRole, setActiveRole] = useState<AppRole | null>(null);
  const [preferredRole, setPreferredRole] = useState<AppRole | null>(null);
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);
  const [navigationComplete, setNavigationComplete] = useState(false);

  // Memoize navigation logic with improved conditions
  const handleRoleBasedNavigation = useCallback((role: AppRole, currentPath: string) => {
    // Skip navigation if already completed for this auth session
    if (navigationComplete) {
      console.log('Navigation already completed for this session');
      return;
    }

    const isEmployerPath = currentPath.startsWith('/employer');
    const isJobSeekerPath = currentPath === '/dashboard' || (!isEmployerPath && currentPath !== '/verify-email' && currentPath !== '/auth' && currentPath !== '/employer/auth');

    console.log('Role navigation check:', { 
      role, 
      currentPath, 
      isEmployerPath, 
      isJobSeekerPath,
      navigationComplete 
    });

    // Navigation logic based on role
    if (role === 'employer') {
      if (isJobSeekerPath) {
        console.log('Redirecting employer user from job seeker path to employer dashboard');
        navigate('/employer/dashboard', { replace: true });
        setNavigationComplete(true);
      }
    } else if (role === 'job_seeker') {
      if (isEmployerPath) {
        console.log('Redirecting job seeker user from employer path to job seeker dashboard');
        navigate('/dashboard', { replace: true });
        setNavigationComplete(true);
      }
    }
  }, [navigate, navigationComplete]);

  // Reset navigation state when user changes
  useEffect(() => {
    if (!user) {
      setNavigationComplete(false);
    }
  }, [user]);

  // Load user roles and preferences
  useEffect(() => {
    const loadUserRoles = async () => {
      if (!user) {
        setUserRoles([]);
        setActiveRole(null);
        setPreferredRole(null);
        setIsLoadingRoles(false);
        setNavigationComplete(false);
        return;
      }

      try {
        console.log('Loading roles for user:', user.id);

        // Get user roles
        const { data: rolesData, error: rolesError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        if (rolesError) throw rolesError;

        let roles = rolesData?.map(r => r.role) || [];

        // If user has no roles, create a default job_seeker role
        if (roles.length === 0) {
          console.log('User has no roles, creating default job_seeker role');
          
          const { error: insertRoleError } = await supabase
            .from('user_roles')
            .insert({
              user_id: user.id,
              role: 'job_seeker'
            });

          if (insertRoleError) {
            console.error('Error creating default role:', insertRoleError);
          } else {
            roles = ['job_seeker'];
            console.log('Successfully created default job_seeker role');
          }
        }

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

        // Set active role based on preferred role
        const determinedRole = preferred && roles.includes(preferred) ? preferred : roles[0] || 'job_seeker';
        setActiveRole(determinedRole);

        console.log('Roles loaded:', { roles, preferred, determinedRole, currentPath: location.pathname });

        // Handle navigation after role is determined and roles are loaded
        handleRoleBasedNavigation(determinedRole, location.pathname);

      } catch (error) {
        console.error('Error loading user roles:', error);
        // Fallback to job_seeker role if there's an error
        setUserRoles(['job_seeker']);
        setActiveRole('job_seeker');
        setPreferredRole('job_seeker');
      } finally {
        setIsLoadingRoles(false);
      }
    };

    loadUserRoles();
  }, [user, handleRoleBasedNavigation, location.pathname]);

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
      setNavigationComplete(false); // Reset to allow navigation

      // Navigate to appropriate dashboard
      if (role === 'employer') {
        navigate('/employer/dashboard');
      } else {
        navigate('/dashboard');
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

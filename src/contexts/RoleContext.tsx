
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
  isInitializing: boolean;
  needsRoleSelection: boolean; // New: indicates if user needs to select a role
  needsEmploymentPreferences: boolean; // New: indicates if job seeker needs to set preferences
  switchRole: (role: AppRole) => Promise<void>;
  createRole: (role: AppRole) => Promise<boolean>; // New: create role function
  setEmploymentPreferencesComplete: (fromParam?: string | null) => void; // New: mark preferences as complete
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
  const [isInitializing, setIsInitializing] = useState(true);
  const [hasNavigated, setHasNavigated] = useState(false);
  const [needsRoleSelection, setNeedsRoleSelection] = useState(false);
  const [needsEmploymentPreferences, setNeedsEmploymentPreferences] = useState(false);

  // Create role function - used during onboarding
  const createRole = async (role: AppRole): Promise<boolean> => {
    if (!user) return false;

    try {
      console.log('Creating role:', role, 'for user:', user.id);
      
      // Insert user role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: user.id,
          role: role
        });

      if (roleError) throw roleError;

      // Set role preference
      const { error: prefError } = await supabase
        .from('user_role_preferences')
        .upsert({
          user_id: user.id,
          preferred_role: role
        });

      if (prefError) throw prefError;

      // Update local state
      setUserRoles([role]);
      setActiveRole(role);
      setPreferredRole(role);
      setNeedsRoleSelection(false);
      
      // If job seeker, show employment preferences modal
      if (role === 'job_seeker') {
        setNeedsEmploymentPreferences(true);
      }

      console.log('Successfully created role:', role);
      return true;
    } catch (error) {
      console.error('Error creating role:', error);
      return false;
    }
  };

  // Load user roles and preferences - now more graceful
  useEffect(() => {
    const loadUserRoles = async () => {
      if (!user) {
        setUserRoles([]);
        setActiveRole(null);
        setPreferredRole(null);
        setIsLoadingRoles(false);
        setIsInitializing(false);
        setHasNavigated(false);
        setNeedsRoleSelection(false);
        setNeedsEmploymentPreferences(false);
        return;
      }

      try {
        console.log('Loading roles for user:', user.id);
        setIsLoadingRoles(true);

        // Get user roles
        const { data: rolesData, error: rolesError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        if (rolesError) throw rolesError;

        let roles = rolesData?.map(r => r.role) || [];

        // If user has no roles, they need to select one during onboarding
        if (roles.length === 0) {
          console.log('User has no roles - will need role selection');
          setNeedsRoleSelection(true);
          setUserRoles([]);
          setActiveRole(null);
          setPreferredRole(null);
          setNeedsEmploymentPreferences(false);
        } else {
          // User has roles - load preferences
          setNeedsRoleSelection(false);
          setUserRoles(roles);

          // Get preferred role
          const { data: prefData, error: prefError } = await supabase
            .from('user_role_preferences')
            .select('preferred_role')
            .eq('user_id', user.id)
            .single();

          if (prefError && prefError.code !== 'PGRST116') throw prefError;

          const preferred = prefData?.preferred_role || roles[0];
          setPreferredRole(preferred);

          // Set active role based on preferred role
          const determinedRole = preferred && roles.includes(preferred) ? preferred : roles[0];
          setActiveRole(determinedRole);

          console.log('Roles loaded:', { roles, preferred, determinedRole });
        }

      } catch (error) {
        console.error('Error loading user roles:', error);
        // On error, mark that they need role selection
        setNeedsRoleSelection(true);
        setUserRoles([]);
        setActiveRole(null);
        setPreferredRole(null);
        setNeedsEmploymentPreferences(false);
      } finally {
        setIsLoadingRoles(false);
        setTimeout(() => {
          setIsInitializing(false);
        }, 100);
      }
    };

    loadUserRoles();
  }, [user]);

  // Handle role-based navigation after roles are loaded
  useEffect(() => {
    if (!user || isLoadingRoles || isInitializing || hasNavigated || !activeRole || needsEmploymentPreferences) {
      return;
    }

    const currentPath = location.pathname;
    const isEmployerPath = currentPath.startsWith('/employer');
    
    // Exclude specific tool paths from role-based redirection
    const toolPaths = ['/resume-editor', '/resume-templates', '/interview-prep', '/cover-letters', '/job-search', '/job-hub'];
    const isToolPath = toolPaths.some(path => currentPath.startsWith(path));
    
    const isJobSeekerPath = currentPath === '/dashboard' || (!isEmployerPath && !isToolPath && currentPath !== '/verify-email' && currentPath !== '/auth' && currentPath !== '/employer/auth');

    console.log('Role navigation check:', { 
      activeRole, 
      currentPath, 
      isEmployerPath, 
      isJobSeekerPath,
      hasNavigated 
    });

    // Navigation logic based on role
    if (activeRole === 'employer' && isJobSeekerPath) {
      console.log('Redirecting employer user from job seeker path to employer dashboard');
      navigate('/employer/dashboard', { replace: true });
      setHasNavigated(true);
    } else if (activeRole === 'job_seeker' && isEmployerPath) {
      console.log('Redirecting job seeker user from employer path to job hub');
      navigate('/job-hub', { replace: true });
      setHasNavigated(true);
    }
  }, [activeRole, isLoadingRoles, isInitializing, hasNavigated, location.pathname, navigate, user]);

  // Reset navigation state when user changes
  useEffect(() => {
    if (!user) {
      setHasNavigated(false);
    }
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
      setHasNavigated(false); // Reset to allow navigation

      // Navigate to appropriate dashboard
      if (role === 'employer') {
        navigate('/employer/dashboard');
      } else {
        navigate('/job-hub');
      }

    } catch (error) {
      console.error('Error switching role:', error);
    }
  };

  const hasRole = (role: AppRole): boolean => {
    return userRoles.includes(role) || userRoles.includes('both');
  };

  const canSwitchRoles = userRoles.includes('both') || userRoles.length > 1;

  const setEmploymentPreferencesComplete = (fromParam?: string | null) => {
    console.log('setEmploymentPreferencesComplete called with fromParam:', fromParam);
    setNeedsEmploymentPreferences(false);
    
    // Redirect to original page if provided
    if (fromParam) {
      try {
        // Decode the URL parameter in case it was encoded
        const decodedParam = decodeURIComponent(fromParam);
        console.log('Attempting to navigate to:', decodedParam);
        navigate(decodedParam);
      } catch (error) {
        console.error('Error navigating to fromParam:', error);
        // Fallback to dashboard if redirect fails
        console.log('Falling back to dashboard redirect');
        navigate('/dashboard');
      }
    } else {
      console.log('No fromParam provided, staying on current page');
    }
  };

  const value: RoleContextType = {
    userRoles,
    activeRole,
    preferredRole,
    isLoadingRoles,
    isInitializing,
    needsRoleSelection,
    needsEmploymentPreferences,
    switchRole,
    createRole,
    setEmploymentPreferencesComplete,
    hasRole,
    canSwitchRoles
  };

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  );
};

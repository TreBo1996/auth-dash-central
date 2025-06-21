
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('AuthProvider: Starting initialization...');
    
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('AuthProvider: Checking for existing session...');
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('AuthProvider: Session error:', sessionError);
          if (mounted) {
            setError(sessionError.message);
            setLoading(false);
          }
          return;
        }

        console.log('AuthProvider: Session check complete:', session?.user?.email || 'No session');
        
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setError(null);
          setLoading(false);
        }
        
      } catch (err) {
        console.error('AuthProvider: Initialization error:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Authentication initialization failed');
          setLoading(false);
        }
      }
    };

    // Set up auth state listener
    console.log('AuthProvider: Setting up auth state listener...');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('AuthProvider: Auth state change:', event, session?.user?.email || 'No user');
        
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setError(null);
          
          // Only set loading to false after we've processed the auth change
          if (event !== 'INITIAL_SESSION') {
            setLoading(false);
          }
        }
      }
    );

    // Initialize auth
    initializeAuth();

    return () => {
      console.log('AuthProvider: Cleaning up...');
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      console.log('AuthProvider: Attempting sign up for:', email);
      setError(null);
      
      const redirectUrl = `${window.location.origin}/dashboard`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName || ''
          }
        }
      });
      
      if (error) {
        console.error('AuthProvider: Sign up error:', error);
        setError(error.message);
      } else {
        console.log('AuthProvider: Sign up successful');
      }
      
      return { error };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign up failed';
      console.error('AuthProvider: Sign up exception:', err);
      setError(errorMessage);
      return { error: { message: errorMessage } };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('AuthProvider: Attempting sign in for:', email);
      setError(null);
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('AuthProvider: Sign in error:', error);
        setError(error.message);
      } else {
        console.log('AuthProvider: Sign in successful');
      }
      
      return { error };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign in failed';
      console.error('AuthProvider: Sign in exception:', err);
      setError(errorMessage);
      return { error: { message: errorMessage } };
    }
  };

  const signOut = async () => {
    try {
      console.log('AuthProvider: Attempting sign out...');
      setError(null);
      await supabase.auth.signOut();
      console.log('AuthProvider: Sign out successful');
    } catch (err) {
      console.error('AuthProvider: Sign out error:', err);
      setError(err instanceof Error ? err.message : 'Sign out failed');
    }
  };

  const clearError = () => {
    setError(null);
  };

  console.log('AuthProvider: Current state - loading:', loading, 'user:', user?.email || 'none', 'error:', error);

  const value = {
    user,
    session,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};


import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingFallback } from '@/components/LoadingFallback';
import { SimpleErrorBoundary } from '@/components/SimpleErrorBoundary';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading, error } = useAuth();

  console.log('ProtectedRoute: Current state - loading:', loading, 'user:', user?.email || 'none', 'error:', error);

  if (loading) {
    return <LoadingFallback message="Checking authentication..." />;
  }

  if (error) {
    console.error('ProtectedRoute: Authentication error:', error);
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Authentication Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.href = '/auth'} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('ProtectedRoute: No user found, redirecting to auth');
    return <Navigate to="/auth" replace />;
  }

  console.log('ProtectedRoute: User authenticated, rendering protected content');
  return (
    <SimpleErrorBoundary fallbackMessage="This protected page failed to load.">
      {children}
    </SimpleErrorBoundary>
  );
};

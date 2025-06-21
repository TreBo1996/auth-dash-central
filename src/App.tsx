
import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { SimpleErrorBoundary } from './components/SimpleErrorBoundary';
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import VerifyEmail from "./pages/VerifyEmail";
import Upload from "./pages/Upload";
import Dashboard from "./pages/Dashboard";
import UploadResumePage from "./pages/UploadResumePage";
import UploadJobPage from "./pages/UploadJobPage";
import Profile from "./pages/Profile";
import ResumeEditor from "./pages/ResumeEditor";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error && typeof error === 'object' && 'status' in error) {
          const status = error.status as number;
          if (status >= 400 && status < 500) {
            return false;
          }
        }
        return failureCount < 2; // Reduced retry count
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const App: React.FC = () => {
  console.log('App: Starting application...');
  
  return (
    <SimpleErrorBoundary fallbackMessage="The application failed to load properly.">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <SimpleErrorBoundary fallbackMessage="Authentication system failed to load.">
            <AuthProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  {/* Redirect root to home */}
                  <Route path="/" element={<Navigate to="/home" replace />} />
                  
                  {/* Public routes */}
                  <Route path="/home" element={
                    <SimpleErrorBoundary fallbackMessage="Home page failed to load.">
                      <Home />
                    </SimpleErrorBoundary>
                  } />
                  <Route path="/auth" element={
                    <SimpleErrorBoundary fallbackMessage="Authentication page failed to load.">
                      <Auth />
                    </SimpleErrorBoundary>
                  } />
                  <Route path="/verify-email" element={
                    <SimpleErrorBoundary fallbackMessage="Email verification page failed to load.">
                      <VerifyEmail />
                    </SimpleErrorBoundary>
                  } />
                  
                  {/* Protected routes */}
                  <Route path="/upload" element={
                    <SimpleErrorBoundary fallbackMessage="Upload page failed to load.">
                      <ProtectedRoute><Upload /></ProtectedRoute>
                    </SimpleErrorBoundary>
                  } />
                  <Route path="/dashboard" element={
                    <SimpleErrorBoundary fallbackMessage="Dashboard failed to load.">
                      <ProtectedRoute><Dashboard /></ProtectedRoute>
                    </SimpleErrorBoundary>
                  } />
                  <Route path="/upload-resume" element={
                    <SimpleErrorBoundary fallbackMessage="Resume upload page failed to load.">
                      <ProtectedRoute><UploadResumePage /></ProtectedRoute>
                    </SimpleErrorBoundary>
                  } />
                  <Route path="/upload-job" element={
                    <SimpleErrorBoundary fallbackMessage="Job upload page failed to load.">
                      <ProtectedRoute><UploadJobPage /></ProtectedRoute>
                    </SimpleErrorBoundary>
                  } />
                  <Route path="/profile" element={
                    <SimpleErrorBoundary fallbackMessage="Profile page failed to load.">
                      <ProtectedRoute><Profile /></ProtectedRoute>
                    </SimpleErrorBoundary>
                  } />
                  <Route path="/resume-editor/:id" element={
                    <SimpleErrorBoundary fallbackMessage="Resume editor failed to load.">
                      <ProtectedRoute><ResumeEditor /></ProtectedRoute>
                    </SimpleErrorBoundary>
                  } />
                  
                  {/* Catch-all route */}
                  <Route path="*" element={
                    <SimpleErrorBoundary fallbackMessage="Page not found.">
                      <NotFound />
                    </SimpleErrorBoundary>
                  } />
                </Routes>
              </BrowserRouter>
            </AuthProvider>
          </SimpleErrorBoundary>
        </TooltipProvider>
      </QueryClientProvider>
    </SimpleErrorBoundary>
  );
};

export default App;

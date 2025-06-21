
import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';
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
        return failureCount < 3;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const App: React.FC = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ErrorBoundary>
          <AuthProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                {/* Redirect root to home */}
                <Route path="/" element={<Navigate to="/home" replace />} />
                <Route path="/home" element={
                  <ErrorBoundary>
                    <Home />
                  </ErrorBoundary>
                } />
                <Route path="/auth" element={
                  <ErrorBoundary>
                    <Auth />
                  </ErrorBoundary>
                } />
                <Route path="/verify-email" element={
                  <ErrorBoundary>
                    <VerifyEmail />
                  </ErrorBoundary>
                } />
                
                {/* Protected routes */}
                <Route path="/upload" element={
                  <ErrorBoundary>
                    <ProtectedRoute><Upload /></ProtectedRoute>
                  </ErrorBoundary>
                } />
                <Route path="/dashboard" element={
                  <ErrorBoundary>
                    <ProtectedRoute><Dashboard /></ProtectedRoute>
                  </ErrorBoundary>
                } />
                <Route path="/upload-resume" element={
                  <ErrorBoundary>
                    <ProtectedRoute><UploadResumePage /></ProtectedRoute>
                  </ErrorBoundary>
                } />
                <Route path="/upload-job" element={
                  <ErrorBoundary>
                    <ProtectedRoute><UploadJobPage /></ProtectedRoute>
                  </ErrorBoundary>
                } />
                <Route path="/profile" element={
                  <ErrorBoundary>
                    <ProtectedRoute><Profile /></ProtectedRoute>
                  </ErrorBoundary>
                } />
                <Route path="/resume-editor/:id" element={
                  <ErrorBoundary>
                    <ProtectedRoute><ResumeEditor /></ProtectedRoute>
                  </ErrorBoundary>
                } />
                
                {/* Catch-all route */}
                <Route path="*" element={
                  <ErrorBoundary>
                    <NotFound />
                  </ErrorBoundary>
                } />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </ErrorBoundary>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;

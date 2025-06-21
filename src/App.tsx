
import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import VerifyEmail from "./pages/VerifyEmail";
import Upload from "./pages/Upload";
import Dashboard from "./pages/Dashboard";
import UploadResumePage from "./pages/UploadResumePage";
import UploadJobPage from "./pages/UploadJobPage";
import Profile from "./pages/Profile";
import ResumeEditor from "./pages/ResumeEditor";
import InitialResumeEditor from "./pages/InitialResumeEditor";
import InterviewPrep from "./pages/InterviewPrep";
import ResumeTemplates from "./pages/ResumeTemplates";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App: React.FC = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Redirect root to home */}
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/home" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            
            {/* Protected routes */}
            <Route path="/upload" element={<ProtectedRoute><Upload /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/upload-resume" element={<ProtectedRoute><UploadResumePage /></ProtectedRoute>} />
            <Route path="/upload-job" element={<ProtectedRoute><UploadJobPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/resume-editor/:id" element={<ProtectedRoute><ResumeEditor /></ProtectedRoute>} />
            <Route path="/resume-editor/initial/:id" element={<ProtectedRoute><InitialResumeEditor /></ProtectedRoute>} />
            <Route path="/resume-templates/:optimizedResumeId" element={<ProtectedRoute><ResumeTemplates /></ProtectedRoute>} />
            <Route path="/interview-prep" element={<ProtectedRoute><InterviewPrep /></ProtectedRoute>} />
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

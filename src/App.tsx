
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Dashboard from '@/pages/Dashboard';
import Home from '@/pages/Home';
import { JobSearch } from '@/pages/JobSearch';
import { EmployerDashboard } from '@/pages/employer/EmployerDashboard';
import { AuthProvider } from '@/contexts/AuthContext';
import { RoleProvider } from '@/contexts/RoleContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { RoleProtectedRoute } from '@/components/auth/RoleProtectedRoute';
import Auth from '@/pages/Auth';
import VerifyEmail from '@/pages/VerifyEmail';
import UploadResumePage from '@/pages/UploadResumePage';
import UploadJobPage from '@/pages/UploadJobPage';
import InterviewPrep from '@/pages/InterviewPrep';
import Profile from '@/pages/Profile';
import Upload from '@/pages/Upload';
import ResumeEditor from '@/pages/ResumeEditor';
import InitialResumeEditor from '@/pages/InitialResumeEditor';
import ResumeTemplates from '@/pages/ResumeTemplates';
import NotFound from '@/pages/NotFound';
import EmployerAuth from '@/pages/EmployerAuth';
import EmployerProfile from '@/pages/employer/EmployerProfile';

function App() {
  return (
    <AuthProvider>
      <Router>
        <RoleProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/employer/auth" element={<EmployerAuth />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            
            {/* Job Seeker Routes - Now protected by role */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <RoleProtectedRoute requiredRole="job_seeker">
                    <Dashboard />
                  </RoleProtectedRoute>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/job-search" 
              element={
                <ProtectedRoute>
                  <RoleProtectedRoute requiredRole="job_seeker">
                    <JobSearch />
                  </RoleProtectedRoute>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/upload-resume" 
              element={
                <ProtectedRoute>
                  <RoleProtectedRoute requiredRole="job_seeker">
                    <UploadResumePage />
                  </RoleProtectedRoute>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/upload-job" 
              element={
                <ProtectedRoute>
                  <RoleProtectedRoute requiredRole="job_seeker">
                    <UploadJobPage />
                  </RoleProtectedRoute>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/interview-prep" 
              element={
                <ProtectedRoute>
                  <RoleProtectedRoute requiredRole="job_seeker">
                    <InterviewPrep />
                  </RoleProtectedRoute>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <RoleProtectedRoute requiredRole="job_seeker">
                    <Profile />
                  </RoleProtectedRoute>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/upload" 
              element={
                <ProtectedRoute>
                  <RoleProtectedRoute requiredRole="job_seeker">
                    <Upload />
                  </RoleProtectedRoute>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/resume-editor/:resumeId" 
              element={
                <ProtectedRoute>
                  <RoleProtectedRoute requiredRole="job_seeker">
                    <ResumeEditor />
                  </RoleProtectedRoute>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/resume-editor/initial/:resumeId" 
              element={
                <ProtectedRoute>
                  <RoleProtectedRoute requiredRole="job_seeker">
                    <InitialResumeEditor />
                  </RoleProtectedRoute>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/resume-templates/:resumeId" 
              element={
                <ProtectedRoute>
                  <RoleProtectedRoute requiredRole="job_seeker">
                    <ResumeTemplates />
                  </RoleProtectedRoute>
                </ProtectedRoute>
              } 
            />
            
            {/* Employer Routes */}
            <Route 
              path="/employer/dashboard" 
              element={
                <ProtectedRoute>
                  <RoleProtectedRoute requiredRole="employer">
                    <EmployerDashboard />
                  </RoleProtectedRoute>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/employer/profile" 
              element={
                <ProtectedRoute>
                  <RoleProtectedRoute requiredRole="employer">
                    <EmployerProfile />
                  </RoleProtectedRoute>
                </ProtectedRoute>
              } 
            />
            
            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </RoleProvider>
      </Router>
    </AuthProvider>
  );
}

export default App;

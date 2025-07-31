
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Dashboard from '@/pages/Dashboard';
import Home from '@/pages/Home';
import { JobSearch } from '@/pages/JobSearch';
import { EmployerDashboard } from '@/pages/employer/EmployerDashboard';
import { AuthProvider } from '@/contexts/AuthContext';
import { RoleProvider } from '@/contexts/RoleContext';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { RoleProtectedRoute } from '@/components/auth/RoleProtectedRoute';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { AppErrorBoundary } from '@/components/common/AppErrorBoundary';
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
import PostJob from '@/pages/employer/PostJob';
import JobPostings from '@/pages/employer/JobPostings';
import Applications from '@/pages/employer/Applications';
import EmployerAnalytics from '@/pages/employer/EmployerAnalytics';
import EmployerSettings from '@/pages/employer/EmployerSettings';
import JobPosting from '@/pages/JobPosting';
import JobDetail from '@/pages/JobDetail';
import CoverLetters from '@/pages/CoverLetters';
import CoverLetterEditor from '@/components/CoverLetterEditor';
import JobHub from '@/pages/JobHub';
import TermsOfService from '@/pages/TermsOfService';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import ResetPassword from '@/pages/ResetPassword';

function App() {
  return (
    <AppErrorBoundary>
      <AuthProvider>
        <SubscriptionProvider>
          <Router>
            <RoleProvider>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/employer/auth" element={<EmployerAuth />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              
              {/* Public Job Posting Route */}
              <Route 
                path="/job-posting/:id" 
                element={<JobPosting />} 
              />
              
              {/* Public Job Detail Route */}
              <Route 
                path="/job/:source/:id" 
                element={<JobDetail />} 
              />
              
              {/* Job Seeker Routes */}
              <Route 
                path="/job-hub" 
                element={
                  <ProtectedRoute>
                    <RoleProtectedRoute requiredRole="job_seeker">
                      <JobHub />
                    </RoleProtectedRoute>
                  </ProtectedRoute>
                } 
              />
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
        <Route path="/job-search" element={<JobSearch />} />
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
                path="/cover-letters" 
                element={
                  <ProtectedRoute>
                    <RoleProtectedRoute requiredRole="job_seeker">
                      <CoverLetters />
                    </RoleProtectedRoute>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/cover-letters/edit/:id" 
                element={
                  <ProtectedRoute>
                    <RoleProtectedRoute requiredRole="job_seeker">
                      <ErrorBoundary>
                        <CoverLetterEditor />
                      </ErrorBoundary>
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
                      <ErrorBoundary>
                        <ResumeEditor />
                      </ErrorBoundary>
                    </RoleProtectedRoute>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/resume-editor/initial/:id" 
                element={
                  <ProtectedRoute>
                    <RoleProtectedRoute requiredRole="job_seeker">
                      <ErrorBoundary>
                        <InitialResumeEditor />
                      </ErrorBoundary>
                    </RoleProtectedRoute>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/resume-templates/:resumeId" 
                element={
                  <ProtectedRoute>
                    <RoleProtectedRoute requiredRole="job_seeker">
                      <ErrorBoundary>
                        <ResumeTemplates />
                      </ErrorBoundary>
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
              <Route 
                path="/employer/post-job" 
                element={
                  <ProtectedRoute>
                    <RoleProtectedRoute requiredRole="employer">
                      <PostJob />
                    </RoleProtectedRoute>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/employer/edit-job/:jobId" 
                element={
                  <ProtectedRoute>
                    <RoleProtectedRoute requiredRole="employer">
                      <PostJob />
                    </RoleProtectedRoute>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/employer/job-postings" 
                element={
                  <ProtectedRoute>
                    <RoleProtectedRoute requiredRole="employer">
                      <JobPostings />
                    </RoleProtectedRoute>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/employer/applications" 
                element={
                  <ProtectedRoute>
                    <RoleProtectedRoute requiredRole="employer">
                      <Applications />
                    </RoleProtectedRoute>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/employer/analytics" 
                element={
                  <ProtectedRoute>
                    <RoleProtectedRoute requiredRole="employer">
                      <EmployerAnalytics />
                    </RoleProtectedRoute>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/employer/settings" 
                element={
                  <ProtectedRoute>
                    <RoleProtectedRoute requiredRole="employer">
                      <EmployerSettings />
                    </RoleProtectedRoute>
                  </ProtectedRoute>
                } 
              />
              
              {/* 404 Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </RoleProvider>
        </Router>
      </SubscriptionProvider>
      </AuthProvider>
    </AppErrorBoundary>
  );
}

export default App;

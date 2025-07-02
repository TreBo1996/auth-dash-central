
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import { RoleProvider } from '@/contexts/RoleContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { RoleProtectedRoute } from '@/components/auth/RoleProtectedRoute';
import { AppErrorBoundary } from '@/components/common/AppErrorBoundary';

// Pages - using default imports
import Home from '@/pages/Home';
import Auth from '@/pages/Auth';
import EmployerAuth from '@/pages/EmployerAuth';
import Dashboard from '@/pages/Dashboard';
import Upload from '@/pages/Upload';
import UploadResumePage from '@/pages/UploadResumePage';
import UploadJobPage from '@/pages/UploadJobPage';
import ResumeEditor from '@/pages/ResumeEditor';
import InitialResumeEditor from '@/pages/InitialResumeEditor';
import ResumeTemplates from '@/pages/ResumeTemplates';
import InterviewPrep from '@/pages/InterviewPrep';
import JobSearch from '@/pages/JobSearch';
import CoverLetters from '@/pages/CoverLetters';
import Profile from '@/pages/Profile';
import VerifyEmail from '@/pages/VerifyEmail';
import NotFound from '@/pages/NotFound';

// Employer Pages - using default imports
import EmployerDashboard from '@/pages/employer/EmployerDashboard';
import PostJob from '@/pages/employer/PostJob';
import JobPostings from '@/pages/employer/JobPostings';
import Applications from '@/pages/employer/Applications';
import EmployerProfile from '@/pages/employer/EmployerProfile';
import EmployerSettings from '@/pages/employer/EmployerSettings';
import EmployerAnalytics from '@/pages/employer/EmployerAnalytics';

const queryClient = new QueryClient();

function App() {
  return (
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <RoleProvider>
              <div className="min-h-screen bg-background">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/employer-auth" element={<EmployerAuth />} />
                  <Route path="/verify-email" element={<VerifyEmail />} />
                  
                  {/* Job Seeker Routes */}
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <RoleProtectedRoute requiredRole="job_seeker">
                        <Dashboard />
                      </RoleProtectedRoute>
                    </ProtectedRoute>
                  } />
                  <Route path="/upload" element={
                    <ProtectedRoute>
                      <RoleProtectedRoute requiredRole="job_seeker">
                        <Upload />
                      </RoleProtectedRoute>
                    </ProtectedRoute>
                  } />
                  <Route path="/upload-resume" element={
                    <ProtectedRoute>
                      <RoleProtectedRoute requiredRole="job_seeker">
                        <UploadResumePage />
                      </RoleProtectedRoute>
                    </ProtectedRoute>
                  } />
                  <Route path="/upload-job" element={
                    <ProtectedRoute>
                      <RoleProtectedRoute requiredRole="job_seeker">
                        <UploadJobPage />
                      </RoleProtectedRoute>
                    </ProtectedRoute>
                  } />
                  <Route path="/resume-editor" element={
                    <ProtectedRoute>
                      <RoleProtectedRoute requiredRole="job_seeker">
                        <ResumeEditor />
                      </RoleProtectedRoute>
                    </ProtectedRoute>
                  } />
                  <Route path="/initial-resume-editor" element={
                    <ProtectedRoute>
                      <RoleProtectedRoute requiredRole="job_seeker">
                        <InitialResumeEditor />
                      </RoleProtectedRoute>
                    </ProtectedRoute>
                  } />
                  <Route path="/resume-templates" element={
                    <ProtectedRoute>
                      <RoleProtectedRoute requiredRole="job_seeker">
                        <ResumeTemplates />
                      </RoleProtectedRoute>
                    </ProtectedRoute>
                  } />
                  <Route path="/interview-prep" element={
                    <ProtectedRoute>
                      <RoleProtectedRoute requiredRole="job_seeker">
                        <InterviewPrep />
                      </RoleProtectedRoute>
                    </ProtectedRoute>
                  } />
                  <Route path="/job-search" element={
                    <ProtectedRoute>
                      <RoleProtectedRoute requiredRole="job_seeker">
                        <JobSearch />
                      </RoleProtectedRoute>
                    </ProtectedRoute>
                  } />
                  <Route path="/cover-letters" element={
                    <ProtectedRoute>
                      <RoleProtectedRoute requiredRole="job_seeker">
                        <CoverLetters />
                      </RoleProtectedRoute>
                    </ProtectedRoute>
                  } />
                  <Route path="/profile" element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  } />

                  {/* Employer Routes */}
                  <Route path="/employer/dashboard" element={
                    <ProtectedRoute>
                      <RoleProtectedRoute requiredRole="employer">
                        <EmployerDashboard />
                      </RoleProtectedRoute>
                    </ProtectedRoute>
                  } />
                  <Route path="/employer/post-job" element={
                    <ProtectedRoute>
                      <RoleProtectedRoute requiredRole="employer">
                        <PostJob />
                      </RoleProtectedRoute>
                    </ProtectedRoute>
                  } />
                  <Route path="/employer/job-postings" element={
                    <ProtectedRoute>
                      <RoleProtectedRoute requiredRole="employer">
                        <JobPostings />
                      </RoleProtectedRoute>
                    </ProtectedRoute>
                  } />
                  <Route path="/employer/applications" element={
                    <ProtectedRoute>
                      <RoleProtectedRoute requiredRole="employer">
                        <Applications />
                      </RoleProtectedRoute>
                    </ProtectedRoute>
                  } />
                  <Route path="/employer/profile" element={
                    <ProtectedRoute>
                      <RoleProtectedRoute requiredRole="employer">
                        <EmployerProfile />
                      </RoleProtectedRoute>
                    </ProtectedRoute>
                  } />
                  <Route path="/employer/settings" element={
                    <ProtectedRoute>
                      <RoleProtectedRoute requiredRole="employer">
                        <EmployerSettings />
                      </RoleProtectedRoute>
                    </ProtectedRoute>
                  } />
                  <Route path="/employer/analytics" element={
                    <ProtectedRoute>
                      <RoleProtectedRoute requiredRole="employer">
                        <EmployerAnalytics />
                      </RoleProtectedRoute>
                    </ProtectedRoute>
                  } />

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </div>
              <Toaster />
            </RoleProvider>
          </Router>
        </AuthProvider>
      </QueryClientProvider>
    </AppErrorBoundary>
  );
}

export default App;

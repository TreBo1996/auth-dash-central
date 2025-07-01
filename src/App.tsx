
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Dashboard from '@/pages/Dashboard';
import Home from '@/pages/Home';
import JobSearch from '@/pages/JobSearch';
import { EmployerDashboard } from '@/pages/employer/EmployerDashboard';
import { AuthProvider } from '@/contexts/AuthContext';
import { RoleProvider } from '@/contexts/RoleContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { RoleProtectedRoute } from '@/components/auth/RoleProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <RoleProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/job-search" 
              element={
                <ProtectedRoute>
                  <JobSearch />
                </ProtectedRoute>
              } 
            />
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
          </Routes>
        </Router>
      </RoleProvider>
    </AuthProvider>
  );
}

export default App;

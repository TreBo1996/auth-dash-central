import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'
import { Account } from '@/components/Account'
import { Dashboard } from '@/pages/Dashboard';
import { Home } from '@/pages/Home';
import { JobSearch } from '@/pages/JobSearch';
import { EmployerDashboard } from '@/pages/employer/EmployerDashboard';
import { AuthProvider } from '@/contexts/AuthContext';
import { RoleProvider } from '@/contexts/RoleContext';

function App() {
  return (
    <AuthProvider>
      <RoleProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/job-search" element={<JobSearch />} />
             {/* Employer Routes - Example, add more as needed */}
            <Route path="/employer/dashboard" element={<EmployerDashboard />} />
          </Routes>
        </Router>
      </RoleProvider>
    </AuthProvider>
  );
}

export default App;


import React, { useState, useEffect } from 'react';
import { EmployerDashboardLayout } from '@/components/layout/EmployerDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FileText, Users, Eye, TrendingUp, Building } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardStats {
  activeJobs: number;
  totalApplications: number;
  viewsThisMonth: number;
  averageApplicationsPerJob: number;
}

export const EmployerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    activeJobs: 0,
    totalApplications: 0,
    viewsThisMonth: 0,
    averageApplicationsPerJob: 0
  });
  const [loading, setLoading] = useState(true);
  const [hasEmployerProfile, setHasEmployerProfile] = useState(false);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user) return;

      try {
        // Check if user has employer profile
        const { data: profileData } = await supabase
          .from('employer_profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();

        setHasEmployerProfile(!!profileData);

        if (profileData) {
          // Load job postings stats
          const { data: jobsData } = await supabase
            .from('job_postings')
            .select('id, view_count, application_count')
            .eq('employer_id', profileData.id)
            .eq('is_active', true);

          // Load applications stats
          const { data: applicationsData } = await supabase
            .from('job_applications')
            .select('id')
            .in('job_posting_id', jobsData?.map(j => j.id) || []);

          const activeJobs = jobsData?.length || 0;
          const totalApplications = applicationsData?.length || 0;
          const totalViews = jobsData?.reduce((sum, job) => sum + (job.view_count || 0), 0) || 0;

          setStats({
            activeJobs,
            totalApplications,
            viewsThisMonth: totalViews,
            averageApplicationsPerJob: activeJobs > 0 ? Math.round(totalApplications / activeJobs) : 0
          });
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user]);

  if (!hasEmployerProfile) {
    return (
      <EmployerDashboardLayout>
        <div className="text-center py-12">
          <h1 className="text-3xl font-bold mb-4">Welcome to Employer Portal</h1>
          <p className="text-muted-foreground mb-8">
            To get started, please create your company profile first.
          </p>
          <Button asChild size="lg">
            <Link to="/employer/profile">
              <Building className="h-5 w-5 mr-2" />
              Create Company Profile
            </Link>
          </Button>
        </div>
      </EmployerDashboardLayout>
    );
  }

  return (
    <EmployerDashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Employer Dashboard</h1>
            <p className="text-muted-foreground">
              Manage your job postings and track applications
            </p>
          </div>
          <Button asChild>
            <Link to="/employer/post-job">
              <Plus className="h-4 w-4 mr-2" />
              Post New Job
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Active Jobs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeJobs}</div>
              <p className="text-xs text-muted-foreground">
                Currently accepting applications
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Applications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalApplications}</div>
              <p className="text-xs text-muted-foreground">
                Applications received
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Job Views
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.viewsThisMonth}</div>
              <p className="text-xs text-muted-foreground">
                Total job views
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Avg Applications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageApplicationsPerJob}</div>
              <p className="text-xs text-muted-foreground">
                Per job posting
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button asChild className="w-full justify-start" variant="outline">
                <Link to="/employer/post-job">
                  <Plus className="h-4 w-4 mr-2" />
                  Post a New Job
                </Link>
              </Button>
              <Button asChild className="w-full justify-start" variant="outline">
                <Link to="/employer/applications">
                  <Users className="h-4 w-4 mr-2" />
                  Review Applications
                </Link>
              </Button>
              <Button asChild className="w-full justify-start" variant="outline">
                <Link to="/employer/job-postings">
                  <FileText className="h-4 w-4 mr-2" />
                  Manage Job Postings
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                No recent activity to display.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </EmployerDashboardLayout>
  );
};

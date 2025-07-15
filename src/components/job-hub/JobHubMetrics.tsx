import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  FileText, 
  Mail, 
  CheckCircle, 
  Award,
  TrendingUp,
  Target,
  Users
} from 'lucide-react';

interface JobHubMetricsProps {
  jobs: Array<{
    id: string;
    is_applied?: boolean;
    is_saved?: boolean;
    application_status?: string;
    created_at: string;
    optimized_resumes?: any[];
    cover_letters?: any[];
  }>;
}

export const JobHubMetrics: React.FC<JobHubMetricsProps> = ({ jobs }) => {
  const totalJobs = jobs.length;
  const pendingApplications = jobs.filter(job => 
    job.application_status === 'pending' || (!job.application_status && !job.is_applied)
  ).length;
  const appliedJobs = jobs.filter(job => 
    job.application_status === 'applied' || (job.is_applied && !job.application_status)
  ).length;
  const activeInterviews = jobs.filter(job => job.application_status === 'interviewing').length;
  const offersReceived = jobs.filter(job => job.application_status === 'offer').length;
  
  // Calculate jobs added this week
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const jobsThisWeek = jobs.filter(job => 
    new Date(job.created_at) >= oneWeekAgo
  ).length;
  
  const jobsWithCompleteStack = jobs.filter(job => 
    job.optimized_resumes && job.optimized_resumes.length > 0 &&
    job.cover_letters && job.cover_letters.length > 0
  ).length;

  // Calculate average ATS score
  const allResumesWithScores = jobs.flatMap(job => 
    job.optimized_resumes?.filter(resume => resume.ats_score) || []
  );
  const averageAtsScore = allResumesWithScores.length > 0 
    ? Math.round(allResumesWithScores.reduce((sum, resume) => sum + resume.ats_score, 0) / allResumesWithScores.length)
    : 0;

  // Calculate success rate (offers / total applied)
  const successRate = appliedJobs > 0 ? Math.round((offersReceived / appliedJobs) * 100) : 0;

  const metrics = [
    {
      title: 'Jobs in Pipeline',
      value: totalJobs,
      icon: FileText,
      color: 'bg-blue-500',
      description: 'Total jobs being tracked'
    },
    {
      title: 'Saved Jobs',
      value: pendingApplications,
      icon: TrendingUp,
      color: 'bg-orange-500',
      description: 'Jobs ready for application'
    },
    {
      title: 'Applications Submitted',
      value: appliedJobs,
      icon: CheckCircle,
      color: 'bg-green-500',
      description: 'Jobs you\'ve applied to'
    },
    {
      title: 'Active Interviews',
      value: activeInterviews,
      icon: Users,
      color: 'bg-purple-500',
      description: 'Interview processes ongoing'
    },
    {
      title: 'Offers Received',
      value: offersReceived,
      icon: Award,
      color: 'bg-emerald-500',
      description: 'Job offers received'
    },
    {
      title: 'Success Rate',
      value: successRate > 0 ? `${successRate}%` : 'N/A',
      icon: Target,
      color: 'bg-indigo-500',
      description: 'Offer rate from applications'
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
      {metrics.map((metric, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600 leading-tight">
              {metric.title}
            </CardTitle>
            <div className={`p-1.5 sm:p-2 rounded-full ${metric.color} flex-shrink-0`}>
              <metric.icon className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-lg sm:text-2xl font-bold text-gray-900 mb-1">
              {metric.value}
            </div>
            <p className="text-xs text-gray-500 leading-tight sm:leading-normal">
              {metric.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
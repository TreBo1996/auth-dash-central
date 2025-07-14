import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  FileText, 
  Mail, 
  CheckCircle, 
  Award,
  TrendingUp,
  Target
} from 'lucide-react';

interface JobHubMetricsProps {
  jobs: Array<{
    id: string;
    is_applied?: boolean;
    is_saved?: boolean;
    optimized_resumes?: any[];
    cover_letters?: any[];
  }>;
}

export const JobHubMetrics: React.FC<JobHubMetricsProps> = ({ jobs }) => {
  const totalJobs = jobs.length;
  const savedJobs = jobs.filter(job => job.is_saved).length;
  const appliedJobs = jobs.filter(job => job.is_applied).length;
  
  const totalOptimizedResumes = jobs.reduce((count, job) => {
    return count + (job.optimized_resumes?.length || 0);
  }, 0);
  
  const totalCoverLetters = jobs.reduce((count, job) => {
    return count + (job.cover_letters?.length || 0);
  }, 0);
  
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

  const metrics = [
    {
      title: 'Total Jobs Tracked',
      value: totalJobs,
      icon: FileText,
      color: 'bg-blue-500',
      description: 'Job descriptions in your pipeline'
    },
    {
      title: 'Applications Submitted',
      value: appliedJobs,
      icon: CheckCircle,
      color: 'bg-green-500',
      description: 'Jobs you\'ve applied to'
    },
    {
      title: 'Optimized Resumes',
      value: totalOptimizedResumes,
      icon: FileText,
      color: 'bg-purple-500',
      description: 'ATS-optimized resumes generated'
    },
    {
      title: 'Cover Letters',
      value: totalCoverLetters,
      icon: Mail,
      color: 'bg-orange-500',
      description: 'Personalized cover letters created'
    },
    {
      title: 'Average ATS Score',
      value: averageAtsScore > 0 ? `${averageAtsScore}%` : 'N/A',
      icon: Award,
      color: 'bg-yellow-500',
      description: 'Average resume optimization score'
    },
    {
      title: 'Complete Stacks',
      value: jobsWithCompleteStack,
      icon: Target,
      color: 'bg-indigo-500',
      description: 'Jobs with both resume & cover letter'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {metrics.map((metric, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {metric.title}
            </CardTitle>
            <div className={`p-2 rounded-full ${metric.color}`}>
              <metric.icon className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {metric.value}
            </div>
            <p className="text-xs text-gray-500">
              {metric.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
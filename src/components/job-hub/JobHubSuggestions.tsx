import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Lightbulb, 
  TrendingUp, 
  Target,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Layers,
  BookOpen
} from 'lucide-react';

interface JobHubSuggestionsProps {
  jobs: Array<{
    id: string;
    title: string;
    is_applied?: boolean;
    is_saved?: boolean;
    application_status?: string;
    optimized_resumes?: any[];
    cover_letters?: any[];
  }>;
}

export const JobHubSuggestions: React.FC<JobHubSuggestionsProps> = ({ jobs }) => {
  const navigate = useNavigate();
  
  const generateSuggestions = () => {
    const suggestions = [];
    
    // Application Stack Education - for users who need to understand what they are
    const totalJobs = jobs.length;
    const completeStacks = jobs.filter(job => 
      job.optimized_resumes && job.optimized_resumes.length > 0 &&
      job.cover_letters && job.cover_letters.length > 0
    );
    const savedJobs = jobs.filter(job => job.application_status === 'pending' || job.is_saved);
    
    // Show Application Stack education if:
    // - User has saved jobs but no complete stacks, OR
    // - User is new (< 3 jobs total), OR  
    // - User has very few complete stacks compared to saved jobs
    const shouldShowEducation = (
      (savedJobs.length > 0 && completeStacks.length === 0) ||
      (totalJobs > 0 && totalJobs < 3) ||
      (savedJobs.length > 2 && completeStacks.length < savedJobs.length * 0.3)
    );
    
    if (shouldShowEducation) {
      suggestions.push({
        type: 'education',
        icon: Layers,
        title: 'What Are Application Stacks?',
        description: 'An Application Stack is your optimized resume + personalized cover letter for each job. They increase your ATS scores by 40% and triple your interview chances through job-specific customization.',
        action: 'Create Your First Stack',
        actionUrl: '/upload-resume',
        priority: 0
      });
    }
    
    // Incomplete application stacks
    const incompleteStacks = jobs.filter(job => {
      const hasResume = job.optimized_resumes && job.optimized_resumes.length > 0;
      const hasCoverLetter = job.cover_letters && job.cover_letters.length > 0;
      return job.is_saved && (!hasResume || !hasCoverLetter);
    });

    if (incompleteStacks.length > 0) {
      suggestions.push({
        type: 'warning',
        icon: AlertTriangle,
        title: 'Complete Your Application Stacks',
        description: `You have ${incompleteStacks.length} saved job${incompleteStacks.length > 1 ? 's' : ''} without complete application stacks.`,
        action: 'Complete Now',
        actionUrl: '/upload-resume',
        priority: 1
      });
    }

    // Low ATS scores
    const lowAtsJobs = jobs.filter(job => 
      job.optimized_resumes?.some(resume => resume.ats_score && resume.ats_score < 70)
    );

    if (lowAtsJobs.length > 0) {
      suggestions.push({
        type: 'info',
        icon: TrendingUp,
        title: 'Improve Your ATS Scores',
        description: `${lowAtsJobs.length} of your resumes scored below 70%. Consider optimizing them for better ATS compatibility.`,
        action: 'Optimize Resumes',
        actionUrl: '/upload-resume',
        priority: 2
      });
    }

    // Saved but not applied
    const savedNotApplied = jobs.filter(job => job.is_saved && !job.is_applied);
    
    if (savedNotApplied.length > 3) {
      suggestions.push({
        type: 'success',
        icon: Target,
        title: 'Ready to Apply',
        description: `You have ${savedNotApplied.length} saved jobs. Consider applying to some of them to increase your opportunities.`,
        action: 'Review Jobs',
        actionUrl: '/job-hub',
        priority: 3
      });
    }

    // Job search activity
    if (jobs.length === 0) {
      suggestions.push({
        type: 'info',
        icon: Lightbulb,
        title: 'Start Your Job Hunt',
        description: 'Upload job descriptions or search for positions to begin tracking your applications.',
        action: 'Find Jobs',
        actionUrl: '/job-search',
        priority: 1
      });
    } else if (jobs.length < 5) {
      suggestions.push({
        type: 'info',
        icon: Lightbulb,
        title: 'Expand Your Pipeline',
        description: 'Consider adding more job opportunities to increase your chances of landing interviews.',
        action: 'Search More Jobs',
        actionUrl: '/job-search',
        priority: 4
      });
    }

    // Success message for complete stacks
    if (completeStacks.length > 0 && suggestions.length === 0) {
      suggestions.push({
        type: 'success',
        icon: CheckCircle,
        title: 'Great Job!',
        description: `You have ${completeStacks.length} complete application stack${completeStacks.length > 1 ? 's' : ''}. You're well-prepared for applications.`,
        action: 'Find More Jobs',
        actionUrl: '/job-search',
        priority: 5
      });
    }

    return suggestions.sort((a, b) => a.priority - b.priority).slice(0, 3);
  };

  const suggestions = generateSuggestions();

  if (suggestions.length === 0) {
    return null;
  }

  const getAlertVariant = (type: string) => {
    switch (type) {
      case 'warning': return 'destructive';
      case 'success': return 'default';
      default: return 'default';
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'warning': return 'text-red-500';
      case 'success': return 'text-green-500';
      case 'info': return 'text-blue-500';
      case 'education': return 'text-purple-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3 sm:pb-6">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Lightbulb className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
          Smart Suggestions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4">
        {suggestions.map((suggestion, index) => (
          <Alert key={index} variant={getAlertVariant(suggestion.type)}>
            <suggestion.icon className={`h-4 w-4 ${getIconColor(suggestion.type)}`} />
            <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex-1">
                <div className="font-medium mb-1 text-sm sm:text-base">{suggestion.title}</div>
                <div className="text-xs sm:text-sm leading-tight">{suggestion.description}</div>
              </div>
              <Button 
                size="sm" 
                variant={suggestion.type === 'warning' ? 'destructive' : 'default'}
                onClick={() => navigate(suggestion.actionUrl)}
                className="w-full sm:w-auto whitespace-nowrap text-xs sm:text-sm"
              >
                {suggestion.action}
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </AlertDescription>
          </Alert>
        ))}
      </CardContent>
    </Card>
  );
};
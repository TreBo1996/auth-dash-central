
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { JobCard } from './JobCard';
import { Loader2, Search, Briefcase } from 'lucide-react';

interface Job {
  title: string;
  company: string;
  location: string;
  description: string;
  salary: string | null;
  posted_at: string;
  job_url: string;
  source: string;
  via: string;
  thumbnail?: string;
}

interface JobSearchResultsProps {
  jobs: Job[];
  loading: boolean;
  searchPerformed: boolean;
}

export const JobSearchResults: React.FC<JobSearchResultsProps> = ({ 
  jobs, 
  loading, 
  searchPerformed 
}) => {
  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Searching for jobs...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!searchPerformed) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Enter a job title or keywords to start searching
          </p>
        </CardContent>
      </Card>
    );
  }

  if (jobs.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            No jobs found. Try adjusting your search terms or location.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          Found {jobs.length} job{jobs.length !== 1 ? 's' : ''}
        </h2>
      </div>
      
      <div className="space-y-4">
        {jobs.map((job, index) => (
          <JobCard key={index} job={job} />
        ))}
      </div>
    </div>
  );
};

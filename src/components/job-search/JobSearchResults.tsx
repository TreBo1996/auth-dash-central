
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { JobCard } from './JobCard';
import { JobSearchPagination } from './JobSearchPagination';
import { Loader2, Search, Briefcase, AlertTriangle } from 'lucide-react';

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
  job_type?: string | null;
  experience_level?: string | null;
}

interface JobSearchResultsProps {
  jobs: Job[];
  loading: boolean;
  searchPerformed: boolean;
  pagination?: {
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    totalResults: number;
    resultsPerPage: number;
  };
  warnings?: string[];
  onPageChange?: (page: number) => void;
}

export const JobSearchResults: React.FC<JobSearchResultsProps> = ({ 
  jobs, 
  loading, 
  searchPerformed,
  pagination,
  warnings = [],
  onPageChange
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
            No jobs found. Try adjusting your search terms, location, or filters.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {warnings.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {warnings.join('. ')}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          {pagination ? `${pagination.totalResults} job${pagination.totalResults !== 1 ? 's' : ''} found` : `Found ${jobs.length} job${jobs.length !== 1 ? 's' : ''}`}
        </h2>
      </div>
      
      <div className="space-y-4">
        {jobs.map((job, index) => (
          <JobCard key={`${job.job_url}-${index}`} job={job} />
        ))}
      </div>

      {pagination && onPageChange && (
        <JobSearchPagination
          pagination={pagination}
          onPageChange={onPageChange}
          loading={loading}
        />
      )}
    </div>
  );
};

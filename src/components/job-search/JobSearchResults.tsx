
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { JobCard } from './JobCard';
import { JobSearchPagination } from './JobSearchPagination';
import { Loader2, Search, Briefcase, AlertTriangle } from 'lucide-react';
import { UnifiedJob } from '@/types/job';

interface JobSearchResultsProps {
  jobs: UnifiedJob[];
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
        <div>
          <h2 className="text-xl font-semibold">
            {pagination ? 
              `Showing ${((pagination.currentPage - 1) * pagination.resultsPerPage) + 1}-${Math.min(pagination.currentPage * pagination.resultsPerPage, pagination.totalResults)} Jobs` : 
              `Found ${jobs.length} job${jobs.length !== 1 ? 's' : ''}`
            }
          </h2>
          {pagination && pagination.totalResults > pagination.resultsPerPage && (
            <p className="text-sm text-muted-foreground mt-1">
              {pagination.totalResults} total results found
            </p>
          )}
        </div>
      </div>
      
      <div className="space-y-4">
        {jobs.map((job, index) => (
          <JobCard key={`${job.id}-${index}`} job={job} />
        ))}
      </div>

      {pagination && onPageChange && pagination.totalPages > 1 && (
        <JobSearchPagination
          pagination={pagination}
          onPageChange={onPageChange}
          loading={loading}
        />
      )}
    </div>
  );
};

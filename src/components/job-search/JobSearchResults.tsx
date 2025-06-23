
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { JobCard } from './JobCard';
import { JobSearchPagination } from './JobSearchPagination';
import { Loader2, Search, Briefcase, AlertTriangle, Plus } from 'lucide-react';

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
  totalAvailable?: number;
  canLoadMore?: boolean;
  onLoadMore?: () => void;
  loadingMore?: boolean;
  searchVariationsUsed?: string[];
}

export const JobSearchResults: React.FC<JobSearchResultsProps> = ({ 
  jobs, 
  loading, 
  searchPerformed,
  pagination,
  warnings = [],
  onPageChange,
  totalAvailable,
  canLoadMore = false,
  onLoadMore,
  loadingMore = false,
  searchVariationsUsed = []
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
            {pagination ? `Showing ${((pagination.currentPage - 1) * pagination.resultsPerPage) + 1}-${Math.min(pagination.currentPage * pagination.resultsPerPage, pagination.totalResults)} of ${pagination.totalResults} jobs` : `Found ${jobs.length} job${jobs.length !== 1 ? 's' : ''}`}
          </h2>
          {totalAvailable && totalAvailable > pagination?.totalResults && (
            <p className="text-sm text-muted-foreground mt-1">
              ({totalAvailable.toLocaleString()} total results available from search)
            </p>
          )}
          {searchVariationsUsed.length > 0 && (
            <p className="text-sm text-blue-600 mt-1">
              Enhanced search using {searchVariationsUsed.length} variation{searchVariationsUsed.length !== 1 ? 's' : ''}: {searchVariationsUsed.slice(-2).join(', ')}
            </p>
          )}
        </div>
      </div>
      
      <div className="space-y-4">
        {jobs.map((job, index) => (
          <JobCard key={`${job.job_url}-${index}`} job={job} />
        ))}
      </div>

      {/* Load More Section */}
      {canLoadMore && onLoadMore && (
        <div className="flex justify-center py-6">
          <Button 
            onClick={onLoadMore} 
            disabled={loadingMore}
            variant="outline"
            size="lg"
            className="gap-2"
          >
            {loadingMore ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading more jobs...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Load More Jobs
              </>
            )}
          </Button>
        </div>
      )}

      {/* Search Enhancement Tips */}
      {!canLoadMore && pagination && pagination.totalResults < 50 && !loadingMore && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-4">
            <h3 className="font-medium text-blue-900 mb-2">Tips to find more jobs:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Try broader search terms (e.g., "Manager" instead of "Project Manager")</li>
              <li>• Search without location restrictions</li>
              <li>• Use different job titles or synonyms</li>
              <li>• Adjust date filters to include older postings</li>
            </ul>
          </CardContent>
        </Card>
      )}

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


import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface JobSearchPaginationProps {
  pagination: {
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    totalResults: number;
    resultsPerPage: number;
  };
  onPageChange: (page: number) => void;
  loading: boolean;
}

export const JobSearchPagination: React.FC<JobSearchPaginationProps> = ({
  pagination,
  onPageChange,
  loading
}) => {
  const { currentPage, totalPages, hasNextPage, hasPreviousPage, totalResults, resultsPerPage } = pagination;

  const startResult = (currentPage - 1) * resultsPerPage + 1;
  const endResult = Math.min(currentPage * resultsPerPage, totalResults);

  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
      <div className="text-sm text-muted-foreground">
        Showing {startResult}-{endResult} of {totalResults} results
      </div>
      
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!hasPreviousPage || loading}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>

        {getVisiblePages().map((page, index) => (
          <React.Fragment key={index}>
            {page === '...' ? (
              <span className="px-2 text-muted-foreground">...</span>
            ) : (
              <Button
                variant={page === currentPage ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(page as number)}
                disabled={loading}
                className="min-w-[40px]"
              >
                {page}
              </Button>
            )}
          </React.Fragment>
        ))}

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!hasNextPage || loading}
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
};

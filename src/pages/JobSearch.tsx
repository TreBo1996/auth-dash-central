
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { JobSearchSidebar } from '@/components/job-search/JobSearchSidebar';
import { CompactJobCard } from '@/components/job-search/CompactJobCard';
import { JobSearchPagination } from '@/components/job-search/JobSearchPagination';
import { AdSidebar } from '@/components/ads/AdSidebar';
import { GoogleAd } from '@/components/ads/GoogleAd';
import { Card, CardContent } from '@/components/ui/card';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Search, Briefcase, AlertTriangle } from 'lucide-react';
import { UnifiedJob } from '@/types/job';
import { useOptimizedJobSearch } from '@/hooks/useOptimizedJobSearch';
import { AnimatedSection } from '@/components/common/AnimatedSection';

interface JobSearchFilters {
  query: string;
  location: string;
  remoteType?: string;
  employmentType?: string;
  seniorityLevel?: string;
  company?: string;
  maxAge?: number;
}

const JOBS_PER_PAGE = 10;
const SEARCH_STATE_KEY = 'job-search-state';

export const JobSearch: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [allJobs, setAllJobs] = useState<UnifiedJob[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [currentFilters, setCurrentFilters] = useState<JobSearchFilters | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  
  // Use the optimized search hook
  const { searchJobs, loading } = useOptimizedJobSearch();

  // State persistence utilities
  const saveSearchState = (filters: JobSearchFilters, jobs: UnifiedJob[], page: number, performed: boolean, warnings: string[]) => {
    try {
      const state = {
        filters,
        jobs,
        currentPage: page,
        searchPerformed: performed,
        warnings,
        timestamp: Date.now()
      };
      sessionStorage.setItem(SEARCH_STATE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save search state:', error);
    }
  };

  const loadSearchState = () => {
    try {
      const saved = sessionStorage.getItem(SEARCH_STATE_KEY);
      if (saved) {
        const state = JSON.parse(saved);
        // Return state if it's less than 30 minutes old
        if (Date.now() - state.timestamp < 30 * 60 * 1000) {
          return state;
        }
      }
    } catch (error) {
      console.error('Failed to load search state:', error);
    }
    return null;
  };

  const updateURLParams = (filters: JobSearchFilters, page: number) => {
    const newParams = new URLSearchParams();
    if (filters.query) newParams.set('q', filters.query);
    if (filters.location) newParams.set('location', filters.location);
    if (filters.remoteType) newParams.set('remote', filters.remoteType);
    if (filters.employmentType) newParams.set('type', filters.employmentType);
    if (filters.seniorityLevel) newParams.set('level', filters.seniorityLevel);
    if (filters.company) newParams.set('company', filters.company);
    if (page > 1) newParams.set('page', page.toString());
    
    setSearchParams(newParams, { replace: true });
  };

  const getFiltersFromURL = (): JobSearchFilters | null => {
    const query = searchParams.get('q');
    const location = searchParams.get('location');
    
    if (query || location) {
      return {
        query: query || '',
        location: location || '',
        remoteType: searchParams.get('remote') || undefined,
        employmentType: searchParams.get('type') || undefined,
        seniorityLevel: searchParams.get('level') || undefined,
        company: searchParams.get('company') || undefined
      };
    }
    return null;
  };

  const formatSalary = (min: number, max: number, currency: string) => {
    if (min && max) {
      return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()}`;
    } else if (min) {
      return `${currency} ${min.toLocaleString()}+`;
    } else if (max) {
      return `Up to ${currency} ${max.toLocaleString()}`;
    }
    return null;
  };

  const handleSearch = async (searchFilters: JobSearchFilters) => {
    const newPage = 1;
    setCurrentPage(newPage);
    setCurrentFilters(searchFilters);
    
    try {
      // Use optimized search
      const searchResult = await searchJobs(searchFilters);
      
      setAllJobs(searchResult.jobs);
      setWarnings(searchResult.warnings);
      setSearchPerformed(true);
      
      // Save state and update URL
      saveSearchState(searchFilters, searchResult.jobs, newPage, true, searchResult.warnings);
      updateURLParams(searchFilters, newPage);
      
    } catch (error) {
      console.error('Search error:', error);
      const errorWarnings = ['Search failed. Please try again.'];
      setAllJobs([]);
      setWarnings(errorWarnings);
      setSearchPerformed(true);
      
      // Save error state
      saveSearchState(searchFilters, [], newPage, true, errorWarnings);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    
    // Update URL and save state
    if (currentFilters) {
      updateURLParams(currentFilters, page);
      saveSearchState(currentFilters, allJobs, page, searchPerformed, warnings);
    }
    
    // Scroll to the results section
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Restore state on component mount
  useEffect(() => {
    // Check URL parameters first
    const urlFilters = getFiltersFromURL();
    const urlPage = parseInt(searchParams.get('page') || '1');
    
    if (urlFilters) {
      // User came with URL parameters - perform search
      setCurrentFilters(urlFilters);
      setCurrentPage(urlPage);
      handleSearch(urlFilters);
      return;
    }
    
    // Check saved state
    const savedState = loadSearchState();
    if (savedState) {
      setCurrentFilters(savedState.filters);
      setAllJobs(savedState.jobs);
      setCurrentPage(savedState.currentPage);
      setSearchPerformed(savedState.searchPerformed);
      setWarnings(savedState.warnings);
      
      // Update URL to match restored state
      updateURLParams(savedState.filters, savedState.currentPage);
    }
  }, []); // Only run on mount

  // Calculate pagination
  const totalJobs = allJobs.length;
  const totalPages = Math.ceil(totalJobs / JOBS_PER_PAGE);
  const startIndex = (currentPage - 1) * JOBS_PER_PAGE;
  const endIndex = startIndex + JOBS_PER_PAGE;
  const currentJobs = allJobs.slice(startIndex, endIndex);

  const pagination = totalJobs > 0 ? {
    currentPage,
    totalPages,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
    totalResults: totalJobs,
    resultsPerPage: JOBS_PER_PAGE
  } : null;

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <AnimatedSection delay={0}>
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">Find Your Next Job</h1>
            <p className="text-muted-foreground">Search from thousands of curated job opportunities</p>
          </div>
        </AnimatedSection>

        {/* Top Banner Ad */}
        <AnimatedSection delay={50}>
          <div className="mb-6">
            <GoogleAd 
              adSlot="9999999999"
              adFormat="horizontal"
              className="w-full h-[90px]"
            />
          </div>
        </AnimatedSection>

        {/* Three Column Layout */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left Sidebar - Search Filters */}
          <AnimatedSection delay={100} className="col-span-12 lg:col-span-3">
            <div className="lg:sticky lg:top-6">
              <JobSearchSidebar 
                onSearch={handleSearch} 
                loading={loading}
                filters={currentFilters || undefined}
              />
            </div>
          </AnimatedSection>

          {/* Main Content - Job Results */}
          <AnimatedSection delay={150} className="col-span-12 lg:col-span-6">
            <div ref={resultsRef} className="space-y-4 scroll-mt-4">
              {/* Results Header */}
              {searchPerformed && !loading && (
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold">
                      {pagination ? 
                        `Showing ${((pagination.currentPage - 1) * pagination.resultsPerPage) + 1}-${Math.min(pagination.currentPage * pagination.resultsPerPage, pagination.totalResults)} of ${pagination.totalResults} jobs` : 
                        `Found ${totalJobs} job${totalJobs !== 1 ? 's' : ''}`
                      }
                    </h2>
                  </div>
                </div>
              )}

              {/* Warnings */}
              {warnings.length > 0 && (
                <Alert className="mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {warnings.join('. ')}
                  </AlertDescription>
                </Alert>
              )}

              {/* Loading State */}
              {loading && (
                <Card>
                  <CardContent className="py-8">
                    <div className="flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      <span>Searching for jobs...</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Initial State */}
              {!searchPerformed && !loading && (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Start Your Job Search</h3>
                    <p className="text-muted-foreground">
                      Use the filters on the left to find your perfect job opportunity
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* No Results */}
              {searchPerformed && totalJobs === 0 && !loading && (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Jobs Found</h3>
                    <p className="text-muted-foreground">
                      Try adjusting your search criteria or explore different keywords
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Job Results */}
              {currentJobs.length > 0 && (
                <div className="space-y-3">
                  {currentJobs.map((job, index) => (
                    <React.Fragment key={`${job.id}-${index}`}>
                      <CompactJobCard job={job} />
                      {/* Inline Ad every 5 jobs */}
                      {(index + 1) % 5 === 0 && index < currentJobs.length - 1 && (
                        <GoogleAd 
                          adSlot="5555555555"
                          adFormat="horizontal"
                          className="w-full h-[100px] my-4"
                        />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="mt-6">
                  <JobSearchPagination
                    pagination={pagination}
                    onPageChange={handlePageChange}
                    loading={loading}
                  />
                </div>
              )}
            </div>
          </AnimatedSection>

          {/* Right Sidebar - Ads and Content */}
          <AnimatedSection delay={200} className="col-span-12 lg:col-span-3">
            <div className="lg:sticky lg:top-6">
              <AdSidebar />
            </div>
          </AnimatedSection>
        </div>
      </div>
    </DashboardLayout>
  );
};

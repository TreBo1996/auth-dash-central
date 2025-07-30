
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CollapsibleFilters } from '@/components/job-search/CollapsibleFilters';
import { MiniJobCard } from '@/components/job-search/MiniJobCard';
import { CompactJobCard } from '@/components/job-search/CompactJobCard';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
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

const JOBS_PER_BATCH = 50;
const SEARCH_STATE_KEY = 'job-search-state';

export const JobSearch: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [allJobs, setAllJobs] = useState<UnifiedJob[]>([]);
  const [miniJobs, setMiniJobs] = useState<UnifiedJob[]>([]);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [currentFilters, setCurrentFilters] = useState<JobSearchFilters | null>(null);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [totalJobs, setTotalJobs] = useState(0);
  const [hasMoreJobs, setHasMoreJobs] = useState(true);
  const [hasMoreMiniJobs, setHasMoreMiniJobs] = useState(true);
  const resultsRef = useRef<HTMLDivElement>(null);
  const miniJobsRef = useRef<HTMLDivElement>(null);
  
  // Use the optimized search hook
  const { searchJobs, loading } = useOptimizedJobSearch();

  // State persistence utilities
  const saveSearchState = (filters: JobSearchFilters, jobs: UnifiedJob[], performed: boolean, warnings: string[]) => {
    try {
      const state = {
        filters,
        jobs,
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

  const updateURLParams = (filters: JobSearchFilters) => {
    const newParams = new URLSearchParams();
    if (filters.query) newParams.set('q', filters.query);
    if (filters.location) newParams.set('location', filters.location);
    if (filters.remoteType) newParams.set('remote', filters.remoteType);
    if (filters.employmentType) newParams.set('type', filters.employmentType);
    if (filters.seniorityLevel) newParams.set('level', filters.seniorityLevel);
    if (filters.company) newParams.set('company', filters.company);
    
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
    setCurrentFilters(searchFilters);
    setAllJobs([]);
    setMiniJobs([]);
    setExpandedJobId(null);
    setHasMoreJobs(false);
    setHasMoreMiniJobs(false);
    
    try {
      // Load ALL results at once (no pagination limits)
      const searchResult = await searchJobs(searchFilters, 0, 1000); // High limit to get all results
      
      setAllJobs(searchResult.jobs);
      setMiniJobs(searchResult.jobs); // All jobs for mini view
      setTotalJobs(searchResult.total);
      setWarnings(searchResult.warnings);
      setSearchPerformed(true);
      
      // Save state and update URL
      saveSearchState(searchFilters, searchResult.jobs, true, searchResult.warnings);
      updateURLParams(searchFilters);
      
    } catch (error) {
      console.error('Search error:', error);
      const errorWarnings = ['Search failed. Please try again.'];
      setAllJobs([]);
      setMiniJobs([]);
      setWarnings(errorWarnings);
      setSearchPerformed(true);
      
      // Save error state
      saveSearchState(searchFilters, [], true, errorWarnings);
    }
  };

  // Remove load more functions since we're loading all results at once

  const handleMiniJobSelect = (selectedJob: UnifiedJob) => {
    // Find the job in all jobs and scroll to it
    const jobElement = document.getElementById(`job-${selectedJob.id}`);
    if (jobElement) {
      jobElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setExpandedJobId(selectedJob.id);
      }
  };

  // Remove infinite scroll since we're loading all results at once

  // Restore state on component mount
  useEffect(() => {
    // Check URL parameters first
    const urlFilters = getFiltersFromURL();
    
    if (urlFilters) {
      // User came with URL parameters - perform search
      setCurrentFilters(urlFilters);
      handleSearch(urlFilters);
      return;
    }
    
    // Check saved state
    const savedState = loadSearchState();
    if (savedState) {
      setCurrentFilters(savedState.filters);
      setAllJobs(savedState.jobs);
      setMiniJobs(savedState.jobs);
      setSearchPerformed(savedState.searchPerformed);
      setWarnings(savedState.warnings);
      setTotalJobs(savedState.jobs.length);
      
      // Update URL to match restored state
      updateURLParams(savedState.filters);
    }
  }, []); // Only run on mount

  // No pagination needed for infinite scroll

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
        <div className="grid grid-cols-12 gap-6 job-search-container">
          {/* Left Sidebar - Search Filters & Mini Jobs */}
          <AnimatedSection delay={100} className="col-span-12 lg:col-span-3 flex flex-col h-full">
            <div className="space-y-4 flex flex-col h-full">
              <div className="flex-shrink-0">
                <CollapsibleFilters 
                  onSearch={handleSearch} 
                  loading={loading}
                  filters={currentFilters || undefined}
                />
              </div>
              
              {/* Mini Job Cards with Fixed Height */}
              {miniJobs.length > 0 && (
                <div className="space-y-3 flex-1 flex flex-col min-h-0" ref={miniJobsRef}>
                  <h3 className="text-sm font-medium text-muted-foreground px-1 flex-shrink-0">Quick Jobs</h3>
                  <div className="space-y-3 scrollbar-hide flex-1 overflow-y-auto min-h-0">
                    {miniJobs.map((job, index) => (
                      <div key={`mini-${job.id}-${index}`}>
                        <MiniJobCard job={job} onJobSelect={handleMiniJobSelect} />
                        {/* In-feed ad after every 5 mini jobs */}
                        {(index + 1) % 5 === 0 && (
                          <GoogleAd 
                            adSlot="3333333333"
                            adFormat="rectangle"
                            className="w-full h-[100px]"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </AnimatedSection>

          {/* Main Content - Job Results */}
          <AnimatedSection delay={150} className="col-span-12 lg:col-span-6 flex flex-col h-full">
            <div className="space-y-4 flex flex-col h-full">
              {/* Results Header */}
              <div className="flex-shrink-0">
                {searchPerformed && !loading && (
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-semibold">
                        {`Showing ${allJobs.length} of ${totalJobs} job${totalJobs !== 1 ? 's' : ''}`}
                      </h2>
                    </div>
                  </div>
                )}
              </div>
              
              <div 
                ref={resultsRef} 
                className="space-y-4 scroll-mt-4 flex-1 overflow-y-auto scrollbar-hide min-h-0"
              >
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
                {searchPerformed && allJobs.length === 0 && !loading && (
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

                {/* Job Results with Infinite Scroll */}
                {allJobs.length > 0 && (
                  <div className="space-y-3">
                     {allJobs.map((job, index) => (
                       <div key={`${job.id}-${index}`}>
                         <CompactJobCard 
                           job={job} 
                           id={`job-${job.id}`}
                           isExpanded={expandedJobId === job.id}
                           onExpandChange={(expanded) => setExpandedJobId(expanded ? job.id : null)}
                         />
                         {/* Inline Ad every 8 jobs */}
                         {(index + 1) % 8 === 0 && (
                           <GoogleAd 
                             adSlot="5555555555"
                             adFormat="horizontal"
                             className="w-full h-[100px] my-4"
                           />
                         )}
                       </div>
                     ))}
                  </div>
                )}
              </div>
            </div>
          </AnimatedSection>

          {/* Right Sidebar - Ads and Content */}
          <AnimatedSection delay={200} className="col-span-12 lg:col-span-3 flex flex-col h-full">
            <div className="flex-1 overflow-y-auto scrollbar-hide min-h-0">
              <AdSidebar />
            </div>
          </AnimatedSection>
        </div>
      </div>
    </DashboardLayout>
  );
};

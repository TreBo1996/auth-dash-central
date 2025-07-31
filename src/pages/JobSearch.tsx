import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CollapsibleFilters } from '@/components/job-search/CollapsibleFilters';
import { MiniJobCard } from '@/components/job-search/MiniJobCard';
import { CompactJobCard } from '@/components/job-search/CompactJobCard';
import { AdSidebar } from '@/components/ads/AdSidebar';
import { GoogleAd } from '@/components/ads/GoogleAd';
import { Card, CardContent } from '@/components/ui/card';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Search, Briefcase, AlertTriangle } from 'lucide-react';
import { UnifiedJob } from '@/types/job';
import { useOptimizedJobSearch } from '@/hooks/useOptimizedJobSearch';

interface JobSearchFilters {
  query: string;
  location: string;
  remoteType?: string;
  employmentType?: string;
  seniorityLevel?: string;
  company?: string;
  maxAge?: number;
}

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

  const handleSearch = async (searchFilters: JobSearchFilters) => {
    setCurrentFilters(searchFilters);
    setAllJobs([]);
    setMiniJobs([]);
    setExpandedJobId(null);
    
    try {
      const searchResult = await searchJobs(searchFilters, 0, 1000);
      
      setAllJobs(searchResult.jobs);
      setMiniJobs(searchResult.jobs);
      setTotalJobs(searchResult.total);
      setWarnings(searchResult.warnings);
      setSearchPerformed(true);
      
      saveSearchState(searchFilters, searchResult.jobs, true, searchResult.warnings);
      updateURLParams(searchFilters);
      
    } catch (error) {
      console.error('Search error:', error);
      const errorWarnings = ['Search failed. Please try again.'];
      setAllJobs([]);
      setMiniJobs([]);
      setWarnings(errorWarnings);
      setSearchPerformed(true);
      
      saveSearchState(searchFilters, [], true, errorWarnings);
    }
  };

  const handleMiniJobSelect = (selectedJob: UnifiedJob) => {
    const jobElement = document.getElementById(`job-${selectedJob.id}`);
    if (jobElement) {
      // First collapse any currently expanded job
      setExpandedJobId(null);
      
      // Wait for layout to stabilize, then scroll and expand
      setTimeout(() => {
        jobElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setExpandedJobId(selectedJob.id);
      }, 100);
    }
  };

  // Restore state on component mount
  useEffect(() => {
    const urlFilters = getFiltersFromURL();
    
    if (urlFilters) {
      setCurrentFilters(urlFilters);
      handleSearch(urlFilters);
      return;
    }
    
    const savedState = loadSearchState();
    if (savedState) {
      setCurrentFilters(savedState.filters);
      setAllJobs(savedState.jobs);
      setMiniJobs(savedState.jobs);
      setSearchPerformed(savedState.searchPerformed);
      setWarnings(savedState.warnings);
      setTotalJobs(savedState.jobs.length);
      updateURLParams(savedState.filters);
    }
  }, []);

  return (
    <DashboardLayout>
      <div className="job-search-page">
        {/* Header Section */}
        <div className="job-search-fixed-section px-6 py-4">
          <div className="mb-4">
            <h1 className="text-2xl font-bold mb-2">Find Your Next Job</h1>
            <p className="text-muted-foreground">Search from thousands of curated job opportunities</p>
          </div>
          
        </div>

        {/* Three Column Grid */}
        <div className="job-search-grid px-6">
          {/* Left Column - Filters & Quick Jobs */}
          <div className="job-search-column">
            {/* Search Filters - Fixed */}
            <div className="job-search-fixed-section mb-4">
              <CollapsibleFilters 
                onSearch={handleSearch} 
                loading={loading}
                filters={currentFilters || undefined}
              />
            </div>
            
            {/* Quick Jobs - Scrollable */}
            {miniJobs.length > 0 && (
              <div className="job-search-column">
                <div className="job-search-fixed-section mb-3">
                  <h3 className="text-sm font-medium text-muted-foreground">Quick Jobs</h3>
                </div>
                <div className="job-search-scrollable space-y-3">
                  {miniJobs.map((job, index) => (
                    <div key={`mini-${job.id}-${index}`}>
                      <MiniJobCard job={job} onJobSelect={handleMiniJobSelect} />
                      {/* Responsive square ad at positions 10 and 21 (at least 10 jobs apart) */}
                      {((index + 1) === 10 || (index + 1) === 21) && (
                        <div className="mt-3">
                          <GoogleAd 
                            adSlot="6228224703"
                            adFormat="auto"
                            className="w-full"
                            style={{ minHeight: '120px' }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Center Column - Main Job Results */}
          <div className="job-search-column">
            {/* Results Header - Fixed */}
            {searchPerformed && !loading && (
              <div className="job-search-fixed-section mb-4">
                <h2 className="text-lg font-semibold">
                  {`Showing ${allJobs.length} of ${totalJobs} job${totalJobs !== 1 ? 's' : ''}`}
                </h2>
              </div>
            )}
            
            {/* Job Results - Scrollable */}
            <div className="job-search-scrollable space-y-4">
              {/* Warnings */}
              {warnings.length > 0 && (
                <Alert>
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

              {/* Job Results */}
              {allJobs.length > 0 && (
                <div className="space-y-3">
                  {allJobs.map((job, index) => (
                    <CompactJobCard 
                      key={`${job.id}-${index}`}
                      job={job} 
                      id={`job-${job.id}`}
                      isExpanded={expandedJobId === job.id}
                      onExpandChange={(expanded) => setExpandedJobId(expanded ? job.id : null)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Ads Sidebar */}
          <div className="job-search-column">
            <div className="job-search-scrollable">
              <AdSidebar />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { JobSearchForm } from '@/components/job-search/JobSearchForm';
import { JobSearchResults } from '@/components/job-search/JobSearchResults';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { Search } from 'lucide-react';
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
      <div className="max-w-6xl mx-auto px-4 py-8">
        <AnimatedSection delay={0}>
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Find Your Next Job</h1>
            <p className="text-muted-foreground">Search from our curated job database</p>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={100}>
          <div className="mb-8">
            <JobSearchForm onSearch={handleSearch} loading={loading} />
          </div>
        </AnimatedSection>

        <AnimatedSection delay={200}>
          <div ref={resultsRef} className="space-y-8 scroll-mt-4">
            <JobSearchResults 
              jobs={currentJobs}
              loading={loading} 
              searchPerformed={searchPerformed}
              pagination={pagination}
              warnings={warnings}
              onPageChange={handlePageChange}
            />

            {/* No results state */}
            {searchPerformed && totalJobs === 0 && !loading && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    No jobs found matching your search criteria. Try adjusting your search terms or filters.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </AnimatedSection>
      </div>
    </DashboardLayout>
  );
};

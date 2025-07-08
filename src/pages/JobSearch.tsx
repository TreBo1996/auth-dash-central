
import React, { useState, useEffect, useRef } from 'react';
import { JobSearchForm } from '@/components/job-search/JobSearchForm';
import { JobSearchResults } from '@/components/job-search/JobSearchResults';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { Search } from 'lucide-react';
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

const JOBS_PER_PAGE = 10;

export const JobSearch: React.FC = () => {
  const [allJobs, setAllJobs] = useState<UnifiedJob[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const resultsRef = useRef<HTMLDivElement>(null);
  
  // Use the optimized search hook
  const { searchJobs, loading } = useOptimizedJobSearch();

  // Basic frontend caching
  const getCacheKey = (filters: JobSearchFilters) => {
    return JSON.stringify({
      query: filters.query || '',
      location: filters.location || '',
      remoteType: filters.remoteType || '',
      employmentType: filters.employmentType || '',
      seniorityLevel: filters.seniorityLevel || '',
      company: filters.company || ''
    });
  };

  const getCachedResults = (cacheKey: string) => {
    try {
      const cached = sessionStorage.getItem(`job-search-${cacheKey}`);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        // Cache valid for 5 minutes
        if (Date.now() - timestamp < 5 * 60 * 1000) {
          return data;
        }
      }
    } catch (error) {
      console.error('Cache read error:', error);
    }
    return null;
  };

  const setCachedResults = (cacheKey: string, data: UnifiedJob[]) => {
    try {
      sessionStorage.setItem(`job-search-${cacheKey}`, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Cache write error:', error);
    }
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
    setCurrentPage(1); // Reset to first page on new search
    
    try {
      // Check cache first
      const cacheKey = getCacheKey(searchFilters);
      const cachedResults = getCachedResults(cacheKey);
      
      if (cachedResults) {
        setAllJobs(cachedResults);
        setSearchPerformed(true);
        setWarnings([]);
        return;
      }
      
      // Use unified search that includes employer jobs with highest priority
      const searchResult = await searchJobs(searchFilters);
      
      // Cache the results
      setCachedResults(cacheKey, searchResult.jobs);
      
      setAllJobs(searchResult.jobs);
      setWarnings(searchResult.warnings);
      setSearchPerformed(true);
      
    } catch (error) {
      console.error('Search error:', error);
      setAllJobs([]);
      setWarnings(['Search failed. Please try again.']);
      setSearchPerformed(true);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to the results section
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Find Your Next Job</h1>
          <p className="text-muted-foreground">Search from our curated job database</p>
        </div>

        <div className="mb-8">
          <JobSearchForm onSearch={handleSearch} loading={loading} />
        </div>

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
      </div>
    </DashboardLayout>
  );
};

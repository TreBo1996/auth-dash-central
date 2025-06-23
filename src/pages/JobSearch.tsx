import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { JobSearchForm } from '@/components/job-search/JobSearchForm';
import { JobSearchResults } from '@/components/job-search/JobSearchResults';
import { supabase } from '@/integrations/supabase/client';

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
  job_highlights?: string;
  requirements?: string;
  responsibilities?: string;
  benefits?: string;
}

interface SearchParams {
  query: string;
  location: string;
  page?: number;
  resultsPerPage?: number;
  datePosted?: string;
  jobType?: string;
  experienceLevel?: string;
}

export const JobSearch: React.FC = () => {
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [fromCache, setFromCache] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const JOBS_PER_PAGE = 10;

  const performSearch = async (searchParams: SearchParams, forceRefresh = false) => {
    setLoading(true);
    setCurrentPage(1);
    setAllJobs([]);
    setSearchPerformed(true);
    setDebugInfo(null);
    setWarnings([]);

    try {
      console.log('Performing cached search:', searchParams);

      const { data, error } = await supabase.functions.invoke('cached-job-search', {
        body: { 
          ...searchParams, 
          resultsPerPage: 50,
          forceRefresh 
        }
      });

      if (error) {
        throw error;
      }

      const newJobs = data.jobs || [];
      setAllJobs(newJobs);
      setFromCache(data.fromCache || false);
      setLastUpdated(data.lastUpdated);
      setDebugInfo(data.debug_info);
      
      if (newJobs.length === 0) {
        setWarnings(['No jobs found. Try adjusting your search terms or filters.']);
      } else if (data.fromCache) {
        setWarnings([`Showing cached results (last updated: ${new Date(data.lastUpdated).toLocaleString()})`]);
      }
      
      console.log('Search completed:', {
        totalJobsReceived: newJobs.length,
        fromCache: data.fromCache,
        debugInfo: data.debug_info
      });
    } catch (error) {
      console.error('Job search error:', error);
      setAllJobs([]);
      setWarnings(['Search failed. Please try again.']);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (searchData: SearchParams) => {
    await performSearch(searchData);
  };

  const handleRefresh = async () => {
    if (debugInfo?.search_params) {
      await performSearch(debugInfo.search_params, true);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getCurrentPageJobs = () => {
    const startIndex = (currentPage - 1) * JOBS_PER_PAGE;
    const endIndex = startIndex + JOBS_PER_PAGE;
    return allJobs.slice(startIndex, endIndex);
  };

  const getPaginationData = () => {
    const totalPages = Math.ceil(allJobs.length / JOBS_PER_PAGE);
    return {
      currentPage,
      totalPages,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
      totalResults: allJobs.length,
      resultsPerPage: JOBS_PER_PAGE
    };
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Job Search</h1>
          <p className="text-muted-foreground">
            Find and save job opportunities from across the web
          </p>
          {debugInfo && (
            <div className="text-xs text-muted-foreground mt-2 space-y-1">
              <p>
                {fromCache ? 'Cached results' : 'Fresh results'} • {allJobs.length} jobs
                {debugInfo.cache_hit && ` • Last updated: ${new Date(lastUpdated!).toLocaleString()}`}
              </p>
              {!fromCache && debugInfo.jobs_fetched && (
                <p>Fetched {debugInfo.jobs_fetched} jobs from SerpAPI</p>
              )}
            </div>
          )}
        </div>

        <JobSearchForm onSearch={handleSearch} loading={loading} />
        
        <JobSearchResults 
          jobs={getCurrentPageJobs()} 
          loading={loading} 
          searchPerformed={searchPerformed}
          pagination={searchPerformed ? getPaginationData() : undefined}
          warnings={warnings}
          onPageChange={handlePageChange}
          canLoadMore={false}
          onLoadMore={undefined}
          loadingMore={false}
          searchVariationsUsed={[]}
        />

        {searchPerformed && fromCache && (
          <div className="flex justify-center">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Refreshing...' : 'Refresh with Latest Results'}
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

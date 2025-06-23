
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

  const JOBS_PER_PAGE = 10;

  const performSearch = async (searchParams: SearchParams) => {
    setLoading(true);
    setCurrentPage(1);
    setAllJobs([]);
    setSearchPerformed(true);
    setDebugInfo(null);

    try {
      const { data, error } = await supabase.functions.invoke('job-search', {
        body: { ...searchParams, resultsPerPage: 100 }
      });

      if (error) {
        throw error;
      }

      setAllJobs(data.jobs || []);
      setWarnings(data.warnings || []);
      setDebugInfo(data.debug_info);
      
      console.log('Search completed:', {
        totalJobsReceived: data.jobs?.length || 0,
        debugInfo: data.debug_info,
        warnings: data.warnings
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
            <p className="text-xs text-muted-foreground mt-2">
              Found {debugInfo.unique_jobs_after_dedup} unique jobs from {debugInfo.api_calls_made} API calls
            </p>
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
        />
      </div>
    </DashboardLayout>
  );
};

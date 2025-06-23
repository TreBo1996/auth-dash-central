
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
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [currentSearchParams, setCurrentSearchParams] = useState<SearchParams | null>(null);
  const [pagination, setPagination] = useState<{
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    totalResults: number;
    resultsPerPage: number;
  } | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  const performSearch = async (searchParams: SearchParams) => {
    setLoading(true);
    if (searchParams.page === 1) {
      setJobs([]);
      setSearchPerformed(true);
    }

    try {
      const { data, error } = await supabase.functions.invoke('job-search', {
        body: searchParams
      });

      if (error) {
        throw error;
      }

      setJobs(data.jobs || []);
      setPagination(data.pagination || null);
      setWarnings(data.warnings || []);
      setCurrentSearchParams(searchParams);
    } catch (error) {
      console.error('Job search error:', error);
      setJobs([]);
      setPagination(null);
      setWarnings(['Search failed. Please try again.']);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (searchData: SearchParams) => {
    await performSearch({ ...searchData, page: 1 });
  };

  const handlePageChange = async (page: number) => {
    if (currentSearchParams) {
      await performSearch({ ...currentSearchParams, page });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Job Search</h1>
          <p className="text-muted-foreground">
            Find and save job opportunities from across the web
          </p>
        </div>

        <JobSearchForm onSearch={handleSearch} loading={loading} />
        
        <JobSearchResults 
          jobs={jobs} 
          loading={loading} 
          searchPerformed={searchPerformed}
          pagination={pagination}
          warnings={warnings}
          onPageChange={handlePageChange}
        />
      </div>
    </DashboardLayout>
  );
};

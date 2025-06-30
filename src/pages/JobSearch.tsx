
import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { JobSearchForm } from '@/components/job-search/JobSearchForm';
import { JobSearchResults } from '@/components/job-search/JobSearchResults';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  salary: string | null;
  posted_at: string;
  job_url: string;
  apply_url: string;
  source: string;
  via: string;
  thumbnail?: string;
  logo_url?: string;
  job_type?: string | null;
  employment_type?: string | null;
  experience_level?: string | null;
  seniority_level?: string | null;
  remote_type?: string | null;
  company_size?: string | null;
  industry?: string | null;
  job_function?: string | null;
  scraped_at: string;
  quality_score: number;
  relevance_score: number;
}

interface SearchParams {
  query: string;
  location: string;
  remoteType?: string;
  employmentType?: string;
  seniorityLevel?: string;
  company?: string;
  maxAge?: number;
  limit?: number;
  offset?: number;
}

export const JobSearch: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [pagination, setPagination] = useState<any>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [lastSearchParams, setLastSearchParams] = useState<SearchParams | null>(null);
  const [scrapingJobs, setScrapingJobs] = useState(false);

  const performDatabaseSearch = async (searchParams: SearchParams) => {
    setLoading(true);
    setSearchPerformed(true);
    setWarnings([]);

    try {
      console.log('Searching database for jobs:', searchParams);

      const { data, error } = await supabase.functions.invoke('database-job-search', {
        body: searchParams
      });

      if (error) {
        console.error('Database search function error:', error);
        throw error;
      }

      console.log('Database search response:', data);

      const searchResults = data.jobs || [];
      setJobs(searchResults);
      setPagination(data.pagination);
      
      if (data.warnings && data.warnings.length > 0) {
        setWarnings(data.warnings);
      }

      console.log('Database search completed:', {
        totalJobsFound: searchResults.length,
        totalResults: data.totalResults
      });

    } catch (error) {
      console.error('Database search error:', error);
      setJobs([]);
      setPagination(null);
      setWarnings([error.message || 'Search failed. Please try again.']);
    } finally {
      setLoading(false);
    }
  };

  const scrapeNewJobs = async () => {
    if (!lastSearchParams) return;

    setScrapingJobs(true);
    try {
      console.log('Scraping new jobs from Apify...');

      const { data, error } = await supabase.functions.invoke('apify-job-scraper', {
        body: {
          query: lastSearchParams.query,
          location: lastSearchParams.location,
          maxJobs: 100,
          forceRefresh: true
        }
      });

      if (error) {
        console.error('Apify scraper error:', error);
        throw error;
      }

      console.log('Scraping completed:', data);
      
      // Refresh the search results
      performDatabaseSearch(lastSearchParams);
      
    } catch (error) {
      console.error('Scraping error:', error);
      setWarnings(prev => [...prev, 'Failed to scrape new jobs. Please try again later.']);
    } finally {
      setScrapingJobs(false);
    }
  };

  const handleSearch = async (searchData: SearchParams) => {
    console.log('HandleSearch called with:', searchData);
    setLastSearchParams(searchData);
    await performDatabaseSearch({
      ...searchData,
      limit: 50,
      offset: 0
    });
  };

  const handlePageChange = (page: number) => {
    if (!lastSearchParams || !pagination) return;
    
    const offset = (page - 1) * pagination.resultsPerPage;
    performDatabaseSearch({
      ...lastSearchParams,
      offset
    });
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Job Search</h1>
          <p className="text-muted-foreground">
            Search our database of job opportunities
          </p>
        </div>

        <JobSearchForm onSearch={handleSearch} loading={loading} />
        
        {searchPerformed && jobs.length < 10 && !loading && (
          <div className="flex justify-center">
            <Button 
              onClick={scrapeNewJobs} 
              disabled={scrapingJobs}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${scrapingJobs ? 'animate-spin' : ''}`} />
              {scrapingJobs ? 'Scraping Fresh Jobs...' : 'Get Fresh Jobs'}
            </Button>
          </div>
        )}
        
        <JobSearchResults 
          jobs={jobs} 
          loading={loading} 
          searchPerformed={searchPerformed}
          pagination={pagination}
          warnings={warnings}
          onPageChange={handlePageChange}
          canLoadMore={false}
          onLoadMore={undefined}
          loadingMore={false}
          searchVariationsUsed={[]}
        />
      </div>
    </DashboardLayout>
  );
};

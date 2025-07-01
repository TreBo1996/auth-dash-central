import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { JobSearchForm } from '@/components/job-search/JobSearchForm';
import { JobSearchResults } from '@/components/job-search/JobSearchResults';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { RefreshCw, TestTube } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
  const [testingBatchScraper, setTestingBatchScraper] = useState(false);
  const [batchScraperResults, setBatchScraperResults] = useState<any>(null);

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

  const testBatchScraper = async () => {
    setTestingBatchScraper(true);
    setBatchScraperResults(null);
    
    try {
      console.log('Testing batch job scraper...');

      const { data, error } = await supabase.functions.invoke('scheduled-job-scraper', {
        body: {
          jobTitles: ['Business Analyst', 'Project Manager', 'Software Engineer'], // Test with 3 titles first
          maxJobsPerTitle: 20, // Limit to 20 jobs per title for testing
          locations: ['United States', 'Remote']
        }
      });

      if (error) {
        console.error('Batch scraper test error:', error);
        throw error;
      }

      console.log('Batch scraper test results:', data);
      setBatchScraperResults(data);
      
    } catch (error) {
      console.error('Batch scraper test failed:', error);
      setWarnings(prev => [...prev, `Batch scraper test failed: ${error.message}`]);
    } finally {
      setTestingBatchScraper(false);
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

        {/* Test Batch Scraper Section */}
        <div className="border rounded-lg p-4 bg-blue-50">
          <h3 className="font-semibold mb-2">Test Batch Job Scraper</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Test the batch scraper with 3 job titles to verify it's working correctly.
          </p>
          <Button 
            onClick={testBatchScraper} 
            disabled={testingBatchScraper}
            variant="outline"
            className="gap-2"
          >
            <TestTube className={`h-4 w-4 ${testingBatchScraper ? 'animate-spin' : ''}`} />
            {testingBatchScraper ? 'Testing Batch Scraper...' : 'Test Batch Scraper'}
          </Button>
          
          {batchScraperResults && (
            <Alert className="mt-4">
              <AlertDescription>
                <div className="space-y-2">
                  <div><strong>Batch Scraper Test Results:</strong></div>
                  <div>Total Job Titles: {batchScraperResults.summary?.totalJobTitles || 0}</div>
                  <div>Successful: {batchScraperResults.summary?.successfulJobs || 0}</div>
                  <div>Failed: {batchScraperResults.summary?.failedJobs || 0}</div>
                  <div>Total Jobs Scraped: {batchScraperResults.summary?.totalJobsScraped || 0}</div>
                  <div>Total Jobs Inserted: {batchScraperResults.summary?.totalJobsInserted || 0}</div>
                  
                  {batchScraperResults.results && (
                    <div className="mt-3">
                      <div className="text-sm font-medium">Results by Job Title:</div>
                      {batchScraperResults.results.map((result: any, index: number) => (
                        <div key={index} className="text-xs ml-2">
                          • {result.jobTitle}: {result.success ? `${result.jobsInserted}/${result.jobsScraped} inserted` : `Failed - ${result.error}`}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
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


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
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [originalSearchParams, setOriginalSearchParams] = useState<SearchParams | null>(null);
  const [searchVariationsUsed, setSearchVariationsUsed] = useState<string[]>([]);
  const [canLoadMore, setCanLoadMore] = useState(false);

  const JOBS_PER_PAGE = 10;

  // Generate search variations based on the original query
  const generateSearchVariations = (originalQuery: string): string[] => {
    const variations = [];
    const query = originalQuery.toLowerCase();
    
    // Common job title synonyms and variations
    const jobTitleMappings: Record<string, string[]> = {
      'project manager': ['PM', 'project management', 'program manager', 'project coordinator', 'project lead'],
      'software engineer': ['software developer', 'developer', 'programmer', 'software dev', 'engineer'],
      'data scientist': ['data analyst', 'data engineer', 'ML engineer', 'analytics'],
      'marketing manager': ['marketing director', 'marketing lead', 'digital marketing', 'marketing specialist'],
      'sales manager': ['sales director', 'sales lead', 'account manager', 'business development'],
      'product manager': ['product owner', 'PM', 'product lead', 'product coordinator'],
    };

    // Add exact variations for known job titles
    for (const [key, synonyms] of Object.entries(jobTitleMappings)) {
      if (query.includes(key)) {
        variations.push(...synonyms);
      }
    }

    // Add generic variations
    variations.push(
      `${originalQuery} specialist`,
      `${originalQuery} lead`,
      `${originalQuery} coordinator`,
      `senior ${originalQuery}`,
      `junior ${originalQuery}`
    );

    // Remove duplicates and filter out already used variations
    return [...new Set(variations)].filter(v => !searchVariationsUsed.includes(v));
  };

  const performSearch = async (searchParams: SearchParams, isLoadMore = false) => {
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setCurrentPage(1);
      setAllJobs([]);
      setSearchPerformed(true);
      setDebugInfo(null);
      setOriginalSearchParams(searchParams);
      setSearchVariationsUsed([]);
      setCanLoadMore(false);
    }

    try {
      const { data, error } = await supabase.functions.invoke('job-search', {
        body: { ...searchParams, resultsPerPage: 100 }
      });

      if (error) {
        throw error;
      }

      const newJobs = data.jobs || [];
      
      if (isLoadMore) {
        // Filter out duplicates by job_url
        const existingUrls = new Set(allJobs.map(job => job.job_url));
        const uniqueNewJobs = newJobs.filter((job: Job) => !existingUrls.has(job.job_url));
        setAllJobs(prev => [...prev, ...uniqueNewJobs]);
        
        console.log('Load more completed:', {
          newJobsFound: newJobs.length,
          uniqueNewJobs: uniqueNewJobs.length,
          totalJobs: allJobs.length + uniqueNewJobs.length
        });
      } else {
        setAllJobs(newJobs);
        setCanLoadMore(newJobs.length >= 10); // Enable load more if we got decent results
      }
      
      setWarnings(data.warnings || []);
      setDebugInfo(data.debug_info);
      
      console.log('Search completed:', {
        totalJobsReceived: newJobs.length,
        debugInfo: data.debug_info,
        warnings: data.warnings,
        isLoadMore
      });
    } catch (error) {
      console.error('Job search error:', error);
      if (!isLoadMore) {
        setAllJobs([]);
        setCanLoadMore(false);
      }
      setWarnings(['Search failed. Please try again.']);
    } finally {
      if (isLoadMore) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  };

  const handleSearch = async (searchData: SearchParams) => {
    await performSearch(searchData);
  };

  const handleLoadMore = async () => {
    if (!originalSearchParams) return;

    const variations = generateSearchVariations(originalSearchParams.query);
    
    if (variations.length === 0) {
      setWarnings(prev => [...prev, 'No more search variations available.']);
      setCanLoadMore(false);
      return;
    }

    // Use the first available variation
    const nextVariation = variations[0];
    setSearchVariationsUsed(prev => [...prev, nextVariation]);

    const searchWithVariation = {
      ...originalSearchParams,
      query: nextVariation
    };

    console.log(`Loading more with variation: "${nextVariation}"`);
    await performSearch(searchWithVariation, true);

    // Disable load more if we've used too many variations
    if (searchVariationsUsed.length >= 4) {
      setCanLoadMore(false);
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
            <p className="text-xs text-muted-foreground mt-2">
              Found {debugInfo.unique_jobs_after_dedup} unique jobs from {debugInfo.api_calls_made} API calls
              {searchVariationsUsed.length > 0 && ` • Used ${searchVariationsUsed.length} search variations`}
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
          canLoadMore={canLoadMore && !loading}
          onLoadMore={handleLoadMore}
          loadingMore={loadingMore}
          searchVariationsUsed={searchVariationsUsed}
        />
      </div>
    </DashboardLayout>
  );
};

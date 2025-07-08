
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

// Load employer jobs on component mount and implement basic caching
  useEffect(() => {
    loadEmployerJobs();
  }, []);

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

  const loadEmployerJobs = async (searchFilters?: JobSearchFilters) => {
    try {
      let query = supabase.from('job_postings').select(`
          id,
          title,
          description,
          location,
          employment_type,
          experience_level,
          salary_min,
          salary_max,
          salary_currency,
          created_at,
          employer_profile:employer_profiles(
            company_name,
            logo_url
          )
        `).eq('is_active', true).order('created_at', { ascending: false });

      // Apply filters if provided
      if (searchFilters?.query) {
        query = query.or(`title.ilike.%${searchFilters.query}%,description.ilike.%${searchFilters.query}%`);
      }
      if (searchFilters?.location) {
        query = query.ilike('location', `%${searchFilters.location}%`);
      }
      if (searchFilters?.employmentType) {
        query = query.eq('employment_type', searchFilters.employmentType);
      }
      if (searchFilters?.seniorityLevel) {
        query = query.eq('experience_level', searchFilters.seniorityLevel);
      }

      const { data, error } = await query.limit(75); // Limit to 75 for performance
      if (error) throw error;

      // Transform employer jobs to unified format
      const employerJobs: UnifiedJob[] = (data || []).map(job => ({
        id: job.id,
        title: job.title,
        company: job.employer_profile?.company_name || 'Company Name Not Available',
        location: job.location || '',
        description: job.description,
        salary: formatSalary(job.salary_min, job.salary_max, job.salary_currency),
        posted_at: new Date(job.created_at).toLocaleDateString(),
        job_url: `/job-posting/${job.id}`,
        source: 'employer' as const,
        employer_profile: job.employer_profile,
        employment_type: job.employment_type,
        experience_level: job.experience_level,
        salary_min: job.salary_min,
        salary_max: job.salary_max,
        salary_currency: job.salary_currency,
        created_at: job.created_at
      }));

      return employerJobs;
    } catch (error) {
      console.error('Error loading employer jobs:', error);
      return [];
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

  const loadDatabaseJobs = async (searchFilters: JobSearchFilters) => {
    try {
      const { data, error } = await supabase.functions.invoke('database-job-search', {
        body: {
          query: searchFilters.query || '',
          location: searchFilters.location || '',
          remoteType: searchFilters.remoteType || '',
          employmentType: searchFilters.employmentType || '',
          seniorityLevel: searchFilters.seniorityLevel || '',
          company: searchFilters.company || '',
          maxAge: searchFilters.maxAge || 30,
          limit: 75, // Limit to 75 for performance
          offset: 0
        }
      });

      if (error) throw error;

      // Transform database jobs to unified format
      const databaseJobs: UnifiedJob[] = (data.jobs || []).map((job: any) => ({
        id: job.id, // Use the actual UUID from database
        title: job.title,
        company: job.company,
        location: job.location,
        description: job.description,
        salary: job.salary,
        posted_at: job.posted_at,
        job_url: job.job_url, // Keep original URL for apply functionality
        source: 'database' as const,
        via: job.via,
        thumbnail: job.thumbnail,
        job_type: job.job_type,
        experience_level: job.experience_level,
        requirements: job.requirements,
        responsibilities: job.responsibilities,
        benefits: job.benefits
      }));

      return { jobs: databaseJobs, warnings: data.warnings || [] };
    } catch (error) {
      console.error('Database job search error:', error);
      return { jobs: [], warnings: ['Failed to search jobs. Please try again.'] };
    }
  };

  const handleSearch = async (searchFilters: JobSearchFilters) => {
    setCurrentPage(1); // Reset to first page on new search
    
    try {
      // Progressive loading: Load employer jobs first (faster)
      const employerJobs = await loadEmployerJobs(searchFilters);
      
      // Show employer jobs immediately
      setAllJobs(employerJobs);
      setSearchPerformed(true);
      
      // Then load optimized database search
      const databaseResult = await searchJobs(searchFilters);
      
      // Combine jobs with employer jobs first, limit total to 150
      const combinedJobs = [...employerJobs, ...databaseResult.jobs].slice(0, 150);
      
      setAllJobs(combinedJobs);
      setWarnings(databaseResult.warnings);
      
    } catch (error) {
      console.error('Search error:', error);
      setAllJobs([]);
      setWarnings(['Search failed. Please try again.']);
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

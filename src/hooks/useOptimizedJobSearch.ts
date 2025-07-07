import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UnifiedJob } from '@/types/job';

interface SearchFilters {
  query: string;
  location: string;
  remoteType?: string;
  employmentType?: string;
  seniorityLevel?: string;
  company?: string;
  maxAge?: number;
}

interface SearchResult {
  jobs: UnifiedJob[];
  warnings: string[];
  total: number;
}

interface UseOptimizedJobSearchReturn {
  searchJobs: (filters: SearchFilters) => Promise<SearchResult>;
  loading: boolean;
  clearCache: () => void;
}

// In-memory cache for search results
const searchCache = new Map<string, { data: SearchResult; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useOptimizedJobSearch = (): UseOptimizedJobSearchReturn => {
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();

  const getCacheKey = (filters: SearchFilters): string => {
    return JSON.stringify({
      query: filters.query || '',
      location: filters.location || '',
      remoteType: filters.remoteType || '',
      employmentType: filters.employmentType || '',
      seniorityLevel: filters.seniorityLevel || '',
      company: filters.company || ''
    });
  };

  const getCachedResult = (cacheKey: string): SearchResult | null => {
    const cached = searchCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
    searchCache.delete(cacheKey);
    return null;
  };

  const setCachedResult = (cacheKey: string, data: SearchResult): void => {
    searchCache.set(cacheKey, { data, timestamp: Date.now() });
  };

  const searchJobs = useCallback(async (filters: SearchFilters): Promise<SearchResult> => {
    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    return new Promise((resolve, reject) => {
      debounceRef.current = setTimeout(async () => {
        try {
          setLoading(true);

          const cacheKey = getCacheKey(filters);
          const cachedResult = getCachedResult(cacheKey);
          
          if (cachedResult) {
            console.log('Returning cached search results');
            setLoading(false);
            resolve(cachedResult);
            return;
          }

          console.log('Performing optimized job search:', filters);

          // Use the fast-job-search edge function for optimized searching
          const { data, error } = await supabase.functions.invoke('fast-job-search', {
            body: {
              query: filters.query || '',
              location: filters.location || '',
              remoteType: filters.remoteType || '',
              employmentType: filters.employmentType || '',
              seniorityLevel: filters.seniorityLevel || '',
              company: filters.company || '',
              maxAge: filters.maxAge || 30,
              limit: 100,
              offset: 0
            }
          });

          if (error) {
            console.error('Optimized search error:', error);
            throw error;
          }

          // Transform jobs to unified format
          const transformedJobs: UnifiedJob[] = (data.jobs || []).map((job: any) => ({
            id: job.id,
            title: job.title,
            company: job.company,
            location: job.location,
            description: job.description,
            salary: job.salary,
            posted_at: job.posted_at,
            job_url: job.job_url,
            source: 'database' as const,
            via: job.via,
            thumbnail: job.thumbnail,
            logo_url: job.logo_url,
            job_type: job.job_type,
            employment_type: job.employment_type,
            experience_level: job.experience_level,
            requirements: job.requirements,
            responsibilities: job.responsibilities,
            benefits: job.benefits,
            relevance_score: job.relevance_score
          }));

          const result: SearchResult = {
            jobs: transformedJobs,
            warnings: data.warnings || [],
            total: data.total || transformedJobs.length
          };

          setCachedResult(cacheKey, result);
          setLoading(false);
          resolve(result);

        } catch (error) {
          console.error('Search error:', error);
          setLoading(false);
          resolve({
            jobs: [],
            warnings: ['Search failed. Please try again.'],
            total: 0
          });
        }
      }, 300); // 300ms debounce
    });
  }, []);

  const clearCache = useCallback(() => {
    searchCache.clear();
  }, []);

  return {
    searchJobs,
    loading,
    clearCache
  };
};
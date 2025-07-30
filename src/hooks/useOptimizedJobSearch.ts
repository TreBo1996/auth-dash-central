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
  searchJobs: (filters: SearchFilters, offset?: number, limit?: number) => Promise<SearchResult>;
  loading: boolean;
  clearCache: () => void;
}

// SessionStorage-based cache for persistence across tab switches
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const CACHE_PREFIX = 'job-search-cache-';

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
    try {
      const cached = sessionStorage.getItem(CACHE_PREFIX + cacheKey);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          return data;
        }
        // Remove expired cache
        sessionStorage.removeItem(CACHE_PREFIX + cacheKey);
      }
    } catch (error) {
      console.error('Cache read error:', error);
    }
    return null;
  };

  const setCachedResult = (cacheKey: string, data: SearchResult): void => {
    try {
      sessionStorage.setItem(CACHE_PREFIX + cacheKey, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Cache write error:', error);
    }
  };

  const searchJobs = useCallback(async (filters: SearchFilters, offset: number = 0, limit: number = 50): Promise<SearchResult> => {
    // Clear previous debounce only for new searches (offset = 0)
    if (offset === 0 && debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    return new Promise((resolve, reject) => {
      const performSearch = async () => {
        try {
          setLoading(true);

          // Only use cache for initial searches (offset = 0)
          if (offset === 0) {
            const cacheKey = getCacheKey(filters);
            const cachedResult = getCachedResult(cacheKey);
            
            if (cachedResult) {
              console.log('Returning cached search results');
              setLoading(false);
              resolve(cachedResult);
              return;
            }
          }

          console.log('Performing optimized job search:', filters, { offset, limit });

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
              limit,
              offset
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

          // Only cache initial searches
          if (offset === 0) {
            setCachedResult(getCacheKey(filters), result);
          }
          
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
      };

      // Use debounce only for initial searches
      if (offset === 0) {
        debounceRef.current = setTimeout(performSearch, 300);
      } else {
        performSearch();
      }
    });
  }, []);

  const clearCache = useCallback(() => {
    try {
      // Clear all job search cache entries
      const keys = Object.keys(sessionStorage);
      keys.forEach(key => {
        if (key.startsWith(CACHE_PREFIX)) {
          sessionStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }, []);

  return {
    searchJobs,
    loading,
    clearCache
  };
};
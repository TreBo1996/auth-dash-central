import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const serpApiKey = Deno.env.get('SERP_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Create Supabase client with service role for database operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      query, 
      location = '', 
      resultsPerPage = 50,
      datePosted = '',
      jobType = '',
      experienceLevel = '',
      forceRefresh = false
    } = await req.json();

    console.log('Cached job search request:', { query, location, resultsPerPage, forceRefresh });

    if (!serpApiKey) {
      throw new Error('SERP_API_KEY not configured');
    }

    // Normalize the search query for better cache hits
    const normalizedQuery = await normalizeQuery(query);
    const searchKey = createSearchKey(normalizedQuery, location, datePosted, jobType, experienceLevel);
    
    console.log('Normalized search:', { originalQuery: query, normalizedQuery, searchKey });

    // Check if we have cached results that are fresh (less than 24 hours old)
    let cachedSearch = null;
    if (!forceRefresh) {
      try {
        cachedSearch = await checkCachedSearch(searchKey);
      } catch (error) {
        console.warn('Cache check failed, proceeding with fresh search:', error);
      }
    }

    if (cachedSearch && !forceRefresh) {
      console.log('Cache hit! Returning cached results');
      try {
        const cachedJobs = await getCachedJobs(cachedSearch.id, resultsPerPage);
        return new Response(JSON.stringify({
          jobs: cachedJobs,
          fromCache: true,
          lastUpdated: cachedSearch.last_updated_at,
          totalResults: cachedSearch.total_results,
          debug_info: {
            cache_hit: true,
            search_id: cachedSearch.id,
            last_updated: cachedSearch.last_updated_at,
            search_params: { query, location, datePosted, jobType, experienceLevel }
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (error) {
        console.warn('Failed to retrieve cached jobs, falling back to fresh search:', error);
      }
    }

    console.log('Cache miss or force refresh - fetching from SerpAPI');

    // Fetch fresh data from SerpAPI
    const freshJobs = await fetchJobsFromSerpAPI(query, location, datePosted, jobType, experienceLevel);
    
    // Try to store in cache, but continue even if it fails
    let searchRecordId = null;
    try {
      const searchRecord = await storeSearchResults(searchKey, normalizedQuery, location, datePosted, jobType, experienceLevel, freshJobs);
      searchRecordId = searchRecord.id;
      console.log(`Successfully cached ${freshJobs.length} jobs for search: ${searchKey}`);
    } catch (error) {
      console.error('Failed to store search results in cache, but continuing with results:', error);
    }

    return new Response(JSON.stringify({
      jobs: freshJobs.slice(0, resultsPerPage),
      fromCache: false,
      lastUpdated: new Date().toISOString(),
      totalResults: freshJobs.length,
      debug_info: {
        cache_hit: false,
        jobs_fetched: freshJobs.length,
        jobs_stored: searchRecordId ? freshJobs.length : 0,
        search_id: searchRecordId,
        cache_error: !searchRecordId,
        search_params: { query, location, datePosted, jobType, experienceLevel }
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in cached job search:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      jobs: [],
      fromCache: false,
      totalResults: 0
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function normalizeQuery(query: string): Promise<string> {
  try {
    const { data, error } = await supabase.rpc('normalize_search_query', { input_query: query });
    if (error) {
      console.warn('Failed to normalize query, using original:', error);
      return query.toLowerCase().trim();
    }
    return data || query.toLowerCase().trim();
  } catch (error) {
    console.warn('Failed to normalize query, using original:', error);
    return query.toLowerCase().trim();
  }
}

function createSearchKey(query: string, location: string, datePosted: string, jobType: string, experienceLevel: string): string {
  const parts = [query, location, datePosted, jobType, experienceLevel].filter(Boolean);
  return parts.join('|').toLowerCase();
}

async function checkCachedSearch(searchKey: string) {
  const { data, error } = await supabase
    .from('job_searches')
    .select('*')
    .eq('search_query', searchKey)
    .gte('last_updated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // 24 hours ago
    .order('last_updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error checking cached search:', error);
    throw error;
  }

  return data;
}

async function getCachedJobs(searchId: string, limit: number) {
  const { data, error } = await supabase
    .from('job_search_results')
    .select(`
      cached_jobs (
        job_url,
        title,
        company,
        location,
        description,
        salary,
        posted_at,
        source,
        via,
        thumbnail,
        job_type,
        experience_level,
        job_highlights,
        requirements,
        responsibilities
      )
    `)
    .eq('job_search_id', searchId)
    .limit(limit);

  if (error) {
    console.error('Error fetching cached jobs:', error);
    throw error;
  }

  return data?.map(item => item.cached_jobs).filter(Boolean) || [];
}

async function fetchJobsFromSerpAPI(query: string, location: string, datePosted: string, jobType: string, experienceLevel: string) {
  const baseParams = new URLSearchParams({
    engine: 'google_jobs',
    q: query,
    api_key: serpApiKey!,
    gl: 'us',
    hl: 'en',
    num: '10'
  });

  // Handle location and remote jobs properly
  const isRemoteSearch = location && (location.toLowerCase().includes('remote') || location.toLowerCase() === 'remote');
  
  if (isRemoteSearch) {
    // For remote jobs, use ltype=1 and don't set geographic location
    baseParams.set('ltype', '1'); // Remote jobs only
    console.log('Setting remote job filter (ltype=1)');
  } else if (location && location.trim()) {
    // For location-based searches, set the location parameter
    baseParams.set('location', location.trim());
    console.log('Setting location filter:', location.trim());
  }

  // Handle date posted filter using SerpAPI's date_posted parameter
  if (datePosted) {
    const dateFilterMap: Record<string, string> = {
      'day': 'today',
      '3days': '3days', 
      'week': 'week',
      'month': 'month'
    };
    
    if (dateFilterMap[datePosted]) {
      baseParams.set('date_posted', dateFilterMap[datePosted]);
      console.log('Setting date filter:', dateFilterMap[datePosted]);
    }
  }

  // Handle job type filter using chips parameter
  if (jobType && jobType !== 'any') {
    const jobTypeChips: Record<string, string> = {
      'full-time': 'date_posted:today,employment_type:FULLTIME',
      'part-time': 'date_posted:today,employment_type:PARTTIME', 
      'contract': 'date_posted:today,employment_type:CONTRACT',
      'internship': 'date_posted:today,employment_type:INTERN',
      'temporary': 'date_posted:today,employment_type:TEMPORARY'
    };
    
    if (jobTypeChips[jobType]) {
      baseParams.set('chips', jobTypeChips[jobType]);
      console.log('Setting job type chips:', jobTypeChips[jobType]);
    }
  }

  // Add experience level to query if specified
  let enhancedQuery = query;
  if (experienceLevel && experienceLevel !== 'any') {
    const experienceLevelMap: Record<string, string> = {
      'entry-level': 'entry level',
      'mid-level': 'mid level', 
      'senior-level': 'senior level',
      'executive': 'executive'
    };
    
    if (experienceLevelMap[experienceLevel]) {
      enhancedQuery += ` ${experienceLevelMap[experienceLevel]}`;
      console.log('Adding experience level to query:', experienceLevelMap[experienceLevel]);
    }
  }

  baseParams.set('q', enhancedQuery);

  const allJobs = [];
  const maxCalls = 5; // Fetch up to 50 jobs (5 calls × 10 jobs each)
  
  console.log(`Making ${maxCalls} SerpAPI calls with enhanced filters...`);

  for (let callIndex = 0; callIndex < maxCalls; callIndex++) {
    const start = callIndex * 10;
    const callParams = new URLSearchParams(baseParams);
    
    if (start > 0) {
      callParams.set('start', start.toString());
    }

    const apiUrl = `https://serpapi.com/search?${callParams}`;
    console.log(`SerpAPI call ${callIndex + 1}/${maxCalls} - URL: ${apiUrl}`);

    try {
      const response = await fetch(apiUrl, { method: 'GET' });
      
      if (!response.ok) {
        console.error(`SerpAPI call ${callIndex + 1} failed:`, response.status, response.statusText);
        continue;
      }

      const data = await response.json();
      
      const jobsData = data.jobs_results || data.job_results || data.jobs || data.results;

      if (jobsData && Array.isArray(jobsData) && jobsData.length > 0) {
        const transformedJobs = jobsData.map((job: any) => {
          // Extract structured data from job highlights
          const highlights = job.job_highlights || [];
          const qualifications = highlights.find((h: any) => h.title?.toLowerCase().includes('qualifications') || h.title?.toLowerCase().includes('requirements'))?.items || [];
          const responsibilities = highlights.find((h: any) => h.title?.toLowerCase().includes('responsibilities') || h.title?.toLowerCase().includes('duties'))?.items || [];
          const benefits = highlights.find((h: any) => h.title?.toLowerCase().includes('benefits'))?.items || [];
          
          return {
            title: job.title,
            company: job.company_name,
            location: job.location,
            description: job.description || job.snippet || '',
            salary: job.salary_info?.salary || job.salary_info?.range || null,
            posted_at: job.detected_extensions?.posted_at || job.posted_at,
            job_url: job.share_link || job.apply_link,
            source: 'Google Jobs',
            via: job.via,
            thumbnail: job.thumbnail,
            job_type: job.detected_extensions?.schedule_type || null,
            experience_level: null,
            job_highlights: highlights,
            requirements: qualifications,
            responsibilities: responsibilities,
            benefits: benefits
          };
        });

        // Filter results to match search criteria more accurately
        const filteredJobs = transformedJobs.filter(job => {
          // For remote searches, filter out jobs that don't mention remote
          if (isRemoteSearch) {
            const jobText = `${job.title} ${job.location} ${job.description}`.toLowerCase();
            return jobText.includes('remote') || jobText.includes('work from home') || jobText.includes('wfh');
          }
          
          // For location-based searches, ensure job location matches or is close
          if (location && !isRemoteSearch && job.location) {
            const searchLocation = location.toLowerCase();
            const jobLocation = job.location.toLowerCase();
            return jobLocation.includes(searchLocation) || searchLocation.includes(jobLocation);
          }
          
          return true; // Keep all jobs if no specific location filter
        });

        allJobs.push(...filteredJobs);
        console.log(`Call ${callIndex + 1}: Got ${jobsData.length} jobs, filtered to ${filteredJobs.length}, total so far: ${allJobs.length}`);
      } else {
        console.log(`Call ${callIndex + 1}: No jobs found`);
        if (callIndex > 0) break; // Stop if no results in subsequent calls
      }

      // Small delay between calls
      if (callIndex < maxCalls - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }

    } catch (error) {
      console.error(`Error in SerpAPI call ${callIndex + 1}:`, error);
      continue;
    }
  }

  console.log(`SerpAPI fetch completed: ${allJobs.length} total filtered jobs`);
  return allJobs;
}

async function storeSearchResults(searchKey: string, normalizedQuery: string, location: string, datePosted: string, jobType: string, experienceLevel: string, jobs: any[]) {
  try {
    // Create or update search record
    const { data: searchRecord, error: searchError } = await supabase
      .from('job_searches')
      .upsert({
        search_query: searchKey,
        location: location || null,
        date_posted: datePosted || null,
        job_type: jobType || null,
        experience_level: experienceLevel || null,
        total_results: jobs.length,
        last_updated_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'search_query'
      })
      .select()
      .single();

    if (searchError) {
      console.error('Error creating search record:', searchError);
      throw searchError;
    }

    console.log('Created search record:', searchRecord.id);

    // Store jobs in cached_jobs table with structured data
    const jobsToInsert = jobs.map(job => ({
      job_url: job.job_url,
      title: job.title,
      company: job.company,
      location: job.location,
      description: job.description,
      salary: job.salary,
      posted_at: job.posted_at,
      source: job.source,
      via: job.via,
      thumbnail: job.thumbnail,
      job_type: job.job_type,
      experience_level: job.experience_level,
      job_highlights: JSON.stringify(job.job_highlights || []),
      requirements: JSON.stringify(job.requirements || []),
      responsibilities: JSON.stringify(job.responsibilities || []),
      benefits: JSON.stringify(job.benefits || []),
      last_seen_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    // Use upsert to handle duplicates
    const { data: cachedJobs, error: jobsError } = await supabase
      .from('cached_jobs')
      .upsert(jobsToInsert, {
        onConflict: 'job_url'
      })
      .select('id, job_url');

    if (jobsError) {
      console.error('Error storing cached jobs:', jobsError);
      throw jobsError;
    }

    console.log(`Stored ${cachedJobs.length} cached jobs`);

    // Link jobs to search in junction table
    const searchResultsToInsert = cachedJobs.map(job => ({
      job_search_id: searchRecord.id,
      cached_job_id: job.id,
      relevance_score: 1
    }));

    const { error: linkError } = await supabase
      .from('job_search_results')
      .upsert(searchResultsToInsert, {
        onConflict: 'job_search_id,cached_job_id'
      });

    if (linkError) {
      console.error('Error linking jobs to search:', linkError);
      // Don't throw here as jobs are already stored
    }

    console.log(`Linked ${searchResultsToInsert.length} jobs to search`);

    return searchRecord;
  } catch (error) {
    console.error('Error in storeSearchResults:', error);
    throw error;
  }
}

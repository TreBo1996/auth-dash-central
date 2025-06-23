
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
      cachedSearch = await checkCachedSearch(searchKey);
    }

    if (cachedSearch && !forceRefresh) {
      console.log('Cache hit! Returning cached results');
      const cachedJobs = await getCachedJobs(cachedSearch.id, resultsPerPage);
      return new Response(JSON.stringify({
        jobs: cachedJobs,
        fromCache: true,
        lastUpdated: cachedSearch.last_updated_at,
        totalResults: cachedSearch.total_results,
        debug_info: {
          cache_hit: true,
          search_id: cachedSearch.id,
          last_updated: cachedSearch.last_updated_at
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Cache miss or force refresh - fetching from SerpAPI');

    // Fetch fresh data from SerpAPI
    const freshJobs = await fetchJobsFromSerpAPI(query, location, datePosted, jobType, experienceLevel);
    
    // Store in cache
    const searchRecord = await storeSearchResults(searchKey, normalizedQuery, location, datePosted, jobType, experienceLevel, freshJobs);
    
    console.log(`Cached ${freshJobs.length} jobs for search: ${searchKey}`);

    return new Response(JSON.stringify({
      jobs: freshJobs.slice(0, resultsPerPage),
      fromCache: false,
      lastUpdated: new Date().toISOString(),
      totalResults: freshJobs.length,
      debug_info: {
        cache_hit: false,
        jobs_fetched: freshJobs.length,
        jobs_stored: freshJobs.length,
        search_id: searchRecord.id
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
  const { data, error } = await supabase.rpc('normalize_search_query', { input_query: query });
  if (error) {
    console.warn('Failed to normalize query, using original:', error);
    return query.toLowerCase().trim();
  }
  return data || query.toLowerCase().trim();
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
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    console.error('Error checking cached search:', error);
    return null;
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
        experience_level
      )
    `)
    .eq('job_search_id', searchId)
    .limit(limit);

  if (error) {
    console.error('Error fetching cached jobs:', error);
    return [];
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

  if (location && location.trim()) {
    const cleanLocation = location.trim().toLowerCase();
    
    if (cleanLocation === 'remote' || cleanLocation.includes('remote')) {
      const remoteQuery = `${query} remote`;
      baseParams.set('q', remoteQuery);
      baseParams.append('location', 'United States');
    } else {
      baseParams.append('location', location.trim());
    }
  }

  // Add filters to query
  let enhancedQuery = query;
  if (datePosted) {
    const dateFilters: Record<string, string> = {
      'day': 'since yesterday',
      '3days': 'in the last 3 days', 
      'week': 'in the last week',
      'month': 'in the last month'
    };
    if (dateFilters[datePosted]) {
      enhancedQuery += ` ${dateFilters[datePosted]}`;
    }
  }

  if (jobType) enhancedQuery += ` ${jobType}`;
  if (experienceLevel) enhancedQuery += ` ${experienceLevel}`;

  baseParams.set('q', enhancedQuery);

  const allJobs = [];
  const maxCalls = 5; // Fetch up to 50 jobs (5 calls × 10 jobs each)
  
  console.log(`Making ${maxCalls} SerpAPI calls...`);

  for (let callIndex = 0; callIndex < maxCalls; callIndex++) {
    const start = callIndex * 10;
    const callParams = new URLSearchParams(baseParams);
    
    if (start > 0) {
      callParams.set('start', start.toString());
    }

    const apiUrl = `https://serpapi.com/search?${callParams}`;
    console.log(`SerpAPI call ${callIndex + 1}/${maxCalls} - start: ${start}`);

    try {
      const response = await fetch(apiUrl, { method: 'GET' });
      
      if (!response.ok) {
        console.error(`SerpAPI call ${callIndex + 1} failed:`, response.status, response.statusText);
        continue;
      }

      const data = await response.json();
      
      const jobsData = data.jobs_results || data.job_results || data.jobs || data.results;

      if (jobsData && Array.isArray(jobsData) && jobsData.length > 0) {
        const transformedJobs = jobsData.map((job: any) => ({
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
          experience_level: null
        }));

        allJobs.push(...transformedJobs);
        console.log(`Call ${callIndex + 1}: Got ${jobsData.length} jobs, total so far: ${allJobs.length}`);
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

  console.log(`SerpAPI fetch completed: ${allJobs.length} total jobs`);
  return allJobs;
}

async function storeSearchResults(searchKey: string, normalizedQuery: string, location: string, datePosted: string, jobType: string, experienceLevel: string, jobs: any[]) {
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

  // Store jobs in cached_jobs table
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
}

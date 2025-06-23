
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const serpApiKey = Deno.env.get('SERP_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      query, 
      location = '', 
      page = 1, 
      resultsPerPage = 25,
      datePosted = '',
      jobType = '',
      experienceLevel = ''
    } = await req.json();

    console.log('Searching jobs for:', { query, location, page, resultsPerPage, datePosted, jobType, experienceLevel });

    if (!serpApiKey) {
      throw new Error('SERP_API_KEY not configured');
    }

    const searchParams = new URLSearchParams({
      engine: 'google_jobs',
      q: query,
      api_key: serpApiKey,
      num: Math.min(resultsPerPage, 100).toString(), // SerpAPI max is 100
      gl: 'us',
      hl: 'en'
    });

    // Calculate start position for pagination
    const start = (page - 1) * resultsPerPage;
    if (start > 0) {
      searchParams.append('start', start.toString());
    }

    // Handle location with fallback strategies
    if (location && location.trim()) {
      const cleanLocation = location.trim().toLowerCase();
      
      // Handle remote jobs with better parameters
      if (cleanLocation === 'remote' || cleanLocation.includes('remote')) {
        // For remote jobs, we'll search without location and filter later
        // or use a broad location like "United States" and include "remote" in query
        const remoteQuery = `${query} remote`;
        searchParams.set('q', remoteQuery);
        searchParams.append('location', 'United States');
      } else {
        searchParams.append('location', location.trim());
      }
    }

    // Add date filter if specified
    if (datePosted) {
      let dateFilter = '';
      switch (datePosted) {
        case 'day':
          dateFilter = 'since yesterday';
          break;
        case '3days':
          dateFilter = 'in the last 3 days';
          break;
        case 'week':
          dateFilter = 'in the last week';
          break;
        case 'month':
          dateFilter = 'in the last month';
          break;
      }
      if (dateFilter) {
        searchParams.set('q', `${query} ${dateFilter}`);
      }
    }

    // Add job type filter to query
    if (jobType) {
      const currentQuery = searchParams.get('q') || query;
      searchParams.set('q', `${currentQuery} ${jobType}`);
    }

    // Add experience level filter to query
    if (experienceLevel) {
      const currentQuery = searchParams.get('q') || query;
      searchParams.set('q', `${currentQuery} ${experienceLevel}`);
    }

    const apiUrl = `https://serpapi.com/search?${searchParams}`;
    console.log('API request URL (without key):', apiUrl.replace(serpApiKey, '[HIDDEN]'));

    const response = await fetch(apiUrl, {
      method: 'GET',
    });

    console.log('SerpAPI response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('SerpAPI error response:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });

      // If location search fails, try without location
      if (response.status === 400 && location) {
        console.log('Location search failed, retrying without location...');
        const fallbackParams = new URLSearchParams(searchParams);
        fallbackParams.delete('location');
        
        const fallbackResponse = await fetch(`https://serpapi.com/search?${fallbackParams}`, {
          method: 'GET',
        });
        
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          return processJobResults(fallbackData, page, resultsPerPage, true);
        }
      }
      
      throw new Error(`Serp API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    return processJobResults(data, page, resultsPerPage, false);

  } catch (error) {
    console.error('Error in job-search function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      jobs: [],
      pagination: { currentPage: 1, totalPages: 0, hasNextPage: false, hasPreviousPage: false }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function processJobResults(data: any, page: number, resultsPerPage: number, isLocationFallback: boolean) {
  console.log('SerpAPI raw response keys:', Object.keys(data));
  
  // Check different possible field names for jobs
  const possibleJobFields = ['jobs_results', 'job_results', 'jobs', 'results'];
  let jobsData = null;
  let foundField = null;
  
  for (const field of possibleJobFields) {
    if (data[field] && Array.isArray(data[field])) {
      jobsData = data[field];
      foundField = field;
      break;
    }
  }
  
  console.log('Jobs found in field:', foundField);
  console.log('Jobs data length:', jobsData?.length || 0);

  // Transform the data to match our expected format
  const transformedJobs = jobsData?.map((job: any) => ({
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
    experience_level: null // Google Jobs doesn't always provide this
  })) || [];

  console.log('Transformed jobs count:', transformedJobs.length);

  // Calculate pagination info
  const totalResults = data.search_information?.total_results || transformedJobs.length;
  const totalPages = Math.ceil(totalResults / resultsPerPage);
  const hasNextPage = page < totalPages && transformedJobs.length === resultsPerPage;
  const hasPreviousPage = page > 1;

  return new Response(JSON.stringify({ 
    jobs: transformedJobs,
    pagination: {
      currentPage: page,
      totalPages,
      hasNextPage,
      hasPreviousPage,
      totalResults,
      resultsPerPage
    },
    search_metadata: data.search_metadata,
    warnings: isLocationFallback ? ['Location search failed, showing results from broader search'] : [],
    debug_info: {
      original_response_keys: Object.keys(data),
      jobs_field_used: foundField,
      raw_jobs_count: jobsData?.length || 0
    }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

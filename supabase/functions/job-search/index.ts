
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
    const { query, location = '' } = await req.json();

    console.log('Searching jobs for:', { query, location });
    console.log('SERP_API_KEY configured:', !!serpApiKey);
    console.log('SERP_API_KEY length:', serpApiKey?.length || 0);

    if (!serpApiKey) {
      throw new Error('SERP_API_KEY not configured');
    }

    const searchParams = new URLSearchParams({
      engine: 'google_jobs',
      q: query,
      api_key: serpApiKey,
      num: '10',
      gl: 'us',
      hl: 'en'
    });

    // Only add location if it's not empty
    if (location && location.trim()) {
      searchParams.append('location', location.trim());
    }

    const apiUrl = `https://serpapi.com/search?${searchParams}`;
    console.log('API request URL (without key):', apiUrl.replace(serpApiKey, '[HIDDEN]'));

    const response = await fetch(apiUrl, {
      method: 'GET',
    });

    console.log('SerpAPI response status:', response.status);
    console.log('SerpAPI response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('SerpAPI error response:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`Serp API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    
    console.log('SerpAPI raw response keys:', Object.keys(data));
    console.log('SerpAPI full response:', JSON.stringify(data, null, 2));
    
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
    
    if (jobsData && jobsData.length > 0) {
      console.log('First job sample:', JSON.stringify(jobsData[0], null, 2));
    }

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
      thumbnail: job.thumbnail
    })) || [];

    console.log('Transformed jobs count:', transformedJobs.length);
    if (transformedJobs.length > 0) {
      console.log('First transformed job:', transformedJobs[0]);
    }

    return new Response(JSON.stringify({ 
      jobs: transformedJobs,
      search_metadata: data.search_metadata,
      debug_info: {
        original_response_keys: Object.keys(data),
        jobs_field_used: foundField,
        raw_jobs_count: jobsData?.length || 0
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in job-search function:', error);
    console.error('Error stack:', error.stack);
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

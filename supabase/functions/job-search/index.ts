
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

    console.log('API request URL:', `https://serpapi.com/search?${searchParams}`);

    const response = await fetch(`https://serpapi.com/search?${searchParams}`, {
      method: 'GET',
    });

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
    
    console.log('Job search successful, found jobs:', data.jobs_results?.length || 0);
    console.log('API response structure:', Object.keys(data));

    // Transform the data to match our expected format
    const transformedJobs = data.jobs_results?.map((job: any) => ({
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

    return new Response(JSON.stringify({ 
      jobs: transformedJobs,
      search_metadata: data.search_metadata 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in job-search function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchParams {
  query?: string;
  location?: string;
  remoteType?: string;
  employmentType?: string;
  seniorityLevel?: string;
  company?: string;
  maxAge?: number;
  limit?: number;
  offset?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { 
      query = '', 
      location = '', 
      remoteType = '', 
      employmentType = '', 
      seniorityLevel = '', 
      company = '', 
      maxAge = 30,
      limit = 50,
      offset = 0
    }: SearchParams = await req.json();

    console.log('Fast job search params:', { 
      query, location, remoteType, employmentType, seniorityLevel, company, maxAge, limit, offset 
    });

    // Use the optimized fast_search_jobs function
    const { data: jobs, error } = await supabase.rpc('fast_search_jobs', {
      search_query: query,
      location_filter: location,
      employment_type_filter: employmentType,
      seniority_filter: seniorityLevel,
      company_filter: company,
      result_limit: limit,
      result_offset: offset
    });

    if (error) {
      console.error('Fast search error:', error);
      throw error;
    }

    console.log(`Fast search returned ${jobs?.length || 0} jobs`);

    // Transform the response to match expected format
    const transformedJobs = (jobs || []).map((job: any) => ({
      id: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      description: job.description,
      salary: job.salary,
      posted_at: job.posted_at,
      job_url: job.job_url,
      apply_url: job.apply_url,
      source: job.source,
      via: job.via,
      thumbnail: job.thumbnail,
      logo_url: job.logo_url,
      job_type: job.job_type,
      employment_type: job.employment_type,
      experience_level: job.experience_level,
      seniority_level: job.seniority_level,
      remote_type: job.remote_type,
      company_size: job.company_size,
      industry: job.industry,
      job_function: job.job_function,
      scraped_at: job.scraped_at,
      quality_score: job.quality_score,
      relevance_score: job.relevance_score
    }));

    return new Response(
      JSON.stringify({ 
        jobs: transformedJobs,
        total: transformedJobs.length,
        warnings: []
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Fast job search error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        jobs: [],
        total: 0,
        warnings: ['Search temporarily unavailable. Please try again.']
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
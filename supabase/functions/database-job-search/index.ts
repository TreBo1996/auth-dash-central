
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
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
    } = await req.json();

    console.log('Database job search request:', { 
      query, location, remoteType, employmentType, seniorityLevel, company, maxAge, limit, offset 
    });

    // Validate required parameters
    if (!query && !location && !company) {
      return new Response(JSON.stringify({
        error: 'At least one search parameter (query, location, or company) is required',
        jobs: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
          totalResults: 0,
          resultsPerPage: limit
        }
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Use the database search function
    const { data: jobs, error } = await supabaseClient
      .rpc('search_jobs', {
        search_query: query || '',
        location_filter: location || '',
        remote_filter: remoteType || '',
        employment_type_filter: employmentType || '',
        seniority_filter: seniorityLevel || '',
        company_filter: company || '',
        max_age_days: maxAge,
        result_limit: limit,
        result_offset: offset
      });

    if (error) {
      console.error('Database search error:', error);
      throw error;
    }

    console.log(`Database search returned ${jobs?.length || 0} jobs`);

    // Get total count for pagination
    let totalResults = 0;
    try {
      const { count, error: countError } = await supabaseClient
        .from('cached_jobs')
        .select('*', { count: 'exact', head: true })
        .gte('scraped_at', new Date(Date.now() - maxAge * 24 * 60 * 60 * 1000).toISOString())
        .eq('is_expired', false);

      if (countError) {
        console.error('Error getting count:', countError);
        totalResults = jobs?.length || 0;
      } else {
        totalResults = count || 0;
      }
    } catch (countErr) {
      console.error('Count query failed:', countErr);
      totalResults = jobs?.length || 0;
    }

    const totalPages = Math.ceil(totalResults / limit);
    const currentPage = Math.floor(offset / limit) + 1;

    const warnings = [];
    if (jobs?.length === 0) {
      warnings.push('No jobs found. Try different search terms or expand your filters.');
    } else if (jobs && jobs.length < 5) {
      warnings.push('Few jobs found in database. Consider scraping fresh jobs for more results.');
    }

    return new Response(JSON.stringify({
      jobs: jobs || [],
      pagination: {
        currentPage,
        totalPages,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1,
        totalResults,
        resultsPerPage: limit
      },
      totalResults,
      warnings
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in database-job-search:', error);
    return new Response(JSON.stringify({
      error: error.message || 'Database search failed',
      jobs: [],
      pagination: {
        currentPage: 1,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
        totalResults: 0,
        resultsPerPage: 50
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

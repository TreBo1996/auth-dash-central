
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ApifyJobData {
  positionName: string;
  company: string;
  location: string;
  description: string;
  salary?: string;
  jobUrl: string;
  applyUrl?: string;
  postedAt?: string;
  employmentTypes?: string[];
  seniorityLevel?: string;
  jobFunction?: string;
  industries?: string[];
  companySize?: string;
  logoUrl?: string;
  jobBoard?: string;
  remote?: boolean;
  id?: string;
}

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
      query, 
      location = '', 
      maxJobs = 100,
      forceRefresh = false 
    } = await req.json();

    console.log('Starting Apify job scrape:', { query, location, maxJobs });

    if (!query) {
      throw new Error('Query parameter is required');
    }

    // Check if we need to scrape new jobs or return cached results
    if (!forceRefresh) {
      const { data: existingJobs } = await supabaseClient
        .rpc('search_jobs', {
          search_query: query,
          location_filter: location,
          max_age_days: 7, // Look for jobs scraped in last 7 days
          result_limit: maxJobs
        });

      if (existingJobs && existingJobs.length >= 10) {
        console.log(`Returning ${existingJobs.length} cached jobs`);
        return new Response(JSON.stringify({
          jobs: existingJobs,
          fromCache: true,
          totalResults: existingJobs.length
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Extract token from your endpoint
    const apifyToken = 'apify_api_FFh2jcXqfLXqRtENBhbiXg7DjYGLpT1PMyQA';
    const actorId = 'hZ7jrmnGci5b4D9Fv';
    
    // Use Google Jobs Scraper with your specific configuration
    const runInput = {
      queries: [`${query} ${location}`.trim()],
      maxPagesPerQuery: Math.ceil(maxJobs / 10),
      saveHtml: false,
      saveHtmlToKeyValueStore: false,
      includeUnfilteredResults: false
    };

    console.log('Starting Apify actor run...');
    
    // Start the actor run using your specific actor
    const runResponse = await fetch(`https://api.apify.com/v2/acts/apify~google-jobs-scraper/runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apifyToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(runInput)
    });

    if (!runResponse.ok) {
      const errorText = await runResponse.text();
      console.error('Apify run failed:', runResponse.status, errorText);
      throw new Error(`Apify run failed: ${runResponse.status} - ${errorText}`);
    }

    const runData = await runResponse.json();
    const runId = runData.data.id;
    
    console.log(`Apify run started with ID: ${runId}`);

    // Wait for the run to complete (with timeout)
    let runStatus = 'RUNNING';
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max wait time
    
    while (runStatus === 'RUNNING' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      
      const statusResponse = await fetch(`https://api.apify.com/v2/acts/apify~google-jobs-scraper/runs/${runId}`, {
        headers: {
          'Authorization': `Bearer ${apifyToken}`
        }
      });
      
      const statusData = await statusResponse.json();
      runStatus = statusData.data.status;
      attempts++;
      
      console.log(`Run status: ${runStatus}, attempt: ${attempts}`);
    }

    if (runStatus !== 'SUCCEEDED') {
      console.error(`Apify run did not succeed. Status: ${runStatus}`);
      throw new Error(`Apify run did not succeed. Status: ${runStatus}`);
    }

    // Get the results
    const resultsResponse = await fetch(`https://api.apify.com/v2/datasets/${runData.data.defaultDatasetId}/items`, {
      headers: {
        'Authorization': `Bearer ${apifyToken}`
      }
    });

    if (!resultsResponse.ok) {
      throw new Error(`Failed to fetch results: ${resultsResponse.status}`);
    }

    const apifyJobs: ApifyJobData[] = await resultsResponse.json();
    console.log(`Retrieved ${apifyJobs.length} jobs from Apify`);

    // Transform and insert jobs into Supabase
    const transformedJobs = apifyJobs.map(job => ({
      apify_job_id: job.id || job.jobUrl,
      title: job.positionName,
      company: job.company,
      location: job.location,
      description: job.description || '',
      salary: job.salary || null,
      posted_at: job.postedAt || null,
      job_url: job.jobUrl,
      apply_url: job.applyUrl || job.jobUrl,
      source: 'Apify',
      via: job.jobBoard || 'Google Jobs',
      logo_url: job.logoUrl || null,
      employment_type: job.employmentTypes?.[0] || null,
      seniority_level: job.seniorityLevel || null,
      job_function: job.jobFunction || null,
      industry: job.industries?.[0] || null,
      company_size: job.companySize || null,
      remote_type: job.remote ? 'remote' : null,
      data_source: 'apify',
      job_board: job.jobBoard || 'Google Jobs',
      quality_score: 7, // Default quality score for Apify jobs
      scraped_at: new Date().toISOString()
    }));

    // Insert jobs with conflict resolution (upsert based on apify_job_id)
    const insertedJobs = [];
    for (const job of transformedJobs) {
      try {
        const { data, error } = await supabaseClient
          .from('cached_jobs')
          .upsert(job, { 
            onConflict: 'apify_job_id',
            ignoreDuplicates: false 
          })
          .select();

        if (error) {
          console.error('Error inserting job:', error);
          continue;
        }

        if (data && data.length > 0) {
          insertedJobs.push(data[0]);
        }
      } catch (error) {
        console.error('Error processing job:', error);
        continue;
      }
    }

    console.log(`Successfully inserted/updated ${insertedJobs.length} jobs`);

    // Return the newly scraped jobs using our search function
    const { data: finalJobs } = await supabaseClient
      .rpc('search_jobs', {
        search_query: query,
        location_filter: location,
        max_age_days: 1, // Get jobs scraped today
        result_limit: maxJobs
      });

    return new Response(JSON.stringify({
      jobs: finalJobs || [],
      fromCache: false,
      totalResults: finalJobs?.length || 0,
      scrapedCount: insertedJobs.length,
      debug_info: {
        apify_run_id: runId,
        jobs_scraped: apifyJobs.length,
        jobs_inserted: insertedJobs.length
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in apify-job-scraper:', error);
    return new Response(JSON.stringify({
      error: error.message,
      jobs: [],
      totalResults: 0
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});


import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface IndeedJobData {
  title: string;
  company: string;
  location: string;
  description: string;
  salary?: string;
  jobUrl?: string;
  url?: string;
  link?: string;
  jobLink?: string;
  permalink?: string;
  href?: string;
  applyUrl?: string;
  postedDate?: string;
  jobType?: string;
  remote?: boolean;
  id?: string;
}

// Helper function to extract job URL from various possible fields
function extractJobUrl(job: IndeedJobData): string | null {
  const urlFields = ['jobUrl', 'url', 'link', 'jobLink', 'permalink', 'href'];
  
  for (const field of urlFields) {
    const url = job[field as keyof IndeedJobData] as string;
    if (url && typeof url === 'string' && url.trim()) {
      if (url.startsWith('http') || url.startsWith('//')) {
        return url.trim();
      }
      if (url.startsWith('/')) {
        return `https://www.indeed.com${url}`;
      }
    }
  }
  
  return null;
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
          max_age_days: 7,
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

    // Get Apify API key from environment
    const apifyToken = Deno.env.get('APIFY_API_KEY');
    if (!apifyToken) {
      throw new Error('APIFY_API_KEY not configured');
    }
    
    // Use Indeed scraper configuration (aligned with manual and scheduled scrapers)
    const runInput = {
      position: query,
      location: location || undefined,
      country: 'US',
      maxItems: maxJobs,
      followApplyRedirects: false,
      parseCompanyDetails: false,
      saveOnlyUniqueItems: true
    };

    console.log('Starting Apify Indeed scraper run...');
    
    // Start the actor run using Indeed scraper
    const runResponse = await fetch(`https://api.apify.com/v2/acts/misceres~indeed-scraper/runs`, {
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
      
      const statusResponse = await fetch(`https://api.apify.com/v2/acts/misceres~indeed-scraper/runs/${runId}`, {
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

    const indeedJobs: IndeedJobData[] = await resultsResponse.json();
    console.log(`Retrieved ${indeedJobs.length} jobs from Apify`);

    // Transform and insert jobs into Supabase (using consistent logic)
    const insertedJobs = [];
    let skippedCount = 0;

    for (let index = 0; index < indeedJobs.length; index++) {
      const job = indeedJobs[index];
      
      const jobUrl = extractJobUrl(job);
      
      if (!jobUrl) {
        console.log(`Skipping job ${index}: No valid URL found`);
        skippedCount++;
        continue;
      }

      const transformedJob = {
        apify_job_id: job.id || `${query}-${index}-${Date.now()}`,
        title: job.title || query,
        company: job.company || 'Unknown Company',
        location: job.location || location || 'Remote',
        description: job.description || '',
        salary: job.salary || null,
        posted_at: job.postedDate || null,
        job_url: jobUrl,
        apply_url: job.applyUrl || jobUrl,
        source: 'Apify',
        via: 'Indeed',
        logo_url: null,
        employment_type: job.jobType || null,
        seniority_level: null,
        job_function: null,
        industry: null,
        company_size: null,
        remote_type: job.remote ? 'remote' : null,
        data_source: 'apify',
        job_board: 'Indeed',
        quality_score: 7,
        scraped_at: new Date().toISOString()
      };

      try {
        const { data, error } = await supabaseClient
          .from('cached_jobs')
          .upsert(transformedJob, { 
            onConflict: 'apify_job_id',
            ignoreDuplicates: false 
          })
          .select();

        if (error) {
          console.error('Error inserting job:', error);
          skippedCount++;
          continue;
        }

        if (data && data.length > 0) {
          insertedJobs.push(data[0]);
        }
      } catch (error) {
        console.error('Error processing job:', error);
        skippedCount++;
        continue;
      }
    }

    console.log(`Successfully inserted/updated ${insertedJobs.length} jobs, ${skippedCount} skipped`);

    // Return the newly scraped jobs using our search function
    const { data: finalJobs } = await supabaseClient
      .rpc('search_jobs', {
        search_query: query,
        location_filter: location,
        max_age_days: 1,
        result_limit: maxJobs
      });

    return new Response(JSON.stringify({
      jobs: finalJobs || [],
      fromCache: false,
      totalResults: finalJobs?.length || 0,
      scrapedCount: insertedJobs.length,
      debug_info: {
        apify_run_id: runId,
        jobs_scraped: indeedJobs.length,
        jobs_inserted: insertedJobs.length,
        jobs_skipped: skippedCount
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


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
  PositionName?: string;
  positionName?: string;
  jobTitle?: string;
}

// Helper function to extract job URL from various possible fields
function extractJobUrl(job: IndeedJobData): string | null {
  // Try different possible URL field names
  const urlFields = ['jobUrl', 'url', 'link', 'jobLink', 'permalink', 'href'];
  
  for (const field of urlFields) {
    const url = job[field as keyof IndeedJobData] as string;
    if (url && typeof url === 'string' && url.trim()) {
      // Ensure it's a proper URL
      if (url.startsWith('http') || url.startsWith('//')) {
        return url.trim();
      }
      // If it's a relative URL, make it absolute
      if (url.startsWith('/')) {
        return `https://www.indeed.com${url}`;
      }
    }
  }
  
  return null;
}

// Helper function to extract job title from various possible fields
function extractJobTitle(job: IndeedJobData, fallbackTitle: string): string {
  const titleFields = ['PositionName', 'positionName', 'jobTitle', 'title'];
  
  for (const field of titleFields) {
    const title = job[field as keyof IndeedJobData] as string;
    if (title && typeof title === 'string' && title.trim()) {
      return title.trim();
    }
  }
  
  return fallbackTitle;
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

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!authHeader) {
      throw new Error('No authorization header provided');
    }

    // Verify the user and check admin status
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(authHeader);
    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.is_admin) {
      throw new Error('Access denied - admin privileges required');
    }

    const { query = 'software engineer', location = '', maxJobs = 50 } = await req.json();

    console.log('Admin manual job scrape started:', { query, location, maxJobs, userId: user.id });

    // Get Apify API key from environment
    const apifyToken = Deno.env.get('APIFY_API_KEY');
    if (!apifyToken) {
      throw new Error('APIFY_API_KEY not configured');
    }

    // Use Indeed scraper configuration (same as scheduled scraper)
    const runInput = {
      position: query,
      location: location || undefined,
      country: 'US',
      maxItems: maxJobs,
      followApplyRedirects: false,
      parseCompanyDetails: false,
      saveOnlyUniqueItems: true
    };

    console.log('Starting Apify Indeed scraper run with parameters:', runInput);

    // Start the actor run using Indeed scraper (same as scheduled scraper)
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
    const maxAttempts = 30; // 2.5 minutes max wait time
    
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
    console.log(`Retrieved ${indeedJobs.length} jobs from Apify Indeed scraper`);

    // Log a sample job to understand the data structure
    if (indeedJobs.length > 0) {
      console.log(`Sample job data for title analysis:`, JSON.stringify(indeedJobs[0], null, 2));
    }

    // Transform and insert jobs into Supabase (using same logic as scheduled scraper)
    let insertedCount = 0;
    let skippedCount = 0;

    for (let index = 0; index < indeedJobs.length; index++) {
      const job = indeedJobs[index];
      
      // Extract job URL from various possible fields
      const jobUrl = extractJobUrl(job);
      
      if (!jobUrl) {
        console.log(`Skipping job ${index}: No valid URL found`);
        skippedCount++;
        continue;
      }

      const transformedJob = {
        apify_job_id: job.id || `manual-${query}-${index}-${Date.now()}`,
        title: extractJobTitle(job, query),
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
          console.error(`Error inserting job ${index}:`, error);
          skippedCount++;
          continue;
        }

        if (data && data.length > 0) {
          insertedCount++;
        }
      } catch (error) {
        console.error(`Error processing job ${index}:`, error);
        skippedCount++;
        continue;
      }
    }

    console.log(`Manual scraping completed: ${insertedCount}/${indeedJobs.length} jobs inserted, ${skippedCount} skipped`);

    // Archive old jobs after successful scrape
    const { data: archiveResult } = await supabaseClient.rpc('archive_old_jobs');
    console.log(`Archived ${archiveResult || 0} old jobs`);

    // Get updated statistics
    const { data: stats } = await supabaseClient.rpc('get_job_statistics');

    return new Response(JSON.stringify({
      success: true,
      message: 'Job scraping completed successfully',
      jobsScraped: insertedCount,
      jobsReturned: indeedJobs.length,
      archivedJobs: archiveResult || 0,
      statistics: stats,
      fromCache: false,
      debug_info: {
        apify_run_id: runId,
        jobs_from_apify: indeedJobs.length,
        jobs_inserted: insertedCount,
        jobs_skipped: skippedCount
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in manual-job-scraper:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      message: 'Failed to run job scraper'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

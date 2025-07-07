import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ApifyRun {
  id: string;
  status: string;
  startedAt: string;
  finishedAt: string;
  defaultDatasetId: string;
}

interface ApifyJobData {
  id?: string;
  PositionName?: string;
  positionName?: string;
  jobTitle?: string;
}

// Helper function to extract valid job title from Apify data
function extractJobTitle(job: ApifyJobData): string | null {
  const titleFields = ['PositionName', 'positionName', 'jobTitle'];
  
  for (const field of titleFields) {
    const title = job[field as keyof ApifyJobData] as string;
    if (title && typeof title === 'string' && title.trim()) {
      const cleanTitle = title.trim();
      
      // Use same validation as our scrapers
      if (isValidJobTitle(cleanTitle)) {
        return cleanTitle;
      }
    }
  }
  
  return null;
}

// Same validation function as in our scrapers
function isValidJobTitle(title: string): boolean {
  if (title.length < 3 || title.length > 80) {
    return false;
  }
  
  // Reject location names, state abbreviations, cities, descriptions, etc.
  const invalidPatterns = [
    /^[A-Za-z\s]+,\s*(FL|CA|NY|TX|WA|IL|PA|OH|GA|NC|MI|NJ|VA|WI|AZ|MA|TN|IN|MO|MD|WV|DE|UT|NV|NM|HI|AK|VT|WY|RI|CT|NH|ME|ND|SD|MT|ID|OR|KS|NE|IA|AR|LA|MS|AL|SC|KY|OK|CO|MN),?\s*(USA?)?$/i,
    /^(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)$/i,
    /^(Tampa|Orlando|Miami|Jacksonville|Atlanta|Charlotte|Raleigh|Nashville|Austin|Dallas|Houston|Phoenix|Los Angeles|San Francisco|Seattle|Portland|Chicago|Detroit|Boston|New York|Philadelphia|Washington)$/i,
    /^(description|about|who you|what you|overview|summary|position|job|role):/i,
    /^(description|about|who you|what you|overview|summary)/i,
    /(description|overview|summary|about us|who you|what you)/i,
    /^(company|corporation|inc\.|llc|ltd\.|co\.)$/i,
    /^(looking for|seeking|hiring|we are|join our|opportunity|position available)/i,
    /^(we|our|the|this|that|job|position|role|opportunity|candidate|applicant)/i,
    /^\*/,
    /^Time Type:/i,
    /^A Day in the Life/i,
    /^(Benefits|Requirements|Responsibilities|Qualifications):/i,
    /^(marketing|sales|engineer|software engineer|developer|manager|analyst|business analyst|project manager|account executive|business development|account manager|senior|junior|entry level|remote|full time|part time)$/i,
    /^\d+$/,
    /^\d+\s*-\s*\d+$/,
    /^(apply now|click here|learn more|view details|see description)$/i,
    /^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/i,
    /^(january|february|march|april|may|june|july|august|september|october|november|december)$/i
  ];
  
  // Check if title includes multiple sentences (descriptions)
  if (title.includes('.') && title.split('.').length > 2) {
    return false;
  }
  
  return !invalidPatterns.some(pattern => pattern.test(title));
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

    const { dryRun = true } = await req.json();

    console.log('Starting job title repair process...', { dryRun, userId: user.id });

    // Get Apify API key
    const apifyToken = Deno.env.get('APIFY_API_KEY');
    if (!apifyToken) {
      throw new Error('APIFY_API_KEY not configured');
    }

    // Get recent runs from the Indeed scraper
    const runsResponse = await fetch(`https://api.apify.com/v2/acts/misceres~indeed-scraper/runs?limit=20&desc=true`, {
      headers: {
        'Authorization': `Bearer ${apifyToken}`
      }
    });

    if (!runsResponse.ok) {
      throw new Error(`Failed to fetch Apify runs: ${runsResponse.status}`);
    }

    const runsData = await runsResponse.json();
    const recentRuns = runsData.data.items as ApifyRun[];

    console.log(`Found ${recentRuns.length} recent runs`);

    // Filter runs from the last 6 hours that succeeded
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
    const relevantRuns = recentRuns.filter(run => 
      run.status === 'SUCCEEDED' && 
      new Date(run.finishedAt) > sixHoursAgo
    );

    console.log(`Found ${relevantRuns.length} relevant recent runs`);

    if (relevantRuns.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        message: 'No recent successful Apify runs found in the last 6 hours',
        stats: { runsChecked: recentRuns.length, relevantRuns: 0 }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create a mapping of apify_job_id to correct positionName
    const jobTitleMapping: Record<string, string> = {};
    let totalJobsProcessed = 0;

    for (const run of relevantRuns) {
      try {
        console.log(`Processing dataset ${run.defaultDatasetId} from run ${run.id}`);
        
        // Fetch dataset items
        const datasetResponse = await fetch(`https://api.apify.com/v2/datasets/${run.defaultDatasetId}/items`, {
          headers: {
            'Authorization': `Bearer ${apifyToken}`
          }
        });

        if (!datasetResponse.ok) {
          console.log(`Failed to fetch dataset ${run.defaultDatasetId}: ${datasetResponse.status}`);
          continue;
        }

        const jobs: ApifyJobData[] = await datasetResponse.json();
        console.log(`Found ${jobs.length} jobs in dataset ${run.defaultDatasetId}`);

        for (const job of jobs) {
          if (job.id) {
            const validTitle = extractJobTitle(job);
            if (validTitle) {
              jobTitleMapping[job.id] = validTitle;
              totalJobsProcessed++;
            }
          }
        }
      } catch (error) {
        console.error(`Error processing dataset ${run.defaultDatasetId}:`, error);
        continue;
      }
    }

    console.log(`Created mapping for ${Object.keys(jobTitleMapping).length} jobs`);

    // Get jobs from our database that have apify_job_id
    const { data: dbJobs, error: dbError } = await supabaseClient
      .from('cached_jobs')
      .select('id, title, apify_job_id')
      .not('apify_job_id', 'is', null);

    if (dbError) {
      throw new Error(`Failed to fetch database jobs: ${dbError.message}`);
    }

    console.log(`Found ${dbJobs.length} jobs in database with apify_job_id`);

    // Find jobs that need updating
    const jobsToUpdate = dbJobs.filter(dbJob => {
      const correctTitle = jobTitleMapping[dbJob.apify_job_id];
      return correctTitle && correctTitle !== dbJob.title;
    });

    console.log(`Found ${jobsToUpdate.length} jobs that need title updates`);

    let updatedCount = 0;
    
    if (!dryRun && jobsToUpdate.length > 0) {
      // Update jobs in batches
      const batchSize = 50;
      for (let i = 0; i < jobsToUpdate.length; i += batchSize) {
        const batch = jobsToUpdate.slice(i, i + batchSize);
        
        for (const job of batch) {
          const correctTitle = jobTitleMapping[job.apify_job_id];
          
          const { error: updateError } = await supabaseClient
            .from('cached_jobs')
            .update({ 
              title: correctTitle,
              updated_at: new Date().toISOString()
            })
            .eq('id', job.id);

          if (updateError) {
            console.error(`Failed to update job ${job.id}:`, updateError);
          } else {
            updatedCount++;
            console.log(`Updated job ${job.id}: "${job.title}" → "${correctTitle}"`);
          }
        }
      }
    }

    const stats = {
      runsChecked: recentRuns.length,
      relevantRuns: relevantRuns.length,
      jobsInMapping: Object.keys(jobTitleMapping).length,
      jobsInDatabase: dbJobs.length,
      jobsNeedingUpdate: jobsToUpdate.length,
      jobsActuallyUpdated: updatedCount,
      dryRun
    };

    // Show some examples of what would be/was updated
    const examples = jobsToUpdate.slice(0, 10).map(job => ({
      id: job.id,
      oldTitle: job.title,
      newTitle: jobTitleMapping[job.apify_job_id],
      apifyJobId: job.apify_job_id
    }));

    return new Response(JSON.stringify({
      success: true,
      message: dryRun 
        ? `Dry run completed. Found ${jobsToUpdate.length} jobs that need title updates.`
        : `Successfully updated ${updatedCount} job titles.`,
      stats,
      examples
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in repair-job-titles:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      message: 'Failed to repair job titles'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
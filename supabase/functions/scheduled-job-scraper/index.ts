
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
  jobUrl: string;
  applyUrl?: string;
  postedDate?: string;
  jobType?: string;
  remote?: boolean;
  id?: string;
}

interface JobTitleResult {
  jobTitle: string;
  success: boolean;
  jobsScraped: number;
  jobsInserted: number;
  error?: string;
  runId?: string;
}

const JOB_TITLES = [
  'Business Analyst',
  'Project Manager', 
  'Software Engineer',
  'Product Manager',
  'Sales Representative',
  'Account Executive',
  'Manager'
];

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
      jobTitles = JOB_TITLES,
      maxJobsPerTitle = 50,
      location = 'United States' // Default to United States, can be overridden
    } = await req.json().catch(() => ({}));

    console.log(`Starting batch job scraping for ${jobTitles.length} job titles`);

    const apifyToken = 'apify_api_FFh2jcXqfLXqRtENBhbiXg7DjYGLpT1PMyQA';
    const results: JobTitleResult[] = [];
    let totalJobsScraped = 0;
    let totalJobsInserted = 0;

    // Process each job title
    for (const jobTitle of jobTitles) {
      console.log(`Processing: ${jobTitle}`);
      
      try {
        // Use correct parameters for Indeed scraper
        const runInput = {
          position: jobTitle,
          location: location || undefined, // Use provided location or undefined for broadest results
          country: 'US',
          maxItems: maxJobsPerTitle,
          followApplyRedirects: false,
          parseCompanyDetails: false,
          saveOnlyUniqueItems: true
        };

        console.log(`Scraping ${jobTitle} with parameters:`, runInput);

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
          console.error(`Apify run failed for ${jobTitle}:`, runResponse.status, errorText);
          results.push({
            jobTitle,
            success: false,
            jobsScraped: 0,
            jobsInserted: 0,
            error: `Apify run failed: ${runResponse.status}`
          });
          continue;
        }

        const runData = await runResponse.json();
        const runId = runData.data.id;
        
        console.log(`Apify run started for ${jobTitle} with ID: ${runId}`);

        // Wait for the run to complete (with timeout)
        let runStatus = 'RUNNING';
        let attempts = 0;
        const maxAttempts = 30; // 2.5 minutes max wait time per job title
        
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
          
          console.log(`${jobTitle} run status: ${runStatus}, attempt: ${attempts}`);
        }

        if (runStatus !== 'SUCCEEDED') {
          console.error(`Apify run did not succeed for ${jobTitle}. Status: ${runStatus}`);
          results.push({
            jobTitle,
            success: false,
            jobsScraped: 0,
            jobsInserted: 0,
            error: `Run did not succeed. Status: ${runStatus}`,
            runId
          });
          continue;
        }

        // Get the results
        const resultsResponse = await fetch(`https://api.apify.com/v2/datasets/${runData.data.defaultDatasetId}/items`, {
          headers: {
            'Authorization': `Bearer ${apifyToken}`
          }
        });

        if (!resultsResponse.ok) {
          throw new Error(`Failed to fetch results for ${jobTitle}: ${resultsResponse.status}`);
        }

        const indeedJobs: IndeedJobData[] = await resultsResponse.json();
        console.log(`Retrieved ${indeedJobs.length} jobs for ${jobTitle}`);

        // Transform and insert jobs into Supabase
        const transformedJobs = indeedJobs.map((job, index) => ({
          apify_job_id: job.id || `${job.jobUrl}-${index}`, // Use job ID or create unique identifier
          title: job.title || jobTitle,
          company: job.company || 'Unknown Company',
          location: job.location || location || 'Remote',
          description: job.description || '',
          salary: job.salary || null,
          posted_at: job.postedDate || null,
          job_url: job.jobUrl,
          apply_url: job.applyUrl || job.jobUrl,
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
          quality_score: 7, // Default quality score for Apify jobs
          scraped_at: new Date().toISOString()
        }));

        // Insert jobs with conflict resolution using apify_job_id
        let insertedCount = 0;
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
              console.error(`Error inserting job for ${jobTitle}:`, error);
              continue;
            }

            if (data && data.length > 0) {
              insertedCount++;
            }
          } catch (error) {
            console.error(`Error processing job for ${jobTitle}:`, error);
            continue;
          }
        }

        results.push({
          jobTitle,
          success: true,
          jobsScraped: indeedJobs.length,
          jobsInserted: insertedCount,
          runId
        });

        totalJobsScraped += indeedJobs.length;
        totalJobsInserted += insertedCount;

        console.log(`Completed ${jobTitle}: ${insertedCount}/${indeedJobs.length} jobs inserted`);

        // Add a small delay between job titles to be respectful to Apify
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        console.error(`Error processing ${jobTitle}:`, error);
        results.push({
          jobTitle,
          success: false,
          jobsScraped: 0,
          jobsInserted: 0,
          error: error.message
        });
      }
    }

    const successfulJobs = results.filter(r => r.success).length;
    const failedJobs = results.filter(r => !r.success).length;

    console.log(`Batch scraping completed: ${successfulJobs}/${jobTitles.length} successful, ${totalJobsInserted} total jobs inserted`);

    return new Response(JSON.stringify({
      success: true,
      summary: {
        totalJobTitles: jobTitles.length,
        successfulJobs,
        failedJobs,
        totalJobsScraped,
        totalJobsInserted
      },
      results,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in scheduled-job-scraper:', error);
    return new Response(JSON.stringify({
      error: error.message,
      success: false,
      results: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

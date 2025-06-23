
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
      resultsPerPage = 100,
      datePosted = '',
      jobType = '',
      experienceLevel = ''
    } = await req.json();

    console.log('Searching jobs for:', { query, location, page, resultsPerPage, datePosted, jobType, experienceLevel });

    if (!serpApiKey) {
      throw new Error('SERP_API_KEY not configured');
    }

    const baseParams = new URLSearchParams({
      engine: 'google_jobs',
      q: query,
      api_key: serpApiKey,
      gl: 'us',
      hl: 'en'
    });

    // Handle location with fallback strategies
    if (location && location.trim()) {
      const cleanLocation = location.trim().toLowerCase();
      
      if (cleanLocation === 'remote' || cleanLocation.includes('remote')) {
        const remoteQuery = `${query} remote`;
        baseParams.set('q', remoteQuery);
        baseParams.append('location', 'United States');
      } else {
        baseParams.append('location', location.trim());
      }
    }

    // Add filters to query
    let enhancedQuery = query;
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
        enhancedQuery += ` ${dateFilter}`;
      }
    }

    if (jobType) {
      enhancedQuery += ` ${jobType}`;
    }

    if (experienceLevel) {
      enhancedQuery += ` ${experienceLevel}`;
    }

    baseParams.set('q', enhancedQuery);

    // Make multiple API calls to get more results
    const allJobs = [];
    const maxCalls = Math.min(10, Math.ceil(resultsPerPage / 10)); // Max 10 calls to get up to 100 results
    let totalResultsAvailable = 0;
    
    console.log(`Making ${maxCalls} API calls to aggregate results...`);

    for (let callIndex = 0; callIndex < maxCalls; callIndex++) {
      const start = callIndex * 10;
      const callParams = new URLSearchParams(baseParams);
      callParams.set('num', '10'); // Request 10 per call
      
      if (start > 0) {
        callParams.set('start', start.toString());
      }

      const apiUrl = `https://serpapi.com/search?${callParams}`;
      console.log(`API call ${callIndex + 1}/${maxCalls} - start: ${start}`);

      try {
        const response = await fetch(apiUrl, { method: 'GET' });
        
        if (!response.ok) {
          console.error(`API call ${callIndex + 1} failed:`, response.status, response.statusText);
          continue; // Skip this call and continue with others
        }

        const data = await response.json();
        
        // Check different possible field names for jobs
        const possibleJobFields = ['jobs_results', 'job_results', 'jobs', 'results'];
        let jobsData = null;
        
        for (const field of possibleJobFields) {
          if (data[field] && Array.isArray(data[field])) {
            jobsData = data[field];
            break;
          }
        }

        if (jobsData && jobsData.length > 0) {
          const transformedJobs = jobsData.map((job: any) => ({
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
            experience_level: null
          }));

          allJobs.push(...transformedJobs);
          console.log(`Call ${callIndex + 1}: Got ${jobsData.length} jobs, total so far: ${allJobs.length}`);
          
          // Update total results from first successful call
          if (callIndex === 0) {
            totalResultsAvailable = data.search_metadata?.total_results || 
                                  data.search_information?.total_results || 
                                  1000; // Assume more results exist
          }
        } else {
          console.log(`Call ${callIndex + 1}: No jobs found in response`);
          // If no results in this call, we might have reached the end
          if (callIndex > 0) {
            break;
          }
        }

        // Small delay between calls to be respectful to the API
        if (callIndex < maxCalls - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }

      } catch (error) {
        console.error(`Error in API call ${callIndex + 1}:`, error);
        continue; // Continue with next call
      }
    }

    console.log(`Final result: ${allJobs.length} jobs collected from ${maxCalls} API calls`);

    // Remove duplicates based on job_url
    const uniqueJobs = allJobs.filter((job, index, self) => 
      index === self.findIndex(j => j.job_url === job.job_url)
    );

    console.log(`After deduplication: ${uniqueJobs.length} unique jobs`);

    const totalPages = Math.ceil(uniqueJobs.length / 10); // 10 jobs per page on frontend
    
    return new Response(JSON.stringify({ 
      jobs: uniqueJobs,
      pagination: {
        currentPage: 1,
        totalPages,
        hasNextPage: uniqueJobs.length > 10,
        hasPreviousPage: false,
        totalResults: uniqueJobs.length,
        resultsPerPage: 10
      },
      warnings: uniqueJobs.length < resultsPerPage ? 
        [`Requested ${resultsPerPage} jobs but only found ${uniqueJobs.length} available results`] : [],
      debug_info: {
        api_calls_made: maxCalls,
        total_jobs_found: allJobs.length,
        unique_jobs_after_dedup: uniqueJobs.length,
        estimated_total_available: totalResultsAvailable
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in job-search function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      jobs: [],
      pagination: { currentPage: 1, totalPages: 0, hasNextPage: false, hasPreviousPage: false, totalResults: 0, resultsPerPage: 10 }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

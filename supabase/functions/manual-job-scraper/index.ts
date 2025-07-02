
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

    // Call the existing apify-job-scraper function
    const scrapeResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/apify-job-scraper`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query,
        location,
        maxJobs,
        forceRefresh: true
      })
    });

    const scrapeResult = await scrapeResponse.json();

    if (!scrapeResponse.ok) {
      throw new Error(`Scrape failed: ${scrapeResult.error || 'Unknown error'}`);
    }

    // Archive old jobs after successful scrape
    const { data: archiveResult } = await supabaseClient.rpc('archive_old_jobs');
    console.log(`Archived ${archiveResult || 0} old jobs`);

    // Get updated statistics
    const { data: stats } = await supabaseClient.rpc('get_job_statistics');

    return new Response(JSON.stringify({
      success: true,
      message: 'Job scraping completed successfully',
      jobsScraped: scrapeResult.scrapedCount || 0,
      jobsReturned: scrapeResult.totalResults || 0,
      archivedJobs: archiveResult || 0,
      statistics: stats,
      fromCache: scrapeResult.fromCache || false
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

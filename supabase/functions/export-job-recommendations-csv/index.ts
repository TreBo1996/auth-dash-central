import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { runId } = await req.json();

    if (!runId) {
      throw new Error('Run ID is required');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    console.log('[CSV-EXPORT] Starting CSV export for run:', runId);

    // Get detailed recommendations data
    const { data: recommendations, error: recsError } = await supabase
      .from('user_job_recommendations')
      .select(`
        match_score,
        title_similarity_score,
        experience_match_score,
        recommended_at,
        profiles!inner(email, full_name, desired_job_title, experience_level),
        cached_jobs!inner(title, company, location, salary, job_url, experience_level, quality_score)
      `)
      .eq('run_id', runId)
      .order('match_score', { ascending: false });

    if (recsError) {
      console.error('[CSV-EXPORT] Error fetching recommendations:', recsError);
      throw recsError;
    }

    if (!recommendations || recommendations.length === 0) {
      throw new Error('No recommendations found for this run');
    }

    console.log(`[CSV-EXPORT] Exporting ${recommendations.length} recommendations`);

    // Create CSV content
    const headers = [
      'User Email',
      'User Name',
      'User Desired Title',
      'User Experience Level',
      'Job Title',
      'Company',
      'Location',
      'Salary',
      'Job Experience Level',
      'Job URL',
      'Match Score',
      'Title Similarity',
      'Experience Match',
      'Job Quality Score',
      'Recommended At'
    ];

    const csvRows = [headers.join(',')];

    recommendations.forEach(rec => {
      const row = [
        `"${rec.profiles.email || ''}"`,
        `"${rec.profiles.full_name || ''}"`,
        `"${rec.profiles.desired_job_title || ''}"`,
        `"${rec.profiles.experience_level || ''}"`,
        `"${rec.cached_jobs.title || ''}"`,
        `"${rec.cached_jobs.company || ''}"`,
        `"${rec.cached_jobs.location || ''}"`,
        `"${rec.cached_jobs.salary || ''}"`,
        `"${rec.cached_jobs.experience_level || ''}"`,
        `"${rec.cached_jobs.job_url || ''}"`,
        rec.match_score?.toFixed(2) || '0',
        rec.title_similarity_score?.toFixed(2) || '0',
        rec.experience_match_score?.toFixed(2) || '0',
        rec.cached_jobs.quality_score || '0',
        `"${new Date(rec.recommended_at).toISOString()}"`
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');

    // Return CSV as downloadable file
    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="job-recommendations-${runId}.csv"`,
        ...corsHeaders
      }
    });

  } catch (error: any) {
    console.error('[CSV-EXPORT] Error:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
};

serve(handler);
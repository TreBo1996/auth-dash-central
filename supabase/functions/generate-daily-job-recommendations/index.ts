import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface JobRecommendation {
  userId: string;
  cachedJobId: string;
  matchScore: number;
  titleSimilarityScore: number;
  experienceMatchScore: number;
  mailchimpMergeData: any;
}

const calculateTitleSimilarity = (title1: string, title2: string): number => {
  const normalize = (str: string) => str.toLowerCase().replace(/[^\w\s]/g, '').trim();
  const t1 = normalize(title1);
  const t2 = normalize(title2);
  
  // Simple word overlap scoring
  const words1 = t1.split(/\s+/);
  const words2 = t2.split(/\s+/);
  
  const commonWords = words1.filter(word => words2.includes(word));
  const uniqueWords = new Set([...words1, ...words2]);
  
  return (commonWords.length / uniqueWords.size) * 100;
};

const calculateExperienceMatch = (userLevel: string, jobLevel: string): number => {
  if (!userLevel || !jobLevel) return 0;
  return userLevel.toLowerCase() === jobLevel.toLowerCase() ? 100 : 0;
};

const generateMailchimpMergeData = (user: any, jobs: any[]): any => {
  const mergeData: any = {
    USER_NAME: user.full_name || 'Job Seeker',
    RECOMMENDATION_DATE: new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  };

  // Add job data (up to 5 jobs)
  jobs.slice(0, 5).forEach((job, index) => {
    const jobNum = index + 1;
    mergeData[`JOB${jobNum}_TITLE`] = job.title || '';
    mergeData[`JOB${jobNum}_COMPANY`] = job.company || '';
    mergeData[`JOB${jobNum}_LOCATION`] = job.location || '';
    mergeData[`JOB${jobNum}_SALARY`] = job.salary || '';
    mergeData[`JOB${jobNum}_URL`] = job.job_url || '';
    mergeData[`JOB${jobNum}_MATCH_REASON`] = 
      `${Math.round(job.match_score)}% match - ${Math.round(job.title_similarity_score)}% title similarity`;
  });

  // Fill empty slots if less than 5 jobs
  for (let i = jobs.length + 1; i <= 5; i++) {
    mergeData[`JOB${i}_TITLE`] = '';
    mergeData[`JOB${i}_COMPANY`] = '';
    mergeData[`JOB${i}_LOCATION`] = '';
    mergeData[`JOB${i}_SALARY`] = '';
    mergeData[`JOB${i}_URL`] = '';
    mergeData[`JOB${i}_MATCH_REASON`] = '';
  }

  return mergeData;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    console.log('[JOB-RECOMMENDATIONS] Starting daily job recommendations generation...');

    // Create a new recommendation run
    const { data: run, error: runError } = await supabase
      .from('daily_recommendation_runs')
      .insert({
        status: 'running',
        notes: 'Starting daily job recommendations generation'
      })
      .select()
      .single();

    if (runError) {
      console.error('[JOB-RECOMMENDATIONS] Error creating run:', runError);
      throw runError;
    }

    console.log('[JOB-RECOMMENDATIONS] Created run:', run.id);

    // Get eligible users (users with complete preferences who haven't received recommendations in 3 days)
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    // First get users with recent recommendations
    const { data: recentUsers, error: recentUsersError } = await supabase
      .from('user_job_recommendations')
      .select('user_id')
      .gte('recommended_at', threeDaysAgo.toISOString());

    if (recentUsersError) {
      console.error('[JOB-RECOMMENDATIONS] Error fetching recent users:', recentUsersError);
      throw recentUsersError;
    }

    const recentUserIds = recentUsers?.map(u => u.user_id) || [];

    // Get eligible users (excluding those with recent recommendations)
    let usersQuery = supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        desired_job_title,
        experience_level,
        preferred_location,
        industry_preferences,
        work_setting_preference
      `)
      .not('desired_job_title', 'is', null)
      .not('experience_level', 'is', null);

    // Exclude users with recent recommendations if any exist
    if (recentUserIds.length > 0) {
      usersQuery = usersQuery.not('id', 'in', `(${recentUserIds.map(id => `'${id}'`).join(',')})`);
    }

    const { data: eligibleUsers, error: usersError } = await usersQuery;

    if (usersError) {
      console.error('[JOB-RECOMMENDATIONS] Error fetching users:', usersError);
      throw usersError;
    }

    console.log(`[JOB-RECOMMENDATIONS] Found ${eligibleUsers?.length || 0} eligible users`);

    // Get today's quality jobs
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: qualityJobs, error: jobsError } = await supabase
      .from('cached_jobs')
      .select('*')
      .gte('scraped_at', today.toISOString())
      .gte('quality_score', 6)
      .eq('is_expired', false)
      .is('archived_at', null)
      .order('quality_score', { ascending: false })
      .limit(1000); // Limit to top 1000 quality jobs

    if (jobsError) {
      console.error('[JOB-RECOMMENDATIONS] Error fetching jobs:', jobsError);
      throw jobsError;
    }

    console.log(`[JOB-RECOMMENDATIONS] Found ${qualityJobs?.length || 0} quality jobs`);

    let totalRecommendations = 0;
    const recommendations: JobRecommendation[] = [];

    // Generate recommendations for each user
    for (const user of eligibleUsers || []) {
      const userRecommendations: any[] = [];

      // Score jobs for this user
      for (const job of qualityJobs || []) {
        const titleSimilarity = calculateTitleSimilarity(
          user.desired_job_title || '',
          job.title || ''
        );
        
        const experienceMatch = calculateExperienceMatch(
          user.experience_level || '',
          job.experience_level || ''
        );

        // Calculate overall match score (70% title, 30% experience)
        const matchScore = (titleSimilarity * 0.7) + (experienceMatch * 0.3);

        if (matchScore >= 60) { // Minimum 60% match
          userRecommendations.push({
            ...job,
            match_score: matchScore,
            title_similarity_score: titleSimilarity,
            experience_match_score: experienceMatch
          });
        }
      }

      // Sort by match score and take top 5
      userRecommendations.sort((a, b) => b.match_score - a.match_score);
      const topJobs = userRecommendations.slice(0, 5);

      if (topJobs.length > 0) {
        // Generate Mailchimp merge data
        const mailchimpData = generateMailchimpMergeData(user, topJobs);

        // Create recommendation records
        for (const job of topJobs) {
          recommendations.push({
            userId: user.id,
            cachedJobId: job.id,
            matchScore: job.match_score,
            titleSimilarityScore: job.title_similarity_score,
            experienceMatchScore: job.experience_match_score,
            mailchimpMergeData: mailchimpData
          });
          totalRecommendations++;
        }
      }
    }

    console.log(`[JOB-RECOMMENDATIONS] Generated ${totalRecommendations} recommendations`);

    // Insert recommendations in batches
    if (recommendations.length > 0) {
      const batchSize = 100;
      for (let i = 0; i < recommendations.length; i += batchSize) {
        const batch = recommendations.slice(i, i + batchSize);
        const insertData = batch.map(rec => ({
          user_id: rec.userId,
          cached_job_id: rec.cachedJobId,
          run_id: run.id,
          match_score: rec.matchScore,
          title_similarity_score: rec.titleSimilarityScore,
          experience_match_score: rec.experienceMatchScore,
          mailchimp_merge_data: rec.mailchimpMergeData
        }));

        const { error: insertError } = await supabase
          .from('user_job_recommendations')
          .insert(insertData);

        if (insertError) {
          console.error('[JOB-RECOMMENDATIONS] Error inserting batch:', insertError);
          throw insertError;
        }
      }
    }

    // Update run status
    const { error: updateError } = await supabase
      .from('daily_recommendation_runs')
      .update({
        status: 'completed',
        total_users_processed: eligibleUsers?.length || 0,
        total_recommendations_generated: totalRecommendations,
        notes: `Successfully generated ${totalRecommendations} recommendations for ${eligibleUsers?.length || 0} users`
      })
      .eq('id', run.id);

    if (updateError) {
      console.error('[JOB-RECOMMENDATIONS] Error updating run:', updateError);
      throw updateError;
    }

    const result = {
      success: true,
      runId: run.id,
      usersProcessed: eligibleUsers?.length || 0,
      recommendationsGenerated: totalRecommendations,
      message: `Generated ${totalRecommendations} job recommendations for ${eligibleUsers?.length || 0} eligible users`
    };

    console.log('[JOB-RECOMMENDATIONS] Completed successfully:', result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error: any) {
    console.error('[JOB-RECOMMENDATIONS] Error:', error);
    
    // Try to update run status to failed
    try {
      if (run?.id) {
        await supabase
          .from('daily_recommendation_runs')
          .update({
            status: 'failed',
            notes: `Error: ${error.message}`
          })
          .eq('id', run.id);
      }
    } catch (updateError) {
      console.error('[JOB-RECOMMENDATIONS] Error updating run status:', updateError);
    }
    
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
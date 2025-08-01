import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface JobRecommendation {
  title: string;
  company: string;
  location: string;
  salary: string | null;
  job_page_link: string;
  match_score: number;
}

const generateEmailHTML = (userName: string, jobs: JobRecommendation[]): string => {
  const currentDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Daily Job Recommendations</title>
    <style>
        body { margin: 0; padding: 20px; font-family: 'Arial', sans-serif; background-color: #f9fafb; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; }
        .header { background: linear-gradient(135deg, #2563eb 0%, #4f46e5 50%, #9333ea 100%); padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: bold; }
        .header p { color: #e0e7ff; margin: 10px 0 0 0; font-size: 16px; }
        .content { padding: 30px; }
        .greeting { font-size: 18px; color: #1f2937; margin-bottom: 20px; }
        .intro { font-size: 16px; color: #4b5563; margin-bottom: 30px; line-height: 1.6; }
        .job-card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin-bottom: 20px; background-color: #ffffff; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); }
        .job-header { display: flex; align-items: center; margin-bottom: 12px; gap: 16px; flex-wrap: wrap; }
        .job-title { font-size: 18px; font-weight: bold; color: #1f2937; margin: 0; }
        .match-badge { background-color: #10b981; color: #ffffff; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; flex-shrink: 0; white-space: nowrap; margin-left: auto; }
        .company { font-size: 16px; color: #6b7280; margin: 4px 0; }
        .job-details { display: flex; gap: 20px; margin: 12px 0; font-size: 14px; color: #6b7280; }
        .detail-item { display: flex; align-items: center; gap: 6px; }
        .job-actions { margin-top: 16px; }
        .btn { display: inline-block; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; margin-right: 12px; margin-bottom: 8px; }
        .btn-primary { background: linear-gradient(135deg, #2563eb 0%, #4f46e5 50%, #9333ea 100%); color: #ffffff !important; text-decoration: none; }
        .btn-secondary { background-color: #f3f4f6; color: #374151; }
        .footer { background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb; }
        .footer-text { font-size: 14px; color: #6b7280; margin-bottom: 16px; }
        .unsubscribe { font-size: 12px; color: #9ca3af; }
        .unsubscribe a { color: #6b7280; }
        @media (max-width: 600px) {
            .content { padding: 20px; }
            .job-details { flex-direction: column; gap: 8px; }
            .btn { display: block; margin-right: 0; margin-bottom: 12px; text-align: center; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div style="margin-bottom: 20px;">
                <img src="https://rezlit.com/lovable-uploads/41eb8276-f076-476b-93fb-6dab57a8c8b1.png" alt="RezLit" style="height: 40px; width: auto; display: inline-block;" />
            </div>
            <h1>New Job Matches - ${currentDate}</h1>
            <p>Personalized recommendations just for you</p>
        </div>
        
        <div class="content">
            <div class="greeting">Hi ${userName}! 👋</div>
            
            <div class="intro">
                We've found <strong>${jobs.length} excellent job matches</strong> that align perfectly with your career goals and experience. These opportunities were selected specifically for you based on your profile.
            </div>
            
            ${jobs.map((job, index) => `
            <div class="job-card">
                <div class="job-header">
                    <h3 class="job-title">${job.title}</h3>
                    <span class="match-badge">${Math.round(job.match_score)}% Match</span>
                </div>
                <div class="company">${job.company}</div>
                <div class="job-details">
                    <div class="detail-item">📍 ${job.location}</div>
                    <div class="detail-item">💰 ${job.salary || 'Salary not specified'}</div>
                </div>
                <div class="job-actions">
                    <a href="https://rezlit.com${job.job_page_link}" class="btn btn-primary">View Job Details</a>
                    <a href="https://rezlit.com/upload?job=https://rezlit.com${job.job_page_link}" class="btn btn-secondary">Create Optimized Resume</a>
                </div>
            </div>
            `).join('')}
        </div>
        
        <div class="footer">
            <div class="footer-text">
                Ready to land your dream job? <strong>Create an ATS-optimized resume</strong> for each position to increase your interview chances by 3x!
            </div>
            <div class="footer-text">
                <a href="https://rezlit.com/dashboard" class="btn btn-primary">Visit Your Dashboard</a>
            </div>
            <div class="unsubscribe">
                Don't want these emails? <a href="https://rezlit.com/profile">Update your preferences</a>
            </div>
        </div>
    </div>
</body>
</html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[EMAIL] Function started, checking environment variables...');
    
    // Check if required environment variables are available
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const resendApiKey = Deno.env.get('Resend_API_KEY');
    
    console.log('[EMAIL] Environment check:', {
      supabaseUrl: supabaseUrl ? 'Set' : 'Missing',
      supabaseKey: supabaseKey ? 'Set' : 'Missing', 
      resendApiKey: resendApiKey ? 'Set' : 'Missing'
    });

    if (!resendApiKey) {
      console.error('[EMAIL] RESEND_API_KEY is not configured');
      return new Response(JSON.stringify({
        error: 'RESEND_API_KEY not configured in Supabase secrets',
        success: false
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const supabase = createClient(supabaseUrl!, supabaseKey!);
    const body = await req.json();
    const { action, runId, testEmail, testUserId, testUserName } = body;

    if (action === 'send-test') {
      console.log('[EMAIL] Sending test email to:', testEmail, 'with user ID:', testUserId);
      
      // Initialize Resend for sending emails
      const { Resend } = await import('npm:resend@2.0.0');
      const resend = new Resend(resendApiKey);
      
      let jobs: JobRecommendation[] = [];
      let userName = testUserName || 'Test User';

      // Generate real recommendations if testUserId is provided
      if (testUserId) {
        try {
          console.log('[EMAIL] Generating real job recommendations for user:', testUserId);
          
          // Get user preferences
          const { data: userProfile, error: userError } = await supabase
            .from('profiles')
            .select('full_name, desired_job_title, experience_level, preferred_location, work_setting_preference, job_type_preference')
            .eq('id', testUserId)
            .single();

          if (userError) {
            console.error('[EMAIL] Error fetching user profile:', userError);
          } else if (userProfile) {
            userName = userProfile.full_name || userName;
            console.log('[EMAIL] User profile loaded:', { 
              name: userName, 
              jobTitle: userProfile.desired_job_title,
              experience: userProfile.experience_level,
              location: userProfile.preferred_location
            });

            // Query quality jobs from the last 90 days with job recommendation category
            const { data: qualityJobs, error: jobsError } = await supabase
              .from('cached_jobs')
              .select('id, title, company, location, description, salary, job_url, job_page_link, scraped_at, quality_score, job_recommendation_category, remote_type')
              .gte('quality_score', 6)
              .gte('scraped_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
              .eq('is_expired', false)
              .is('archived_at', null)
              .order('quality_score', { ascending: false })
              .limit(200);

            if (jobsError) {
              console.error('[EMAIL] Error fetching jobs:', jobsError);
            } else if (qualityJobs && qualityJobs.length > 0) {
              console.log('[EMAIL] Found', qualityJobs.length, 'quality jobs for matching');

              // Pre-filter jobs by category to improve relevance using database categories
              const filteredJobs = userProfile.desired_job_title 
                ? await preFilterJobsByCategory(supabase, userProfile.desired_job_title, qualityJobs)
                : qualityJobs;

              console.log('[EMAIL] After category filtering:', filteredJobs.length, 'jobs remain');

              // Enhanced location-based filtering
              const locationFilteredJobs = applyLocationFiltering(
                filteredJobs, 
                userProfile.preferred_location, 
                userProfile.work_setting_preference
              );

              console.log('[EMAIL] After location filtering:', locationFilteredJobs.length, 'jobs remain');

              // Calculate match scores for each job
              const jobsWithScores = locationFilteredJobs.map(job => {
                // Title similarity (70% weight)
                const titleSimilarity = userProfile.desired_job_title 
                  ? calculateTitleSimilarity(userProfile.desired_job_title, job.title)
                  : 0.5;

                // Experience match (10% weight)  
                const experienceMatch = userProfile.experience_level
                  ? calculateExperienceMatch(userProfile.experience_level, job.title)
                  : 0.5;

                // Enhanced location scoring
                const locationMatch = calculateLocationMatch(
                  userProfile.preferred_location, 
                  job.location, 
                  job.remote_type
                );

                // Calculate base score
                let baseScore = titleSimilarity * 0.7 + experienceMatch * 0.1;
                
                // Apply location adjustments
                baseScore += locationMatch.bonus * 0.01; // Convert bonus points to percentage
                baseScore -= locationMatch.penalty * 0.01; // Apply penalty

                const matchScore = Math.round(Math.max(0, Math.min(100, baseScore * 100)));

                console.log(`[EMAIL] Job: "${job.title}" | Title similarity: ${Math.round(titleSimilarity * 100)}% | Location: ${locationMatch.reason} (${locationMatch.penalty > 0 ? '-' + locationMatch.penalty : '+' + locationMatch.bonus} pts) | Overall match: ${matchScore}%`);

                return {
                  ...job,
                  match_score: matchScore,
                  title_similarity: titleSimilarity,
                  experience_match: experienceMatch,
                  location_match: locationMatch
                };
              });

              // Enhanced filtering with adaptive thresholds based on remote vs local jobs
              const isRemoteUser = userProfile.work_setting_preference === 'remote';
              const isHybridUser = userProfile.work_setting_preference === 'hybrid';
              
              // Different thresholds for remote vs local jobs
              const REMOTE_MIN_MATCH_SCORE = 50;
              const REMOTE_MIN_TITLE_SIMILARITY = 20; // Convert to percentage to match new function
              const LOCAL_MIN_MATCH_SCORE = 75;
              const LOCAL_MIN_TITLE_SIMILARITY = 40;
              
              console.log(`[EMAIL] User work preference: ${userProfile.work_setting_preference || 'not specified'}`);
              
              let qualifiedJobs = jobsWithScores
                .filter(job => {
                  // Check if job is remote
                  const isJobRemote = job.location_match.reason.includes('remote job');
                  
                  // Use adaptive thresholds
                  const minMatchScore = (isRemoteUser || isHybridUser) && isJobRemote ? 
                    REMOTE_MIN_MATCH_SCORE : LOCAL_MIN_MATCH_SCORE;
                  const minTitleSimilarity = (isRemoteUser || isHybridUser) && isJobRemote ? 
                    REMOTE_MIN_TITLE_SIMILARITY : LOCAL_MIN_TITLE_SIMILARITY;
                  
                  const passesMatch = job.match_score >= minMatchScore;
                  const passesTitleSimilarity = job.title_similarity >= minTitleSimilarity;
                  
                  const jobType = isJobRemote ? 'REMOTE' : 'LOCAL';
                  const threshold = isJobRemote ? 'relaxed' : 'standard';
                  
                  if (passesMatch && passesTitleSimilarity) {
                    console.log(`[EMAIL] ✅ ${jobType} Job "${job.title}" qualifies (${threshold} thresholds): ${job.match_score}% match, ${Math.round(job.title_similarity)}% title similarity`);
                    return true;
                  } else {
                    console.log(`[EMAIL] ❌ ${jobType} Job "${job.title}" filtered out (${threshold} thresholds): ${job.match_score}% match, ${Math.round(job.title_similarity)}% title similarity`);
                    return false;
                  }
                })
                .sort((a, b) => {
                  // Prioritize remote jobs for remote/hybrid users
                  if ((isRemoteUser || isHybridUser)) {
                    const aIsRemote = a.location_match.reason.includes('remote job');
                    const bIsRemote = b.location_match.reason.includes('remote job');
                    if (aIsRemote !== bIsRemote) {
                      return bIsRemote ? 1 : -1; // Remote jobs first
                    }
                  }
                  return b.match_score - a.match_score;
                });

              console.log(`[EMAIL] ${qualifiedJobs.length} jobs meet the adaptive filtering criteria`);
              
              // Enhanced fallback logic
              if (qualifiedJobs.length < 3) {
                console.log(`[EMAIL] Insufficient qualified jobs (${qualifiedJobs.length}), applying enhanced fallback logic...`);
                
                // First fallback: Category-specific jobs regardless of score
                const categoryJobs = jobsWithScores
                  .filter(job => {
                    // Must be in correct category and have some title similarity
                    return job.title_similarity >= 10; // Very low threshold
                  })
                  .sort((a, b) => b.match_score - a.match_score);
                
                console.log(`[EMAIL] Category fallback found ${categoryJobs.length} jobs`);
                
                if (categoryJobs.length >= 3) {
                  qualifiedJobs = categoryJobs.slice(0, 5);
                  console.log(`[EMAIL] Using category fallback: ${qualifiedJobs.length} jobs`);
                } else {
                  // Last resort: Take best jobs available
                  qualifiedJobs = jobsWithScores
                    .sort((a, b) => b.match_score - a.match_score)
                    .slice(0, 3);
                  console.log(`[EMAIL] Using last resort fallback: ${qualifiedJobs.length} jobs`);
                }
              }

              const topMatches = qualifiedJobs.slice(0, 5);

              // Convert to JobRecommendation format - use Job Search page with auto-expand
              jobs = topMatches.map(job => ({
                title: job.title,
                company: job.company,
                location: job.location || 'Location not specified',
                salary: job.salary || 'Salary not disclosed',
                job_page_link: `/job-search?jobId=database_${job.id}&autoExpand=true`,
                match_score: job.match_score
              }));

              console.log('[EMAIL] Generated', jobs.length, 'real job recommendations with scores:', 
                jobs.map(j => `${j.title} (${j.match_score}%)`).join(', '));
            }
          }
        } catch (error) {
          console.error('[EMAIL] Error generating real recommendations:', error);
        }
      }

      // Fall back to sample jobs if no real jobs found
      if (jobs.length === 0) {
        console.log('[EMAIL] Using sample jobs for test email');
        jobs = [
          {
            title: "Senior Software Engineer",
            company: "TechCorp Inc.",
            location: "San Francisco, CA",
            salary: "$120,000 - $180,000",
            job_page_link: "/job-search?jobId=database_00000000-0000-0000-0000-000000000001&autoExpand=true",
            match_score: 95
          },
          {
            title: "Full Stack Developer",
            company: "InnovateTech",
            location: "Remote",
            salary: "$90,000 - $140,000",
            job_page_link: "/job-search?jobId=database_00000000-0000-0000-0000-000000000002&autoExpand=true",
            match_score: 88
          },
          {
            title: "Frontend Developer",
            company: "DesignFirst Studios",
            location: "Austin, TX",
            salary: "$80,000 - $120,000",
            job_page_link: "/job-search?jobId=database_00000000-0000-0000-0000-000000000003&autoExpand=true",
            match_score: 82
          }
        ];
      }

      const emailHTML = generateEmailHTML(userName, jobs);
      
      // Send the actual email using Resend
      const emailResponse = await resend.emails.send({
        from: 'RezLit Job Alerts <jobs@rezlit.com>',
        to: [testEmail],
        subject: `🎯 Your Daily Job Matches - ${new Date().toLocaleDateString()}`,
        html: emailHTML,
      });

      console.log('[EMAIL] Test email sent with HTML length:', emailHTML.length);

      return new Response(JSON.stringify({
        success: true,
        message: 'Test email sent successfully',
        emailId: emailResponse.data?.id,
        jobCount: jobs.length,
        userName: userName,
        realData: testUserId ? true : false
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    if (action === 'send-campaign') {
      // Send emails to all users with desired job titles using enhanced recommendation logic
      console.log(`[EMAIL] Starting enhanced campaign for all active users`);

      // Initialize Resend for campaign emails
      const { Resend } = await import('npm:resend@2.0.0');
      const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

      // Get all users who have desired_job_title set (only send to users with profiles completed)
      const { data: eligibleUsers, error: usersError } = await supabase
        .from('profiles')
        .select('id, email, full_name, desired_job_title, experience_level, preferred_location, work_setting_preference')
        .not('desired_job_title', 'is', null)
        .not('desired_job_title', 'eq', '')
        .not('email', 'is', null);

      if (usersError) {
        console.error('[EMAIL] Error fetching eligible users:', usersError);
        throw usersError;
      }

      if (!eligibleUsers || eligibleUsers.length === 0) {
        console.log('[EMAIL] No eligible users found with desired job titles');
        return new Response(JSON.stringify({ 
          success: true,
          message: 'No users found with desired job titles set',
          emailsSent: 0,
          totalEligibleUsers: 0
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      console.log(`[EMAIL] Found ${eligibleUsers.length} eligible users with job titles`);

      // Get quality jobs for matching (same logic as test emails)
      const { data: jobs, error: jobsError } = await supabase
        .from('cached_jobs')
        .select('*')
        .gte('quality_score', 3)
        .eq('is_expired', false)
        .is('archived_at', null)
        .gte('scraped_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
        .order('scraped_at', { ascending: false })
        .limit(200);

      if (jobsError) {
        console.error('[EMAIL] Error fetching jobs:', jobsError);
        throw jobsError;
      }

      console.log(`[EMAIL] Found ${jobs?.length || 0} quality jobs for matching`);

      let emailsSent = 0;
      let emailsFailed = 0;
      let usersSkipped = 0;

      // Process each eligible user
      for (const user of eligibleUsers) {
        try {
          console.log(`[EMAIL] Processing user: ${user.full_name} (${user.desired_job_title})`);

          // Use the same enhanced job recommendation logic from test emails
          const userProfile = {
            name: user.full_name || 'Job Seeker',
            jobTitle: user.desired_job_title,
            experience: user.experience_level || 'mid',
            location: user.preferred_location || 'Remote'
          };

          // Map user title to category
          const { data: categoryData } = await supabase
            .from('job_categories')
            .select('*');

          let userCategory = 'Other';
          const normalizedTitle = userProfile.jobTitle.toLowerCase();

          for (const cat of categoryData || []) {
            const keywords = cat.keywords || [];
            for (const keyword of keywords) {
              if (normalizedTitle.includes(keyword.toLowerCase())) {
                userCategory = cat.category_name;
                console.log(`[EMAIL] Mapped "${userProfile.jobTitle}" to category "${userCategory}" via keyword "${keyword}"`);
                break;
              }
            }
            if (userCategory !== 'Other') break;
          }

          // Filter jobs by category
          const categoryJobs = jobs?.filter(job => 
            job.job_recommendation_category === userCategory
          ) || [];

          console.log(`[EMAIL] Found ${categoryJobs.length} jobs in category "${userCategory}"`);

          if (categoryJobs.length === 0) {
            console.log(`[EMAIL] No jobs found for user ${user.full_name} in category ${userCategory}`);
            usersSkipped++;
            continue;
          }

          // Apply location filtering
          const locationFilteredJobs = applyLocationFiltering(
            categoryJobs,
            userProfile.location,
            user.work_setting_preference || 'hybrid'
          );

          console.log(`[EMAIL] After location filtering: ${locationFilteredJobs.length} jobs remain`);

          if (locationFilteredJobs.length === 0) {
            console.log(`[EMAIL] No jobs found for user ${user.full_name} after location filtering`);
            usersSkipped++;
            continue;
          }

          // Calculate match scores and apply adaptive filtering
          const jobsWithScores = locationFilteredJobs.map(job => {
            const titleSimilarity = calculateTitleSimilarity(userProfile.jobTitle, job.title);
            const experienceMatch = calculateExperienceMatch(userProfile.experience, job.experience_level || 'mid');
            const locationScore = calculateLocationMatch(userProfile.location, job.location || '', job.remote_type, user.work_setting_preference || 'hybrid');
            
            const baseMatch = (titleSimilarity / 100) * 70 + experienceMatch * 20 + (job.quality_score / 10) * 10;
            const finalMatch = Math.min(100, Math.max(0, baseMatch + locationScore.bonus));

            return {
              ...job,
              match_score: Math.round(finalMatch),
              title_similarity: titleSimilarity
            };
          });

          // Apply adaptive filtering (same logic as test emails)
          const qualifiedJobs = jobsWithScores.filter(job => {
            const isLocal = job.location?.toLowerCase().includes(userProfile.location.toLowerCase());
            const isRemote = job.remote_type === 'remote' || 
                           job.location?.toLowerCase().includes('remote') ||
                           job.title?.toLowerCase().includes('remote');

            const matchThreshold = (isLocal || isRemote) ? 75 : 85;
            const titleThreshold = (isLocal || isRemote) ? 80 : 90;

            const qualifies = job.match_score >= matchThreshold && job.title_similarity >= titleThreshold;
            
            if (qualifies) {
              const typeStr = isLocal ? "LOCAL" : isRemote ? "REMOTE" : "OTHER";
              const thresholdStr = (isLocal || isRemote) ? "relaxed thresholds" : "standard thresholds";
              console.log(`[EMAIL] ✅ ${typeStr} Job "${job.title}" qualifies (${thresholdStr}): ${job.match_score}% match, ${job.title_similarity}% title similarity`);
            }

            return qualifies;
          });

          console.log(`[EMAIL] ${qualifiedJobs.length} jobs meet the adaptive filtering criteria`);

          if (qualifiedJobs.length === 0) {
            console.log(`[EMAIL] No qualified jobs found for user ${user.full_name}`);
            usersSkipped++;
            continue;
          }

          // Take top 5 matches
          const topMatches = qualifiedJobs
            .sort((a, b) => b.match_score - a.match_score)
            .slice(0, 5);

          // Convert to JobRecommendation format - use Job Search page with auto-expand
          const jobRecommendations = topMatches.map(job => ({
            title: job.title,
            company: job.company,
            location: job.location || 'Location not specified',
            salary: job.salary || 'Salary not disclosed',
            job_page_link: `/job-search?jobId=database_${job.id}&autoExpand=true`,
            match_score: job.match_score
          }));

          console.log(`[EMAIL] Generated ${jobRecommendations.length} real job recommendations with scores: ${jobRecommendations.map(j => `${j.title} (${j.match_score}%)`).join(', ')}`);

          // Generate email HTML
          const emailHTML = generateEmailHTML(userProfile.name, jobRecommendations);

          // Send email
          const emailResult = await resend.emails.send({
            from: 'RezLit Jobs <jobs@mail.rezlit.com>',
            to: [user.email],
            subject: `🚀 ${jobRecommendations.length} New Job Matches for You`,
            html: emailHTML,
          });

          if (emailResult.error) {
            console.error(`[EMAIL] Failed to send email to ${user.email}:`, emailResult.error);
            emailsFailed++;
          } else {
            console.log(`[EMAIL] Email sent successfully to ${user.email} with ${jobRecommendations.length} job recommendations`);
            emailsSent++;
          }

          // Add a small delay between emails
          await new Promise(resolve => setTimeout(resolve, 200));

        } catch (error) {
          console.error(`[EMAIL] Error processing user ${user.id}:`, error);
          emailsFailed++;
        }
      }

      console.log(`[EMAIL] Enhanced campaign completed: ${emailsSent} sent, ${emailsFailed} failed, ${usersSkipped} skipped (no matches)`);

      return new Response(JSON.stringify({ 
        success: true,
        message: `Enhanced campaign completed successfully`,
        emailsSent,
        emailsFailed,
        usersSkipped,
        totalEligibleUsers: eligibleUsers.length
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    return new Response(JSON.stringify({
      error: 'Invalid action specified'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error: any) {
    console.error('[EMAIL] Error:', error);
    
    return new Response(JSON.stringify({
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
};

// Helper functions for job matching and location filtering

function parseLocation(location: string): { city: string; state: string; full: string } {
  if (!location) return { city: '', state: '', full: '' };
  
  const normalized = location.trim();
  const parts = normalized.split(',').map(p => p.trim());
  
  if (parts.length >= 2) {
    return {
      city: parts[0].toLowerCase(),
      state: parts[1].toLowerCase(),
      full: normalized.toLowerCase()
    };
  }
  
  return {
    city: normalized.toLowerCase(),
    state: '',
    full: normalized.toLowerCase()
  };
}

function calculateLocationMatch(userLocation: string, jobLocation: string, jobRemoteType: string): {
  isMatch: boolean;
  penalty: number;
  bonus: number;
  reason: string;
} {
  // Enhanced remote detection - check both remote_type field and location field
  const remoteKeywords = ['remote', 'anywhere', 'work from home', 'wfh', 'telecommute', 'virtual', 'home-based', 'distributed', 'remote work', 'remote position'];
  const isRemoteByType = jobRemoteType && jobRemoteType.toLowerCase().includes('remote');
  const isRemoteByLocation = jobLocation && remoteKeywords.some(keyword => 
    jobLocation.toLowerCase().includes(keyword.toLowerCase())
  );
  
  // Remote jobs get no penalty regardless of user location
  if (isRemoteByType || isRemoteByLocation) {
    const detectionMethod = isRemoteByType ? 'remote_type field' : 'location field';
    return { isMatch: true, penalty: 0, bonus: 0, reason: `remote job (detected via ${detectionMethod})` };
  }
  
  if (!userLocation || !jobLocation) {
    return { isMatch: false, penalty: 15, bonus: 0, reason: 'missing location data' };
  }
  
  const userLoc = parseLocation(userLocation);
  const jobLoc = parseLocation(jobLocation);
  
  // Exact city match
  if (userLoc.city && jobLoc.city && userLoc.city === jobLoc.city) {
    return { isMatch: true, penalty: 0, bonus: 10, reason: 'exact city match' };
  }
  
  // City name variations (St. vs Saint, etc.)
  if (userLoc.city && jobLoc.city) {
    const userCityNormalized = userLoc.city.replace(/^st\.?\s/i, 'saint ');
    const jobCityNormalized = jobLoc.city.replace(/^st\.?\s/i, 'saint ');
    if (userCityNormalized === jobCityNormalized) {
      return { isMatch: true, penalty: 0, bonus: 10, reason: 'city name variation match' };
    }
  }
  
  // Same state, different city
  if (userLoc.state && jobLoc.state && userLoc.state === jobLoc.state) {
    return { isMatch: true, penalty: 15, bonus: 0, reason: 'same state, different city' };
  }
  
  // Different state/location
  return { isMatch: false, penalty: 20, bonus: 0, reason: 'different location' };
}

function applyLocationFiltering(jobs: any[], userLocation: string, workSetting: string): any[] {
  if (!userLocation || jobs.length === 0) {
    console.log('[EMAIL] No location filtering applied - missing user location or no jobs');
    return jobs;
  }

  console.log(`[EMAIL] Applying location filtering for "${userLocation}" with work setting: "${workSetting}"`);

  // Separate jobs by location compatibility
  const localJobs: any[] = [];
  const remoteJobs: any[] = [];
  const sameStateJobs: any[] = [];
  const otherLocationJobs: any[] = [];

  for (const job of jobs) {
    const locationMatch = calculateLocationMatch(userLocation, job.location, job.remote_type);
    
    if (locationMatch.reason === 'remote job') {
      remoteJobs.push(job);
    } else if (locationMatch.reason === 'exact city match' || locationMatch.reason === 'city name variation match') {
      localJobs.push(job);
    } else if (locationMatch.reason === 'same state, different city') {
      sameStateJobs.push(job);
    } else {
      otherLocationJobs.push(job);
    }
  }

  console.log(`[EMAIL] Location breakdown: ${localJobs.length} local, ${remoteJobs.length} remote, ${sameStateJobs.length} same state, ${otherLocationJobs.length} other locations`);

  // Apply work setting preferences
  let filteredJobs: any[] = [];

  if (workSetting === 'remote') {
    // Remote preference: prioritize remote jobs, then local for hybrid options
    filteredJobs = [...remoteJobs, ...localJobs.slice(0, 3), ...sameStateJobs.slice(0, 2)];
  } else if (workSetting === 'onsite') {
    // Onsite preference: prioritize local, then same state, limit remote
    filteredJobs = [...localJobs, ...sameStateJobs, ...remoteJobs.slice(0, 2)];
  } else {
    // Hybrid or default: balanced approach
    // If we have sufficient local jobs (3+), prioritize them and remote
    if (localJobs.length >= 3) {
      filteredJobs = [...localJobs, ...remoteJobs, ...sameStateJobs.slice(0, 3)];
    } else {
      // Insufficient local jobs, prioritize remote as fallback
      filteredJobs = [...localJobs, ...remoteJobs, ...sameStateJobs, ...otherLocationJobs.slice(0, 5)];
    }
  }

  console.log(`[EMAIL] After work setting filtering (${workSetting}): ${filteredJobs.length} jobs remain`);

  return filteredJobs;
}

function calculateTitleSimilarity(userTitle: string, jobTitle: string): number {
  if (!userTitle || !jobTitle) return 0;
  
  const normalizeTitle = (title: string) => 
    title.toLowerCase()
      .replace(/\b(senior|sr|junior|jr|lead|principal|staff)\b/g, '')
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  
  const userTitleNorm = normalizeTitle(userTitle);
  const jobTitleNorm = normalizeTitle(jobTitle);
  
  // Enhanced exact matching - check both normalized and original titles
  if (userTitleNorm === jobTitleNorm) return 100; // Return percentage for clearer logging
  
  // Check original titles for exact match (case-insensitive)
  if (userTitle.toLowerCase() === jobTitle.toLowerCase()) return 100;
  
  // Check for exact phrase within the job title
  if (jobTitleNorm.includes(userTitleNorm) || userTitleNorm.includes(jobTitleNorm)) {
    return 90;
  }
  
  // Handle common abbreviations and variations
  const titleVariations: { [key: string]: string[] } = {
    'project manager': ['pm', 'program manager', 'project mgr'],
    'software engineer': ['software developer', 'dev', 'engineer'],
    'data scientist': ['data analyst', 'ml engineer'],
    'business analyst': ['ba', 'business systems analyst'],
    'product manager': ['product owner', 'po'],
  };
  
  // Check for variations
  for (const [base, variations] of Object.entries(titleVariations)) {
    if (userTitleNorm.includes(base) || variations.some(v => userTitleNorm.includes(v))) {
      if (jobTitleNorm.includes(base) || variations.some(v => jobTitleNorm.includes(v))) {
        return 95; // High score for variations
      }
    }
  }
  
  const userWords = userTitleNorm.split(' ').filter(w => w.length > 2);
  const jobWords = jobTitleNorm.split(' ').filter(w => w.length > 2);
  
  if (userWords.length === 0 || jobWords.length === 0) return 0;
  
  // Core job function keywords (higher weight)
  const coreKeywords = ['project', 'program', 'product', 'data', 'software', 'sales', 'marketing', 'finance', 'operations', 'analyst', 'engineer', 'developer', 'designer', 'manager', 'director', 'coordinator'];
  
  let weightedScore = 0;
  let totalWeight = 0;
  
  for (const userWord of userWords) {
    const isCore = coreKeywords.includes(userWord);
    const weight = isCore ? 3 : 1; // Core keywords get 3x weight
    
    if (jobWords.includes(userWord)) {
      weightedScore += weight;
    }
    totalWeight += weight;
  }
  
  const similarity = totalWeight > 0 ? (weightedScore / totalWeight) * 100 : 0; // Convert to percentage
  
  // Reduce penalty for different categories (was too harsh)
  const userCore = userWords.filter(w => coreKeywords.includes(w));
  const jobCore = jobWords.filter(w => coreKeywords.includes(w));
  
  if (userCore.length > 0 && jobCore.length > 0) {
    const coreOverlap = userCore.some(w => jobCore.includes(w));
    if (!coreOverlap) {
      return Math.min(similarity * 0.5, 50); // Reduced penalty - was too harsh at 0.3
    }
  }
  
  return Math.min(similarity, 100);
}

function calculateExperienceMatch(userLevel: string, jobTitle: string): number {
  if (!userLevel || !jobTitle) return 0.5;
  
  const jobLower = jobTitle.toLowerCase();
  const userLower = userLevel.toLowerCase();
  
  // Experience level matching logic (reduced weight)
  if (userLower.includes('entry') || userLower.includes('junior')) {
    if (jobLower.includes('senior') || jobLower.includes('lead') || jobLower.includes('principal')) {
      return 0.3;
    }
    if (jobLower.includes('junior') || jobLower.includes('entry') || (!jobLower.includes('senior') && !jobLower.includes('lead'))) {
      return 0.9;
    }
  }
  
  if (userLower.includes('mid') || userLower.includes('intermediate')) {
    if (jobLower.includes('senior') || jobLower.includes('lead')) {
      return 0.8;
    }
    if (jobLower.includes('junior') || jobLower.includes('entry')) {
      return 0.7;
    }
    return 0.9;
  }
  
  if (userLower.includes('senior') || userLower.includes('experienced')) {
    if (jobLower.includes('junior') || jobLower.includes('entry')) {
      return 0.5;
    }
    return 0.9;
  }
  
  return 0.7; // Default neutral match
}

// Helper function to map user job title to job category using database
async function mapUserTitleToCategory(supabase: any, userJobTitle: string): Promise<string | null> {
  if (!userJobTitle) return null;
  
  const normalizedTitle = userJobTitle.toLowerCase();
  
  // Get all job categories with their keywords
  const { data: categories, error } = await supabase
    .from('job_categories')
    .select('category_name, keywords');
    
  if (error || !categories) {
    console.error('[EMAIL] Error fetching job categories:', error);
    return null;
  }
  
  // Find the best matching category
  for (const category of categories) {
    const keywords = category.keywords || [];
    for (const keyword of keywords) {
      if (normalizedTitle.includes(keyword.toLowerCase())) {
        console.log(`[EMAIL] Mapped "${userJobTitle}" to category "${category.category_name}" via keyword "${keyword}"`);
        return category.category_name;
      }
    }
  }
  
  console.log(`[EMAIL] No category match found for "${userJobTitle}"`);
  return null;
}

// Helper function to pre-filter jobs by category for better relevance
async function preFilterJobsByCategory(supabase: any, userJobTitle: string, jobs: any[]): Promise<any[]> {
  // Map user's job title to a category
  const userCategory = await mapUserTitleToCategory(supabase, userJobTitle);
  
  if (!userCategory) {
    console.log('[EMAIL] No user category found, returning all jobs');
    return jobs;
  }
  
  console.log(`[EMAIL] Filtering jobs for category: ${userCategory}`);
  
  // Filter jobs that match the user's category
  const categoryFilteredJobs = jobs.filter(job => 
    job.job_recommendation_category === userCategory
  );
  
  console.log(`[EMAIL] Found ${categoryFilteredJobs.length} jobs in category "${userCategory}"`);
  
  // If we have enough jobs in the category, return them
  if (categoryFilteredJobs.length >= 3) {
    return categoryFilteredJobs;
  }
  
  // Define related categories for fallback
  const relatedCategories: { [key: string]: string[] } = {
    'Project Manager': ['Business Analyst', 'Operations'],
    'Software Engineer': ['Data Scientist'],
    'Business Analyst': ['Project Manager', 'Operations'],
    'Marketing': ['Sales'],
    'Sales': ['Marketing'],
    'Data Scientist': ['Software Engineer'],
    'Human Resources': ['Operations'],
    'Finance': ['Operations'],
    'Operations': ['Project Manager', 'Business Analyst']
  };
  
  // Try to include related categories
  const related = relatedCategories[userCategory] || [];
  let expandedJobs = [...categoryFilteredJobs];
  
  for (const relatedCategory of related) {
    const relatedCategoryJobs = jobs.filter(job => 
      job.job_recommendation_category === relatedCategory
    );
    expandedJobs = [...expandedJobs, ...relatedCategoryJobs];
    
    if (expandedJobs.length >= 10) break; // Limit expansion
  }
  
  console.log(`[EMAIL] After related category expansion: ${expandedJobs.length} jobs`);
  
  // If still not enough, add some high-quality jobs from any category
  if (expandedJobs.length < 5) {
    const additionalJobs = jobs
      .filter(job => !expandedJobs.find(ej => ej.id === job.id))
      .slice(0, 10 - expandedJobs.length);
    expandedJobs = [...expandedJobs, ...additionalJobs];
  }
  
  return expandedJobs;
}

serve(handler);
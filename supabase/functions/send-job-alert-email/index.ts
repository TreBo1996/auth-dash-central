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

              // Enhanced filtering with fallback logic
              const MIN_MATCH_SCORE = 75; // Reduced from 85
              const MIN_TITLE_SIMILARITY = 0.4; // Reduced from 0.6
              const FALLBACK_MATCH_SCORE = 70;
              
              let qualifiedJobs = jobsWithScores
                .filter(job => {
                  const passesMatch = job.match_score >= MIN_MATCH_SCORE;
                  const passesTitleSimilarity = job.title_similarity >= MIN_TITLE_SIMILARITY;
                  
                  if (passesMatch && passesTitleSimilarity) {
                    console.log(`[EMAIL] ✅ Job "${job.title}" qualifies: ${job.match_score}% match, ${Math.round(job.title_similarity * 100)}% title similarity`);
                    return true;
                  } else {
                    console.log(`[EMAIL] ❌ Job "${job.title}" filtered out: ${job.match_score}% match, ${Math.round(job.title_similarity * 100)}% title similarity`);
                    return false;
                  }
                })
                .sort((a, b) => b.match_score - a.match_score);

              console.log(`[EMAIL] ${qualifiedJobs.length} jobs meet the ${MIN_MATCH_SCORE}% match threshold`);
              
              // If insufficient jobs, use fallback criteria
              if (qualifiedJobs.length < 3) {
                console.log(`[EMAIL] Insufficient jobs at ${MIN_MATCH_SCORE}% threshold, trying ${FALLBACK_MATCH_SCORE}% fallback`);
                qualifiedJobs = jobsWithScores
                  .filter(job => job.match_score >= FALLBACK_MATCH_SCORE)
                  .sort((a, b) => b.match_score - a.match_score);
                console.log(`[EMAIL] ${qualifiedJobs.length} jobs meet the ${FALLBACK_MATCH_SCORE}% fallback threshold`);
              }

              const topMatches = qualifiedJobs.slice(0, 5);

              // Convert to JobRecommendation format
              jobs = topMatches.map(job => ({
                title: job.title,
                company: job.company,
                location: job.location || 'Location not specified',
                salary: job.salary || 'Salary not disclosed',
                job_page_link: job.job_page_link || job.job_url || `/job/${job.id}`,
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
            job_page_link: "/job/database/sample-1",
            match_score: 95
          },
          {
            title: "Full Stack Developer",
            company: "InnovateTech",
            location: "Remote",
            salary: "$90,000 - $140,000",
            job_page_link: "/job/database/sample-2",
            match_score: 88
          },
          {
            title: "Frontend Developer",
            company: "DesignFirst Studios",
            location: "Austin, TX", 
            salary: "$80,000 - $120,000",
            job_page_link: "/job/database/sample-3",
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

    if (action === 'send-campaign' && runId) {
      // Send email campaign to all users from a recommendation run
      console.log('[EMAIL] Starting email campaign for run:', runId);
      
      // Initialize Resend for campaign emails
      const { Resend } = await import('npm:resend@2.0.0');
      const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

      // Get all user recommendations for this run
      const { data: recommendations, error: recError } = await supabase
        .from('user_job_recommendations')
        .select(`
          user_id,
          match_score,
          cached_jobs!inner(
            title,
            company,
            location,
            salary,
            job_page_link
          ),
          profiles!inner(
            full_name,
            email
          )
        `)
        .eq('run_id', runId)
        .is('email_sent_at', null);

      if (recError) {
        console.error('[EMAIL] Error fetching recommendations:', recError);
        throw recError;
      }

      // Group recommendations by user
      const userRecommendations = new Map();
      
      for (const rec of recommendations || []) {
        const userId = rec.user_id;
        if (!userRecommendations.has(userId)) {
          userRecommendations.set(userId, {
            user: rec.profiles,
            jobs: []
          });
        }
        
        userRecommendations.get(userId).jobs.push({
          title: rec.cached_jobs.title,
          company: rec.cached_jobs.company,
          location: rec.cached_jobs.location,
          salary: rec.cached_jobs.salary,
          job_page_link: rec.cached_jobs.job_page_link,
          match_score: rec.match_score
        });
      }

      let emailsSent = 0;
      const errors: string[] = [];

      // Send emails to each user
      for (const [userId, data] of userRecommendations) {
        try {
          const { user, jobs } = data;
          const emailHTML = generateEmailHTML(user.full_name || 'Job Seeker', jobs);
          
          // Send the actual email using Resend
          const emailResponse = await resend.emails.send({
            from: 'RezLit Job Alerts <jobs@rezlit.com>',
            to: [user.email],
            subject: `🎯 Your Daily Job Matches - ${new Date().toLocaleDateString()}`,
            html: emailHTML,
          });

          // Update recommendation records with email sent timestamp
          await supabase
            .from('user_job_recommendations')
            .update({ email_sent_at: new Date().toISOString() })
            .eq('run_id', runId)
            .eq('user_id', userId);

          emailsSent++;
          console.log(`[EMAIL] Sent email to ${user.email} with ${jobs.length} jobs`);
          
        } catch (error) {
          console.error(`[EMAIL] Error sending to user ${userId}:`, error);
          errors.push(`User ${userId}: ${error.message}`);
        }
      }

      // Update the run with email campaign completion
      await supabase
        .from('daily_recommendation_runs')
        .update({
          mailchimp_updated_at: new Date().toISOString(),
          notes: `Email campaign completed. Sent ${emailsSent} emails. ${errors.length > 0 ? 'Errors: ' + errors.slice(0, 3).join('; ') : ''}`
        })
        .eq('id', runId);

      return new Response(JSON.stringify({
        success: true,
        emailsSent,
        totalUsers: userRecommendations.size,
        errors: errors.length,
        message: `Successfully sent ${emailsSent} job alert emails`
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
  // Remote jobs have no location penalty
  if (jobRemoteType && jobRemoteType.toLowerCase().includes('remote')) {
    return { isMatch: true, penalty: 0, bonus: 0, reason: 'remote job' };
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
  
  // Exact phrase match gets highest score
  if (userTitleNorm === jobTitleNorm) return 1.0;
  
  // Check for exact phrase within the job title
  if (jobTitleNorm.includes(userTitleNorm) || userTitleNorm.includes(jobTitleNorm)) {
    return 0.9;
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
  
  const similarity = totalWeight > 0 ? weightedScore / totalWeight : 0;
  
  // Penalize completely different job categories
  const userCore = userWords.filter(w => coreKeywords.includes(w));
  const jobCore = jobWords.filter(w => coreKeywords.includes(w));
  
  if (userCore.length > 0 && jobCore.length > 0) {
    const coreOverlap = userCore.some(w => jobCore.includes(w));
    if (!coreOverlap) {
      return Math.min(similarity * 0.3, 0.3); // Major penalty for different categories
    }
  }
  
  return Math.min(similarity, 1);
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
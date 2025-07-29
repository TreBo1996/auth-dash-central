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
        body { margin: 0; padding: 0; font-family: 'Arial', sans-serif; background: linear-gradient(to bottom, #eff6ff, #f0f9ff); }
        .container { max-width: 600px; margin: 0 auto; background: linear-gradient(to bottom, #ffffff, #f8fafc); border-radius: 8px; }
        .header { background: linear-gradient(135deg, #2563eb 0%, #4f46e5 50%, #9333ea 100%); padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: bold; }
        .header p { color: #e0e7ff; margin: 10px 0 0 0; font-size: 16px; }
        .content { padding: 30px; }
        .greeting { font-size: 18px; color: #1f2937; margin-bottom: 20px; }
        .intro { font-size: 16px; color: #4b5563; margin-bottom: 30px; line-height: 1.6; }
        .job-card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin-bottom: 20px; background-color: #ffffff; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); }
        .job-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; flex-wrap: wrap; gap: 12px; }
        .job-title { font-size: 18px; font-weight: bold; color: #1f2937; margin: 0; flex: 1; min-width: 0; }
        .match-badge { background-color: #10b981; color: #ffffff; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; flex-shrink: 0; white-space: nowrap; }
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
            <h1>RezLit New Job Matches - ${currentDate}</h1>
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
    const { action, runId, testEmail, testUserName } = await req.json();

    if (action === 'send-test') {
      // Send a test email with sample data
      console.log('[EMAIL] Sending test email to:', testEmail);
      
      // Initialize Resend for sending emails
      const { Resend } = await import('npm:resend@2.0.0');
      const resend = new Resend(resendApiKey);
      
      const sampleJobs: JobRecommendation[] = [
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

      const emailHTML = generateEmailHTML(testUserName || 'Test User', sampleJobs);
      
      // Send the actual email using Resend
      const emailResponse = await resend.emails.send({
        from: 'RezLit Job Alerts <jobs@rezlit.com>',
        to: [testEmail],
        subject: `🎯 Your Daily Job Matches - ${new Date().toLocaleDateString()}`,
        html: emailHTML,
      });

      console.log('[EMAIL] Test email would be sent with HTML length:', emailHTML.length);

      return new Response(JSON.stringify({
        success: true,
        message: 'Test email sent successfully',
        emailId: emailResponse.data?.id
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

serve(handler);
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

    const mailchimpApiKey = Deno.env.get('MailChimp_API_KEY');
    if (!mailchimpApiKey) {
      throw new Error('Mailchimp API key not configured');
    }

    console.log('[MAILCHIMP-UPDATE] Starting Mailchimp merge field updates for run:', runId);

    // Extract datacenter from API key
    const datacenter = mailchimpApiKey.split('-')[1];
    const baseUrl = `https://${datacenter}.api.mailchimp.com/3.0`;

    // Get users with recommendations from this run
    const { data: recommendations, error: recsError } = await supabase
      .from('user_job_recommendations')
      .select(`
        user_id,
        mailchimp_merge_data,
        profiles!inner(email, full_name)
      `)
      .eq('run_id', runId)
      .is('email_sent_at', null);

    if (recsError) {
      console.error('[MAILCHIMP-UPDATE] Error fetching recommendations:', recsError);
      throw recsError;
    }

    if (!recommendations || recommendations.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No recommendations found for update',
        usersUpdated: 0
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    console.log(`[MAILCHIMP-UPDATE] Found ${recommendations.length} users to update`);

    // Get unique users and their merge data
    const userMergeData = new Map();
    recommendations.forEach(rec => {
      if (!userMergeData.has(rec.user_id)) {
        userMergeData.set(rec.user_id, {
          email: rec.profiles.email,
          mergeData: rec.mailchimp_merge_data
        });
      }
    });

    console.log(`[MAILCHIMP-UPDATE] Processing ${userMergeData.size} unique users`);

    // First, get the list ID (assuming one main list)
    const listsResponse = await fetch(`${baseUrl}/lists`, {
      headers: {
        'Authorization': `Bearer ${mailchimpApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!listsResponse.ok) {
      throw new Error(`Failed to fetch Mailchimp lists: ${listsResponse.statusText}`);
    }

    const listsData = await listsResponse.json();
    const listId = listsData.lists[0]?.id;

    if (!listId) {
      throw new Error('No Mailchimp list found');
    }

    console.log('[MAILCHIMP-UPDATE] Using list ID:', listId);

    let successCount = 0;
    let errorCount = 0;

    // Update Mailchimp merge fields in batches to respect rate limits
    for (const [userId, userData] of userMergeData) {
      try {
        // Add rate limiting delay (10 requests per second max)
        await new Promise(resolve => setTimeout(resolve, 100));

        const subscriberHash = await crypto.subtle.digest(
          'MD5',
          new TextEncoder().encode(userData.email.toLowerCase())
        );
        const hashedEmail = Array.from(new Uint8Array(subscriberHash))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');

        // Update subscriber merge fields
        const updateResponse = await fetch(
          `${baseUrl}/lists/${listId}/members/${hashedEmail}`,
          {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${mailchimpApiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              merge_fields: userData.mergeData
            })
          }
        );

        if (updateResponse.ok) {
          successCount++;
          console.log(`[MAILCHIMP-UPDATE] Updated user ${userData.email}`);
        } else {
          errorCount++;
          console.error(`[MAILCHIMP-UPDATE] Failed to update ${userData.email}:`, await updateResponse.text());
        }

      } catch (error) {
        errorCount++;
        console.error(`[MAILCHIMP-UPDATE] Error updating user ${userId}:`, error);
      }
    }

    // Update the run record with Mailchimp update timestamp
    const { error: updateError } = await supabase
      .from('daily_recommendation_runs')
      .update({
        mailchimp_updated_at: new Date().toISOString(),
        notes: `Mailchimp update completed: ${successCount} successful, ${errorCount} errors`
      })
      .eq('id', runId);

    if (updateError) {
      console.error('[MAILCHIMP-UPDATE] Error updating run record:', updateError);
    }

    const result = {
      success: true,
      usersUpdated: successCount,
      errors: errorCount,
      message: `Updated ${successCount} subscribers in Mailchimp${errorCount > 0 ? ` (${errorCount} errors)` : ''}`
    };

    console.log('[MAILCHIMP-UPDATE] Completed:', result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error: any) {
    console.error('[MAILCHIMP-UPDATE] Error:', error);
    
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
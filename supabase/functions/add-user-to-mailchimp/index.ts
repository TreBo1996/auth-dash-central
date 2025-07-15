import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();
    
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch user profile data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.error('Failed to fetch user profile:', profileError);
      throw new Error('User profile not found');
    }

    if (!profile.email || !profile.full_name) {
      console.error('User profile incomplete - missing email or name');
      throw new Error('User profile incomplete');
    }

    // Get Mailchimp credentials
    const mailchimpApiKey = Deno.env.get('MailChimp_API_Key');
    if (!mailchimpApiKey) {
      throw new Error('Mailchimp API key not configured');
    }

    // Extract datacenter from API key (format: key-datacenter)
    const datacenter = mailchimpApiKey.split('-').pop();
    const audienceId = '36a2698d05';

    // Prepare tags based on user preferences
    const tags: string[] = [];
    
    // Job title tag
    if (profile.desired_job_title) {
      const cleanTitle = profile.desired_job_title
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-');
      tags.push(`job-title-${cleanTitle}`);
    }

    // Experience level tag
    if (profile.experience_level) {
      tags.push(`experience-${profile.experience_level.toLowerCase()}`);
    }

    // Work setting tag
    if (profile.work_setting_preference) {
      tags.push(`work-setting-${profile.work_setting_preference.toLowerCase()}`);
    }

    // Industry tags
    if (profile.industry_preferences && Array.isArray(profile.industry_preferences)) {
      profile.industry_preferences.forEach((industry: string) => {
        const cleanIndustry = industry
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, '')
          .replace(/\s+/g, '-');
        tags.push(`industry-${cleanIndustry}`);
      });
    }

    // Prepare Mailchimp member data
    const memberData = {
      email_address: profile.email,
      status: 'subscribed',
      merge_fields: {
        FNAME: profile.full_name.split(' ')[0] || profile.full_name,
        LNAME: profile.full_name.split(' ').slice(1).join(' ') || '',
      },
      tags: tags
    };

    console.log('Adding user to Mailchimp:', {
      email: profile.email,
      name: profile.full_name,
      tags: tags
    });

    // Add user to Mailchimp
    const mailchimpResponse = await fetch(
      `https://${datacenter}.api.mailchimp.com/3.0/lists/${audienceId}/members`,
      {
        method: 'POST',
        headers: {
          'Authorization': `apikey ${mailchimpApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(memberData),
      }
    );

    const mailchimpData = await mailchimpResponse.json();

    if (!mailchimpResponse.ok) {
      // If user already exists, update their tags instead
      if (mailchimpData.title === 'Member Exists') {
        console.log('User already exists in Mailchimp, updating tags...');
        
        // Update existing member with new tags
        const updateResponse = await fetch(
          `https://${datacenter}.api.mailchimp.com/3.0/lists/${audienceId}/members/${btoa(profile.email.toLowerCase())}`,
          {
            method: 'PATCH',
            headers: {
              'Authorization': `apikey ${mailchimpApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              merge_fields: memberData.merge_fields,
              tags: tags
            }),
          }
        );

        if (!updateResponse.ok) {
          const updateError = await updateResponse.json();
          console.error('Failed to update Mailchimp member:', updateError);
          throw new Error('Failed to update Mailchimp member');
        }

        console.log('Successfully updated Mailchimp member with new tags');
      } else {
        console.error('Mailchimp API error:', mailchimpData);
        throw new Error('Failed to add user to Mailchimp');
      }
    } else {
      console.log('Successfully added user to Mailchimp:', mailchimpData.email_address);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'User successfully added to Mailchimp',
        tags: tags
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Mailchimp integration error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
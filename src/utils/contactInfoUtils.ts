import { supabase } from '@/integrations/supabase/client';

export interface ContactInfo {
  name: string;
  email: string;
  phone: string;
  location: string;
}

/**
 * Get user's contact information from profile first, with fallback to resume data
 */
export async function getUserContactInfo(userId: string): Promise<ContactInfo> {
  try {
    // First, try to get contact info from user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, email, contact_phone, contact_location')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
    }

    // If we have complete profile contact info, use it
    if (profile && profile.full_name && profile.email && profile.contact_phone && profile.contact_location) {
      return {
        name: profile.full_name,
        email: profile.email,
        phone: profile.contact_phone,
        location: profile.contact_location,
      };
    }

    // Fallback: Try to get contact info from initial resume sections
    const { data: contactSection, error: resumeError } = await supabase
      .from('initial_resume_sections')
      .select('content')
      .eq('section_type', 'contact')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (resumeError) {
      console.error('Error fetching resume contact section:', resumeError);
    }

    // Extract contact info from resume section if available
    let resumeContact: Partial<ContactInfo> = {};
    if (contactSection?.content) {
      const content = contactSection.content as any;
      resumeContact = {
        name: content.name || '',
        email: content.email || '',
        phone: content.phone || '',
        location: content.location || '',
      };
    }

    // Combine profile and resume data, preferring profile data where available
    return {
      name: profile?.full_name || resumeContact.name || '',
      email: profile?.email || resumeContact.email || '',
      phone: profile?.contact_phone || resumeContact.phone || '',
      location: profile?.contact_location || resumeContact.location || '',
    };
  } catch (error) {
    console.error('Error getting user contact info:', error);
    return {
      name: '',
      email: '',
      phone: '',
      location: '',
    };
  }
}

/**
 * Update user's contact information in profile
 */
export async function updateUserContactInfo(userId: string, contactInfo: Partial<ContactInfo>): Promise<boolean> {
  try {
    const updateData: any = {};
    
    if (contactInfo.name !== undefined) updateData.full_name = contactInfo.name;
    if (contactInfo.email !== undefined) updateData.email = contactInfo.email;
    if (contactInfo.phone !== undefined) updateData.contact_phone = contactInfo.phone;
    if (contactInfo.location !== undefined) updateData.contact_location = contactInfo.location;

    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId);

    if (error) {
      console.error('Error updating profile contact info:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating user contact info:', error);
    return false;
  }
}
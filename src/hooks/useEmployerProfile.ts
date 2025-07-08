import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Tables } from '@/integrations/supabase/types';

type EmployerProfile = Tables<'employer_profiles'>;

interface ProfileCompleteness {
  isComplete: boolean;
  missingFields: string[];
  completionPercentage: number;
}

const REQUIRED_FIELDS = [
  { key: 'company_name', label: 'Company Name' },
  { key: 'company_description', label: 'Company Description' },
  { key: 'industry', label: 'Industry' },
  { key: 'company_size', label: 'Company Size' },
  { key: 'contact_email', label: 'Contact Email' }
];

export const useEmployerProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<EmployerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const checkProfileCompleteness = (profile: EmployerProfile | null): ProfileCompleteness => {
    if (!profile) {
      return {
        isComplete: false,
        missingFields: REQUIRED_FIELDS.map(field => field.label),
        completionPercentage: 0
      };
    }

    const missingFields: string[] = [];

    REQUIRED_FIELDS.forEach(field => {
      const value = profile[field.key as keyof EmployerProfile];
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        missingFields.push(field.label);
      }
    });

    const completionPercentage = Math.round(
      ((REQUIRED_FIELDS.length - missingFields.length) / REQUIRED_FIELDS.length) * 100
    );

    return {
      isComplete: missingFields.length === 0,
      missingFields,
      completionPercentage
    };
  };

  const fetchProfile = async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('employer_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching employer profile:', error);
        return;
      }

      setProfile(data || null);
    } catch (error) {
      console.error('Error fetching employer profile:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const profileCompleteness = checkProfileCompleteness(profile);

  return {
    profile,
    loading,
    fetchProfile,
    profileCompleteness,
    requiredFields: REQUIRED_FIELDS
  };
};
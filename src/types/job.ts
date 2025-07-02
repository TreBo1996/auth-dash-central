
export interface UnifiedJob {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  salary: string | null;
  posted_at: string;
  job_url: string;
  source: 'employer' | 'database';
  // Employer-specific fields
  employer_profile?: {
    company_name: string;
    logo_url: string;
  };
  employment_type?: string;
  experience_level?: string;
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  created_at?: string;
  // Database job fields
  via?: string;
  thumbnail?: string;
  job_type?: string | null;
  requirements?: string;
  responsibilities?: string;
  benefits?: string;
}

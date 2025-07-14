
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
    company_description?: string;
    industry?: string;
    company_size?: string;
    website?: string;
  };
  employment_type?: string;
  experience_level?: string;
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  created_at?: string;
  // Structured fields (can be arrays for employer jobs, strings for database jobs)
  requirements?: string[] | string;
  responsibilities?: string[] | string;
  benefits?: string[] | string;
  // Database job fields
  via?: string;
  thumbnail?: string;
  job_type?: string | null;
  apply_url?: string | null;
  external_job_url?: string | null;
  data_source?: string; // 'employer' or 'apify' to distinguish job sources
  employer_job_posting_id?: string; // For employer jobs in cached_jobs, stores actual job posting ID
}

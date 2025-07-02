
import React, { useState, useEffect } from 'react';
import { JobSearchForm } from '@/components/job-search/JobSearchForm';
import { JobSearchResults } from '@/components/job-search/JobSearchResults';
import { EmployerJobCard } from '@/components/job-search/EmployerJobCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { Building, Search } from 'lucide-react';

interface JobSearchFilters {
  query: string;
  location: string;
  datePosted: string;
  jobType: string;
  experienceLevel: string;
  salaryMin: string;
}

interface ExternalJob {
  title: string;
  company: string;
  location: string;
  description: string;
  salary: string | null;
  posted_at: string;
  job_url: string;
  source: string;
  via: string;
  thumbnail?: string;
  job_type?: string | null;
  experience_level?: string | null;
}

interface EmployerJob {
  id: string;
  title: string;
  description: string;
  location: string;
  employment_type: string;
  experience_level: string;
  salary_min: number;
  salary_max: number;
  salary_currency: string;
  created_at: string;
  employer_profile: {
    company_name: string;
    logo_url: string;
  };
}

export const JobSearch: React.FC = () => {
  const [externalJobs, setExternalJobs] = useState<ExternalJob[]>([]);
  const [employerJobs, setEmployerJobs] = useState<EmployerJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [filters, setFilters] = useState<JobSearchFilters>({
    query: '',
    location: '',
    datePosted: '',
    jobType: '',
    experienceLevel: '',
    salaryMin: ''
  });

  // Load employer jobs on component mount
  useEffect(() => {
    loadEmployerJobs();
  }, []);

  const loadEmployerJobs = async (searchFilters?: JobSearchFilters) => {
    try {
      let query = supabase
        .from('job_postings')
        .select(`
          id,
          title,
          description,
          location,
          employment_type,
          experience_level,
          salary_min,
          salary_max,
          salary_currency,
          created_at,
          employer_profile:employer_profiles(
            company_name,
            logo_url
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      // Apply filters if provided
      if (searchFilters?.query) {
        query = query.or(`title.ilike.%${searchFilters.query}%,description.ilike.%${searchFilters.query}%`);
      }
      
      if (searchFilters?.location) {
        query = query.ilike('location', `%${searchFilters.location}%`);
      }
      
      if (searchFilters?.jobType) {
        query = query.eq('employment_type', searchFilters.jobType);
      }
      
      if (searchFilters?.experienceLevel) {
        query = query.eq('experience_level', searchFilters.experienceLevel);
      }

      const { data, error } = await query.limit(20);

      if (error) throw error;
      setEmployerJobs(data || []);
    } catch (error) {
      console.error('Error loading employer jobs:', error);
    }
  };

  const handleSearch = async (searchFilters: JobSearchFilters) => {
    setLoading(true);
    setFilters(searchFilters);
    
    try {
      // Load employer jobs with filters
      await loadEmployerJobs(searchFilters);
      
      // Search external jobs if query is provided
      if (searchFilters.query.trim()) {
        const { data, error } = await supabase.functions.invoke('job-search', {
          body: searchFilters
        });

        if (error) throw error;
        setExternalJobs(data.jobs || []);
      } else {
        setExternalJobs([]);
      }
      
      setSearchPerformed(true);
    } catch (error) {
      console.error('Job search error:', error);
      setExternalJobs([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Find Your Next Job</h1>
          <p className="text-muted-foreground">Search from thousands of job opportunities</p>
        </div>

        <div className="mb-8">
          <JobSearchForm onSearch={handleSearch} loading={loading} />
        </div>

        <div className="space-y-8">
          {/* Employer Jobs Section */}
          {employerJobs.length > 0 && (
            <div>
              <Card className="mb-4">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5 text-blue-600" />
                    Direct Employer Opportunities
                    <span className="text-sm font-normal text-muted-foreground">
                      ({employerJobs.length} jobs)
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Jobs posted directly by employers on our platform. Apply instantly with personalized resumes.
                  </p>
                </CardContent>
              </Card>
              
              <div className="space-y-4">
                {employerJobs.map((job) => (
                  <EmployerJobCard key={job.id} job={job} />
                ))}
              </div>
            </div>
          )}

          {/* External Jobs Section */}
          {(searchPerformed || externalJobs.length > 0) && (
            <>
              {employerJobs.length > 0 && <Separator className="my-8" />}
              
              <div>
                {externalJobs.length > 0 && (
                  <Card className="mb-4">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2">
                        <Search className="h-5 w-5 text-gray-600" />
                        External Job Listings
                        <span className="text-sm font-normal text-muted-foreground">
                          ({externalJobs.length} jobs)
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Job listings from across the web. Click to apply on the original job board.
                      </p>
                    </CardContent>
                  </Card>
                )}
                
                <JobSearchResults
                  jobs={externalJobs}
                  loading={loading}
                  searchPerformed={searchPerformed}
                />
              </div>
            </>
          )}

          {/* No results state */}
          {searchPerformed && employerJobs.length === 0 && externalJobs.length === 0 && !loading && (
            <Card>
              <CardContent className="py-12 text-center">
                <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No jobs found. Try adjusting your search criteria.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

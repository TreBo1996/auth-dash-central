import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CollapsibleFilters } from '@/components/job-search/CollapsibleFilters';
import { MiniJobCard } from '@/components/job-search/MiniJobCard';
import { CompactJobCard } from '@/components/job-search/CompactJobCard';
import { AdSidebar } from '@/components/ads/AdSidebar';
import { GoogleAd } from '@/components/ads/GoogleAd';
import { Card, CardContent } from '@/components/ui/card';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Search, Briefcase, AlertTriangle } from 'lucide-react';
import { UnifiedJob } from '@/types/job';
import { useOptimizedJobSearch } from '@/hooks/useOptimizedJobSearch';
import { supabase } from '@/integrations/supabase/client';
interface JobSearchFilters {
  query: string;
  location: string;
  remoteType?: string;
  employmentType?: string;
  seniorityLevel?: string;
  company?: string;
  maxAge?: number;
}
const SEARCH_STATE_KEY = 'job-search-state';
export const JobSearch: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [allJobs, setAllJobs] = useState<UnifiedJob[]>([]);
  const [miniJobs, setMiniJobs] = useState<UnifiedJob[]>([]);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [currentFilters, setCurrentFilters] = useState<JobSearchFilters | null>(null);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [totalJobs, setTotalJobs] = useState(0);
  const {
    searchJobs,
    loading
  } = useOptimizedJobSearch();

  // State persistence utilities
  const saveSearchState = (filters: JobSearchFilters, jobs: UnifiedJob[], performed: boolean, warnings: string[]) => {
    try {
      const state = {
        filters,
        jobs,
        searchPerformed: performed,
        warnings,
        timestamp: Date.now()
      };
      sessionStorage.setItem(SEARCH_STATE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save search state:', error);
    }
  };
  const loadSearchState = () => {
    try {
      const saved = sessionStorage.getItem(SEARCH_STATE_KEY);
      if (saved) {
        const state = JSON.parse(saved);
        if (Date.now() - state.timestamp < 30 * 60 * 1000) {
          return state;
        }
      }
    } catch (error) {
      console.error('Failed to load search state:', error);
    }
    return null;
  };
  const updateURLParams = (filters: JobSearchFilters) => {
    const newParams = new URLSearchParams();
    if (filters.query) newParams.set('q', filters.query);
    if (filters.location) newParams.set('location', filters.location);
    if (filters.remoteType) newParams.set('remote', filters.remoteType);
    if (filters.employmentType) newParams.set('type', filters.employmentType);
    if (filters.seniorityLevel) newParams.set('level', filters.seniorityLevel);
    if (filters.company) newParams.set('company', filters.company);
    setSearchParams(newParams, {
      replace: true
    });
  };
  const getFiltersFromURL = (): JobSearchFilters | null => {
    const query = searchParams.get('q');
    const location = searchParams.get('location');
    if (query || location) {
      return {
        query: query || '',
        location: location || '',
        remoteType: searchParams.get('remote') || undefined,
        employmentType: searchParams.get('type') || undefined,
        seniorityLevel: searchParams.get('level') || undefined,
        company: searchParams.get('company') || undefined
      };
    }
    return null;
  };

  // Function to fetch a specific job by ID
  const fetchJobById = async (source: string, id: string): Promise<UnifiedJob | null> => {
    try {
      if (source === 'database') {
        const { data, error } = await supabase
          .from('cached_jobs')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error || !data) return null;
        
        return {
          id: data.id,
          title: data.title,
          company: data.company,
          location: data.location || '',
          description: data.description || '',
          salary: data.salary,
          posted_at: data.posted_at || '',
          job_url: data.job_url,
          source: 'database',
          via: data.via,
          thumbnail: data.thumbnail,
          job_type: data.job_type,
          employment_type: data.employment_type,
          experience_level: data.experience_level,
          data_source: data.data_source,
          apply_url: data.apply_url,
          external_job_url: data.job_page_link
        };
      } else if (source === 'employer') {
        const { data, error } = await supabase
          .from('job_postings')
          .select(`
            *,
            employer_profiles!inner (
              company_name,
              logo_url,
              company_description,
              industry,
              company_size,
              website
            )
          `)
          .eq('id', id)
          .eq('is_active', true)
          .single();
        
        if (error || !data) return null;
        
        return {
          id: data.id,
          title: data.title,
          company: data.employer_profiles.company_name,
          location: data.location || '',
          description: data.description,
          salary: data.salary_min && data.salary_max 
            ? `$${data.salary_min} - $${data.salary_max} ${data.salary_currency}`
            : null,
          posted_at: data.created_at,
          job_url: `/job-posting/${data.id}`,
          source: 'employer',
          employer_profile: data.employer_profiles,
          employment_type: data.employment_type,
          experience_level: data.experience_level,
          salary_min: data.salary_min,
          salary_max: data.salary_max,
          salary_currency: data.salary_currency,
          requirements: data.requirements,
          responsibilities: data.responsibilities,
          benefits: data.benefits,
          data_source: 'employer',
          employer_job_posting_id: data.id
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching job by ID:', error);
      return null;
    }
  };
  const handleSearch = async (searchFilters: JobSearchFilters) => {
    setCurrentFilters(searchFilters);
    setAllJobs([]);
    setMiniJobs([]);
    setExpandedJobId(null);
    try {
      const searchResult = await searchJobs(searchFilters, 0, 1000);
      setAllJobs(searchResult.jobs);
      setMiniJobs(searchResult.jobs);
      setTotalJobs(searchResult.total);
      setWarnings(searchResult.warnings);
      setSearchPerformed(true);
      saveSearchState(searchFilters, searchResult.jobs, true, searchResult.warnings);
      updateURLParams(searchFilters);
    } catch (error) {
      console.error('Search error:', error);
      const errorWarnings = ['Search failed. Please try again.'];
      setAllJobs([]);
      setMiniJobs([]);
      setWarnings(errorWarnings);
      setSearchPerformed(true);
      saveSearchState(searchFilters, [], true, errorWarnings);
    }
  };
  const handleMiniJobSelect = (selectedJob: UnifiedJob) => {
    const jobElement = document.getElementById(`job-${selectedJob.id}`);
    if (jobElement) {
      // First collapse any currently expanded job
      setExpandedJobId(null);

      // Wait for layout to stabilize, then scroll and expand
      setTimeout(() => {
        jobElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
        setExpandedJobId(selectedJob.id);
      }, 100);
    }
  };

  // Restore state on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const jobId = urlParams.get('jobId');
    const autoExpand = urlParams.get('autoExpand');
    
    // Handle direct job targeting from email links
    if (jobId && autoExpand === 'true') {
      // Extract source and id from jobId format: "source_id"
      const [source, id] = jobId.split('_');
      
      if ((source === 'database' || source === 'employer') && id) {
        console.log('Fetching specific job:', { source, id });
        
        // First, fetch the specific job by ID
        fetchJobById(source, id).then(async (targetJob) => {
          if (targetJob) {
            console.log('Found target job:', targetJob.title);
            
            // Use the job's details to perform a targeted search for similar jobs
            const searchFilters: JobSearchFilters = {
              query: targetJob.title, // Search using the job title
              location: targetJob.location, // Include location for better matching
              remoteType: '',
              employmentType: targetJob.employment_type || '',
              seniorityLevel: '',
              company: '',
              maxAge: 30
            };
            
            try {
              const searchResult = await searchJobs(searchFilters, 0, 1000);
              
              // Ensure the target job is in the results
              let finalJobs = searchResult.jobs;
              const targetJobExists = finalJobs.some(job => job.id === targetJob.id);
              
              if (!targetJobExists) {
                // Prepend the target job to the results if not found
                finalJobs = [targetJob, ...finalJobs];
                console.log('Added target job to results');
              }
              
              setAllJobs(finalJobs);
              setMiniJobs(finalJobs);
              setTotalJobs(finalJobs.length);
              setWarnings(searchResult.warnings);
              setSearchPerformed(true);
              setCurrentFilters(searchFilters);
              
              // Save state and update URL
              saveSearchState(searchFilters, finalJobs, true, searchResult.warnings);
              updateURLParams(searchFilters);
              
              // Expand and scroll to the target job
              setTimeout(() => {
                setExpandedJobId(id);
                const jobElement = document.getElementById(`job-${id}`);
                if (jobElement) {
                  jobElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  console.log('Scrolled to target job');
                } else {
                  console.error('Could not find job element with ID:', `job-${id}`);
                }
              }, 500);
              
            } catch (error) {
              console.error('Search error for target job:', error);
              // Fallback: just show the target job
              setAllJobs([targetJob]);
              setMiniJobs([targetJob]);
              setTotalJobs(1);
              setWarnings(['Found the job you were looking for!']);
              setSearchPerformed(true);
              
              setTimeout(() => {
                setExpandedJobId(id);
                const jobElement = document.getElementById(`job-${id}`);
                if (jobElement) {
                  jobElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }, 500);
            }
          } else {
            console.error('Target job not found:', { source, id });
            // Show error message to user
            setWarnings(['The job you were looking for is no longer available.']);
            setSearchPerformed(true);
          }
        }).catch(error => {
          console.error('Error fetching target job:', error);
          setWarnings(['Unable to load the requested job. Please try searching manually.']);
          setSearchPerformed(true);
        });
        
        return;
      }
    }
    
    const urlFilters = getFiltersFromURL();
    if (urlFilters) {
      setCurrentFilters(urlFilters);
      handleSearch(urlFilters);
      return;
    }
    const savedState = loadSearchState();
    if (savedState) {
      setCurrentFilters(savedState.filters);
      setAllJobs(savedState.jobs);
      setMiniJobs(savedState.jobs);
      setSearchPerformed(savedState.searchPerformed);
      setWarnings(savedState.warnings);
      setTotalJobs(savedState.jobs.length);
      updateURLParams(savedState.filters);
    }
  }, []);
  return <DashboardLayout fullHeight={true}>
      <div className="h-screen overflow-hidden px-[10px]">
        {/* Header Section */}
        <div className="flex-shrink-0 mb-6">
          <h1 className="text-2xl font-bold mb-2">Find Your Next Job</h1>
          <p className="text-muted-foreground">Search from thousands of curated job opportunities</p>
        </div>

        {/* Three Column Grid - All columns same height */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-100px)]">
          {/* Left Column - Filters & Quick Jobs */}
          <div className="flex flex-col h-[calc(100vh-100px)] overflow-hidden">
            {/* Search Filters - Fixed */}
            <div className="flex-shrink-0 mb-4">
              <CollapsibleFilters onSearch={handleSearch} loading={loading} filters={currentFilters || undefined} />
            </div>
            
            {/* Quick Jobs - Scrollable */}
            {miniJobs.length > 0 && <div className="flex flex-col h-full min-h-0 overflow-hidden">
                <div className="flex-shrink-0 mb-3">
                  <h3 className="text-sm font-medium text-stone-950">Quick Jobs</h3>
                </div>
                <div className="h-[calc(100vh-350px)] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] space-y-3">
                  {miniJobs.map((job, index) => <div key={`mini-${job.id}-${index}`}>
                      <MiniJobCard job={job} onJobSelect={handleMiniJobSelect} />
                      {/* Responsive square ad at positions 10 and 21 (at least 10 jobs apart) */}
                      {(index + 1 === 10 || index + 1 === 21) && <div className="mt-3">
                          <GoogleAd adSlot="6228224703" adFormat="auto" className="w-full" style={{
                    minHeight: '120px'
                  }} />
                        </div>}
                    </div>)}
                </div>
              </div>}
          </div>

          {/* Center Column - Main Job Results */}
          <div className="flex flex-col h-[calc(100vh-100px)] overflow-hidden lg:col-span-1">
            {/* Results Header - Fixed */}
            {searchPerformed && !loading && <div className="flex-shrink-0 mb-4">
                <h2 className="text-lg font-semibold">
                  {`Showing ${allJobs.length} of ${totalJobs} job${totalJobs !== 1 ? 's' : ''}`}
                </h2>
              </div>}
            
            {/* Job Results - Scrollable */}
            <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] space-y-4">
              {/* Warnings */}
              {warnings.length > 0 && <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {warnings.join('. ')}
                  </AlertDescription>
                </Alert>}

              {/* Loading State */}
              {loading && <Card>
                  <CardContent className="py-8">
                    <div className="flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      <span>Searching for jobs...</span>
                    </div>
                  </CardContent>
                </Card>}

              {/* Initial State */}
              {!searchPerformed && !loading && <Card>
                  <CardContent className="py-12 text-center">
                    <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Start Your Job Search</h3>
                    <p className="text-neutral-950">
                      Use the filters on the left to find your perfect job opportunity
                    </p>
                  </CardContent>
                </Card>}

              {/* No Results */}
              {searchPerformed && allJobs.length === 0 && !loading && <Card>
                  <CardContent className="py-12 text-center">
                    <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Jobs Found</h3>
                    <p className="text-muted-foreground">
                      Try adjusting your search criteria or explore different keywords
                    </p>
                  </CardContent>
                </Card>}

              {/* Job Results */}
              {allJobs.length > 0 && <div className="space-y-3">
                  {allJobs.map((job, index) => <CompactJobCard key={`${job.id}-${index}`} job={job} id={`job-${job.id}`} isExpanded={expandedJobId === job.id} onExpandChange={expanded => setExpandedJobId(expanded ? job.id : null)} />)}
                </div>}
            </div>
          </div>

          {/* Right Column - Ads Sidebar */}
          <div className="flex flex-col h-[calc(100vh-100px)] overflow-hidden hidden lg:flex">
            <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <AdSidebar />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>;
};
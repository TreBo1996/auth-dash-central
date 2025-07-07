-- Clear all existing job data to start fresh
DELETE FROM public.cached_jobs;

-- Reset any related search data
DELETE FROM public.job_search_results;
DELETE FROM public.job_searches;
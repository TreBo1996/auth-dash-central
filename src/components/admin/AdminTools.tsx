
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Settings, 
  Play, 
  BarChart3, 
  Archive, 
  Loader2,
  Database,
  Calendar,
  Clock
} from 'lucide-react';

interface JobStatistics {
  total_active_jobs: number;
  jobs_today: number;
  jobs_this_week: number;
  archived_jobs: number;
  last_scrape_time: string | null;
}

interface AdminToolsProps {
  isAdmin: boolean;
}

export const AdminTools: React.FC<AdminToolsProps> = ({ isAdmin }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [statistics, setStatistics] = useState<JobStatistics | null>(null);
  const [query, setQuery] = useState('software engineer');
  const [location, setLocation] = useState('');
  const [maxJobs, setMaxJobs] = useState(50);

  useEffect(() => {
    if (isAdmin) {
      loadStatistics();
    }
  }, [isAdmin]);

  const loadStatistics = async () => {
    try {
      const { data, error } = await supabase.rpc('get_job_statistics');
      if (error) throw error;
      // Properly type the Json response as JobStatistics using unknown first
      setStatistics(data as unknown as JobStatistics);
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const runManualScraper = async () => {
    if (!query.trim()) {
      toast({
        title: "Error",
        description: "Please enter a job search query",
        variant: "destructive"
      });
      return;
    }

    // Validate maxJobs parameter
    if (maxJobs < 10 || maxJobs > 200) {
      toast({
        title: "Error",
        description: "Max jobs must be between 10 and 200",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    console.log('Starting manual job scraper with params:', { query: query.trim(), location: location.trim(), maxJobs });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session - please log in again');
      }

      console.log('Session found, making request to manual job scraper...');

      // Use the full Supabase function URL instead of relative path
      const functionUrl = 'https://kuthirgvlzyzgmyxyzpr.supabase.co/functions/v1/manual-job-scraper';
      console.log('Calling function URL:', functionUrl);

      const requestBody = {
        query: query.trim(),
        location: location.trim(),
        maxJobs
      };
      console.log('Request body:', requestBody);

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        console.error('Response not OK:', response.status, response.statusText);
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        try {
          const errorData = await response.json();
          console.error('Error response body:', errorData);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (parseError) {
          console.error('Could not parse error response:', parseError);
          const errorText = await response.text();
          console.error('Raw error response:', errorText);
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('Success response:', result);

      toast({
        title: "Job Scraper Completed!",
        description: `Successfully scraped ${result.jobsScraped || 0} new jobs. ${result.archivedJobs || 0} old jobs archived. Total results: ${result.jobsReturned || 0}`,
        duration: 10000
      });

      // Refresh statistics after successful scrape
      console.log('Refreshing statistics...');
      await loadStatistics();

    } catch (error) {
      console.error('Error running manual scraper:', error);
      
      let errorMessage = 'Unknown error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      // Check if it's a network error
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage = 'Network error - please check your internet connection';
      }

      toast({
        title: "Scraper Failed",
        description: `Error: ${errorMessage}`,
        variant: "destructive",
        duration: 10000
      });
    } finally {
      setIsLoading(false);
    }
  };

  const archiveOldJobs = async () => {
    setIsArchiving(true);
    try {
      const { data, error } = await supabase.rpc('archive_old_jobs');
      if (error) throw error;

      toast({
        title: "Archive Complete",
        description: `Archived ${data || 0} old jobs (older than 3 months)`
      });

      // Refresh statistics
      await loadStatistics();

    } catch (error) {
      console.error('Error archiving jobs:', error);
      toast({
        title: "Archive Failed",
        description: "Failed to archive old jobs",
        variant: "destructive"
      });
    } finally {
      setIsArchiving(false);
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <Settings className="h-5 w-5" />
          Admin Tools
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Job Statistics */}
        {statistics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-white rounded-lg border">
              <div className="text-2xl font-bold text-blue-600">{statistics.total_active_jobs}</div>
              <div className="text-xs text-gray-600 flex items-center justify-center gap-1">
                <Database className="h-3 w-3" />
                Active Jobs
              </div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border">
              <div className="text-2xl font-bold text-green-600">{statistics.jobs_today}</div>
              <div className="text-xs text-gray-600 flex items-center justify-center gap-1">
                <Calendar className="h-3 w-3" />
                Today
              </div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border">
              <div className="text-2xl font-bold text-purple-600">{statistics.jobs_this_week}</div>
              <div className="text-xs text-gray-600 flex items-center justify-center gap-1">
                <BarChart3 className="h-3 w-3" />
                This Week
              </div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border">
              <div className="text-2xl font-bold text-gray-600">{statistics.archived_jobs}</div>
              <div className="text-xs text-gray-600 flex items-center justify-center gap-1">
                <Archive className="h-3 w-3" />
                Archived
              </div>
            </div>
          </div>
        )}

        {statistics?.last_scrape_time && (
          <div className="text-sm text-gray-600 flex items-center gap-1">
            <Clock className="h-4 w-4" />
            Last scrape: {new Date(statistics.last_scrape_time).toLocaleString()}
          </div>
        )}

        {/* Manual Job Scraper */}
        <div className="space-y-4">
          <h3 className="font-semibold text-orange-800">Manual Job Scraper</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="query">Job Query *</Label>
              <Input
                id="query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g., software engineer"
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="location">Location (optional)</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., San Francisco"
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="maxJobs">Max Jobs (10-200)</Label>
              <Input
                id="maxJobs"
                type="number"
                value={maxJobs}
                onChange={(e) => setMaxJobs(Number(e.target.value))}
                min="10"
                max="200"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button 
              onClick={runManualScraper} 
              disabled={isLoading || !query.trim()}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Scraping jobs...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Run Job Scraper
                </>
              )}
            </Button>

            <Button 
              variant="outline" 
              onClick={archiveOldJobs}
              disabled={isArchiving}
            >
              {isArchiving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Archiving...
                </>
              ) : (
                <>
                  <Archive className="h-4 w-4 mr-2" />
                  Archive Old Jobs
                </>
              )}
            </Button>
          </div>

          <div className="text-sm text-gray-600 bg-white p-3 rounded border">
            <strong>Debug Info:</strong> Check browser console for detailed logs when running the scraper.
          </div>
        </div>
      </CardContent>
    </Card>
  );
};


import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { JobDatabaseManager } from './JobDatabaseManager';
import { 
  Settings, 
  Play, 
  BarChart3, 
  Archive, 
  Loader2,
  Database,
  Calendar,
  Clock,
  Shield,
  Users,
  Mail,
  Download,
  Send,
  UserCheck,
  Zap
} from 'lucide-react';
import { EmailTemplatePreview } from './EmailTemplatePreview';

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
  
  // Email campaigns state
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [mailchimpLoading, setMailchimpLoading] = useState(false);
  const [csvLoading, setCsvLoading] = useState(false);
  const [emailCampaignLoading, setEmailCampaignLoading] = useState(false);
  const [testEmailLoading, setTestEmailLoading] = useState(false);
  const [sendAllUsersLoading, setSendAllUsersLoading] = useState(false);
  const [lastRun, setLastRun] = useState<any>(null);
  const [recentRuns, setRecentRuns] = useState<any[]>([]);
  const [totalRecommendations, setTotalRecommendations] = useState<number>(0);
  const [userProfiles, setUserProfiles] = useState<any[]>([]);
  const [selectedTestUser, setSelectedTestUser] = useState<string>('');

  useEffect(() => {
    if (isAdmin) {
      loadStatistics();
      loadRecentRuns();
      loadTotalRecommendations();
      loadUserProfiles();
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

  const loadRecentRuns = async () => {
    try {
      const { data, error } = await supabase
        .from('daily_recommendation_runs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      setRecentRuns(data || []);
      
      // Set the most recent completed run as lastRun for CSV/Mailchimp
      const lastCompletedRun = data?.find(run => run.status === 'completed');
      if (lastCompletedRun) {
        setLastRun({
          runId: lastCompletedRun.id,
          usersProcessed: lastCompletedRun.total_users_processed,
          recommendationsGenerated: lastCompletedRun.total_recommendations_generated,
          message: lastCompletedRun.notes
        });
      }
    } catch (error) {
      console.error('Error loading recent runs:', error);
    }
  };

  const loadTotalRecommendations = async () => {
    try {
      const { count, error } = await supabase
        .from('user_job_recommendations')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      setTotalRecommendations(count || 0);
    } catch (error) {
      console.error('Error loading total recommendations:', error);
    }
  };

  const loadUserProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .not('email', 'is', null)
        .order('full_name');
      
      if (error) throw error;
      setUserProfiles(data || []);
    } catch (error) {
      console.error('Error loading user profiles:', error);
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

  const generateDailyRecommendations = async () => {
    setRecommendationsLoading(true);
    
    try {
      console.log("Starting daily job recommendations generation...");
      
      const { data, error } = await supabase.functions.invoke('generate-daily-job-recommendations');
      
      if (error) {
        console.error("Recommendations error:", error);
        toast({
          title: "Error",
          description: `Failed to generate recommendations: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      console.log("Recommendations result:", data);
      setLastRun(data);

      toast({
        title: "Success",
        description: `Generated ${data.recommendationsGenerated} recommendations for ${data.usersProcessed} users`,
      });

      // Refresh statistics and recent runs
      loadStatistics();
      loadRecentRuns();
      loadTotalRecommendations();
    } catch (error: any) {
      console.error("Recommendations failed:", error);
      toast({
        title: "Error",
        description: `Recommendations failed: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setRecommendationsLoading(false);
    }
  };

  const updateMailchimpMergeFields = async () => {
    if (!lastRun?.runId) {
      toast({
        title: "Error",
        description: "No recent recommendation run found. Generate recommendations first.",
        variant: "destructive",
      });
      return;
    }

    setMailchimpLoading(true);
    
    try {
      console.log("Starting Mailchimp merge fields update...");
      
      const { data, error } = await supabase.functions.invoke('update-mailchimp-job-recommendations', {
        body: { runId: lastRun.runId }
      });
      
      if (error) {
        console.error("Mailchimp update error:", error);
        toast({
          title: "Error",
          description: `Failed to update Mailchimp: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      console.log("Mailchimp update result:", data);

      toast({
        title: "Success",
        description: `Updated ${data.usersUpdated} subscribers in Mailchimp`,
      });
    } catch (error: any) {
      console.error("Mailchimp update failed:", error);
      toast({
        title: "Error",
        description: `Mailchimp update failed: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setMailchimpLoading(false);
    }
  };

  const exportRecommendationsCSV = async () => {
    if (!lastRun?.runId) {
      toast({
        title: "Error",
        description: "No recent recommendation run found. Generate recommendations first.",
        variant: "destructive",
      });
      return;
    }

    setCsvLoading(true);
    
    try {
      console.log("Starting CSV export...");
      
      const response = await supabase.functions.invoke('export-job-recommendations-csv', {
        body: { runId: lastRun.runId }
      });
      
      if (response.error) {
        console.error("CSV export error:", response.error);
        toast({
          title: "Error",
          description: `Failed to export CSV: ${response.error.message}`,
          variant: "destructive",
        });
        return;
      }

      // Create download link
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `job-recommendations-${lastRun.runId}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: "CSV export downloaded successfully",
      });
    } catch (error: any) {
      console.error("CSV export failed:", error);
      toast({
        title: "Error",
        description: `CSV export failed: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setCsvLoading(false);
    }
  };

  const sendTestEmail = async (testEmail: string) => {
    setTestEmailLoading(true);
    
    try {
      console.log("Sending test email to:", testEmail);
      
      const { data, error } = await supabase.functions.invoke('send-job-alert-email', {
        body: { 
          action: 'send-test',
          testEmail,
          testUserName: 'Test User'
        }
      });
      
      if (error) {
        console.error("Test email error:", error);
        toast({
          title: "Error",
          description: `Failed to send test email: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      console.log("Test email result:", data);

      toast({
        title: "Success",
        description: `Test email sent successfully to ${testEmail}`,
      });

    } catch (error: any) {
      console.error("Test email failed:", error);
      toast({
        title: "Error",
        description: `Test email failed: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setTestEmailLoading(false);
    }
  };

  const sendEmailCampaign = async () => {
    if (!lastRun?.runId) {
      toast({
        title: "Error",
        description: "No recent recommendation run found. Generate recommendations first.",
        variant: "destructive",
      });
      return;
    }

    setEmailCampaignLoading(true);
    
    try {
      console.log("Starting email campaign for run:", lastRun.runId);
      
      const { data, error } = await supabase.functions.invoke('send-job-alert-email', {
        body: { 
          action: 'send-campaign',
          runId: lastRun.runId
        }
      });
      
      if (error) {
        console.error("Email campaign error:", error);
        toast({
          title: "Error",
          description: `Failed to send email campaign: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      console.log("Email campaign result:", data);

      toast({
        title: "Success",
        description: `Email campaign sent successfully to ${data.emailsSent} users`,
        duration: 10000
      });

      // Refresh statistics and recent runs
      loadStatistics();
      loadRecentRuns();
    } catch (error: any) {
      console.error("Email campaign failed:", error);
      toast({
        title: "Error",
        description: `Email campaign failed: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setEmailCampaignLoading(false);
    }
  };

  const sendToAllUsers = async () => {
    setSendAllUsersLoading(true);
    
    try {
      console.log("Generating fresh recommendations and sending emails to all users...");
      
      // First generate fresh recommendations
      const { data: recommendationData, error: recError } = await supabase.functions.invoke('generate-daily-job-recommendations');
      
      if (recError) {
        console.error("Recommendations error:", recError);
        toast({
          title: "Error",
          description: `Failed to generate recommendations: ${recError.message}`,
          variant: "destructive",
        });
        return;
      }

      console.log("Fresh recommendations generated:", recommendationData);

      // Now send emails with the new run
      const { data: emailData, error: emailError } = await supabase.functions.invoke('send-job-alert-email', {
        body: { 
          action: 'send-campaign',
          runId: recommendationData.runId
        }
      });
      
      if (emailError) {
        console.error("Email campaign error:", emailError);
        toast({
          title: "Error",
          description: `Failed to send email campaign: ${emailError.message}`,
          variant: "destructive",
        });
        return;
      }

      console.log("Emails sent to all users:", emailData);

      toast({
        title: "Success",
        description: `Generated ${recommendationData.recommendationsGenerated} recommendations and sent emails to ${emailData.emailsSent} users`,
        duration: 10000
      });

      // Update local state
      setLastRun(recommendationData);
      
      // Refresh statistics and recent runs
      loadStatistics();
      loadRecentRuns();
      loadTotalRecommendations();
    } catch (error: any) {
      console.error("Send to all users failed:", error);
      toast({
        title: "Error",
        description: `Send to all users failed: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setSendAllUsersLoading(false);
    }
  };

  const sendTestEmailToUser = async () => {
    if (!selectedTestUser) {
      toast({
        title: "Error",
        description: "Please select a user to send test email to.",
        variant: "destructive",
      });
      return;
    }

    const user = userProfiles.find(u => u.id === selectedTestUser);
    if (!user) {
      toast({
        title: "Error",
        description: "Selected user not found.",
        variant: "destructive",
      });
      return;
    }

    await sendTestEmail(user.email);
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Admin Tools</h1>
        <Badge variant="destructive">Admin Only</Badge>
      </div>

      <JobDatabaseManager />

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

    {/* Email Campaigns Section */}
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <Mail className="h-5 w-5" />
          Email Campaigns
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Daily Job Recommendations Panel */}
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-blue-800 mb-2">Daily Job Recommendations</h4>
            <p className="text-sm text-blue-700 mb-4">
              Generate personalized job recommendations for users based on their preferences and match them with today's quality job listings.
            </p>
            
            <div className="flex gap-3 mb-4">
              <Button 
                onClick={generateDailyRecommendations}
                disabled={recommendationsLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {recommendationsLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Recommendations...
                  </>
                ) : (
                  <>
                    <Users className="mr-2 h-4 w-4" />
                    Generate Daily Job Recommendations
                  </>
                )}
              </Button>

              <Button 
                variant="outline"
                onClick={() => {
                  loadRecentRuns();
                  loadTotalRecommendations();
                }}
                disabled={recommendationsLoading}
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                Refresh Status
              </Button>
            </div>

            {/* System Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="p-3 bg-white rounded-lg border">
                <div className="text-sm text-blue-600">Total Recommendations in System</div>
                <div className="text-2xl font-bold text-blue-800">{totalRecommendations}</div>
              </div>
              <div className="p-3 bg-white rounded-lg border">
                <div className="text-sm text-blue-600">CSV Export Status</div>
                <div className="text-sm font-semibold text-blue-800">
                  {lastRun ? 'Available' : 'No recent run available'}
                </div>
              </div>
            </div>

            {/* Recent Runs */}
            {recentRuns.length > 0 && (
              <div className="mt-4 p-4 bg-white rounded-lg border">
                <h5 className="font-semibold text-blue-800 mb-3">Recent Recommendation Runs</h5>
                <div className="space-y-2">
                  {recentRuns.map((run, index) => (
                    <div key={run.id} className="flex items-center justify-between text-sm p-2 border rounded">
                      <div className="flex items-center gap-3">
                        <Badge 
                          variant={run.status === 'completed' ? 'default' : run.status === 'failed' ? 'destructive' : 'secondary'}
                        >
                          {run.status}
                        </Badge>
                        <span className="text-blue-600">
                          {new Date(run.created_at).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-right">
                        {run.status === 'completed' && (
                          <div className="text-blue-800">
                            {run.total_recommendations_generated} recommendations, {run.total_users_processed} users
                          </div>
                        )}
                        {run.status === 'failed' && run.notes && (
                          <div className="text-red-600 text-xs max-w-xs truncate">
                            {run.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {lastRun && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                <h5 className="font-semibold text-green-800 mb-2">Most Recent Successful Run</h5>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-green-600">Users Processed:</span>
                    <span className="ml-2 font-semibold">{lastRun.usersProcessed}</span>
                  </div>
                  <div>
                    <span className="text-green-600">Recommendations:</span>
                    <span className="ml-2 font-semibold">{lastRun.recommendationsGenerated}</span>
                  </div>
                </div>
                <p className="text-xs text-green-600 mt-2">{lastRun.message}</p>
              </div>
            )}
          </div>


          {/* Job Alert Email System */}
          <div className="border-t border-blue-200 pt-4">
            <h4 className="font-semibold text-blue-800 mb-2">Job Alert Email System</h4>
            <p className="text-sm text-blue-700 mb-4">
              Send personalized job recommendations to users via email. The system automatically filters users who haven't received emails recently and have job recommendations available.
            </p>
            
            <div className="space-y-4">
              {/* Send to All Users */}
              <div className="p-4 bg-white rounded-lg border">
                <h5 className="font-medium text-blue-800 mb-2">Send Fresh Recommendations to All Users</h5>
                <p className="text-sm text-blue-600 mb-3">
                  Generate fresh recommendations and immediately send personalized emails to all users.
                </p>
                <Button 
                  onClick={sendToAllUsers}
                  disabled={sendAllUsersLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {sendAllUsersLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating & Sending...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      Send to All Users
                    </>
                  )}
                </Button>
              </div>

              {/* Send Campaign from Last Run */}
              <div className="p-4 bg-white rounded-lg border">
                <h5 className="font-medium text-blue-800 mb-2">Send Campaign from Last Run</h5>
                <p className="text-sm text-blue-600 mb-3">
                  Send emails using existing recommendations from the latest run.
                </p>
                <Button 
                  onClick={sendEmailCampaign}
                  disabled={emailCampaignLoading || !lastRun}
                  variant="outline"
                  className="border-blue-300 text-blue-700 hover:bg-blue-100"
                >
                  {emailCampaignLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending Campaign...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send from Last Run
                    </>
                  )}
                </Button>
                
                {!lastRun && (
                  <p className="text-xs text-orange-600 mt-2">
                    Generate recommendations first to use this option
                  </p>
                )}
              </div>

              {/* Test Email to Specific User */}
              <div className="p-4 bg-white rounded-lg border">
                <h5 className="font-medium text-blue-800 mb-2">Send Test Email to Specific User</h5>
                <p className="text-sm text-blue-600 mb-3">
                  Send a test email with sample job recommendations to a specific user.
                </p>
                <div className="flex gap-2 mb-2">
                  <Select value={selectedTestUser} onValueChange={setSelectedTestUser}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select a user..." />
                    </SelectTrigger>
                    <SelectContent>
                      {userProfiles.map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.full_name || user.email} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={sendTestEmailToUser}
                    disabled={testEmailLoading || !selectedTestUser}
                    variant="outline"
                    className="border-blue-300 text-blue-700 hover:bg-blue-100"
                  >
                    {testEmailLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <UserCheck className="mr-2 h-4 w-4" />
                        Send Test Email
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Email Template Preview Section */}
    <EmailTemplatePreview 
      lastRun={lastRun}
      onSendTest={sendTestEmail}
      isLoading={testEmailLoading}
    />
    </div>
  );
};

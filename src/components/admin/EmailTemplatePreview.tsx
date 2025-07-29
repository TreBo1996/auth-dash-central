import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Mail, 
  Eye, 
  Send, 
  Loader2,
  Settings,
  RefreshCw,
  Users
} from 'lucide-react';

interface SampleJob {
  title: string;
  company: string;
  location: string;
  salary: string;
  job_page_link: string;
  match_score: number;
}

interface EmailTemplatePreviewProps {
  lastRun: any;
  onSendTest: (email: string) => void;
  isLoading?: boolean;
}

const sampleJobs: SampleJob[] = [
  {
    title: "Senior Software Engineer",
    company: "TechCorp Inc.",
    location: "San Francisco, CA",
    salary: "$120,000 - $180,000",
    job_page_link: "/job/database/sample-1",
    match_score: 95
  },
  {
    title: "Full Stack Developer",
    company: "InnovateTech",
    location: "Remote",
    salary: "$90,000 - $140,000",
    job_page_link: "/job/database/sample-2",
    match_score: 88
  },
  {
    title: "Frontend Developer",
    company: "DesignFirst Studios", 
    location: "Austin, TX",
    salary: "$80,000 - $120,000",
    job_page_link: "/job/database/sample-3",
    match_score: 82
  }
];

const generateEmailHTML = (userName: string = "Sarah Johnson", jobs: SampleJob[] = sampleJobs) => {
  const currentDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Daily Job Recommendations</title>
    <style>
        body { margin: 0; padding: 0; font-family: 'Arial', sans-serif; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #2563eb 0%, #4f46e5 50%, #9333ea 100%); padding: 40px 30px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: bold; }
        .header p { color: #e0e7ff; margin: 10px 0 0 0; font-size: 16px; }
        .content { padding: 30px; }
        .greeting { font-size: 18px; color: #1f2937; margin-bottom: 20px; }
        .intro { font-size: 16px; color: #4b5563; margin-bottom: 30px; line-height: 1.6; }
        .job-card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin-bottom: 20px; background-color: #ffffff; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); }
        .job-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
        .job-title { font-size: 18px; font-weight: bold; color: #1f2937; margin: 0; }
        .match-badge { background-color: #10b981; color: #ffffff; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
        .company { font-size: 16px; color: #6b7280; margin: 4px 0; }
        .job-details { display: flex; gap: 20px; margin: 12px 0; font-size: 14px; color: #6b7280; }
        .detail-item { display: flex; align-items: center; gap: 6px; }
        .job-actions { margin-top: 16px; }
        .btn { display: inline-block; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; margin-right: 12px; margin-bottom: 8px; }
        .btn-primary { background-color: #2563eb; color: #ffffff; }
        .btn-secondary { background-color: #f3f4f6; color: #374151; }
        .footer { background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb; }
        .footer-text { font-size: 14px; color: #6b7280; margin-bottom: 16px; }
        .unsubscribe { font-size: 12px; color: #9ca3af; }
        .unsubscribe a { color: #6b7280; }
        @media (max-width: 600px) {
            .content { padding: 20px; }
            .job-details { flex-direction: column; gap: 8px; }
            .btn { display: block; margin-right: 0; margin-bottom: 12px; text-align: center; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div style="margin-bottom: 20px;">
                <img src="${window.location.origin}/lovable-uploads/41eb8276-f076-476b-93fb-6dab57a8c8b1.png" alt="RezLit" style="height: 40px; width: auto; display: inline-block;" />
            </div>
            <h1>Your Job Matches</h1>
            <p>Personalized recommendations for ${currentDate}</p>
        </div>
        
        <div class="content">
            <div class="greeting">Hi ${userName}! 👋</div>
            
            <div class="intro">
                We've found <strong>${jobs.length} excellent job matches</strong> that align perfectly with your career goals and experience. These opportunities were selected specifically for you based on your profile.
            </div>
            
            ${jobs.map((job, index) => `
            <div class="job-card">
                <div class="job-header">
                    <h3 class="job-title">${job.title}</h3>
                    <span class="match-badge">${job.match_score}% Match</span>
                </div>
                <div class="company">${job.company}</div>
                <div class="job-details">
                    <div class="detail-item">📍 ${job.location}</div>
                    <div class="detail-item">💰 ${job.salary}</div>
                </div>
                <div class="job-actions">
                    <a href="https://rezlit.com${job.job_page_link}" class="btn btn-primary">View Job Details</a>
                    <a href="https://rezlit.com/resume-optimizer?job=${job.job_page_link}" class="btn btn-secondary">Create Optimized Resume</a>
                </div>
            </div>
            `).join('')}
        </div>
        
        <div class="footer">
            <div class="footer-text">
                Ready to land your dream job? <strong>Create an ATS-optimized resume</strong> for each position to increase your interview chances by 3x!
            </div>
            <div class="footer-text">
                <a href="https://rezlit.com/dashboard" class="btn btn-primary">Visit Your Dashboard</a>
            </div>
            <div class="unsubscribe">
                Don't want these emails? <a href="#">Unsubscribe here</a> | 
                <a href="#">Update your preferences</a>
            </div>
        </div>
    </div>
</body>
</html>
  `;
};

export const EmailTemplatePreview: React.FC<EmailTemplatePreviewProps> = ({ 
  lastRun, 
  onSendTest, 
  isLoading = false 
}) => {
  const { toast } = useToast();
  const [previewMode, setPreviewMode] = useState<'html' | 'preview'>('preview');
  const [testEmail, setTestEmail] = useState('');
  const [userName, setUserName] = useState('Sarah Johnson');
  const [emailStats, setEmailStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    loadEmailStats();
  }, []);

  const loadEmailStats = async () => {
    setLoadingStats(true);
    try {
      // Get email statistics from recent runs
      const { data, error } = await supabase
        .from('daily_recommendation_runs')
        .select('*')
        .not('mailchimp_updated_at', 'is', null)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      
      const stats = {
        total_emails_sent: data?.reduce((sum, run) => sum + (run.total_users_processed || 0), 0) || 0,
        last_email_date: data?.[0]?.mailchimp_updated_at || null,
        recent_runs: data?.length || 0
      };
      
      setEmailStats(stats);
    } catch (error) {
      console.error('Error loading email stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleSendTestEmail = () => {
    if (!testEmail.trim()) {
      toast({
        title: "Error",
        description: "Please enter a test email address",
        variant: "destructive"
      });
      return;
    }

    onSendTest(testEmail);
  };

  const emailHTML = generateEmailHTML(userName, sampleJobs);

  return (
    <div className="space-y-6">
      {/* Email Stats */}
      <Card className="border-indigo-200 bg-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-indigo-800">
            <Mail className="h-5 w-5" />
            Job Alert Email System
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 bg-white rounded-lg border">
              <div className="text-2xl font-bold text-indigo-600">
                {loadingStats ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : emailStats?.total_emails_sent || 0}
              </div>
              <div className="text-xs text-gray-600 flex items-center justify-center gap-1">
                <Users className="h-3 w-3" />
                Total Emails Sent
              </div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border">
              <div className="text-2xl font-bold text-green-600">
                {emailStats?.recent_runs || 0}
              </div>
              <div className="text-xs text-gray-600">
                Recent Campaigns
              </div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border">
              <div className="text-sm font-bold text-blue-600">
                {emailStats?.last_email_date 
                  ? new Date(emailStats.last_email_date).toLocaleDateString()
                  : 'Never'
                }
              </div>
              <div className="text-xs text-gray-600">
                Last Email Sent
              </div>
            </div>
          </div>
          
          <Button
            onClick={loadEmailStats}
            variant="outline"
            size="sm"
            disabled={loadingStats}
            className="border-indigo-300 text-indigo-700 hover:bg-indigo-100"
          >
            {loadingStats ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh Stats
          </Button>
        </CardContent>
      </Card>

      {/* Email Template Preview */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Eye className="h-5 w-5" />
            Email Template Preview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Controls */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex gap-2">
              <Button
                onClick={() => setPreviewMode('preview')}
                variant={previewMode === 'preview' ? 'default' : 'outline'}
                size="sm"
              >
                <Eye className="h-4 w-4 mr-2" />
                Visual Preview
              </Button>
              <Button
                onClick={() => setPreviewMode('html')}
                variant={previewMode === 'html' ? 'default' : 'outline'}
                size="sm"
              >
                <Settings className="h-4 w-4 mr-2" />
                HTML Code
              </Button>
            </div>
            
            <div className="flex gap-2 items-center">
              <Label htmlFor="userName" className="text-sm">User Name:</Label>
              <Input
                id="userName"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Test user name"
                className="w-32"
              />
            </div>
          </div>

          {/* Preview Content */}
          <div className="border rounded-lg bg-white">
            {previewMode === 'preview' ? (
              <div 
                className="max-h-96 overflow-y-auto"
                dangerouslySetInnerHTML={{ __html: emailHTML }}
              />
            ) : (
              <pre className="p-4 text-xs overflow-x-auto max-h-96 bg-gray-50">
                <code>{emailHTML}</code>
              </pre>
            )}
          </div>

          {/* Test Email Section */}
          <div className="border-t pt-4 space-y-3">
            <h4 className="font-semibold text-blue-800">Send Test Email</h4>
            <div className="flex gap-2">
              <Input
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="Enter test email address"
                type="email"
                className="flex-1"
              />
              <Button
                onClick={handleSendTestEmail}
                disabled={isLoading || !testEmail.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Send Test
              </Button>
            </div>
            <p className="text-sm text-blue-600">
              Send a test email to verify the template appears correctly in email clients.
            </p>
          </div>

          {/* Email Campaign Status */}
          {lastRun && (
            <div className="border-t pt-4">
              <h4 className="font-semibold text-blue-800 mb-2">Latest Campaign Status</h4>
              <div className="bg-white p-3 rounded border text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-blue-600">Recipients:</span>
                    <span className="ml-2 font-semibold">{lastRun.usersProcessed}</span>
                  </div>
                  <div>
                    <span className="text-blue-600">Jobs Recommended:</span>
                    <span className="ml-2 font-semibold">{lastRun.recommendationsGenerated}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
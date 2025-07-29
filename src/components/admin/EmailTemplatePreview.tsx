import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { generateJobAlertEmailHTML, sampleJobs } from '@/utils/emailTemplate';
import { 
  Mail, 
  Eye, 
  Send, 
  Loader2,
  Settings,
  RefreshCw,
  Users
} from 'lucide-react';

interface EmailTemplatePreviewProps {
  lastRun: any;
  onSendTest: (email: string) => void;
  isLoading?: boolean;
}

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

  const emailHTML = generateJobAlertEmailHTML(userName, sampleJobs);

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
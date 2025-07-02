
import React, { useState, useEffect } from 'react';
import { EmployerDashboardLayout } from '@/components/layout/EmployerDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  Bell, 
  Mail, 
  Download, 
  Shield,
  Trash2,
  Save
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SettingsData {
  emailNotifications: boolean;
  applicationAlerts: boolean;
  weeklyReports: boolean;
  autoResponse: boolean;
  responseTemplate: string;
  dataRetention: string;
}

const EmployerSettings: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [settings, setSettings] = useState<SettingsData>({
    emailNotifications: true,
    applicationAlerts: true,
    weeklyReports: false,
    autoResponse: false,
    responseTemplate: '',
    dataRetention: '2years'
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [user]);

  const loadSettings = async () => {
    // In a real app, you'd load settings from the database
    // For now, we'll use default values
    setLoading(false);
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      // In a real app, you'd save settings to the database
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      toast({
        title: "Settings Saved",
        description: "Your preferences have been updated successfully"
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const exportData = async () => {
    try {
      if (!user) return;

      // Get employer profile
      const { data: profile } = await supabase
        .from('employer_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) return;

      // Get all data
      const [jobsResponse, applicationsResponse] = await Promise.all([
        supabase.from('job_postings').select('*').eq('employer_id', profile.id),
        supabase.from('job_applications').select(`
          *,
          job_posting:job_postings!inner(title)
        `).eq('job_posting.employer_id', profile.id)
      ]);

      const exportData = {
        jobPostings: jobsResponse.data || [],
        applications: applicationsResponse.data || [],
        exportedAt: new Date().toISOString()
      };

      // Create and download file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `employer-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Data Exported",
        description: "Your data has been downloaded successfully"
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export data",
        variant: "destructive"
      });
    }
  };

  const deleteAccount = async () => {
    const confirmation = prompt('Type "DELETE" to confirm account deletion:');
    if (confirmation !== 'DELETE') return;

    try {
      // In a real app, you'd implement account deletion
      toast({
        title: "Account Deletion",
        description: "Account deletion request has been submitted",
        variant: "destructive"
      });
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: "Deletion Failed",
        description: "Failed to delete account",
        variant: "destructive"
      });
    }
  };

  return (
    <EmployerDashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Settings
          </h1>
          <p className="text-muted-foreground">Manage your account preferences and settings</p>
        </div>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive email notifications for important updates</p>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Application Alerts</Label>
                <p className="text-sm text-muted-foreground">Get notified when someone applies to your jobs</p>
              </div>
              <Switch
                checked={settings.applicationAlerts}
                onCheckedChange={(checked) => setSettings({ ...settings, applicationAlerts: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Weekly Reports</Label>
                <p className="text-sm text-muted-foreground">Receive weekly analytics and performance reports</p>
              </div>
              <Switch
                checked={settings.weeklyReports}
                onCheckedChange={(checked) => setSettings({ ...settings, weeklyReports: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Application Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Application Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-Response</Label>
                <p className="text-sm text-muted-foreground">Send automatic responses to applicants</p>
              </div>
              <Switch
                checked={settings.autoResponse}
                onCheckedChange={(checked) => setSettings({ ...settings, autoResponse: checked })}
              />
            </div>
            
            {settings.autoResponse && (
              <div className="space-y-2">
                <Label htmlFor="response-template">Response Template</Label>
                <Input
                  id="response-template"
                  placeholder="Thank you for your application. We'll review it and get back to you soon."
                  value={settings.responseTemplate}
                  onChange={(e) => setSettings({ ...settings, responseTemplate: e.target.value })}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Data & Privacy */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Data & Privacy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Data Retention</Label>
              <Select value={settings.dataRetention} onValueChange={(value) => setSettings({ ...settings, dataRetention: value })}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1year">1 Year</SelectItem>
                  <SelectItem value="2years">2 Years</SelectItem>
                  <SelectItem value="5years">5 Years</SelectItem>
                  <SelectItem value="forever">Keep Forever</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">How long to keep applicant data after job posting expires</p>
            </div>
            
            <div className="flex gap-4">
              <Button variant="outline" onClick={exportData} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export All Data
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium">Delete Account</h4>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <Button variant="destructive" onClick={deleteAccount} className="mt-2">
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={saveSettings} disabled={saving} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </EmployerDashboardLayout>
  );
};

export default EmployerSettings;


import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Building, DollarSign, Clock, ExternalLink, Save, Check } from 'lucide-react';

interface Job {
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
}

interface JobCardProps {
  job: Job;
}

export const JobCard: React.FC<JobCardProps> = ({ job }) => {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const { toast } = useToast();

  const handleSaveJob = async () => {
    setSaving(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to save jobs.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('job_descriptions')
        .insert({
          user_id: user.id,
          title: job.title,
          parsed_text: job.description,
          source: 'search',
          company: job.company,
          location: job.location,
          salary_range: job.salary,
          job_url: job.job_url,
        });

      if (error) throw error;

      setSaved(true);
      toast({
        title: "Job saved!",
        description: "Job description has been saved to your profile.",
      });

    } catch (error) {
      console.error('Error saving job:', error);
      toast({
        title: "Error",
        description: "Failed to save job. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const truncateDescription = (text: string, maxLength: number = 300) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2">{job.title}</CardTitle>
            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Building className="h-4 w-4" />
                {job.company}
              </div>
              {job.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {job.location}
                </div>
              )}
              {job.salary && (
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  {job.salary}
                </div>
              )}
              {job.posted_at && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {job.posted_at}
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveJob}
              disabled={saving || saved}
            >
              {saved ? (
                <><Check className="h-4 w-4 mr-1" /> Saved</>
              ) : (
                <><Save className="h-4 w-4 mr-1" /> {saving ? 'Saving...' : 'Save'}</>
              )}
            </Button>
            {job.job_url && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(job.job_url, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                View Job
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <p className="text-sm text-gray-700">
            {truncateDescription(job.description)}
          </p>
          
          <div className="flex gap-2">
            <Badge variant="secondary">
              {job.source}
            </Badge>
            {job.via && (
              <Badge variant="outline">
                via {job.via}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

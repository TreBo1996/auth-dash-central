
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Building, DollarSign, Clock, Briefcase, Star, Save, Check } from 'lucide-react';

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
  } | null;
}

interface EmployerJobCardProps {
  job: EmployerJob;
}

export const EmployerJobCard: React.FC<EmployerJobCardProps> = ({ job }) => {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const { toast } = useToast();

  const formatSalary = (min: number, max: number, currency: string) => {
    if (min && max) {
      return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()}`;
    } else if (min) {
      return `${currency} ${min.toLocaleString()}+`;
    } else if (max) {
      return `Up to ${currency} ${max.toLocaleString()}`;
    }
    return null;
  };

  const salaryRange = formatSalary(job.salary_min, job.salary_max, job.salary_currency);
  const companyName = job.employer_profile?.company_name || 'Company Name Not Available';
  const logoUrl = job.employer_profile?.logo_url;

  const handleViewJob = () => {
    navigate(`/job-posting/${job.id}`);
  };

  const handleSaveJob = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to save jobs.",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('job_descriptions')
        .insert({
          user_id: user.id,
          title: job.title,
          parsed_text: job.description,
          source: 'employer',
          company: companyName,
          location: job.location,
          salary_range: salaryRange,
          job_url: `/job-posting/${job.id}`
        });

      if (error) throw error;

      setSaved(true);
      toast({
        title: "Job saved!",
        description: "Job description has been saved to your profile."
      });
    } catch (error) {
      console.error('Error saving job:', error);
      toast({
        title: "Error",
        description: "Failed to save job. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                <Star className="h-3 w-3 mr-1" />
                Direct Hire
              </Badge>
            </div>
            <CardTitle className="text-lg mb-2">{job.title}</CardTitle>
            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Building className="h-4 w-4" />
                {companyName}
              </div>
              {job.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {job.location}
                </div>
              )}
              {salaryRange && (
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  {salaryRange}
                </div>
              )}
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {new Date(job.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {logoUrl && (
              <img 
                src={logoUrl} 
                alt={companyName}
                className="w-12 h-12 rounded object-cover"
              />
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="text-sm text-gray-700 leading-relaxed">
            {job.description.length > 200 
              ? `${job.description.slice(0, 200)}...` 
              : job.description
            }
          </div>
          
          <div className="flex gap-2">
            {job.employment_type && (
              <Badge variant="outline">{job.employment_type}</Badge>
            )}
            {job.experience_level && (
              <Badge variant="outline">{job.experience_level}</Badge>
            )}
          </div>

          <div className="flex justify-between items-center pt-2">
            <div className="text-xs text-muted-foreground">
              Posted directly by employer
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSaveJob} 
                disabled={saving || saved}
              >
                {saved ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Saved
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-1" />
                    {saving ? 'Saving...' : 'Save'}
                  </>
                )}
              </Button>
              <Button onClick={handleViewJob}>
                <Briefcase className="h-4 w-4 mr-1" />
                View & Apply
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

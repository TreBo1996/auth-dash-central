import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Building, DollarSign, Clock, ExternalLink, Save, Check, ChevronDown, ChevronUp, Star, Briefcase } from 'lucide-react';
import { UnifiedJob } from '@/types/job';
import { ExternalJobApplicationModal } from '../job-application/ExternalJobApplicationModal';
import { useFeatureUsage } from '@/hooks/useFeatureUsage';
import { PaymentModal } from '@/components/subscription/PaymentModal';
interface JobCardProps {
  job: UnifiedJob;
}
export const JobCard: React.FC<JobCardProps> = ({
  job
}) => {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showExternalModal, setShowExternalModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const {
    toast
  } = useToast();
  const {
    checkFeatureAccess,
    incrementUsage,
    isPremium
  } = useFeatureUsage();
  const handleSaveJob = async () => {
    setSaving(true);
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to save jobs.",
          variant: "destructive"
        });
        return;
      }

      // Check usage limit before saving (only for non-premium users)
      if (!isPremium) {
        const canUse = await checkFeatureAccess('job_descriptions');
        if (!canUse) {
          setShowPaymentModal(true);
          return;
        }
      }
      const {
        error
      } = await supabase.from('job_descriptions').insert({
        user_id: user.id,
        title: job.title,
        parsed_text: job.description,
        source: job.source,
        company: job.company,
        location: job.location,
        salary_range: job.salary,
        job_url: job.job_url
      });
      if (error) throw error;

      // Increment usage counter after successful save (only for non-premium users)
      if (!isPremium) {
        try {
          await incrementUsage('job_descriptions');
        } catch (usageError) {
          console.error('Error incrementing usage:', usageError);
          // Don't fail the save if usage increment fails
        }
      }
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
  const handleViewJob = () => {
    if (job.source === 'employer') {
      window.location.href = job.job_url;
    } else {
      // For database jobs, show the optimization modal instead of direct redirect
      setShowExternalModal(true);
    }
  };
  const toggleExpanded = () => {
    setExpanded(!expanded);
  };
  const formatTextWithBreaks = (text: string) => {
    return text.split('\n').map((line, index) => <React.Fragment key={index}>
        {line}
        {index < text.split('\n').length - 1 && <br />}
      </React.Fragment>);
  };
  const parseStructuredData = (jsonString: string) => {
    try {
      return JSON.parse(jsonString || '[]');
    } catch {
      return [];
    }
  };
  const renderStructuredSection = (title: string, items: string[]) => {
    if (!items || items.length === 0) return null;
    return <div className="mb-4">
        <h4 className="font-semibold text-sm mb-2 text-gray-800">{title}</h4>
        <ul className="list-disc list-inside space-y-1">
          {items.map((item, index) => <li key={index} className="text-sm text-gray-700 leading-relaxed">{item}</li>)}
        </ul>
      </div>;
  };
  const renderJobDescription = () => {
    const requirements = parseStructuredData(job.requirements || '');
    const responsibilities = parseStructuredData(job.responsibilities || '');
    const benefits = parseStructuredData(job.benefits || '');
    const hasStructuredData = requirements.length > 0 || responsibilities.length > 0 || benefits.length > 0;
    if (!expanded) {
      const truncatedText = job.description.length > 300 ? job.description.slice(0, 300) + '...' : job.description;
      return <div className="text-sm text-gray-700 leading-relaxed">
          {formatTextWithBreaks(truncatedText)}
        </div>;
    }
    return <div className="space-y-4">
        {hasStructuredData ? <>
            {renderStructuredSection("Requirements", requirements)}
            {renderStructuredSection("Responsibilities", responsibilities)}
            {renderStructuredSection("Benefits", benefits)}
            {job.description && <div>
                <h4 className="font-semibold text-sm mb-2 text-gray-800">Additional Details</h4>
                <div className="text-sm text-gray-700 leading-relaxed">
                  {formatTextWithBreaks(job.description)}
                </div>
              </div>}
          </> : <div className="text-sm text-gray-700 leading-relaxed">
            {formatTextWithBreaks(job.description)}
          </div>}
      </div>;
  };
  const shouldShowToggle = job.description.length > 300 || parseStructuredData(job.requirements || '').length > 0 || parseStructuredData(job.responsibilities || '').length > 0 || parseStructuredData(job.benefits || '').length > 0;
  return <>
      <Card className={`hover:shadow-md transition-shadow ${job.source === 'employer' ? 'border-l-4 border-l-blue-500' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start gap-4">
              <div className="flex-1">
              <CardTitle className="text-lg mb-2">{job.title}</CardTitle>
              <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Building className="h-4 w-4" />
                  {job.company}
                </div>
                {job.location && <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {job.location}
                  </div>}
                {job.salary && <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    {job.salary}
                  </div>}
                {job.posted_at && <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {job.posted_at}
                  </div>}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {job.source === 'employer' && job.employer_profile?.logo_url && <img src={job.employer_profile.logo_url} alt={job.company} className="w-12 h-12 rounded object-cover" />}
              {job.source === 'database' && job.thumbnail && <img src={job.thumbnail} alt={job.company} className="w-12 h-12 rounded object-cover" />}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {renderJobDescription()}
            
            {shouldShowToggle && <Button variant="ghost" size="sm" onClick={toggleExpanded} className="h-auto p-1 text-blue-600 hover:text-blue-800">
                {expanded ? <>
                    <ChevronUp className="h-4 w-4 mr-1" />
                    Show Less
                  </> : <>
                    <ChevronDown className="h-4 w-4 mr-1" />
                    Show More
                  </>}
              </Button>}
            
            <div className="flex gap-2">
              {job.employment_type && <Badge variant="outline">{job.employment_type}</Badge>}
              {job.experience_level && <Badge variant="outline">{job.experience_level}</Badge>}
              {job.source === 'database' && job.via}
            </div>

            <div className="flex justify-between items-center pt-2">
              <div className="text-xs text-muted-foreground">
                Posted {job.posted_at && `${job.posted_at}`}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleSaveJob} disabled={saving || saved}>
                  {saved ? <>
                      <Check className="h-4 w-4 mr-1" />
                      Saved
                    </> : <>
                      <Save className="h-4 w-4 mr-1" />
                      {saving ? 'Saving...' : 'Save'}
                    </>}
                </Button>
                <Button onClick={handleViewJob} className={job.source === 'employer' ? '' : 'bg-blue-800 hover:bg-blue-700'}>
                  {job.source === 'employer' ? <>
                      <Briefcase className="h-4 w-4 mr-1" />
                      View & Apply
                    </> : <>
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Apply
                    </>}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* External Job Application Modal */}
      <ExternalJobApplicationModal isOpen={showExternalModal} onClose={() => setShowExternalModal(false)} job={job} />

      {/* Payment Modal */}
      <PaymentModal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} />
    </>;
};
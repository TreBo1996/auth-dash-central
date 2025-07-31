import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Building, DollarSign, Clock, Save, Check, Briefcase, ExternalLink, Share2, ChevronDown, ChevronUp } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { UnifiedJob } from '@/types/job';
import { toTitleCase } from '@/lib/utils';
import { useFeatureUsage } from '@/hooks/useFeatureUsage';
import { PaymentModal } from '@/components/subscription/PaymentModal';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface CompactJobCardProps {
  job: UnifiedJob;
  id?: string;
  isExpanded?: boolean;
  onExpandChange?: (expanded: boolean) => void;
}

export const CompactJobCard: React.FC<CompactJobCardProps> = ({ 
  job, 
  id,
  isExpanded: externalIsExpanded,
  onExpandChange 
}) => {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [internalIsExpanded, setInternalIsExpanded] = useState(false);
  
  // Use external expanded state if provided, otherwise use internal state
  const isExpanded = externalIsExpanded !== undefined ? externalIsExpanded : internalIsExpanded;
  const setIsExpanded = onExpandChange || setInternalIsExpanded;
  const navigate = useNavigate();
  const { toast } = useToast();
  const { checkFeatureAccess, incrementUsage, isPremium } = useFeatureUsage();

  const handleSaveJob = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
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

      if (!isPremium) {
        const canUse = await checkFeatureAccess('job_descriptions');
        if (!canUse) {
          setShowPaymentModal(true);
          return;
        }
      }

      const { error } = await supabase.from('job_descriptions').insert({
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

      if (!isPremium) {
        try {
          await incrementUsage('job_descriptions');
        } catch (usageError) {
          console.error('Error incrementing usage:', usageError);
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

  const getJobUrl = () => {
    if (job.source === 'employer') {
      return `/job/employer/${job.id}`;
    } else {
      return `/job/database/${job.id}`;
    }
  };

  const handleShareClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Create job search URL with jobId parameter
    const jobId = `${job.source}_${job.id}`;
    const currentSearch = new URLSearchParams(window.location.search);
    currentSearch.set('jobId', jobId);
    const url = `${window.location.origin}/job-search?${currentSearch.toString()}`;
    
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link Copied!",
        description: "Job posting link has been copied to clipboard"
      });
    } catch (error) {
      toast({
        title: "Share Link",
        description: url,
      });
    }
  };

  const handleViewJob = async () => {
    const url = `${getJobUrl()}?autoApply=true`;
    navigate(url);
  };

  const truncateDescription = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  const formatDescription = (text: string) => {
    // Format job description with line breaks
    return text.split('\n').map((line, index) => (
      <p key={index} className="mb-2 last:mb-0">{line}</p>
    ));
  };

  return (
    <>
      <Card 
        id={id}
        className="hover:shadow-md transition-all duration-200 border-l-4 border-l-primary/20 hover:border-l-primary"
      >
        <CardContent className="p-4">
            <div className="space-y-3">
              {/* Header */}
              <div className="flex justify-between items-start gap-3">
              <div className="flex-1 min-w-0">
                <Link to={getJobUrl()}>
                  <h3 className="font-bold text-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 transition-all duration-300 line-clamp-1 cursor-pointer">
                    {toTitleCase(job.title)}
                  </h3>
                </Link>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    <div className="flex items-center gap-1">
                      <Building className="h-3 w-3" />
                      <span className="truncate">{job.company}</span>
                    </div>
                    {job.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{job.location}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Company Logo */}
                {((job.source === 'employer' && job.employer_profile?.logo_url) || 
                  (job.source === 'database' && job.thumbnail)) && (
                  <div className="flex-shrink-0">
                    <img 
                      src={job.source === 'employer' ? job.employer_profile?.logo_url : job.thumbnail} 
                      alt={job.company} 
                      className="w-12 h-12 rounded-lg object-cover border"
                    />
                  </div>
                )}
              </div>

               {/* Description */}
              <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                <div className="text-sm text-foreground leading-relaxed">
                  <div className="space-y-2">
                    {isExpanded ? formatDescription(job.description) : (
                      <p className="line-clamp-2">{truncateDescription(job.description)}</p>
                    )}
                  </div>
                  
                  {job.description.length > 150 && (
                    <CollapsibleTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-auto p-0 mt-2 text-primary hover:text-primary/80"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                      >
                        {isExpanded ? (
                          <>
                            Show Less <ChevronUp className="h-3 w-3 ml-1" />
                          </>
                        ) : (
                          <>
                            Show More <ChevronDown className="h-3 w-3 ml-1" />
                          </>
                        )}
                      </Button>
                    </CollapsibleTrigger>
                  )}
                </div>
              </Collapsible>

              {/* Job Details */}
              <div className="flex flex-wrap gap-2">
                {job.salary && (
                  <Badge className="text-xs bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 shadow-sm hover:shadow-md transition-all duration-200">
                    <DollarSign className="h-3 w-3 mr-1" />
                    {job.salary}
                  </Badge>
                )}
                {job.employment_type && (
                  <Badge className="text-xs bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 shadow-sm hover:shadow-md transition-all duration-200">
                    {(() => {
                      const type = Array.isArray(job.employment_type) ? job.employment_type[0] : job.employment_type;
                      // Remove brackets if present
                      return typeof type === 'string' ? type.replace(/[\[\]"]/g, '') : type;
                    })()}
                  </Badge>
                )}
                {job.experience_level && (
                  <Badge className="text-xs bg-gradient-to-r from-orange-500 to-amber-600 text-white border-0 shadow-sm hover:shadow-md transition-all duration-200">
                    {job.experience_level}
                  </Badge>
                )}
              </div>

              {/* Footer */}
              <div className="flex justify-between items-center pt-2 border-t">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {job.posted_at}
                </div>
                
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleShareClick}
                    className="h-8 w-8 p-0"
                  >
                    <Share2 className="h-3 w-3" />
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleSaveJob} 
                    disabled={saving || saved}
                    className="h-8 w-8 p-0"
                  >
                    {saved ? (
                      <Check className="h-3 w-3 text-green-600" />
                    ) : (
                      <Save className="h-3 w-3" />
                    )}
                  </Button>
                  
                  <Button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleViewJob();
                    }}
                    size="sm"
                    className="h-8 px-3 text-xs"
                  >
                    {job.source === 'employer' ? (
                      <>
                        <Briefcase className="h-3 w-3 mr-1" />
                        Apply
                      </>
                    ) : (
                      <>
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Apply
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
      </Card>

      <PaymentModal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} />
    </>
  );
};
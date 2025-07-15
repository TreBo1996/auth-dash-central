import React, { useState, useEffect } from 'react';
import { ChevronDown, BarChart3, Target, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { JobHubChartsSection } from './JobHubChartsSection';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

interface CollapsibleChartsSectionProps {
  jobs: Array<{
    id: string;
    created_at: string;
    application_status?: string;
  }>;
}

export function CollapsibleChartsSection({ jobs }: CollapsibleChartsSectionProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  
  // Smart default state and localStorage persistence
  useEffect(() => {
    const storageKey = `jobhub-charts-collapsed-${user?.id || 'anonymous'}`;
    const storedState = localStorage.getItem(storageKey);
    
    if (storedState !== null) {
      setIsOpen(storedState === 'true');
    } else {
      // Default: collapsed on mobile, expanded on desktop if has jobs
      setIsOpen(jobs.length > 0 && !isMobile);
    }
  }, [jobs.length, user?.id, isMobile]);

  const handleToggle = (open: boolean) => {
    setIsOpen(open);
    const storageKey = `jobhub-charts-collapsed-${user?.id || 'anonymous'}`;
    localStorage.setItem(storageKey, open.toString());
  };

  const EmptyChartsState = () => (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
        <Target className="h-8 w-8 text-primary" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">
        Start Your Job Search Journey
      </h3>
      <p className="text-muted-foreground mb-6 max-w-md">
        Save job opportunities and track your application progress with visual insights and analytics.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={() => navigate('/job-search')} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Your First Job
        </Button>
        <Button variant="outline" onClick={() => navigate('/upload-job')}>
          Upload Job Description
        </Button>
      </div>
    </div>
  );

  const CollapsedPreview = () => (
    <div className="flex items-center justify-between p-3 sm:p-4">
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-lg flex items-center justify-center">
          <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-medium text-foreground text-sm sm:text-base">Application Insights</h3>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {jobs.length === 0 
              ? "Track your application progress with visual insights"
              : `Tracking ${jobs.length} application${jobs.length !== 1 ? 's' : ''}`
            }
          </p>
        </div>
      </div>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
          <span className="hidden sm:inline">{jobs.length === 0 ? "Get Started" : "View Charts"}</span>
          <span className="sm:hidden">{jobs.length === 0 ? "Start" : "Charts"}</span>
          <ChevronDown className={`h-3 w-3 sm:h-4 sm:w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </Button>
      </CollapsibleTrigger>
    </div>
  );

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={handleToggle}>
        <CardHeader className="pb-0">
          <CollapsedPreview />
        </CardHeader>
        
        <CollapsibleContent className="data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
          <CardContent className="pt-0">
            {jobs.length > 0 ? (
              <JobHubChartsSection jobs={jobs} />
            ) : (
              <EmptyChartsState />
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building, MapPin, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import { UnifiedJob } from '@/types/job';
import { toTitleCase } from '@/lib/utils';

interface MiniJobCardProps {
  job: UnifiedJob;
  onJobSelect?: (job: UnifiedJob) => void;
}

export const MiniJobCard: React.FC<MiniJobCardProps> = ({ job, onJobSelect }) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onJobSelect) {
      onJobSelect(job);
    }
  };

  return (
    <Card 
      className="hover:shadow-sm transition-all duration-200 border-l-2 border-l-primary/30 hover:border-l-primary cursor-pointer"
      onClick={handleClick}
    >
        <CardContent className="p-3">
          <div className="space-y-2">
            {/* Header with Title and Logo */}
            <div className="flex justify-between items-start gap-2">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm line-clamp-2 text-foreground hover:text-primary transition-colors">
                  {toTitleCase(job.title)}
                </h4>
              </div>
              
              {/* Company Logo */}
              {((job.source === 'employer' && job.employer_profile?.logo_url) || 
                (job.source === 'database' && job.thumbnail)) && (
                <div className="flex-shrink-0">
                  <img 
                    src={job.source === 'employer' ? job.employer_profile?.logo_url : job.thumbnail} 
                    alt={job.company} 
                    className="w-8 h-8 rounded object-cover border"
                  />
                </div>
              )}
            </div>
            
            {/* Company */}
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Building className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{job.company}</span>
            </div>
            
            {/* Location & Salary */}
            <div className="space-y-1">
              {job.location && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{job.location}</span>
                </div>
              )}
              
              {job.salary && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <DollarSign className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{job.salary}</span>
                </div>
              )}
            </div>
            
            {/* Employment Type Badge */}
            {job.employment_type && (
              <Badge variant="secondary" className="text-xs h-5">
                {Array.isArray(job.employment_type) ? job.employment_type[0] : job.employment_type}
              </Badge>
            )}
          </div>
        </CardContent>
    </Card>
  );
};
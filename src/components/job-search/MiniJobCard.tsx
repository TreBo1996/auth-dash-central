import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building, MapPin, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import { UnifiedJob } from '@/types/job';
import { toTitleCase } from '@/lib/utils';

interface MiniJobCardProps {
  job: UnifiedJob;
}

export const MiniJobCard: React.FC<MiniJobCardProps> = ({ job }) => {
  const getJobUrl = () => {
    if (job.source === 'employer') {
      return `/job/employer/${job.id}`;
    } else {
      return `/job/database/${job.id}`;
    }
  };

  return (
    <Card className="hover:shadow-sm transition-all duration-200 border-l-2 border-l-primary/30 hover:border-l-primary">
      <Link to={getJobUrl()}>
        <CardContent className="p-3">
          <div className="space-y-2">
            {/* Job Title */}
            <h4 className="font-medium text-sm line-clamp-2 text-foreground hover:text-primary transition-colors">
              {toTitleCase(job.title)}
            </h4>
            
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
      </Link>
    </Card>
  );
};
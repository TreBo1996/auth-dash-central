
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { MapPin, Building, DollarSign, Clock, Briefcase, Star } from 'lucide-react';

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
  };
}

interface EmployerJobCardProps {
  job: EmployerJob;
}

export const EmployerJobCard: React.FC<EmployerJobCardProps> = ({ job }) => {
  const navigate = useNavigate();

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

  const handleViewJob = () => {
    navigate(`/job-posting/${job.id}`);
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
                {job.employer_profile.company_name}
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
            {job.employer_profile.logo_url && (
              <img 
                src={job.employer_profile.logo_url} 
                alt={job.employer_profile.company_name}
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
            <Button onClick={handleViewJob}>
              <Briefcase className="h-4 w-4 mr-1" />
              View & Apply
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

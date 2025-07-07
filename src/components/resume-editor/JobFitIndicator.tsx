import React from 'react';
import { Target, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface JobFitIndicatorProps {
  atsScore?: number;
  className?: string;
}

export const JobFitIndicator: React.FC<JobFitIndicatorProps> = ({ 
  atsScore, 
  className 
}) => {
  const getJobFitData = (score?: number) => {
    if (!score) {
      return {
        level: 'unknown',
        label: 'Not Scored',
        description: 'Score your resume to see job fit',
        color: 'hsl(var(--muted-foreground))',
        bgColor: 'hsl(var(--muted))',
        icon: Target
      };
    }

    if (score >= 90) {
      return {
        level: 'excellent',
        label: 'Excellent Match',
        description: 'Outstanding fit for this role',
        color: 'hsl(var(--job-fit-excellent))',
        bgColor: 'hsl(var(--job-fit-excellent-bg))',
        icon: CheckCircle
      };
    }
    
    if (score >= 80) {
      return {
        level: 'strong',
        label: 'Strong Match', 
        description: 'Very good alignment with requirements',
        color: 'hsl(var(--job-fit-strong))',
        bgColor: 'hsl(var(--job-fit-strong-bg))',
        icon: CheckCircle
      };
    }
    
    if (score >= 70) {
      return {
        level: 'good',
        label: 'Good Match',
        description: 'Solid fit with room for improvement',
        color: 'hsl(var(--job-fit-good))',
        bgColor: 'hsl(var(--job-fit-good-bg))',
        icon: CheckCircle
      };
    }
    
    if (score >= 60) {
      return {
        level: 'fair',
        label: 'Fair Match',
        description: 'Moderate alignment, needs enhancement',
        color: 'hsl(var(--job-fit-fair))',
        bgColor: 'hsl(var(--job-fit-fair-bg))',
        icon: AlertTriangle
      };
    }
    
    if (score >= 50) {
      return {
        level: 'weak',
        label: 'Weak Match',
        description: 'Significant improvements needed',
        color: 'hsl(var(--job-fit-weak))',
        bgColor: 'hsl(var(--job-fit-weak-bg))',
        icon: AlertTriangle
      };
    }
    
    return {
      level: 'poor',
      label: 'Poor Match',
      description: 'Major optimization required',
      color: 'hsl(var(--job-fit-poor))',
      bgColor: 'hsl(var(--job-fit-poor-bg))',
      icon: XCircle
    };
  };

  const jobFit = getJobFitData(atsScore);
  const IconComponent = jobFit.icon;

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Job Fit Badge */}
      <div 
        className="flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors"
        style={{ 
          backgroundColor: jobFit.bgColor,
          borderColor: jobFit.color,
          color: jobFit.color
        }}
      >
        <IconComponent className="h-4 w-4" />
        <div className="flex flex-col">
          <span className="text-sm font-semibold">{jobFit.label}</span>
          {atsScore && (
            <span className="text-xs opacity-80">{atsScore}/100 ATS Score</span>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="flex-1">
        <p className="text-sm text-muted-foreground">{jobFit.description}</p>
      </div>

      {/* Progress Bar */}
      {atsScore && (
        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full transition-all duration-500 ease-out rounded-full"
            style={{ 
              width: `${atsScore}%`,
              backgroundColor: jobFit.color
            }}
          />
        </div>
      )}
    </div>
  );
};
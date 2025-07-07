import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ATSInfoTooltipProps {
  className?: string;
  size?: 'sm' | 'md';
}

export const ATSInfoTooltip: React.FC<ATSInfoTooltipProps> = ({ 
  className,
  size = 'sm' 
}) => {
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info 
            className={cn(
              iconSize, 
              "text-muted-foreground hover:text-primary cursor-help transition-colors",
              className
            )} 
          />
        </TooltipTrigger>
        <TooltipContent className="max-w-xs p-3" side="top">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">What is ATS?</h4>
            <p className="text-xs leading-relaxed">
              <strong>Applicant Tracking System (ATS)</strong> is software used by employers to scan, parse, and rank resumes before human review.
            </p>
            <div className="space-y-1">
              <p className="text-xs font-medium">Why it matters:</p>
              <ul className="text-xs space-y-0.5 list-disc list-inside leading-relaxed">
                <li>75%+ of resumes are rejected by ATS before reaching hiring managers</li>
                <li>Higher ATS scores = better chance of getting interviews</li>
                <li>Optimized formatting ensures your content is properly parsed</li>
              </ul>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';

interface FreeBadgeProps {
  className?: string;
  size?: 'sm' | 'md';
}

export const FreeBadge: React.FC<FreeBadgeProps> = ({ 
  className = '', 
  size = 'sm' 
}) => {
  return (
    <Badge 
      variant="secondary" 
      className={`bg-muted text-muted-foreground border-border ${
        size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-sm px-2 py-1'
      } ${className}`}
    >
      <Check className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} mr-1`} />
      Free
    </Badge>
  );
};
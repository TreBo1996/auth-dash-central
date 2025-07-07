import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Crown } from 'lucide-react';

interface PremiumBadgeProps {
  className?: string;
  size?: 'sm' | 'md';
}

export const PremiumBadge: React.FC<PremiumBadgeProps> = ({ 
  className = '', 
  size = 'sm' 
}) => {
  return (
    <Badge 
      variant="secondary" 
      className={`bg-gradient-primary text-white border-0 ${
        size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-sm px-2 py-1'
      } ${className}`}
    >
      <Crown className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} mr-1 text-white`} />
      Premium
    </Badge>
  );
};
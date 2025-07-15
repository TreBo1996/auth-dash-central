import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, CheckCircle, User, X, Trophy, Minus } from 'lucide-react';

export type ApplicationStatus = 'pending' | 'applied' | 'interviewing' | 'rejected' | 'offer' | 'withdrawn';

interface JobStatusSelectorProps {
  status: ApplicationStatus;
  onStatusChange: (status: ApplicationStatus) => void;
  disabled?: boolean;
}

const statusConfig = {
  pending: {
    label: 'Saved',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Clock,
    selectColor: 'text-yellow-700'
  },
  applied: {
    label: 'Applied',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: CheckCircle,
    selectColor: 'text-blue-700'
  },
  interviewing: {
    label: 'Interviewing',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: User,
    selectColor: 'text-purple-700'
  },
  rejected: {
    label: 'Rejected',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: X,
    selectColor: 'text-red-700'
  },
  offer: {
    label: 'Offer',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: Trophy,
    selectColor: 'text-green-700'
  },
  withdrawn: {
    label: 'Withdrawn',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: Minus,
    selectColor: 'text-gray-700'
  }
};

export function JobStatusSelector({ status, onStatusChange, disabled = false }: JobStatusSelectorProps) {
  const currentStatus = statusConfig[status];
  const Icon = currentStatus.icon;

  return (
    <Select value={status} onValueChange={onStatusChange} disabled={disabled}>
      <SelectTrigger className="w-full">
        <SelectValue>
          <Badge variant="outline" className={`${currentStatus.color} font-medium`}>
            <Icon className="w-3 h-3 mr-1" />
            {currentStatus.label}
          </Badge>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {Object.entries(statusConfig).map(([key, config]) => {
          const StatusIcon = config.icon;
          return (
            <SelectItem key={key} value={key} className={config.selectColor}>
              <div className="flex items-center">
                <StatusIcon className="w-4 h-4 mr-2" />
                {config.label}
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
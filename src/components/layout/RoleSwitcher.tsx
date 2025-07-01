
import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, Briefcase, User } from 'lucide-react';
import { useRole } from '@/contexts/RoleContext';
import { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

const roleLabels: Record<AppRole, string> = {
  'job_seeker': 'Job Seeker',
  'employer': 'Employer',
  'both': 'Both Roles'
};

const roleIcons: Record<AppRole, React.ReactNode> = {
  'job_seeker': <User className="h-4 w-4" />,
  'employer': <Briefcase className="h-4 w-4" />,
  'both': <Briefcase className="h-4 w-4" />
};

export const RoleSwitcher: React.FC = () => {
  const { activeRole, canSwitchRoles, switchRole, hasRole } = useRole();

  if (!canSwitchRoles || !activeRole) {
    return (
      <Badge variant="secondary" className="gap-2">
        {activeRole && roleIcons[activeRole]}
        {activeRole && roleLabels[activeRole]}
      </Badge>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          {roleIcons[activeRole]}
          {roleLabels[activeRole]}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {hasRole('job_seeker') && (
          <DropdownMenuItem
            onClick={() => switchRole('job_seeker')}
            className="gap-2"
            disabled={activeRole === 'job_seeker'}
          >
            <User className="h-4 w-4" />
            Job Seeker
            {activeRole === 'job_seeker' && (
              <Badge variant="secondary" className="ml-auto">Active</Badge>
            )}
          </DropdownMenuItem>
        )}
        {hasRole('employer') && (
          <DropdownMenuItem
            onClick={() => switchRole('employer')}
            className="gap-2"
            disabled={activeRole === 'employer'}
          >
            <Briefcase className="h-4 w-4" />
            Employer
            {activeRole === 'employer' && (
              <Badge variant="secondary" className="ml-auto">Active</Badge>
            )}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

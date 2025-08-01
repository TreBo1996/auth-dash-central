import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Search, ChevronDown, ChevronUp, X, MapPin, Building, Calendar, Briefcase, User } from 'lucide-react';

// Common location options across all job search components
const locationOptions = [
  { value: 'all', label: 'Any location' },
  { value: 'remote', label: 'Remote' },
  { value: 'new-york-ny', label: 'New York, NY' },
  { value: 'san-francisco-ca', label: 'San Francisco, CA' },
  { value: 'los-angeles-ca', label: 'Los Angeles, CA' },
  { value: 'chicago-il', label: 'Chicago, IL' },
  { value: 'boston-ma', label: 'Boston, MA' },
  { value: 'seattle-wa', label: 'Seattle, WA' },
  { value: 'austin-tx', label: 'Austin, TX' },
  { value: 'denver-co', label: 'Denver, CO' },
  { value: 'miami-fl', label: 'Miami, FL' },
  { value: 'atlanta-ga', label: 'Atlanta, GA' },
  { value: 'washington-dc', label: 'Washington, DC' },
  { value: 'portland-or', label: 'Portland, OR' },
  { value: 'california', label: 'California' },
  { value: 'new-york', label: 'New York' },
  { value: 'texas', label: 'Texas' },
  { value: 'florida', label: 'Florida' },
  { value: 'washington', label: 'Washington' },
  { value: 'london-uk', label: 'London, UK' },
  { value: 'toronto-canada', label: 'Toronto, Canada' },
  { value: 'vancouver-canada', label: 'Vancouver, Canada' },
  { value: 'berlin-germany', label: 'Berlin, Germany' },
  { value: 'amsterdam-netherlands', label: 'Amsterdam, Netherlands' },
];

interface CollapsibleFiltersProps {
  onSearch: (data: {
    query: string;
    location: string;
    remoteType?: string;
    employmentType?: string;
    seniorityLevel?: string;
    company?: string;
    maxAge?: number;
  }) => void;
  loading: boolean;
  filters?: {
    query: string;
    location: string;
    remoteType?: string;
    employmentType?: string;
    seniorityLevel?: string;
    company?: string;
    maxAge?: number;
  };
}

export const CollapsibleFilters: React.FC<CollapsibleFiltersProps> = ({
  onSearch,
  loading,
  filters
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = React.useState(filters?.query || '');
  const [location, setLocation] = React.useState(filters?.location || '');
  const [remoteType, setRemoteType] = React.useState(filters?.remoteType || '');
  const [employmentType, setEmploymentType] = React.useState(filters?.employmentType || '');
  const [seniorityLevel, setSeniorityLevel] = React.useState(filters?.seniorityLevel || '');
  const [company, setCompany] = React.useState(filters?.company || '');
  const [maxAge, setMaxAge] = React.useState(filters?.maxAge?.toString() || '30');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() || (location && location !== 'all') || company.trim()) {
      onSearch({
        query: query.trim(),
        location: location === 'all' ? '' : location,
        remoteType: remoteType === 'all' ? undefined : remoteType || undefined,
        employmentType: employmentType === 'all' ? undefined : employmentType || undefined,
        seniorityLevel: seniorityLevel === 'all' ? undefined : seniorityLevel || undefined,
        company: company.trim() || undefined,
        maxAge: parseInt(maxAge) || 30
      });
    }
  };

  const clearFilters = () => {
    setQuery('');
    setLocation('');
    setRemoteType('');
    setEmploymentType('');
    setSeniorityLevel('');
    setCompany('');
    setMaxAge('30');
  };

  const getActiveFilters = () => {
    const active = [];
    if (location && location !== 'all') {
      const locationOption = locationOptions.find(opt => opt.value === location);
      active.push({ label: locationOption?.label || location, type: 'location' });
    }
    if (remoteType && remoteType !== 'all') active.push({ label: remoteType, type: 'remote' });
    if (employmentType && employmentType !== 'all') active.push({ label: employmentType, type: 'employment' });
    if (seniorityLevel && seniorityLevel !== 'all') active.push({ label: seniorityLevel, type: 'seniority' });
    if (company) active.push({ label: company, type: 'company' });
    return active;
  };

  const activeFilters = getActiveFilters();

  return (
    <Card>
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Always Visible Job Title Search */}
          <div className="space-y-2">
            <Label htmlFor="job-query">Job Title or Keywords</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                id="job-query" 
                type="text" 
                placeholder="e.g., Software Engineer" 
                value={query} 
                onChange={e => setQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Popover Additional Filters */}
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-between" type="button">
                More Filters {activeFilters.length > 0 && `(${activeFilters.length})`}
                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </PopoverTrigger>
            
            <PopoverContent className="w-80 p-4 space-y-4 max-h-[400px] overflow-y-auto" align="start">
              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="job-location">Location</Label>
                <Select value={location} onValueChange={setLocation}>
                  <SelectTrigger>
                    <MapPin className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locationOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Company */}
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="company" 
                    type="text" 
                    placeholder="e.g., Google, Microsoft" 
                    value={company} 
                    onChange={e => setCompany(e.target.value)} 
                    className="pl-10" 
                  />
                </div>
              </div>

              {/* Remote Type */}
              <div className="space-y-2">
                <Label htmlFor="remote-type">Remote Type</Label>
                <Select value={remoteType} onValueChange={setRemoteType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any remote type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any remote type</SelectItem>
                    <SelectItem value="remote">Remote</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                    <SelectItem value="onsite">On-site</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Employment Type */}
              <div className="space-y-2">
                <Label htmlFor="employment-type">Employment Type</Label>
                <Select value={employmentType} onValueChange={setEmploymentType}>
                  <SelectTrigger>
                    <Briefcase className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Any type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any type</SelectItem>
                    <SelectItem value="Full-time">Full-time</SelectItem>
                    <SelectItem value="Part-time">Part-time</SelectItem>
                    <SelectItem value="Contract">Contract</SelectItem>
                    <SelectItem value="Internship">Internship</SelectItem>
                    <SelectItem value="Temporary">Temporary</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Experience Level */}
              <div className="space-y-2">
                <Label htmlFor="seniority-level">Experience Level</Label>
                <Select value={seniorityLevel} onValueChange={setSeniorityLevel}>
                  <SelectTrigger>
                    <User className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Any level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any level</SelectItem>
                    <SelectItem value="Entry level">Entry level</SelectItem>
                    <SelectItem value="Associate">Associate</SelectItem>
                    <SelectItem value="Mid-Senior level">Mid-Senior level</SelectItem>
                    <SelectItem value="Director">Director</SelectItem>
                    <SelectItem value="Executive">Executive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Job Age */}
              <div className="space-y-2">
                <Label htmlFor="max-age">Job Age</Label>
                <Select value={maxAge} onValueChange={setMaxAge}>
                  <SelectTrigger>
                    <Calendar className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Any age" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Past 24 hours</SelectItem>
                    <SelectItem value="3">Past 3 days</SelectItem>
                    <SelectItem value="7">Past week</SelectItem>
                    <SelectItem value="14">Past 2 weeks</SelectItem>
                    <SelectItem value="30">Past month</SelectItem>
                    <SelectItem value="90">Past 3 months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </PopoverContent>
          </Popover>

          {/* Search and Clear Buttons */}
          <div className="flex gap-2">
            <Button 
              type="submit" 
              disabled={loading || (!query.trim() && (!location || location === 'all') && !company.trim())} 
              className="flex-1"
            >
              {loading ? 'Searching...' : 'Search Jobs'}
            </Button>
            {activeFilters.length > 0 && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={clearFilters}
                className="px-3"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </form>

        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div className="mt-4 space-y-2">
            <Label className="text-sm font-medium">Active Filters</Label>
            <div className="flex flex-wrap gap-2">
              {activeFilters.map((filter, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {filter.label}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, MapPin, Calendar, Briefcase, User, Building } from 'lucide-react';

interface JobSearchFormProps {
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
}

export const JobSearchForm: React.FC<JobSearchFormProps> = ({ onSearch, loading }) => {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [remoteType, setRemoteType] = useState('');
  const [employmentType, setEmploymentType] = useState('');
  const [seniorityLevel, setSeniorityLevel] = useState('');
  const [company, setCompany] = useState('');
  const [maxAge, setMaxAge] = useState('30');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch({
        query: query.trim(),
        location: location.trim(),
        remoteType: remoteType || undefined,
        employmentType: employmentType || undefined,
        seniorityLevel: seniorityLevel || undefined,
        company: company.trim() || undefined,
        maxAge: parseInt(maxAge) || 30
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Search Jobs in Database
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="job-query">Job Title or Keywords</Label>
              <Input
                id="job-query"
                type="text"
                placeholder="e.g., Software Engineer, Marketing Manager"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="job-location">Location</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="job-location"
                  type="text"
                  placeholder="e.g., New York, San Francisco"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <div className="relative">
                <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="company"
                  type="text"
                  placeholder="e.g., Google, Microsoft"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-age">Job Age (Days)</Label>
              <Select value={maxAge} onValueChange={setMaxAge}>
                <SelectTrigger>
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Any age" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Today</SelectItem>
                  <SelectItem value="3">Past 3 days</SelectItem>
                  <SelectItem value="7">Past week</SelectItem>
                  <SelectItem value="14">Past 2 weeks</SelectItem>
                  <SelectItem value="30">Past month</SelectItem>
                  <SelectItem value="90">Past 3 months</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="remote-type">Remote Type</Label>
              <Select value={remoteType} onValueChange={setRemoteType}>
                <SelectTrigger>
                  <SelectValue placeholder="Any remote type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any remote type</SelectItem>
                  <SelectItem value="remote">Remote</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                  <SelectItem value="onsite">On-site</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="employment-type">Employment Type</Label>
              <Select value={employmentType} onValueChange={setEmploymentType}>
                <SelectTrigger>
                  <Briefcase className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Any type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any type</SelectItem>
                  <SelectItem value="Full-time">Full-time</SelectItem>
                  <SelectItem value="Part-time">Part-time</SelectItem>
                  <SelectItem value="Contract">Contract</SelectItem>
                  <SelectItem value="Internship">Internship</SelectItem>
                  <SelectItem value="Temporary">Temporary</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="seniority-level">Seniority Level</Label>
              <Select value={seniorityLevel} onValueChange={setSeniorityLevel}>
                <SelectTrigger>
                  <User className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Any level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any level</SelectItem>
                  <SelectItem value="Entry level">Entry level</SelectItem>
                  <SelectItem value="Associate">Associate</SelectItem>
                  <SelectItem value="Mid-Senior level">Mid-Senior level</SelectItem>
                  <SelectItem value="Director">Director</SelectItem>
                  <SelectItem value="Executive">Executive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full md:w-auto" 
            disabled={loading || !query.trim()}
          >
            {loading ? 'Searching...' : 'Search Jobs'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, MapPin, Calendar, Briefcase, User } from 'lucide-react';

interface JobSearchFormProps {
  onSearch: (data: {
    query: string;
    location: string;
    page?: number;
    resultsPerPage?: number;
    datePosted?: string;
    jobType?: string;
    experienceLevel?: string;
  }) => void;
  loading: boolean;
}

export const JobSearchForm: React.FC<JobSearchFormProps> = ({ onSearch, loading }) => {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [datePosted, setDatePosted] = useState('any');
  const [jobType, setJobType] = useState('any');
  const [experienceLevel, setExperienceLevel] = useState('any');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch({
        query: query.trim(),
        location: location.trim(),
        page: 1,
        resultsPerPage: 100, // Changed to 100
        datePosted: datePosted === 'any' ? '' : datePosted,
        jobType: jobType === 'any' ? '' : jobType,
        experienceLevel: experienceLevel === 'any' ? '' : experienceLevel
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Search for Jobs
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
                  placeholder="e.g., New York, Remote, San Francisco"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="date-posted">Date Posted</Label>
              <Select value={datePosted} onValueChange={setDatePosted}>
                <SelectTrigger>
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Any time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any time</SelectItem>
                  <SelectItem value="day">Past 24 hours</SelectItem>
                  <SelectItem value="3days">Past 3 days</SelectItem>
                  <SelectItem value="week">Past week</SelectItem>
                  <SelectItem value="month">Past month</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="job-type">Job Type</Label>
              <Select value={jobType} onValueChange={setJobType}>
                <SelectTrigger>
                  <Briefcase className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Any type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any type</SelectItem>
                  <SelectItem value="full-time">Full-time</SelectItem>
                  <SelectItem value="part-time">Part-time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="internship">Internship</SelectItem>
                  <SelectItem value="temporary">Temporary</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="experience-level">Experience Level</Label>
              <Select value={experienceLevel} onValueChange={setExperienceLevel}>
                <SelectTrigger>
                  <User className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Any level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any level</SelectItem>
                  <SelectItem value="entry-level">Entry level</SelectItem>
                  <SelectItem value="mid-level">Mid level</SelectItem>
                  <SelectItem value="senior-level">Senior level</SelectItem>
                  <SelectItem value="executive">Executive</SelectItem>
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

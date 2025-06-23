
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, MapPin } from 'lucide-react';

interface JobSearchFormProps {
  onSearch: (data: { query: string; location: string }) => void;
  loading: boolean;
}

export const JobSearchForm: React.FC<JobSearchFormProps> = ({ onSearch, loading }) => {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch({ query: query.trim(), location: location.trim() });
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
                  placeholder="e.g., New York, Remote"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="pl-10"
                />
              </div>
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

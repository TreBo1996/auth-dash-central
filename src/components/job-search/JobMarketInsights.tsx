import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Clock, Award, TrendingUp, MapPin, Building, Wifi } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface JobMarketInsights {
  averageSalary: {
    min: number;
    max: number;
    currency: string;
  };
  experienceLevel: {
    entry: string;
    mid: string;
    senior: string;
  };
  topSkills: string[];
  marketOutlook: {
    demand: string;
    growth: string;
    description: string;
  };
  commonLocations: string[];
  remoteAvailability: string;
  keyIndustries: string[];
}

interface JobMarketInsightsProps {
  jobTitle: string;
}

export const JobMarketInsights: React.FC<JobMarketInsightsProps> = ({ jobTitle }) => {
  const [insights, setInsights] = useState<JobMarketInsights | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobTitle || jobTitle.trim().length === 0) {
      setInsights(null);
      return;
    }

    const fetchInsights = async () => {
      // Check cache first
      const cacheKey = `job-insights-${jobTitle.toLowerCase().trim()}`;
      const cachedData = sessionStorage.getItem(cacheKey);
      
      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData);
          const cacheTime = parsed.timestamp;
          const now = Date.now();
          // Cache for 24 hours
          if (now - cacheTime < 24 * 60 * 60 * 1000) {
            setInsights(parsed.data);
            return;
          }
        } catch (e) {
          // Invalid cache, continue to fetch
        }
      }

      setLoading(true);
      setError(null);

      try {
        const { data, error: functionError } = await supabase.functions.invoke(
          'generate-job-market-insights',
          {
            body: { jobTitle },
          }
        );

        if (functionError) {
          throw new Error(functionError.message);
        }

        if (data.error) {
          throw new Error(data.error);
        }

        setInsights(data);
        
        // Cache the result
        sessionStorage.setItem(cacheKey, JSON.stringify({
          data,
          timestamp: Date.now()
        }));

      } catch (err) {
        console.error('Error fetching job market insights:', err);
        setError('Unable to load market insights');
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, [jobTitle]);

  if (!jobTitle || jobTitle.trim().length === 0) {
    return null;
  }

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            Market Insights for "{jobTitle}"
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-4">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Analyzing job market data...</p>
          </div>
          <div className="animate-pulse space-y-4">
            {/* Salary & Demand */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded w-16"></div>
                <div className="h-6 bg-muted rounded w-24"></div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded w-20"></div>
                <div className="h-6 bg-muted rounded w-16"></div>
              </div>
            </div>
            {/* Skills */}
            <div className="space-y-2">
              <div className="h-3 bg-muted rounded w-16"></div>
              <div className="flex flex-wrap gap-1">
                <div className="h-6 bg-muted rounded w-16"></div>
                <div className="h-6 bg-muted rounded w-20"></div>
                <div className="h-6 bg-muted rounded w-14"></div>
              </div>
            </div>
            {/* Experience & Locations */}
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded w-20"></div>
                <div className="flex gap-1">
                  <div className="h-6 bg-muted rounded w-16"></div>
                  <div className="h-6 bg-muted rounded w-12"></div>
                  <div className="h-6 bg-muted rounded w-18"></div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !insights) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4 text-red-500" />
            Market Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            {error || 'Unable to load market insights'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const formatSalary = (min: number, max: number) => {
    const formatNumber = (num: number) => {
      if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
      if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
      return num.toString();
    };
    return `$${formatNumber(min)} - $${formatNumber(max)}`;
  };

  const getDemandColor = (demand: string) => {
    switch (demand.toLowerCase()) {
      case 'high': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-red-600';
      default: return 'text-muted-foreground';
    }
  };

  const getRemoteColor = (availability: string) => {
    switch (availability.toLowerCase()) {
      case 'high': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-red-600';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <TrendingUp className="h-4 w-4 text-blue-500" />
          Market Insights for "{jobTitle}"
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Salary Range */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-3 w-3 text-green-500" />
            <span className="text-xs text-muted-foreground">Avg. Salary</span>
          </div>
          <Badge variant="secondary" className="text-xs">
            {formatSalary(insights.averageSalary.min, insights.averageSalary.max)}
          </Badge>
        </div>

        {/* Market Demand */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-3 w-3 text-blue-500" />
            <span className="text-xs text-muted-foreground">Market Demand</span>
          </div>
          <Badge variant="secondary" className={`text-xs ${getDemandColor(insights.marketOutlook.demand)}`}>
            {insights.marketOutlook.demand} ({insights.marketOutlook.growth})
          </Badge>
        </div>

        {/* Remote Availability */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wifi className="h-3 w-3 text-purple-500" />
            <span className="text-xs text-muted-foreground">Remote Work</span>
          </div>
          <Badge variant="secondary" className={`text-xs ${getRemoteColor(insights.remoteAvailability)}`}>
            {insights.remoteAvailability}
          </Badge>
        </div>

        {/* Top Skills */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Award className="h-3 w-3 text-orange-500" />
            <span className="text-xs font-medium text-muted-foreground">Key Skills</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {insights.topSkills.slice(0, 4).map((skill, index) => (
              <Badge key={index} variant="outline" className="text-xs px-1 py-0">
                {skill}
              </Badge>
            ))}
          </div>
        </div>

        {/* Experience Levels */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-3 w-3 text-indigo-500" />
            <span className="text-xs font-medium text-muted-foreground">Experience</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-xs px-1 py-0">
              Entry: {insights.experienceLevel.entry}
            </Badge>
            <Badge variant="outline" className="text-xs px-1 py-0">
              Mid: {insights.experienceLevel.mid}
            </Badge>
            <Badge variant="outline" className="text-xs px-1 py-0">
              Senior: {insights.experienceLevel.senior}
            </Badge>
          </div>
        </div>

        {/* Top Locations */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-3 w-3 text-red-500" />
            <span className="text-xs font-medium text-muted-foreground">Top Locations</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {insights.commonLocations.slice(0, 3).map((location, index) => (
              <Badge key={index} variant="outline" className="text-xs px-1 py-0">
                {location}
              </Badge>
            ))}
          </div>
        </div>

        {/* Key Industries */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Building className="h-3 w-3 text-cyan-500" />
            <span className="text-xs font-medium text-muted-foreground">Top Industries</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {insights.keyIndustries.slice(0, 3).map((industry, index) => (
              <Badge key={index} variant="outline" className="text-xs px-1 py-0">
                {industry}
              </Badge>
            ))}
          </div>
        </div>

        {/* Market Outlook Description */}
        {insights.marketOutlook.description && (
          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground leading-relaxed">
              {insights.marketOutlook.description}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
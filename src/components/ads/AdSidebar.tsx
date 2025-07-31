import React from 'react';
import { GoogleAd } from './GoogleAd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, TrendingUp, Users } from 'lucide-react';

export const AdSidebar: React.FC = () => {
  return (
    <div className="space-y-6 h-full overflow-y-auto scrollbar-hide">
      {/* Community Stats - Moved to top */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-blue-500" />
            RezLit Community
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-muted-foreground space-y-2">
            <div className="flex justify-between">
              <span>Active Job Seekers</span>
              <Badge variant="secondary" className="text-xs">50,000+</Badge>
            </div>
            <div className="flex justify-between">
              <span>Jobs Posted Today</span>
              <Badge variant="secondary" className="text-xs">1,200+</Badge>
            </div>
            <div className="flex justify-between">
              <span>Success Stories</span>
              <Badge variant="secondary" className="text-xs">15,000+</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Primary Ad Slot */}
      <GoogleAd 
        adSlot="1737766610"
        adFormat="auto"
        className="min-h-[250px]"
      />

      {/* Job Search Tips Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Lightbulb className="h-4 w-4 text-yellow-500" />
            Job Search Tips
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-xs text-muted-foreground space-y-2">
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="text-xs px-1 py-0">1</Badge>
              <span>Customize your resume for each application</span>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="text-xs px-1 py-0">2</Badge>
              <span>Use relevant keywords from job descriptions</span>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="text-xs px-1 py-0">3</Badge>
              <span>Apply within 48 hours of posting</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Secondary Ad Slot */}
      <GoogleAd 
        adSlot="0987654321"
        adFormat="rectangle"
        className="min-h-[200px]"
      />

      {/* Market Insights Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4 text-green-500" />
            Market Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-xs text-muted-foreground space-y-2">
            <div className="flex justify-between">
              <span>Avg. Response Time</span>
              <Badge variant="secondary" className="text-xs">3-5 days</Badge>
            </div>
            <div className="flex justify-between">
              <span>Most Active Day</span>
              <Badge variant="secondary" className="text-xs">Tuesday</Badge>
            </div>
            <div className="flex justify-between">
              <span>Success Rate</span>
              <Badge variant="secondary" className="text-xs">15-20%</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tertiary Ad Slot */}
      <GoogleAd 
        adSlot="1122334455"
        adFormat="rectangle"
        className="min-h-[150px]"
      />
    </div>
  );
};
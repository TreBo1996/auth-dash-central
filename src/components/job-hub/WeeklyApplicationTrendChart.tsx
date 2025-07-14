import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, subWeeks, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';

interface WeeklyApplicationTrendChartProps {
  jobs: Array<{
    created_at: string;
    application_status?: string;
  }>;
}

export function WeeklyApplicationTrendChart({ jobs }: WeeklyApplicationTrendChartProps) {
  // Generate last 8 weeks of data
  const generateWeeklyData = () => {
    const weeks = [];
    const now = new Date();
    
    for (let i = 7; i >= 0; i--) {
      const weekStart = startOfWeek(subWeeks(now, i));
      const weekEnd = endOfWeek(weekStart);
      
      const appliedJobsThisWeek = jobs.filter(job => {
        const jobDate = new Date(job.created_at);
        return job.application_status === 'applied' && 
               isWithinInterval(jobDate, { start: weekStart, end: weekEnd });
      }).length;

      const interviewJobsThisWeek = jobs.filter(job => {
        const jobDate = new Date(job.created_at);
        return job.application_status === 'interviewing' && 
               isWithinInterval(jobDate, { start: weekStart, end: weekEnd });
      }).length;

      const offerJobsThisWeek = jobs.filter(job => {
        const jobDate = new Date(job.created_at);
        return job.application_status === 'offer' && 
               isWithinInterval(jobDate, { start: weekStart, end: weekEnd });
      }).length;
      
      weeks.push({
        week: format(weekStart, 'MMM dd'),
        applications: appliedJobsThisWeek,
        interviews: interviewJobsThisWeek,
        offers: offerJobsThisWeek,
        weekStart: weekStart.toISOString()
      });
    }
    
    return weeks;
  };

  const weeklyData = generateWeeklyData();
  const totalApplications = weeklyData.reduce((sum, week) => sum + week.applications, 0);
  const totalInterviews = weeklyData.reduce((sum, week) => sum + week.interviews, 0);
  const totalOffers = weeklyData.reduce((sum, week) => sum + week.offers, 0);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background p-3 border border-border rounded-lg shadow-lg">
          <p className="font-medium">Week of {label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              • {entry.value} {entry.dataKey === 'applications' ? 'applications' : 
                                 entry.dataKey === 'interviews' ? 'interviews' : 'offers'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const totalActivities = totalApplications + totalInterviews + totalOffers;

  if (totalActivities === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Weekly Progress Trends</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center text-muted-foreground">
            <p className="text-lg font-medium">No activity yet</p>
            <p className="text-sm">Start applying to jobs to see your weekly progress trends</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Weekly Progress Trends</CardTitle>
        <p className="text-sm text-muted-foreground">
          {totalApplications} applications • {totalInterviews} interviews • {totalOffers} offers
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="week" 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="applications" 
                stroke="#3B82F6" 
                strokeWidth={3}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
              />
              <Line 
                type="monotone" 
                dataKey="interviews" 
                stroke="#8B5CF6" 
                strokeWidth={2}
                dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5, stroke: '#8B5CF6', strokeWidth: 2 }}
              />
              <Line 
                type="monotone" 
                dataKey="offers" 
                stroke="#10B981" 
                strokeWidth={2}
                dot={{ fill: '#10B981', strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5, stroke: '#10B981', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend */}
        <div className="flex flex-wrap gap-4 justify-center text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-blue-600"></div>
            <span className="text-muted-foreground">Applications</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-purple-600"></div>
            <span className="text-muted-foreground">Interviews</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-green-600"></div>
            <span className="text-muted-foreground">Offers</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
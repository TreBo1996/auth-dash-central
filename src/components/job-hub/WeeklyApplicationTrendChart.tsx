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
      
      weeks.push({
        week: format(weekStart, 'MMM dd'),
        applications: appliedJobsThisWeek,
        weekStart: weekStart.toISOString()
      });
    }
    
    return weeks;
  };

  const weeklyData = generateWeeklyData();
  const totalApplications = weeklyData.reduce((sum, week) => sum + week.applications, 0);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-background p-3 border border-border rounded-lg shadow-lg">
          <p className="font-medium">Week of {label}</p>
          <p className="text-blue-600">
            {data.value} applications submitted
          </p>
        </div>
      );
    }
    return null;
  };

  if (totalApplications === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Weekly Application Trend</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center text-muted-foreground">
            <p className="text-lg font-medium">No applications yet</p>
            <p className="text-sm">Start applying to jobs to see your weekly trend</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Weekly Application Trend</CardTitle>
        <p className="text-sm text-muted-foreground">
          {totalApplications} applications in the last 8 weeks
        </p>
      </CardHeader>
      <CardContent>
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
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
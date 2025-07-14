import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ApplicationStatusChartProps {
  data: Array<{
    status: string;
    count: number;
    label: string;
  }>;
}

const STATUS_COLORS = {
  pending: '#F59E0B',
  applied: '#3B82F6',
  interviewing: '#8B5CF6',
  rejected: '#EF4444',
  offer: '#10B981',
  withdrawn: '#6B7280'
};

export function ApplicationStatusChart({ data }: ApplicationStatusChartProps) {
  const totalJobs = data.reduce((sum, item) => sum + item.count, 0);
  
  const chartData = data
    .filter(item => item.count > 0)
    .map(item => ({
      ...item,
      color: STATUS_COLORS[item.status as keyof typeof STATUS_COLORS]
    }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = ((data.count / totalJobs) * 100).toFixed(1);
      return (
        <div className="bg-background p-3 border border-border rounded-lg shadow-lg">
          <p className="font-medium">{data.label}</p>
          <p className="text-muted-foreground">
            {data.count} jobs ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  if (totalJobs === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Application Status</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center text-muted-foreground">
            <p className="text-lg font-medium">No jobs yet</p>
            <p className="text-sm">Start adding jobs to see your status breakdown</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Application Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="count"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4">
          <div className="text-center mb-3">
            <p className="text-2xl font-bold">{totalJobs}</p>
            <p className="text-sm text-muted-foreground">Total Jobs</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {chartData.map((item) => (
              <div key={item.status} className="flex items-center">
                <div 
                  className="w-3 h-3 rounded mr-2 flex-shrink-0" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="truncate">{item.label}: {item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
import React from 'react';
import { ApplicationStatusChart } from './ApplicationStatusChart';
import { WeeklyApplicationTrendChart } from './WeeklyApplicationTrendChart';

interface JobHubChartsSectionProps {
  jobs: Array<{
    id: string;
    created_at: string;
    application_status?: string;
  }>;
}

export function JobHubChartsSection({ jobs }: JobHubChartsSectionProps) {
  // Calculate status breakdown data
  const statusData = [
    { 
      status: 'pending', 
      count: jobs.filter(job => job.application_status === 'pending').length,
      label: 'Pending'
    },
    { 
      status: 'applied', 
      count: jobs.filter(job => job.application_status === 'applied').length,
      label: 'Applied'
    },
    { 
      status: 'interviewing', 
      count: jobs.filter(job => job.application_status === 'interviewing').length,
      label: 'Interviewing'
    },
    { 
      status: 'rejected', 
      count: jobs.filter(job => job.application_status === 'rejected').length,
      label: 'Rejected'
    },
    { 
      status: 'offer', 
      count: jobs.filter(job => job.application_status === 'offer').length,
      label: 'Offer'
    },
    { 
      status: 'withdrawn', 
      count: jobs.filter(job => job.application_status === 'withdrawn').length,
      label: 'Withdrawn'
    }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <ApplicationStatusChart data={statusData} />
      <WeeklyApplicationTrendChart jobs={jobs} />
    </div>
  );
}
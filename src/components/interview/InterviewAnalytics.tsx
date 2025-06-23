
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Calendar, Target, Award, Brain, Wrench } from 'lucide-react';

interface InterviewSessionData {
  id: string;
  job_description_id: string;
  overall_score: number | null;
  completed_at: string | null;
  created_at: string;
  session_status: string;
  total_questions: number;
  job_descriptions: {
    title: string;
  };
}

interface InterviewAnalyticsProps {
  sessions: InterviewSessionData[];
}

export const InterviewAnalytics: React.FC<InterviewAnalyticsProps> = ({ sessions }) => {
  const completedSessions = sessions.filter(session => 
    session.session_status === 'completed' && session.overall_score !== null
  );

  const totalInterviews = completedSessions.length;
  const averageScore = totalInterviews > 0 
    ? completedSessions.reduce((sum, session) => sum + (session.overall_score || 0), 0) / totalInterviews 
    : 0;
  
  const bestScore = totalInterviews > 0 
    ? Math.max(...completedSessions.map(session => session.overall_score || 0)) 
    : 0;

  const recentSessions = completedSessions.slice(0, 5);
  const trend = recentSessions.length >= 2 
    ? recentSessions[0].overall_score! - recentSessions[recentSessions.length - 1].overall_score!
    : 0;

  const uniqueJobTitles = new Set(completedSessions.map(session => session.job_descriptions?.title)).size;

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600 bg-green-100';
    if (score >= 6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" | "outline" => {
    if (score >= 8) return 'default';
    if (score >= 6) return 'secondary';
    return 'destructive';
  };

  if (totalInterviews === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Performance Analytics
          </CardTitle>
          <CardDescription>
            Complete your first interview to see your performance analytics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No completed interviews yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Performance Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Interviews</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInterviews}</div>
            <p className="text-xs text-muted-foreground">
              {uniqueJobTitles} unique job types
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageScore.toFixed(1)}/10</div>
            <p className="text-xs text-muted-foreground">
              {trend > 0 ? '↗️' : trend < 0 ? '↘️' : '→'} 
              {Math.abs(trend).toFixed(1)} from last 5
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Score</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bestScore.toFixed(1)}/10</div>
            <p className="text-xs text-muted-foreground">
              Personal best performance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Trend</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend >= 0 ? '+' : ''}{trend.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">
              Last 5 interviews
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Performance</CardTitle>
          <CardDescription>Your last 5 completed interviews</CardDescription>
        </CardHeader>
        <CardContent>
          {recentSessions.length > 0 ? (
            <div className="space-y-3">
              {recentSessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{session.job_descriptions?.title}</h4>
                      <Badge variant={getScoreBadgeVariant(session.overall_score!)}>
                        {session.overall_score!.toFixed(1)}/10
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      {new Date(session.completed_at!).toLocaleDateString()} • {session.total_questions} questions
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No recent interviews</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

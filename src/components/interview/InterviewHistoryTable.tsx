
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronDown, ChevronUp, Eye, Calendar, Award, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { InterviewSessionDetail } from './InterviewSessionDetail';

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

interface InterviewHistoryTableProps {
  sessions: InterviewSessionData[];
}

export const InterviewHistoryTable: React.FC<InterviewHistoryTableProps> = ({ sessions }) => {
  const { user } = useAuth();
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'score'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const completedSessions = sessions.filter(session => session.session_status === 'completed');

  const sortedSessions = [...completedSessions].sort((a, b) => {
    if (sortBy === 'date') {
      const dateA = new Date(a.completed_at || a.created_at).getTime();
      const dateB = new Date(b.completed_at || b.created_at).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    } else {
      const scoreA = a.overall_score || 0;
      const scoreB = b.overall_score || 0;
      return sortOrder === 'desc' ? scoreB - scoreA : scoreA - scoreB;
    }
  });

  const toggleSort = (column: 'date' | 'score') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" | "outline" => {
    if (score >= 8) return 'default';
    if (score >= 6) return 'secondary';
    return 'destructive';
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (completedSessions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Interview History
          </CardTitle>
          <CardDescription>
            Your completed interview sessions will appear here
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No completed interviews yet</p>
            <p className="text-sm text-gray-500 mt-2">Complete your first mock interview to see detailed analytics</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Interview History
        </CardTitle>
        <CardDescription>
          Detailed view of all your completed interview sessions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job Title</TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    className="p-0 h-auto font-medium"
                    onClick={() => toggleSort('date')}
                  >
                    Date
                    {sortBy === 'date' && (
                      sortOrder === 'desc' ? <ChevronDown className="ml-1 h-4 w-4" /> : <ChevronUp className="ml-1 h-4 w-4" />
                    )}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    className="p-0 h-auto font-medium"
                    onClick={() => toggleSort('score')}
                  >
                    Score
                    {sortBy === 'score' && (
                      sortOrder === 'desc' ? <ChevronDown className="ml-1 h-4 w-4" /> : <ChevronUp className="ml-1 h-4 w-4" />
                    )}
                  </Button>
                </TableHead>
                <TableHead>Questions</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedSessions.map((session) => (
                <React.Fragment key={session.id}>
                  <TableRow>
                    <TableCell className="font-medium">
                      {session.job_descriptions?.title || 'Unknown Position'}
                    </TableCell>
                    <TableCell>
                      {new Date(session.completed_at || session.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getScoreBadgeVariant(session.overall_score!)}>
                        <Award className="w-3 h-3 mr-1" />
                        {session.overall_score!.toFixed(1)}/10
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">{session.total_questions} questions</span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setExpandedSession(
                          expandedSession === session.id ? null : session.id
                        )}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        {expandedSession === session.id ? 'Hide' : 'View'} Details
                      </Button>
                    </TableCell>
                  </TableRow>
                  {expandedSession === session.id && (
                    <TableRow>
                      <TableCell colSpan={5} className="p-0">
                        <InterviewSessionDetail sessionId={session.id} />
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

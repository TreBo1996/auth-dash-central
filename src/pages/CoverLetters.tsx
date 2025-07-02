
import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { CoverLetterGenerator } from '@/components/CoverLetterGenerator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CoverLetter {
  id: string;
  title: string;
  created_at: string;
  job_description_id: string | null;
  original_resume_id: string | null;
}

export const CoverLetters: React.FC = () => {
  const { user } = useAuth();
  const [coverLetters, setCoverLetters] = useState<CoverLetter[]>([]);
  const [showGenerator, setShowGenerator] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCoverLetters();
  }, [user]);

  const loadCoverLetters = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('cover_letters')
        .select('id, title, created_at, job_description_id, original_resume_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCoverLetters(data || []);
    } catch (error) {
      console.error('Error loading cover letters:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCoverLetterCreated = () => {
    loadCoverLetters();
    setShowGenerator(false);
  };

  if (showGenerator) {
    return (
      <DashboardLayout>
        <CoverLetterGenerator
          onComplete={handleCoverLetterCreated}
          onCancel={() => setShowGenerator(false)}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Cover Letters</h1>
            <p className="text-muted-foreground">
              Create personalized cover letters tailored to specific job opportunities
            </p>
          </div>
          <Button onClick={() => setShowGenerator(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Cover Letter
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : coverLetters.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No cover letters yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first personalized cover letter using your resume and job descriptions.
              </p>
              <Button onClick={() => setShowGenerator(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Cover Letter
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coverLetters.map((coverLetter) => (
              <Card key={coverLetter.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4" />
                    {coverLetter.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Created {new Date(coverLetter.created_at).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CoverLetters;

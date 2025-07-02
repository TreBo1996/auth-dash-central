
import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { CoverLetterGenerator } from '@/components/CoverLetterGenerator';
import { ContentPreview } from '@/components/ContentPreview';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, Plus, Building, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CoverLetterWithJob {
  id: string;
  title: string;
  created_at: string;
  job_title: string;
  company: string;
  generated_text: string;
}

export const CoverLetters: React.FC = () => {
  const { user } = useAuth();
  const [coverLetters, setCoverLetters] = useState<CoverLetterWithJob[]>([]);
  const [showGenerator, setShowGenerator] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedCoverLetter, setSelectedCoverLetter] = useState<CoverLetterWithJob | null>(null);

  useEffect(() => {
    loadCoverLetters();
  }, [user]);

  const loadCoverLetters = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('cover_letters')
        .select(`
          id, 
          title, 
          created_at,
          generated_text,
          job_descriptions!inner(
            title,
            company
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const formattedData = (data || []).map(item => ({
        id: item.id,
        title: item.title,
        created_at: item.created_at,
        generated_text: item.generated_text,
        job_title: item.job_descriptions.title,
        company: item.job_descriptions.company
      }));
      
      setCoverLetters(formattedData);
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

  const handleViewCoverLetter = (coverLetter: CoverLetterWithJob) => {
    setSelectedCoverLetter(coverLetter);
  };

  const handleClosePreview = () => {
    setSelectedCoverLetter(null);
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
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-3 bg-muted rounded w-full mb-2"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
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
              <Card key={coverLetter.id} className="hover:shadow-md transition-shadow cursor-pointer group">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold line-clamp-2">
                    <Mail className="h-4 w-4 text-primary flex-shrink-0" />
                    {coverLetter.job_title}
                  </CardTitle>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building className="h-3 w-3" />
                    {coverLetter.company}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                    <Calendar className="h-3 w-3" />
                    Created {new Date(coverLetter.created_at).toLocaleDateString()}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {coverLetter.generated_text.substring(0, 150)}...
                  </p>
                  <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => handleViewCoverLetter(coverLetter)}
                    >
                      View Cover Letter
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {selectedCoverLetter && (
          <ContentPreview
            content={selectedCoverLetter.generated_text}
            title={`${selectedCoverLetter.job_title} at ${selectedCoverLetter.company}`}
            type="cover-letter"
            onClose={handleClosePreview}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default CoverLetters;

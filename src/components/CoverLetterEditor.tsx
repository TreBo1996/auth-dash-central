import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, FileText, Building, Calendar, Loader2, Download } from 'lucide-react';
import { generateCoverLetterPreviewPDF } from '@/utils/coverLetterHtml2Pdf';

interface CoverLetterData {
  id: string;
  title: string;
  generated_text: string;
  created_at: string;
  updated_at: string;
  job_descriptions?: {
    title: string;
    company: string;
  };
}

export const CoverLetterEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [coverLetter, setCoverLetter] = useState<CoverLetterData | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    if (id && user) {
      loadCoverLetter();
    }
  }, [id, user]);

  useEffect(() => {
    if (coverLetter) {
      setHasChanges(editedContent !== coverLetter.generated_text);
    }
  }, [editedContent, coverLetter]);

  const loadCoverLetter = async () => {
    if (!id || !user) return;

    try {
      const { data, error } = await supabase
        .from('cover_letters')
        .select(`
          id,
          title,
          generated_text,
          created_at,
          updated_at,
          job_descriptions!job_description_id(
            title,
            company
          )
        `)
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error loading cover letter:', error);
        toast({
          title: "Error",
          description: "Failed to load cover letter. Please try again.",
          variant: "destructive"
        });
        navigate('/cover-letters');
        return;
      }

      setCoverLetter(data);
      setEditedContent(data.generated_text);
    } catch (error) {
      console.error('Error loading cover letter:', error);
      toast({
        title: "Error",
        description: "Failed to load cover letter. Please try again.",
        variant: "destructive"
      });
      navigate('/cover-letters');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!coverLetter || !user || !hasChanges) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('cover_letters')
        .update({
          generated_text: editedContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', coverLetter.id)
        .eq('user_id', user.id);

      if (error) throw error;

      setCoverLetter(prev => prev ? {
        ...prev,
        generated_text: editedContent,
        updated_at: new Date().toISOString()
      } : null);

      setHasChanges(false);
      
      toast({
        title: "Saved Successfully",
        description: "Your cover letter has been updated."
      });
    } catch (error) {
      console.error('Error saving cover letter:', error);
      toast({
        title: "Error",
        description: "Failed to save changes. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (hasChanges) {
      const confirmLeave = window.confirm(
        "You have unsaved changes. Are you sure you want to leave without saving?"
      );
      if (!confirmLeave) return;
    }
    navigate('/cover-letters');
  };

  const handleDownloadPdf = async () => {
    if (!coverLetter) return;

    setDownloadingPdf(true);
    try {
      const safe = (s: string) => s ? s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') : '';
      const companySafe = safe(coverLetter.job_descriptions?.company || 'application');
      const filename = `cover-letter-${companySafe}.pdf`;
      
      await generateCoverLetterPreviewPDF(editedContent, filename);
      
      toast({
        title: "PDF Downloaded",
        description: "Your cover letter has been downloaded as a PDF."
      });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive"
      });
    } finally {
      setDownloadingPdf(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!coverLetter) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Cover Letter Not Found</h3>
              <p className="text-muted-foreground mb-6">
                The cover letter you're looking for doesn't exist or you don't have permission to edit it.
              </p>
              <Button onClick={() => navigate('/cover-letters')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Cover Letters
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const characterCount = editedContent.length;
  const wordCount = editedContent.trim().split(/\s+/).filter(word => word.length > 0).length;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleBack}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Edit Cover Letter</h1>
              <p className="text-muted-foreground">
                Make changes to your cover letter content
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="flex items-center gap-2"
            >
              {downloadingPdf ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {downloadingPdf ? 'Generating...' : 'Download PDF'}
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        {/* Job Information Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  {coverLetter.job_descriptions?.title || 'Unknown Position'}
                </CardTitle>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Building className="h-4 w-4" />
                    {coverLetter.job_descriptions?.company || 'Unknown Company'}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Created {formatDate(coverLetter.created_at)}
                  </div>
                </div>
              </div>
              <Badge variant="secondary" className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                AI Generated
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Editor Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Cover Letter Content</CardTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{wordCount} words</span>
                <span>{characterCount} characters</span>
                {hasChanges && (
                  <Badge variant="outline" className="text-orange-600 border-orange-200">
                    Unsaved Changes
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                placeholder="Enter your cover letter content here..."
                className="min-h-[500px] text-sm leading-relaxed"
                style={{ resize: 'vertical' }}
              />
              
              {/* Tips */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2 text-sm">Editing Tips:</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Keep it concise - aim for 3-4 paragraphs maximum</li>
                  <li>• Personalize the greeting with the hiring manager's name when possible</li>
                  <li>• Include specific achievements and metrics from your experience</li>
                  <li>• Research the company culture and incorporate relevant values</li>
                  <li>• End with a strong call to action</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save reminder for mobile */}
        {hasChanges && (
          <div className="fixed bottom-4 left-4 right-4 md:hidden">
            <Card className="shadow-lg border-orange-200 bg-orange-50">
              <CardContent className="p-4 flex items-center justify-between">
                <span className="text-sm text-orange-800">You have unsaved changes</span>
                <Button 
                  size="sm"
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Save'
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CoverLetterEditor;

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Calendar, Eye, Trash2, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ContentPreview } from './ContentPreview';

interface Resume {
  id: string;
  original_file_url: string | null;
  parsed_text: string | null;
  file_name: string | null;
  file_size: number | null;
  created_at: string;
}

interface JobDescription {
  id: string;
  title: string;
  source_file_url: string | null;
  parsed_text: string;
  file_name: string | null;
  file_size: number | null;
  created_at: string;
}

export const UploadedFiles: React.FC = () => {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [jobDescriptions, setJobDescriptions] = useState<JobDescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewContent, setPreviewContent] = useState<{
    content: string;
    title: string;
    type: 'resume' | 'job-description';
  } | null>(null);
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [resumesResponse, jobDescriptionsResponse] = await Promise.all([
        supabase
          .from('resumes')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('job_descriptions')
          .select('*')
          .order('created_at', { ascending: false })
      ]);

      if (resumesResponse.error) throw resumesResponse.error;
      if (jobDescriptionsResponse.error) throw jobDescriptionsResponse.error;

      setResumes(resumesResponse.data || []);
      setJobDescriptions(jobDescriptionsResponse.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load your uploaded files.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: string, type: 'resume' | 'job-description') => {
    try {
      const table = type === 'resume' ? 'resumes' : 'job_descriptions';
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

      if (error) throw error;

      if (type === 'resume') {
        setResumes(prev => prev.filter(item => item.id !== id));
      } else {
        setJobDescriptions(prev => prev.filter(item => item.id !== id));
      }

      toast({
        title: "Deleted",
        description: `${type === 'resume' ? 'Resume' : 'Job description'} deleted successfully.`,
      });
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Error",
        description: "Failed to delete the file.",
        variant: "destructive"
      });
    }
  };

  const handlePreview = (content: string, title: string, type: 'resume' | 'job-description') => {
    setPreviewContent({ content, title, type });
  };

  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return 'Unknown size';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Your Uploaded Files</h2>
        <p className="text-muted-foreground">Manage your resumes and job descriptions</p>
      </div>

      <Tabs defaultValue="resumes" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
          <TabsTrigger value="resumes">
            Resumes ({resumes.length})
          </TabsTrigger>
          <TabsTrigger value="job-descriptions">
            Job Descriptions ({jobDescriptions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="resumes" className="mt-6">
          {resumes.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No resumes uploaded yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {resumes.map((resume) => (
                <Card key={resume.id}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {resume.file_name || 'Untitled Resume'}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      {formatDate(resume.created_at)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Badge variant="secondary">
                        {resume.file_size ? formatFileSize(resume.file_size) : 'Text only'}
                      </Badge>
                      <Badge variant={resume.original_file_url ? 'default' : 'outline'}>
                        {resume.original_file_url ? 'File' : 'Text'}
                      </Badge>
                    </div>
                    
                    <div className="flex gap-2">
                      {resume.parsed_text && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePreview(
                            resume.parsed_text!,
                            resume.file_name || 'Resume',
                            'resume'
                          )}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Preview
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(resume.id, 'resume')}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="job-descriptions" className="mt-6">
          {jobDescriptions.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No job descriptions uploaded yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {jobDescriptions.map((jobDesc) => (
                <Card key={jobDesc.id}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {jobDesc.title}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      {formatDate(jobDesc.created_at)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Badge variant="secondary">
                        {jobDesc.file_size ? formatFileSize(jobDesc.file_size) : 'Text only'}
                      </Badge>
                      <Badge variant={jobDesc.source_file_url ? 'default' : 'outline'}>
                        {jobDesc.source_file_url ? 'File' : 'Text'}
                      </Badge>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePreview(
                          jobDesc.parsed_text,
                          jobDesc.title,
                          'job-description'
                        )}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Preview
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(jobDesc.id, 'job-description')}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {previewContent && (
        <ContentPreview
          content={previewContent.content}
          title={previewContent.title}
          type={previewContent.type}
          onClose={() => setPreviewContent(null)}
        />
      )}
    </div>
  );
};

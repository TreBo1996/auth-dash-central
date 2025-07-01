
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, ArrowLeft, Printer } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { TemplateSelector } from '@/components/resume-templates/TemplateSelector';
import { ResumePreview } from '@/components/resume-templates/ResumePreview';
import { templateConfigs } from '@/components/resume-templates/templateConfigs';

interface OptimizedResume {
  id: string;
  generated_text: string;
  resumes?: {
    file_name: string | null;
  };
  job_descriptions?: {
    title: string;
  };
}

const ResumeTemplates: React.FC = () => {
  const { resumeId } = useParams<{ resumeId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [optimizedResume, setOptimizedResume] = useState<OptimizedResume | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState('sidebar');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('ResumeTemplates: Component mounted with resumeId:', resumeId);
    
    if (!resumeId) {
      console.error('ResumeTemplates: No resumeId provided in URL params');
      setError('No resume ID provided');
      setLoading(false);
      return;
    }

    fetchOptimizedResume();
  }, [resumeId]);

  const fetchOptimizedResume = async () => {
    if (!resumeId) {
      console.error('ResumeTemplates: Cannot fetch - resumeId is undefined');
      setError('Resume ID is required');
      setLoading(false);
      return;
    }

    console.log('ResumeTemplates: Starting fetch for resumeId:', resumeId);
    setLoading(true);
    setError(null);

    try {
      // Add timeout for the query
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out')), 10000);
      });

      const fetchPromise = supabase
        .from('optimized_resumes')
        .select(`
          *,
          resumes(file_name),
          job_descriptions(title)
        `)
        .eq('id', resumeId)
        .single();

      console.log('ResumeTemplates: Executing database query...');
      const { data, error: fetchError } = await Promise.race([fetchPromise, timeoutPromise]) as any;

      if (fetchError) {
        console.error('ResumeTemplates: Database error:', fetchError);
        throw new Error(`Failed to load resume: ${fetchError.message}`);
      }

      if (!data) {
        console.error('ResumeTemplates: No data returned for resumeId:', resumeId);
        throw new Error('Resume not found');
      }

      console.log('ResumeTemplates: Successfully fetched resume data:', {
        id: data.id,
        hasGeneratedText: !!data.generated_text,
        textLength: data.generated_text?.length || 0,
        fileName: data.resumes?.file_name,
        jobTitle: data.job_descriptions?.title
      });

      setOptimizedResume(data);
    } catch (error) {
      console.error('ResumeTemplates: Error in fetchOptimizedResume:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load resume data';
      setError(errorMessage);
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    console.log('ResumeTemplates: Print initiated');
    window.print();
  };

  const handleDownloadPDF = () => {
    const fileName = `${optimizedResume?.resumes?.file_name || 'resume'}-${templateConfigs[selectedTemplate].name.toLowerCase().replace(' ', '-')}.pdf`;
    console.log('ResumeTemplates: PDF download initiated:', fileName);
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const resumeContent = document.getElementById('resume-preview')?.innerHTML;
      if (!resumeContent) {
        console.error('ResumeTemplates: No resume content found for PDF generation');
        toast({
          title: "Error",
          description: "Unable to generate PDF - resume content not found",
          variant: "destructive"
        });
        return;
      }

      printWindow.document.write(`
        <html>
          <head>
            <title>${fileName}</title>
            <style>
              body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
              @media print { 
                body { margin: 0; padding: 0; }
                @page { size: A4; margin: 0.5in; }
              }
            </style>
          </head>
          <body>
            ${resumeContent}
          </body>
        </html>
      `);
      printWindow.document.close();
      
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    } else {
      console.error('ResumeTemplates: Unable to open print window');
      toast({
        title: "Error",
        description: "Unable to open print window",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    console.log('ResumeTemplates: Rendering loading state');
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !optimizedResume) {
    console.log('ResumeTemplates: Rendering error state:', { error, hasResume: !!optimizedResume });
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-red-600 mb-2">Error: {error || 'Resume not found'}</p>
          <p className="text-gray-500 mb-4">
            {error ? 'Please try again or contact support if the issue persists.' : 'The requested resume could not be found.'}
          </p>
          <Button onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  console.log('ResumeTemplates: Rendering main component with resume:', optimizedResume.id);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Choose Resume Template</h1>
              <p className="text-gray-600">
                {optimizedResume.resumes?.file_name || 'Resume'} → {optimizedResume.job_descriptions?.title || 'Job Position'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button onClick={handleDownloadPDF}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-6 min-h-[800px]">
          {/* Resume Preview - Center (takes 3 columns) */}
          <div className="lg:col-span-3 flex justify-center">
            <div className="w-full max-w-4xl">
              <div className="flex items-center justify-center mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg">{templateConfigs[selectedTemplate].name}</h3>
                  <Badge variant="outline">{templateConfigs[selectedTemplate].category}</Badge>
                </div>
              </div>
              <Card className="shadow-lg">
                <CardContent className="p-4">
                  <div className="bg-white border rounded-lg shadow-sm">
                    <ResumePreview
                      template={selectedTemplate}
                      resumeData={optimizedResume.generated_text}
                      optimizedResumeId={resumeId}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Template Selector - Right Side (takes 2 columns) */}
          <div className="lg:col-span-2">
            <Card className="h-fit sticky top-6">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-4 text-center">Resume Templates</h3>
                <TemplateSelector
                  selectedTemplate={selectedTemplate}
                  onTemplateSelect={setSelectedTemplate}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ResumeTemplates;

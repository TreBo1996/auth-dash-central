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
import { newTemplateConfigs } from '@/components/resume-templates/configs/newTemplateConfigs';
import { generateNewProfessionalPDF } from '@/utils/newPdfGenerators/NewPdfGeneratorFactory';
import { fetchStructuredResumeData } from '@/components/resume-templates/utils/fetchStructuredResumeData';
import { parseResumeContent } from '@/components/resume-templates/utils/parseResumeContent';
import { printResume } from '@/utils/pdfGenerator';

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
  const [selectedTemplate, setSelectedTemplate] = useState('modern-ats');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

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
    
    if (!optimizedResume) {
      toast({
        title: "Error",
        description: "No resume data available for printing",
        variant: "destructive"
      });
      return;
    }

    try {
      printResume(selectedTemplate, optimizedResume.generated_text);
    } catch (error) {
      console.error('ResumeTemplates: Print error:', error);
      toast({
        title: "Error",
        description: "Unable to print resume",
        variant: "destructive"
      });
    }
  };

  const handleDownloadPDF = async () => {
    console.log('ResumeTemplates: PDF download initiated');
    
    if (!optimizedResume) {
      toast({
        title: "Error",
        description: "No resume data available for download",
        variant: "destructive"
      });
      return;
    }

    if (isGeneratingPDF) {
      return;
    }

    const fileName = `${optimizedResume?.resumes?.file_name || 'resume'}-${newTemplateConfigs[selectedTemplate].name.toLowerCase().replace(/\s+/g, '-')}.pdf`;
    
    setIsGeneratingPDF(true);
    
    try {
      // Get structured resume data
      let resumeData;
      try {
        resumeData = await fetchStructuredResumeData(resumeId!);
      } catch (error) {
        console.log('Fallback to text parsing');
        resumeData = parseResumeContent(optimizedResume.generated_text);
      }
      
      await generateNewProfessionalPDF(selectedTemplate, resumeData, fileName);
      
      toast({
        title: "Success",
        description: "PDF downloaded successfully",
      });
    } catch (error) {
      console.error('ResumeTemplates: PDF generation error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unable to generate PDF",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingPDF(false);
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
            <Button onClick={handleDownloadPDF} disabled={isGeneratingPDF}>
              <Download className="h-4 w-4 mr-2" />
              {isGeneratingPDF ? 'Generating PDF...' : 'Download PDF'}
            </Button>
          </div>
        </div>

        {/* Mobile Template Selector - Shows on small screens */}
        <div className="block lg:hidden mb-6">
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-4 text-center">Choose Template</h3>
              <TemplateSelector
                selectedTemplate={selectedTemplate}
                onTemplateSelect={setSelectedTemplate}
                isMobile={true}
              />
            </CardContent>
          </Card>
        </div>

        {/* Desktop/Tablet Layout */}
        <div className="grid lg:grid-cols-4 md:grid-cols-3 gap-6 min-h-[800px]">
          {/* Resume Preview */}
          <div className="lg:col-span-3 md:col-span-2 flex justify-center">
            <div className="w-full max-w-4xl">
              <div className="flex items-center justify-center mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg">{newTemplateConfigs[selectedTemplate].name}</h3>
                  <Badge variant="outline">{newTemplateConfigs[selectedTemplate].category}</Badge>
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

          {/* Desktop Template Selector - Hidden on mobile */}
          <div className="hidden lg:block lg:col-span-1 md:block md:col-span-1">
            <Card className="h-fit sticky top-24">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-4 text-center">Templates</h3>
                <TemplateSelector
                  selectedTemplate={selectedTemplate}
                  onTemplateSelect={setSelectedTemplate}
                  isMobile={false}
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

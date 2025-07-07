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
import { ColorSchemeSelector } from '@/components/resume-templates/ColorSchemeSelector';
import { newTemplateConfigs } from '@/components/resume-templates/configs/newTemplateConfigs';
import { generateNewProfessionalPDF } from '@/utils/newPdfGenerators/NewPdfGeneratorFactory';
import { fetchStructuredResumeData } from '@/components/resume-templates/utils/fetchStructuredResumeData';
import { parseResumeContent } from '@/components/resume-templates/utils/parseResumeContent';
import { printResume } from '@/utils/pdfGenerator';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { PaymentModal } from '@/components/subscription/PaymentModal';
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
  const {
    resumeId
  } = useParams<{
    resumeId: string;
  }>();
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const [optimizedResume, setOptimizedResume] = useState<OptimizedResume | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState('modern-ats');
  const [selectedColorScheme, setSelectedColorScheme] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const isMobile = useIsMobile();
  const { subscriptionData } = useSubscription();
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
      const fetchPromise = supabase.from('optimized_resumes').select(`
          *,
          resumes(file_name),
          job_descriptions(title)
        `).eq('id', resumeId).single();
      console.log('ResumeTemplates: Executing database query...');
      const {
        data,
        error: fetchError
      } = (await Promise.race([fetchPromise, timeoutPromise])) as any;
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

      // Set default color scheme for template
      const templateConfig = newTemplateConfigs[selectedTemplate];
      if (templateConfig && !selectedColorScheme) {
        setSelectedColorScheme(templateConfig.defaultColorScheme);
      }
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

    // Check if template requires premium and user doesn't have it
    const templateConfig = newTemplateConfigs[selectedTemplate];
    const isPremiumRequired = templateConfig?.premiumRequired;
    const hasPremium = subscriptionData?.subscribed;

    if (isPremiumRequired && !hasPremium) {
      setShowPaymentModal(true);
      return;
    }

    const fileName = `${optimizedResume?.resumes?.file_name || 'resume'}-${newTemplateConfigs[selectedTemplate].name.toLowerCase().replace(/\s+/g, '-')}.pdf`;
    setIsGeneratingPDF(true);
    try {
      // Get structured resume data
      let resumeData;
      try {
        resumeData = await fetchStructuredResumeData(resumeId!, { limitSkills: true });
      } catch (error) {
        console.log('Fallback to text parsing');
        resumeData = parseResumeContent(optimizedResume.generated_text);
      }
      await generateNewProfessionalPDF(selectedTemplate, resumeData, fileName, selectedColorScheme);
      toast({
        title: "Success",
        description: "PDF downloaded successfully"
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
    return <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>;
  }
  if (error || !optimizedResume) {
    console.log('ResumeTemplates: Rendering error state:', {
      error,
      hasResume: !!optimizedResume
    });
    return <DashboardLayout>
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
      </DashboardLayout>;
  }
  console.log('ResumeTemplates: Rendering main component with resume:', optimizedResume.id);
  return <DashboardLayout>
      <div className={`space-y-6 ${isMobile ? 'pb-20' : ''}`}>
        {/* Header */}
        <div className={`${isMobile ? 'space-y-4' : 'flex items-center justify-between'}`}>
          <div className={`${isMobile ? 'space-y-3' : 'flex items-center gap-4'}`}>
            <Button variant="outline" onClick={() => navigate('/dashboard')} className={isMobile ? 'w-full sm:w-auto' : ''}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className={isMobile ? 'text-center sm:text-left' : ''}>
              <h1 className={`font-bold text-gray-900 ${isMobile ? 'text-lg' : 'text-2xl'}`}>
                Choose Resume Template
              </h1>
              <p className={`text-gray-600 ${isMobile ? 'text-sm break-words' : ''}`}>
                <span className="font-medium">
                  {optimizedResume.resumes?.file_name || 'Resume'}
                </span>
                {' → '}
                <span className="font-medium">
                  {optimizedResume.job_descriptions?.title || 'Job Position'}
                </span>
              </p>
            </div>
          </div>
          {/* Desktop buttons only */}
          {!isMobile && <div className="flex gap-2">
              
              <Button onClick={handleDownloadPDF} disabled={isGeneratingPDF} className="bg-blue-800 hover:bg-blue-700">
                <Download className="h-4 w-4 mr-2" />
                {isGeneratingPDF 
                  ? 'Generating PDF...' 
                  : newTemplateConfigs[selectedTemplate]?.premiumRequired && !subscriptionData?.subscribed
                    ? 'Upgrade to Download'
                    : 'Download PDF'
                }
              </Button>
            </div>}
        </div>

        {/* Mobile Template Selector - Shows on small screens */}
        <div className="block lg:hidden mb-6 space-y-4">
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-4 text-center">Choose Template</h3>
              <TemplateSelector selectedTemplate={selectedTemplate} onTemplateSelect={templateId => {
              setSelectedTemplate(templateId);
              const config = newTemplateConfigs[templateId];
              setSelectedColorScheme(config.defaultColorScheme);
            }} isMobile={true} />
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <ColorSchemeSelector colorSchemes={newTemplateConfigs[selectedTemplate].colorSchemes} selectedScheme={selectedColorScheme} onSchemeSelect={setSelectedColorScheme} />
            </CardContent>
          </Card>
        </div>

        {/* Desktop/Tablet Layout */}
        <div className="grid lg:grid-cols-4 md:grid-cols-3 gap-6 min-h-[800px]">
          {/* Resume Preview */}
          <div className="lg:col-span-3 md:col-span-2 flex justify-center">
            <div className={`w-full ${isMobile ? '' : 'max-w-4xl'}`}>
              <div className="flex items-center justify-center mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg">{newTemplateConfigs[selectedTemplate].name}</h3>
                  <Badge variant="outline">{newTemplateConfigs[selectedTemplate].category}</Badge>
                </div>
              </div>
              <Card className="shadow-lg">
                <CardContent className={`${isMobile ? 'p-2' : 'p-4'}`}>
                <div className="bg-white border rounded-lg shadow-sm">
                  <ResumePreview template={selectedTemplate} resumeData={optimizedResume.generated_text} optimizedResumeId={resumeId} selectedColorScheme={selectedColorScheme} />
                </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Desktop Template Selector - Hidden on mobile */}
          <div className="hidden lg:block lg:col-span-1 md:block md:col-span-1">
            <div className="space-y-4 sticky top-24">
              <Card className="h-fit">
                <CardContent className="p-4 px-[4px]">
                  <h3 className="font-semibold mb-4 text-center">Templates</h3>
                  <TemplateSelector selectedTemplate={selectedTemplate} onTemplateSelect={templateId => {
                  setSelectedTemplate(templateId);
                  const config = newTemplateConfigs[templateId];
                  setSelectedColorScheme(config.defaultColorScheme);
                }} isMobile={false} />
                </CardContent>
              </Card>
              
              <Card className="h-fit">
                <CardContent className="p-4">
                  <ColorSchemeSelector colorSchemes={newTemplateConfigs[selectedTemplate].colorSchemes} selectedScheme={selectedColorScheme} onSchemeSelect={setSelectedColorScheme} />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        
        {/* Mobile Floating Action Button */}
        {isMobile && <div className="fixed bottom-6 right-6 z-50">
            <Button onClick={handleDownloadPDF} disabled={isGeneratingPDF} className="bg-blue-800 hover:bg-blue-700 shadow-lg rounded-full h-14 w-14 p-0" size="lg">
              <Download className="h-6 w-6" />
            </Button>
          </div>}

        {/* Payment Modal */}
        <PaymentModal 
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          returnUrl={window.location.href}
        />
      </div>
    </DashboardLayout>;
};
export default ResumeTemplates;
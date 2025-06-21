
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
  const { optimizedResumeId } = useParams<{ optimizedResumeId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [optimizedResume, setOptimizedResume] = useState<OptimizedResume | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState('modern');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (optimizedResumeId) {
      fetchOptimizedResume();
    }
  }, [optimizedResumeId]);

  const fetchOptimizedResume = async () => {
    try {
      const { data, error } = await supabase
        .from('optimized_resumes')
        .select(`
          *,
          resumes(file_name),
          job_descriptions(title)
        `)
        .eq('id', optimizedResumeId)
        .single();

      if (error) throw error;
      setOptimizedResume(data);
    } catch (error) {
      console.error('Error fetching optimized resume:', error);
      toast({
        title: "Error",
        description: "Failed to load resume data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    const fileName = `${optimizedResume?.resumes?.file_name || 'resume'}-${templateConfigs[selectedTemplate].name.toLowerCase().replace(' ', '-')}.pdf`;
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const resumeContent = document.getElementById('resume-preview')?.innerHTML;
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
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!optimizedResume) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Resume not found</p>
          <Button onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </DashboardLayout>
    );
  }

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
                {optimizedResume.resumes?.file_name} → {optimizedResume.job_descriptions?.title}
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

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Template Selector */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Templates</h3>
                <TemplateSelector
                  selectedTemplate={selectedTemplate}
                  onTemplateSelect={setSelectedTemplate}
                />
              </CardContent>
            </Card>
          </div>

          {/* Resume Preview */}
          <div className="lg:col-span-3">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{templateConfigs[selectedTemplate].name}</h3>
                    <Badge variant="outline">{templateConfigs[selectedTemplate].category}</Badge>
                  </div>
                </div>
                <div className="bg-white border rounded-lg shadow-sm">
                  <ResumePreview
                    template={selectedTemplate}
                    resumeData={optimizedResume.generated_text}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ResumeTemplates;

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  Download, 
  Edit, 
  Loader2,
  AlertCircle,
  Palette,
  Layout,
  ExternalLink
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { TemplateSelector } from '@/components/resume-templates/TemplateSelector';
import { ColorSchemeSelector } from '@/components/resume-templates/ColorSchemeSelector';
import { ResumePreview } from '@/components/resume-templates/ResumePreview';

import { newTemplateConfigs } from '@/components/resume-templates/configs/newTemplateConfigs';
import { useIsMobile } from '@/hooks/use-mobile';

interface ResumeTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  optimizedResumeId: string;
  onEdit?: () => void;
}

export const ResumeTemplateModal: React.FC<ResumeTemplateModalProps> = ({
  isOpen,
  onClose,
  optimizedResumeId,
  onEdit
}) => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  // Template and color scheme state
  const [selectedTemplate, setSelectedTemplate] = useState('modern-ats');
  const [selectedColorScheme, setSelectedColorScheme] = useState('professional');
  
  // Loading and export states
  const [loading, setLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string>('');
  
  // Resume data
  const [resumeData, setResumeData] = useState<any>(null);

  useEffect(() => {
    if (isOpen && optimizedResumeId) {
      loadResumeData();
      loadUserTemplatePreference();
    }
  }, [isOpen, optimizedResumeId]);

  const loadResumeData = async () => {
    try {
      setLoading(true);
      setError('');

      const { data, error: fetchError } = await supabase
        .from('optimized_resumes')
        .select('generated_text, ats_score')
        .eq('id', optimizedResumeId)
        .single();

      if (fetchError) throw fetchError;
      
      setResumeData(data);
    } catch (error) {
      console.error('Error loading resume data:', error);
      setError('Failed to load resume data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadUserTemplatePreference = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data } = await supabase
        .from('user_template_preferences')
        .select('selected_template_id')
        .eq('user_id', userData.user.id)
        .maybeSingle();

      if (data?.selected_template_id) {
        setSelectedTemplate(data.selected_template_id);
      }
    } catch (error) {
      console.warn('Could not load user template preference:', error);
    }
  };

  const saveUserTemplatePreference = async (templateId: string) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      await supabase
        .from('user_template_preferences')
        .upsert({
          user_id: userData.user.id,
          selected_template_id: templateId
        }, {
          onConflict: 'user_id'
        });
    } catch (error) {
      console.warn('Could not save template preference:', error);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    saveUserTemplatePreference(templateId);
  };

  const handleColorSchemeSelect = (schemeId: string) => {
    setSelectedColorScheme(schemeId);
  };

  const handleExportPDF = async () => {
    if (!resumeData?.generated_text) {
      toast({
        title: "Export Failed",
        description: "No resume data available for export.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsExporting(true);
      
      // Generate PDF using the preview element
      const element = document.getElementById('resume-preview');
      if (!element) {
        throw new Error('Resume preview not found');
      }

      const html2pdf = (await import('html2pdf.js')).default;
      
      const options = {
        margin: [0.5, 0.5, 0.5, 0.5],
        filename: `resume-${selectedTemplate}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          letterRendering: true,
          allowTaint: false,
          backgroundColor: '#ffffff'
        },
        jsPDF: { 
          unit: 'in', 
          format: 'letter', 
          orientation: 'portrait'
        }
      };

      await html2pdf().set(options).from(element).save();
      
      toast({
        title: "Export Successful",
        description: "Your resume has been downloaded as a PDF."
      });
    } catch (error) {
      console.error('PDF export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export PDF. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit();
    } else {
      window.location.href = `/resume-editor/${optimizedResumeId}`;
    }
    onClose();
  };

  const templateConfig = newTemplateConfigs[selectedTemplate];
  const availableColorSchemes = templateConfig?.colorSchemes || [];

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layout className="h-5 w-5" />
            Resume Template Preview
          </DialogTitle>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-4'} gap-6 h-[75vh]`}>
          {/* Template Selection Panel */}
          <div className={`${isMobile ? 'order-2' : 'order-1'} space-y-4 overflow-y-auto`}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Layout className="h-4 w-4" />
                  Templates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TemplateSelector
                  selectedTemplate={selectedTemplate}
                  onTemplateSelect={handleTemplateSelect}
                  isMobile={isMobile}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Colors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ColorSchemeSelector
                  colorSchemes={availableColorSchemes}
                  selectedScheme={selectedColorScheme}
                  onSchemeSelect={handleColorSchemeSelect}
                />
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-2">
              <Button
                onClick={handleExportPDF}
                disabled={isExporting || !resumeData}
                className="w-full"
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                {isExporting ? 'Exporting...' : 'Download PDF'}
              </Button>
              
              <Button
                variant="outline"
                onClick={handleEdit}
                className="w-full"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Resume
              </Button>

              {resumeData?.ats_score && (
                <div className="text-center p-2 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">ATS Score</div>
                  <div className="text-lg font-semibold text-primary">
                    {resumeData.ats_score}%
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Resume Preview Panel */}
          <div className={`${isMobile ? 'order-1 col-span-1' : 'order-2 col-span-3'} border rounded-lg overflow-hidden bg-white`}>
          {resumeData ? (
              <div className="h-full overflow-y-auto">
                <ResumePreview
                  template={selectedTemplate}
                  resumeData={resumeData.generated_text || ''}
                  optimizedResumeId={optimizedResumeId}
                  selectedColorScheme={selectedColorScheme}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">No resume data available</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
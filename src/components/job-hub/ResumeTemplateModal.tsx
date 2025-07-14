import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Download, Edit, Loader2, AlertCircle, Palette, Layout, ZoomIn, ZoomOut, Maximize, Minimize, RotateCcw, Target } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { TemplateSelector } from '@/components/resume-templates/TemplateSelector';
import { ColorSchemeSelector } from '@/components/resume-templates/ColorSchemeSelector';
import { ResumePreview } from '@/components/resume-templates/ResumePreview';
import { generateNewProfessionalPDF } from '@/utils/newPdfGenerators/NewPdfGeneratorFactory';
import { fetchStructuredResumeData, StructuredResumeData } from '@/components/resume-templates/utils/fetchStructuredResumeData';
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
  const {
    toast
  } = useToast();
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
  const [editableResumeData, setEditableResumeData] = useState<StructuredResumeData | null>(null);

  // Enhanced UI state
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
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

      // First try to fetch structured resume data
      try {
        const structuredData = await fetchStructuredResumeData(optimizedResumeId);
        setEditableResumeData(structuredData);
      } catch (structuredError) {
        console.warn('Could not load structured data, falling back to text:', structuredError);
      }

      // Also fetch basic resume data for ATS score and fallback text
      const {
        data,
        error: fetchError
      } = await supabase.from('optimized_resumes').select('generated_text, ats_score').eq('id', optimizedResumeId).single();
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
      const {
        data: userData
      } = await supabase.auth.getUser();
      if (!userData.user) return;
      const {
        data
      } = await supabase.from('user_template_preferences').select('selected_template_id').eq('user_id', userData.user.id).maybeSingle();
      if (data?.selected_template_id) {
        setSelectedTemplate(data.selected_template_id);
      }
    } catch (error) {
      console.warn('Could not load user template preference:', error);
    }
  };
  const saveUserTemplatePreference = async (templateId: string) => {
    try {
      const {
        data: userData
      } = await supabase.auth.getUser();
      if (!userData.user) return;
      await supabase.from('user_template_preferences').upsert({
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
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.1, 1.5));
  };
  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.1, 0.6));
  };
  const handleResetZoom = () => {
    setZoomLevel(1);
  };
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };
  const handleExportPDF = async () => {
    if (!editableResumeData && !resumeData?.generated_text) {
      toast({
        title: "Export Failed",
        description: "No resume data available for export.",
        variant: "destructive"
      });
      return;
    }
    try {
      setIsExporting(true);

      // Use the working PDF generator with structured data
      if (editableResumeData) {
        const fileName = `resume-${selectedTemplate}-${new Date().toISOString().split('T')[0]}.pdf`;
        await generateNewProfessionalPDF(selectedTemplate, editableResumeData, fileName, selectedColorScheme);
        toast({
          title: "Export Successful",
          description: "Your resume has been downloaded as a PDF."
        });
      } else {
        throw new Error('No structured data available for PDF generation');
      }
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
    return <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>;
  }
  return <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${isFullscreen ? 'max-w-[98vw] max-h-[98vh]' : 'max-w-7xl max-h-[95vh]'} overflow-hidden transition-all duration-300`}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Layout className="h-5 w-5" />
              Resume Template Preview
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {Math.round(zoomLevel * 100)}%
              </Badge>
              <Button variant="ghost" size="sm" onClick={toggleFullscreen} className="h-8 w-8 p-0">
                {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </DialogHeader>

        {error && <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>}

        <div className={`grid ${isMobile || isFullscreen ? 'grid-cols-1' : 'grid-cols-4'} gap-6 ${isFullscreen ? 'h-[90vh]' : 'h-[80vh]'}`}>
          {/* Control Panel */}
          <div className={`${isMobile ? 'order-2' : isFullscreen ? 'hidden' : 'order-1'} space-y-4 overflow-y-auto ${isFullscreen ? 'w-0' : ''}`}>
            
            {/* ATS Score */}
            {resumeData?.ats_score && <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Target className="h-4 w-4 text-primary" />
                      <div className="text-sm font-medium">ATS Score</div>
                    </div>
                    <div className="text-2xl font-bold text-primary">
                      {resumeData.ats_score}%
                    </div>
                  </div>
                </CardContent>
              </Card>}

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button onClick={handleExportPDF} disabled={isExporting || !resumeData} className="w-full" size="lg">
                {isExporting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
                {isExporting ? 'Exporting...' : 'Download PDF'}
              </Button>
              
              <Button variant="outline" onClick={handleEdit} className="w-full" size="lg">
                <Edit className="h-4 w-4 mr-2" />
                Edit Resume
              </Button>
            </div>

            {/* Template Selection */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Layout className="h-4 w-4" />
                  Templates
                </CardTitle>
              </CardHeader>
              <CardContent className="px-[5px]">
                <TemplateSelector selectedTemplate={selectedTemplate} onTemplateSelect={handleTemplateSelect} isMobile={isMobile} />
              </CardContent>
            </Card>

            {/* Color Selection */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Colors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ColorSchemeSelector colorSchemes={availableColorSchemes} selectedScheme={selectedColorScheme} onSchemeSelect={handleColorSchemeSelect} />
              </CardContent>
            </Card>

          </div>

          {/* Resume Preview Panel */}
          <div className={`${isMobile ? 'order-1 col-span-1' : isFullscreen ? 'col-span-1' : 'order-2 col-span-3'} border rounded-lg overflow-hidden bg-white relative`}>
            {/* Enhanced Preview Controls */}
            <div className="zoom-controls absolute top-2 right-2 z-10 flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-lg p-1 shadow-sm">
              <Button variant="ghost" size="sm" onClick={handleZoomOut} disabled={zoomLevel <= 0.6} className="h-7 w-7 p-0">
                <ZoomOut className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleResetZoom} className="h-7 px-2 text-xs">
                <RotateCcw className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleZoomIn} disabled={zoomLevel >= 1.5} className="h-7 w-7 p-0">
                <ZoomIn className="h-3 w-3" />
              </Button>
            </div>

            {resumeData ? <div className="h-full overflow-auto" style={{
            fontSize: `${zoomLevel}rem`,
            padding: '1rem'
          }}>
                <ResumePreview template={selectedTemplate} resumeData={resumeData.generated_text || ''} optimizedResumeId={optimizedResumeId} selectedColorScheme={selectedColorScheme} />
              </div> : <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">No resume data available</p>
              </div>}
          </div>
        </div>
      </DialogContent>
    </Dialog>;
};
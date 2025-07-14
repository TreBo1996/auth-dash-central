import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Download, 
  Edit, 
  Loader2,
  AlertCircle,
  Palette,
  Layout,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  RotateCcw,
  FileImage,
  FileText,
  Printer
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
  
  // Enhanced UI state
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [exportQuality, setExportQuality] = useState<'standard' | 'high' | 'print'>('high');

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

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 2));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const getExportOptions = () => {
    const baseOptions = {
      margin: [0.4, 0.4, 0.4, 0.4],
      filename: `resume-${selectedTemplate}-${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      jsPDF: { 
        unit: 'in' as const, 
        format: 'letter' as const, 
        orientation: 'portrait' as const
      }
    };

    switch (exportQuality) {
      case 'high':
        return {
          ...baseOptions,
          html2canvas: { 
            scale: 3,
            useCORS: true,
            letterRendering: true,
            allowTaint: false,
            backgroundColor: '#ffffff',
            dpi: 192,
            foreignObjectRendering: true,
            imageTimeout: 15000,
            logging: false,
            onclone: (clonedDoc: Document) => {
              // Enhance text rendering for cloned document
              const style = clonedDoc.createElement('style');
              style.textContent = `
                * {
                  text-rendering: optimizeLegibility !important;
                  -webkit-font-smoothing: antialiased !important;
                  -moz-osx-font-smoothing: grayscale !important;
                  font-smooth: always !important;
                }
              `;
              clonedDoc.head.appendChild(style);
            }
          }
        };
      case 'print':
        return {
          ...baseOptions,
          html2canvas: { 
            scale: 4,
            useCORS: true,
            letterRendering: true,
            allowTaint: false,
            backgroundColor: '#ffffff',
            dpi: 300,
            foreignObjectRendering: true,
            imageTimeout: 20000
          }
        };
      default:
        return {
          ...baseOptions,
          html2canvas: { 
            scale: 2,
            useCORS: true,
            letterRendering: true,
            allowTaint: false,
            backgroundColor: '#ffffff'
          }
        };
    }
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
      
      const element = document.getElementById('resume-preview-content');
      if (!element) {
        throw new Error('Resume preview not found');
      }

      const html2pdf = (await import('html2pdf.js')).default;
      const options = getExportOptions();

      await html2pdf().set(options).from(element).save();
      
      toast({
        title: "Export Successful",
        description: `Your resume has been downloaded as a ${exportQuality} quality PDF.`
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
      <DialogContent className={`${isFullscreen ? 'max-w-[98vw] max-h-[98vh]' : 'max-w-6xl max-h-[90vh]'} overflow-hidden transition-all duration-300`}>
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
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFullscreen}
                className="h-8 w-8 p-0"
              >
                {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className={`grid ${isMobile || isFullscreen ? 'grid-cols-1' : 'grid-cols-4'} gap-6 ${isFullscreen ? 'h-[88vh]' : 'h-[75vh]'}`}>
          {/* Template Selection Panel */}
          <div className={`${isMobile ? 'order-2' : isFullscreen ? 'hidden' : 'order-1'} space-y-4 overflow-y-auto ${isFullscreen ? 'w-0' : ''}`}>
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

            {/* Export Quality Selection */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileImage className="h-4 w-4" />
                  Export Quality
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { id: 'standard', name: 'Standard', desc: 'Good quality, fast' },
                    { id: 'high', name: 'High Quality', desc: 'Better quality, slower' },
                    { id: 'print', name: 'Print Ready', desc: 'Best quality, slowest' }
                  ].map((quality) => (
                    <Card 
                      key={quality.id}
                      className={`cursor-pointer transition-all hover:shadow-sm ${
                        exportQuality === quality.id ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setExportQuality(quality.id as any)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-medium">{quality.name}</div>
                            <div className="text-xs text-muted-foreground">{quality.desc}</div>
                          </div>
                          {exportQuality === quality.id && (
                            <div className="w-2 h-2 bg-primary rounded-full" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
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
          <div className={`${isMobile ? 'order-1 col-span-1' : isFullscreen ? 'col-span-1' : 'order-2 col-span-3'} border rounded-lg overflow-hidden bg-white relative`}>
            {/* Enhanced Preview Controls */}
            <div className="zoom-controls absolute top-2 right-2 z-10 flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-lg p-1 shadow-sm">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 0.5}
                className="h-7 w-7 p-0"
              >
                <ZoomOut className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetZoom}
                className="h-7 px-2 text-xs"
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 2}
                className="h-7 w-7 p-0"
              >
                <ZoomIn className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.print()}
                className="h-7 w-7 p-0"
              >
                <Printer className="h-3 w-3" />
              </Button>
            </div>

            {resumeData ? (
              <div 
                className="h-full overflow-auto"
                style={{
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: 'top left',
                  width: `${100 / zoomLevel}%`,
                  height: `${100 / zoomLevel}%`
                }}
              >
                <div id="resume-preview-content">
                  <ResumePreview
                    template={selectedTemplate}
                    resumeData={resumeData.generated_text || ''}
                    optimizedResumeId={optimizedResumeId}
                    selectedColorScheme={selectedColorScheme}
                  />
                </div>
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
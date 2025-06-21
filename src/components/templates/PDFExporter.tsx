
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import html2pdf from 'html2pdf.js';

interface PDFExporterProps {
  resumeId: string;
  resumeContent: React.ReactNode;
  templateId?: string;
  userName?: string;
}

export const PDFExporter: React.FC<PDFExporterProps> = ({
  resumeId,
  resumeContent,
  templateId,
  userName = 'User'
}) => {
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  const generatePDF = async () => {
    try {
      setExporting(true);

      // Create a temporary container for the resume content
      const tempContainer = document.createElement('div');
      tempContainer.innerHTML = `
        <div style="font-family: system-ui, -apple-system, sans-serif; color: #111827; line-height: 1.6;">
          <div id="resume-content"></div>
        </div>
      `;
      
      // Clone the resume content and append to temp container
      const resumeElement = document.querySelector('.resume-template');
      if (resumeElement) {
        const clonedContent = resumeElement.cloneNode(true) as HTMLElement;
        // Remove any interactive elements and apply print-friendly styles
        clonedContent.style.transform = 'none';
        clonedContent.style.boxShadow = 'none';
        tempContainer.querySelector('#resume-content')?.appendChild(clonedContent);
      }

      // Configure PDF options
      const options = {
        margin: 0.5,
        filename: `Optimized_Resume_${userName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true,
          letterRendering: true
        },
        jsPDF: { 
          unit: 'in', 
          format: 'letter', 
          orientation: 'portrait' 
        }
      };

      // Generate PDF
      await html2pdf().set(options).from(tempContainer).save();

      // Track the export in database
      await trackExport();

      toast({
        title: "PDF Downloaded",
        description: "Your resume has been exported successfully.",
      });

    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Export Failed",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive"
      });
    } finally {
      setExporting(false);
    }
  };

  const trackExport = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const fileName = `Optimized_Resume_${userName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      
      await supabase
        .from('resume_exports')
        .insert({
          user_id: user.id,
          optimized_resume_id: resumeId,
          template_id: templateId,
          file_name: fileName,
          export_format: 'pdf'
        });
    } catch (error) {
      console.error('Error tracking export:', error);
      // Don't throw error here as the PDF was successfully generated
    }
  };

  return (
    <Button 
      onClick={generatePDF} 
      disabled={exporting}
      className="flex items-center gap-2"
    >
      {exporting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      {exporting ? 'Generating PDF...' : 'Download as PDF'}
    </Button>
  );
};

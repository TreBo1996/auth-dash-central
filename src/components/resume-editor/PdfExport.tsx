
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import html2pdf from 'html2pdf.js';

interface PdfExportProps {
  resumeContent: string;
  selectedTemplate: string;
  resumeId: string;
}

export const PdfExport: React.FC<PdfExportProps> = ({
  resumeContent,
  selectedTemplate,
  resumeId
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const exportToPdf = async () => {
    try {
      setIsExporting(true);
      
      // Create a temporary container for the PDF content
      const tempContainer = document.createElement('div');
      tempContainer.innerHTML = `
        <div class="resume-preview template-${selectedTemplate}" style="
          max-width: 8.5in;
          margin: 0 auto;
          padding: 40px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
        ">
          ${resumeContent.split('\n').map(line => {
            if (line.toUpperCase() === line && line.trim() && line.length < 50) {
              return `<h2 style="color: #2563eb; font-size: 18px; font-weight: 600; margin: 24px 0 12px 0; text-transform: uppercase; letter-spacing: 0.5px;">${line}</h2>`;
            }
            return `<p style="margin: 8px 0; font-size: 14px;">${line || '<br>'}</p>`;
          }).join('')}
        </div>
      `;
      
      // Apply template-specific styles
      let additionalStyles = '';
      switch (selectedTemplate) {
        case 'modern':
          additionalStyles = `
            .template-modern h2 { 
              border-left: 4px solid #2563eb; 
              padding-left: 12px; 
              background: linear-gradient(90deg, #eff6ff 0%, transparent 100%);
              padding: 8px 0 8px 12px;
              margin-left: -12px;
            }
          `;
          break;
        case 'creative':
          additionalStyles = `
            .template-creative h2 { 
              color: #7c3aed; 
              border-left: 4px solid #7c3aed;
              padding-left: 12px;
              background: linear-gradient(90deg, #faf5ff 0%, transparent 100%);
              padding: 8px 0 8px 12px;
              margin-left: -12px;
            }
          `;
          break;
        case 'classic':
        default:
          additionalStyles = `
            .template-classic h2 { 
              border-bottom: 2px solid #374151; 
              padding-bottom: 4px;
            }
          `;
          break;
      }
      
      // Add styles to the container
      const styleSheet = document.createElement('style');
      styleSheet.textContent = additionalStyles;
      tempContainer.appendChild(styleSheet);
      
      // Configure PDF options
      const options = {
        margin: 0.5,
        filename: `Resume_${selectedTemplate}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };
      
      // Generate and download PDF
      await html2pdf().set(options).from(tempContainer).save();
      
      toast({
        title: "Success",
        description: "Resume exported as PDF successfully!",
      });
      
    } catch (error) {
      console.error('PDF export error:', error);
      toast({
        title: "Error",
        description: "Failed to export resume as PDF.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button 
      onClick={exportToPdf} 
      disabled={isExporting}
      className="gap-2"
    >
      {isExporting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      {isExporting ? 'Exporting...' : 'Download PDF'}
    </Button>
  );
};


import html2pdf from 'html2pdf.js';
import { templateConfigs } from '@/components/resume-templates/templateConfigs';

// PDF generation options optimized for resumes with better page breaks
const getPDFOptions = () => {
  return {
    margin: [0.5, 0.75, 0.5, 0.75], // top, right, bottom, left in inches
    filename: 'resume.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { 
      scale: 1.5, // Reduced from 2 to prevent layout issues
      useCORS: true,
      letterRendering: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      height: window.innerHeight,
      width: window.innerWidth,
      scrollX: 0,
      scrollY: 0
    },
    jsPDF: { 
      unit: 'in', 
      format: 'letter', 
      orientation: 'portrait',
      compress: true,
      precision: 16
    },
    pagebreak: { 
      mode: ['avoid-all', 'css', 'legacy'],
      before: '.page-break-before',
      after: '.page-break-after',
      avoid: '.avoid-page-break'
    }
  };
};

// Clean the HTML content and add page break controls
const cleanHTMLForPDF = (element: HTMLElement): HTMLElement => {
  const clonedElement = element.cloneNode(true) as HTMLElement;
  
  // Remove any interactive elements that might cause issues
  const interactiveElements = clonedElement.querySelectorAll('button, input, select, textarea, [contenteditable]');
  interactiveElements.forEach(el => el.remove());
  
  // Add comprehensive page break styles
  const pageBreakStyles = `
    <style>
      /* Page break controls for PDF generation */
      
      /* Prevent bullet points from breaking across pages */
      li, .bullet-point {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        margin-bottom: 2px !important;
      }
      
      /* Keep job sections and experience items together */
      .job-entry, .experience-item, .mb-4, .space-y-4 > div {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      
      /* Prevent orphaned headers */
      h1, h2, h3, h4, h5, h6 {
        page-break-after: avoid !important;
        break-after: avoid !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      
      /* Control widow/orphan lines */
      p, li, div {
        widows: 2 !important;
        orphans: 2 !important;
      }
      
      /* Ensure proper spacing for lists */
      ul, ol {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      
      /* Keep contact info and headers together */
      .text-center, .header-section {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      
      /* Skills grid sections */
      .grid, .grid-cols-2 {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      
      /* Education and certification items */
      .space-y-3 > div, .education-item, .cert-item {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      
      /* Ensure black text for print */
      * {
        color: #000000 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      /* Force proper line heights */
      p, li, div, span {
        line-height: 1.4 !important;
      }
      
      /* Ensure proper margins for readability */
      .space-y-1 > * + *, .space-y-2 > * + *, .space-y-3 > * + *, .space-y-4 > * + * {
        margin-top: 0.25rem !important;
      }
    </style>
  `;
  
  // Insert the styles at the beginning of the cloned element
  clonedElement.insertAdjacentHTML('afterbegin', pageBreakStyles);
  
  // Add specific classes to elements that need page break control
  const allElements = clonedElement.querySelectorAll('*');
  allElements.forEach(el => {
    const htmlEl = el as HTMLElement;
    
    // Add avoid-page-break class to bullet points
    if (htmlEl.tagName === 'LI') {
      htmlEl.classList.add('avoid-page-break');
    }
    
    // Add avoid-page-break class to job entries (look for common patterns)
    if (htmlEl.classList.contains('mb-4') || 
        htmlEl.classList.contains('space-y-4') ||
        (htmlEl.tagName === 'DIV' && htmlEl.querySelector('h3'))) {
      htmlEl.classList.add('avoid-page-break');
    }
    
    // Add page break avoidance to headers
    if (htmlEl.tagName.match(/^H[1-6]$/)) {
      htmlEl.classList.add('avoid-page-break');
    }
    
    // Force text colors to black for better print readability
    if (htmlEl.style) {
      htmlEl.style.color = '#000000';
    }
  });
  
  return clonedElement;
};

export const generatePDF = async (templateId: string, resumeContent: string, fileName: string) => {
  console.log('PDF Generation: Starting actual PDF generation for template:', templateId);
  
  const resumeElement = document.getElementById('resume-preview');
  if (!resumeElement) {
    console.error('PDF Generation: Resume preview element not found');
    throw new Error('Resume content not found');
  }

  try {
    // Clean the HTML content for PDF generation with page break controls
    const cleanedElement = cleanHTMLForPDF(resumeElement);
    
    // Configure PDF options with the provided filename
    const options = {
      ...getPDFOptions(),
      filename: fileName || 'resume.pdf'
    };
    
    console.log('PDF Generation: Generating PDF with enhanced page break options:', options);
    
    // Generate and download the PDF with better page handling
    await html2pdf()
      .set(options)
      .from(cleanedElement)
      .save();
    
    console.log('PDF Generation: Successfully generated and downloaded PDF with page break controls');
    
  } catch (error) {
    console.error('PDF Generation: Error generating PDF:', error);
    throw new Error('Failed to generate PDF. Please try again.');
  }
};

// Keep the print function separate for users who want to print directly
export const printResume = (templateId: string, resumeContent: string) => {
  console.log('Print: Starting print dialog for template:', templateId);
  
  const resumeElement = document.getElementById('resume-preview');
  if (!resumeElement) {
    console.error('Print: Resume preview element not found');
    throw new Error('Resume content not found');
  }

  // Simple print CSS for clean printing
  const printCSS = `
    <style>
      @media print {
        body { margin: 0; padding: 0; }
        @page { size: 8.5in 11in; margin: 0.5in 0.75in; }
        .no-print, nav, .sidebar, button, .btn { display: none !important; }
        #resume-preview { 
          box-shadow: none !important; 
          border: none !important; 
          background: white !important;
        }
      }
    </style>
  `;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Unable to open print window');
  }

  const printHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Resume</title>
      ${printCSS}
    </head>
    <body>
      ${resumeElement.outerHTML}
      <script>
        window.onload = function() {
          setTimeout(() => {
            window.print();
            window.close();
          }, 500);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(printHTML);
  printWindow.document.close();
};

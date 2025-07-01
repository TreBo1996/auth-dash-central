
import html2pdf from 'html2pdf.js';
import { templateConfigs } from '@/components/resume-templates/templateConfigs';

// PDF generation options optimized for resumes with better page breaks
const getPDFOptions = () => {
  return {
    margin: [0.4, 0.6, 0.4, 0.6], // Reduced margins for more content space
    filename: 'resume.pdf',
    image: { type: 'jpeg', quality: 0.95 },
    html2canvas: { 
      scale: 1.2, // Further reduced scale to prevent layout issues
      useCORS: true,
      letterRendering: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      height: window.innerHeight,
      width: window.innerWidth,
      scrollX: 0,
      scrollY: 0,
      onrendered: (canvas: HTMLCanvasElement) => {
        console.log('Canvas rendered:', canvas.width, 'x', canvas.height);
      }
    },
    jsPDF: { 
      unit: 'in', 
      format: 'letter', 
      orientation: 'portrait',
      compress: true,
      precision: 16
    },
    pagebreak: { 
      mode: ['css', 'legacy'],
      before: '.page-break-before',
      after: '.page-break-after',
      avoid: ['.avoid-page-break', 'li', '.bullet-item', '.job-entry', '.experience-section']
    }
  };
};

// Clean the HTML content and add comprehensive page break controls
const cleanHTMLForPDF = (element: HTMLElement): HTMLElement => {
  const clonedElement = element.cloneNode(true) as HTMLElement;
  
  // Remove any interactive elements that might cause issues
  const interactiveElements = clonedElement.querySelectorAll('button, input, select, textarea, [contenteditable]');
  interactiveElements.forEach(el => el.remove());
  
  // Add comprehensive page break styles with enhanced controls
  const pageBreakStyles = `
    <style>
      @page {
        size: 8.5in 11in;
        margin: 0.4in 0.6in;
      }
      
      /* Critical page break controls */
      li, .bullet-point, .bullet-item {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        display: block !important;
        margin-bottom: 2px !important;
        padding-bottom: 1px !important;
        line-height: 1.3 !important;
      }
      
      /* Enhanced list handling */
      ul, ol {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        margin-bottom: 8px !important;
      }
      
      /* Job sections and experience items - keep together */
      .job-entry, .experience-item, .experience-section,
      .mb-4, .space-y-4 > div, .space-y-3 > div {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        margin-bottom: 6px !important;
      }
      
      /* Section headers - prevent orphaning */
      h1, h2, h3, h4, h5, h6 {
        page-break-after: avoid !important;
        break-after: avoid !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        margin-bottom: 4px !important;
      }
      
      /* Paragraph and text controls */
      p, div, span {
        widows: 3 !important;
        orphans: 3 !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      
      /* Contact info and headers */
      .text-center, .header-section {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      
      /* Skills grid sections */
      .grid, .grid-cols-2, .skills-section {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      
      /* Force proper text rendering */
      * {
        color: #000000 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        font-family: Inter, "Helvetica Neue", Helvetica, Arial, sans-serif !important;
      }
      
      /* Enhanced line spacing for readability */
      p, li, div, span {
        line-height: 1.35 !important;
      }
      
      /* Better spacing control */
      .space-y-1 > * + * { margin-top: 0.2rem !important; }
      .space-y-2 > * + * { margin-top: 0.3rem !important; }
      .space-y-3 > * + * { margin-top: 0.4rem !important; }
      .space-y-4 > * + * { margin-top: 0.5rem !important; }
      
      /* Specific bullet point fixes */
      li::before {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      
      /* Flex container fixes for job titles */
      .flex, .flex.justify-between {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      
      /* Ensure minimum content on page */
      .page-content {
        min-height: 2in !important;
      }
    </style>
  `;
  
  // Insert the styles at the beginning
  clonedElement.insertAdjacentHTML('afterbegin', pageBreakStyles);
  
  // Add specific classes and attributes to elements
  const allElements = clonedElement.querySelectorAll('*');
  allElements.forEach((el, index) => {
    const htmlEl = el as HTMLElement;
    
    // Handle bullet points specifically
    if (htmlEl.tagName === 'LI') {
      htmlEl.classList.add('avoid-page-break', 'bullet-item');
      htmlEl.style.pageBreakInside = 'avoid';
      htmlEl.style.breakInside = 'avoid';
      htmlEl.style.display = 'block';
      htmlEl.style.marginBottom = '2px';
    }
    
    // Handle unordered/ordered lists
    if (htmlEl.tagName === 'UL' || htmlEl.tagName === 'OL') {
      htmlEl.classList.add('avoid-page-break');
      htmlEl.style.pageBreakInside = 'avoid';
      htmlEl.style.breakInside = 'avoid';
    }
    
    // Handle job entries and sections
    if (htmlEl.classList.contains('mb-4') || 
        htmlEl.classList.contains('space-y-4') ||
        htmlEl.classList.contains('space-y-3') ||
        (htmlEl.tagName === 'DIV' && htmlEl.querySelector('h3'))) {
      htmlEl.classList.add('avoid-page-break', 'job-entry');
      htmlEl.style.pageBreakInside = 'avoid';
      htmlEl.style.breakInside = 'avoid';
    }
    
    // Handle headers
    if (htmlEl.tagName.match(/^H[1-6]$/)) {
      htmlEl.classList.add('avoid-page-break');
      htmlEl.style.pageBreakAfter = 'avoid';
      htmlEl.style.breakAfter = 'avoid';
      htmlEl.style.pageBreakInside = 'avoid';
      htmlEl.style.breakInside = 'avoid';
    }
    
    // Force text color to black
    if (htmlEl.style) {
      htmlEl.style.color = '#000000';
    }
  });
  
  return clonedElement;
};

// Add a small delay to ensure proper rendering
const waitForRender = (ms: number = 500) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const generatePDF = async (templateId: string, resumeContent: string, fileName: string) => {
  console.log('PDF Generation: Starting enhanced PDF generation for template:', templateId);
  
  const resumeElement = document.getElementById('resume-preview');
  if (!resumeElement) {
    console.error('PDF Generation: Resume preview element not found');
    throw new Error('Resume content not found');
  }

  try {
    // Wait a moment for any animations to complete
    await waitForRender();
    
    // Clean the HTML content with enhanced page break controls
    const cleanedElement = cleanHTMLForPDF(resumeElement);
    
    // Configure PDF options with the provided filename
    const options = {
      ...getPDFOptions(),
      filename: fileName || 'resume.pdf'
    };
    
    console.log('PDF Generation: Generating PDF with enhanced page break options:', options);
    
    // Generate and download the PDF with improved settings
    const worker = html2pdf()
      .set(options)
      .from(cleanedElement);
    
    // Add progress logging
    worker.then(() => {
      console.log('PDF Generation: Successfully generated PDF');
    });
    
    await worker.save();
    
    console.log('PDF Generation: Successfully downloaded PDF with enhanced page breaks');
    
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

  // Enhanced print CSS with better page break controls
  const printCSS = `
    <style>
      @media print {
        body { 
          margin: 0; 
          padding: 0; 
          font-family: Inter, "Helvetica Neue", Helvetica, Arial, sans-serif !important;
        }
        @page { 
          size: 8.5in 11in; 
          margin: 0.4in 0.6in; 
        }
        .no-print, nav, .sidebar, button, .btn { 
          display: none !important; 
        }
        #resume-preview { 
          box-shadow: none !important; 
          border: none !important; 
          background: white !important;
        }
        li, ul, ol {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        h1, h2, h3, h4, h5, h6 {
          page-break-after: avoid !important;
          break-after: avoid !important;
        }
        .mb-4, .space-y-4 > div {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
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

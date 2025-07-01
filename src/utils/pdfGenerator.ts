
import html2pdf from 'html2pdf.js';
import { templateConfigs } from '@/components/resume-templates/templateConfigs';

// PDF generation options optimized for better content capture
const getPDFOptions = () => {
  return {
    margin: [0.5, 0.5, 0.5, 0.5], // Reduced margins for better page utilization
    filename: 'resume.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { 
      scale: 1.2, // More conservative scale
      useCORS: true,
      letterRendering: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
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
      avoid: ['.avoid-page-break', '.job-entry', '.experience-item']
    }
  };
};

// Enhanced HTML cleaning with more natural page breaks
const cleanHTMLForPDF = (element: HTMLElement): HTMLElement => {
  const clonedElement = element.cloneNode(true) as HTMLElement;
  
  // Remove any interactive elements that might cause issues
  const interactiveElements = clonedElement.querySelectorAll('button, input, select, textarea, [contenteditable]');
  interactiveElements.forEach(el => el.remove());
  
  // Enhanced page break styles with Classic Template specific fixes
  const pageBreakStyles = `
    <style>
      @page {
        size: 8.5in 11in;
        margin: 0.5in;
      }
      
      /* Force proper text rendering and sizing */
      * {
        color: #000000 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        font-family: Inter, "Helvetica Neue", Helvetica, Arial, sans-serif !important;
      }
      
      /* Ensure full width utilization */
      #resume-preview {
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      
      /* CLASSIC TEMPLATE SPECIFIC FIXES - Target the large gap issue */
      .mb-6 {
        margin-bottom: 0.75rem !important; /* Reduce from 24px to 12px */
        page-break-before: auto !important;
        page-break-after: auto !important;
      }
      
      .mb-4 {
        margin-bottom: 0.5rem !important; /* Reduce from 16px to 8px */
        page-break-before: auto !important;
        page-break-after: auto !important;
      }
      
      .mb-8 {
        margin-bottom: 1rem !important; /* Reduce from 32px to 16px */
        page-break-before: auto !important;
        page-break-after: auto !important;
      }
      
      /* Override inline marginTop styles for section headers */
      h2[style*="marginTop"] {
        margin-top: 0.5rem !important; /* Override the 12px inline style */
      }
      
      /* Prevent forced page breaks between adjacent sections */
      .mb-6 + div,
      .mb-4 + div,
      .mb-8 + div {
        page-break-before: auto !important;
        break-before: auto !important;
      }
      
      /* NATURAL SECTION FLOW - Allow sections to flow naturally */
      .mb-10, .mb-8, .mb-6, .mb-4 {
        page-break-before: auto !important;
        page-break-after: auto !important;
        break-before: auto !important;
        break-after: auto !important;
      }
      
      /* INDIVIDUAL JOB ENTRY PROTECTION - Only protect job entries, not entire sections */
      .space-y-8 > div:has(h3),
      .space-y-6 > div:has(h3),
      .space-y-4 > div:has(h3),
      div:has(h3[style*="fontWeight: 'bold'"]) {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        margin-bottom: 1rem !important;
      }
      
      /* If job entry is too long, allow breaks between bullet points */
      .space-y-8 > div:has(h3) ul,
      .space-y-6 > div:has(h3) ul,
      .space-y-4 > div:has(h3) ul,
      div:has(h3[style*="fontWeight: 'bold'"]) ul {
        page-break-inside: auto !important;
        break-inside: auto !important;
      }
      
      /* Keep individual bullet points together */
      li {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        margin-bottom: 3px !important;
        orphans: 2 !important;
        widows: 2 !important;
      }
      
      /* Headers should stay with some content but allow natural flow */
      h1, h2, h3 {
        page-break-after: avoid !important;
        break-after: avoid !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        orphans: 3 !important;
      }
      
      /* Better text flow for paragraphs */
      p, div, span {
        line-height: 1.4 !important;
        orphans: 2 !important;
        widows: 2 !important;
      }
      
      /* Job title and company lines should stay with their content */
      h3 + p,
      h3 + div,
      .font-bold + .italic,
      .font-bold + p {
        page-break-before: avoid !important;
        break-before: avoid !important;
      }
      
      /* Ensure date spans stay with their job titles */
      .flex.justify-between {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      
      /* REMOVE excessive spacing between sections for space-y patterns */
      .space-y-8 > * + *:not(:has(h3)) { margin-top: 1rem !important; }
      .space-y-6 > * + *:not(:has(h3)) { margin-top: 0.75rem !important; }
      .space-y-4 > * + *:not(:has(h3)) { margin-top: 0.5rem !important; }
      
      /* Job entries can have normal spacing */
      .space-y-8 > *:has(h3) + *:has(h3) { margin-top: 2rem !important; }
      .space-y-6 > *:has(h3) + *:has(h3) { margin-top: 1.5rem !important; }
      .space-y-4 > *:has(h3) + *:has(h3) { margin-top: 1rem !important; }
      
      /* Maintain grid layouts */
      .grid-cols-2 {
        display: grid !important;
        grid-template-columns: 1fr 1fr !important;
        gap: 1rem !important;
        page-break-inside: auto !important;
        break-inside: auto !important;
      }
      
      /* Better spacing preservation for non-job content */
      .space-y-1 > * + * { margin-top: 0.25rem !important; }
      .space-y-2 > * + * { margin-top: 0.5rem !important; }
      .space-y-3 > * + * { margin-top: 0.75rem !important; }
      
      /* Executive template specific - keep banner content together */
      .bg-gradient-to-r {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      
      /* Skills section - allow natural flow */
      .grid-cols-2 > div {
        page-break-inside: auto !important;
        break-inside: auto !important;
      }
      
      /* Classic Template - Fix the specific two-column bullet list spacing */
      .grid.grid-cols-2.gap-12 {
        gap: 1rem !important; /* Reduce excessive gap */
        margin-bottom: 0.5rem !important;
      }
      
      /* Classic Template - Ensure section dividers don't create excessive space */
      div[style*="height: '0.5px'"] {
        margin-top: 4px !important;
        margin-bottom: 6px !important;
      }
    </style>
  `;
  
  // Insert the styles at the beginning
  clonedElement.insertAdjacentHTML('afterbegin', pageBreakStyles);
  
  // Add classes to help identify job experience entries (not entire sections)
  const allElements = clonedElement.querySelectorAll('*');
  allElements.forEach((el) => {
    const htmlEl = el as HTMLElement;
    
    // Mark individual job entries (elements that contain h3 for job titles)
    if (htmlEl.tagName === 'DIV' && htmlEl.querySelector('h3')) {
      htmlEl.classList.add('job-entry');
    }
    
    // Force black text color
    if (htmlEl.style) {
      htmlEl.style.color = '#000000';
    }
  });
  
  return clonedElement;
};

// Add better error handling and content detection
const waitForRender = (ms: number = 500) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const generatePDF = async (templateId: string, resumeContent: string, fileName: string) => {
  console.log('PDF Generation: Starting PDF generation for template:', templateId);
  
  const resumeElement = document.getElementById('resume-preview');
  if (!resumeElement) {
    console.error('PDF Generation: Resume preview element not found');
    throw new Error('Resume content not found');
  }

  // Check if element has content
  if (!resumeElement.innerHTML.trim()) {
    console.error('PDF Generation: Resume element is empty');
    throw new Error('Resume content is empty');
  }

  try {
    console.log('PDF Generation: Element dimensions:', {
      width: resumeElement.offsetWidth,
      height: resumeElement.offsetHeight,
      scrollWidth: resumeElement.scrollWidth,
      scrollHeight: resumeElement.scrollHeight
    });

    // Wait for rendering to complete
    await waitForRender();
    
    // Clean the HTML content with enhanced page break controls
    const cleanedElement = cleanHTMLForPDF(resumeElement);
    
    // Configure PDF options with the provided filename
    const options = {
      ...getPDFOptions(),
      filename: fileName || 'resume.pdf'
    };
    
    console.log('PDF Generation: Generating PDF with options:', options);
    
    // Generate and download the PDF
    const worker = html2pdf()
      .set(options)
      .from(cleanedElement);
    
    await worker.save();
    
    console.log('PDF Generation: Successfully downloaded PDF');
    
  } catch (error) {
    console.error('PDF Generation: Error generating PDF:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('Canvas')) {
        throw new Error('Failed to render PDF content. Please try again.');
      } else if (error.message.includes('jsPDF')) {
        throw new Error('Failed to generate PDF file. Please check your content and try again.');
      }
    }
    
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

  // Simplified print CSS
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
          margin: 0.5in; 
        }
        .no-print, nav, .sidebar, button, .btn { 
          display: none !important; 
        }
        #resume-preview { 
          box-shadow: none !important; 
          border: none !important; 
          background: white !important;
          width: 100% !important;
          max-width: 100% !important;
        }
        li {
          page-break-inside: avoid !important;
        }
        h1, h2, h3 {
          page-break-after: avoid !important;
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

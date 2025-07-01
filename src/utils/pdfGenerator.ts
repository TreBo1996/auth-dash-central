
import { templateConfigs } from '@/components/resume-templates/templateConfigs';

// Extract all relevant CSS for PDF generation
const getComprehensiveCSS = () => {
  return `
    <style>
      /* Reset and base styles */
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      body {
        font-family: Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif !important;
        font-size: 10px !important;
        line-height: 1.4 !important;
        color: #000 !important;
        background: white !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      
      @page {
        size: 8.5in 11in;
        margin: 1in;
      }
      
      /* Tailwind-like utilities for PDF */
      .text-center { text-align: center !important; }
      .font-bold { font-weight: bold !important; }
      .uppercase { text-transform: uppercase !important; }
      .italic { font-style: italic !important; }
      .mb-6 { margin-bottom: 24px !important; }
      .mb-4 { margin-bottom: 16px !important; }
      .mb-2 { margin-bottom: 8px !important; }
      .mt-2 { margin-top: 8px !important; }
      .mx-auto { margin-left: auto !important; margin-right: auto !important; }
      .w-full { width: 100% !important; }
      .bg-black { background-color: #000 !important; }
      .flex { display: flex !important; }
      .justify-between { justify-content: space-between !important; }
      .justify-center { justify-content: center !important; }
      .items-baseline { align-items: baseline !important; }
      .items-start { align-items: flex-start !important; }
      .space-y-1 > * + * { margin-top: 4px !important; }
      .space-y-3 > * + * { margin-top: 12px !important; }
      .space-y-4 > * + * { margin-top: 16px !important; }
      .pl-4 { padding-left: 16px !important; }
      .grid { display: grid !important; }
      .grid-cols-2 { grid-template-columns: 1fr 1fr !important; }
      .gap-12 { gap: 48px !important; }
      
      /* ULTRA-AGGRESSIVE CENTERING FOR CLASSIC TEMPLATE */
      
      /* Force center ALL text-center elements */
      .text-center,
      [class*="text-center"],
      div[class*="text-center"],
      h1[class*="text-center"],
      h2[class*="text-center"] {
        text-align: center !important;
        margin-left: auto !important;
        margin-right: auto !important;
        display: block !important;
        width: 100% !important;
      }
      
      /* Target Professional Summary specifically */
      .italic,
      div.italic,
      p.italic,
      span.italic,
      [class*="italic"],
      div[class*="mb-6"][class*="text-center"],
      div[class*="mx-auto"][class*="italic"] {
        text-align: center !important;
        margin-left: auto !important;
        margin-right: auto !important;
        display: block !important;
        width: 100% !important;
      }
      
      /* Target all section headers - SKILLS, EXPERIENCE, etc */
      h2,
      h2.font-bold,
      h2.uppercase,
      h2[class*="font-bold"],
      h2[class*="uppercase"],
      h2[class*="text-center"],
      .font-bold.uppercase,
      [class*="font-bold"][class*="uppercase"] {
        text-align: center !important;
        margin-left: auto !important;
        margin-right: auto !important;
        display: block !important;
        width: 100% !important;
      }
      
      /* Catch elements by inline styles */
      [style*="text-align: center"],
      [style*="textAlign: center"],
      [style*="textAlign: 'center'"],
      [style*="fontSize: '10px'"][style*="fontStyle: 'italic'"],
      [style*="fontWeight: 'bold'"][style*="letterSpacing"] {
        text-align: center !important;
        margin-left: auto !important;
        margin-right: auto !important;
      }
      
      /* Skills grid - ensure proper layout */
      .grid-cols-2 {
        width: 100% !important;
        max-width: none !important;
        margin: 0 auto !important;
        display: grid !important;
        grid-template-columns: 1fr 1fr !important;
        gap: 3rem !important;
      }
      
      /* Container centering */
      .flex.justify-center {
        justify-content: center !important;
        align-items: center !important;
        width: 100% !important;
        display: flex !important;
      }
      
      /* Structural selectors for Classic template */
      div:first-child h1,
      div:first-child h2,
      div > h1:first-child,
      div > h2:first-child {
        text-align: center !important;
      }
      
      /* Emergency catch-all for any div that should be centered */
      div[class*="mb-6"]:not([class*="space-y"]) {
        text-align: center !important;
      }
      
      /* Hide any non-print elements */
      .no-print,
      nav,
      .sidebar,
      button,
      .btn,
      .header,
      .footer {
        display: none !important;
      }
      
      /* Remove shadows and borders for print */
      * {
        box-shadow: none !important;
        border-radius: 0 !important;
      }
      
      /* Ensure black text for print */
      h1, h2, h3, h4, h5, h6 {
        color: #000 !important;
      }
    </style>
  `;
};

export const generatePDF = (templateId: string, resumeContent: string, fileName: string) => {
  console.log('PDF Generation: Starting with template:', templateId);
  
  const resumeElement = document.getElementById('resume-preview');
  if (!resumeElement) {
    console.error('PDF Generation: Resume preview element not found');
    throw new Error('Resume content not found');
  }

  const resumeHTML = resumeElement.innerHTML;
  const comprehensiveCSS = getComprehensiveCSS();
  
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    console.error('PDF Generation: Could not open print window');
    throw new Error('Unable to open print window');
  }

  // Create complete HTML document with all styles
  const completeHTML = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${fileName}</title>
      ${comprehensiveCSS}
    </head>
    <body>
      <div id="resume-content">
        ${resumeHTML}
      </div>
    </body>
    </html>
  `;

  console.log('PDF Generation: Writing HTML to print window');
  printWindow.document.write(completeHTML);
  printWindow.document.close();

  // Allow styles to load before printing
  setTimeout(() => {
    console.log('PDF Generation: Initiating print');
    printWindow.print();
    
    // Close window after print dialog
    setTimeout(() => {
      printWindow.close();
    }, 1000);
  }, 500);
};

export const printResume = (templateId: string, resumeContent: string) => {
  console.log('Print: Starting with template:', templateId);
  generatePDF(templateId, resumeContent, 'Resume');
};

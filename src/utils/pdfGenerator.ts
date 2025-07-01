
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
        width: 100% !important;
        height: 100% !important;
      }
      
      /* Aggressive page setup to remove all headers and footers */
      @page {
        size: 8.5in 11in;
        margin: 0 !important;
        padding: 0 !important;
        
        /* Remove all headers and footers */
        @top-left { content: none !important; }
        @top-center { content: none !important; }
        @top-right { content: none !important; }
        @bottom-left { content: none !important; }
        @bottom-center { content: none !important; }
        @bottom-right { content: none !important; }
        
        /* Ensure no page info is displayed */
        @top-left-corner { content: none !important; }
        @top-right-corner { content: none !important; }
        @bottom-left-corner { content: none !important; }
        @bottom-right-corner { content: none !important; }
      }
      
      /* Hide all browser print elements */
      @media print {
        @page {
          margin: 0 !important;
          size: 8.5in 11in;
        }
        
        /* Completely hide browser UI elements */
        body::before,
        body::after,
        html::before,
        html::after {
          display: none !important;
          content: none !important;
        }
        
        /* Remove any URL, date, or page info */
        .no-print,
        nav,
        .sidebar,
        button,
        .btn,
        .header,
        .footer {
          display: none !important;
        }
      }
      
      /* Main container - full page utilization with proper margins */
      #resume-content {
        width: 100% !important;
        max-width: none !important;
        margin: 0 !important;
        padding: 0.5in 0.75in !important; /* Professional margins */
        min-height: 100vh !important;
        box-sizing: border-box !important;
      }
      
      /* Resume container - no additional scaling */
      #resume-content > div {
        width: 100% !important;
        max-width: none !important;
        margin: 0 !important;
        padding: 0 !important;
        transform: none !important; /* Remove scaling that was causing issues */
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
      .grid-cols-2 { 
        display: grid !important;
        grid-template-columns: 1fr 1fr !important;
        gap: 2rem !important;
        width: 100% !important;
      }
      .gap-12 { gap: 2rem !important; }
      
      /* SELECTIVE CENTERING - Only for intended elements */
      
      /* Header section - NAME and ROLE should be centered */
      .text-center h1,
      h1[class*="text-center"],
      .text-center > h1 {
        text-align: center !important;
        margin-left: auto !important;
        margin-right: auto !important;
        display: block !important;
        width: 100% !important;
      }
      
      /* Professional Summary - should be centered */
      .italic[class*="text-center"],
      div[class*="text-center"][class*="italic"],
      .text-center .italic,
      div[class*="mb-6"][class*="text-center"] {
        text-align: center !important;
        margin-left: auto !important;
        margin-right: auto !important;
        display: block !important;
        width: 100% !important;
      }
      
      /* Section headers (SKILLS, EXPERIENCE, etc) - should be centered */
      h2[class*="text-center"],
      h2[class*="font-bold"][class*="uppercase"],
      .font-bold.uppercase {
        text-align: center !important;
        margin-left: auto !important;
        margin-right: auto !important;
        display: block !important;
        width: 100% !important;
      }
      
      /* Contact info row - should be centered */
      .text-center:not(.mb-6):not(.space-y-4):not(.space-y-3) {
        text-align: center !important;
      }
      
      /* EXPERIENCE SECTION FIXES - Override centering for content */
      
      /* Experience job title and date row - LEFT align title, RIGHT align date */
      .space-y-4 .flex.justify-between,
      .space-y-4 div .flex.justify-between,
      .mb-4 .flex.justify-between {
        justify-content: space-between !important;
        align-items: baseline !important;
        text-align: left !important;
        display: flex !important;
        width: 100% !important;
      }
      
      /* Job titles in experience - LEFT aligned */
      .space-y-4 .flex.justify-between h3,
      .space-y-4 .flex.justify-between .font-bold,
      .mb-4 .flex.justify-between h3,
      .mb-4 .flex.justify-between .font-bold {
        text-align: left !important;
        margin: 0 !important;
        flex: 1 !important;
      }
      
      /* Dates in experience - RIGHT aligned */
      .space-y-4 .flex.justify-between span,
      .mb-4 .flex.justify-between span {
        text-align: right !important;
        margin: 0 !important;
        flex-shrink: 0 !important;
      }
      
      /* Company names - LEFT aligned and italic */
      .space-y-4 .italic:not([class*="text-center"]),
      .mb-4 .italic:not([class*="text-center"]),
      .space-y-4 p.italic,
      .mb-4 p.italic {
        text-align: left !important;
        margin-left: 0 !important;
        margin-right: auto !important;
      }
      
      /* Bullet points in experience - LEFT aligned */
      .space-y-4 ul,
      .space-y-4 li,
      .mb-4 ul,
      .mb-4 li {
        text-align: left !important;
        margin-left: 0 !important;
      }
      
      /* Education section content - LEFT aligned */
      .space-y-3 .flex.justify-between,
      .space-y-3 .flex.justify-between h3,
      .space-y-3 .flex.justify-between span,
      .space-y-3 p {
        text-align: left !important;
      }
      
      .space-y-3 .flex.justify-between {
        justify-content: space-between !important;
      }
      
      .space-y-3 .flex.justify-between span {
        text-align: right !important;
      }
      
      /* SKILLS GRID - Proper layout for bottom section */
      .grid-cols-2 {
        width: 100% !important;
        max-width: none !important;
        margin: 0 auto 24px auto !important;
        display: grid !important;
        grid-template-columns: 1fr 1fr !important;
        gap: 2rem !important;
      }
      
      /* Skills columns - ensure proper alignment */
      .grid-cols-2 > div {
        text-align: left !important;
        margin: 0 !important;
      }
      
      .grid-cols-2 .space-y-1,
      .grid-cols-2 .flex.items-start,
      .grid-cols-2 div {
        text-align: left !important;
        align-items: flex-start !important;
      }
      
      /* Skills list items - proper bullet alignment */
      .grid-cols-2 .flex.items-start {
        display: flex !important;
        align-items: flex-start !important;
        margin-bottom: 4px !important;
      }
      
      /* Skills bullets */
      .grid-cols-2 .flex.items-start::before {
        content: "•" !important;
        margin-right: 8px !important;
        flex-shrink: 0 !important;
      }
      
      /* Container centering - only for header elements */
      .flex.justify-center:has(h1),
      .flex.justify-center:has(h2),
      .flex.justify-center:has(.font-bold.uppercase) {
        justify-content: center !important;
        align-items: center !important;
        width: 100% !important;
        display: flex !important;
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
      
      /* Page break controls for better content flow */
      .page-break {
        page-break-before: always;
      }
      
      .avoid-break {
        page-break-inside: avoid;
      }
      
      /* Prevent content overflow */
      .space-y-4,
      .space-y-3,
      .mb-6 {
        page-break-inside: avoid;
      }
      
      /* Ensure proper spacing for sections */
      .mb-6:last-child {
        margin-bottom: 0 !important;
      }
      
      /* Bottom section improvements */
      .grid-cols-2:last-child {
        margin-bottom: 0 !important;
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

  // Create complete HTML document with aggressive header suppression
  const completeHTML = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title></title>
      ${comprehensiveCSS}
    </head>
    <body>
      <div id="resume-content">
        ${resumeHTML}
      </div>
      <script>
        // Aggressively remove browser-generated headers/footers
        document.title = '';
        
        // Clear any potential URL display
        if (window.history && window.history.replaceState) {
          window.history.replaceState(null, '', 'data:text/html,');
        }
        
        // Remove any browser UI elements
        window.addEventListener('beforeprint', function() {
          document.title = '';
          
          // Hide any remaining browser elements
          const style = document.createElement('style');
          style.textContent = \`
            @page { margin: 0 !important; }
            @media print {
              html, body { margin: 0 !important; padding: 0 !important; }
            }
          \`;
          document.head.appendChild(style);
        });
        
        // Clean up after print
        window.addEventListener('afterprint', function() {
          setTimeout(() => window.close(), 100);
        });
      </script>
    </body>
    </html>
  `;

  console.log('PDF Generation: Writing HTML to print window');
  printWindow.document.write(completeHTML);
  printWindow.document.close();

  // Allow styles to load before printing
  setTimeout(() => {
    console.log('PDF Generation: Initiating print');
    
    // Final attempt to clear title and URL
    printWindow.document.title = '';
    
    printWindow.print();
    
    // Close window after print dialog
    setTimeout(() => {
      printWindow.close();
    }, 1000);
  }, 1000); // Increased timeout for better style application
};

export const printResume = (templateId: string, resumeContent: string) => {
  console.log('Print: Starting with template:', templateId);
  generatePDF(templateId, resumeContent, 'Resume');
};

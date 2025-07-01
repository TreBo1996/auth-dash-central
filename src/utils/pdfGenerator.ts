
import { templateConfigs } from '@/components/resume-templates/templateConfigs';

// Simple PDF generation that captures exactly what's in the preview
const getBasicPrintCSS = () => {
  return `
    <style>
      /* Reset for clean printing */
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      /* Page setup */
      @page {
        size: 8.5in 11in;
        margin: 0.5in 0.75in;
        
        /* Completely remove headers and footers */
        @top-left { content: none !important; }
        @top-center { content: none !important; }
        @top-right { content: none !important; }
        @bottom-left { content: none !important; }
        @bottom-center { content: none !important; }
        @bottom-right { content: none !important; }
        @top-left-corner { content: none !important; }
        @top-right-corner { content: none !important; }
        @bottom-left-corner { content: none !important; }
        @bottom-right-corner { content: none !important; }
      }
      
      /* Body setup for print */
      html, body {
        width: 100% !important;
        height: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        background: white !important;
        font-family: Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif !important;
      }
      
      /* Hide browser print elements */
      @media print {
        body::before,
        body::after,
        html::before,
        html::after {
          display: none !important;
          content: none !important;
        }
        
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
      
      /* Main content container */
      #resume-content {
        width: 100% !important;
        max-width: none !important;
        margin: 0 !important;
        padding: 0 !important;
        background: white !important;
        min-height: 100vh !important;
      }
      
      /* Ensure the resume preview content is displayed properly */
      #resume-preview {
        width: 100% !important;
        max-width: none !important;
        margin: 0 !important;
        padding: 0 !important;
        background: white !important;
        box-shadow: none !important;
        border: none !important;
      }
      
      /* Remove any scaling or transforms that might affect layout */
      #resume-preview * {
        transform: none !important;
        scale: none !important;
      }
      
      /* Ensure proper text rendering */
      h1, h2, h3, h4, h5, h6, p, div, span {
        color: #000 !important;
      }
      
      /* Page break controls */
      .avoid-break {
        page-break-inside: avoid;
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

  // Get the exact HTML content from the preview
  const resumeHTML = resumeElement.innerHTML;
  const printCSS = getBasicPrintCSS();
  
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    console.error('PDF Generation: Could not open print window');
    throw new Error('Unable to open print window');
  }

  // Create a clean HTML document that matches the preview exactly
  const completeHTML = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title></title>
      ${printCSS}
    </head>
    <body>
      <div id="resume-content">
        <div id="resume-preview">
          ${resumeHTML}
        </div>
      </div>
      <script>
        // Aggressively clear any browser-generated content
        document.title = '';
        
        // Clear URL display
        if (window.history && window.history.replaceState) {
          window.history.replaceState(null, '', 'data:text/html,');
        }
        
        // Additional header/footer suppression
        window.addEventListener('beforeprint', function() {
          document.title = '';
          
          // Inject additional print styles
          const additionalStyle = document.createElement('style');
          additionalStyle.textContent = \`
            @page { 
              margin: 0.5in 0.75in !important; 
              size: 8.5in 11in !important;
            }
            @media print {
              html, body { 
                margin: 0 !important; 
                padding: 0 !important; 
                background: white !important;
              }
            }
          \`;
          document.head.appendChild(additionalStyle);
        });
        
        // Auto-close after print
        window.addEventListener('afterprint', function() {
          setTimeout(() => window.close(), 500);
        });
        
        // Trigger print automatically after content loads
        window.addEventListener('load', function() {
          setTimeout(() => {
            console.log('Triggering print dialog');
            window.print();
          }, 1000);
        });
      </script>
    </body>
    </html>
  `;

  console.log('PDF Generation: Writing exact preview content to print window');
  printWindow.document.write(completeHTML);
  printWindow.document.close();
};

export const printResume = (templateId: string, resumeContent: string) => {
  console.log('Print: Starting with template:', templateId);
  generatePDF(templateId, resumeContent, 'Resume');
};

import jsPDF from 'jspdf';
import { ContactInfo, getUserContactInfo } from './contactInfoUtils';

interface CoverLetterData {
  id: string;
  title: string;
  generated_text: string;
  created_at: string;
  job_descriptions?: {
    title: string;
    company: string;
  };
}

export class CoverLetterPDFGenerator {
  private pdf: jsPDF;
  private currentY: number;
  private margin: number = 72; // 1 inch margins
  private pageWidth: number;
  private pageHeight: number;
  private lineHeight: number = 16;

  constructor() {
    this.pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'letter'
    });
    
    this.pageWidth = this.pdf.internal.pageSize.getWidth();
    this.pageHeight = this.pdf.internal.pageSize.getHeight();
    this.currentY = this.margin;
  }

  async generatePDF(coverLetterData: CoverLetterData, userId: string): Promise<Blob> {
    // Get user contact information
    const contactInfo = await getUserContactInfo(userId);
    
    // Add header with contact info
    this.addHeader(contactInfo);
    
    // Add date
    this.addDate();
    
    // Add recipient info if available
    if (coverLetterData.job_descriptions) {
      this.addRecipient(coverLetterData.job_descriptions);
    }
    
    // Add subject line
    this.addSubject(coverLetterData.job_descriptions?.title || 'Job Application');
    
    // Add cover letter content
    this.addContent(coverLetterData.generated_text);
    
    // Add closing signature
    this.addClosing(contactInfo.name);
    
    return this.pdf.output('blob');
  }

  private addHeader(contactInfo: ContactInfo): void {
    this.pdf.setFont('times', 'normal');
    this.pdf.setFontSize(12);
    
    // Name (larger, bold)
    if (contactInfo.name) {
      this.pdf.setFont('times', 'bold');
      this.pdf.setFontSize(16);
      this.pdf.text(contactInfo.name, this.margin, this.currentY);
      this.currentY += 20;
    }
    
    // Contact details
    this.pdf.setFont('times', 'normal');
    this.pdf.setFontSize(11);
    
    if (contactInfo.email) {
      this.pdf.text(contactInfo.email, this.margin, this.currentY);
      this.currentY += this.lineHeight;
    }
    
    if (contactInfo.phone) {
      this.pdf.text(contactInfo.phone, this.margin, this.currentY);
      this.currentY += this.lineHeight;
    }
    
    if (contactInfo.location) {
      this.pdf.text(contactInfo.location, this.margin, this.currentY);
      this.currentY += this.lineHeight;
    }
    
    this.currentY += 20; // Space after header
  }

  private addDate(): void {
    const today = new Date();
    const dateString = today.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    this.pdf.setFont('times', 'normal');
    this.pdf.setFontSize(12);
    this.pdf.text(dateString, this.margin, this.currentY);
    this.currentY += 24; // Space after date
  }

  private addRecipient(jobInfo: { title: string; company: string }): void {
    this.pdf.setFont('times', 'normal');
    this.pdf.setFontSize(12);
    
    // Company name
    if (jobInfo.company) {
      this.pdf.text(`Hiring Manager`, this.margin, this.currentY);
      this.currentY += this.lineHeight;
      this.pdf.text(jobInfo.company, this.margin, this.currentY);
      this.currentY += 24; // Space after recipient
    }
  }

  private addSubject(jobTitle: string): void {
    this.pdf.setFont('times', 'bold');
    this.pdf.setFontSize(12);
    this.pdf.text(`Re: ${jobTitle}`, this.margin, this.currentY);
    this.currentY += 24; // Space after subject
  }

  private addContent(content: string): void {
    this.pdf.setFont('times', 'normal');
    this.pdf.setFontSize(12);
    
    // Split content into paragraphs
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim());
    
    paragraphs.forEach((paragraph, index) => {
      // Check if we need a new page
      if (this.currentY > this.pageHeight - this.margin - 100) {
        this.pdf.addPage();
        this.currentY = this.margin;
      }
      
      // Wrap text to fit within margins
      const lines = this.wrapText(paragraph.trim(), this.pageWidth - (2 * this.margin));
      
      lines.forEach((line, lineIndex) => {
        // Check for page break within paragraph
        if (this.currentY > this.pageHeight - this.margin - 50) {
          this.pdf.addPage();
          this.currentY = this.margin;
        }
        
        this.pdf.text(line, this.margin, this.currentY);
        this.currentY += this.lineHeight;
      });
      
      // Add space between paragraphs (except for the last one)
      if (index < paragraphs.length - 1) {
        this.currentY += 12;
      }
    });
    
    this.currentY += 24; // Space after content
  }

  private addClosing(name: string): void {
    this.pdf.setFont('times', 'normal');
    this.pdf.setFontSize(12);
    
    // Check if we need a new page
    if (this.currentY > this.pageHeight - this.margin - 100) {
      this.pdf.addPage();
      this.currentY = this.margin;
    }
    
    // Closing phrase
    this.pdf.text('Sincerely,', this.margin, this.currentY);
    this.currentY += 48; // Space for signature
    
    // Name
    if (name) {
      this.pdf.text(name, this.margin, this.currentY);
    }
  }

  private wrapText(text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    words.forEach(word => {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = this.pdf.getTextWidth(testLine);
      
      if (testWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines;
  }
}

// Utility function to generate and download cover letter PDF
export async function generateCoverLetterPDF(
  coverLetterData: CoverLetterData, 
  userId: string, 
  filename?: string
): Promise<void> {
  try {
    const generator = new CoverLetterPDFGenerator();
    const pdfBlob = await generator.generatePDF(coverLetterData, userId);
    
    // Create download link
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `cover-letter-${coverLetterData.job_descriptions?.company || 'application'}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error generating cover letter PDF:', error);
    throw error;
  }
}
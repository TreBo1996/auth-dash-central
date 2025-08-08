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

  /**
   * Sanitize text to prevent PDF generation issues
   */
  private sanitizeText(text: string): string {
    if (!text || typeof text !== 'string') return '';
    
    return text
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
      .replace(/[\u2018\u2019]/g, "'") // Replace smart quotes
      .replace(/[\u201C\u201D]/g, '"') // Replace smart quotes
      .replace(/[\u2013\u2014]/g, '-') // Replace em/en dashes
      .replace(/[\u2026]/g, '...') // Replace ellipsis
      .trim();
  }

  async generatePDF(coverLetterData: CoverLetterData, userId: string): Promise<Blob> {
    try {
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
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('Failed to generate PDF. Please try again.');
    }
  }

  private addHeader(contactInfo: ContactInfo): void {
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(12);
    
    // Name (larger, bold)
    const name = this.sanitizeText(contactInfo.name);
    if (name) {
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.setFontSize(16);
      this.pdf.text(name, this.margin, this.currentY);
      this.currentY += 20;
    }
    
    // Contact details
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(11);
    
    const email = this.sanitizeText(contactInfo.email);
    if (email) {
      this.pdf.text(email, this.margin, this.currentY);
      this.currentY += this.lineHeight;
    }
    
    const phone = this.sanitizeText(contactInfo.phone);
    if (phone) {
      this.pdf.text(phone, this.margin, this.currentY);
      this.currentY += this.lineHeight;
    }
    
    const location = this.sanitizeText(contactInfo.location);
    if (location) {
      this.pdf.text(location, this.margin, this.currentY);
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
    
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(12);
    this.pdf.text(this.sanitizeText(dateString), this.margin, this.currentY);
    this.currentY += 24; // Space after date
  }

  private addRecipient(jobInfo: { title: string; company: string }): void {
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(12);
    
    // Company name
    const company = this.sanitizeText(jobInfo.company);
    if (company) {
      this.pdf.text('Hiring Manager', this.margin, this.currentY);
      this.currentY += this.lineHeight;
      this.pdf.text(company, this.margin, this.currentY);
      this.currentY += 24; // Space after recipient
    }
  }

  private addSubject(jobTitle: string): void {
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(12);
    const sanitizedTitle = this.sanitizeText(jobTitle);
    this.pdf.text(`Re: ${sanitizedTitle}`, this.margin, this.currentY);
    this.currentY += 24; // Space after subject
  }

  private addContent(content: string): void {
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(12);
    
    // Sanitize and split content into paragraphs
    const sanitizedContent = this.sanitizeText(content);
    const paragraphs = sanitizedContent.split(/\n\s*\n/).filter(p => p.trim());
    
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
    this.pdf.setFont('helvetica', 'normal');
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
    const sanitizedName = this.sanitizeText(name);
    if (sanitizedName) {
      this.pdf.text(sanitizedName, this.margin, this.currentY);
    }
  }

  private wrapText(text: string, maxWidth: number): string[] {
    if (!text) return [];
    
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    words.forEach(word => {
      const sanitizedWord = this.sanitizeText(word);
      const testLine = currentLine ? `${currentLine} ${sanitizedWord}` : sanitizedWord;
      const testWidth = this.pdf.getTextWidth(testLine);
      
      if (testWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = sanitizedWord;
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
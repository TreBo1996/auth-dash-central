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
    this.currentY = this.margin + 20; // Start a bit lower for better spacing
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
    // Name (larger, bold, centered)
    const name = this.sanitizeText(contactInfo.name);
    if (name) {
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.setFontSize(18);
      const nameWidth = this.pdf.getTextWidth(name);
      const nameX = (this.pageWidth - nameWidth) / 2;
      this.pdf.text(name, nameX, this.currentY);
      this.currentY += 24;
    }
    
    // Contact details (centered, single line)
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(11);
    
    const contactParts = [];
    const email = this.sanitizeText(contactInfo.email);
    const phone = this.sanitizeText(contactInfo.phone);
    const location = this.sanitizeText(contactInfo.location);
    
    if (email) contactParts.push(email);
    if (phone) contactParts.push(phone);
    if (location) contactParts.push(location);
    
    if (contactParts.length > 0) {
      const contactLine = contactParts.join(' | ');
      const contactWidth = this.pdf.getTextWidth(contactLine);
      const contactX = (this.pageWidth - contactWidth) / 2;
      this.pdf.text(contactLine, contactX, this.currentY);
      this.currentY += 18;
    }
    
    this.currentY += 30; // Space after header
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
    this.pdf.setFontSize(11);
    this.lineHeight = 18; // Increase line height for better readability
    
    // Sanitize content and handle greeting separately
    const sanitizedContent = this.sanitizeText(content);
    
    // Split content into paragraphs using single line breaks
    const paragraphs = sanitizedContent.split(/\n+/).filter(p => p.trim());
    
    paragraphs.forEach((paragraph, index) => {
      // Check if we need a new page
      if (this.currentY > this.pageHeight - this.margin - 100) {
        this.pdf.addPage();
        this.currentY = this.margin + 20;
      }
      
      // Handle greeting line specially (e.g., "Dear Hiring Manager,")
      const isGreeting = paragraph.trim().toLowerCase().startsWith('dear');
      
      // Wrap text to fit within margins with better spacing
      const textWidth = this.pageWidth - (2 * this.margin);
      const lines = this.wrapText(paragraph.trim(), textWidth);
      
      lines.forEach((line, lineIndex) => {
        // Check for page break within paragraph
        if (this.currentY > this.pageHeight - this.margin - 50) {
          this.pdf.addPage();
          this.currentY = this.margin + 20;
        }
        
        this.pdf.text(line, this.margin, this.currentY);
        this.currentY += this.lineHeight;
      });
      
      // Add space between paragraphs - more space for greeting
      if (index < paragraphs.length - 1) {
        this.currentY += isGreeting ? 18 : 22; // Better paragraph spacing
      }
    });
    
    this.currentY += 30; // Space after content
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
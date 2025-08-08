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

  /**
   * Extract the actual letter body by removing any leading contact/header info from AI output
   */
  private extractLetterBody(text: string): string {
    const sanitized = this.sanitizeText(text || '');
    if (!sanitized) return '';

    const lines = sanitized.split('\n');

    // Patterns to detect start of letter
    const salutationRegex = /^(dear\b|to whom\b|hello\b|hi\b|greetings\b)/i;
    const subjectRegex = /^(re:|subject:)/i;
    const contactLikeRegexes = [
      /@/,
      /\b\+?\d[\d\s().-]{6,}\b/,
      /\b(street|st\.|ave\.|avenue|road|rd\.|blvd\.|suite|apt|apartment|\d{5}(?:-\d{4})?)\b/i,
    ];

    // Find first salutation line index
    let startIdx = lines.findIndex(l => salutationRegex.test(l.trim()));

    if (startIdx === -1) {
      // If no salutation, strip leading contact-like block until first empty line that follows contact-like info
      let encounteredContact = false;
      let i = 0;
      for (; i < lines.length; i++) {
        const t = lines[i].trim();
        if (!t) {
          if (encounteredContact) { i++; break; }
          continue;
        }
        if (subjectRegex.test(t) || contactLikeRegexes.some(rx => rx.test(t))) {
          encounteredContact = true;
          continue;
        }
        // If we already saw contact-like info and hit a non-contact line, break here
        if (encounteredContact) { break; }
      }
      startIdx = i;
    }

    const body = lines.slice(startIdx).join('\n').trim();

    // Quick cleanup of the very top lines to remove any lingering contact-like lines
    const bodyLines = body.split('\n');
    const cleanedTop = bodyLines.slice(0, 5).filter(l => {
      const t = l.trim();
      return !(subjectRegex.test(t) || contactLikeRegexes.some(rx => rx.test(t)));
    });
    const remainder = bodyLines.slice(5);
    const cleaned = (cleanedTop.join('\n') + (remainder.length ? '\n' + remainder.join('\n') : '')).trim();

    return cleaned || sanitized;
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
      
      // Add cover letter content (cleaned to avoid duplicated headers)
      const letterBody = this.extractLetterBody(coverLetterData.generated_text);
      this.addContent(letterBody);
      
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

    // Sanitize and render content preserving single newlines (pre-wrap behavior)
    const sanitized = this.sanitizeText(content);
    const rawLines = sanitized.split('\n');

    const ensureSpace = (extra: number = 0) => {
      if (this.currentY > this.pageHeight - this.margin - (50 + extra)) {
        this.pdf.addPage();
        this.currentY = this.margin;
      }
    };

    rawLines.forEach((rawLine) => {
      const line = rawLine.replace(/\s+$/g, ''); // trim right spaces to avoid creeping width

      if (line.trim() === '') {
        // Blank line -> explicit paragraph break
        ensureSpace();
        this.currentY += this.lineHeight; // create an empty line
        return;
      }

      const wrapped = this.wrapText(line, this.pageWidth - (2 * this.margin));
      wrapped.forEach((wLine) => {
        ensureSpace();
        this.pdf.text(wLine, this.margin, this.currentY);
        this.currentY += this.lineHeight;
      });
    });

    this.currentY += 12; // Small space after content
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
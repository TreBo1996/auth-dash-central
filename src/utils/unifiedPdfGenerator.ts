import jsPDF from 'jspdf';
import { StructuredResumeData } from '@/components/resume-templates/utils/fetchStructuredResumeData';
import { parseResumeContent } from '@/components/resume-templates/utils/parseResumeContent';

// Professional resume generator that creates pixel-perfect PDFs
export class ProfessionalResumeGenerator {
  private pdf: jsPDF;
  private currentY: number;
  private margin = 36; // 0.5 inch margins
  private pageWidth: number;
  private pageHeight: number;
  private usableWidth: number;
  private usableHeight: number;

  constructor() {
    this.pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'letter',
    });
    this.pageWidth = this.pdf.internal.pageSize.getWidth();
    this.pageHeight = this.pdf.internal.pageSize.getHeight();
    this.usableWidth = this.pageWidth - (this.margin * 2);
    this.usableHeight = this.pageHeight - (this.margin * 2);
    this.currentY = this.margin;
  }

  async generateResume(resumeData: string | StructuredResumeData, template: string = 'classic'): Promise<jsPDF> {
    console.log('ProfessionalResumeGenerator: Generating resume with template:', template);
    const data = typeof resumeData === 'string' ? parseResumeContent(resumeData) : resumeData;
    
    // Set up fonts based on template
    this.pdf.setFont('helvetica');
    
    // Generate sections with template-specific formatting
    this.addHeader(data, template);
    this.addSummary(data, template);
    this.addSkills(data, template);
    this.addExperience(data, template);
    this.addEducation(data, template);
    this.addCertifications(data, template);

    return this.pdf;
  }

  private checkPageBreak(spaceNeeded: number = 50): void {
    if (this.currentY + spaceNeeded > this.pageHeight - this.margin) {
      this.pdf.addPage();
      this.currentY = this.margin;
    }
  }

  private addHeader(data: StructuredResumeData, template: string = 'classic'): void {
    this.checkPageBreak(100);
    
    // Template-specific header styling
    if (template === 'executive') {
      // Executive template - banner style header with background
      const headerHeight = 60;
      this.pdf.setFillColor(240, 240, 240); // Light gray background
      this.pdf.rect(this.margin, this.currentY - 10, this.usableWidth, headerHeight, 'F');
      
      // Name - large, bold
      this.pdf.setFontSize(24);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.setTextColor(0, 0, 0);
      this.pdf.text(data.name.toUpperCase(), this.margin + 20, this.currentY + 15);
      
      // Contact info in banner
      this.pdf.setFontSize(10);
      this.pdf.setFont('helvetica', 'normal');
      const contact = [data.phone, data.email, data.location].filter(Boolean).join(' • ');
      this.pdf.text(contact, this.margin + 20, this.currentY + 35);
      
      this.currentY += headerHeight + 20;
      
    } else if (template === 'sidebar') {
      // Sidebar template - compact header for two-column layout
      this.pdf.setFontSize(20);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text(data.name.toUpperCase(), this.margin, this.currentY);
      this.currentY += 25;
      
      // Role smaller
      if (data.experience.length > 0) {
        this.pdf.setFontSize(12);
        this.pdf.setFont('helvetica', 'normal');
        this.pdf.text(data.experience[0].title, this.margin, this.currentY);
        this.currentY += 20;
      }
      
    } else if (template === 'modern') {
      // Modern template - clean, minimalist header
      this.pdf.setFontSize(26);
      this.pdf.setFont('helvetica', 'bold');
      const nameWidth = this.pdf.getTextWidth(data.name);
      this.pdf.text(data.name, (this.pageWidth - nameWidth) / 2, this.currentY);
      this.currentY += 35;
      
      // Contact info centered, modern style
      this.pdf.setFontSize(10);
      this.pdf.setFont('helvetica', 'normal');
      const contact = [data.phone, data.email, data.location].filter(Boolean).join(' | ');
      const contactWidth = this.pdf.getTextWidth(contact);
      this.pdf.text(contact, (this.pageWidth - contactWidth) / 2, this.currentY);
      this.currentY += 25;
      
    } else {
      // Classic template - traditional centered layout with lines
      this.pdf.setFontSize(22);
      this.pdf.setFont('helvetica', 'bold');
      const nameWidth = this.pdf.getTextWidth(data.name.toUpperCase());
      this.pdf.text(data.name.toUpperCase(), (this.pageWidth - nameWidth) / 2, this.currentY);
      this.currentY += 30;

      // Role - 11pt, bold, centered
      if (data.experience.length > 0) {
        this.pdf.setFontSize(11);
        const role = data.experience[0].title.toUpperCase();
        const roleWidth = this.pdf.getTextWidth(role);
        this.pdf.text(role, (this.pageWidth - roleWidth) / 2, this.currentY);
        this.currentY += 20;
      }

      // Line
      this.pdf.setLineWidth(0.75);
      this.pdf.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
      this.currentY += 16;

      // Contact info - 11pt, centered
      this.pdf.setFontSize(11);
      this.pdf.setFont('helvetica', 'normal');
      const contact = [data.phone, data.email, data.location].filter(Boolean).join(' · ');
      const contactWidth = this.pdf.getTextWidth(contact);
      this.pdf.text(contact, (this.pageWidth - contactWidth) / 2, this.currentY);
      this.currentY += 30;
    }
  }

  private addSummary(data: StructuredResumeData, template: string = 'classic'): void {
    if (!data.summary) return;
    
    this.checkPageBreak(80);

    this.pdf.setFontSize(11);
    this.pdf.setFont('helvetica', 'normal');
    
    const lines = this.pdf.splitTextToSize(data.summary, this.usableWidth);
    
    if (template === 'sidebar' || template === 'executive') {
      // Left-aligned for sidebar and executive templates
      lines.forEach((line: string) => {
        this.pdf.text(line, this.margin, this.currentY);
        this.currentY += 16;
      });
    } else {
      // Centered for classic and modern templates
      lines.forEach((line: string) => {
        const lineWidth = this.pdf.getTextWidth(line);
        this.pdf.text(line, (this.pageWidth - lineWidth) / 2, this.currentY);
        this.currentY += 16;
      });
    }
    this.currentY += 20;
  }

  private addSectionHeader(title: string, template: string = 'classic'): void {
    this.checkPageBreak(50);
    
    if (template === 'modern') {
      // Modern template - left-aligned with subtle styling
      this.pdf.setFontSize(14);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text(title.toUpperCase(), this.margin, this.currentY);
      this.currentY += 8;
      
      // Subtle underline
      this.pdf.setLineWidth(0.3);
      this.pdf.line(this.margin, this.currentY, this.margin + 60, this.currentY);
      this.currentY += 16;
      
    } else if (template === 'executive' || template === 'sidebar') {
      // Left-aligned section headers
      this.pdf.setFontSize(13);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text(title.toUpperCase(), this.margin, this.currentY);
      this.currentY += 12;
      
      // Line under header
      this.pdf.setLineWidth(0.5);
      this.pdf.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
      this.currentY += 16;
      
    } else {
      // Classic template - centered with full line
      this.pdf.setFontSize(13);
      this.pdf.setFont('helvetica', 'bold');
      const titleWidth = this.pdf.getTextWidth(title);
      this.pdf.text(title, (this.pageWidth - titleWidth) / 2, this.currentY);
      this.currentY += 12;
      
      // Line under header
      this.pdf.setLineWidth(0.5);
      this.pdf.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
      this.currentY += 16;
    }
  }

  private addSkills(data: StructuredResumeData, template: string = 'classic'): void {
    if (data.skills.length === 0) return;

    this.addSectionHeader('SKILLS', template);

    // Skills are already limited to 6 by fetchStructuredResumeData when limitSkills: true
    const allSkills: string[] = [];
    data.skills.forEach(group => allSkills.push(...group.items));

    this.pdf.setFontSize(11);
    this.pdf.setFont('helvetica', 'normal');

    if (template === 'modern') {
      // Modern template - tag-style skills in rows
      const skillsPerRow = 3;
      let currentRow = 0;
      let currentCol = 0;
      const colWidth = this.usableWidth / skillsPerRow;
      
      allSkills.forEach(skill => {
        this.checkPageBreak(20);
        const x = this.margin + (currentCol * colWidth);
        const y = this.currentY + (currentRow * 20);
        this.pdf.text(`• ${skill}`, x, y);
        
        currentCol++;
        if (currentCol >= skillsPerRow) {
          currentCol = 0;
          currentRow++;
        }
      });
      
      this.currentY += (currentRow + 1) * 20 + 10;
      
    } else {
      // Classic, Executive, Sidebar - two-column layout
      const mid = Math.ceil(allSkills.length / 2);
      const leftCol = allSkills.slice(0, mid);
      const rightCol = allSkills.slice(mid);

      const colWidth = this.usableWidth / 2 - 12;
      let leftY = this.currentY;
      let rightY = this.currentY;

      leftCol.forEach(skill => {
        this.checkPageBreak(20);
        this.pdf.text(`• ${skill}`, this.margin, leftY);
        leftY += 16;
      });

      rightCol.forEach(skill => {
        this.pdf.text(`• ${skill}`, this.margin + colWidth + 24, rightY);
        rightY += 16;
      });

      this.currentY = Math.max(leftY, rightY) + 20;
    }
  }

  private addExperience(data: StructuredResumeData, template: string = 'classic'): void {
    if (data.experience.length === 0) return;

    this.addSectionHeader('EXPERIENCE', template);

    data.experience.forEach((exp, index) => {
      this.checkPageBreak(100);
      
      // Title and dates formatting varies by template
      this.pdf.setFontSize(12);
      this.pdf.setFont('helvetica', 'bold');
      
      if (template === 'modern' || template === 'executive') {
        // Left-aligned title with dates on same line
        this.pdf.text(exp.title, this.margin, this.currentY);
        const dateText = exp.duration.replace('-', '–');
        const dateWidth = this.pdf.getTextWidth(dateText);
        this.pdf.text(dateText, this.pageWidth - this.margin - dateWidth, this.currentY);
        this.currentY += 18;
        
        // Company with subtle styling
        this.pdf.setFontSize(11);
        this.pdf.setFont('helvetica', 'italic');
        this.pdf.text(exp.company, this.margin, this.currentY);
        this.currentY += 20;
        
      } else {
        // Classic/sidebar - uppercase title, centered or left-aligned
        const titleText = template === 'classic' ? exp.title.toUpperCase() : exp.title;
        this.pdf.text(titleText, this.margin, this.currentY);
        
        const dateText = exp.duration.replace('-', '–');
        const dateWidth = this.pdf.getTextWidth(dateText);
        this.pdf.text(dateText, this.pageWidth - this.margin - dateWidth, this.currentY);
        this.currentY += 18;

        // Company
        this.pdf.setFontSize(12);
        this.pdf.setFont('helvetica', 'normal');
        this.pdf.text(exp.company, this.margin, this.currentY);
        this.currentY += 20;
      }

      // Bullets
      this.pdf.setFontSize(11);
      this.pdf.setFont('helvetica', 'normal');
      exp.bullets.forEach(bullet => {
        this.checkPageBreak(30);
        
        const bulletX = this.margin + 3;
        const textX = this.margin + 15;
        const lines = this.pdf.splitTextToSize(bullet, this.usableWidth - 15);
        
        lines.forEach((line: string, lineIndex: number) => {
          if (lineIndex === 0) {
            // Draw visual bullet circle aligned with text baseline
            this.pdf.circle(bulletX, this.currentY, 1.5, 'F');
          }
          // Position text aligned with bullet center
          this.pdf.text(line, textX, this.currentY - 3);
          this.currentY += 16;
        });
      });

      if (index < data.experience.length - 1) this.currentY += 16;
    });

    this.currentY += 20;
  }

  private addEducation(data: StructuredResumeData, template: string = 'classic'): void {
    if (data.education.length === 0) return;

    this.addSectionHeader('EDUCATION', template);

    data.education.forEach(edu => {
      this.checkPageBreak(50);
      this.pdf.setFontSize(12);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text(edu.degree, this.margin, this.currentY);
      
      const yearWidth = this.pdf.getTextWidth(edu.year);
      this.pdf.text(edu.year, this.pageWidth - this.margin - yearWidth, this.currentY);
      this.currentY += 18;

      this.pdf.setFont('helvetica', 'normal');
      this.pdf.text(edu.school, this.margin, this.currentY);
      this.currentY += 20;
    });
  }

  private addCertifications(data: StructuredResumeData, template: string = 'classic'): void {
    if (!data.certifications?.length) return;

    this.addSectionHeader('CERTIFICATIONS', template);

    data.certifications.forEach(cert => {
      this.checkPageBreak(50);
      this.pdf.setFontSize(12);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text(cert.name, this.margin, this.currentY);
      
      const yearWidth = this.pdf.getTextWidth(cert.year);
      this.pdf.text(cert.year, this.pageWidth - this.margin - yearWidth, this.currentY);
      this.currentY += 18;

      this.pdf.setFont('helvetica', 'normal');
      this.pdf.text(cert.issuer, this.margin, this.currentY);
      this.currentY += 20;
    });
  }
}

export const generateProfessionalPDF = async (
  templateId: string, 
  resumeData: string | StructuredResumeData, 
  fileName: string,
  colorScheme?: string
): Promise<void> => {
  console.log('UnifiedPdfGenerator: Starting PDF generation with template:', templateId);
  
  // Use template-specific generators for better visual accuracy
  try {
    if (templateId === 'modern-ats') {
      const { ModernATSPdfGenerator } = await import('./newPdfGenerators/ModernATSPdfGenerator');
      const generator = new ModernATSPdfGenerator();
      const data = typeof resumeData === 'string' ? parseResumeContent(resumeData) : resumeData;
      const pdf = await generator.generate(data, colorScheme);
      pdf.save(fileName);
    } else if (templateId === 'minimalist-executive') {
      const { MinimalistExecutivePdfGenerator } = await import('./newPdfGenerators/MinimalistExecutivePdfGenerator');
      const generator = new MinimalistExecutivePdfGenerator();
      const data = typeof resumeData === 'string' ? parseResumeContent(resumeData) : resumeData;
      const pdf = await generator.generate(data, colorScheme);
      pdf.save(fileName);
    } else if (templateId === 'creative-professional') {
      const { CreativeProfessionalPdfGenerator } = await import('./newPdfGenerators/CreativeProfessionalPdfGenerator');
      const generator = new CreativeProfessionalPdfGenerator();
      const data = typeof resumeData === 'string' ? parseResumeContent(resumeData) : resumeData;
      const pdf = await generator.generate(data, colorScheme);
      pdf.save(fileName);
    } else if (templateId === 'academic-research') {
      const { AcademicResearchPdfGenerator } = await import('./newPdfGenerators/AcademicResearchPdfGenerator');
      const generator = new AcademicResearchPdfGenerator();
      const data = typeof resumeData === 'string' ? parseResumeContent(resumeData) : resumeData;
      const pdf = await generator.generate(data, colorScheme);
      pdf.save(fileName);
    } else if (templateId === 'technical-engineering') {
      const { TechnicalEngineeringPdfGenerator } = await import('./newPdfGenerators/TechnicalEngineeringPdfGenerator');
      const generator = new TechnicalEngineeringPdfGenerator();
      const data = typeof resumeData === 'string' ? parseResumeContent(resumeData) : resumeData;
      const pdf = await generator.generate(data, colorScheme);
      pdf.save(fileName);
    } else {
      // Fallback to unified generator for other templates
      const generator = new ProfessionalResumeGenerator();
      const pdf = await generator.generateResume(resumeData, templateId);
      pdf.save(fileName);
    }
    
    console.log('UnifiedPdfGenerator: PDF generation completed for template:', templateId);
  } catch (error) {
    console.error('UnifiedPdfGenerator: Error generating PDF:', error);
    throw new Error('Failed to generate PDF: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
};
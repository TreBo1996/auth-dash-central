import jsPDF from 'jspdf';
import { StructuredResumeData } from '@/components/resume-templates/utils/fetchStructuredResumeData';

export class AcademicResearchPdfGenerator {
  private pdf: jsPDF;
  private currentY: number;
  private margin = 36;
  private pageWidth: number;
  private pageHeight: number;
  private usableWidth: number;

  constructor() {
    this.pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'letter',
    });
    this.pageWidth = this.pdf.internal.pageSize.getWidth();
    this.pageHeight = this.pdf.internal.pageSize.getHeight();
    this.usableWidth = this.pageWidth - (this.margin * 2);
    this.currentY = this.margin;
  }

  async generate(resumeData: StructuredResumeData): Promise<jsPDF> {
    console.log('AcademicResearchPdfGenerator: Starting generation');
    
    this.addHeader(resumeData);
    this.addResearchInterests(resumeData);
    this.addEducation(resumeData);
    this.addAcademicAppointments(resumeData);
    this.addResearchSkills(resumeData);
    this.addPublications();
    this.addConferencePresentations();
    this.addProfessionalDevelopment(resumeData);
    this.addFooter(resumeData);

    return this.pdf;
  }

  private checkPageBreak(spaceNeeded: number = 50): void {
    if (this.currentY + spaceNeeded > this.pageHeight - this.margin) {
      this.pdf.addPage();
      this.currentY = this.margin;
    }
  }

  private addHeader(data: StructuredResumeData): void {
    this.checkPageBreak(120);
    
    // Name - centered, traditional
    this.pdf.setFontSize(18);
    this.pdf.setFont('times', 'bold');
    const nameWidth = this.pdf.getTextWidth(data.name);
    this.pdf.text(data.name, (this.pageWidth - nameWidth) / 2, this.currentY);
    this.currentY += 25;

    // Contact info - centered, small
    this.pdf.setFontSize(11);
    this.pdf.setFont('times', 'normal');
    const contact = [data.phone, data.email, data.location].filter(Boolean).join(' • ');
    const contactWidth = this.pdf.getTextWidth(contact);
    this.pdf.text(contact, (this.pageWidth - contactWidth) / 2, this.currentY);
    this.currentY += 15;

    // Title/Position - centered, italic
    if (data.experience.length > 0) {
      this.pdf.setFontSize(12);
      this.pdf.setFont('times', 'italic');
      const titleWidth = this.pdf.getTextWidth(data.experience[0].title);
      this.pdf.text(data.experience[0].title, (this.pageWidth - titleWidth) / 2, this.currentY);
      this.currentY += 20;
    }

    // Traditional line separator
    this.pdf.setLineWidth(1);
    this.pdf.setDrawColor(0, 0, 0);
    this.pdf.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    this.currentY += 25;
  }

  private addResearchInterests(data: StructuredResumeData): void {
    if (!data.summary) return;
    
    this.checkPageBreak(80);
    this.addSectionHeader('RESEARCH INTERESTS');
    
    this.pdf.setFontSize(11);
    this.pdf.setFont('times', 'normal');
    const lines = this.pdf.splitTextToSize(data.summary, this.usableWidth);
    
    lines.forEach((line: string) => {
      this.checkPageBreak(20);
      this.pdf.text(line, this.margin, this.currentY);
      this.currentY += 14;
    });
    this.currentY += 15;
  }

  private addEducation(data: StructuredResumeData): void {
    if (data.education.length === 0) return;

    this.checkPageBreak(80);
    this.addSectionHeader('EDUCATION');

    data.education.forEach(edu => {
      this.checkPageBreak(50);
      
      // Degree and year on same line
      this.pdf.setFontSize(11);
      this.pdf.setFont('times', 'bold');
      this.pdf.text(edu.degree, this.margin, this.currentY);
      
      const yearWidth = this.pdf.getTextWidth(edu.year);
      this.pdf.text(edu.year, this.pageWidth - this.margin - yearWidth, this.currentY);
      this.currentY += 16;

      // Institution
      this.pdf.setFont('times', 'italic');
      this.pdf.text(edu.school, this.margin, this.currentY);
      this.currentY += 20;
    });
  }

  private addAcademicAppointments(data: StructuredResumeData): void {
    if (data.experience.length === 0) return;

    this.checkPageBreak(100);
    this.addSectionHeader('ACADEMIC APPOINTMENTS');

    data.experience.forEach((exp, index) => {
      this.checkPageBreak(100);
      
      // Position and dates
      this.pdf.setFontSize(11);
      this.pdf.setFont('times', 'bold');
      this.pdf.text(exp.title, this.margin, this.currentY);
      
      const dateWidth = this.pdf.getTextWidth(exp.duration);
      this.pdf.text(exp.duration, this.pageWidth - this.margin - dateWidth, this.currentY);
      this.currentY += 16;

      // Institution
      this.pdf.setFont('times', 'italic');
      this.pdf.text(exp.company, this.margin, this.currentY);
      this.currentY += 18;

      // Responsibilities/achievements
      this.pdf.setFont('times', 'normal');
      exp.bullets.forEach(bullet => {
        this.checkPageBreak(25);
        const lines = this.pdf.splitTextToSize(`• ${bullet}`, this.usableWidth - 10);
        lines.forEach((line: string, lineIndex: number) => {
          const x = lineIndex === 0 ? this.margin : this.margin + 10;
          this.pdf.text(line, x, this.currentY);
          this.currentY += 14;
        });
      });

      if (index < data.experience.length - 1) this.currentY += 15;
    });
  }

  private addResearchSkills(data: StructuredResumeData): void {
    if (data.skills.length === 0) return;

    this.checkPageBreak(100);
    this.addSectionHeader('RESEARCH SKILLS & EXPERTISE');

    data.skills.forEach((skillGroup, index) => {
      this.checkPageBreak(40);
      
      // Category
      this.pdf.setFontSize(11);
      this.pdf.setFont('times', 'bold');
      this.pdf.text(`${skillGroup.category}:`, this.margin, this.currentY);
      this.currentY += 16;

      // Skills list
      this.pdf.setFont('times', 'normal');
      const skillsText = skillGroup.items.join(', ');
      const lines = this.pdf.splitTextToSize(skillsText, this.usableWidth - 20);
      lines.forEach((line: string) => {
        this.checkPageBreak(20);
        this.pdf.text(line, this.margin + 20, this.currentY);
        this.currentY += 14;
      });
      
      if (index < data.skills.length - 1) this.currentY += 10;
    });
  }

  private addPublications(): void {
    this.checkPageBreak(60);
    this.addSectionHeader('PUBLICATIONS');
    
    this.pdf.setFontSize(11);
    this.pdf.setFont('times', 'italic');
    const placeholderText = 'Publications section would be populated from structured academic data including journal articles, book chapters, and conference proceedings.';
    const lines = this.pdf.splitTextToSize(placeholderText, this.usableWidth);
    
    lines.forEach((line: string) => {
      this.checkPageBreak(20);
      this.pdf.text(line, this.margin, this.currentY);
      this.currentY += 14;
    });
    this.currentY += 15;
  }

  private addConferencePresentations(): void {
    this.checkPageBreak(60);
    this.addSectionHeader('CONFERENCE PRESENTATIONS');
    
    this.pdf.setFontSize(11);
    this.pdf.setFont('times', 'italic');
    const placeholderText = 'Conference presentations would include invited talks, paper presentations, and poster sessions at academic conferences.';
    const lines = this.pdf.splitTextToSize(placeholderText, this.usableWidth);
    
    lines.forEach((line: string) => {
      this.checkPageBreak(20);
      this.pdf.text(line, this.margin, this.currentY);
      this.currentY += 14;
    });
    this.currentY += 15;
  }

  private addProfessionalDevelopment(data: StructuredResumeData): void {
    if (!data.certifications?.length) return;

    this.checkPageBreak(80);
    this.addSectionHeader('PROFESSIONAL DEVELOPMENT');

    data.certifications.forEach(cert => {
      this.checkPageBreak(50);
      
      this.pdf.setFontSize(11);
      this.pdf.setFont('times', 'bold');
      this.pdf.text(cert.name, this.margin, this.currentY);
      
      const yearWidth = this.pdf.getTextWidth(cert.year);
      this.pdf.text(cert.year, this.pageWidth - this.margin - yearWidth, this.currentY);
      this.currentY += 16;

      this.pdf.setFont('times', 'italic');
      this.pdf.text(cert.issuer, this.margin, this.currentY);
      this.currentY += 20;
    });
  }

  private addFooter(data: StructuredResumeData): void {
    this.checkPageBreak(30);
    
    this.pdf.setLineWidth(0.5);
    this.pdf.setDrawColor(150, 150, 150);
    this.pdf.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    this.currentY += 15;
    
    this.pdf.setFontSize(9);
    this.pdf.setFont('times', 'normal');
    this.pdf.setTextColor(100, 100, 100);
    const footerText = `Curriculum Vitae - ${data.name}`;
    const footerWidth = this.pdf.getTextWidth(footerText);
    this.pdf.text(footerText, (this.pageWidth - footerWidth) / 2, this.currentY);
    this.pdf.setTextColor(0, 0, 0);
  }

  private addSectionHeader(title: string): void {
    this.checkPageBreak(50);
    
    this.pdf.setFontSize(12);
    this.pdf.setFont('times', 'bold');
    const titleWidth = this.pdf.getTextWidth(title);
    this.pdf.text(title, (this.pageWidth - titleWidth) / 2, this.currentY);
    this.currentY += 10;
    
    // Traditional underline
    this.pdf.setLineWidth(0.5);
    this.pdf.setDrawColor(0, 0, 0);
    this.pdf.line((this.pageWidth - titleWidth) / 2, this.currentY, 
                   (this.pageWidth + titleWidth) / 2, this.currentY);
    this.currentY += 20;
  }
}
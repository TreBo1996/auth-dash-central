import jsPDF from 'jspdf';
import { StructuredResumeData } from '@/components/resume-templates/utils/fetchStructuredResumeData';
import { newTemplateConfigs } from '@/components/resume-templates/configs/newTemplateConfigs';

export class MinimalistExecutivePdfGenerator {
  private pdf: jsPDF;
  private currentY: number;
  private margin = 36; // 0.5 inch margins
  private pageWidth: number;
  private pageHeight: number;
  private usableWidth: number;
  private config = newTemplateConfigs['minimalist-executive'];
  private colors: any;

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

  async generate(resumeData: StructuredResumeData, colorScheme?: string): Promise<jsPDF> {
    console.log('MinimalistExecutivePdfGenerator: Starting generation');
    
    // Set color scheme
    this.setColorScheme(colorScheme);
    
    this.addHeader(resumeData);
    this.addExecutiveSummary(resumeData);
    this.addCoreCompetencies(resumeData);
    this.addProfessionalExperience(resumeData);
    this.addEducation(resumeData);
    this.addCertifications(resumeData);

    return this.pdf;
  }

  private setColorScheme(colorSchemeId?: string): void {
    const scheme = colorSchemeId 
      ? this.config.colorSchemes.find(cs => cs.id === colorSchemeId)
      : this.config.colorSchemes.find(cs => cs.id === this.config.defaultColorScheme);
    
    this.colors = scheme ? scheme.colors : this.config.colors;
  }

  private parseHSL(hsl: string): [number, number, number] {
    const match = hsl.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
    if (!match) return [0, 0, 0];
    
    const h = parseInt(match[1]);
    const s = parseInt(match[2]) / 100;
    const l = parseInt(match[3]) / 100;
    
    // Convert HSL to RGB
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;
    
    let r = 0, g = 0, b = 0;
    if (h < 60) [r, g, b] = [c, x, 0];
    else if (h < 120) [r, g, b] = [x, c, 0];
    else if (h < 180) [r, g, b] = [0, c, x];
    else if (h < 240) [r, g, b] = [0, x, c];
    else if (h < 300) [r, g, b] = [x, 0, c];
    else [r, g, b] = [c, 0, x];
    
    return [
      Math.round((r + m) * 255),
      Math.round((g + m) * 255), 
      Math.round((b + m) * 255)
    ];
  }

  private checkPageBreak(spaceNeeded: number = 50): void {
    if (this.currentY + spaceNeeded > this.pageHeight - this.margin) {
      this.pdf.addPage();
      this.currentY = this.margin;
    }
  }

  private addHeader(data: StructuredResumeData): void {
    this.checkPageBreak(120);
    
    // Name - centered, large, serif
    this.pdf.setFontSize(24);
    this.pdf.setFont('times', 'bold');
    const nameWidth = this.pdf.getTextWidth(data.name.toUpperCase());
    this.pdf.text(data.name.toUpperCase(), (this.pageWidth - nameWidth) / 2, this.currentY);
    this.currentY += 30;

    // Title - centered, medium
    if (data.experience.length > 0) {
      this.pdf.setFontSize(14);
      this.pdf.setFont('helvetica', 'normal');
      const titleWidth = this.pdf.getTextWidth(data.experience[0].title);
      this.pdf.text(data.experience[0].title, (this.pageWidth - titleWidth) / 2, this.currentY);
      this.currentY += 25;
    }

    // Contact info - centered, small
    this.pdf.setFontSize(11);
    this.pdf.setFont('helvetica', 'normal');
    const contact = [data.phone, data.email, data.location].filter(Boolean).join(' • ');
    const contactWidth = this.pdf.getTextWidth(contact);
    this.pdf.text(contact, (this.pageWidth - contactWidth) / 2, this.currentY);
    this.currentY += 20;

    // Elegant line separator
    this.pdf.setLineWidth(0.5);
    this.pdf.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    this.currentY += 30;
  }

  private addExecutiveSummary(data: StructuredResumeData): void {
    if (!data.summary) return;
    
    this.checkPageBreak(80);
    this.addSectionHeader('EXECUTIVE SUMMARY');
    
    this.pdf.setFontSize(11);
    this.pdf.setFont('helvetica', 'normal');
    const lines = this.pdf.splitTextToSize(data.summary, this.usableWidth - 40);
    
    lines.forEach((line: string) => {
      this.checkPageBreak(20);
      const lineWidth = this.pdf.getTextWidth(line);
      this.pdf.text(line, (this.pageWidth - lineWidth) / 2, this.currentY);
      this.currentY += 16;
    });
    this.currentY += 20;
  }

  private addCoreCompetencies(data: StructuredResumeData): void {
    if (data.skills.length === 0) return;

    this.checkPageBreak(100);
    this.addSectionHeader('CORE COMPETENCIES');

    const allSkills = data.skills.flatMap(group => group.items);
    const mid = Math.ceil(allSkills.length / 2);
    const leftCol = allSkills.slice(0, mid);
    const rightCol = allSkills.slice(mid);

    this.pdf.setFontSize(11);
    this.pdf.setFont('helvetica', 'normal');

    const colWidth = this.usableWidth / 2 - 20;
    const leftX = this.margin + 40;
    const rightX = this.margin + this.usableWidth / 2 + 20;
    
    let leftY = this.currentY;
    let rightY = this.currentY;

    // Left column
    leftCol.forEach(skill => {
      this.checkPageBreak(20);
      this.pdf.circle(leftX - 8, leftY - 3, 2, 'F');
      this.pdf.text(skill, leftX, leftY);
      leftY += 16;
    });

    // Right column
    rightCol.forEach(skill => {
      this.pdf.circle(rightX - 8, rightY - 3, 2, 'F');
      this.pdf.text(skill, rightX, rightY);
      rightY += 16;
    });

    this.currentY = Math.max(leftY, rightY) + 20;
  }

  private addProfessionalExperience(data: StructuredResumeData): void {
    if (data.experience.length === 0) return;

    this.checkPageBreak(100);
    this.addSectionHeader('PROFESSIONAL EXPERIENCE');

    data.experience.forEach((exp, index) => {
      this.checkPageBreak(120);
      
      // Position and dates
      this.pdf.setFontSize(12);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text(exp.title.toUpperCase(), this.margin, this.currentY);
      
      const dateWidth = this.pdf.getTextWidth(exp.duration);
      this.pdf.text(exp.duration, this.pageWidth - this.margin - dateWidth, this.currentY);
      this.currentY += 18;

      // Company
      this.pdf.setFontSize(12);
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.text(exp.company, this.margin, this.currentY);
      this.currentY += 20;

      // Bullets with elegant dots
      this.pdf.setFontSize(11);
      exp.bullets.forEach(bullet => {
        this.checkPageBreak(30);
        this.pdf.circle(this.margin + 8, this.currentY - 3, 1.5, 'F');
        const lines = this.pdf.splitTextToSize(bullet, this.usableWidth - 20);
        lines.forEach((line: string, lineIndex: number) => {
          const x = lineIndex === 0 ? this.margin + 16 : this.margin + 16;
          this.pdf.text(line, x, this.currentY);
          this.currentY += 16;
        });
      });

      if (index < data.experience.length - 1) this.currentY += 20;
    });

    this.currentY += 20;
  }

  private addEducation(data: StructuredResumeData): void {
    if (data.education.length === 0) return;

    this.checkPageBreak(80);
    this.addSectionHeader('EDUCATION');

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

  private addCertifications(data: StructuredResumeData): void {
    if (!data.certifications?.length) return;

    this.checkPageBreak(80);
    this.addSectionHeader('CERTIFICATIONS');

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

  private addSectionHeader(title: string): void {
    this.checkPageBreak(50);
    
    this.pdf.setFontSize(14);
    this.pdf.setFont('times', 'bold');
    const titleWidth = this.pdf.getTextWidth(title);
    this.pdf.text(title, (this.pageWidth - titleWidth) / 2, this.currentY);
    this.currentY += 12;
    
    // Elegant underline
    this.pdf.setLineWidth(0.5);
    this.pdf.line((this.pageWidth - titleWidth) / 2, this.currentY, 
                   (this.pageWidth + titleWidth) / 2, this.currentY);
    this.currentY += 20;
  }
}
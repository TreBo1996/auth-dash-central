import jsPDF from 'jspdf';
import { StructuredResumeData } from '@/components/resume-templates/utils/fetchStructuredResumeData';
import { newTemplateConfigs } from '@/components/resume-templates/configs/newTemplateConfigs';

export class ModernATSPdfGenerator {
  private pdf: jsPDF;
  private currentY: number;
  private margin = 36;
  private pageWidth: number;
  private pageHeight: number;
  private usableWidth: number;
  private config = newTemplateConfigs['modern-ats'];
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
    console.log('ModernATSPdfGenerator: Starting generation');
    
    // Set color scheme
    this.setColorScheme(colorScheme);
    
    this.addHeader(resumeData);
    this.addProfessionalSummary(resumeData);
    this.addCoreSkills(resumeData);
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
    this.checkPageBreak(100);
    
    // Name - left-aligned, large
    this.pdf.setFontSize(22);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text(data.name, this.margin, this.currentY);
    this.currentY += 28;

    // Title - left-aligned, medium
    if (data.experience.length > 0) {
      this.pdf.setFontSize(14);
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.text(data.experience[0].title, this.margin, this.currentY);
      this.currentY += 25;
    }

    // Contact info header bar
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'normal');
    
    let contactY = this.currentY;
    const contactItems = [
      { label: 'Phone:', value: data.phone },
      { label: 'Email:', value: data.email },
      { label: 'Location:', value: data.location }
    ].filter(item => item.value);

    const itemWidth = this.usableWidth / contactItems.length;
    contactItems.forEach((item, index) => {
      const x = this.margin + (index * itemWidth);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text(item.label, x, contactY);
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.text(item.value!, x + this.pdf.getTextWidth(item.label) + 3, contactY);
    });

    this.currentY += 20;
    
    // Accent line
    this.pdf.setLineWidth(2);
    const [r, g, b] = this.parseHSL(this.colors.accent);
    this.pdf.setDrawColor(r, g, b);
    this.pdf.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    this.currentY += 25;
  }

  private addProfessionalSummary(data: StructuredResumeData): void {
    if (!data.summary) return;
    
    this.checkPageBreak(80);
    this.addSectionHeader('PROFESSIONAL SUMMARY');
    
    this.pdf.setFontSize(11);
    this.pdf.setFont('helvetica', 'normal');
    const lines = this.pdf.splitTextToSize(data.summary, this.usableWidth);
    
    lines.forEach((line: string) => {
      this.checkPageBreak(20);
      this.pdf.text(line, this.margin, this.currentY);
      this.currentY += 16;
    });
    this.currentY += 20;
  }

  private addCoreSkills(data: StructuredResumeData): void {
    if (data.skills.length === 0) return;

    this.checkPageBreak(100);
    this.addSectionHeader('CORE SKILLS');

    const allSkills = data.skills.flatMap(group => group.items);
    this.pdf.setFontSize(11);
    this.pdf.setFont('helvetica', 'normal');

    // Three-column layout for ATS compatibility
    const cols = 3;
    const colWidth = this.usableWidth / cols;
    let currentCol = 0;
    let startY = this.currentY;

    allSkills.forEach((skill, index) => {
      const x = this.margin + (currentCol * colWidth);
      const y = this.currentY;
      
      // Small bullet point
      const [r, g, b] = this.parseHSL(this.colors.accent);
      this.pdf.setFillColor(r, g, b);
      this.pdf.circle(x + 4, y - 3, 1.5, 'F');
      this.pdf.text(skill, x + 12, y);
      
      currentCol++;
      if (currentCol >= cols) {
        currentCol = 0;
        this.currentY += 16;
      }
    });
    
    if (currentCol > 0) {
      this.currentY += 16;
    }
    this.currentY += 20;
  }

  private addProfessionalExperience(data: StructuredResumeData): void {
    if (data.experience.length === 0) return;

    this.checkPageBreak(100);
    this.addSectionHeader('PROFESSIONAL EXPERIENCE');

    data.experience.forEach((exp, index) => {
      this.checkPageBreak(120);
      
      // Position and company
      this.pdf.setFontSize(12);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text(exp.title, this.margin, this.currentY);
      
      // Date badge
      this.pdf.setFontSize(10);
      this.pdf.setFont('helvetica', 'normal');
      const [r, g, b] = this.parseHSL(this.colors.accent);
      this.pdf.setFillColor(r, g, b, 0.1);
      const dateWidth = this.pdf.getTextWidth(exp.duration) + 12;
      this.pdf.rect(this.pageWidth - this.margin - dateWidth, this.currentY - 10, dateWidth, 14, 'F');
      this.pdf.setTextColor(r, g, b);
      this.pdf.text(exp.duration, this.pageWidth - this.margin - dateWidth + 6, this.currentY);
      this.pdf.setTextColor(0, 0, 0);
      this.currentY += 18;

      // Company
      this.pdf.setFontSize(12);
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.text(exp.company, this.margin, this.currentY);
      this.currentY += 20;

      // Bullets
      this.pdf.setFontSize(11);
      exp.bullets.forEach(bullet => {
        this.checkPageBreak(30);
        const [r, g, b] = this.parseHSL(this.colors.accent);
        this.pdf.setFillColor(r, g, b);
        this.pdf.circle(this.margin + 6, this.currentY - 3, 1.5, 'F');
        const lines = this.pdf.splitTextToSize(bullet, this.usableWidth - 20);
        lines.forEach((line: string, lineIndex: number) => {
          const x = lineIndex === 0 ? this.margin + 15 : this.margin + 15;
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
      
      // Year badge
      this.pdf.setFontSize(10);
      this.pdf.setFont('helvetica', 'normal');
      const [r, g, b] = this.parseHSL(this.colors.accent);
      this.pdf.setFillColor(r, g, b, 0.1);
      const yearWidth = this.pdf.getTextWidth(edu.year) + 12;
      this.pdf.rect(this.pageWidth - this.margin - yearWidth, this.currentY - 10, yearWidth, 14, 'F');
      this.pdf.setTextColor(r, g, b);
      this.pdf.text(edu.year, this.pageWidth - this.margin - yearWidth + 6, this.currentY);
      this.pdf.setTextColor(0, 0, 0);
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
      
      // Year badge
      this.pdf.setFontSize(10);
      this.pdf.setFont('helvetica', 'normal');
      const [r, g, b] = this.parseHSL(this.colors.accent);
      this.pdf.setFillColor(r, g, b, 0.1);
      const yearWidth = this.pdf.getTextWidth(cert.year) + 12;
      this.pdf.rect(this.pageWidth - this.margin - yearWidth, this.currentY - 10, yearWidth, 14, 'F');
      this.pdf.setTextColor(r, g, b);
      this.pdf.text(cert.year, this.pageWidth - this.margin - yearWidth + 6, this.currentY);
      this.pdf.setTextColor(0, 0, 0);
      this.currentY += 18;

      this.pdf.setFont('helvetica', 'normal');
      this.pdf.text(cert.issuer, this.margin, this.currentY);
      this.currentY += 20;
    });
  }

  private addSectionHeader(title: string): void {
    this.checkPageBreak(50);
    
    this.pdf.setFontSize(14);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text(title, this.margin, this.currentY);
    this.currentY += 12;
    
    // Section underline
    this.pdf.setLineWidth(0.5);
    this.pdf.setDrawColor(200, 200, 200);
    this.pdf.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    this.currentY += 20;
  }
}
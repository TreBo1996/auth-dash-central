import jsPDF from 'jspdf';
import { StructuredResumeData } from '@/components/resume-templates/utils/fetchStructuredResumeData';
import { newTemplateConfigs } from '@/components/resume-templates/configs/newTemplateConfigs';

export class CreativeProfessionalPdfGenerator {
  private pdf: jsPDF;
  private currentY: number;
  private margin = 36;
  private pageWidth: number;
  private pageHeight: number;
  private usableWidth: number;
  private config = newTemplateConfigs['creative-professional'];
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
    console.log('CreativeProfessionalPdfGenerator: Starting generation');
    
    // Set color scheme
    this.setColorScheme(colorScheme);
    
    this.addHeader(resumeData);
    this.addProfessionalProfile(resumeData);
    this.addSkillsExpertise(resumeData);
    this.addProfessionalExperience(resumeData);
    this.addEducationCertifications(resumeData);

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

  private isMonochromeScheme(): boolean {
    const accentMatch = this.colors.accent.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
    if (!accentMatch) return false;
    
    const saturation = parseInt(accentMatch[2]);
    return saturation <= 5; // Consider schemes with very low saturation as monochrome
  }

  private checkPageBreak(spaceNeeded: number = 50): void {
    if (this.currentY + spaceNeeded > this.pageHeight - this.margin) {
      this.pdf.addPage();
      this.currentY = this.margin;
    }
  }

  private addHeader(data: StructuredResumeData): void {
    this.checkPageBreak(100);
    
    // Accent bar
    const [r, g, b] = this.parseHSL(this.colors.accent);
    this.pdf.setFillColor(r, g, b);
    this.pdf.rect(this.margin, this.currentY, 4, 80, 'F');
    
    const headerX = this.margin + 15;
    
    // Name
    this.pdf.setFontSize(22);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text(data.name, headerX, this.currentY + 20);

    // Title with accent color
    if (data.experience.length > 0) {
      this.pdf.setFontSize(14);
      this.pdf.setFont('helvetica', 'normal');
      const [r, g, b] = this.parseHSL(this.colors.accent);
      this.pdf.setTextColor(r, g, b);
      this.pdf.text(data.experience[0].title, headerX, this.currentY + 45);
      this.pdf.setTextColor(0, 0, 0);
    }

    // Contact info
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'normal');
    const contact = [data.phone, data.email, data.location].filter(Boolean).join(' • ');
    this.pdf.text(contact, headerX, this.currentY + 65);

    this.currentY += 100;
  }

  private addProfessionalProfile(data: StructuredResumeData): void {
    if (!data.summary) return;
    
    this.checkPageBreak(80);
    this.addSectionHeader('PROFESSIONAL PROFILE');
    
    this.pdf.setFontSize(11);
    this.pdf.setFont('helvetica', 'normal');
    const lines = this.pdf.splitTextToSize(data.summary, this.usableWidth - 30);
    
    lines.forEach((line: string) => {
      this.checkPageBreak(20);
      this.pdf.text(line, this.margin + 30, this.currentY);
      this.currentY += 16;
    });
    this.currentY += 20;
  }

  private addSkillsExpertise(data: StructuredResumeData): void {
    if (data.skills.length === 0) return;

    this.checkPageBreak(100);
    this.addSectionHeader('SKILLS & EXPERTISE');

    const startY = this.currentY;
    const leftMargin = this.margin + 30;

    data.skills.forEach((skillGroup, groupIndex) => {
      this.checkPageBreak(60);
      
      // Category header
      this.pdf.setFontSize(11);
      this.pdf.setFont('helvetica', 'bold');
      const [r, g, b] = this.parseHSL(this.colors.accent);
      this.pdf.setTextColor(r, g, b);
      this.pdf.text(skillGroup.category, leftMargin, this.currentY);
      this.pdf.setTextColor(0, 0, 0);
      this.currentY += 18;

      // Skills as styled tags
      this.pdf.setFontSize(10);
      this.pdf.setFont('helvetica', 'normal');
      
      let x = leftMargin;
      let y = this.currentY;
      const tagHeight = 14;
      const tagSpacing = 8;

      skillGroup.items.forEach((skill, index) => {
        const tagWidth = this.pdf.getTextWidth(skill) + 12;
        
        // Check if tag fits on current line
        if (x + tagWidth > this.pageWidth - this.margin) {
          x = leftMargin;
          y += tagHeight + 4;
        }

        // Tag background
        const [r, g, b] = this.parseHSL(this.colors.accent);
        this.pdf.setFillColor(r, g, b, 0.1);
        this.pdf.roundedRect(x, y - 10, tagWidth, tagHeight, 2, 2, 'F');
        
        // Tag border
        this.pdf.setDrawColor(r, g, b, 0.3);
        this.pdf.setLineWidth(0.5);
        this.pdf.roundedRect(x, y - 10, tagWidth, tagHeight, 2, 2, 'S');
        
        // Tag text
        this.pdf.setTextColor(r, g, b);
        this.pdf.text(skill, x + 6, y);
        this.pdf.setTextColor(0, 0, 0);
        
        x += tagWidth + tagSpacing;
      });

      this.currentY = y + 25;
    });
  }

  private addProfessionalExperience(data: StructuredResumeData): void {
    if (data.experience.length === 0) return;

    this.checkPageBreak(100);
    this.addSectionHeader('PROFESSIONAL EXPERIENCE');

    const leftMargin = this.margin + 30;
    const timelineX = this.margin + 18;

    data.experience.forEach((exp, index) => {
      this.checkPageBreak(120);
      
      // Timeline dot
      const [r2, g2, b2] = this.parseHSL(this.colors.accent);
      this.pdf.setFillColor(r2, g2, b2);
      this.pdf.circle(timelineX, this.currentY + 5, 6, 'F');
      this.pdf.setFillColor(255, 255, 255);
      this.pdf.circle(timelineX, this.currentY + 5, 3, 'F');
      
      // Timeline line (except for last item)
      if (index < data.experience.length - 1) {
        this.pdf.setDrawColor(200, 200, 200);
        this.pdf.setLineWidth(1);
        this.pdf.line(timelineX, this.currentY + 12, timelineX, this.currentY + 100);
      }
      
      // Position and company
      this.pdf.setFontSize(12);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text(exp.title, leftMargin, this.currentY);
      
      this.pdf.setFontSize(11);
      this.pdf.setFont('helvetica', 'normal');
      const [r3, g3, b3] = this.parseHSL(this.colors.accent);
      this.pdf.setTextColor(r3, g3, b3);
      this.pdf.text(exp.company, leftMargin, this.currentY + 16);
      this.pdf.setTextColor(0, 0, 0);

      // Duration - simple colored text
      this.pdf.setFontSize(9);
      this.pdf.setFont('helvetica', 'normal');
      const [r, g, b] = this.parseHSL(this.colors.accent);
      this.pdf.setTextColor(r, g, b);
      this.pdf.text(exp.duration, this.pageWidth - this.margin - this.pdf.getTextWidth(exp.duration), this.currentY);
      this.pdf.setTextColor(0, 0, 0);
      
      this.currentY += 35;

      // Bullets
      this.pdf.setFontSize(11);
      this.pdf.setFont('helvetica', 'normal');
      exp.bullets.forEach(bullet => {
        this.checkPageBreak(30);
        
        // Accent bullet point
        const [r4, g4, b4] = this.parseHSL(this.colors.accent);
        this.pdf.setFillColor(r4, g4, b4);
        this.pdf.circle(leftMargin + 6, this.currentY - 3, 1.5, 'F');
        
        const lines = this.pdf.splitTextToSize(bullet, this.usableWidth - 50);
        lines.forEach((line: string, lineIndex: number) => {
          this.pdf.text(line, leftMargin + 15, this.currentY);
          this.currentY += 16;
        });
      });

      this.currentY += 20;
    });
  }

  private addEducationCertifications(data: StructuredResumeData): void {
    const hasEducation = data.education.length > 0;
    const hasCertifications = data.certifications && data.certifications.length > 0;
    
    if (!hasEducation && !hasCertifications) return;

    this.checkPageBreak(100);
    
    // Two-column layout for education and certifications
    const colWidth = this.usableWidth / 2 - 20;
    const leftCol = this.margin + 30;
    const rightCol = this.margin + this.usableWidth / 2 + 10;

    // Education
    if (hasEducation) {
      this.addSmallSectionHeader('EDUCATION', leftCol);
      let eduY = this.currentY + 20;
      
      data.education.forEach(edu => {
        this.pdf.setFontSize(11);
        this.pdf.setFont('helvetica', 'bold');
        this.pdf.text(edu.degree, leftCol, eduY);
        eduY += 14;
        
        this.pdf.setFontSize(10);
        this.pdf.setFont('helvetica', 'normal');
        const [r5, g5, b5] = this.parseHSL(this.colors.accent);
        this.pdf.setTextColor(r5, g5, b5);
        this.pdf.text(edu.school, leftCol, eduY);
        eduY += 12;
        
        this.pdf.setTextColor(100, 100, 100);
        this.pdf.text(edu.year, leftCol, eduY);
        this.pdf.setTextColor(0, 0, 0);
        eduY += 20;
      });
    }

    // Certifications
    if (hasCertifications) {
      this.addSmallSectionHeader('CERTIFICATIONS', rightCol);
      let certY = this.currentY + 20;
      
      data.certifications!.forEach(cert => {
        this.pdf.setFontSize(11);
        this.pdf.setFont('helvetica', 'bold');
        this.pdf.text(cert.name, rightCol, certY);
        certY += 14;
        
        this.pdf.setFontSize(10);
        this.pdf.setFont('helvetica', 'normal');
        const [r6, g6, b6] = this.parseHSL(this.colors.accent);
        this.pdf.setTextColor(r6, g6, b6);
        this.pdf.text(cert.issuer, rightCol, certY);
        certY += 12;
        
        this.pdf.setTextColor(100, 100, 100);
        this.pdf.text(cert.year, rightCol, certY);
        this.pdf.setTextColor(0, 0, 0);
        certY += 20;
      });
    }

    this.currentY += 100; // Approximate space for both columns
  }

  private addSectionHeader(title: string): void {
    this.checkPageBreak(50);
    
    // Accent line
    const [r7, g7, b7] = this.parseHSL(this.colors.accent);
    this.pdf.setFillColor(r7, g7, b7);
    this.pdf.rect(this.margin, this.currentY + 5, 20, 1, 'F');
    
    this.pdf.setFontSize(14);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text(title, this.margin + 30, this.currentY + 10);
    this.currentY += 30;
  }

  private addSmallSectionHeader(title: string, x: number): void {
    // Small accent line
    const [r8, g8, b8] = this.parseHSL(this.colors.accent);
    this.pdf.setFillColor(r8, g8, b8);
    this.pdf.rect(x, this.currentY + 5, 15, 1, 'F');
    
    this.pdf.setFontSize(12);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text(title, x + 20, this.currentY + 10);
  }
}
import jsPDF from 'jspdf';
import { StructuredResumeData } from '@/components/resume-templates/utils/fetchStructuredResumeData';
import { newTemplateConfigs } from '@/components/resume-templates/configs/newTemplateConfigs';

export class TechnicalEngineeringPdfGenerator {
  private pdf: jsPDF;
  private currentY: number;
  private margin = 36;
  private pageWidth: number;
  private pageHeight: number;
  private usableWidth: number;
  private config = newTemplateConfigs['technical-engineering'];
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
    console.log('TechnicalEngineeringPdfGenerator: Starting generation');
    
    // Set color scheme
    this.setColorScheme(colorScheme);
    
    this.addHeader(resumeData);
    this.addTechnicalSummary(resumeData);
    this.addTechnicalSkillsMatrix(resumeData);
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
    const accentMatch = this.colors.accent?.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
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
    
    // Name - large, bold
    this.pdf.setFontSize(22);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text(data.name, this.margin, this.currentY);
    this.currentY += 28;

    // Title with accent
    if (data.experience.length > 0) {
      this.pdf.setFontSize(14);
      this.pdf.setFont('helvetica', 'normal');
      const [r, g, b] = this.parseHSL(this.colors.primary);
      this.pdf.setTextColor(r, g, b);
      this.pdf.text(data.experience[0].title, this.margin, this.currentY);
      this.pdf.setTextColor(0, 0, 0);
      this.currentY += 25;
    }

    // Technical contact grid
    this.pdf.setFontSize(10);
    this.pdf.setFont('courier', 'normal'); // Monospace for technical feel
    
    const contactData = [
      { label: 'TEL', value: data.phone },
      { label: 'EMAIL', value: data.email },
      { label: 'LOC', value: data.location }
    ].filter(item => item.value);

    const itemWidth = this.usableWidth / 3;
    contactData.forEach((item, index) => {
      if (!item.value) return;
      
      const x = this.margin + (index * itemWidth);
      
      // Label badge
      const [r, g, b] = this.parseHSL(this.colors.primary);
      this.pdf.setFillColor(r, g, b, 0.2);
      this.pdf.rect(x, this.currentY - 8, 25, 12, 'F');
      this.pdf.setTextColor(r, g, b);
      this.pdf.text(item.label, x + 2, this.currentY);
      
      // Value
      this.pdf.setTextColor(0, 0, 0);
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.text(item.value, x + 30, this.currentY);
      this.pdf.setFont('courier', 'normal');
    });

    this.currentY += 20;
    
    // Technical accent line
    this.pdf.setLineWidth(2);
    const [r, g, b] = this.parseHSL(this.colors.primary);
    this.pdf.setDrawColor(r, g, b);
    this.pdf.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    this.currentY += 25;
  }

  private addTechnicalSummary(data: StructuredResumeData): void {
    if (!data.summary) return;
    
    this.checkPageBreak(80);
    this.addSectionHeader('01', 'TECHNICAL SUMMARY');
    
    this.pdf.setFontSize(11);
    this.pdf.setFont('helvetica', 'normal');
    const lines = this.pdf.splitTextToSize(data.summary, this.usableWidth - 40);
    
    lines.forEach((line: string) => {
      this.checkPageBreak(20);
      this.pdf.text(line, this.margin + 40, this.currentY);
      this.currentY += 16;
    });
    this.currentY += 20;
  }

  private addTechnicalSkillsMatrix(data: StructuredResumeData): void {
    if (data.skills.length === 0) return;

    this.checkPageBreak(120);
    this.addSectionHeader('02', 'TECHNICAL SKILLS');

    const leftMargin = this.margin + 40;

    data.skills.forEach((skillGroup, groupIndex) => {
      this.checkPageBreak(80);
      
      // Skill category box
      const [r, g, b] = this.parseHSL(this.colors.primary);
      this.pdf.setDrawColor(r, g, b);
      this.pdf.setLineWidth(1);
      this.pdf.rect(leftMargin, this.currentY - 15, this.usableWidth - 40, 60, 'S');
      
      // Category header with accent
      this.pdf.setFontSize(11);
      this.pdf.setFont('helvetica', 'bold');
      const [r2, g2, b2] = this.parseHSL(this.colors.primary);
      this.pdf.setTextColor(r2, g2, b2);
      
      // Small bullet point
      this.pdf.setFillColor(r2, g2, b2);
      this.pdf.circle(leftMargin + 8, this.currentY - 3, 2, 'F');
      
      this.pdf.text(skillGroup.category.toUpperCase(), leftMargin + 15, this.currentY);
      this.pdf.setTextColor(0, 0, 0);
      this.currentY += 20;

      // Skills in grid layout
      this.pdf.setFontSize(10);
      this.pdf.setFont('helvetica', 'normal');
      
      const skillsPerRow = 3;
      const colWidth = (this.usableWidth - 60) / skillsPerRow;
      let currentRow = 0;
      let currentCol = 0;

      skillGroup.items.forEach(skill => {
        const x = leftMargin + 10 + (currentCol * colWidth);
        const y = this.currentY + (currentRow * 18);
        
        // Skill item box
        const [r3, g3, b3] = this.parseHSL(this.colors.primary);
        this.pdf.setFillColor(r3, g3, b3, 0.08);
        this.pdf.setDrawColor(r3, g3, b3, 0.3);
        this.pdf.setLineWidth(0.5);
        this.pdf.rect(x, y - 10, colWidth - 10, 14, 'FD');
        
        // Skill text centered in box
        const skillWidth = this.pdf.getTextWidth(skill);
        const skillX = x + ((colWidth - 10 - skillWidth) / 2);
        this.pdf.text(skill, skillX, y);
        
        currentCol++;
        if (currentCol >= skillsPerRow) {
          currentCol = 0;
          currentRow++;
        }
      });

      this.currentY += (currentRow + 1) * 18 + 20;
    });
  }

  private addProfessionalExperience(data: StructuredResumeData): void {
    if (data.experience.length === 0) return;

    this.checkPageBreak(100);
    this.addSectionHeader('03', 'PROFESSIONAL EXPERIENCE');

    const leftMargin = this.margin + 40;

    data.experience.forEach((exp, index) => {
      this.checkPageBreak(120);
      
      // Project/position container
      const [r, g, b] = this.parseHSL(this.colors.primary);
      this.pdf.setDrawColor(r, g, b);
      this.pdf.setLineWidth(3);
      this.pdf.line(leftMargin - 10, this.currentY - 5, leftMargin - 10, this.currentY + 80);
      
      // Position and company
      this.pdf.setFontSize(12);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text(exp.title, leftMargin, this.currentY);
      
      // Duration - simple colored text
      this.pdf.setFontSize(9);
      this.pdf.setFont('courier', 'normal');
      const [r4, g4, b4] = this.parseHSL(this.colors.primary);
      this.pdf.setTextColor(r4, g4, b4);
      this.pdf.text(exp.duration, this.pageWidth - this.margin - this.pdf.getTextWidth(exp.duration), this.currentY);
      this.pdf.setTextColor(0, 0, 0);
      this.currentY += 18;

      // Company with accent
      this.pdf.setFontSize(11);
      this.pdf.setFont('helvetica', 'normal');
      
      // Small square bullet
      const [r5, g5, b5] = this.parseHSL(this.colors.primary);
      this.pdf.setFillColor(r5, g5, b5);
      this.pdf.rect(leftMargin, this.currentY - 6, 6, 6, 'F');
      
      this.pdf.setTextColor(r5, g5, b5);
      this.pdf.text(exp.company, leftMargin + 12, this.currentY);
      this.pdf.setTextColor(0, 0, 0);
      this.currentY += 20;

      // Achievement bullets
      this.pdf.setFontSize(11);
      this.pdf.setFont('helvetica', 'normal');
      exp.bullets.forEach(bullet => {
        this.checkPageBreak(30);
        
        // Technical arrow bullet
        this.pdf.setFontSize(8);
        this.pdf.setFont('courier', 'bold');
        const [r6, g6, b6] = this.parseHSL(this.colors.primary);
        this.pdf.setFillColor(r6, g6, b6, 0.3);
        this.pdf.rect(leftMargin + 5, this.currentY - 6, 12, 8, 'F');
        this.pdf.setTextColor(r6, g6, b6);
        this.pdf.text('▸', leftMargin + 7, this.currentY);
        this.pdf.setTextColor(0, 0, 0);
        
        this.pdf.setFontSize(11);
        this.pdf.setFont('helvetica', 'normal');
        const lines = this.pdf.splitTextToSize(bullet, this.usableWidth - 80);
        lines.forEach((line: string, lineIndex: number) => {
          this.pdf.text(line, leftMargin + 25, this.currentY);
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
    
    // Two-column layout
    const colWidth = this.usableWidth / 2 - 20;
    const leftCol = this.margin + 40;
    const rightCol = this.margin + this.usableWidth / 2 + 20;

    // Education
    if (hasEducation) {
      this.addSmallSectionHeader('04', 'EDUCATION', leftCol);
      let eduY = this.currentY + 20;
      
      data.education.forEach(edu => {
        // Education item box
        const [r, g, b] = this.parseHSL(this.colors.primary);
        this.pdf.setDrawColor(r, g, b);
        this.pdf.setLineWidth(1);
        this.pdf.rect(leftCol, eduY - 15, colWidth, 45, 'S');
        
        this.pdf.setFontSize(11);
        this.pdf.setFont('helvetica', 'bold');
        this.pdf.text(edu.degree, leftCol + 10, eduY);
        eduY += 14;
        
        this.pdf.setFontSize(10);
        this.pdf.setFont('helvetica', 'normal');
        const [r7, g7, b7] = this.parseHSL(this.colors.primary);
        this.pdf.setTextColor(r7, g7, b7);
        this.pdf.text(edu.school, leftCol + 10, eduY);
        eduY += 12;
        
        this.pdf.setFont('courier', 'normal');
        this.pdf.text(edu.year, leftCol + 10, eduY);
        this.pdf.setTextColor(0, 0, 0);
        eduY += 25;
      });
    }

    // Certifications
    if (hasCertifications) {
      this.addSmallSectionHeader('05', 'CERTIFICATIONS', rightCol);
      let certY = this.currentY + 20;
      
      data.certifications!.forEach(cert => {
        // Certification item box
        const [r, g, b] = this.parseHSL(this.colors.primary);
        this.pdf.setDrawColor(r, g, b);
        this.pdf.setLineWidth(1);
        this.pdf.rect(rightCol, certY - 15, colWidth, 45, 'S');
        
        this.pdf.setFontSize(11);
        this.pdf.setFont('helvetica', 'bold');
        this.pdf.text(cert.name, rightCol + 10, certY);
        certY += 14;
        
        this.pdf.setFontSize(10);
        this.pdf.setFont('helvetica', 'normal');
        const [r8, g8, b8] = this.parseHSL(this.colors.primary);
        this.pdf.setTextColor(r8, g8, b8);
        this.pdf.text(cert.issuer, rightCol + 10, certY);
        certY += 12;
        
        this.pdf.setFont('courier', 'normal');
        this.pdf.text(cert.year, rightCol + 10, certY);
        this.pdf.setTextColor(0, 0, 0);
        certY += 25;
      });
    }

    this.currentY += 100;
  }

  private addSectionHeader(number: string, title: string): void {
    this.checkPageBreak(50);
    
    // Number badge
    const [r9, g9, b9] = this.parseHSL(this.colors.primary);
    this.pdf.setFillColor(r9, g9, b9);
    this.pdf.circle(this.margin + 15, this.currentY, 12, 'F');
    
    this.pdf.setFontSize(10);
    this.pdf.setFont('courier', 'bold');
    this.pdf.setTextColor(255, 255, 255);
    const numWidth = this.pdf.getTextWidth(number);
    this.pdf.text(number, this.margin + 15 - numWidth/2, this.currentY + 3);
    
    // Section title
    this.pdf.setFontSize(14);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setTextColor(0, 0, 0);
    this.pdf.text(title, this.margin + 35, this.currentY + 5);
    this.currentY += 30;
  }

  private addSmallSectionHeader(number: string, title: string, x: number): void {
    // Small number badge
    const [r10, g10, b10] = this.parseHSL(this.colors.primary);
    this.pdf.setFillColor(r10, g10, b10);
    this.pdf.circle(x + 10, this.currentY, 10, 'F');
    
    this.pdf.setFontSize(8);
    this.pdf.setFont('courier', 'bold');
    this.pdf.setTextColor(255, 255, 255);
    const numWidth = this.pdf.getTextWidth(number);
    this.pdf.text(number, x + 10 - numWidth/2, this.currentY + 2);
    
    // Section title
    this.pdf.setFontSize(12);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setTextColor(0, 0, 0);
    this.pdf.text(title, x + 25, this.currentY + 3);
  }
}
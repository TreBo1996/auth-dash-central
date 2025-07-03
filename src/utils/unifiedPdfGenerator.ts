import jsPDF from 'jspdf';
import { StructuredResumeData } from '@/components/resume-templates/utils/fetchStructuredResumeData';
import { parseResumeContent } from '@/components/resume-templates/utils/parseResumeContent';

// Professional resume generator that creates pixel-perfect PDFs
export class ProfessionalResumeGenerator {
  private pdf: jsPDF;
  private currentY: number;
  private margin = 36; // 0.5 inch margins
  private pageWidth: number;
  private usableWidth: number;

  constructor() {
    this.pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'letter',
    });
    this.pageWidth = this.pdf.internal.pageSize.getWidth();
    this.usableWidth = this.pageWidth - (this.margin * 2);
    this.currentY = this.margin;
  }

  async generateResume(resumeData: string | StructuredResumeData, template: string = 'classic'): Promise<jsPDF> {
    const data = typeof resumeData === 'string' ? parseResumeContent(resumeData) : resumeData;
    
    // Set up fonts
    this.pdf.setFont('helvetica');
    
    // Generate sections
    this.addHeader(data);
    this.addSummary(data);
    this.addSkills(data);
    this.addExperience(data);
    this.addEducation(data);
    this.addCertifications(data);

    return this.pdf;
  }

  private addHeader(data: StructuredResumeData): void {
    // Name - 22pt, bold, centered
    this.pdf.setFontSize(22);
    this.pdf.setFont('helvetica', 'bold');
    const nameWidth = this.pdf.getTextWidth(data.name.toUpperCase());
    this.pdf.text(data.name.toUpperCase(), (this.pageWidth - nameWidth) / 2, this.currentY);
    this.currentY += 26;

    // Role - 11pt, bold, centered
    if (data.experience.length > 0) {
      this.pdf.setFontSize(11);
      const role = data.experience[0].title.toUpperCase();
      const roleWidth = this.pdf.getTextWidth(role);
      this.pdf.text(role, (this.pageWidth - roleWidth) / 2, this.currentY);
      this.currentY += 16;
    }

    // Line
    this.pdf.setLineWidth(0.75);
    this.pdf.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    this.currentY += 12;

    // Contact info - 11pt, centered
    this.pdf.setFontSize(11);
    this.pdf.setFont('helvetica', 'normal');
    const contact = [data.phone, data.email, data.location].filter(Boolean).join(' · ');
    const contactWidth = this.pdf.getTextWidth(contact);
    this.pdf.text(contact, (this.pageWidth - contactWidth) / 2, this.currentY);
    this.currentY += 24;
  }

  private addSummary(data: StructuredResumeData): void {
    if (!data.summary) return;

    this.pdf.setFontSize(11);
    this.pdf.setFont('helvetica', 'normal');
    
    const lines = this.pdf.splitTextToSize(data.summary, this.usableWidth);
    lines.forEach((line: string) => {
      const lineWidth = this.pdf.getTextWidth(line);
      this.pdf.text(line, (this.pageWidth - lineWidth) / 2, this.currentY);
      this.currentY += 15;
    });
    this.currentY += 12;
  }

  private addSectionHeader(title: string): void {
    this.pdf.setFontSize(13);
    this.pdf.setFont('helvetica', 'bold');
    const titleWidth = this.pdf.getTextWidth(title);
    this.pdf.text(title, (this.pageWidth - titleWidth) / 2, this.currentY);
    this.currentY += 8;
    
    // Line under header
    this.pdf.setLineWidth(0.5);
    this.pdf.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    this.currentY += 8;
  }

  private addSkills(data: StructuredResumeData): void {
    if (data.skills.length === 0) return;

    this.addSectionHeader('SKILLS');

    const allSkills: string[] = [];
    data.skills.forEach(group => allSkills.push(...group.items));

    const mid = Math.ceil(allSkills.length / 2);
    const leftCol = allSkills.slice(0, mid);
    const rightCol = allSkills.slice(mid);

    this.pdf.setFontSize(11);
    this.pdf.setFont('helvetica', 'normal');

    const colWidth = this.usableWidth / 2 - 12;
    let leftY = this.currentY;
    let rightY = this.currentY;

    leftCol.forEach(skill => {
      this.pdf.text(`• ${skill}`, this.margin, leftY);
      leftY += 15;
    });

    rightCol.forEach(skill => {
      this.pdf.text(`• ${skill}`, this.margin + colWidth + 24, rightY);
      rightY += 15;
    });

    this.currentY = Math.max(leftY, rightY) + 12;
  }

  private addExperience(data: StructuredResumeData): void {
    if (data.experience.length === 0) return;

    this.addSectionHeader('EXPERIENCE');

    data.experience.forEach((exp, index) => {
      // Title and dates
      this.pdf.setFontSize(12);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text(exp.title.toUpperCase(), this.margin, this.currentY);
      
      const dateText = exp.duration.replace('-', '–');
      const dateWidth = this.pdf.getTextWidth(dateText);
      this.pdf.text(dateText, this.pageWidth - this.margin - dateWidth, this.currentY);
      this.currentY += 16;

      // Company
      this.pdf.setFontSize(12);
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.text(exp.company, this.margin, this.currentY);
      this.currentY += 18;

      // Bullets
      this.pdf.setFontSize(11);
      exp.bullets.forEach(bullet => {
        const lines = this.pdf.splitTextToSize(`• ${bullet}`, this.usableWidth - 12);
        lines.forEach((line: string, lineIndex: number) => {
          const x = lineIndex === 0 ? this.margin : this.margin + 12;
          this.pdf.text(line, x, this.currentY);
          this.currentY += 15;
        });
      });

      if (index < data.experience.length - 1) this.currentY += 8;
    });

    this.currentY += 12;
  }

  private addEducation(data: StructuredResumeData): void {
    if (data.education.length === 0) return;

    this.addSectionHeader('EDUCATION');

    data.education.forEach(edu => {
      this.pdf.setFontSize(12);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text(edu.degree, this.margin, this.currentY);
      
      const yearWidth = this.pdf.getTextWidth(edu.year);
      this.pdf.text(edu.year, this.pageWidth - this.margin - yearWidth, this.currentY);
      this.currentY += 16;

      this.pdf.setFont('helvetica', 'normal');
      this.pdf.text(edu.school, this.margin, this.currentY);
      this.currentY += 18;
    });
  }

  private addCertifications(data: StructuredResumeData): void {
    if (!data.certifications?.length) return;

    this.addSectionHeader('CERTIFICATIONS');

    data.certifications.forEach(cert => {
      this.pdf.setFontSize(12);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text(cert.name, this.margin, this.currentY);
      
      const yearWidth = this.pdf.getTextWidth(cert.year);
      this.pdf.text(cert.year, this.pageWidth - this.margin - yearWidth, this.currentY);
      this.currentY += 16;

      this.pdf.setFont('helvetica', 'normal');
      this.pdf.text(cert.issuer, this.margin, this.currentY);
      this.currentY += 18;
    });
  }
}

export const generateProfessionalPDF = async (
  templateId: string, 
  resumeData: string | StructuredResumeData, 
  fileName: string
): Promise<void> => {
  const generator = new ProfessionalResumeGenerator();
  const pdf = await generator.generateResume(resumeData, templateId);
  pdf.save(fileName);
};
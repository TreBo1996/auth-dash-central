import jsPDF from 'jspdf';
import { StructuredResumeData } from '@/components/resume-templates/utils/fetchStructuredResumeData';
import { parseResumeContent } from '@/components/resume-templates/utils/parseResumeContent';

// Professional PDF generator using jsPDF for pixel-perfect output
export interface PDFGenerationOptions {
  template: string;
  filename: string;
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  fontSize: {
    name: number;
    title: number;
    sectionHeader: number;
    body: number;
    contact: number;
  };
  lineHeight: {
    body: number;
    tight: number;
  };
  spacing: {
    afterName: number;
    afterContact: number;
    afterSummary: number;
    betweenSections: number;
    afterSectionHeader: number;
    betweenJobEntries: number;
  };
}

// Professional template configurations optimized for ATS and print
export const PROFESSIONAL_TEMPLATES: Record<string, PDFGenerationOptions> = {
  classic: {
    template: 'classic',
    filename: 'resume.pdf',
    marginTop: 36, // 0.5 inch
    marginBottom: 36,
    marginLeft: 36,
    marginRight: 36,
    fontSize: {
      name: 22,
      title: 11,
      sectionHeader: 13,
      body: 11,
      contact: 11,
    },
    lineHeight: {
      body: 1.4,
      tight: 1.2,
    },
    spacing: {
      afterName: 6,
      afterContact: 18,
      afterSummary: 18,
      betweenSections: 12,
      afterSectionHeader: 6,
      betweenJobEntries: 8,
    },
  },
  modern: {
    template: 'modern',
    filename: 'resume.pdf',
    marginTop: 36,
    marginBottom: 36,
    marginLeft: 36,
    marginRight: 36,
    fontSize: {
      name: 24,
      title: 12,
      sectionHeader: 14,
      body: 11,
      contact: 11,
    },
    lineHeight: {
      body: 1.5,
      tight: 1.3,
    },
    spacing: {
      afterName: 8,
      afterContact: 20,
      afterSummary: 20,
      betweenSections: 14,
      afterSectionHeader: 8,
      betweenJobEntries: 10,
    },
  },
};

interface GenerationState {
  pdf: jsPDF;
  currentY: number;
  pageWidth: number;
  pageHeight: number;
  usableWidth: number;
  options: PDFGenerationOptions;
}

export const generateProfessionalPDF = async (
  templateId: string,
  resumeData: string | StructuredResumeData,
  fileName?: string
): Promise<void> => {
  console.log('Professional PDF Generation: Starting for template:', templateId);

  // Get template configuration
  const config = PROFESSIONAL_TEMPLATES[templateId] || PROFESSIONAL_TEMPLATES.classic;
  if (fileName) {
    config.filename = fileName;
  }

  // Parse resume data
  const parsedData = typeof resumeData === 'string' ? parseResumeContent(resumeData) : resumeData;

  // Create PDF with precise measurements
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'letter', // 8.5" x 11"
    compress: true,
  });

  // Set up generation state
  const state: GenerationState = {
    pdf,
    currentY: config.marginTop,
    pageWidth: pdf.internal.pageSize.getWidth(),
    pageHeight: pdf.internal.pageSize.getHeight(),
    usableWidth: pdf.internal.pageSize.getWidth() - config.marginLeft - config.marginRight,
    options: config,
  };

  try {
    // Generate PDF sections
    await generateHeader(state, parsedData);
    await generateSummary(state, parsedData);
    await generateSkills(state, parsedData);
    await generateExperience(state, parsedData);
    await generateEducation(state, parsedData);
    await generateCertifications(state, parsedData);

    // Save the PDF
    pdf.save(config.filename);
    console.log('Professional PDF Generation: Successfully generated PDF');

  } catch (error) {
    console.error('Professional PDF Generation: Error:', error);
    throw new Error('Failed to generate professional PDF');
  }
};

// Header section with name, title, and contact info
const generateHeader = async (state: GenerationState, data: StructuredResumeData): Promise<void> => {
  const { pdf, options } = state;
  
  // Name - centered, bold, large
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(options.fontSize.name);
  
  const nameWidth = pdf.getTextWidth(data.name);
  const nameX = (state.pageWidth - nameWidth) / 2;
  pdf.text(data.name, nameX, state.currentY);
  state.currentY += options.spacing.afterName;

  // Professional title - centered, smaller, letter-spaced
  if (data.experience.length > 0) {
    const title = data.experience[0].title.toUpperCase();
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(options.fontSize.title);
    
    const titleWidth = pdf.getTextWidth(title);
    const titleX = (state.pageWidth - titleWidth) / 2;
    pdf.text(title, titleX, state.currentY);
    state.currentY += options.spacing.afterName;
  }

  // Horizontal line
  const lineY = state.currentY + 2;
  pdf.setLineWidth(0.75);
  pdf.line(options.marginLeft, lineY, state.pageWidth - options.marginRight, lineY);
  state.currentY += 8;

  // Contact information - centered, single line
  const contactInfo = [data.phone, data.email, data.location].filter(Boolean).join(' · ');
  if (contactInfo) {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(options.fontSize.contact);
    
    const contactWidth = pdf.getTextWidth(contactInfo);
    const contactX = (state.pageWidth - contactWidth) / 2;
    pdf.text(contactInfo, contactX, state.currentY);
    state.currentY += options.spacing.afterContact;
  }
};

// Professional summary section
const generateSummary = async (state: GenerationState, data: StructuredResumeData): Promise<void> => {
  if (!data.summary) return;

  const { pdf, options } = state;
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(options.fontSize.body);
  
  // Center-aligned summary text
  const summaryLines = pdf.splitTextToSize(data.summary, state.usableWidth);
  summaryLines.forEach((line: string) => {
    const lineWidth = pdf.getTextWidth(line);
    const lineX = (state.pageWidth - lineWidth) / 2;
    pdf.text(line, lineX, state.currentY);
    state.currentY += options.fontSize.body * options.lineHeight.body;
  });
  
  state.currentY += options.spacing.afterSummary;
};

// Skills section with two-column layout
const generateSkills = async (state: GenerationState, data: StructuredResumeData): Promise<void> => {
  if (data.skills.length === 0) return;

  const { pdf, options } = state;
  
  // Section header
  generateSectionHeader(state, 'SKILLS');
  
  // Collect all skills
  const allSkills: string[] = [];
  data.skills.forEach(skillGroup => {
    skillGroup.items.forEach(skill => allSkills.push(skill));
  });

  // Two-column layout
  const columnWidth = (state.usableWidth - 24) / 2; // 24pt gap between columns
  const leftColumnX = options.marginLeft;
  const rightColumnX = leftColumnX + columnWidth + 24;
  
  const mid = Math.ceil(allSkills.length / 2);
  const leftSkills = allSkills.slice(0, mid);
  const rightSkills = allSkills.slice(mid);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(options.fontSize.body);

  let leftY = state.currentY;
  let rightY = state.currentY;

  // Left column
  leftSkills.forEach(skill => {
    pdf.text(`• ${skill}`, leftColumnX, leftY);
    leftY += options.fontSize.body * options.lineHeight.body;
  });

  // Right column
  rightSkills.forEach(skill => {
    pdf.text(`• ${skill}`, rightColumnX, rightY);
    rightY += options.fontSize.body * options.lineHeight.body;
  });

  state.currentY = Math.max(leftY, rightY) + options.spacing.betweenSections;
};

// Experience section
const generateExperience = async (state: GenerationState, data: StructuredResumeData): Promise<void> => {
  if (data.experience.length === 0) return;

  generateSectionHeader(state, 'EXPERIENCE');

  data.experience.forEach((exp, index) => {
    const { pdf, options } = state;

    // Job title and dates
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(options.fontSize.body + 1);
    
    const titleWidth = pdf.getTextWidth(exp.title.toUpperCase());
    const dateWidth = pdf.getTextWidth(exp.duration.replace('-', '–'));
    
    pdf.text(exp.title.toUpperCase(), options.marginLeft, state.currentY);
    pdf.text(exp.duration.replace('-', '–'), state.pageWidth - options.marginRight - dateWidth, state.currentY);
    state.currentY += options.fontSize.body * options.lineHeight.tight;

    // Company
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(options.fontSize.body);
    pdf.text(exp.company, options.marginLeft, state.currentY);
    state.currentY += options.fontSize.body * options.lineHeight.body + 2;

    // Bullets
    exp.bullets.forEach(bullet => {
      pdf.setFont('helvetica', 'normal');
      
      // Use visual bullets positioned correctly with text baseline
      const bulletX = options.marginLeft + 3;
      const textX = options.marginLeft + 15;
      const textWidth = state.usableWidth - 15;
      
      // Split text for proper wrapping
      const bulletLines = pdf.splitTextToSize(bullet, textWidth);
      bulletLines.forEach((line: string, lineIndex: number) => {
        if (lineIndex === 0) {
          // Draw visual bullet circle aligned with text baseline
          pdf.circle(bulletX, state.currentY, 1.5, 'F');
        }
        // All text lines use consistent positioning - move text up to align with bullet center
        pdf.text(line, textX, state.currentY - 10);
        state.currentY += options.fontSize.body * options.lineHeight.body;
      });
    });

    if (index < data.experience.length - 1) {
      state.currentY += options.spacing.betweenJobEntries;
    }
  });

  state.currentY += state.options.spacing.betweenSections;
};

// Education section
const generateEducation = async (state: GenerationState, data: StructuredResumeData): Promise<void> => {
  if (data.education.length === 0) return;

  generateSectionHeader(state, 'EDUCATION');

  data.education.forEach(edu => {
    const { pdf, options } = state;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(options.fontSize.body);
    
    const degreeWidth = pdf.getTextWidth(edu.degree);
    const yearWidth = pdf.getTextWidth(edu.year);
    
    pdf.text(edu.degree, options.marginLeft, state.currentY);
    pdf.text(edu.year, state.pageWidth - options.marginRight - yearWidth, state.currentY);
    state.currentY += options.fontSize.body * options.lineHeight.tight;

    pdf.setFont('helvetica', 'normal');
    pdf.text(edu.school, options.marginLeft, state.currentY);
    state.currentY += options.fontSize.body * options.lineHeight.body + 4;
  });

  state.currentY += state.options.spacing.betweenSections;
};

// Certifications section
const generateCertifications = async (state: GenerationState, data: StructuredResumeData): Promise<void> => {
  if (!data.certifications || data.certifications.length === 0) return;

  generateSectionHeader(state, 'CERTIFICATIONS');

  data.certifications.forEach(cert => {
    const { pdf, options } = state;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(options.fontSize.body);
    
    const nameWidth = pdf.getTextWidth(cert.name);
    const yearWidth = pdf.getTextWidth(cert.year);
    
    pdf.text(cert.name, options.marginLeft, state.currentY);
    pdf.text(cert.year, state.pageWidth - options.marginRight - yearWidth, state.currentY);
    state.currentY += options.fontSize.body * options.lineHeight.tight;

    pdf.setFont('helvetica', 'normal');
    pdf.text(cert.issuer, options.marginLeft, state.currentY);
    state.currentY += options.fontSize.body * options.lineHeight.body + 4;
  });
};

// Helper function to generate section headers
const generateSectionHeader = (state: GenerationState, title: string): void => {
  const { pdf, options } = state;
  
  // Section title - centered, bold, letter-spaced
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(options.fontSize.sectionHeader);
  
  const titleWidth = pdf.getTextWidth(title);
  const titleX = (state.pageWidth - titleWidth) / 2;
  pdf.text(title, titleX, state.currentY);
  state.currentY += options.spacing.afterSectionHeader;

  // Horizontal line under section header
  const lineY = state.currentY;
  pdf.setLineWidth(0.5);
  pdf.line(options.marginLeft, lineY, state.pageWidth - options.marginRight, lineY);
  state.currentY += 4;
};
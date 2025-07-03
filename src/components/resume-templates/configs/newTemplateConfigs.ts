export interface TemplateConfig {
  id: string;
  name: string;
  category: string;
  description: string;
  targetAudience: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    textSecondary: string;
    background: string;
    border: string;
  };
  fonts: {
    heading: string;
    body: string;
    accent?: string;
  };
  layout: {
    type: 'single-column' | 'two-column';
    columns?: number;
    spacing: 'compact' | 'normal' | 'generous';
    headerStyle: 'centered' | 'left' | 'banner';
  };
  features: string[];
}

export const newTemplateConfigs: Record<string, TemplateConfig> = {
  'minimalist-executive': {
    id: 'minimalist-executive',
    name: 'Minimalist Executive',
    category: 'Executive',
    description: 'Sophisticated design for senior professionals and executives',
    targetAudience: 'C-level executives, senior directors, VP-level professionals',
    colors: {
      primary: 'hsl(220, 15%, 20%)', // Charcoal
      secondary: 'hsl(220, 10%, 40%)', // Medium gray
      accent: 'hsl(220, 50%, 30%)', // Professional blue
      text: 'hsl(220, 15%, 20%)',
      textSecondary: 'hsl(220, 10%, 40%)',
      background: 'hsl(0, 0%, 100%)',
      border: 'hsl(220, 10%, 80%)'
    },
    fonts: {
      heading: 'Georgia, "Times New Roman", serif',
      body: 'Inter, "Helvetica Neue", sans-serif'
    },
    layout: {
      type: 'single-column',
      spacing: 'generous',
      headerStyle: 'centered'
    },
    features: ['Executive summary', 'Achievement metrics', 'Leadership focus', 'Premium styling']
  },

  'modern-ats': {
    id: 'modern-ats',
    name: 'Modern ATS-Optimized',
    category: 'Professional',
    description: 'Clean, ATS-friendly design optimized for corporate environments',
    targetAudience: 'Corporate professionals, tech workers, managers',
    colors: {
      primary: 'hsl(210, 20%, 15%)', // Dark blue-gray
      secondary: 'hsl(210, 15%, 35%)', // Medium blue-gray
      accent: 'hsl(210, 80%, 45%)', // Professional blue
      text: 'hsl(210, 20%, 15%)',
      textSecondary: 'hsl(210, 15%, 35%)',
      background: 'hsl(0, 0%, 100%)',
      border: 'hsl(210, 15%, 85%)'
    },
    fonts: {
      heading: 'Inter, "Helvetica Neue", sans-serif',
      body: 'Inter, "Helvetica Neue", sans-serif'
    },
    layout: {
      type: 'single-column',
      spacing: 'normal',
      headerStyle: 'left'
    },
    features: ['ATS-compatible', 'Skills matrix', 'Contact header', 'Clean sections']
  },

  'creative-professional': {
    id: 'creative-professional',
    name: 'Creative Professional',
    category: 'Creative',
    description: 'Stylish design with strategic color use for creative industries',
    targetAudience: 'Marketing professionals, designers, communications specialists',
    colors: {
      primary: 'hsl(260, 30%, 25%)', // Deep purple
      secondary: 'hsl(260, 20%, 45%)', // Medium purple
      accent: 'hsl(260, 60%, 55%)', // Vibrant purple
      text: 'hsl(260, 30%, 25%)',
      textSecondary: 'hsl(260, 20%, 45%)',
      background: 'hsl(0, 0%, 100%)',
      border: 'hsl(260, 20%, 85%)'
    },
    fonts: {
      heading: 'Montserrat, "Arial", sans-serif',
      body: 'Inter, "Helvetica Neue", sans-serif'
    },
    layout: {
      type: 'single-column',
      spacing: 'normal',
      headerStyle: 'left'
    },
    features: ['Creative flair', 'Color strategy', 'Visual hierarchy', 'Portfolio ready']
  },

  'academic-research': {
    id: 'academic-research',
    name: 'Academic Research',
    category: 'Academic',
    description: 'Traditional academic CV format for researchers and professors',
    targetAudience: 'Researchers, professors, PhD candidates, academic professionals',
    colors: {
      primary: 'hsl(0, 0%, 10%)', // Near black
      secondary: 'hsl(0, 0%, 30%)', // Dark gray
      accent: 'hsl(0, 0%, 20%)', // Charcoal
      text: 'hsl(0, 0%, 10%)',
      textSecondary: 'hsl(0, 0%, 30%)',
      background: 'hsl(0, 0%, 100%)',
      border: 'hsl(0, 0%, 70%)'
    },
    fonts: {
      heading: '"Times New Roman", Georgia, serif',
      body: '"Times New Roman", Georgia, serif'
    },
    layout: {
      type: 'single-column',
      spacing: 'compact',
      headerStyle: 'centered'
    },
    features: ['Publications section', 'Research focus', 'Academic formatting', 'Multi-page support']
  },

  'technical-engineering': {
    id: 'technical-engineering',
    name: 'Technical Engineering',
    category: 'Technical',
    description: 'Structured, data-focused design for STEM professionals',
    targetAudience: 'Engineers, developers, technical specialists, STEM professionals',
    colors: {
      primary: 'hsl(195, 25%, 20%)', // Dark teal
      secondary: 'hsl(195, 20%, 40%)', // Medium teal
      accent: 'hsl(195, 70%, 35%)', // Bright teal
      text: 'hsl(195, 25%, 20%)',
      textSecondary: 'hsl(195, 20%, 40%)',
      background: 'hsl(0, 0%, 100%)',
      border: 'hsl(195, 20%, 80%)'
    },
    fonts: {
      heading: 'Inter, "Helvetica Neue", sans-serif',
      body: 'Inter, "Helvetica Neue", sans-serif',
      accent: '"JetBrains Mono", "Courier New", monospace'
    },
    layout: {
      type: 'single-column',
      spacing: 'normal',
      headerStyle: 'left'
    },
    features: ['Technical skills matrix', 'Project focus', 'Certifications', 'Tools expertise']
  }
};
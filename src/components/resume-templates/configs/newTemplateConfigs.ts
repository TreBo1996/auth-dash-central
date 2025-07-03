export interface ColorScheme {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    textSecondary: string;
    background: string;
    border: string;
  };
}

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
  colorSchemes: ColorScheme[];
  defaultColorScheme: string;
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
    colorSchemes: [
      {
        id: 'classic-monochrome',
        name: 'Classic Monochrome',
        colors: {
          primary: 'hsl(0, 0%, 10%)',
          secondary: 'hsl(0, 0%, 30%)',
          accent: 'hsl(0, 0%, 20%)',
          text: 'hsl(0, 0%, 10%)',
          textSecondary: 'hsl(0, 0%, 40%)',
          background: 'hsl(0, 0%, 100%)',
          border: 'hsl(0, 0%, 75%)'
        }
      },
      {
        id: 'charcoal',
        name: 'Charcoal Professional',
        colors: {
          primary: 'hsl(220, 15%, 20%)',
          secondary: 'hsl(220, 10%, 40%)',
          accent: 'hsl(220, 50%, 30%)',
          text: 'hsl(220, 15%, 20%)',
          textSecondary: 'hsl(220, 10%, 40%)',
          background: 'hsl(0, 0%, 100%)',
          border: 'hsl(220, 10%, 80%)'
        }
      },
      {
        id: 'burgundy',
        name: 'Executive Burgundy',
        colors: {
          primary: 'hsl(340, 30%, 25%)',
          secondary: 'hsl(340, 20%, 45%)',
          accent: 'hsl(340, 60%, 35%)',
          text: 'hsl(340, 30%, 25%)',
          textSecondary: 'hsl(340, 20%, 45%)',
          background: 'hsl(0, 0%, 100%)',
          border: 'hsl(340, 20%, 80%)'
        }
      },
      {
        id: 'forest',
        name: 'Forest Green',
        colors: {
          primary: 'hsl(160, 30%, 25%)',
          secondary: 'hsl(160, 20%, 45%)',
          accent: 'hsl(160, 60%, 35%)',
          text: 'hsl(160, 30%, 25%)',
          textSecondary: 'hsl(160, 20%, 45%)',
          background: 'hsl(0, 0%, 100%)',
          border: 'hsl(160, 20%, 80%)'
        }
      }
    ],
    defaultColorScheme: 'classic-monochrome',
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
    colorSchemes: [
      {
        id: 'classic-monochrome',
        name: 'Classic Monochrome',
        colors: {
          primary: 'hsl(0, 0%, 10%)',
          secondary: 'hsl(0, 0%, 30%)',
          accent: 'hsl(0, 0%, 20%)',
          text: 'hsl(0, 0%, 10%)',
          textSecondary: 'hsl(0, 0%, 40%)',
          background: 'hsl(0, 0%, 100%)',
          border: 'hsl(0, 0%, 75%)'
        }
      },
      {
        id: 'professional-blue',
        name: 'Professional Blue',
        colors: {
          primary: 'hsl(210, 20%, 15%)',
          secondary: 'hsl(210, 15%, 35%)',
          accent: 'hsl(210, 80%, 45%)',
          text: 'hsl(210, 20%, 15%)',
          textSecondary: 'hsl(210, 15%, 35%)',
          background: 'hsl(0, 0%, 100%)',
          border: 'hsl(210, 15%, 85%)'
        }
      },
      {
        id: 'corporate-gray',
        name: 'Corporate Gray',
        colors: {
          primary: 'hsl(0, 0%, 15%)',
          secondary: 'hsl(0, 0%, 35%)',
          accent: 'hsl(0, 0%, 25%)',
          text: 'hsl(0, 0%, 15%)',
          textSecondary: 'hsl(0, 0%, 35%)',
          background: 'hsl(0, 0%, 100%)',
          border: 'hsl(0, 0%, 85%)'
        }
      },
      {
        id: 'navy-professional',
        name: 'Navy Professional',
        colors: {
          primary: 'hsl(220, 40%, 20%)',
          secondary: 'hsl(220, 30%, 40%)',
          accent: 'hsl(220, 70%, 35%)',
          text: 'hsl(220, 40%, 20%)',
          textSecondary: 'hsl(220, 30%, 40%)',
          background: 'hsl(0, 0%, 100%)',
          border: 'hsl(220, 30%, 85%)'
        }
      }
    ],
    defaultColorScheme: 'classic-monochrome',
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
    colorSchemes: [
      {
        id: 'classic-monochrome',
        name: 'Classic Monochrome',
        colors: {
          primary: 'hsl(0, 0%, 10%)',
          secondary: 'hsl(0, 0%, 30%)',
          accent: 'hsl(0, 0%, 20%)',
          text: 'hsl(0, 0%, 10%)',
          textSecondary: 'hsl(0, 0%, 40%)',
          background: 'hsl(0, 0%, 100%)',
          border: 'hsl(0, 0%, 75%)'
        }
      },
      {
        id: 'creative-purple',
        name: 'Creative Purple',
        colors: {
          primary: 'hsl(260, 30%, 25%)',
          secondary: 'hsl(260, 20%, 45%)',
          accent: 'hsl(260, 60%, 55%)',
          text: 'hsl(260, 30%, 25%)',
          textSecondary: 'hsl(260, 20%, 45%)',
          background: 'hsl(0, 0%, 100%)',
          border: 'hsl(260, 20%, 85%)'
        }
      },
      {
        id: 'vibrant-teal',
        name: 'Vibrant Teal',
        colors: {
          primary: 'hsl(180, 30%, 25%)',
          secondary: 'hsl(180, 20%, 45%)',
          accent: 'hsl(180, 60%, 40%)',
          text: 'hsl(180, 30%, 25%)',
          textSecondary: 'hsl(180, 20%, 45%)',
          background: 'hsl(0, 0%, 100%)',
          border: 'hsl(180, 20%, 85%)'
        }
      },
      {
        id: 'energetic-orange',
        name: 'Energetic Orange',
        colors: {
          primary: 'hsl(25, 30%, 25%)',
          secondary: 'hsl(25, 20%, 45%)',
          accent: 'hsl(25, 70%, 50%)',
          text: 'hsl(25, 30%, 25%)',
          textSecondary: 'hsl(25, 20%, 45%)',
          background: 'hsl(0, 0%, 100%)',
          border: 'hsl(25, 20%, 85%)'
        }
      }
    ],
    defaultColorScheme: 'classic-monochrome',
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
    colorSchemes: [
      {
        id: 'classic-monochrome',
        name: 'Classic Monochrome',
        colors: {
          primary: 'hsl(0, 0%, 10%)',
          secondary: 'hsl(0, 0%, 30%)',
          accent: 'hsl(0, 0%, 20%)',
          text: 'hsl(0, 0%, 10%)',
          textSecondary: 'hsl(0, 0%, 40%)',
          background: 'hsl(0, 0%, 100%)',
          border: 'hsl(0, 0%, 75%)'
        }
      },
      {
        id: 'traditional-black',
        name: 'Traditional Black',
        colors: {
          primary: 'hsl(0, 0%, 10%)',
          secondary: 'hsl(0, 0%, 30%)',
          accent: 'hsl(0, 0%, 20%)',
          text: 'hsl(0, 0%, 10%)',
          textSecondary: 'hsl(0, 0%, 30%)',
          background: 'hsl(0, 0%, 100%)',
          border: 'hsl(0, 0%, 70%)'
        }
      },
      {
        id: 'subtle-blue',
        name: 'Subtle Blue',
        colors: {
          primary: 'hsl(210, 15%, 15%)',
          secondary: 'hsl(210, 10%, 35%)',
          accent: 'hsl(210, 25%, 25%)',
          text: 'hsl(210, 15%, 15%)',
          textSecondary: 'hsl(210, 10%, 35%)',
          background: 'hsl(0, 0%, 100%)',
          border: 'hsl(210, 10%, 75%)'
        }
      }
    ],
    defaultColorScheme: 'classic-monochrome',
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
    colorSchemes: [
      {
        id: 'classic-monochrome',
        name: 'Classic Monochrome',
        colors: {
          primary: 'hsl(0, 0%, 10%)',
          secondary: 'hsl(0, 0%, 30%)',
          accent: 'hsl(0, 0%, 20%)',
          text: 'hsl(0, 0%, 10%)',
          textSecondary: 'hsl(0, 0%, 40%)',
          background: 'hsl(0, 0%, 100%)',
          border: 'hsl(0, 0%, 75%)'
        }
      },
      {
        id: 'tech-teal',
        name: 'Tech Teal',
        colors: {
          primary: 'hsl(195, 25%, 20%)',
          secondary: 'hsl(195, 20%, 40%)',
          accent: 'hsl(195, 70%, 35%)',
          text: 'hsl(195, 25%, 20%)',
          textSecondary: 'hsl(195, 20%, 40%)',
          background: 'hsl(0, 0%, 100%)',
          border: 'hsl(195, 20%, 80%)'
        }
      },
      {
        id: 'modern-blue',
        name: 'Modern Blue',
        colors: {
          primary: 'hsl(220, 25%, 20%)',
          secondary: 'hsl(220, 20%, 40%)',
          accent: 'hsl(220, 70%, 40%)',
          text: 'hsl(220, 25%, 20%)',
          textSecondary: 'hsl(220, 20%, 40%)',
          background: 'hsl(0, 0%, 100%)',
          border: 'hsl(220, 20%, 80%)'
        }
      },
      {
        id: 'sleek-gray',
        name: 'Sleek Gray',
        colors: {
          primary: 'hsl(200, 10%, 20%)',
          secondary: 'hsl(200, 8%, 40%)',
          accent: 'hsl(200, 15%, 30%)',
          text: 'hsl(200, 10%, 20%)',
          textSecondary: 'hsl(200, 8%, 40%)',
          background: 'hsl(0, 0%, 100%)',
          border: 'hsl(200, 8%, 80%)'
        }
      }
    ],
    defaultColorScheme: 'classic-monochrome',
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
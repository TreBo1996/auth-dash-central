
export interface TemplateConfig {
  id: string;
  name: string;
  category: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    background: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  layout: {
    columns: number;
    spacing: string;
  };
}

export const templateConfigs: Record<string, TemplateConfig> = {
  modern: {
    id: 'modern',
    name: 'Modern',
    category: 'Professional',
    description: 'Clean and minimal design with accent colors',
    colors: {
      primary: '#2563eb',
      secondary: '#64748b',
      accent: '#06b6d4',
      text: '#1e293b',
      background: '#ffffff'
    },
    fonts: {
      heading: 'Inter, sans-serif',
      body: 'Inter, sans-serif'
    },
    layout: {
      columns: 2,
      spacing: 'normal'
    }
  },
  classic: {
    id: 'classic',
    name: 'Classic',
    category: 'Traditional',
    description: 'Traditional black and white professional layout',
    colors: {
      primary: '#000000',
      secondary: '#4a5568',
      accent: '#2d3748',
      text: '#2d3748',
      background: '#ffffff'
    },
    fonts: {
      heading: 'Georgia, serif',
      body: 'Georgia, serif'
    },
    layout: {
      columns: 1,
      spacing: 'compact'
    }
  },
  creative: {
    id: 'creative',
    name: 'Creative',
    category: 'Design',
    description: 'Colorful design with visual elements and icons',
    colors: {
      primary: '#7c3aed',
      secondary: '#a78bfa',
      accent: '#06b6d4',
      text: '#374151',
      background: '#ffffff'
    },
    fonts: {
      heading: 'Poppins, sans-serif',
      body: 'Open Sans, sans-serif'
    },
    layout: {
      columns: 2,
      spacing: 'relaxed'
    }
  },
  executive: {
    id: 'executive',
    name: 'Executive',
    category: 'Corporate',
    description: 'Sophisticated corporate-style layout',
    colors: {
      primary: '#1f2937',
      secondary: '#6b7280',
      accent: '#059669',
      text: '#374151',
      background: '#ffffff'
    },
    fonts: {
      heading: 'Playfair Display, serif',
      body: 'Source Sans Pro, sans-serif'
    },
    layout: {
      columns: 1,
      spacing: 'normal'
    }
  },
  technical: {
    id: 'technical',
    name: 'Technical',
    category: 'Developer',
    description: 'Developer-focused with skills emphasis',
    colors: {
      primary: '#0f172a',
      secondary: '#475569',
      accent: '#3b82f6',
      text: '#334155',
      background: '#ffffff'
    },
    fonts: {
      heading: 'JetBrains Mono, monospace',
      body: 'Inter, sans-serif'
    },
    layout: {
      columns: 2,
      spacing: 'compact'
    }
  },
  academic: {
    id: 'academic',
    name: 'Academic',
    category: 'Education',
    description: 'Education and research-focused layout',
    colors: {
      primary: '#7c2d12',
      secondary: '#a3a3a3',
      accent: '#dc2626',
      text: '#404040',
      background: '#ffffff'
    },
    fonts: {
      heading: 'Crimson Text, serif',
      body: 'Lato, sans-serif'
    },
    layout: {
      columns: 1,
      spacing: 'relaxed'
    }
  }
};

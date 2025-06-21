
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
  sidebar: {
    id: 'sidebar',
    name: 'Sidebar Professional',
    category: 'Professional',
    description: 'Two-column layout with gray sidebar for contact and skills',
    colors: {
      primary: '#4a5568',
      secondary: '#718096',
      accent: '#2d3748',
      text: '#2d3748',
      background: '#f7fafc'
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
  modern: {
    id: 'modern',
    name: 'Modern Clean',
    category: 'Professional',
    description: 'Clean single-column design with skill tags and modern typography',
    colors: {
      primary: '#1a202c',
      secondary: '#4a5568',
      accent: '#3182ce',
      text: '#2d3748',
      background: '#ffffff'
    },
    fonts: {
      heading: 'Inter, sans-serif',
      body: 'Inter, sans-serif'
    },
    layout: {
      columns: 1,
      spacing: 'normal'
    }
  },
  executive: {
    id: 'executive',
    name: 'Executive Banner',
    category: 'Corporate',
    description: 'Professional header banner with sophisticated single-column layout',
    colors: {
      primary: '#2b6cb0',
      secondary: '#4299e1',
      accent: '#1a365d',
      text: '#2d3748',
      background: '#ffffff'
    },
    fonts: {
      heading: 'Inter, sans-serif',
      body: 'Inter, sans-serif'
    },
    layout: {
      columns: 1,
      spacing: 'normal'
    }
  },
  classic: {
    id: 'classic',
    name: 'Classic Lines',
    category: 'Traditional',
    description: 'Traditional layout with horizontal line separators between sections',
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
  }
};

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
      primary: '#495057',
      secondary: '#6c757d',
      accent: '#212529',
      text: '#212529',
      background: '#f8f9fa'
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
      primary: '#212529',
      secondary: '#495057',
      accent: '#6c757d',
      text: '#212529',
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
      primary: '#212529',
      secondary: '#495057',
      accent: '#6c757d',
      text: '#212529',
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
    description: 'US Letter format with Helvetica Neue, precise spacing, and horizontal line separators',
    colors: {
      primary: '#000000',
      secondary: '#000000',
      accent: '#000000',
      text: '#000000',
      background: '#ffffff'
    },
    fonts: {
      heading: 'Inter, "Helvetica Neue", Helvetica, Arial, sans-serif',
      body: 'Inter, "Helvetica Neue", Helvetica, Arial, sans-serif'
    },
    layout: {
      columns: 1,
      spacing: 'precise'
    }
  }
};

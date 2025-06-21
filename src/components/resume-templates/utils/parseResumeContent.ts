
interface ParsedResume {
  name: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  experience: Array<{
    title: string;
    company: string;
    duration: string;
    bullets: string[];
  }>;
  education: Array<{
    degree: string;
    school: string;
    year: string;
  }>;
  skills: Array<{
    category: string;
    items: string[];
  }>;
}

interface StructuredResumeData {
  name: string;
  contact: {
    email: string;
    phone: string;
    location: string;
  };
  summary: string;
  experience: Array<{
    title: string;
    company: string;
    duration: string;
    bullets: string[];
  }>;
  education: Array<{
    degree: string;
    school: string;
    year: string;
  }>;
  skills: Array<{
    category: string;
    items: string[];
  }>;
  certifications?: Array<{
    name: string;
    issuer: string;
    year: string;
  }>;
}

export const parseResumeContent = (resumeText: string): ParsedResume => {
  console.log('Parsing resume data:', resumeText.substring(0, 200) + '...');

  // First, try to parse as structured JSON (new format)
  try {
    const structuredData: StructuredResumeData = JSON.parse(resumeText);
    
    // Validate that it has the expected structure
    if (structuredData && typeof structuredData === 'object' && structuredData.name) {
      console.log('Found structured JSON data, using direct parsing');
      
      return {
        name: structuredData.name || 'Professional Name',
        email: structuredData.contact?.email || '',
        phone: structuredData.contact?.phone || '',
        location: structuredData.contact?.location || '',
        summary: structuredData.summary || '',
        experience: structuredData.experience || [],
        education: structuredData.education || [],
        skills: structuredData.skills || []
      };
    }
  } catch (e) {
    console.log('Not structured JSON, falling back to text parsing');
  }

  // Fallback to legacy text parsing for existing resumes
  const result: ParsedResume = {
    name: '',
    email: '',
    phone: '',
    location: '',
    summary: '',
    experience: [],
    education: [],
    skills: []
  };

  const lines = resumeText.split('\n').map(line => line.trim()).filter(line => line);
  
  // Enhanced contact information extraction
  const emailMatch = resumeText.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  if (emailMatch) result.email = emailMatch[0];

  const phoneMatch = resumeText.match(/(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/);
  if (phoneMatch) result.phone = phoneMatch[0];

  // Extract location (look for city, state patterns or full addresses)
  const locationPatterns = [
    /([A-Z][a-z]+,\s*[A-Z]{2}(?:\s+\d{5})?)/,
    /([A-Z][a-z]+\s+[A-Z][a-z]+,\s*[A-Z]{2})/,
    /(\d+\s+[A-Za-z\s]+,\s*[A-Z][a-z]+,\s*[A-Z]{2})/
  ];
  
  for (const pattern of locationPatterns) {
    const locationMatch = resumeText.match(pattern);
    if (locationMatch) {
      result.location = locationMatch[0];
      break;
    }
  }

  // Extract name - look for patterns at the beginning
  const namePatterns = [
    /^([A-Z][a-z]+(?:\s+[A-Z][a-z]*){1,3})$/,
    /^([A-Z][A-Z\s]+)$/ // All caps names
  ];
  
  for (const line of lines.slice(0, 10)) {
    if (line.includes('@') || line.includes('|') || /\d/.test(line)) continue;
    
    for (const pattern of namePatterns) {
      if (pattern.test(line)) {
        result.name = line;
        break;
      }
    }
    if (result.name) break;
  }

  // Enhanced summary extraction
  const summaryPatterns = [
    /(?:PROFESSIONAL\s+SUMMARY|SUMMARY|OBJECTIVE|PROFILE)(?:\s*:?)?\s*\n((?:(?!\n(?:[A-Z\s]{3,}|EXPERIENCE|EDUCATION|SKILLS|WORK)).+\n?)*)/i,
    /(?:SUMMARY|OBJECTIVE)(?:\s*:?)?\s*((?:(?!\n[A-Z]{3,}).+\n?)*)/i
  ];
  
  for (const pattern of summaryPatterns) {
    const summaryMatch = resumeText.match(pattern);
    if (summaryMatch && summaryMatch[1] && summaryMatch[1].trim().length > 20) {
      result.summary = summaryMatch[1].trim().replace(/\n+/g, ' ');
      break;
    }
  }

  // Enhanced experience extraction - handle both formats
  const experiencePatterns = [
    /(?:PROFESSIONAL\s+EXPERIENCE|WORK\s+EXPERIENCE|EXPERIENCE)(?:\s*:?)?\s*\n((?:(?!\n(?:EDUCATION|SKILLS|CERTIFICATIONS|SUMMARY)).+\n?)*)/i
  ];

  let experienceText = '';
  for (const pattern of experiencePatterns) {
    const match = resumeText.match(pattern);
    if (match && match[1]) {
      experienceText = match[1];
      break;
    }
  }

  if (experienceText) {
    console.log('Found experience text, parsing...');
    
    const experienceBlocks = experienceText.split(/\n\s*\n/).filter(block => block.trim());
    
    for (const block of experienceBlocks) {
      const blockLines = block.split('\n').filter(line => line.trim());
      if (blockLines.length === 0) continue;
      
      // Look for pipe-separated format (both Company|Title|Date and Title|Company|Date)
      const headerLine = blockLines.find(line => line.includes('|') && line.split('|').length >= 2);
      
      if (headerLine) {
        const parts = headerLine.split('|').map(part => part.trim());
        
        if (parts.length >= 2) {
          let company, title, duration;
          
          // Try to determine format by checking for common company indicators
          if (parts[0].toLowerCase().includes('inc') || parts[0].toLowerCase().includes('corp') || 
              parts[0].toLowerCase().includes('llc') || parts[0].toLowerCase().includes('ltd') ||
              parts[0].match(/^[A-Z][a-z]+(\s+[A-Z][a-z]*)*$/)) {
            // Company | Title | Date format
            company = parts[0];
            title = parts[1];
            duration = parts[2] || 'Date Range';
          } else {
            // Title | Company | Date format
            title = parts[0];
            company = parts[1];
            duration = parts[2] || 'Date Range';
          }
          
          // Extract bullets from the remaining lines
          const bullets = [];
          const bulletLines = blockLines.slice(blockLines.indexOf(headerLine) + 1);
          
          for (const line of bulletLines) {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-') || trimmedLine.startsWith('*')) {
              const bullet = trimmedLine.replace(/^[•\-\*]\s*/, '').trim();
              if (bullet && bullet.length > 5) {
                bullets.push(bullet);
              }
            } else if (trimmedLine.length > 10 && !trimmedLine.includes('|')) {
              bullets.push(trimmedLine);
            }
          }
          
          if (company && title && company.length > 1 && title.length > 1) {
            result.experience.push({
              title,
              company,
              duration,
              bullets
            });
          }
        }
      }
    }
  }

  // Enhanced education extraction
  const educationPatterns = [
    /(?:EDUCATION)(?:\s*:?)?\s*\n((?:(?!\n(?:SKILLS|CERTIFICATIONS|EXPERIENCE)).+\n?)*)/i
  ];
  
  for (const pattern of educationPatterns) {
    const educationMatch = resumeText.match(pattern);
    if (educationMatch && educationMatch[1]) {
      const eduText = educationMatch[1];
      const eduStrategies = [
        /([^,\n]+),\s*([^,\n]+)(?:,\s*(\d{4}|\d{4}-\d{4}))?/g,
        /([^|\n]+)\s*\|\s*([^|\n]+)\s*\|\s*([^|\n]+)/g,
      ];
      
      for (const strategy of eduStrategies) {
        let eduMatch;
        while ((eduMatch = strategy.exec(eduText)) !== null) {
          let degree = eduMatch[1] ? eduMatch[1].trim() : '';
          let school = eduMatch[2] ? eduMatch[2].trim() : '';
          let year = eduMatch[3] ? eduMatch[3].trim() : 'N/A';
          
          if (degree.toLowerCase().includes('university') || degree.toLowerCase().includes('college')) {
            [degree, school] = [school, degree];
          }
          
          if (degree && school && degree.length > 2 && school.length > 2) {
            result.education.push({ degree, school, year });
          }
        }
        if (result.education.length > 0) break;
      }
    }
  }

  // Enhanced skills extraction
  const skillsPatterns = [
    /(?:TECHNICAL\s+SKILLS|SKILLS|CORE\s+COMPETENCIES)(?:\s*:?)?\s*\n((?:(?!\n(?:EDUCATION|CERTIFICATIONS|EXPERIENCE)).+\n?)*)/i
  ];
  
  for (const pattern of skillsPatterns) {
    const skillsMatch = resumeText.match(pattern);
    if (skillsMatch && skillsMatch[1]) {
      const skillsText = skillsMatch[1];
      const skillLines = skillsText.split('\n').filter(line => line.trim());
      
      for (const line of skillLines) {
        if (line.includes(':')) {
          const [category, items] = line.split(':');
          if (category && items) {
            const cleanCategory = category.trim().replace(/^[•\-\*]\s*/, '');
            const skillItems = items.split(/[,;]/).map(item => item.trim()).filter(item => item);
            
            if (cleanCategory && skillItems.length > 0) {
              result.skills.push({
                category: cleanCategory,
                items: skillItems
              });
            }
          }
        }
      }
    }
  }

  // Fallback data to ensure templates always have content
  if (!result.name) {
    result.name = 'Professional Name';
  }
  
  if (!result.summary && resumeText.length > 50) {
    const paragraphs = resumeText.split('\n\n').filter(p => p.length > 50);
    if (paragraphs.length > 0) {
      result.summary = paragraphs[0].substring(0, 300).replace(/\n/g, ' ') + (paragraphs[0].length > 300 ? '...' : '');
    }
  }

  if (result.experience.length === 0 && resumeText.length > 100) {
    result.experience.push({
      title: 'Professional Role',
      company: 'Company Name',
      duration: 'Date Range',
      bullets: ['Key achievement from your optimized resume', 'Another important accomplishment']
    });
  }

  console.log('Final parsing result:', {
    name: result.name,
    experienceCount: result.experience.length,
    skillsCount: result.skills.length,
    educationCount: result.education.length
  });

  return result;
};

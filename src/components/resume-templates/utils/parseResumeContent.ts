
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

export const parseResumeContent = (resumeText: string): ParsedResume => {
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

  // Try to parse as JSON first (in case it's structured data)
  try {
    const jsonData = JSON.parse(resumeText);
    if (jsonData && typeof jsonData === 'object') {
      return {
        name: jsonData.name || jsonData.fullName || '',
        email: jsonData.email || '',
        phone: jsonData.phone || jsonData.phoneNumber || '',
        location: jsonData.location || jsonData.address || '',
        summary: jsonData.summary || jsonData.professionalSummary || jsonData.objective || '',
        experience: jsonData.experience || jsonData.workExperience || [],
        education: jsonData.education || [],
        skills: jsonData.skills || []
      };
    }
  } catch (e) {
    // Not JSON, continue with text parsing
  }

  const lines = resumeText.split('\n').filter(line => line.trim());
  
  // Enhanced contact information extraction
  const emailMatch = resumeText.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  if (emailMatch) result.email = emailMatch[0];

  const phoneMatch = resumeText.match(/(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/);
  if (phoneMatch) result.phone = phoneMatch[0];

  // Extract location (look for city, state patterns)
  const locationMatch = resumeText.match(/([A-Z][a-z]+,\s*[A-Z]{2})|([A-Z][a-z]+\s*[A-Z][a-z]+,\s*[A-Z]{2})/);
  if (locationMatch) result.location = locationMatch[0];

  // Extract name (first non-empty line that looks like a name)
  const namePattern = /^[A-Z][a-z]+(?:\s+[A-Z][a-z]*){1,3}$/;
  for (const line of lines.slice(0, 5)) {
    if (namePattern.test(line.trim()) && !line.includes('@') && !line.includes('|')) {
      result.name = line.trim();
      break;
    }
  }

  // Enhanced summary extraction
  const summaryPatterns = [
    /(?:PROFESSIONAL\s+SUMMARY|SUMMARY|OBJECTIVE|PROFILE)(?:\s*:)?\s*\n((?:(?!\n(?:[A-Z\s]{2,}|EXPERIENCE|EDUCATION|SKILLS)).+\n?)*)/i,
    /(?:SUMMARY|OBJECTIVE)(?:\s*:)?\s*((?:(?!\n[A-Z]{2,}).+\n?)*)/i
  ];
  
  for (const pattern of summaryPatterns) {
    const summaryMatch = resumeText.match(pattern);
    if (summaryMatch && summaryMatch[1]) {
      result.summary = summaryMatch[1].trim().replace(/\n+/g, ' ');
      break;
    }
  }

  // Enhanced experience extraction
  const experienceSection = resumeText.match(/(?:PROFESSIONAL\s+EXPERIENCE|WORK\s+EXPERIENCE|EXPERIENCE)(?:\s*:)?\s*\n((?:(?!\n(?:EDUCATION|SKILLS|CERTIFICATIONS)).+\n?)*)/i);
  if (experienceSection) {
    const expText = experienceSection[1];
    const jobBlocks = expText.split(/\n(?=[A-Z][^|\n]*\s*\|\s*[^|\n]*\s*\|\s*[^|\n]*)/);
    
    for (const block of jobBlocks) {
      const jobMatch = block.match(/([A-Z][^|\n]*?)\s*\|\s*([^|\n]*?)\s*\|\s*([^|\n]*?)(?:\n((?:•[^\n]*\n?)*)|$)/);
      if (jobMatch) {
        const bullets = jobMatch[4] 
          ? jobMatch[4].split('\n').filter(b => b.trim().startsWith('•')).map(b => b.replace('•', '').trim())
          : [];
        
        result.experience.push({
          title: jobMatch[1].trim(),
          company: jobMatch[2].trim(),
          duration: jobMatch[3].trim(),
          bullets
        });
      }
    }
  }

  // Enhanced education extraction
  const educationMatch = resumeText.match(/(?:EDUCATION)(?:\s*:)?\s*\n((?:(?!\n(?:SKILLS|CERTIFICATIONS|EXPERIENCE)).+\n?)*)/i);
  if (educationMatch) {
    const eduText = educationMatch[1];
    const eduPattern = /([^,\n]+),\s*([^,\n]+)(?:,\s*(\d{4}|\d{4}-\d{4}))?/g;
    let eduMatch;
    while ((eduMatch = eduPattern.exec(eduText)) !== null) {
      result.education.push({
        degree: eduMatch[1].trim(),
        school: eduMatch[2].trim(),
        year: eduMatch[3] || 'N/A'
      });
    }
  }

  // Enhanced skills extraction
  const skillsMatch = resumeText.match(/(?:TECHNICAL\s+SKILLS|SKILLS|CORE\s+COMPETENCIES)(?:\s*:)?\s*\n((?:(?!\n(?:EDUCATION|CERTIFICATIONS|EXPERIENCE)).+\n?)*)/i);
  if (skillsMatch) {
    const skillsText = skillsMatch[1];
    const skillLines = skillsText.split('\n').filter(line => line.includes(':') || line.includes('•'));
    
    for (const line of skillLines) {
      if (line.includes(':')) {
        const [category, items] = line.split(':');
        if (category && items) {
          result.skills.push({
            category: category.trim().replace('•', ''),
            items: items.split(',').map(item => item.trim()).filter(item => item)
          });
        }
      } else if (line.includes('•')) {
        const skillItem = line.replace('•', '').trim();
        if (skillItem) {
          const existingGeneral = result.skills.find(s => s.category === 'Technical Skills');
          if (existingGeneral) {
            existingGeneral.items.push(skillItem);
          } else {
            result.skills.push({
              category: 'Technical Skills',
              items: [skillItem]
            });
          }
        }
      }
    }
  }

  // Fallback data if parsing fails
  if (!result.name) {
    result.name = 'Professional Name';
  }
  
  if (!result.summary && resumeText.length > 50) {
    // Take first meaningful paragraph as summary
    const paragraphs = resumeText.split('\n\n').filter(p => p.length > 50);
    if (paragraphs.length > 0) {
      result.summary = paragraphs[0].substring(0, 300) + '...';
    }
  }

  if (result.experience.length === 0 && resumeText.length > 100) {
    // Create a basic experience entry from available text
    result.experience.push({
      title: 'Professional Role',
      company: 'Company Name',
      duration: 'Date Range',
      bullets: ['Key achievement from your optimized resume', 'Another important accomplishment']
    });
  }

  return result;
};

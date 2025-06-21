
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

  console.log('Parsing resume text:', resumeText.substring(0, 500) + '...');

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

  // Enhanced summary extraction with multiple patterns
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

  // Enhanced experience extraction with multiple strategies
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
    console.log('Found experience text:', experienceText.substring(0, 300) + '...');
    
    // Strategy 1: Look for ALL CAPS job titles followed by company and dates
    const jobTitlePattern = /^([A-Z][A-Z\s&,-]+(?:[A-Z]|[IVX]+))\s*\n?([A-Za-z][^|\n]*?)\s*[|\-–]\s*([^|\n]*?)(?:\n|$)/gm;
    let match;
    const tempExperience = [];
    
    while ((match = jobTitlePattern.exec(experienceText)) !== null) {
      const title = match[1].trim();
      const company = match[2].trim();
      const duration = match[3].trim();
      
      if (title.length > 2 && company.length > 2) {
        tempExperience.push({
          title,
          company,
          duration,
          bullets: [],
          startIndex: match.index,
          endIndex: match.index + match[0].length
        });
      }
    }

    // Strategy 2: Look for pipe-separated format
    if (tempExperience.length === 0) {
      const pipePattern = /([^|\n]+)\s*\|\s*([^|\n]+)\s*\|\s*([^|\n]+)/g;
      while ((match = pipePattern.exec(experienceText)) !== null) {
        const parts = [match[1].trim(), match[2].trim(), match[3].trim()];
        
        // Determine which part is title, company, duration
        let title = parts[0];
        let company = parts[1];
        let duration = parts[2];
        
        // If last part looks like a job title, reorder
        if (parts[2].match(/^[A-Z][A-Za-z\s]+$/)) {
          title = parts[2];
          company = parts[0];
          duration = parts[1];
        }
        
        if (title.length > 2 && company.length > 2) {
          tempExperience.push({
            title,
            company,
            duration,
            bullets: [],
            startIndex: match.index,
            endIndex: match.index + match[0].length
          });
        }
      }
    }

    // Strategy 3: Look for any pattern with job-like keywords
    if (tempExperience.length === 0) {
      const jobKeywords = /(?:MANAGER|ANALYST|DEVELOPER|ENGINEER|DIRECTOR|COORDINATOR|SPECIALIST|ASSISTANT|LEAD|SENIOR|JUNIOR)/i;
      const lineBlocks = experienceText.split('\n\n');
      
      for (const block of lineBlocks) {
        const blockLines = block.split('\n').filter(line => line.trim());
        if (blockLines.length > 0 && jobKeywords.test(blockLines[0])) {
          const firstLine = blockLines[0];
          const parts = firstLine.split(/[|\-–]/);
          
          if (parts.length >= 2) {
            tempExperience.push({
              title: parts[0].trim(),
              company: parts[1].trim(),
              duration: parts[2] ? parts[2].trim() : 'Date Range',
              bullets: [],
              startIndex: 0,
              endIndex: block.length
            });
          }
        }
      }
    }

    console.log('Found temp experience entries:', tempExperience.length);

    // Extract bullets for each experience
    for (let i = 0; i < tempExperience.length; i++) {
      const exp = tempExperience[i];
      const nextExp = tempExperience[i + 1];
      
      const startPos = exp.endIndex;
      const endPos = nextExp ? nextExp.startIndex : experienceText.length;
      const sectionText = experienceText.substring(startPos, endPos);
      
      // Extract bullet points
      const bulletPatterns = [
        /^[•\-\*]\s*(.+)$/gm,
        /^\s*[•\-\*]\s*(.+)$/gm,
        /^(?:\d+\.|\w\))\s*(.+)$/gm
      ];
      
      const bullets = [];
      for (const pattern of bulletPatterns) {
        let bulletMatch;
        while ((bulletMatch = pattern.exec(sectionText)) !== null) {
          const bullet = bulletMatch[1].trim();
          if (bullet.length > 10 && !bullets.includes(bullet)) {
            bullets.push(bullet);
          }
        }
        if (bullets.length > 0) break;
      }
      
      result.experience.push({
        title: exp.title,
        company: exp.company,
        duration: exp.duration,
        bullets
      });
    }
  }

  console.log('Final parsed experience count:', result.experience.length);

  // Enhanced education extraction
  const educationPatterns = [
    /(?:EDUCATION)(?:\s*:?)?\s*\n((?:(?!\n(?:SKILLS|CERTIFICATIONS|EXPERIENCE)).+\n?)*)/i
  ];
  
  for (const pattern of educationPatterns) {
    const educationMatch = resumeText.match(pattern);
    if (educationMatch && educationMatch[1]) {
      const eduText = educationMatch[1];
      
      // Multiple education parsing strategies
      const eduStrategies = [
        // Degree, School, Year format
        /([^,\n]+),\s*([^,\n]+)(?:,\s*(\d{4}|\d{4}-\d{4}))?/g,
        // School | Degree | Year format
        /([^|\n]+)\s*\|\s*([^|\n]+)\s*\|\s*([^|\n]+)/g,
        // Line-by-line format
        /^([A-Z][^|\n]*?)(?:\s*[\-–]\s*([^|\n]*?))?(?:\s*[\-–]\s*(\d{4}|\d{4}-\d{4}))?$/gm
      ];
      
      for (const strategy of eduStrategies) {
        let eduMatch;
        while ((eduMatch = strategy.exec(eduText)) !== null) {
          let degree = eduMatch[1] ? eduMatch[1].trim() : '';
          let school = eduMatch[2] ? eduMatch[2].trim() : '';
          let year = eduMatch[3] ? eduMatch[3].trim() : 'N/A';
          
          // Swap if school and degree seem reversed
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
        } else if (line.match(/^[•\-\*]/)) {
          const skillItem = line.replace(/^[•\-\*]\s*/, '').trim();
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
  }

  // Fallback data to ensure templates always have content to display
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

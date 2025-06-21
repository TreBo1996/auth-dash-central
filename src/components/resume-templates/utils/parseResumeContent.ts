
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
  const lines = resumeText.split('\n').filter(line => line.trim());
  
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

  // Extract contact information
  const emailMatch = resumeText.match(/[\w\.-]+@[\w\.-]+\.\w+/);
  if (emailMatch) result.email = emailMatch[0];

  const phoneMatch = resumeText.match(/(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/);
  if (phoneMatch) result.phone = phoneMatch[0];

  // Extract name (usually first line or before email)
  const namePattern = /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+/gm;
  const nameMatch = resumeText.match(namePattern);
  if (nameMatch) result.name = nameMatch[0];

  // Extract summary (look for summary/objective sections)
  const summaryMatch = resumeText.match(/(?:SUMMARY|OBJECTIVE|PROFILE)[\s\S]*?(?=\n[A-Z]|\n\n|$)/i);
  if (summaryMatch) {
    result.summary = summaryMatch[0].replace(/(?:SUMMARY|OBJECTIVE|PROFILE)[:\s]*/i, '').trim();
  }

  // Extract experience entries
  const experiencePattern = /([A-Z][^|\n]*?)\s*\|\s*([^|\n]*?)\s*\|\s*([^|\n]*?)(?:\n((?:•[^\n]*\n?)*)|$)/g;
  let expMatch;
  while ((expMatch = experiencePattern.exec(resumeText)) !== null) {
    const bullets = expMatch[4] ? expMatch[4].split('\n').filter(b => b.trim().startsWith('•')).map(b => b.replace('•', '').trim()) : [];
    result.experience.push({
      title: expMatch[1].trim(),
      company: expMatch[2].trim(),
      duration: expMatch[3].trim(),
      bullets
    });
  }

  // Extract education
  const educationPattern = /([A-Z][^,\n]*?)\s*,\s*([^,\n]*?)\s*,?\s*(\d{4}|\d{4}-\d{4})/g;
  let eduMatch;
  while ((eduMatch = educationPattern.exec(resumeText)) !== null) {
    result.education.push({
      degree: eduMatch[1].trim(),
      school: eduMatch[2].trim(),
      year: eduMatch[3].trim()
    });
  }

  // Extract skills (look for sections with lists)
  const skillsPattern = /(?:SKILLS|TECHNICAL SKILLS|TECHNOLOGIES)[\s:]*\n((?:[A-Za-z\s]+:[^\n]+\n?)*)/i;
  const skillsMatch = resumeText.match(skillsPattern);
  if (skillsMatch) {
    const skillLines = skillsMatch[1].split('\n').filter(line => line.includes(':'));
    skillLines.forEach(line => {
      const [category, items] = line.split(':');
      if (category && items) {
        result.skills.push({
          category: category.trim(),
          items: items.split(',').map(item => item.trim()).filter(item => item)
        });
      }
    });
  }

  // Fallback parsing for simpler formats
  if (result.experience.length === 0) {
    // Try to extract any job titles and companies
    const simpleExpPattern = /([A-Z][a-zA-Z\s]+(?:Manager|Developer|Engineer|Analyst|Specialist|Director|Lead))[^\n]*\n?([A-Z][a-zA-Z\s&,]+)(?:\n|$)/g;
    let simpleMatch;
    while ((simpleMatch = simpleExpPattern.exec(resumeText)) !== null) {
      result.experience.push({
        title: simpleMatch[1].trim(),
        company: simpleMatch[2].trim(),
        duration: 'Present',
        bullets: ['Experience details from optimized resume']
      });
    }
  }

  // If no structured data found, create basic structure from the text
  if (!result.name && !result.summary && result.experience.length === 0) {
    result.name = 'Professional Name';
    result.summary = resumeText.substring(0, 200) + '...';
    result.experience.push({
      title: 'Professional Role',
      company: 'Company Name',
      duration: 'Date Range',
      bullets: ['Key achievement from your optimized resume', 'Another important accomplishment']
    });
  }

  return result;
};

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function toTitleCase(str: string): string {
  if (!str) return str;
  
  const articles = ['a', 'an', 'the'];
  const prepositions = ['in', 'on', 'at', 'for', 'with', 'by', 'of', 'to', 'from', 'up', 'out', 'off', 'over'];
  const conjunctions = ['and', 'or', 'but', 'nor', 'so', 'yet'];
  const specialTerms = ['iOS', 'API', 'UI', 'UX', 'JavaScript', 'TypeScript', 'HTML', 'CSS', 'SQL', 'AWS', 'AI', 'ML', 'QA', 'DevOps', 'SaaS', 'CRM', 'ERP', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV'];
  
  return str.toLowerCase()
    .split(' ')
    .map((word, index) => {
      // Always capitalize first word
      if (index === 0) return word.charAt(0).toUpperCase() + word.slice(1);
      
      // Check for special terms that should maintain specific capitalization
      const specialTerm = specialTerms.find(term => term.toLowerCase() === word);
      if (specialTerm) return specialTerm;
      
      // Keep small words lowercase unless they're the first word
      if ([...articles, ...prepositions, ...conjunctions].includes(word)) {
        return word;
      }
      
      // Handle hyphenated words
      if (word.includes('-')) {
        return word.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('-');
      }
      
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

export function cleanJobDescription(text: string): string {
  if (!text) return text;
  
  return text
    // Remove excessive special characters and normalize
    .replace(/[•◦▪▫★☆■□▲△▼▽]/g, '•') // Normalize bullet points
    .replace(/[\/]{2,}/g, ' / ') // Clean excessive forward slashes
    .replace(/[\*]{2,}/g, '*') // Clean excessive asterisks
    .replace(/[-]{3,}/g, '---') // Clean excessive dashes
    .replace(/[_]{2,}/g, '_') // Clean excessive underscores
    .replace(/[\s]{3,}/g, '\n\n') // Convert excessive spaces to paragraph breaks
    .replace(/[\n]{3,}/g, '\n\n') // Limit consecutive line breaks
    .replace(/\s*[\/]\s*/g, ' / ') // Clean up forward slashes with proper spacing
    .replace(/\s*[\*]\s*/g, ' * ') // Clean up asterisks with proper spacing
    .trim();
}

interface FormattedLine {
  content: string;
  isHeader: boolean;
  hasBoldText: boolean;
  boldParts?: { text: string; isBold: boolean }[];
}

export function parseJobDescriptionForFormatting(text: string): FormattedLine[] {
  if (!text) return [];
  
  const cleanedText = cleanJobDescription(text);
  const lines = cleanedText.split('\n');
  const formattedLines: FormattedLine[] = [];
  
  lines.forEach((line) => {
    if (!line.trim()) {
      formattedLines.push({ content: '', isHeader: false, hasBoldText: false });
      return;
    }
    
    // Check if line is a section header
    const headerPattern = /^(requirements?|qualifications?|responsibilities?|duties|benefits?|about\s+(the\s+)?(role|position|company)|what\s+(you'?ll|we'?re)\s+(do|looking\s+for)|why\s+join\s+us|skills?|experience|education)\s*:?\s*$/i;
    const isHeader = headerPattern.test(line.trim());
    
    if (isHeader) {
      formattedLines.push({
        content: line.trim(),
        isHeader: true,
        hasBoldText: false
      });
    } else {
      // Process regular content lines
      let processedLine = line.trim();
      
      // Check for inline section headers (like "Requirements:" at the start of a line)
      const inlineHeaderPattern = /^(requirements?|qualifications?|responsibilities?|duties|benefits?|skills?|experience|education)\s*:\s*/i;
      const hasBoldText = inlineHeaderPattern.test(processedLine);
      
      if (hasBoldText) {
        const parts: { text: string; isBold: boolean }[] = [];
        const match = processedLine.match(inlineHeaderPattern);
        if (match) {
          parts.push({ text: match[0], isBold: true });
          parts.push({ text: processedLine.replace(inlineHeaderPattern, ''), isBold: false });
        }
        
        formattedLines.push({
          content: processedLine,
          isHeader: false,
          hasBoldText: true,
          boldParts: parts
        });
      } else {
        formattedLines.push({
          content: processedLine,
          isHeader: false,
          hasBoldText: false
        });
      }
    }
  });
  
  return formattedLines;
}

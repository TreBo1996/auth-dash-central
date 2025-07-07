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
  const specialTerms = ['iOS', 'API', 'UI', 'UX', 'JavaScript', 'TypeScript', 'HTML', 'CSS', 'SQL', 'AWS', 'AI', 'ML', 'QA', 'DevOps', 'SaaS', 'CRM', 'ERP'];
  
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

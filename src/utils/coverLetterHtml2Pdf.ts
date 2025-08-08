// Utility to export cover letter content as PDF matching the on-screen preview
// Uses html2pdf.js to rasterize the styled HTML with pre-wrap spacing

// @ts-ignore - html2pdf.js has no official TypeScript types
import html2pdf from 'html2pdf.js';

// Generate a PDF that visually matches the preview (whitespace-pre-wrap, text-sm, leading-relaxed)
export async function generateCoverLetterPreviewPDF(content: string, filename: string = 'cover-letter.pdf'): Promise<void> {
  // Safety: ensure content is a string
  const text = typeof content === 'string' ? content : String(content ?? '');

  // Create an offscreen container with styles matching the preview
  const wrapper = document.createElement('div');
  wrapper.style.position = 'fixed';
  wrapper.style.left = '-10000px';
  wrapper.style.top = '0';
  wrapper.style.zIndex = '-1';
  // Width = Letter width (8.5in) - 2in margins = 6.5in for predictable wrapping
  wrapper.style.width = '6.5in';
  wrapper.style.backgroundColor = '#ffffff';
  wrapper.style.color = 'inherit';
  wrapper.style.fontFamily = "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, 'Apple Color Emoji', 'Segoe UI Emoji'";
  wrapper.style.fontSize = '14px'; // text-sm
  wrapper.style.lineHeight = '1.625'; // leading-relaxed
  wrapper.style.whiteSpace = 'pre-wrap'; // preserve newlines like preview
  wrapper.style.wordBreak = 'break-word';
  wrapper.style.hyphens = 'auto';
  wrapper.style.padding = '0';

  // Set plain text to avoid any HTML injection
  wrapper.textContent = text;

  document.body.appendChild(wrapper);

  try {
    const opts = {
      margin: 1, // 1 inch all around (standard letter margins)
      filename,
      image: { type: 'jpeg', quality: 0.95 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait', compress: true },
      pagebreak: { mode: ['css', 'legacy'] as const },
    } as const;

    await (html2pdf() as any).set(opts).from(wrapper).save(filename);
  } finally {
    // Clean up the temporary DOM node
    wrapper.remove();
  }
}


import mammoth from 'mammoth';

// Import PDF.js in a browser-compatible way
import * as pdfjsLib from 'pdfjs-dist';

// Set up PDF.js worker for browser environment
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

export const parseDocument = async (file: File): Promise<string> => {
  const fileType = file.type;
  const fileName = file.name.toLowerCase();

  console.log('Parsing document:', { fileName, fileType, size: file.size });

  try {
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      console.log('Attempting PDF parsing with pdfjs-dist...');
      return await parsePDF(file);
    } else if (
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileName.endsWith('.docx')
    ) {
      console.log('Attempting DOCX parsing...');
      return await parseDocx(file);
    } else {
      throw new Error(`Unsupported file type: ${fileType || 'unknown'}. Please use PDF or DOCX format.`);
    }
  } catch (error) {
    console.error('Document parsing error:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('Invalid PDF') || error.message.includes('invalid')) {
        throw new Error('The PDF file appears to be corrupted or invalid. Please try a different file or convert to DOCX format.');
      } else if (error.message.includes('password') || error.message.includes('encrypted')) {
        throw new Error('Password-protected or encrypted PDFs are not supported. Please use an unprotected file or convert to DOCX format.');
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        throw new Error('Network error while processing PDF. Please check your connection and try again, or use DOCX format instead.');
      } else if (error.message.includes('Unsupported file type')) {
        throw error; // Keep the specific message
      } else {
        throw error;
      }
    }
    
    throw new Error('Failed to parse document. Please try converting to DOCX format for better compatibility.');
  }
};

const parsePDF = async (file: File): Promise<string> => {
  try {
    console.log('Converting PDF file to array buffer...');
    const arrayBuffer = await file.arrayBuffer();
    
    console.log('Loading PDF document with pdfjs-dist...');
    const pdf = await pdfjsLib.getDocument({
      data: arrayBuffer,
      useSystemFonts: true,
    }).promise;
    
    console.log(`PDF loaded successfully with ${pdf.numPages} pages`);
    
    let fullText = '';
    
    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      console.log(`Processing page ${pageNum}/${pdf.numPages}`);
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Combine all text items from the page
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      
      fullText += pageText + '\n';
    }
    
    const trimmedText = fullText.trim();
    console.log(`PDF parsing completed, extracted ${trimmedText.length} characters from ${pdf.numPages} pages`);
    
    if (!trimmedText) {
      throw new Error('No text could be extracted from this PDF. The file may be image-based, scanned, or corrupted. Please try converting to DOCX format.');
    }
    
    return trimmedText;
  } catch (error) {
    console.error('PDF parsing failed:', error);
    
    // Re-throw with more specific error message
    if (error instanceof Error) {
      if (error.message.includes('No text could be extracted')) {
        throw error; // Keep the specific message
      } else if (error.message.includes('Invalid PDF') || error.message.includes('invalid')) {
        throw new Error('The PDF file is invalid or corrupted. Please try converting to DOCX format.');
      } else if (error.message.includes('Password')) {
        throw new Error('Password-protected PDFs are not supported. Please use an unprotected file or convert to DOCX format.');
      }
    }
    
    throw new Error('Failed to process PDF file. Please convert to DOCX format for better compatibility.');
  }
};

const parseDocx = async (file: File): Promise<string> => {
  try {
    console.log('Converting DOCX file to array buffer...');
    const arrayBuffer = await file.arrayBuffer();
    
    console.log('Extracting text from DOCX...');
    const result = await mammoth.extractRawText({ arrayBuffer });
    
    const trimmedText = result.value.trim();
    console.log(`DOCX parsing completed, extracted ${trimmedText.length} characters`);
    
    if (!trimmedText) {
      throw new Error('No text could be extracted from this DOCX file.');
    }
    
    return trimmedText;
  } catch (error) {
    console.error('DOCX parsing failed:', error);
    throw error;
  }
};

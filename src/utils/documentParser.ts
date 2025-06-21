
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker with CDN URL for better reliability
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.js';

export const parseDocument = async (file: File): Promise<string> => {
  const fileType = file.type;
  const fileName = file.name.toLowerCase();

  console.log('Parsing document:', { fileName, fileType, size: file.size });

  try {
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      console.log('Attempting PDF parsing...');
      return await parsePDF(file);
    } else if (
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileName.endsWith('.docx')
    ) {
      console.log('Attempting DOCX parsing...');
      return await parseDocx(file);
    } else {
      throw new Error(`Unsupported file type: ${fileType || 'unknown'}`);
    }
  } catch (error) {
    console.error('Document parsing error:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('worker')) {
        throw new Error('PDF processing failed. Please try again or use a different file.');
      } else if (error.message.includes('Invalid PDF')) {
        throw new Error('The PDF file appears to be corrupted. Please try a different file.');
      } else if (error.message.includes('password')) {
        throw new Error('Password-protected PDFs are not supported. Please use an unprotected file.');
      } else {
        throw error;
      }
    }
    
    throw new Error('Failed to parse document. Please try a different file format.');
  }
};

const parsePDF = async (file: File): Promise<string> => {
  try {
    console.log('Converting file to array buffer...');
    const arrayBuffer = await file.arrayBuffer();
    
    console.log('Loading PDF document...');
    const pdf = await pdfjsLib.getDocument({ 
      data: arrayBuffer,
      // Add options for better compatibility
      verbosity: 0, // Reduce console noise
      isEvalSupported: false,
      isOffscreenCanvasSupported: false
    }).promise;
    
    console.log(`PDF loaded successfully, ${pdf.numPages} pages`);
    
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      console.log(`Processing page ${i}/${pdf.numPages}...`);
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }
    
    const trimmedText = fullText.trim();
    console.log(`PDF parsing completed, extracted ${trimmedText.length} characters`);
    
    if (!trimmedText) {
      throw new Error('No text could be extracted from this PDF. The file may be image-based or corrupted.');
    }
    
    return trimmedText;
  } catch (error) {
    console.error('PDF parsing failed:', error);
    throw error;
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

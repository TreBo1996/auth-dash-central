
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';

// Completely disable workers for PDF.js to work in restricted environments
pdfjsLib.GlobalWorkerOptions.workerSrc = '';

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
      if (error.message.includes('worker') || error.message.includes('Worker') || error.message.includes('fake worker')) {
        throw new Error('PDF processing is not supported in this environment. Please convert your file to DOCX format and try again.');
      } else if (error.message.includes('Invalid PDF') || error.message.includes('invalid')) {
        throw new Error('The PDF file appears to be corrupted or invalid. Please try a different file or convert to DOCX format.');
      } else if (error.message.includes('password') || error.message.includes('encrypted')) {
        throw new Error('Password-protected or encrypted PDFs are not supported. Please use an unprotected file or convert to DOCX format.');
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        throw new Error('Network error while processing PDF. Please check your connection and try again, or use DOCX format instead.');
      } else {
        throw error;
      }
    }
    
    throw new Error('Failed to parse document. Please try converting to DOCX format for better compatibility.');
  }
};

const parsePDF = async (file: File): Promise<string> => {
  try {
    console.log('Converting file to array buffer...');
    const arrayBuffer = await file.arrayBuffer();
    
    console.log('Loading PDF document in worker-free mode...');
    
    // Force PDF.js to work without workers by using specific configuration
    const pdf = await pdfjsLib.getDocument({ 
      data: arrayBuffer,
      verbosity: 0, // Reduce console noise
      isEvalSupported: false,
      isOffscreenCanvasSupported: false,
      useWorkerFetch: false,
      disableAutoFetch: true,
      disableStream: true,
      useSystemFonts: true,
      // Force main thread operation
      standardFontDataUrl: undefined,
      cMapUrl: undefined,
      cMapPacked: false,
      // Explicitly disable worker
      worker: null
    }).promise;
    
    console.log(`PDF loaded successfully, ${pdf.numPages} pages`);
    
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      console.log(`Processing page ${i}/${pdf.numPages}...`);
      try {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent({
          includeMarkedContent: false,
          disableCombineTextItems: false
        });
        
        const pageText = textContent.items
          .map((item: any) => {
            if ('str' in item) {
              return item.str || '';
            }
            return '';
          })
          .filter(text => text.trim())
          .join(' ');
        
        if (pageText.trim()) {
          fullText += pageText + '\n';
        }
      } catch (pageError) {
        console.warn(`Failed to process page ${i}:`, pageError);
        // Continue with other pages even if one fails
      }
    }
    
    const trimmedText = fullText.trim();
    console.log(`PDF parsing completed, extracted ${trimmedText.length} characters`);
    
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
      } else if (error.message.includes('Invalid PDF')) {
        throw new Error('The PDF file is invalid or corrupted. Please try converting to DOCX format.');
      } else if (error.message.includes('worker') || error.message.includes('Worker')) {
        throw new Error('PDF processing is currently unavailable. Please convert your resume to DOCX format for upload.');
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


import mammoth from 'mammoth';
import { supabase } from '@/integrations/supabase/client';

export const parseDocument = async (file: File): Promise<string> => {
  const fileType = file.type;
  const fileName = file.name.toLowerCase();

  console.log('Parsing document:', { fileName, fileType, size: file.size });

  try {
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      console.log('Processing PDF using server-side edge function...');
      return await parsePDFServerSide(file);
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
    
    // Provide more specific error messages with conversion guidance
    if (error instanceof Error) {
      if (error.message.includes('No text could be extracted') || 
          error.message.includes('Server processing failed') ||
          error.message.includes('Failed to extract readable text')) {
        throw new Error(`PDF parsing failed. This PDF may be:\n• Image-based or scanned\n• Password-protected\n• Using complex formatting\n\n✅ RECOMMENDED SOLUTION:\nConvert your PDF to DOCX format using:\n• Microsoft Word (File → Save As → Word Document)\n• Google Docs (Upload PDF → Download as Word)\n• Online converters like SmallPDF or ILovePDF\n\nDOCX format provides much better text extraction results.`);
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        throw new Error('Network error while processing PDF. Please check your connection and try again, or convert to DOCX format for better reliability.');
      } else if (error.message.includes('Unsupported file type')) {
        throw error; // Keep the specific message
      } else {
        throw error;
      }
    }
    
    throw new Error('Failed to parse document. For best results, please convert to DOCX format.');
  }
};

const parsePDFServerSide = async (file: File): Promise<string> => {
  try {
    console.log('Converting PDF to base64 for server processing...');
    
    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const fileBase64 = btoa(binary);
    
    console.log('Sending PDF to server-side parser...');
    
    // Call the edge function
    const { data, error } = await supabase.functions.invoke('parse-pdf', {
      body: {
        fileBase64,
        fileName: file.name
      }
    });

    if (error) {
      console.error('Edge function error:', error);
      throw new Error(`Server processing failed: ${error.message}`);
    }

    if (!data.success) {
      throw new Error(data.error || 'Server-side PDF parsing failed');
    }

    console.log(`Server-side PDF parsing successful: ${data.text.length} characters extracted`);
    
    // Check if the extracted text looks like garbage (contains too many random characters)
    const textQuality = assessTextQuality(data.text);
    if (textQuality.isLowQuality) {
      throw new Error('PDF text extraction produced poor quality results. This usually indicates the PDF is image-based or uses complex formatting.');
    }
    
    return data.text;

  } catch (error) {
    console.error('Server-side PDF parsing failed:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Server processing failed') || 
          error.message.includes('Server-side PDF parsing failed') ||
          error.message.includes('poor quality results')) {
        throw error; // Keep the specific message
      } else if (error.message.includes('No text could be extracted')) {
        throw error; // Keep the specific message
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        throw new Error('Network error while processing PDF. Please check your connection and try again.');
      }
    }
    
    throw new Error('Failed to process PDF file. Please try converting to DOCX format for better compatibility.');
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

// Helper function to assess text quality
const assessTextQuality = (text: string): { isLowQuality: boolean; reason?: string } => {
  if (!text || text.length < 50) {
    return { isLowQuality: true, reason: 'Text too short' };
  }
  
  // Check for too many single characters or very short words
  const words = text.split(/\s+/).filter(word => word.length > 0);
  const singleCharWords = words.filter(word => word.length === 1).length;
  const singleCharRatio = singleCharWords / words.length;
  
  if (singleCharRatio > 0.3) {
    return { isLowQuality: true, reason: 'Too many single character fragments' };
  }
  
  // Check for too many non-alphabetic characters
  const alphabeticChars = text.match(/[a-zA-Z]/g)?.length || 0;
  const totalChars = text.replace(/\s/g, '').length;
  const alphabeticRatio = alphabeticChars / totalChars;
  
  if (alphabeticRatio < 0.5) {
    return { isLowQuality: true, reason: 'Too few alphabetic characters' };
  }
  
  return { isLowQuality: false };
};

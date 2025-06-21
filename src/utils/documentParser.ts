
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
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('No text could be extracted')) {
        throw new Error('No text could be extracted from this PDF. This may be because:\n• The PDF is image-based or scanned\n• The PDF is password-protected\n• The PDF format is not supported\n\nPlease try converting to DOCX format for better results.');
      } else if (error.message.includes('Server processing failed')) {
        throw new Error('PDF processing failed on the server. Please try:\n• Converting your PDF to DOCX format\n• Ensuring your PDF is not password-protected\n• Using a different PDF file');
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        throw new Error('Network error while processing PDF. Please check your connection and try again.');
      } else if (error.message.includes('Unsupported file type')) {
        throw error; // Keep the specific message
      } else {
        throw error;
      }
    }
    
    throw new Error('Failed to parse document. Please try converting to DOCX format for better compatibility.');
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
    return data.text;

  } catch (error) {
    console.error('Server-side PDF parsing failed:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Server processing failed') || error.message.includes('Server-side PDF parsing failed')) {
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

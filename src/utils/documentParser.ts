
import { supabase } from '@/integrations/supabase/client';

export const parseDocument = async (file: File): Promise<string> => {
  const fileType = file.type;
  const fileName = file.name.toLowerCase();

  console.log('Parsing document:', { fileName, fileType, size: file.size });

  try {
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      console.log('Processing PDF using parse-resume-pdf edge function...');
      return await parsePDFWithStorage(file);
    } else if (
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileName.endsWith('.docx')
    ) {
      console.log('Processing DOCX using parse-resume-docx edge function...');
      return await parseDocxWithStorage(file);
    } else {
      throw new Error(`Unsupported file type: ${fileType || 'unknown'}. Please use PDF or DOCX format.`);
    }
  } catch (error) {
    console.error('Document parsing error:', error);
    
    // Provide more specific error messages with conversion guidance
    if (error instanceof Error) {
      if (error.message.includes('No readable text could be extracted') || 
          error.message.includes('poor quality results') ||
          error.message.includes('image-based') ||
          error.message.includes('garbled')) {
        if (error.message.includes('PDF')) {
          throw new Error(`PDF parsing failed. This PDF may be:\n• Image-based or scanned\n• Password-protected\n• Using complex formatting\n• Corrupted or encoded\n\n✅ RECOMMENDED SOLUTION:\nConvert your PDF to DOCX format using:\n• Microsoft Word (File → Save As → Word Document)\n• Google Docs (Upload PDF → Download as Word)\n• Online converters like SmallPDF or ILovePDF\n\nDOCX format provides much better text extraction results.`);
        } else {
          throw new Error(`DOCX parsing failed. This file may be:\n• Corrupted or damaged\n• Password-protected\n• Using unsupported formatting\n• Empty or contains only images\n\n✅ RECOMMENDED SOLUTION:\nTry resaving the file:\n• Open in Microsoft Word and Save As → Word Document\n• Export from Google Docs as DOCX\n• Ensure the file contains readable text content`);
        }
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        throw new Error('Network error while processing document. Please check your connection and try again.');
      } else if (error.message.includes('Unsupported file type')) {
        throw error; // Keep the specific message
      } else {
        throw error;
      }
    }
    
    throw new Error('Failed to parse document. For best results, please convert to DOCX format.');
  }
};

const parsePDFWithStorage = async (file: File): Promise<string> => {
  try {
    console.log('Uploading PDF to temporary storage for parsing...');
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Authentication required for PDF parsing');
    }

    // Upload file to temporary location in storage
    const tempFileName = `temp_${crypto.randomUUID()}.pdf`;
    const tempFilePath = `${user.id}/temp/${tempFileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('user-files')
      .upload(tempFilePath, file);

    if (uploadError) {
      console.error('Temporary upload error:', uploadError);
      throw new Error(`Failed to upload PDF for processing: ${uploadError.message}`);
    }

    console.log('PDF uploaded to temporary storage, calling parse-resume-pdf function...');

    // Call the parse-resume-pdf edge function
    const { data, error } = await supabase.functions.invoke('parse-resume-pdf', {
      body: {
        file_path: tempFilePath
      }
    });

    // Clean up temporary file
    await supabase.storage
      .from('user-files')
      .remove([tempFilePath]);

    if (error) {
      console.error('Edge function error:', error);
      throw new Error(`PDF parsing failed: ${error.message}`);
    }

    if (!data.parsed_text) {
      throw new Error('No text could be extracted from this PDF');
    }

    console.log(`PDF parsing successful: ${data.parsed_text.length} characters extracted`);
    return data.parsed_text;

  } catch (error) {
    console.error('PDF storage parsing failed:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Authentication required')) {
        throw error;
      } else if (error.message.includes('PDF parsing failed') || 
          error.message.includes('poor quality results') ||
          error.message.includes('image-based')) {
        throw error; // Keep the specific message
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        throw new Error('Network error while processing PDF. Please check your connection and try again.');
      }
    }
    
    throw new Error('Failed to process PDF file. Please try converting to DOCX format for better compatibility.');
  }
};

const parseDocxWithStorage = async (file: File): Promise<string> => {
  try {
    console.log('Uploading DOCX to temporary storage for parsing...');
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Authentication required for DOCX parsing');
    }

    // Upload file to temporary location in storage
    const tempFileName = `temp_${crypto.randomUUID()}.docx`;
    const tempFilePath = `${user.id}/temp/${tempFileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('user-files')
      .upload(tempFilePath, file);

    if (uploadError) {
      console.error('Temporary upload error:', uploadError);
      throw new Error(`Failed to upload DOCX for processing: ${uploadError.message}`);
    }

    console.log('DOCX uploaded to temporary storage, calling parse-resume-docx function...');

    // Call the parse-resume-docx edge function (now fixed)
    const { data, error } = await supabase.functions.invoke('parse-resume-docx', {
      body: {
        file_path: tempFilePath
      }
    });

    // Clean up temporary file
    await supabase.storage
      .from('user-files')
      .remove([tempFilePath]);

    if (error) {
      console.error('DOCX edge function error:', error);
      throw new Error(`DOCX parsing failed: ${error.message}`);
    }

    if (!data || !data.parsed_text) {
      throw new Error('No text could be extracted from this DOCX file');
    }

    console.log(`DOCX parsing successful: ${data.parsed_text.length} characters extracted`);
    return data.parsed_text;

  } catch (error) {
    console.error('DOCX storage parsing failed:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Authentication required')) {
        throw error;
      } else if (error.message.includes('DOCX parsing failed') || 
          error.message.includes('poor quality results')) {
        throw error; // Keep the specific message
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        throw new Error('Network error while processing DOCX. Please check your connection and try again.');
      }
    }
    
    throw new Error('Failed to process DOCX file. Please ensure the file is not corrupted and try again.');
  }
};


import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ParseResumeRequest {
  file_path: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Resume DOCX parsing request received');
    
    const { file_path }: ParseResumeRequest = await req.json();
    
    if (!file_path) {
      throw new Error('No file_path provided');
    }

    console.log(`Processing resume DOCX from storage: ${file_path}`);

    // Initialize Supabase client with service role key for storage access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Download the file from Supabase Storage
    console.log('Downloading file from storage...');
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('user-files')
      .download(file_path);

    if (downloadError) {
      console.error('Storage download error:', downloadError);
      throw new Error(`Failed to download file: ${downloadError.message}`);
    }

    if (!fileData) {
      throw new Error('No file data received from storage');
    }

    console.log(`File downloaded successfully, size: ${fileData.size} bytes`);

    try {
      // Import mammoth and parse DOCX - using the correct approach
      console.log('Importing mammoth library...');
      const mammoth = await import("npm:mammoth@1.6.0");
      
      console.log('Converting file data to buffer for mammoth...');
      // Convert the blob to buffer format that mammoth expects
      const buffer = new Uint8Array(await fileData.arrayBuffer());
      
      console.log(`Buffer prepared: ${buffer.length} bytes`);
      console.log('Calling mammoth extractRawText...');
      
      // Use the correct mammoth API - pass the buffer directly
      const result = await mammoth.extractRawText({ buffer: buffer });
      const extractedText = result.value;
      
      console.log(`DOCX parsing completed successfully: ${extractedText.length} characters extracted`);

      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('No readable text could be extracted from this DOCX file. The file may be corrupted or empty.');
      }

      // Clean up the extracted text
      const cleanedText = extractedText
        .replace(/\s+/g, ' ')
        .trim();

      // Assess text quality to detect potential issues
      const textQuality = assessTextQuality(cleanedText);
      if (textQuality.isLowQuality) {
        console.warn(`Low quality text detected: ${textQuality.reason}`);
        throw new Error(`DOCX text extraction produced poor quality results. ${textQuality.reason}`);
      }

      console.log('DOCX parsing successful, returning cleaned text');

      return new Response(
        JSON.stringify({
          parsed_text: cleanedText
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );

    } catch (mammothError) {
      console.error('Mammoth parsing error details:', mammothError);
      console.error('Mammoth error stack:', mammothError.stack);
      throw new Error(`Failed to parse DOCX content with mammoth: ${mammothError.message || 'Unknown mammoth error'}`);
    }

  } catch (error) {
    console.error('Resume DOCX parsing error:', error);
    console.error('Error stack:', error.stack);
    
    let errorMessage = 'Unknown error occurred during resume DOCX parsing';
    
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return new Response(
      JSON.stringify({
        error: errorMessage
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});

// Helper function to assess text quality and detect garbled output
function assessTextQuality(text: string): { isLowQuality: boolean; reason?: string } {
  if (!text || text.length < 50) {
    return { isLowQuality: true, reason: 'Text too short (less than 50 characters)' };
  }
  
  // Check for too many single characters or very short words
  const words = text.split(/\s+/).filter(word => word.length > 0);
  const singleCharWords = words.filter(word => word.length === 1).length;
  const singleCharRatio = singleCharWords / words.length;
  
  if (singleCharRatio > 0.3) {
    return { isLowQuality: true, reason: 'Too many single character fragments (indicates parsing issues)' };
  }
  
  // Check for too many non-alphabetic characters (garbled text indicator)
  const alphabeticChars = text.match(/[a-zA-Z]/g)?.length || 0;
  const totalChars = text.replace(/\s/g, '').length;
  const alphabeticRatio = alphabeticChars / totalChars;
  
  if (alphabeticRatio < 0.5) {
    return { isLowQuality: true, reason: 'Too few alphabetic characters (likely garbled or encoded content)' };
  }
  
  // Check for excessive special characters that indicate encoding issues
  const specialCharPattern = /[^\w\s.,!?;:()\-@#$%&*+=<>[\]{}|\\/"'`~]/g;
  const specialChars = text.match(specialCharPattern)?.length || 0;
  const specialCharRatio = specialChars / text.length;
  
  if (specialCharRatio > 0.1) {
    return { isLowQuality: true, reason: 'Too many special/encoded characters (indicates binary data interpretation)' };
  }
  
  return { isLowQuality: false };
}

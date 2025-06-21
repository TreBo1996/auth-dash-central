
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
    console.log('Resume PDF parsing request received');
    
    const { file_path }: ParseResumeRequest = await req.json();
    
    if (!file_path) {
      throw new Error('No file_path provided');
    }

    console.log(`Processing resume PDF from storage: ${file_path}`);

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

    // Convert blob to array buffer
    const arrayBuffer = await fileData.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    
    console.log(`Converting file to bytes: ${bytes.length} bytes`);

    // Extract text from PDF using the same method as the existing function
    const extractedText = await extractTextFromPDF(bytes);
    
    console.log(`PDF parsing completed: ${extractedText.length} characters extracted`);

    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error('No readable text could be extracted from this PDF. The file may be image-based, scanned, or corrupted.');
    }

    return new Response(
      JSON.stringify({
        parsed_text: extractedText.trim()
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error) {
    console.error('Resume PDF parsing error:', error);
    
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error occurred during resume PDF parsing'
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

async function extractTextFromPDF(pdfBytes: Uint8Array): Promise<string> {
  try {
    // Basic PDF text extraction using simple string matching
    // This works for many standard PDFs with embedded text
    const pdfString = new TextDecoder('latin1').decode(pdfBytes);
    
    // Look for text objects in the PDF structure
    const textMatches = pdfString.match(/\(([^)]+)\)/g);
    const streamMatches = pdfString.match(/stream\s*([\s\S]*?)\s*endstream/g);
    
    let extractedText = '';
    
    // Extract text from parentheses (common PDF text format)
    if (textMatches) {
      for (const match of textMatches) {
        const text = match.slice(1, -1); // Remove parentheses
        if (text.length > 1 && /[a-zA-Z]/.test(text)) {
          extractedText += text + ' ';
        }
      }
    }
    
    // Try to extract from streams (more complex but covers more cases)
    if (streamMatches) {
      for (const stream of streamMatches) {
        const streamContent = stream.replace(/^stream\s*/, '').replace(/\s*endstream$/, '');
        // Look for readable text patterns
        const readableText = streamContent.match(/[A-Za-z]{2,}/g);
        if (readableText) {
          extractedText += readableText.join(' ') + ' ';
        }
      }
    }
    
    // Clean up the extracted text
    extractedText = extractedText
      .replace(/\s+/g, ' ')
      .replace(/[^\x20-\x7E\n\r\t]/g, ' ') // Remove non-printable characters
      .trim();
    
    // If we still don't have enough text, try a different approach
    if (extractedText.length < 50) {
      // Look for any ASCII text in the PDF
      const asciiMatches = pdfString.match(/[A-Za-z][A-Za-z0-9\s.,!?;:'"()-]{10,}/g);
      if (asciiMatches) {
        extractedText = asciiMatches.join(' ').trim();
      }
    }
    
    return extractedText;
  } catch (error) {
    console.error('Text extraction error:', error);
    throw new Error('Failed to extract text from PDF. The file may be corrupted or in an unsupported format.');
  }
}

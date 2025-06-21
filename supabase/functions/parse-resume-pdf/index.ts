
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

    // Extract text from PDF using improved method
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
    console.log('Starting enhanced PDF text extraction...');
    
    // Convert to string for processing
    const pdfString = new TextDecoder('latin1').decode(pdfBytes);
    
    let extractedText = '';
    
    // Method 1: Extract from text objects (Tj and TJ operators)
    const textObjectRegex = /(?:Tj|TJ)\s*(?:\[([^\]]*)\]|\(([^)]*)\))/g;
    let match;
    
    while ((match = textObjectRegex.exec(pdfString)) !== null) {
      if (match[1]) {
        // Handle array format [(...) (...)]
        const arrayContent = match[1];
        const textInParens = arrayContent.match(/\(([^)]*)\)/g);
        if (textInParens) {
          textInParens.forEach(text => {
            const cleanText = text.slice(1, -1);
            if (cleanText.length > 0 && /[a-zA-Z]/.test(cleanText)) {
              extractedText += cleanText + ' ';
            }
          });
        }
      } else if (match[2]) {
        // Handle simple parentheses format
        const cleanText = match[2];
        if (cleanText.length > 0 && /[a-zA-Z]/.test(cleanText)) {
          extractedText += cleanText + ' ';
        }
      }
    }
    
    // Method 2: Look for BT/ET blocks (text blocks)
    const textBlockRegex = /BT\s*([\s\S]*?)\s*ET/g;
    let blockMatch;
    
    while ((blockMatch = textBlockRegex.exec(pdfString)) !== null) {
      const blockContent = blockMatch[1];
      
      // Extract text from within this block
      const blockTextRegex = /\(([^)]+)\)\s*Tj/g;
      let textMatch;
      
      while ((textMatch = blockTextRegex.exec(blockContent)) !== null) {
        const text = textMatch[1];
        if (text.length > 1 && /[a-zA-Z]/.test(text)) {
          extractedText += text + ' ';
        }
      }
    }
    
    // Method 3: Enhanced stream content extraction
    const streamRegex = /stream\s*([\s\S]*?)\s*endstream/g;
    let streamMatch;
    
    while ((streamMatch = streamRegex.exec(pdfString)) !== null) {
      const streamContent = streamMatch[1];
      
      // Look for readable text patterns in streams
      const readableTextRegex = /[A-Za-z][A-Za-z0-9\s.,!?;:'"()\-]{4,}/g;
      const matches = streamContent.match(readableTextRegex);
      
      if (matches) {
        matches.forEach(text => {
          // Filter out likely garbage
          if (text.length >= 4 && 
              !text.match(/^[0-9\s]+$/) && 
              !text.match(/^[^a-zA-Z]*$/) &&
              text.match(/[a-zA-Z]{2,}/)) {
            extractedText += text + ' ';
          }
        });
      }
    }
    
    // Method 4: Direct text search (fallback)
    if (extractedText.length < 100) {
      console.log('Using fallback text extraction method...');
      
      // Look for any readable text patterns
      const fallbackRegex = /[A-Za-z][A-Za-z0-9\s.,!?;:'"()\-@]{8,}/g;
      const fallbackMatches = pdfString.match(fallbackRegex);
      
      if (fallbackMatches) {
        fallbackMatches.forEach(text => {
          // More lenient filtering for fallback
          if (text.length >= 8 && 
              text.match(/[a-zA-Z]{3,}/) &&
              !text.match(/^[0-9\s\W]+$/)) {
            extractedText += text + ' ';
          }
        });
      }
    }
    
    // Clean up the extracted text
    extractedText = extractedText
      .replace(/\s+/g, ' ')
      .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Remove duplicate phrases (common in PDF extraction)
    const words = extractedText.split(' ');
    const uniqueWords: string[] = [];
    const seen = new Set<string>();
    
    for (const word of words) {
      const cleanWord = word.toLowerCase().trim();
      if (cleanWord.length > 0 && !seen.has(cleanWord)) {
        seen.add(cleanWord);
        uniqueWords.push(word);
      }
    }
    
    const finalText = uniqueWords.join(' ');
    
    console.log(`Enhanced extraction completed: ${finalText.length} characters`);
    
    // If we still don't have enough readable text, it might be a scanned/image PDF
    if (finalText.length < 50) {
      throw new Error('This PDF appears to contain mostly images or scanned content. Please try converting it to a text-based format or use DOCX instead.');
    }
    
    return finalText;
    
  } catch (error) {
    console.error('Enhanced text extraction error:', error);
    throw new Error('Failed to extract readable text from this PDF. The file may be corrupted, password-protected, or contain only images.');
  }
}

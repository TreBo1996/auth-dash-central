
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ParsePDFRequest {
  fileBase64: string;
  fileName: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('PDF parsing request received');
    
    const { fileBase64, fileName }: ParsePDFRequest = await req.json();
    
    if (!fileBase64) {
      throw new Error('No file data provided');
    }

    console.log(`Processing PDF: ${fileName}`);

    // Convert base64 to Uint8Array
    const binaryString = atob(fileBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    console.log(`PDF file size: ${bytes.length} bytes`);

    // Use enhanced PDF text extraction approach
    const extractedText = await extractTextFromPDF(bytes);
    
    console.log(`PDF parsing completed: ${extractedText.length} characters extracted`);

    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error('No text could be extracted from this PDF. The file may be image-based, scanned, or password-protected. Please try converting to DOCX format for better results.');
    }

    return new Response(
      JSON.stringify({
        success: true,
        text: extractedText.trim(),
        pages: 1, // We'll estimate this for now
        info: { title: fileName }
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error) {
    console.error('PDF parsing error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred during PDF parsing'
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

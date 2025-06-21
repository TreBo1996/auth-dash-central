
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

    // Use a simple PDF text extraction approach
    // This is a basic implementation that works for text-based PDFs
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

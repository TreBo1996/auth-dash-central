
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

    // Import pdf-parse dynamically for server-side use
    const pdfParse = await import('https://esm.sh/pdf-parse@1.1.1');
    
    console.log('Parsing PDF content...');
    const data = await pdfParse.default(bytes);
    
    const extractedText = data.text.trim();
    console.log(`PDF parsing completed: ${extractedText.length} characters from ${data.numpages} pages`);

    if (!extractedText) {
      throw new Error('No text could be extracted from this PDF. The file may be image-based, scanned, or corrupted.');
    }

    return new Response(
      JSON.stringify({
        success: true,
        text: extractedText,
        pages: data.numpages,
        info: data.info
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

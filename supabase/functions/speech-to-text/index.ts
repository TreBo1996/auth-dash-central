
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Speech-to-text request received');
    
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      console.error('No audio file provided in request');
      throw new Error('No audio file provided');
    }

    console.log('Audio file received:', {
      name: audioFile.name,
      size: audioFile.size,
      type: audioFile.type
    });

    // Validate file size (max 25MB for OpenAI)
    if (audioFile.size > 25 * 1024 * 1024) {
      throw new Error('Audio file too large. Maximum size is 25MB.');
    }

    // Validate file type - OpenAI supports many formats including webm
    const supportedFormats = ['audio/webm', 'audio/wav', 'audio/mp3', 'audio/m4a', 'audio/ogg', 'audio/flac'];
    if (!supportedFormats.some(format => audioFile.type.includes(format.split('/')[1]))) {
      console.warn(`Unsupported file type: ${audioFile.type}, but attempting anyway`);
    }

    // Create FormData for OpenAI API
    const openAIFormData = new FormData();
    openAIFormData.append('file', audioFile, audioFile.name || 'recording.webm');
    openAIFormData.append('model', 'whisper-1');
    openAIFormData.append('response_format', 'json');

    console.log('Sending request to OpenAI Whisper API...');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
      },
      body: openAIFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      
      let errorMessage = 'Failed to transcribe audio';
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error?.message || errorMessage;
      } catch (e) {
        // Use default error message if JSON parsing fails
      }
      
      throw new Error(errorMessage);
    }

    const transcription = await response.json();
    console.log('Transcription successful, text length:', transcription.text?.length || 0);

    if (!transcription.text || transcription.text.trim().length === 0) {
      throw new Error('No speech detected in the audio. Please try speaking more clearly.');
    }

    return new Response(JSON.stringify({ text: transcription.text }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in speech-to-text function:', error);
    
    // Provide more specific error messages
    let errorMessage = error.message;
    if (errorMessage.includes('Invalid file format')) {
      errorMessage = 'The audio format is not supported. Please try again with a different browser or check your microphone settings.';
    } else if (errorMessage.includes('No speech detected')) {
      errorMessage = 'No speech was detected in the recording. Please speak clearly and try again.';
    }
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

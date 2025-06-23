
import { supabase } from '@/integrations/supabase/client';

export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  console.log('Transcribing audio blob:', {
    size: audioBlob.size,
    type: audioBlob.type
  });

  if (audioBlob.size === 0) {
    throw new Error('Audio recording is empty');
  }

  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.webm');

  console.log('Calling speech-to-text function...');

  const response = await supabase.functions.invoke('speech-to-text', {
    body: formData,
  });

  console.log('Speech-to-text response:', response);

  if (response.error) {
    console.error('Speech-to-text error:', response.error);
    throw new Error(response.error.message || 'Failed to transcribe audio');
  }

  if (!response.data?.text) {
    throw new Error('No transcription text received');
  }

  console.log('Transcription successful:', response.data.text);
  return response.data.text;
};

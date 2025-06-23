
import { supabase } from '@/integrations/supabase/client';

export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.wav');

  const response = await supabase.functions.invoke('speech-to-text', {
    body: formData,
  });

  if (response.error) {
    throw new Error(response.error.message);
  }

  return response.data.text;
};


import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Square } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AudioRecorderProps {
  onTranscription: (text: string) => void;
  isRecording: boolean;
  onRecordingStateChange: (recording: boolean) => void;
  disabled?: boolean;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onTranscription,
  isRecording,
  onRecordingStateChange,
  disabled = false
}) => {
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setAudioChunks(prev => [...prev, event.data]);
        }
      };

      recorder.onstop = async () => {
        setIsProcessing(true);
        try {
          const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
          await transcribeAudio(audioBlob);
        } catch (error) {
          console.error('Transcription error:', error);
          toast({
            title: "Transcription Failed",
            description: "Failed to process your audio. Please try again.",
            variant: "destructive"
          });
        } finally {
          setIsProcessing(false);
          setAudioChunks([]);
        }
      };

      setMediaRecorder(recorder);
      recorder.start();
      onRecordingStateChange(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Recording Failed",
        description: "Unable to access microphone. Please check permissions.",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      onRecordingStateChange(false);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.wav');

    const response = await supabase.functions.invoke('speech-to-text', {
      body: formData,
    });

    if (response.error) {
      throw new Error(response.error.message || 'Failed to transcribe audio');
    }

    onTranscription(response.data.text);
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="flex items-center space-x-4">
        {!isRecording ? (
          <Button
            onClick={startRecording}
            disabled={disabled || isProcessing}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-full"
          >
            <Mic className="h-5 w-5 mr-2" />
            {isProcessing ? 'Processing...' : 'Start Recording'}
          </Button>
        ) : (
          <Button
            onClick={stopRecording}
            className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-full"
          >
            <Square className="h-5 w-5 mr-2" />
            Stop Recording
          </Button>
        )}
      </div>
      
      {isRecording && (
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-600">Recording...</span>
        </div>
      )}
      
      {isProcessing && (
        <div className="text-sm text-gray-600">Processing your response...</div>
      )}
    </div>
  );
};

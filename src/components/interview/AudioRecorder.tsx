
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Square } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { transcribeAudio } from '@/lib/api';

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
      console.log('Starting audio recording...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      // Use webm format which is better supported by browsers and OpenAI
      const mimeType = 'audio/webm';
      const recorder = new MediaRecorder(stream, { 
        mimeType: mimeType
      });
      
      console.log(`MediaRecorder created with mimeType: ${mimeType}`);
      
      recorder.ondataavailable = (event) => {
        console.log('Audio data available, size:', event.data.size);
        if (event.data.size > 0) {
          setAudioChunks(prev => [...prev, event.data]);
        }
      };

      recorder.onstop = async () => {
        console.log('Recording stopped, processing audio...');
        setIsProcessing(true);
        try {
          if (audioChunks.length === 0) {
            throw new Error('No audio data recorded');
          }
          
          const audioBlob = new Blob(audioChunks, { type: mimeType });
          console.log('Created audio blob, size:', audioBlob.size, 'type:', audioBlob.type);
          
          if (audioBlob.size === 0) {
            throw new Error('Audio recording is empty');
          }
          
          const transcription = await transcribeAudio(audioBlob);
          onTranscription(transcription);
        } catch (error) {
          console.error('Transcription error:', error);
          toast({
            title: "Transcription Failed",
            description: error instanceof Error ? error.message : "Failed to process your audio. Please try again.",
            variant: "destructive"
          });
        } finally {
          setIsProcessing(false);
          setAudioChunks([]);
        }
      };

      recorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        toast({
          title: "Recording Error",
          description: "An error occurred during recording. Please try again.",
          variant: "destructive"
        });
      };

      setMediaRecorder(recorder);
      recorder.start(1000); // Collect data every second
      onRecordingStateChange(true);
      console.log('Recording started');
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
    console.log('Stopping recording...');
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      onRecordingStateChange(false);
      console.log('Recording stopped');
    }
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

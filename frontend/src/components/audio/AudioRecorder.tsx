import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Square, Trash, Pause, Play } from 'lucide-react';
import Button from '../ui/Button';
import AudioVisualizer from './AudioVisualizer';
import { AudioRecorderProps } from '../../types';

/** Pick the first MIME type the current browser can actually record. */
const pickMimeType = () => {
  const candidates = [
    'audio/mp4',   // iOS Safari / iOS Chrome
    'audio/webm',  // Desktop Chrome / Edge
    'audio/mpeg',  // Very old fallback
  ];
  return candidates.find(MediaRecorder.isTypeSupported) || '';
};

const AudioRecorder: React.FC<AudioRecorderProps> = ({ onRecordingComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [hasRecording, setHasRecording] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const mimeTypeRef = useRef<string>('');

  /* --------------------------------------------------------------------- */
  /* Permissions & cleanup                                                */
  /* --------------------------------------------------------------------- */
  useEffect(() => {
    const getPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        setHasPermission(true);
      } catch {
        setHasPermission(false);
        setError('Microphone access was denied. Please grant permission to continue.');
      }
    };

    getPermission();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      if (audioURL) {
        URL.revokeObjectURL(audioURL);
      }
    };
  }, []);

  const startRecording = async () => {
    if (!hasPermission) {
      setError('Microphone permission is required to record audio.');
      return;
    }

    try {
      if (isPaused) {
        // Resume recording
        if (mediaRecorderRef.current) {
          mediaRecorderRef.current.resume();
          setIsPaused(false);

          // Restart timer
          timerRef.current = window.setInterval(() => {
            setRecordingTime(prev => prev + 1);
          }, 1000);
        }
        return;
      }

      // Reset any previous recordings
      setRecordingBlob(null);
      if (audioURL) {
        URL.revokeObjectURL(audioURL);
        setAudioURL(null);
      }

      // Get fresh stream if needed
      if (!streamRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
      }

      // Create media recorder
      const mimeType = pickMimeType();
      mimeTypeRef.current = mimeType;
      const mediaRecorder = mimeType
          ? new MediaRecorder(streamRef.current!, { mimeType })
          : new MediaRecorder(streamRef.current!);
      mediaRecorderRef.current = mediaRecorder;

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, {              // use the real type
          type: mimeTypeRef.current || chunks[0]?.type || ''
        });
        setRecordingBlob(blob);
        setHasRecording(true);

        const url = URL.createObjectURL(blob);
        setAudioURL(url);
      };

      // Start recording
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Failed to start recording. Please check your microphone.');
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);

      // Pause timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const clearRecording = () => {
    if (audioURL) {
      URL.revokeObjectURL(audioURL);
    }

    setRecordingBlob(null);
    setAudioURL(null);
    setHasRecording(false);
    setRecordingTime(0);
  };

  const saveRecording = () => {
    if (recordingBlob) {
      onRecordingComplete(recordingBlob);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (hasPermission === false) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
        <div className="flex">
          <MicOff className="h-5 w-5 text-red-500 mr-2" />
          <div>
            <h3 className="text-red-800 font-medium">Microphone Permission Required</h3>
            <p className="text-red-700 mt-1">
              Please enable microphone access in your browser settings to record audio.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-slate-800">
              {isRecording ? 'Recording in progress...' : hasRecording ? 'Recording complete' : 'Record your message'}
            </h3>

            <div className="flex items-center">
              {(isRecording || isPaused) && (
                <div className="flex items-center mr-3">
                  <div className={`h-2 w-2 rounded-full ${isPaused ? 'bg-amber-500' : 'bg-red-500 animate-pulse'} mr-2`}></div>
                  <span className="text-slate-600 font-mono">{formatTime(recordingTime)}</span>
                </div>
              )}
            </div>
          </div>

          <AudioVisualizer
            mediaRecorder={mediaRecorderRef.current}
            isRecording={isRecording && !isPaused}
          />

          <div className="flex flex-wrap gap-3">
            {!isRecording && !hasRecording && (
              <Button
                onClick={startRecording}
                variant="primary"
                icon={<Mic className="h-5 w-5" />}
              >
                Start Recording
              </Button>
            )}

            {isRecording && !isPaused && (
              <>
                <Button
                  onClick={pauseRecording}
                  variant="outline"
                  icon={<Pause className="h-5 w-5" />}
                >
                  Pause
                </Button>

                <Button
                  onClick={stopRecording}
                  variant="danger"
                  icon={<Square className="h-5 w-5" />}
                >
                  Stop Recording
                </Button>
              </>
            )}

            {isPaused && (
              <>
                <Button
                  onClick={startRecording}
                  variant="primary"
                  icon={<Play className="h-5 w-5" />}
                >
                  Resume
                </Button>

                <Button
                  onClick={stopRecording}
                  variant="danger"
                  icon={<Square className="h-5 w-5" />}
                >
                  Stop Recording
                </Button>
              </>
            )}

            {hasRecording && (
              <>
                <Button onClick={clearRecording} variant="outline" icon={<Trash className="h-5 w-5" />}>
                  Clear Recording
                </Button>

                <Button onClick={startRecording} variant="outline" icon={<Mic className="h-5 w-5" />}>
                  Record Again
                </Button>

                <Button onClick={saveRecording} variant="primary">
                  Use This Recording
                </Button>
              </>
            )}
          </div>

          {audioURL && (
            <div className="mt-2">
              <p className="text-sm text-slate-600 mb-2">Preview your recording:</p>
              <audio controls src={audioURL} className="w-full" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AudioRecorder;
import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Camera } from 'lucide-react';

export const CameraPreview: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: 640, 
            height: 480,
            facingMode: 'user'
          }, 
          audio: true 
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // Start recording
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'video/webm;codecs=vp9'
        });
        
        mediaRecorderRef.current = mediaRecorder;
        
        const chunks: BlobPart[] = [];
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          // Here you would upload the recording to your server
          console.log('Recording stopped, blob size:', blob.size);
        };

        mediaRecorder.start(1000); // Record in 1-second chunks
        setIsRecording(true);
        setError(null);
        
      } catch (err) {
        console.error('Error accessing camera:', err);
        setError('Camera access denied or not available');
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  if (error) {
    return (
      <div className="camera-preview">
        <div className="w-full h-full bg-red-100 flex flex-col items-center justify-center text-red-700 p-2">
          <AlertTriangle className="w-6 h-6 mb-1" />
          <span className="text-xs text-center">Camera Error</span>
        </div>
      </div>
    );
  }

  return (
    <div className="camera-preview">
      <div className="recording-indicator">
        <div className="recording-dot"></div>
        <span>REC</span>
      </div>
      
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="w-full h-full object-cover"
      />
      
      <div className="absolute bottom-1 left-1 right-1 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Camera className="w-3 h-3" />
            <span>Live</span>
          </div>
          {isRecording && (
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          )}
        </div>
      </div>
    </div>
  );
};
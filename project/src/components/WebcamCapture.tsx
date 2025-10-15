import { Camera, StopCircle, Play } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';

interface WebcamCaptureProps {
  onCapture: (imageData: string) => void;
  disabled?: boolean;
}

export function WebcamCapture({ onCapture, disabled }: WebcamCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const startWebcam = async () => {
    try {
      setError('');
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setIsStreaming(true);
      }
    } catch (err) {
      setError('Failed to access webcam. Please ensure camera permissions are granted.');
      console.error('Webcam error:', err);
    }
  };

  const stopWebcam = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  };

  const captureFrame = () => {
    if (videoRef.current && isStreaming) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg', 0.9);
        onCapture(imageData);
      }
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-contain"
        />
        {!isStreaming && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <Camera className="w-16 h-16 text-gray-600" />
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        {!isStreaming ? (
          <button
            onClick={startWebcam}
            disabled={disabled}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            <Play className="w-5 h-5" />
            Start Webcam
          </button>
        ) : (
          <>
            <button
              onClick={stopWebcam}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              <StopCircle className="w-5 h-5" />
              Stop Webcam
            </button>
            <button
              onClick={captureFrame}
              disabled={disabled}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              <Camera className="w-5 h-5" />
              Analyze Frame
            </button>
          </>
        )}
      </div>
    </div>
  );
}

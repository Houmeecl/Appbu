import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

type CameraCaptureProps = {
  onCapture: (photoData: string) => void;
  onError: (error: string) => void;
};

export function CameraCapture({ onCapture, onError }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hasPhoto, setHasPhoto] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      setIsLoading(true);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
      setIsLoading(false);
    } catch (error) {
      console.error("Error accessing camera:", error);
      setIsLoading(false);
      onError("No se pudo acceder a la cámara. Verifique los permisos.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data
    const photoData = canvas.toDataURL("image/jpeg", 0.8);
    
    setHasPhoto(true);
    stopCamera();
    onCapture(photoData);
  };

  const retakePhoto = () => {
    setHasPhoto(false);
    startCamera();
  };

  if (isLoading) {
    return (
      <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-gray-400 text-2xl mb-2"></i>
          <p className="text-gray-600">Iniciando cámara...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
        {!hasPhoto ? (
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            autoPlay
            playsInline
            muted
          />
        ) : (
          <canvas
            ref={canvasRef}
            className="w-full h-full object-cover"
          />
        )}
        
        {/* Camera overlay */}
        {!hasPhoto && (
          <div className="absolute inset-4 border-2 border-white border-dashed rounded-lg flex items-center justify-center pointer-events-none">
            <div className="text-white text-center">
              <i className="fas fa-user text-2xl mb-2"></i>
              <p className="text-sm">Posicione su rostro aquí</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex space-x-3">
        {!hasPhoto ? (
          <Button 
            onClick={capturePhoto}
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={!stream}
          >
            <i className="fas fa-camera mr-2"></i>
            Capturar Foto
          </Button>
        ) : (
          <>
            <Button 
              onClick={retakePhoto}
              variant="outline"
              className="flex-1"
            >
              <i className="fas fa-redo mr-2"></i>
              Repetir
            </Button>
            <Button 
              onClick={() => {/* Photo already captured */}}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <i className="fas fa-check mr-2"></i>
              Continuar
            </Button>
          </>
        )}
      </div>

      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

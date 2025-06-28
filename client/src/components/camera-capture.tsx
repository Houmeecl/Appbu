import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Camera, RotateCcw, Download, CheckCircle, AlertCircle } from "lucide-react";

type CameraCaptureProps = {
  onCapture: (photoData: string) => void;
  onError: (error: string) => void;
};

export function CameraCapture({ onCapture, onError }: CameraCaptureProps) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<string>("");
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize camera stream
  const initializeCamera = useCallback(async () => {
    try {
      setError(null);
      
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Cámara no disponible en este dispositivo o navegador");
      }

      // Request camera permissions with optimal settings
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          facingMode: "user", // Front camera for selfies
          frameRate: { ideal: 30 }
        },
        audio: false
      });

      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
        setIsStreaming(true);
        
        // Get device information
        const track = mediaStream.getVideoTracks()[0];
        const settings = track.getSettings();
        setDeviceInfo(`${settings.width}x${settings.height} - ${track.label}`);
      }
      
    } catch (err: any) {
      const errorMessage = err.name === 'NotAllowedError' 
        ? "Acceso a la cámara denegado. Por favor, permita el acceso a la cámara."
        : err.name === 'NotFoundError'
        ? "No se encontró ninguna cámara en este dispositivo."
        : err.name === 'NotSupportedError'
        ? "Cámara no compatible con este navegador."
        : `Error al acceder a la cámara: ${err.message}`;
      
      setError(errorMessage);
      onError(errorMessage);
      console.error("Camera initialization error:", err);
    }
  }, [onError]);

  // Capture photo from video stream
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isStreaming) {
      setError("Cámara no inicializada correctamente");
      return;
    }

    try {
      setIsCapturing(true);
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error("No se pudo obtener el contexto del canvas");
      }

      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Add timestamp watermark
      const timestamp = new Date().toLocaleString('es-CL');
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(10, canvas.height - 40, 300, 30);
      ctx.fillStyle = 'white';
      ctx.font = '14px Arial';
      ctx.fillText(`VecinoXpress - ${timestamp}`, 15, canvas.height - 20);
      
      // Convert to base64 data URL
      const photoData = canvas.toDataURL('image/jpeg', 0.8);
      setCapturedPhoto(photoData);
      onCapture(photoData);
      
      console.log("Photo captured successfully");
      
    } catch (err: any) {
      const errorMessage = `Error al capturar la foto: ${err.message}`;
      setError(errorMessage);
      onError(errorMessage);
      console.error("Photo capture error:", err);
    } finally {
      setIsCapturing(false);
    }
  }, [isStreaming, onCapture, onError]);

  // Reset capture state
  const resetCapture = useCallback(() => {
    setCapturedPhoto(null);
    setError(null);
  }, []);

  // Download captured photo
  const downloadPhoto = useCallback(() => {
    if (!capturedPhoto) return;
    
    const link = document.createElement('a');
    link.download = `vecinoxpress-photo-${Date.now()}.jpg`;
    link.href = capturedPhoto;
    link.click();
  }, [capturedPhoto]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5 text-blue-600" />
          Captura de Fotografía
        </CardTitle>
        {deviceInfo && (
          <p className="text-sm text-gray-600">{deviceInfo}</p>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {!isStreaming && !capturedPhoto && (
          <div className="text-center">
            <Button 
              onClick={initializeCamera}
              className="bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              <Camera className="mr-2 h-4 w-4" />
              Iniciar Cámara
            </Button>
          </div>
        )}
        
        {isStreaming && !capturedPhoto && (
          <div className="space-y-4">
            <div className="relative rounded-lg overflow-hidden bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-auto"
                style={{ maxHeight: '400px' }}
              />
              
              {/* Camera overlay guides */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-4 left-4 right-4 text-white text-sm bg-black bg-opacity-50 rounded p-2">
                  📸 Posicione su rostro en el centro del cuadro
                </div>
                
                {/* Face guide frame */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                               w-48 h-64 border-2 border-white border-dashed rounded-lg opacity-60">
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={capturePhoto}
                disabled={isCapturing}
                className="flex-1 bg-red-600 hover:bg-red-700"
                size="lg"
              >
                {isCapturing ? "Capturando..." : "Tomar Foto"}
              </Button>
              
              <Button 
                onClick={() => {
                  if (stream) {
                    stream.getTracks().forEach(track => track.stop());
                    setIsStreaming(false);
                    setStream(null);
                  }
                }}
                variant="outline"
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
        
        {capturedPhoto && (
          <div className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Fotografía capturada exitosamente con timestamp de validación
              </AlertDescription>
            </Alert>
            
            <div className="relative rounded-lg overflow-hidden">
              <img 
                src={capturedPhoto} 
                alt="Foto capturada" 
                className="w-full h-auto rounded-lg border"
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={resetCapture}
                variant="outline"
                className="flex-1"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Tomar Otra
              </Button>
              
              <Button 
                onClick={downloadPhoto}
                variant="outline"
              >
                <Download className="mr-2 h-4 w-4" />
                Descargar
              </Button>
            </div>
          </div>
        )}
        
        {/* Hidden canvas for photo processing */}
        <canvas ref={canvasRef} className="hidden" />
        
        <div className="text-xs text-gray-500 text-center">
          La fotografía será utilizada para verificación de identidad y 
          tendrá validez legal como evidencia biométrica.
        </div>
      </CardContent>
    </Card>
  );
}
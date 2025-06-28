import { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Camera, 
  Mic, 
  Square, 
  Play, 
  CheckCircle, 
  AlertCircle,
  User,
  CreditCard,
  FileText,
  Download,
  Upload
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface IdentityVerificationProps {
  onComplete: (verificationData: VerificationData) => void;
  userRole: 'pos' | 'certificador';
  clientRut?: string;
  documentNumber?: string;
}

interface VerificationData {
  clientPhoto: string;
  idCardPhoto: string;
  voiceRecording?: string;
  verificationNotes: string;
  timestamp: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  deviceInfo: {
    userAgent: string;
    platform: string;
    language: string;
  };
}

interface MediaConstraints {
  video: {
    width: { ideal: number };
    height: { ideal: number };
    facingMode: string;
  };
  audio?: boolean;
}

export default function IdentityVerification({ 
  onComplete, 
  userRole, 
  clientRut, 
  documentNumber 
}: IdentityVerificationProps) {
  const [currentStep, setCurrentStep] = useState<'client_photo' | 'id_card' | 'voice' | 'notes' | 'complete'>('client_photo');
  const [isCapturing, setIsCapturing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [verificationData, setVerificationData] = useState<Partial<VerificationData>>({});
  const [verificationNotes, setVerificationNotes] = useState('');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      stopCamera();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startCamera = async (constraints: MediaConstraints) => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
      
      setIsCapturing(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Error de Cámara",
        description: "No se pudo acceder a la cámara. Verifique los permisos.",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCapturing(false);
  };

  const capturePhoto = useCallback((step: 'client_photo' | 'id_card') => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0);
    
    // Add timestamp watermark
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, canvas.height - 60, 300, 50);
    ctx.fillStyle = 'white';
    ctx.font = '14px Arial';
    ctx.fillText(`${new Date().toLocaleString('es-CL')}`, 15, canvas.height - 35);
    ctx.fillText(`${userRole.toUpperCase()} - RUT: ${clientRut || 'N/A'}`, 15, canvas.height - 15);
    
    const photoData = canvas.toDataURL('image/jpeg', 0.8);
    
    setVerificationData(prev => ({
      ...prev,
      [step]: photoData
    }));
    
    stopCamera();
    
    toast({
      title: "Foto Capturada",
      description: step === 'client_photo' ? "Foto del cliente guardada" : "Foto de cédula guardada",
    });
    
    // Auto advance to next step
    if (step === 'client_photo') {
      setTimeout(() => setCurrentStep('id_card'), 1000);
    } else {
      setTimeout(() => setCurrentStep('voice'), 1000);
    }
  }, [userRole, clientRut, stream, toast]);

  const startVoiceRecording = async () => {
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(audioStream);
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setAudioChunks(prev => [...prev, event.data]);
        }
      };
      
      recorder.onstop = () => {
        audioStream.getTracks().forEach(track => track.stop());
      };
      
      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      toast({
        title: "Grabación Iniciada",
        description: "Hable claramente para la verificación de identidad",
      });
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        title: "Error de Micrófono",
        description: "No se pudo acceder al micrófono",
        variant: "destructive",
      });
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      // Process audio after chunks are collected
      setTimeout(() => {
        if (audioChunks.length > 0) {
          const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
          const reader = new FileReader();
          
          reader.onloadend = () => {
            setVerificationData(prev => ({
              ...prev,
              voiceRecording: reader.result as string
            }));
            
            toast({
              title: "Grabación Completada",
              description: `Audio de ${recordingTime}s guardado exitosamente`,
            });
            
            setCurrentStep('notes');
          };
          
          reader.readAsDataURL(audioBlob);
        }
      }, 500);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const completeVerification = async () => {
    if (!verificationData.clientPhoto || !verificationData.idCardPhoto) {
      toast({
        title: "Verificación Incompleta",
        description: "Faltan fotos requeridas para completar la verificación",
        variant: "destructive",
      });
      return;
    }

    // Get current location
    let location;
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000
        });
      });
      
      location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      };
    } catch (error) {
      console.warn('Could not get location:', error);
    }

    const completeData: VerificationData = {
      clientPhoto: verificationData.clientPhoto!,
      idCardPhoto: verificationData.idCardPhoto!,
      voiceRecording: verificationData.voiceRecording,
      verificationNotes,
      timestamp: new Date().toISOString(),
      location,
      deviceInfo: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language
      }
    };

    onComplete(completeData);
    setCurrentStep('complete');
    
    toast({
      title: "Verificación Completada",
      description: "Todos los datos de identidad han sido capturados exitosamente",
    });
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'client_photo':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                Fotografía del Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Camera className="h-4 w-4" />
                <AlertDescription>
                  Posicione al cliente frente a la cámara. La foto debe mostrar claramente el rostro para verificación de identidad.
                </AlertDescription>
              </Alert>
              
              {!isCapturing ? (
                <Button 
                  onClick={() => startCamera({ 
                    video: { 
                      width: { ideal: 640 }, 
                      height: { ideal: 480 }, 
                      facingMode: 'user' 
                    } 
                  })}
                  className="w-full"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Iniciar Cámara para Foto del Cliente
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <video ref={videoRef} className="w-full rounded-lg" autoPlay muted />
                    <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded text-sm font-medium">
                      ● EN VIVO
                    </div>
                  </div>
                  <Button 
                    onClick={() => capturePhoto('client_photo')}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    Capturar Foto del Cliente
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 'id_card':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-purple-600" />
                Fotografía de Cédula de Identidad
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <CreditCard className="h-4 w-4" />
                <AlertDescription>
                  Capture una foto clara de la cédula de identidad. Asegúrese de que todos los datos sean legibles.
                </AlertDescription>
              </Alert>
              
              {verificationData.clientPhoto && (
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Foto del cliente capturada</span>
                  </div>
                </div>
              )}
              
              {!isCapturing ? (
                <Button 
                  onClick={() => startCamera({ 
                    video: { 
                      width: { ideal: 640 }, 
                      height: { ideal: 480 }, 
                      facingMode: 'environment' 
                    } 
                  })}
                  className="w-full"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Iniciar Cámara para Foto de Cédula
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <video ref={videoRef} className="w-full rounded-lg" autoPlay muted />
                    <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded text-sm font-medium">
                      ● EN VIVO
                    </div>
                  </div>
                  <Button 
                    onClick={() => capturePhoto('id_card')}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    Capturar Foto de Cédula
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 'voice':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="h-5 w-5 text-red-600" />
                Grabación de Voz (Opcional)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Mic className="h-4 w-4" />
                <AlertDescription>
                  Solicite al cliente que diga su nombre completo y RUT para verificación adicional por voz.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800 mb-2">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Fotos capturadas exitosamente</span>
                  </div>
                  <div className="text-xs text-green-600">
                    ✓ Foto del cliente ✓ Foto de cédula
                  </div>
                </div>
              </div>
              
              {!isRecording ? (
                <div className="space-y-3">
                  <Button 
                    onClick={startVoiceRecording}
                    className="w-full bg-red-600 hover:bg-red-700"
                  >
                    <Mic className="mr-2 h-4 w-4" />
                    Iniciar Grabación de Voz
                  </Button>
                  <Button 
                    onClick={() => setCurrentStep('notes')}
                    variant="outline"
                    className="w-full"
                  >
                    Omitir Grabación de Voz
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-red-50 p-4 rounded-lg text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
                      <span className="font-medium text-red-800">GRABANDO</span>
                    </div>
                    <div className="text-2xl font-mono text-red-600">
                      {formatTime(recordingTime)}
                    </div>
                  </div>
                  <Button 
                    onClick={stopVoiceRecording}
                    className="w-full bg-gray-600 hover:bg-gray-700"
                  >
                    <Square className="mr-2 h-4 w-4" />
                    Detener Grabación
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 'notes':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-orange-600" />
                Notas de Verificación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  Agregue cualquier observación importante sobre la verificación de identidad realizada.
                </AlertDescription>
              </Alert>
              
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-sm font-medium text-green-800 mb-2">Verificación Completada:</div>
                <div className="text-xs text-green-600 space-y-1">
                  <div>✓ Foto del cliente capturada</div>
                  <div>✓ Foto de cédula capturada</div>
                  {verificationData.voiceRecording && <div>✓ Grabación de voz realizada</div>}
                  <div>✓ Datos de ubicación y dispositivo registrados</div>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Notas Adicionales del {userRole === 'pos' ? 'Operador POS' : 'Certificador'}:
                </label>
                <Textarea
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  placeholder="Ej: Cliente presentó cédula original en buen estado. Verificación satisfactoria sin observaciones."
                  className="min-h-[100px]"
                />
              </div>
              
              <Button 
                onClick={completeVerification}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Completar Verificación de Identidad
              </Button>
            </CardContent>
          </Card>
        );

      case 'complete':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Verificación Completada
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-green-800 mb-3">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Verificación de Identidad Exitosa</span>
                </div>
                <div className="text-sm text-green-700 space-y-1">
                  <div>• Fotografía del cliente verificada</div>
                  <div>• Documento de identidad capturado</div>
                  {verificationData.voiceRecording && <div>• Grabación de voz registrada</div>}
                  <div>• Datos biométricos y de ubicación almacenados</div>
                  <div>• Proceso completado por: {userRole.toUpperCase()}</div>
                </div>
              </div>
              
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Todos los datos de verificación han sido capturados y almacenados de forma segura para auditoría y cumplimiento legal.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg border">
        <div className="flex items-center gap-4">
          <Badge 
            variant={currentStep === 'client_photo' ? 'default' : verificationData.clientPhoto ? 'secondary' : 'outline'}
            className={currentStep === 'client_photo' ? 'bg-blue-600' : verificationData.clientPhoto ? 'bg-green-100 text-green-800' : ''}
          >
            1. Foto Cliente
          </Badge>
          <Badge 
            variant={currentStep === 'id_card' ? 'default' : verificationData.idCardPhoto ? 'secondary' : 'outline'}
            className={currentStep === 'id_card' ? 'bg-purple-600' : verificationData.idCardPhoto ? 'bg-green-100 text-green-800' : ''}
          >
            2. Foto Cédula
          </Badge>
          <Badge 
            variant={currentStep === 'voice' ? 'default' : verificationData.voiceRecording ? 'secondary' : 'outline'}
            className={currentStep === 'voice' ? 'bg-red-600' : verificationData.voiceRecording ? 'bg-green-100 text-green-800' : ''}
          >
            3. Grabación
          </Badge>
          <Badge 
            variant={currentStep === 'notes' ? 'default' : currentStep === 'complete' ? 'secondary' : 'outline'}
            className={currentStep === 'notes' ? 'bg-orange-600' : currentStep === 'complete' ? 'bg-green-100 text-green-800' : ''}
          >
            4. Notas
          </Badge>
        </div>
        
        <div className="text-sm text-gray-500">
          {userRole === 'pos' ? 'Terminal POS' : 'Certificador'} • RUT: {clientRut || 'N/A'}
        </div>
      </div>

      {/* Current Step Content */}
      {renderCurrentStep()}
      
      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}
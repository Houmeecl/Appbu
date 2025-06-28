import { useRef, useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PenTool, RotateCcw, Download, CheckCircle, AlertTriangle } from "lucide-react";

type SignatureCanvasProps = {
  onSignatureComplete?: (signatureData: string) => void;
  onSave?: (signatureData: string) => void;
  onClear?: () => void;
};

export function SignatureCanvas({ onSignatureComplete, onSave, onClear }: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [strokeCount, setStrokeCount] = useState(0);
  const [signatureData, setSignatureData] = useState<string>("");
  const [canvasReady, setCanvasReady] = useState(false);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * devicePixelRatio;
    canvas.height = rect.height * devicePixelRatio;
    
    ctx.scale(devicePixelRatio, devicePixelRatio);
    
    // Configure drawing style
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1e40af'; // Blue color for signature
    ctx.lineWidth = 2;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    setCanvasReady(true);
  }, []);

  // Get coordinates from event (mouse or touch)
  const getCoordinates = useCallback((event: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }, []);

  // Start drawing
  const startDrawing = useCallback((event: any) => {
    event.preventDefault();
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !canvasReady) return;

    setIsDrawing(true);
    const { x, y } = getCoordinates(event);
    
    ctx.beginPath();
    ctx.moveTo(x, y);
  }, [getCoordinates, canvasReady]);

  // Continue drawing
  const draw = useCallback((event: any) => {
    event.preventDefault();
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !isDrawing) return;

    const { x, y } = getCoordinates(event);
    
    ctx.lineTo(x, y);
    ctx.stroke();
    
    if (!hasSignature) {
      setHasSignature(true);
    }
  }, [isDrawing, getCoordinates, hasSignature]);

  // Stop drawing
  const stopDrawing = useCallback((event: any) => {
    event.preventDefault();
    
    if (!isDrawing) return;
    
    setIsDrawing(false);
    setStrokeCount(prev => prev + 1);
    
    // Generate signature data after drawing
    const canvas = canvasRef.current;
    if (canvas && hasSignature) {
      const dataURL = canvas.toDataURL('image/png');
      setSignatureData(dataURL);
      onSignatureComplete(dataURL);
    }
  }, [isDrawing, hasSignature, onSignatureComplete]);

  // Clear signature
  const clearSignature = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    setHasSignature(false);
    setStrokeCount(0);
    setSignatureData("");
    onClear();
  }, [onClear]);

  // Download signature
  const downloadSignature = useCallback(() => {
    if (!signatureData) return;

    const link = document.createElement('a');
    link.download = `vecinoxpress-signature-${Date.now()}.png`;
    link.href = signatureData;
    link.click();
  }, [signatureData]);

  // Prevent scrolling when drawing on touch devices
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const preventScroll = (e: TouchEvent) => {
      if (isDrawing) {
        e.preventDefault();
      }
    };

    canvas.addEventListener('touchstart', preventScroll, { passive: false });
    canvas.addEventListener('touchmove', preventScroll, { passive: false });
    canvas.addEventListener('touchend', preventScroll, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', preventScroll);
      canvas.removeEventListener('touchmove', preventScroll);
      canvas.removeEventListener('touchend', preventScroll);
    };
  }, [isDrawing]);

  const isSignatureValid = hasSignature && strokeCount >= 3;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PenTool className="h-5 w-5 text-blue-600" />
          Firma Manuscrita Digital
        </CardTitle>
        <p className="text-sm text-gray-600">
          Dibuje su firma en el área inferior con el mouse o dedo
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Signature validation status */}
        {hasSignature && (
          <Alert variant={isSignatureValid ? "default" : "destructive"}>
            {isSignatureValid ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            <AlertDescription>
              {isSignatureValid 
                ? "Firma capturada correctamente con validez legal"
                : "Firma muy simple. Realice una firma más compleja para mayor seguridad"
              }
            </AlertDescription>
          </Alert>
        )}

        {/* Signature Canvas */}
        <div className="relative">
          <canvas
            ref={canvasRef}
            className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-crosshair bg-white touch-none"
            style={{ touchAction: 'none' }}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
          
          {/* Signature guidelines */}
          {!hasSignature && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-gray-400 text-center">
                <PenTool className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">Firme aquí</p>
                <p className="text-xs">Mantenga presionado y dibuje</p>
              </div>
            </div>
          )}
          
          {/* Signature line */}
          <div className="absolute bottom-4 left-4 right-4 border-b border-gray-300 pointer-events-none"></div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button 
            onClick={clearSignature}
            variant="outline"
            disabled={!hasSignature}
            className="flex-1"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Limpiar
          </Button>
          
          {signatureData && (
            <Button 
              onClick={downloadSignature}
              variant="outline"
            >
              <Download className="mr-2 h-4 w-4" />
              Descargar
            </Button>
          )}
        </div>

        {/* Signature info */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• La firma digital tendrá el mismo valor legal que una firma manuscrita</p>
          <p>• Se registrará la fecha, hora y ubicación del firmado</p>
          <p>• Esta firma será parte del documento certificado</p>
          {strokeCount > 0 && (
            <p className="text-blue-600">• Trazos registrados: {strokeCount}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
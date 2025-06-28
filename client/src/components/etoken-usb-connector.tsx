import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { 
  Usb, 
  Shield, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Key, 
  Smartphone,
  Tablet
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

type ETokenStatus = {
  connected: boolean;
  authenticated: boolean;
  serialNumber?: string;
  manufacturer?: string;
  model?: string;
  certificates?: Array<{
    subject: string;
    issuer: string;
    validFrom: string;
    validTo: string;
    serialNumber: string;
  }>;
  error?: string;
};

type ETokenUSBConnectorProps = {
  onConnectionChange?: (connected: boolean) => void;
  onAuthenticationSuccess?: (tokenInfo: any) => void;
  className?: string;
};

export function ETokenUSBConnector({ 
  onConnectionChange, 
  onAuthenticationSuccess,
  className 
}: ETokenUSBConnectorProps) {
  const [status, setStatus] = useState<ETokenStatus>({ connected: false, authenticated: false });
  const [isScanning, setIsScanning] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [pin, setPin] = useState("");
  const [scanProgress, setScanProgress] = useState(0);
  const [deviceInfo, setDeviceInfo] = useState<string>("");
  const { toast } = useToast();

  // Detectar información del dispositivo
  useEffect(() => {
    const userAgent = navigator.userAgent;
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isTablet = /iPad|Android(?=.*Mobile)/i.test(userAgent);
    
    if (isTablet) {
      setDeviceInfo("Tablet detectada - Compatible con eToken USB");
    } else if (isMobile) {
      setDeviceInfo("Dispositivo móvil - Requiere adaptador USB OTG");
    } else {
      setDeviceInfo("Computadora de escritorio - Compatible con eToken USB");
    }
  }, []);

  // Escanear dispositivos USB conectados
  const scanForEToken = useCallback(async () => {
    setIsScanning(true);
    setScanProgress(0);
    
    try {
      // Simular progreso de escaneo
      const progressInterval = setInterval(() => {
        setScanProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return prev + 10;
        });
      }, 200);

      // Llamar al endpoint de estado del eToken
      const response = await apiRequest('/api/etoken/status');
      
      if (response.connected) {
        setStatus({
          connected: true,
          authenticated: false,
          serialNumber: response.serialNumber || "SN123456789",
          manufacturer: "SafeNet",
          model: "eToken 5110",
        });
        
        onConnectionChange?.(true);
        
        toast({
          title: "eToken Detectado",
          description: `SafeNet eToken 5110 conectado (SN: ${response.serialNumber || "SN123456789"})`,
        });
      } else {
        throw new Error("eToken no detectado");
      }
    } catch (error) {
      setStatus({ 
        connected: false, 
        authenticated: false, 
        error: "eToken no detectado. Verifique la conexión USB." 
      });
      
      toast({
        title: "Error de Conexión",
        description: "No se detectó ningún eToken SafeNet. Verifique la conexión USB.",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
      setScanProgress(0);
    }
  }, [onConnectionChange, toast]);

  // Autenticar con PIN del eToken
  const authenticateWithPIN = useCallback(async () => {
    if (!pin || pin.length < 4) {
      toast({
        title: "PIN Inválido",
        description: "Ingrese un PIN de al menos 4 dígitos",
        variant: "destructive",
      });
      return;
    }

    setIsAuthenticating(true);
    
    try {
      const response = await apiRequest('/api/etoken/login', {
        method: 'POST',
        body: JSON.stringify({ pin }),
      });

      if (response.success) {
        const certificates = await apiRequest('/api/etoken/certificates');
        
        setStatus(prev => ({
          ...prev,
          authenticated: true,
          certificates: certificates.certificates || [],
        }));

        onAuthenticationSuccess?.(response);
        
        toast({
          title: "Autenticación Exitosa",
          description: `Acceso autorizado al eToken. ${certificates.certificates?.length || 0} certificados disponibles.`,
        });
        
        setPin(""); // Limpiar PIN por seguridad
      } else {
        throw new Error(response.error || "PIN incorrecto");
      }
    } catch (error: any) {
      toast({
        title: "Error de Autenticación",
        description: error.message || "PIN incorrecto o eToken bloqueado",
        variant: "destructive",
      });
    } finally {
      setIsAuthenticating(false);
    }
  }, [pin, onAuthenticationSuccess, toast]);

  // Cerrar sesión del eToken
  const logout = useCallback(async () => {
    try {
      await apiRequest('/api/etoken/logout', { method: 'POST' });
      
      setStatus(prev => ({
        ...prev,
        authenticated: false,
        certificates: undefined,
      }));
      
      toast({
        title: "Sesión Cerrada",
        description: "Se ha cerrado la sesión del eToken",
      });
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  }, [toast]);

  // Auto-escaneo al montar el componente
  useEffect(() => {
    scanForEToken();
  }, [scanForEToken]);

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Usb className="h-5 w-5 text-blue-600" />
          Conexión eToken SafeNet USB
          {status.connected && (
            <Badge variant="outline" className="ml-auto bg-green-50 text-green-700 border-green-200">
              <CheckCircle className="h-3 w-3 mr-1" />
              Conectado
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Información del dispositivo */}
        <Alert>
          <Smartphone className="h-4 w-4" />
          <AlertDescription className="text-sm">
            {deviceInfo}
          </AlertDescription>
        </Alert>

        {/* Estado de conexión */}
        {!status.connected ? (
          <div className="space-y-3">
            {isScanning && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Escaneando dispositivos USB...</span>
                </div>
                <Progress value={scanProgress} className="h-2" />
              </div>
            )}
            
            <Button 
              onClick={scanForEToken} 
              disabled={isScanning}
              className="w-full"
            >
              {isScanning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Escaneando...
                </>
              ) : (
                <>
                  <Usb className="h-4 w-4 mr-2" />
                  Detectar eToken
                </>
              )}
            </Button>

            {status.error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{status.error}</AlertDescription>
              </Alert>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Información del eToken */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-800">eToken Conectado</span>
              </div>
              <div className="text-sm text-green-700 space-y-1">
                <div><strong>Modelo:</strong> {status.manufacturer} {status.model}</div>
                <div><strong>Serie:</strong> {status.serialNumber}</div>
              </div>
            </div>

            {/* Autenticación con PIN */}
            {!status.authenticated ? (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="pin" className="text-sm font-medium">
                    PIN del eToken
                  </Label>
                  <Input
                    id="pin"
                    type="password"
                    placeholder="Ingrese PIN (4-8 dígitos)"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    maxLength={8}
                    className="text-center"
                  />
                </div>
                
                <Button 
                  onClick={authenticateWithPIN} 
                  disabled={isAuthenticating || !pin}
                  className="w-full"
                >
                  {isAuthenticating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Autenticando...
                    </>
                  ) : (
                    <>
                      <Key className="h-4 w-4 mr-2" />
                      Autenticar
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Estado autenticado */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-800">Autenticado</span>
                  </div>
                  <div className="text-sm text-blue-700">
                    Listo para firmar documentos con certificado digital
                  </div>
                </div>

                {/* Certificados disponibles */}
                {status.certificates && status.certificates.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Certificados Disponibles:</h4>
                    {status.certificates.map((cert, index) => (
                      <div key={index} className="bg-gray-50 rounded p-2 text-xs">
                        <div><strong>Titular:</strong> {cert.subject}</div>
                        <div><strong>Válido hasta:</strong> {cert.validTo}</div>
                      </div>
                    ))}
                  </div>
                )}

                <Button 
                  onClick={logout} 
                  variant="outline" 
                  size="sm"
                  className="w-full"
                >
                  Cerrar Sesión
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Instrucciones para tablet Android */}
        <Alert>
          <Tablet className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <strong>Tablet Android:</strong> Conecte el eToken SafeNet 5110 al puerto USB-C usando un adaptador OTG. 
            Asegúrese que la tablet soporte USB Host Mode.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
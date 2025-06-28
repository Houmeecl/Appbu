import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  Wifi, 
  WifiOff, 
  Cloud, 
  CloudOff, 
  Upload, 
  Download,
  MapPin,
  Smartphone,
  Battery,
  Signal
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RuralModeIndicatorProps {
  isRuralMode: boolean;
  onToggleMode: (rural: boolean) => void;
  pendingDocuments: number;
  onSyncDocuments: () => void;
}

export function RuralModeIndicator({ 
  isRuralMode, 
  onToggleMode, 
  pendingDocuments,
  onSyncDocuments 
}: RuralModeIndicatorProps) {
  const [signalStrength, setSignalStrength] = useState<'strong' | 'weak' | 'offline'>('strong');
  const [batteryLevel, setBatteryLevel] = useState(100);
  const [syncProgress, setSyncProgress] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  // Simular detección de señal
  useEffect(() => {
    const checkSignal = () => {
      if (!navigator.onLine) {
        setSignalStrength('offline');
      } else {
        // En modo rural, simular señal débil
        setSignalStrength(isRuralMode ? 'weak' : 'strong');
      }
    };

    checkSignal();
    const interval = setInterval(checkSignal, 5000);
    return () => clearInterval(interval);
  }, [isRuralMode]);

  // Simular nivel de batería
  useEffect(() => {
    const checkBattery = async () => {
      if ('getBattery' in navigator) {
        try {
          const battery = await (navigator as any).getBattery();
          setBatteryLevel(Math.round(battery.level * 100));
        } catch {
          setBatteryLevel(75); // Valor por defecto
        }
      }
    };

    checkBattery();
    const interval = setInterval(checkBattery, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSync = async () => {
    if (signalStrength === 'offline') {
      toast({
        title: "Sin Conexión",
        description: "No hay conexión a internet. Los documentos se sincronizarán cuando haya señal.",
        variant: "destructive"
      });
      return;
    }

    setIsSyncing(true);
    setSyncProgress(0);

    // Simular progreso de sincronización
    const interval = setInterval(() => {
      setSyncProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsSyncing(false);
          toast({
            title: "Sincronización Completa",
            description: `${pendingDocuments} documentos sincronizados exitosamente.`
          });
          onSyncDocuments();
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  const getSignalIcon = () => {
    switch (signalStrength) {
      case 'strong':
        return <Wifi className="h-5 w-5 text-green-600" />;
      case 'weak':
        return <Signal className="h-5 w-5 text-yellow-600" />;
      case 'offline':
        return <WifiOff className="h-5 w-5 text-red-600" />;
    }
  };

  const getSignalText = () => {
    switch (signalStrength) {
      case 'strong':
        return 'Señal Fuerte';
      case 'weak':
        return 'Señal Débil';
      case 'offline':
        return 'Sin Conexión';
    }
  };

  const getBatteryColor = () => {
    if (batteryLevel > 50) return 'text-green-600';
    if (batteryLevel > 20) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold">Modo Rural</h3>
            <Badge variant={isRuralMode ? "default" : "outline"}>
              {isRuralMode ? "Activado" : "Desactivado"}
            </Badge>
          </div>
          <Button
            variant={isRuralMode ? "destructive" : "default"}
            size="sm"
            onClick={() => onToggleMode(!isRuralMode)}
          >
            {isRuralMode ? "Desactivar" : "Activar"}
          </Button>
        </div>

        {isRuralMode && (
          <>
            {/* Indicadores de estado */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                {getSignalIcon()}
                <span className="text-sm">{getSignalText()}</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                <Battery className={`h-5 w-5 ${getBatteryColor()}`} />
                <span className="text-sm">{batteryLevel}%</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                <Smartphone className="h-5 w-5 text-blue-600" />
                <span className="text-sm">POS Activo</span>
              </div>
            </div>

            {/* Documentos pendientes */}
            {pendingDocuments > 0 && (
              <Alert className="mb-4">
                <CloudOff className="h-4 w-4" />
                <AlertDescription>
                  <strong>{pendingDocuments} documentos</strong> pendientes de sincronización.
                  Se enviarán automáticamente cuando haya conexión estable.
                </AlertDescription>
              </Alert>
            )}

            {/* Sincronización */}
            <div className="space-y-2">
              {isSyncing ? (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span>Sincronizando documentos...</span>
                    <span>{syncProgress}%</span>
                  </div>
                  <Progress value={syncProgress} className="h-2" />
                </>
              ) : (
                <Button
                  onClick={handleSync}
                  disabled={pendingDocuments === 0 || signalStrength === 'offline'}
                  className="w-full"
                  variant="outline"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Sincronizar Ahora ({pendingDocuments})
                </Button>
              )}
            </div>

            {/* Consejos para modo rural */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-semibold text-blue-900 mb-1">
                Tips para Zonas Rurales:
              </h4>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• Los documentos se guardan localmente primero</li>
                <li>• La sincronización es automática con buena señal</li>
                <li>• Mantén el dispositivo cargado sobre 30%</li>
                <li>• Busca zonas altas para mejor señal</li>
              </ul>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
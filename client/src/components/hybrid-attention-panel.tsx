import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Phone,
  PhoneOff,
  Monitor,
  Users,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  Wifi,
  Camera
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RemoteClient {
  id: string;
  name: string;
  rut: string;
  location: string;
  connectionQuality: 'excellent' | 'good' | 'poor';
  waitTime: number;
  documentType: string;
  posTerminal: string;
}

interface HybridAttentionPanelProps {
  onStartVideoCall: (clientId: string) => void;
  onEndCall: () => void;
  activeCall: boolean;
}

export function HybridAttentionPanel({ 
  onStartVideoCall, 
  onEndCall, 
  activeCall 
}: HybridAttentionPanelProps) {
  const [selectedClient, setSelectedClient] = useState<RemoteClient | null>(null);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const { toast } = useToast();

  // Simular cola de clientes remotos esperando
  const remoteQueue: RemoteClient[] = [
    {
      id: "1",
      name: "María González",
      rut: "12.345.678-9",
      location: "Chiloé, X Región",
      connectionQuality: 'good',
      waitTime: 5,
      documentType: "Poder Notarial",
      posTerminal: "POS Rural Chiloé"
    },
    {
      id: "2", 
      name: "Juan Pérez",
      rut: "11.222.333-4",
      location: "Pucón, IX Región",
      connectionQuality: 'poor',
      waitTime: 12,
      documentType: "Declaración Jurada",
      posTerminal: "POS Pucón Centro"
    },
    {
      id: "3",
      name: "Ana Silva",
      rut: "14.555.666-7",
      location: "Vicuña, IV Región",
      connectionQuality: 'excellent',
      waitTime: 18,
      documentType: "Autorización Viaje",
      posTerminal: "POS Valle Elqui"
    }
  ];

  const getConnectionIcon = (quality: RemoteClient['connectionQuality']) => {
    switch (quality) {
      case 'excellent':
        return <Wifi className="h-4 w-4 text-green-600" />;
      case 'good':
        return <Wifi className="h-4 w-4 text-yellow-600" />;
      case 'poor':
        return <Wifi className="h-4 w-4 text-red-600" />;
    }
  };

  const getConnectionColor = (quality: RemoteClient['connectionQuality']) => {
    switch (quality) {
      case 'excellent':
        return 'bg-green-100 text-green-800';
      case 'good':
        return 'bg-yellow-100 text-yellow-800';
      case 'poor':
        return 'bg-red-100 text-red-800';
    }
  };

  const handleStartCall = (client: RemoteClient) => {
    if (client.connectionQuality === 'poor') {
      toast({
        title: "Conexión Débil",
        description: "La calidad de conexión del cliente es baja. La videollamada podría tener interrupciones.",
        variant: "destructive"
      });
    }
    
    setSelectedClient(client);
    onStartVideoCall(client.id);
    
    toast({
      title: "Videollamada Iniciada",
      description: `Conectando con ${client.name} en ${client.location}`
    });
  };

  const handleEndCall = () => {
    setSelectedClient(null);
    setVideoEnabled(true);
    setAudioEnabled(true);
    setScreenSharing(false);
    onEndCall();
    
    toast({
      title: "Llamada Finalizada",
      description: "La videollamada ha terminado exitosamente"
    });
  };

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">En Cola Remota</p>
                <p className="text-2xl font-bold">{remoteQueue.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Tiempo Promedio</p>
                <p className="text-2xl font-bold">15 min</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Video className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Atendidos Hoy</p>
                <p className="text-2xl font-bold">24</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <MapPin className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Regiones Activas</p>
                <p className="text-2xl font-bold">8</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="queue" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="queue">Cola de Espera Remota</TabsTrigger>
          <TabsTrigger value="active" disabled={!activeCall}>
            Videollamada Activa
          </TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Clientes Esperando Atención Remota
              </CardTitle>
            </CardHeader>
            <CardContent>
              {remoteQueue.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Video className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No hay clientes en espera remota</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {remoteQueue.map((client) => (
                      <Card key={client.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex gap-4">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${client.name}`} />
                              <AvatarFallback>{client.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                            </Avatar>
                            
                            <div className="space-y-1">
                              <h4 className="font-semibold">{client.name}</h4>
                              <p className="text-sm text-gray-600">RUT: {client.rut}</p>
                              <div className="flex items-center gap-2 text-sm">
                                <MapPin className="h-3 w-3" />
                                <span>{client.location}</span>
                              </div>
                              <div className="flex items-center gap-4 mt-2">
                                <Badge variant="outline">
                                  {client.documentType}
                                </Badge>
                                <Badge variant="secondary">
                                  {client.posTerminal}
                                </Badge>
                                <Badge className={getConnectionColor(client.connectionQuality)}>
                                  {getConnectionIcon(client.connectionQuality)}
                                  <span className="ml-1">
                                    {client.connectionQuality === 'excellent' ? 'Excelente' :
                                     client.connectionQuality === 'good' ? 'Buena' : 'Débil'}
                                  </span>
                                </Badge>
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right space-y-2">
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Clock className="h-3 w-3" />
                              <span>Esperando {client.waitTime} min</span>
                            </div>
                            <Button
                              onClick={() => handleStartCall(client)}
                              disabled={activeCall}
                              size="sm"
                              className="w-full"
                            >
                              <Video className="h-4 w-4 mr-2" />
                              Iniciar Videollamada
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active" className="mt-4">
          {selectedClient && (
            <Card>
              <CardHeader>
                <CardTitle>Videollamada con {selectedClient.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Video principal */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="relative bg-gray-900 rounded-lg aspect-video flex items-center justify-center">
                      {videoEnabled ? (
                        <div className="text-white text-center">
                          <Camera className="h-12 w-12 mx-auto mb-2" />
                          <p>Video del Cliente</p>
                        </div>
                      ) : (
                        <div className="text-white text-center">
                          <VideoOff className="h-12 w-12 mx-auto mb-2" />
                          <p>Video Desactivado</p>
                        </div>
                      )}
                      
                      {/* Mini vista del certificador */}
                      <div className="absolute bottom-4 right-4 w-32 h-24 bg-gray-800 rounded-lg flex items-center justify-center">
                        <p className="text-white text-xs">Tu cámara</p>
                      </div>
                    </div>

                    {/* Controles de videollamada */}
                    <div className="flex justify-center gap-4">
                      <Button
                        variant={videoEnabled ? "outline" : "destructive"}
                        size="icon"
                        onClick={() => setVideoEnabled(!videoEnabled)}
                      >
                        {videoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                      </Button>
                      
                      <Button
                        variant={audioEnabled ? "outline" : "destructive"}
                        size="icon"
                        onClick={() => setAudioEnabled(!audioEnabled)}
                      >
                        {audioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                      </Button>
                      
                      <Button
                        variant={screenSharing ? "default" : "outline"}
                        size="icon"
                        onClick={() => setScreenSharing(!screenSharing)}
                      >
                        <Monitor className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="destructive"
                        onClick={handleEndCall}
                      >
                        <PhoneOff className="h-4 w-4 mr-2" />
                        Finalizar
                      </Button>
                    </div>
                  </div>

                  {/* Panel de información */}
                  <div className="space-y-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Información del Cliente</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div>
                          <p className="text-sm text-gray-600">Nombre</p>
                          <p className="font-semibold">{selectedClient.name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">RUT</p>
                          <p className="font-semibold">{selectedClient.rut}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Ubicación</p>
                          <p className="font-semibold">{selectedClient.location}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Terminal POS</p>
                          <p className="font-semibold">{selectedClient.posTerminal}</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Documento a Certificar</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Badge className="w-full justify-center py-2">
                          {selectedClient.documentType}
                        </Badge>
                      </CardContent>
                    </Card>

                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Verifica la identidad del cliente mostrando su cédula a la cámara antes de proceder con la firma.
                      </AlertDescription>
                    </Alert>

                    {/* Indicador de calidad de conexión */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Calidad de Conexión</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Latencia</span>
                            <span>45ms</span>
                          </div>
                          <Progress value={85} className="h-2" />
                          <Badge className={`w-full justify-center ${getConnectionColor(selectedClient.connectionQuality)}`}>
                            {selectedClient.connectionQuality === 'excellent' ? 'Excelente' :
                             selectedClient.connectionQuality === 'good' ? 'Buena' : 'Débil'}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
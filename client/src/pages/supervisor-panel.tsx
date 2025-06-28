import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Switch } from "../components/ui/switch";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Alert, AlertDescription } from "../components/ui/alert";
import { 
  Settings, 
  Video, 
  FileText, 
  Shield, 
  Monitor, 
  Edit, 
  Power, 
  DollarSign,
  MapPin,
  Clock,
  Users,
  Eye,
  Play,
  Pause,
  Volume2,
  VolumeX,
  RotateCcw
} from "lucide-react";

type PosTerminal = {
  id: number;
  name: string;
  location: string;
  address: string;
  isActive: boolean;
  lastActivity: string;
  documentsCount: number;
  latitude?: string;
  longitude?: string;
};

type Certificador = {
  id: number;
  username: string;
  name: string;
  isActive: boolean;
  lastLogin: string;
  documentsProcessed: number;
  role: string;
};

type DocumentValue = {
  id: number;
  name: string;
  price: string;
  description: string;
  isActive: boolean;
};

type VideoSession = {
  id: number;
  documentId: number;
  clientName: string;
  startTime: string;
  duration: number;
  status: 'active' | 'completed' | 'cancelled';
  recordingUrl?: string;
  posTerminalId: number;
};

export default function SupervisorPanel() {
  const [activeTab, setActiveTab] = useState("pos-control");
  const [videoFilter, setVideoFilter] = useState("active");
  const queryClient = useQueryClient();

  // Queries para datos
  const { data: posTerminals, isLoading: posLoading } = useQuery({
    queryKey: ['/api/admin/pos-terminals'],
    enabled: activeTab === "pos-control"
  });

  const { data: certificadores, isLoading: certLoading } = useQuery({
    queryKey: ['/api/admin/users'],
    enabled: activeTab === "certificadores"
  });

  const { data: documentTypes, isLoading: docTypesLoading } = useQuery({
    queryKey: ['/api/document-types'],
    enabled: activeTab === "document-values"
  });

  const { data: videoSessions, isLoading: videoLoading } = useQuery({
    queryKey: ['/api/supervisor/video-sessions'],
    enabled: activeTab === "video-manager"
  });

  // Mutaciones para control POS
  const togglePosMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const response = await fetch(`/api/supervisor/pos/${id}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      });
      if (!response.ok) throw new Error('Failed to toggle POS');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/pos-terminals'] });
    }
  });

  // Mutación para actualizar valores de documentos
  const updateDocumentValueMutation = useMutation({
    mutationFn: async ({ id, price }: { id: number; price: string }) => {
      const response = await fetch(`/api/supervisor/document-types/${id}/price`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price })
      });
      if (!response.ok) throw new Error('Failed to update document price');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/document-types'] });
    }
  });

  // Mutación para control de certificadores
  const toggleCertificadorMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const response = await fetch(`/api/supervisor/certificadores/${id}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      });
      if (!response.ok) throw new Error('Failed to toggle certificador');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Panel Supervisor</h1>
          <p className="text-gray-600">Control integral de POS, certificadores y gestión documental</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pos-control" className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              Control POS
            </TabsTrigger>
            <TabsTrigger value="certificadores" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Certificadores
            </TabsTrigger>
            <TabsTrigger value="document-values" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Valores Documentos
            </TabsTrigger>
            <TabsTrigger value="video-manager" className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              Gestión Video
            </TabsTrigger>
          </TabsList>

          {/* Control POS */}
          <TabsContent value="pos-control">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Control de Terminales POS
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {posLoading ? (
                      <div className="text-center py-8">Cargando terminales...</div>
                    ) : (
                      Array.isArray(posTerminals) ? posTerminals.map((terminal: PosTerminal) => (
                        <Card key={terminal.id} className="border-l-4 border-l-blue-500">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                  <h3 className="font-semibold">{terminal.name}</h3>
                                  <Badge variant={terminal.isActive ? "default" : "secondary"}>
                                    {terminal.isActive ? "Activo" : "Inactivo"}
                                  </Badge>
                                </div>
                                <div className="text-sm text-gray-600 space-y-1">
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-3 w-3" />
                                    {terminal.location} - {terminal.address}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-3 w-3" />
                                    Última actividad: {new Date(terminal.lastActivity).toLocaleString()}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <FileText className="h-3 w-3" />
                                    Documentos procesados: {terminal.documentsCount}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="outline" size="sm">
                                      <Edit className="h-3 w-3 mr-1" />
                                      Configurar
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Configurar Terminal {terminal.name}</DialogTitle>
                                    </DialogHeader>
                                    <PosConfigForm terminal={terminal} />
                                  </DialogContent>
                                </Dialog>
                                <Switch
                                  checked={terminal.isActive}
                                  onCheckedChange={(checked) => {
                                    togglePosMutation.mutate({ id: terminal.id, isActive: checked });
                                  }}
                                  disabled={togglePosMutation.isPending}
                                />
                                <Power className={`h-4 w-4 ${terminal.isActive ? 'text-green-500' : 'text-gray-400'}`} />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )) : <div className="text-center py-8">No hay terminales registrados</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Certificadores */}
          <TabsContent value="certificadores">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Control de Certificadores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {certLoading ? (
                    <div className="text-center py-8">Cargando certificadores...</div>
                  ) : (
                    Array.isArray(certificadores) ? certificadores
                      .filter((user: any) => user.role === 'certificador')
                      .map((cert: Certificador) => (
                        <Card key={cert.id} className="border-l-4 border-l-green-500">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                  <h3 className="font-semibold">{cert.name}</h3>
                                  <Badge variant="outline">@{cert.username}</Badge>
                                  <Badge variant={cert.isActive ? "default" : "secondary"}>
                                    {cert.isActive ? "Habilitado" : "Deshabilitado"}
                                  </Badge>
                                </div>
                                <div className="text-sm text-gray-600 space-y-1">
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-3 w-3" />
                                    Último acceso: {new Date(cert.lastLogin).toLocaleString()}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <FileText className="h-3 w-3" />
                                    Documentos procesados: {cert.documentsProcessed}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="outline" size="sm">
                                      <Edit className="h-3 w-3 mr-1" />
                                      Editar
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Editar Certificador {cert.name}</DialogTitle>
                                    </DialogHeader>
                                    <CertificadorForm certificador={cert} />
                                  </DialogContent>
                                </Dialog>
                                <Switch
                                  checked={cert.isActive}
                                  onCheckedChange={(checked) => {
                                    toggleCertificadorMutation.mutate({ id: cert.id, isActive: checked });
                                  }}
                                  disabled={toggleCertificadorMutation.isPending}
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )) : <div className="text-center py-8">No hay certificadores</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Valores de Documentos */}
          <TabsContent value="document-values">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Gestión de Precios de Documentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {docTypesLoading ? (
                    <div className="text-center py-8">Cargando tipos de documentos...</div>
                  ) : (
                    Array.isArray(documentTypes) ? documentTypes.map((docType: DocumentValue) => (
                      <Card key={docType.id} className="border-l-4 border-l-yellow-500">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-2">
                              <h3 className="font-semibold">{docType.name}</h3>
                              <p className="text-sm text-gray-600">{docType.description}</p>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-lg font-bold">
                                  ${docType.price}
                                </Badge>
                                <Badge variant={docType.isActive ? "default" : "secondary"}>
                                  {docType.isActive ? "Disponible" : "No disponible"}
                                </Badge>
                              </div>
                            </div>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline">
                                  <Edit className="h-3 w-3 mr-1" />
                                  Modificar Precio
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Modificar Precio - {docType.name}</DialogTitle>
                                </DialogHeader>
                                <DocumentPriceForm 
                                  docType={docType} 
                                  onUpdate={(price) => updateDocumentValueMutation.mutate({ id: docType.id, price })}
                                  isLoading={updateDocumentValueMutation.isPending}
                                />
                              </DialogContent>
                            </Dialog>
                          </div>
                        </CardContent>
                      </Card>
                    )) : <div className="text-center py-8">No hay tipos de documentos</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Gestión de Video */}
          <TabsContent value="video-manager">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="h-5 w-5" />
                    Gestión de Verificación por Video
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 mb-4">
                    <Select value={videoFilter} onValueChange={setVideoFilter}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Sesiones Activas</SelectItem>
                        <SelectItem value="completed">Completadas</SelectItem>
                        <SelectItem value="cancelled">Canceladas</SelectItem>
                        <SelectItem value="all">Todas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-4">
                    {videoLoading ? (
                      <div className="text-center py-8">Cargando sesiones de video...</div>
                    ) : (
                      <VideoSessionsList sessions={videoSessions || []} filter={videoFilter} />
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Componentes auxiliares
function PosConfigForm({ terminal }: { terminal: PosTerminal }) {
  const [config, setConfig] = useState({
    name: terminal.name,
    location: terminal.location,
    address: terminal.address,
    latitude: terminal.latitude || "",
    longitude: terminal.longitude || ""
  });

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="name">Nombre del Terminal</Label>
        <Input
          id="name"
          value={config.name}
          onChange={(e) => setConfig({ ...config, name: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="location">Ubicación</Label>
        <Input
          id="location"
          value={config.location}
          onChange={(e) => setConfig({ ...config, location: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="address">Dirección</Label>
        <Textarea
          id="address"
          value={config.address}
          onChange={(e) => setConfig({ ...config, address: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="lat">Latitud</Label>
          <Input
            id="lat"
            value={config.latitude}
            onChange={(e) => setConfig({ ...config, latitude: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="lng">Longitud</Label>
          <Input
            id="lng"
            value={config.longitude}
            onChange={(e) => setConfig({ ...config, longitude: e.target.value })}
          />
        </div>
      </div>
      <Button className="w-full">Guardar Configuración</Button>
    </div>
  );
}

function CertificadorForm({ certificador }: { certificador: Certificador }) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="name">Nombre Completo</Label>
        <Input id="name" defaultValue={certificador.name} />
      </div>
      <div>
        <Label htmlFor="username">Usuario</Label>
        <Input id="username" defaultValue={certificador.username} disabled />
      </div>
      <div>
        <Label htmlFor="role">Rol</Label>
        <Select defaultValue={certificador.role}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="certificador">Certificador</SelectItem>
            <SelectItem value="supervisor">Supervisor</SelectItem>
            <SelectItem value="admin">Administrador</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button className="w-full">Actualizar Certificador</Button>
    </div>
  );
}

function DocumentPriceForm({ 
  docType, 
  onUpdate, 
  isLoading 
}: { 
  docType: DocumentValue; 
  onUpdate: (price: string) => void; 
  isLoading: boolean; 
}) {
  const [price, setPrice] = useState(docType.price);

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="current">Precio Actual</Label>
        <Input id="current" value={`$${docType.price}`} disabled />
      </div>
      <div>
        <Label htmlFor="new">Nuevo Precio</Label>
        <Input
          id="new"
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="0.00"
        />
      </div>
      <Button 
        className="w-full" 
        onClick={() => onUpdate(price)}
        disabled={isLoading}
      >
        {isLoading ? "Actualizando..." : "Actualizar Precio"}
      </Button>
    </div>
  );
}

function VideoSessionsList({ sessions, filter }: { sessions: VideoSession[]; filter: string }) {
  const filteredSessions = sessions.filter(session => {
    if (filter === "all") return true;
    return session.status === filter;
  });

  if (filteredSessions.length === 0) {
    return (
      <div className="text-center py-8">
        <Video className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-500">No hay sesiones de video en esta categoría</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filteredSessions.map(session => (
        <Card key={session.id} className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold">{session.clientName}</h3>
                  <Badge variant={
                    session.status === 'active' ? 'default' : 
                    session.status === 'completed' ? 'secondary' : 'destructive'
                  }>
                    {session.status === 'active' ? 'En vivo' : 
                     session.status === 'completed' ? 'Completada' : 'Cancelada'}
                  </Badge>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    Inicio: {new Date(session.startTime).toLocaleString()}
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-3 w-3" />
                    Documento ID: {session.documentId}
                  </div>
                  <div className="flex items-center gap-2">
                    <Monitor className="h-3 w-3" />
                    Terminal POS: {session.posTerminalId}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {session.status === 'active' && (
                  <>
                    <Button size="sm" variant="outline">
                      <Eye className="h-3 w-3 mr-1" />
                      Supervisar
                    </Button>
                    <Button size="sm" variant="outline">
                      <Volume2 className="h-3 w-3 mr-1" />
                      Audio
                    </Button>
                  </>
                )}
                {session.recordingUrl && (
                  <Button size="sm" variant="outline">
                    <Play className="h-3 w-3 mr-1" />
                    Reproducir
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
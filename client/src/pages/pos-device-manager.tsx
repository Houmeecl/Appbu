import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Smartphone, 
  Shield, 
  MapPin, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Plus,
  Search,
  Wifi,
  Battery,
  Signal
} from 'lucide-react';

interface POSDevice {
  id: number;
  terminalId: number;
  imei: string;
  deviceFingerprint: string;
  model?: string;
  brand?: string;
  androidVersion?: string;
  appVersion?: string;
  macAddress?: string;
  serialNumber?: string;
  accessKey: string;
  secretKey: string;
  encryptionKey: string;
  trustedStatus: string;
  riskScore: number;
  securityFlags: string[];
  lastLocationUpdate: string;
  lastHealthCheck?: string;
  createdAt: string;
  updatedAt: string;
}

interface POSRegistrationData {
  deviceInfo: {
    imei: string;
    model: string;
    brand: string;
    androidVersion: string;
    appVersion: string;
    screenResolution: string;
    batteryLevel?: number;
    networkType: string;
    macAddress?: string;
    serialNumber?: string;
  };
  locationInfo: {
    latitude: number;
    longitude: number;
    accuracy: number;
    address: string;
    region: string;
    city: string;
    zone: string;
  };
  businessInfo: {
    businessName: string;
    businessType: string;
    contactName: string;
    contactPhone: string;
    contactEmail: string;
    rut?: string;
  };
  operatorInfo: {
    operatorName: string;
    operatorRut: string;
    operatorPhone: string;
    experience: string;
    shift: string;
  };
}

export default function POSDeviceManager() {
  const [selectedDevice, setSelectedDevice] = useState<POSDevice | null>(null);
  const [registrationData, setRegistrationData] = useState<Partial<POSRegistrationData>>({});
  const [searchImei, setSearchImei] = useState('');
  const { toast } = useToast();

  // Get all POS devices
  const { data: devices, isLoading } = useQuery({
    queryKey: ['/api/pos/devices'],
    queryFn: () => fetch('/api/pos/devices').then(res => res.json())
  });

  // Register new POS device
  const registerMutation = useMutation({
    mutationFn: (data: POSRegistrationData) => 
      apiRequest('/api/pos/register', { method: 'POST', body: data }),
    onSuccess: (result) => {
      toast({
        title: 'Dispositivo POS Registrado',
        description: `Terminal ID: ${result.credentials?.terminalId}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/pos/devices'] });
      setRegistrationData({});
    },
    onError: (error: any) => {
      toast({
        title: 'Error al Registrar',
        description: error.message || 'Error desconocido',
        variant: 'destructive',
      });
    }
  });

  // Get device status by IMEI
  const statusMutation = useMutation({
    mutationFn: (imei: string) => 
      apiRequest(`/api/pos/${imei}/status`),
    onSuccess: (result) => {
      setSelectedDevice(result.device || null);
      toast({
        title: 'Estado del Dispositivo',
        description: `Estado: ${result.device?.trustedStatus}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Dispositivo No Encontrado',
        description: error.message || 'IMEI no válido',
        variant: 'destructive',
      });
    }
  });

  const getTrustedStatusBadge = (status: string) => {
    const statusConfig = {
      verified: { color: 'bg-green-500', icon: CheckCircle, text: 'Verificado' },
      pending: { color: 'bg-yellow-500', icon: Activity, text: 'Pendiente' },
      suspicious: { color: 'bg-orange-500', icon: AlertTriangle, text: 'Sospechoso' },
      blocked: { color: 'bg-red-500', icon: XCircle, text: 'Bloqueado' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.color} text-white`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </Badge>
    );
  };

  const getRiskScoreColor = (score: number) => {
    if (score <= 30) return 'text-green-600';
    if (score <= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gestión de Dispositivos POS</h1>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Buscar por IMEI..."
              value={searchImei}
              onChange={(e) => setSearchImei(e.target.value)}
              className="w-64"
            />
            <Button 
              onClick={() => statusMutation.mutate(searchImei)}
              disabled={!searchImei || statusMutation.isPending}
            >
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="devices" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="devices">Dispositivos Activos</TabsTrigger>
          <TabsTrigger value="register">Registrar Nuevo</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoreo</TabsTrigger>
        </TabsList>

        <TabsContent value="devices" className="space-y-4">
          <div className="grid gap-4">
            {isLoading ? (
              <div className="text-center py-8">Cargando dispositivos...</div>
            ) : devices?.length ? (
              devices.map((device: POSDevice) => (
                <Card key={device.id} className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setSelectedDevice(device)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Smartphone className="w-5 h-5 text-blue-600" />
                        <div>
                          <CardTitle className="text-lg">{device.brand} {device.model}</CardTitle>
                          <p className="text-sm text-gray-600">IMEI: {device.imei}</p>
                        </div>
                      </div>
                      {getTrustedStatusBadge(device.trustedStatus)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-gray-500" />
                        <span className={getRiskScoreColor(device.riskScore)}>
                          Riesgo: {device.riskScore}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-700">
                          {new Date(device.lastLocationUpdate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-700">
                          App: {device.appVersion}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Wifi className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-700">
                          Android: {device.androidVersion}
                        </span>
                      </div>
                    </div>
                    
                    {device.securityFlags && device.securityFlags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {device.securityFlags.map((flag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {flag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                No hay dispositivos registrados
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="register" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Registrar Nuevo Dispositivo POS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Device Info */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Información del Dispositivo</h3>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="imei">IMEI *</Label>
                      <Input
                        id="imei"
                        placeholder="123456789012345"
                        value={registrationData.deviceInfo?.imei || ''}
                        onChange={(e) => setRegistrationData(prev => ({
                          ...prev,
                          deviceInfo: { ...prev.deviceInfo, imei: e.target.value }
                        }))}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="brand">Marca</Label>
                        <Input
                          id="brand"
                          placeholder="Samsung"
                          value={registrationData.deviceInfo?.brand || ''}
                          onChange={(e) => setRegistrationData(prev => ({
                            ...prev,
                            deviceInfo: { ...prev.deviceInfo, brand: e.target.value }
                          }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="model">Modelo</Label>
                        <Input
                          id="model"
                          placeholder="Galaxy Tab A8"
                          value={registrationData.deviceInfo?.model || ''}
                          onChange={(e) => setRegistrationData(prev => ({
                            ...prev,
                            deviceInfo: { ...prev.deviceInfo, model: e.target.value }
                          }))}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="android">Versión Android</Label>
                        <Input
                          id="android"
                          placeholder="13.0"
                          value={registrationData.deviceInfo?.androidVersion || ''}
                          onChange={(e) => setRegistrationData(prev => ({
                            ...prev,
                            deviceInfo: { ...prev.deviceInfo, androidVersion: e.target.value }
                          }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="appVersion">Versión App</Label>
                        <Input
                          id="appVersion"
                          placeholder="1.2.0"
                          value={registrationData.deviceInfo?.appVersion || ''}
                          onChange={(e) => setRegistrationData(prev => ({
                            ...prev,
                            deviceInfo: { ...prev.deviceInfo, appVersion: e.target.value }
                          }))}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Business Info */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Información del Negocio</h3>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="businessName">Nombre del Negocio *</Label>
                      <Input
                        id="businessName"
                        placeholder="Minimarket Los Andes"
                        value={registrationData.businessInfo?.businessName || ''}
                        onChange={(e) => setRegistrationData(prev => ({
                          ...prev,
                          businessInfo: { ...prev.businessInfo, businessName: e.target.value }
                        }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="businessType">Tipo de Negocio</Label>
                      <Select
                        value={registrationData.businessInfo?.businessType || ''}
                        onValueChange={(value) => setRegistrationData(prev => ({
                          ...prev,
                          businessInfo: { ...prev.businessInfo, businessType: value }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="minimarket">Minimarket</SelectItem>
                          <SelectItem value="farmacia">Farmacia</SelectItem>
                          <SelectItem value="libreria">Librería</SelectItem>
                          <SelectItem value="ferreteria">Ferretería</SelectItem>
                          <SelectItem value="otro">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="contactName">Contacto *</Label>
                      <Input
                        id="contactName"
                        placeholder="Juan Pérez"
                        value={registrationData.businessInfo?.contactName || ''}
                        onChange={(e) => setRegistrationData(prev => ({
                          ...prev,
                          businessInfo: { ...prev.businessInfo, contactName: e.target.value }
                        }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="contactPhone">Teléfono *</Label>
                      <Input
                        id="contactPhone"
                        placeholder="+56912345678"
                        value={registrationData.businessInfo?.contactPhone || ''}
                        onChange={(e) => setRegistrationData(prev => ({
                          ...prev,
                          businessInfo: { ...prev.businessInfo, contactPhone: e.target.value }
                        }))}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Location Info */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Ubicación</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="address">Dirección *</Label>
                    <Textarea
                      id="address"
                      placeholder="Av. Principal 123, Local 5"
                      value={registrationData.locationInfo?.address || ''}
                      onChange={(e) => setRegistrationData(prev => ({
                        ...prev,
                        locationInfo: { ...prev.locationInfo, address: e.target.value }
                      }))}
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="region">Región</Label>
                    <Select
                      value={registrationData.locationInfo?.region || ''}
                      onValueChange={(value) => setRegistrationData(prev => ({
                        ...prev,
                        locationInfo: { ...prev.locationInfo, region: value }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar región" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Metropolitana">Metropolitana</SelectItem>
                        <SelectItem value="Valparaíso">Valparaíso</SelectItem>
                        <SelectItem value="Bio Bío">Bio Bío</SelectItem>
                        <SelectItem value="Araucanía">Araucanía</SelectItem>
                        <SelectItem value="Los Lagos">Los Lagos</SelectItem>
                        <SelectItem value="Antofagasta">Antofagasta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="city">Ciudad</Label>
                    <Input
                      id="city"
                      placeholder="Santiago"
                      value={registrationData.locationInfo?.city || ''}
                      onChange={(e) => setRegistrationData(prev => ({
                        ...prev,
                        locationInfo: { ...prev.locationInfo, city: e.target.value }
                      }))}
                    />
                  </div>
                </div>
              </div>

              <Button 
                onClick={() => registerMutation.mutate(registrationData as POSRegistrationData)}
                disabled={registerMutation.isPending || !registrationData.deviceInfo?.imei}
                className="w-full"
              >
                {registerMutation.isPending ? 'Registrando...' : 'Registrar Dispositivo POS'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          {selectedDevice ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Monitoreo: {selectedDevice.brand} {selectedDevice.model}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-gray-600 uppercase">Estado de Seguridad</h4>
                    <div className="flex items-center gap-2">
                      {getTrustedStatusBadge(selectedDevice.trustedStatus)}
                      <span className={`font-semibold ${getRiskScoreColor(selectedDevice.riskScore)}`}>
                        {selectedDevice.riskScore}% riesgo
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-gray-600 uppercase">Última Actividad</h4>
                    <p className="text-sm">
                      Ubicación: {new Date(selectedDevice.lastLocationUpdate).toLocaleString()}
                    </p>
                    {selectedDevice.lastHealthCheck && (
                      <p className="text-sm">
                        Health Check: {new Date(selectedDevice.lastHealthCheck).toLocaleString()}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-gray-600 uppercase">Detalles Técnicos</h4>
                    <div className="text-sm space-y-1">
                      <p>IMEI: {selectedDevice.imei}</p>
                      <p>MAC: {selectedDevice.macAddress || 'N/A'}</p>
                      <p>Serial: {selectedDevice.serialNumber || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {selectedDevice.securityFlags && selectedDevice.securityFlags.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-semibold text-sm text-gray-600 uppercase mb-2">Alertas de Seguridad</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedDevice.securityFlags.map((flag, index) => (
                        <Badge key={index} variant="destructive" className="text-xs">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          {flag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Smartphone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Selecciona un dispositivo para monitorear</p>
                <p className="text-sm text-gray-400 mt-2">
                  Busca por IMEI o selecciona desde la lista de dispositivos
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
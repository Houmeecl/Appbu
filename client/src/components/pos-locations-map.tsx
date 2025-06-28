import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  MapPin, 
  Search, 
  Navigation, 
  Activity,
  Users,
  Clock,
  Smartphone,
  AlertCircle,
  CheckCircle,
  Filter,
  RefreshCw
} from "lucide-react";

interface PosTerminal {
  id: number;
  terminalId: string;
  name: string;
  address: string;
  latitude: string;
  longitude: string;
  isActive: boolean;
  lastSeen?: string;
  documentsToday?: number;
  status?: 'online' | 'offline' | 'busy';
}

export function PosLocationsMap() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [selectedTerminal, setSelectedTerminal] = useState<PosTerminal | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Obtener terminales POS con ubicaciones GPS
  const { data: terminals = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/pos/locations"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/pos/locations");
      return response.json();
    },
    refetchInterval: 30000 // Actualizar cada 30 segundos
  });

  // Obtener ubicación del usuario
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error("Error obteniendo ubicación:", error);
        }
      );
    }
  }, []);

  // Calcular distancia entre dos puntos GPS
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Filtrar terminales por búsqueda y región
  const filteredTerminals = terminals.filter((terminal: PosTerminal) => {
    const matchesSearch = terminal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         terminal.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         terminal.terminalId.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRegion = selectedRegion === "all" || getRegionFromCoords(terminal.latitude, terminal.longitude) === selectedRegion;
    
    return matchesSearch && matchesRegion;
  });

  // Determinar región basada en coordenadas
  const getRegionFromCoords = (lat: string, lng: string) => {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    
    if (latitude > -20 && latitude < -17) return "norte";
    if (latitude > -34 && latitude < -32 && longitude > -71.8 && longitude < -70) return "centro";
    if (latitude < -36) return "sur";
    return "centro";
  };

  // Estadísticas generales
  const stats = {
    totalActive: terminals.filter((t: PosTerminal) => t.isActive).length,
    totalTerminals: terminals.length,
    documentsToday: terminals.reduce((sum: number, t: PosTerminal) => sum + (t.documentsToday || 0), 0),
    onlineTerminals: terminals.filter((t: PosTerminal) => t.status === 'online').length
  };

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Activity className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Terminales Activos</p>
                <p className="text-2xl font-bold">{stats.totalActive}/{stats.totalTerminals}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">En Línea Ahora</p>
                <p className="text-2xl font-bold">{stats.onlineTerminals}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Documentos Hoy</p>
                <p className="text-2xl font-bold">{stats.documentsToday}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <MapPin className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Cobertura Nacional</p>
                <p className="text-2xl font-bold">16 Regiones</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controles de búsqueda y filtros */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Mapa de Terminales POS</CardTitle>
            <Button 
              onClick={() => refetch()} 
              variant="outline" 
              size="sm"
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Actualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nombre, dirección o ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                variant={selectedRegion === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedRegion('all')}
              >
                Todos
              </Button>
              <Button
                variant={selectedRegion === 'norte' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedRegion('norte')}
              >
                Norte
              </Button>
              <Button
                variant={selectedRegion === 'centro' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedRegion('centro')}
              >
                Centro
              </Button>
              <Button
                variant={selectedRegion === 'sur' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedRegion('sur')}
              >
                Sur
              </Button>
            </div>
          </div>

          {/* Mapa visual simulado con lista de ubicaciones */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Lista de terminales */}
            <div className="lg:col-span-1 space-y-3 max-h-[600px] overflow-y-auto">
              {isLoading ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                  <p className="text-sm text-gray-600 mt-2">Cargando terminales...</p>
                </div>
              ) : (
                filteredTerminals.map((terminal: PosTerminal) => {
                  const distance = userLocation ? 
                    calculateDistance(
                      userLocation.lat, 
                      userLocation.lng, 
                      parseFloat(terminal.latitude), 
                      parseFloat(terminal.longitude)
                    ).toFixed(1) : null;

                  return (
                    <Card 
                      key={terminal.id}
                      className={`cursor-pointer transition-all ${
                        selectedTerminal?.id === terminal.id ? 'ring-2 ring-blue-500' : ''
                      }`}
                      onClick={() => setSelectedTerminal(terminal)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-sm">{terminal.name}</h4>
                            <p className="text-xs text-gray-600">{terminal.terminalId}</p>
                          </div>
                          {terminal.status === 'online' ? (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              En línea
                            </Badge>
                          ) : terminal.status === 'busy' ? (
                            <Badge className="bg-yellow-100 text-yellow-800">
                              <Clock className="h-3 w-3 mr-1" />
                              Ocupado
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Offline
                            </Badge>
                          )}
                        </div>
                        
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-1 text-gray-600">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{terminal.address}</span>
                          </div>
                          
                          {distance && (
                            <div className="flex items-center gap-1 text-blue-600">
                              <Navigation className="h-3 w-3" />
                              <span>{distance} km de ti</span>
                            </div>
                          )}
                          
                          {terminal.documentsToday && (
                            <div className="flex items-center gap-1 text-gray-600">
                              <Smartphone className="h-3 w-3" />
                              <span>{terminal.documentsToday} docs hoy</span>
                            </div>
                          )}
                        </div>
                        
                        {terminal.lastSeen && (
                          <p className="text-xs text-gray-500 mt-2">
                            Última actividad: {new Date(terminal.lastSeen).toLocaleTimeString('es-CL')}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>

            {/* Área del mapa */}
            <div className="lg:col-span-2">
              <Card className="h-[600px]">
                <CardContent className="p-0 h-full relative">
                  {/* Mapa de Chile simplificado */}
                  <div className="absolute inset-0 bg-gradient-to-b from-blue-50 to-blue-100 rounded-lg overflow-hidden">
                    {/* Representación visual de las regiones */}
                    <div className="absolute top-10 left-1/2 transform -translate-x-1/2">
                      <div className="text-center">
                        <h3 className="font-semibold text-gray-700 mb-4">Distribución Nacional de Terminales</h3>
                        
                        {/* Norte */}
                        <div className="mb-8">
                          <div className="bg-orange-100 rounded-lg p-4 border-2 border-orange-300">
                            <h4 className="font-semibold text-orange-800">Zona Norte</h4>
                            <p className="text-sm text-orange-700">
                              {terminals.filter((t: PosTerminal) => getRegionFromCoords(t.latitude, t.longitude) === 'norte').length} terminales
                            </p>
                          </div>
                        </div>
                        
                        {/* Centro */}
                        <div className="mb-8">
                          <div className="bg-blue-100 rounded-lg p-4 border-2 border-blue-300">
                            <h4 className="font-semibold text-blue-800">Zona Centro</h4>
                            <p className="text-sm text-blue-700">
                              {terminals.filter((t: PosTerminal) => getRegionFromCoords(t.latitude, t.longitude) === 'centro').length} terminales
                            </p>
                          </div>
                        </div>
                        
                        {/* Sur */}
                        <div>
                          <div className="bg-green-100 rounded-lg p-4 border-2 border-green-300">
                            <h4 className="font-semibold text-green-800">Zona Sur</h4>
                            <p className="text-sm text-green-700">
                              {terminals.filter((t: PosTerminal) => getRegionFromCoords(t.latitude, t.longitude) === 'sur').length} terminales
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Terminal seleccionado */}
                    {selectedTerminal && (
                      <div className="absolute bottom-4 left-4 right-4 bg-white rounded-lg shadow-lg p-4">
                        <h4 className="font-semibold mb-2">{selectedTerminal.name}</h4>
                        <p className="text-sm text-gray-600 mb-2">{selectedTerminal.address}</p>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-gray-600">
                            Lat: {parseFloat(selectedTerminal.latitude).toFixed(4)}
                          </span>
                          <span className="text-gray-600">
                            Lng: {parseFloat(selectedTerminal.longitude).toFixed(4)}
                          </span>
                        </div>
                        <div className="mt-3 flex gap-2">
                          <Button size="sm" className="flex-1">
                            <Navigation className="h-4 w-4 mr-2" />
                            Cómo llegar
                          </Button>
                          <Button size="sm" variant="outline">
                            Ver detalles
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Indicadores de terminales en el mapa */}
                  {filteredTerminals.map((terminal: PosTerminal, index: number) => {
                    // Posiciones simuladas basadas en la región
                    const region = getRegionFromCoords(terminal.latitude, terminal.longitude);
                    let top = '50%';
                    let left = '50%';
                    
                    if (region === 'norte') {
                      top = `${20 + (index % 3) * 10}%`;
                      left = `${40 + (index % 4) * 10}%`;
                    } else if (region === 'centro') {
                      top = `${45 + (index % 3) * 10}%`;
                      left = `${40 + (index % 4) * 10}%`;
                    } else if (region === 'sur') {
                      top = `${70 + (index % 3) * 10}%`;
                      left = `${40 + (index % 4) * 10}%`;
                    }
                    
                    return (
                      <div
                        key={terminal.id}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                        style={{ top, left }}
                        onClick={() => setSelectedTerminal(terminal)}
                      >
                        <div className={`
                          w-3 h-3 rounded-full animate-pulse
                          ${terminal.status === 'online' ? 'bg-green-500' : 
                            terminal.status === 'busy' ? 'bg-yellow-500' : 'bg-gray-400'}
                        `} />
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leyenda */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-center gap-8 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <span>Terminal en línea</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" />
              <span>Terminal ocupado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-400 rounded-full" />
              <span>Terminal offline</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
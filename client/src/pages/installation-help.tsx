import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Smartphone, 
  Tablet, 
  Monitor, 
  Download, 
  CheckCircle,
  AlertCircle,
  Wifi,
  Camera,
  MapPin,
  Key,
  Settings,
  HelpCircle,
  ChevronRight,
  QrCode
} from "lucide-react";

export default function InstallationHelp() {
  const [selectedDevice, setSelectedDevice] = useState<'pos' | 'tablet' | 'pc'>('pos');

  const posCredentials = [
    { id: "POS001", key: "pos789", location: "Minimarket San Pedro" },
    { id: "POS002", key: "pos456", location: "Farmacia Central" },
    { id: "POS003", key: "pos123", location: "Abarrotes Don Juan" },
    { id: "POS004", key: "pos999", location: "Supermercado La Esquina" },
    { id: "POS005", key: "pos555", location: "Botillería El Trebol" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Guía de Instalación VecinoXpress
          </h1>
          <p className="text-lg text-gray-600">
            Selecciona tu tipo de dispositivo para ver las instrucciones paso a paso
          </p>
        </div>

        {/* Selector de dispositivo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card 
            className={`cursor-pointer transition-all ${selectedDevice === 'pos' ? 'ring-2 ring-blue-500 shadow-lg' : ''}`}
            onClick={() => setSelectedDevice('pos')}
          >
            <CardContent className="p-6 text-center">
              <Smartphone className="h-12 w-12 mx-auto mb-4 text-blue-600" />
              <h3 className="font-semibold text-lg">Terminal POS Android</h3>
              <p className="text-sm text-gray-600 mt-2">Para puntos de venta</p>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all ${selectedDevice === 'tablet' ? 'ring-2 ring-red-500 shadow-lg' : ''}`}
            onClick={() => setSelectedDevice('tablet')}
          >
            <CardContent className="p-6 text-center">
              <Tablet className="h-12 w-12 mx-auto mb-4 text-red-600" />
              <h3 className="font-semibold text-lg">Tablet Certificador</h3>
              <p className="text-sm text-gray-600 mt-2">Para notarios</p>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all ${selectedDevice === 'pc' ? 'ring-2 ring-green-500 shadow-lg' : ''}`}
            onClick={() => setSelectedDevice('pc')}
          >
            <CardContent className="p-6 text-center">
              <Monitor className="h-12 w-12 mx-auto mb-4 text-green-600" />
              <h3 className="font-semibold text-lg">PC Admin/Supervisor</h3>
              <p className="text-sm text-gray-600 mt-2">Para gestión</p>
            </CardContent>
          </Card>
        </div>

        {/* Contenido según dispositivo */}
        <Card className="shadow-xl">
          <CardContent className="p-0">
            {selectedDevice === 'pos' && (
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Smartphone className="h-8 w-8 text-blue-600" />
                  <h2 className="text-2xl font-bold">Instalación Terminal POS Android</h2>
                </div>

                <Tabs defaultValue="download" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="download">1. Descargar</TabsTrigger>
                    <TabsTrigger value="install">2. Instalar</TabsTrigger>
                    <TabsTrigger value="config">3. Configurar</TabsTrigger>
                    <TabsTrigger value="test">4. Verificar</TabsTrigger>
                  </TabsList>

                  <TabsContent value="download" className="mt-6">
                    <div className="space-y-4">
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Primero debes habilitar "Fuentes desconocidas" en Configuración → Seguridad
                        </AlertDescription>
                      </Alert>

                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h3 className="font-semibold text-lg">VecinoXpress POS</h3>
                              <p className="text-sm text-gray-600">Versión 1.0.0 - 45 MB</p>
                            </div>
                            <Badge className="bg-green-100 text-green-800">Android 7.0+</Badge>
                          </div>

                          <div className="space-y-4">
                            <div className="p-4 bg-gray-50 rounded-lg">
                              <p className="text-sm font-medium mb-2">Opción 1: Descarga directa</p>
                              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                                <Download className="h-4 w-4 mr-2" />
                                Descargar APK
                              </Button>
                            </div>

                            <div className="p-4 bg-gray-50 rounded-lg">
                              <p className="text-sm font-medium mb-2">Opción 2: Escanear QR</p>
                              <div className="flex justify-center">
                                <div className="bg-white p-4 rounded-lg shadow-sm">
                                  <QrCode className="h-32 w-32" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="install" className="mt-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg mb-4">Pasos de instalación:</h3>
                      
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="bg-blue-100 text-blue-600 rounded-full p-1 mt-1">
                            <span className="block w-6 h-6 text-center text-sm font-bold">1</span>
                          </div>
                          <div>
                            <p className="font-medium">Abrir archivo descargado</p>
                            <p className="text-sm text-gray-600">Ve a Notificaciones o Descargas</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="bg-blue-100 text-blue-600 rounded-full p-1 mt-1">
                            <span className="block w-6 h-6 text-center text-sm font-bold">2</span>
                          </div>
                          <div>
                            <p className="font-medium">Tocar "Instalar"</p>
                            <p className="text-sm text-gray-600">Acepta los permisos solicitados</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="bg-blue-100 text-blue-600 rounded-full p-1 mt-1">
                            <span className="block w-6 h-6 text-center text-sm font-bold">3</span>
                          </div>
                          <div>
                            <p className="font-medium">Esperar instalación</p>
                            <p className="text-sm text-gray-600">Toma aproximadamente 30 segundos</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="bg-blue-100 text-blue-600 rounded-full p-1 mt-1">
                            <span className="block w-6 h-6 text-center text-sm font-bold">4</span>
                          </div>
                          <div>
                            <p className="font-medium">Tocar "Abrir"</p>
                            <p className="text-sm text-gray-600">O buscar ícono en pantalla principal</p>
                          </div>
                        </div>
                      </div>

                      <Alert className="mt-6">
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                          La app aparecerá con el ícono azul de VecinoXpress en tu pantalla principal
                        </AlertDescription>
                      </Alert>
                    </div>
                  </TabsContent>

                  <TabsContent value="config" className="mt-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg mb-4">Configuración inicial:</h3>

                      <Alert>
                        <Key className="h-4 w-4" />
                        <AlertDescription>
                          Usa las credenciales asignadas a tu terminal:
                        </AlertDescription>
                      </Alert>

                      <div className="space-y-2">
                        {posCredentials.map(cred => (
                          <Card key={cred.id}>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium">{cred.location}</p>
                                  <div className="flex gap-4 text-sm text-gray-600 mt-1">
                                    <span>ID: <code className="bg-gray-100 px-1 rounded">{cred.id}</code></span>
                                    <span>Clave: <code className="bg-gray-100 px-1 rounded">{cred.key}</code></span>
                                  </div>
                                </div>
                                <ChevronRight className="h-5 w-5 text-gray-400" />
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      <Separator className="my-4" />

                      <div className="space-y-3">
                        <h4 className="font-medium">Permisos requeridos:</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                            <Camera className="h-5 w-5 text-green-600" />
                            <span className="text-sm">Cámara</span>
                          </div>
                          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                            <MapPin className="h-5 w-5 text-green-600" />
                            <span className="text-sm">Ubicación</span>
                          </div>
                          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                            <Wifi className="h-5 w-5 text-green-600" />
                            <span className="text-sm">Internet</span>
                          </div>
                          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                            <Settings className="h-5 w-5 text-green-600" />
                            <span className="text-sm">Almacenamiento</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="test" className="mt-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg mb-4">Verificación final:</h3>

                      <div className="space-y-3">
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                <span>Terminal conectado</span>
                              </div>
                              <Badge className="bg-green-100 text-green-800">OK</Badge>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                <span>GPS funcionando</span>
                              </div>
                              <Badge className="bg-green-100 text-green-800">OK</Badge>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                <span>Cámara lista</span>
                              </div>
                              <Badge className="bg-green-100 text-green-800">OK</Badge>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      <Alert className="mt-6">
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                          ¡Excelente! Tu terminal POS está listo para procesar documentos legales
                        </AlertDescription>
                      </Alert>

                      <Button className="w-full" size="lg">
                        Crear Documento de Prueba
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {selectedDevice === 'tablet' && (
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Tablet className="h-8 w-8 text-red-600" />
                  <h2 className="text-2xl font-bold">Instalación Panel Certificador en Tablet</h2>
                </div>

                <Alert className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    El panel certificador funciona desde el navegador web. No requiere instalación de app.
                  </AlertDescription>
                </Alert>

                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Paso 1: Acceder al panel</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="p-4 bg-gray-50 rounded-lg mb-4">
                        <p className="text-sm text-gray-600 mb-2">URL de acceso:</p>
                        <code className="text-lg font-mono bg-white p-2 rounded block">
                          https://notarypro.cl/certificador
                        </code>
                      </div>
                      <p className="text-sm text-gray-600">
                        Abre Chrome o Safari y navega a esta dirección
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Paso 2: Iniciar sesión</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium">Usuario</label>
                          <code className="block bg-gray-100 p-2 rounded mt-1">CERT001</code>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Contraseña</label>
                          <code className="block bg-gray-100 p-2 rounded mt-1">cert123</code>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Paso 3: Instalar como app (opcional)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Tabs defaultValue="android">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="android">Android</TabsTrigger>
                          <TabsTrigger value="ios">iPad</TabsTrigger>
                        </TabsList>
                        <TabsContent value="android" className="mt-4">
                          <ol className="space-y-2 text-sm">
                            <li>1. Toca el menú ⋮ (3 puntos)</li>
                            <li>2. Selecciona "Agregar a pantalla de inicio"</li>
                            <li>3. Nombra: "NotaryPro Certificador"</li>
                            <li>4. Toca "Agregar"</li>
                          </ol>
                        </TabsContent>
                        <TabsContent value="ios" className="mt-4">
                          <ol className="space-y-2 text-sm">
                            <li>1. Toca el botón Compartir ⬆️</li>
                            <li>2. Selecciona "Añadir a pantalla de inicio"</li>
                            <li>3. Nombra: "NotaryPro Certificador"</li>
                            <li>4. Toca "Añadir"</li>
                          </ol>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Paso 4: Configurar eToken USB</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <Alert>
                          <Key className="h-4 w-4" />
                          <AlertDescription>
                            Conecta el eToken SafeNet 5110 al puerto USB de la tablet
                          </AlertDescription>
                        </Alert>
                        <p className="text-sm">
                          El sistema detectará automáticamente el token. Ingresa el PIN cuando se solicite.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {selectedDevice === 'pc' && (
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Monitor className="h-8 w-8 text-green-600" />
                  <h2 className="text-2xl font-bold">Acceso desde PC - Admin/Supervisor</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Panel Administrador</CardTitle>
                      <CardDescription>Gestión completa del sistema</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="p-3 bg-gray-50 rounded">
                          <p className="text-sm font-medium">URL:</p>
                          <code className="text-sm">https://vecinoxpress.cl/admin</code>
                        </div>
                        <Separator />
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Usuario:</span>
                            <code className="bg-gray-100 px-2 rounded">admin001</code>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Clave:</span>
                            <code className="bg-gray-100 px-2 rounded">123456</code>
                          </div>
                        </div>
                        <Separator />
                        <div className="space-y-2 text-sm">
                          <p className="font-medium">Funciones:</p>
                          <ul className="space-y-1 text-gray-600 ml-4">
                            <li>• Gestión de usuarios</li>
                            <li>• Registro de terminales</li>
                            <li>• Monitoreo en tiempo real</li>
                            <li>• Reportes y estadísticas</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Panel Supervisor</CardTitle>
                      <CardDescription>Control de operaciones y plantillas</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="p-3 bg-gray-50 rounded">
                          <p className="text-sm font-medium">URL:</p>
                          <code className="text-sm">https://vecinoxpress.cl/supervisor</code>
                        </div>
                        <Separator />
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Usuario:</span>
                            <code className="bg-gray-100 px-2 rounded">SUP001</code>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Clave:</span>
                            <code className="bg-gray-100 px-2 rounded">super456</code>
                          </div>
                        </div>
                        <Separator />
                        <div className="space-y-2 text-sm">
                          <p className="font-medium">Funciones:</p>
                          <ul className="space-y-1 text-gray-600 ml-4">
                            <li>• Subir plantillas</li>
                            <li>• Gestionar precios</li>
                            <li>• Supervisar operaciones</li>
                            <li>• Control de calidad</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Alert className="mt-6">
                  <HelpCircle className="h-4 w-4" />
                  <AlertDescription>
                    Usa navegadores modernos: Chrome, Edge, Firefox o Safari actualizados
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer con soporte */}
        <Card className="mt-8">
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="font-semibold text-lg mb-2">¿Necesitas ayuda?</h3>
              <p className="text-gray-600 mb-4">Nuestro equipo de soporte está disponible</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="outline">
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Chat en Vivo
                </Button>
                <Button variant="outline">
                  WhatsApp: +56 9 1234 5678
                </Button>
                <Button variant="outline">
                  soporte@vecinoxpress.cl
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
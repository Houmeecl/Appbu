import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy, CheckCircle, Monitor, Key, MapPin, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const POS_CREDENTIALS = [
  {
    id: "POS001",
    name: "Minimarket San Pedro",
    accessKey: "pos789",
    address: "Av. Providencia 1234, Providencia, Santiago",
    region: "Región Metropolitana",
    status: "Activo"
  },
  {
    id: "POS002", 
    name: "Farmacia Central",
    accessKey: "pos456",
    address: "Los Leones 567, Las Condes, Santiago",
    region: "Región Metropolitana",
    status: "Activo"
  },
  {
    id: "POS003",
    name: "Abarrotes Don Juan", 
    accessKey: "pos123",
    address: "Huérfanos 890, Santiago Centro",
    region: "Región Metropolitana",
    status: "Activo"
  },
  {
    id: "POS004",
    name: "Supermercado La Esquina",
    accessKey: "pos999", 
    address: "Av. Irarrázaval 2345, Ñuñoa, Santiago",
    region: "Región Metropolitana",
    status: "Activo"
  },
  {
    id: "POS005",
    name: "Botillería El Trebol",
    accessKey: "pos555",
    address: "Av. Vicuña Mackenna 1876, San Joaquín, Santiago",
    region: "Región Metropolitana", 
    status: "Activo"
  }
];

export default function PosCredentials() {
  const [copiedField, setCopiedField] = useState<string>("");
  const { toast } = useToast();

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast({
        title: "Copiado al portapapeles",
        description: `${field} copiado exitosamente`,
        duration: 2000,
      });
      setTimeout(() => setCopiedField(""), 2000);
    } catch (err) {
      toast({
        title: "Error",
        description: "No se pudo copiar al portapapeles",
        variant: "destructive",
      });
    }
  };

  const redirectToPosLogin = (terminalId: string, accessKey: string) => {
    // Store credentials temporarily for auto-fill
    sessionStorage.setItem('pos_terminal_id', terminalId);
    sessionStorage.setItem('pos_access_key', accessKey);
    
    // Redirect to POS login
    window.location.href = '/pos-interface';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Credenciales de Terminales POS
          </h1>
          <p className="text-gray-600">
            Sistema VecinoXpress - Acceso a Terminales Punto de Venta
          </p>
        </div>

        {/* Info Alert */}
        <Alert className="mb-6 border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Instrucciones:</strong> Utilice el Terminal ID y Access Key para acceder a cada terminal POS. 
            Las credenciales son únicas para cada punto de venta y están encriptadas en el sistema.
          </AlertDescription>
        </Alert>

        {/* Credentials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {POS_CREDENTIALS.map((terminal) => (
            <Card key={terminal.id} className="border-2 border-gray-200 hover:border-blue-300 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    {terminal.name}
                  </CardTitle>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    {terminal.status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Terminal ID */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-sm text-gray-700">Terminal ID</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                    <code className="flex-1 text-sm font-mono text-gray-900">
                      {terminal.id}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(terminal.id, `Terminal ID ${terminal.id}`)}
                      className="h-8 w-8 p-0"
                    >
                      {copiedField === `Terminal ID ${terminal.id}` ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4 text-gray-500" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Access Key */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Key className="h-4 w-4 text-purple-600" />
                    <span className="font-medium text-sm text-gray-700">Access Key</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                    <code className="flex-1 text-sm font-mono text-gray-900">
                      {terminal.accessKey}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(terminal.accessKey, `Access Key ${terminal.id}`)}
                      className="h-8 w-8 p-0"
                    >
                      {copiedField === `Access Key ${terminal.id}` ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4 text-gray-500" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-red-600" />
                    <span className="font-medium text-sm text-gray-700">Ubicación</span>
                  </div>
                  <p className="text-sm text-gray-600">{terminal.address}</p>
                  <Badge variant="secondary" className="text-xs">
                    {terminal.region}
                  </Badge>
                </div>

                {/* Quick Access Button */}
                <div className="pt-2">
                  <Button 
                    onClick={() => redirectToPosLogin(terminal.id, terminal.accessKey)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Acceder a Terminal
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer Instructions */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg border">
          <h3 className="font-semibold text-gray-900 mb-2">Notas Importantes:</h3>
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
            <li>Cada terminal tiene credenciales únicas e intransferibles</li>
            <li>Los tokens JWT expiran automáticamente después de 24 horas</li>
            <li>Todos los accesos quedan registrados en logs de auditoría</li>
            <li>Para soporte técnico contactar al administrador del sistema</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Lock, User, Key, AlertTriangle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

type AuthLoginProps = {
  panelType: 'admin' | 'certificador' | 'supervisor' | 'pos';
  onLogin: (userData: any) => void;
  title?: string;
  description?: string;
};

const PANEL_CONFIG = {
  admin: {
    title: "Panel Administrativo VecinoXpress",
    description: "Acceso para administradores del sistema",
    icon: Shield,
    color: "bg-red-600",
    fields: {
      username: "Usuario Administrador",
      password: "Contraseña"
    }
  },
  certificador: {
    title: "Panel Certificador NotaryPro",
    description: "Acceso para certificadores legales",
    icon: User,
    color: "bg-blue-600",
    fields: {
      username: "ID Certificador",
      password: "Clave de Acceso"
    }
  },
  supervisor: {
    title: "Panel Supervisor Regional",
    description: "Acceso para supervisores de zona",
    icon: Key,
    color: "bg-green-600",
    fields: {
      username: "ID Supervisor",
      password: "Clave Regional"
    }
  },
  pos: {
    title: "Terminal POS VecinoXpress",
    description: "Acceso para terminales punto de venta",
    icon: Lock,
    color: "bg-purple-600",
    fields: {
      username: "Terminal ID",
      password: "Access Key"
    }
  }
};

export function AuthLogin({ panelType, onLogin, title, description }: AuthLoginProps) {
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const config = PANEL_CONFIG[panelType];
  const IconComponent = config.icon;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const endpoint = panelType === 'pos' ? '/api/pos/login' : '/api/auth/login';
      const payload = panelType === 'pos' 
        ? {
            terminalId: credentials.username,
            accessKey: credentials.password
          }
        : {
            username: credentials.username,
            password: credentials.password,
            panelType
          };
      
      const response = await apiRequest('POST', endpoint, payload);

      const userData = await response.json();
      localStorage.setItem(`${panelType}_token`, userData.token);
      localStorage.setItem(`${panelType}_user`, JSON.stringify(userData.user));
      onLogin(userData);
    } catch (err: any) {
      console.error('Error de autenticación:', err);
      setError(err.message || 'Error de conexión. Verifique su red.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className={`mx-auto w-16 h-16 ${config.color} rounded-full flex items-center justify-center`}>
            <IconComponent className="w-8 h-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              {title || config.title}
            </CardTitle>
            <p className="text-gray-600 mt-2">
              {description || config.description}
            </p>
          </div>
          <Badge variant="outline" className="mx-auto">
            {panelType.toUpperCase()} Access
          </Badge>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">{config.fields.username}</Label>
              <Input
                id="username"
                type="text"
                value={credentials.username}
                onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                placeholder={`Ingrese su ${config.fields.username.toLowerCase()}`}
                required
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{config.fields.password}</Label>
              <Input
                id="password"
                type="password"
                value={credentials.password}
                onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                placeholder={`Ingrese su ${config.fields.password.toLowerCase()}`}
                required
                className="w-full"
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className={`w-full ${config.color} hover:opacity-90`}
              disabled={isLoading || !credentials.username || !credentials.password}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Autenticando...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Iniciar Sesión
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="text-xs text-gray-500 space-y-1">
              <p><strong>Seguridad:</strong> Conexión encriptada SSL/TLS</p>
              <p><strong>Acceso:</strong> Autenticación por roles granular</p>
              <p><strong>Auditoría:</strong> Todos los accesos son registrados</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
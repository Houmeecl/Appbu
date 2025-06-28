import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { Loader2, Shield, Terminal } from 'lucide-react';

interface LoginCredentials {
  terminalId: string;
  accessKey: string;
  deviceInfo: {
    imei: string;
    model: string;
    androidVersion: string;
    appVersion: string;
    fingerprint: string;
  };
  locationInfo: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
}

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    terminalId: '',
    accessKey: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [gettingLocation, setGettingLocation] = useState(false);

  const getDeviceInfo = () => {
    return {
      imei: navigator.userAgent.slice(-15) || 'WEB-' + Date.now(),
      model: 'WebApp',
      androidVersion: 'Web',
      appVersion: '1.0.0',
      fingerprint: navigator.userAgent
    };
  };

  const getCurrentLocation = (): Promise<{ latitude: number; longitude: number; accuracy: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocalización no soportada'));
        return;
      }

      setGettingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGettingLocation(false);
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          setGettingLocation(false);
          reject(new Error('Error obteniendo ubicación: ' + error.message));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.terminalId || !formData.accessKey) {
      setError('Por favor ingresa Terminal ID y Clave de Acceso');
      return;
    }

    setIsLoading(true);

    try {
      // Obtener ubicación GPS
      const locationInfo = await getCurrentLocation();

      // Preparar datos de login
      const loginData: LoginCredentials = {
        terminalId: formData.terminalId,
        accessKey: formData.accessKey,
        deviceInfo: getDeviceInfo(),
        locationInfo
      };

      // Realizar login
      const response = await apiRequest('/api/pos/login', {
        method: 'POST',
        body: JSON.stringify(loginData),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.success) {
        // Guardar token en localStorage
        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('terminal_info', JSON.stringify(response.terminalInfo));
        
        // Redirigir al dashboard principal
        setLocation('/dashboard');
      } else {
        setError(response.error || 'Error de autenticación');
      }

    } catch (error: any) {
      console.error('Error en login:', error);
      setError(error.message || 'Error conectando con el servidor');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value.toUpperCase() // Convertir a mayúsculas para consistencia
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-full">
              <Shield className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            VecinoXpress
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Sistema de Documentos Legales Electrónicos
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="terminalId" className="flex items-center gap-2">
                <Terminal className="h-4 w-4" />
                Terminal ID
              </Label>
              <Input
                id="terminalId"
                name="terminalId"
                type="text"
                placeholder="POS-XXXXXXXX-XXXX"
                value={formData.terminalId}
                onChange={handleInputChange}
                className="font-mono"
                maxLength={20}
                required
              />
              <p className="text-xs text-gray-500">
                Ejemplo: POS-12345678-ABCD
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accessKey">
                Clave de Acceso
              </Label>
              <Input
                id="accessKey"
                name="accessKey"
                type="password"
                placeholder="XXXXXXXX"
                value={formData.accessKey}
                onChange={handleInputChange}
                className="font-mono tracking-widest"
                maxLength={8}
                required
              />
              <p className="text-xs text-gray-500">
                Clave de 8 caracteres alfanuméricos
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {gettingLocation && (
              <Alert>
                <AlertDescription className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Obteniendo ubicación GPS...
                </AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || gettingLocation}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Autenticando...
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">
                ¿No tienes credenciales de acceso?
              </p>
              <p className="text-xs text-gray-500">
                Contacta al administrador del sistema para obtener tu Terminal ID y Clave de Acceso
              </p>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">
              Información del Sistema
            </h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Autenticación segura con GPS</li>
              <li>• Tokens con renovación automática</li>
              <li>• Compatible con terminales POS</li>
              <li>• Cumplimiento normativo chileno</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
}

interface TerminalInfo {
  id: string;
  businessName: string;
  permissions: string[];
  documentTypes: any[];
  pricingConfig: any;
  tuuConfig?: any;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [, setLocation] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [terminalInfo, setTerminalInfo] = useState<TerminalInfo | null>(null);

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    const token = localStorage.getItem('auth_token');
    const storedTerminalInfo = localStorage.getItem('terminal_info');

    if (!token) {
      setIsAuthenticated(false);
      setLocation('/login');
      return;
    }

    try {
      // Validar token con el servidor
      const response = await apiRequest('/api/pos/validate-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token })
      });

      if (response.isValid) {
        setIsAuthenticated(true);
        
        if (storedTerminalInfo) {
          setTerminalInfo(JSON.parse(storedTerminalInfo));
        }
      } else {
        // Token inválido, intentar renovar
        await renewToken(token);
      }
    } catch (error) {
      console.error('Error validating token:', error);
      setIsAuthenticated(false);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('terminal_info');
      setLocation('/login');
    }
  };

  const renewToken = async (currentToken: string) => {
    try {
      const response = await apiRequest('/api/pos/renew-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ currentToken })
      });

      if (response.success) {
        localStorage.setItem('auth_token', response.newToken);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('terminal_info');
        setLocation('/login');
      }
    } catch (error) {
      console.error('Error renewing token:', error);
      setIsAuthenticated(false);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('terminal_info');
      setLocation('/login');
    }
  };

  // Mostrar loading mientras verifica autenticación
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated) {
    return null;
  }

  // Proveer contexto de autenticación a los componentes hijos
  return (
    <AuthContext.Provider value={{ terminalInfo, renewToken, logout }}>
      {children}
    </AuthContext.Provider>
  );

  function logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('terminal_info');
    setIsAuthenticated(false);
    setTerminalInfo(null);
    setLocation('/login');
  }
}

// Contexto de autenticación
import { createContext, useContext } from 'react';

interface AuthContextType {
  terminalInfo: TerminalInfo | null;
  renewToken: (token: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthGuard');
  }
  return context;
}
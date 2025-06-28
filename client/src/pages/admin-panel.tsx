import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AuthLogin } from "@/components/auth-login";
import { 
  Users, 
  Monitor, 
  MapPin, 
  FileText, 
  Plus, 
  Eye, 
  Edit, 
  Trash2,
  Shield,
  Key,
  Activity,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

type User = {
  id: number;
  username: string;
  name: string;
  role: string;
  createdAt: string;
};

type PosTerminal = {
  id: number;
  name: string;
  location: string;
  address: string;
  coordinates: string;
  accessKey: string;
  isActive: boolean;
  lastActivity: string;
  documentsCount: number;
};

type MonitoringData = {
  activeTerminals: number;
  totalDocuments: number;
  pendingDocuments: number;
  activeUsers: number;
  systemAlerts: any[];
};

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("users");
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [isCreatePosOpen, setIsCreatePosOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    const user = localStorage.getItem('admin_user');
    if (token && user) {
      setIsAuthenticated(true);
      setCurrentUser(JSON.parse(user));
    }
  }, []);

  // Fetch users - always call hooks
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    enabled: isAuthenticated && activeTab === "users"
  });

  // Fetch POS terminals - always call hooks
  const { data: posTerminals, isLoading: posLoading } = useQuery({
    queryKey: ["/api/admin/pos-terminals"],
    enabled: isAuthenticated && activeTab === "pos"
  });

  // Fetch monitoring data - always call hooks
  const { data: monitoring, isLoading: monitoringLoading } = useQuery({
    queryKey: ["/api/admin/monitoring"],
    enabled: isAuthenticated && activeTab === "monitoring",
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });
      if (!response.ok) throw new Error("Failed to create user");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setIsCreateUserOpen(false);
      toast({
        title: "Usuario creado",
        description: "El usuario ha sido creado exitosamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al crear usuario",
        variant: "destructive",
      });
    }
  });

  // Create POS terminal mutation
  const createPosMutation = useMutation({
    mutationFn: async (posData: any) => {
      const response = await fetch("/api/admin/pos-terminals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(posData),
      });
      if (!response.ok) throw new Error("Failed to create POS terminal");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pos-terminals"] });
      setIsCreatePosOpen(false);
      toast({
        title: "Terminal POS creado",
        description: "El terminal POS ha sido registrado exitosamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al crear terminal POS",
        variant: "destructive",
      });
    }
  });

  const handleLogin = (userData: any) => {
    setIsAuthenticated(true);
    setCurrentUser(userData.user);
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  if (!isAuthenticated) {
    return <AuthLogin panelType="admin" onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Shield className="h-8 w-8 text-red-600" />
            Panel de Administración
          </h1>
          <p className="text-gray-600 mt-2">
            Gestión de usuarios, terminales POS y monitoreo del sistema
          </p>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Usuarios
            </TabsTrigger>
            <TabsTrigger value="pos" className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              Terminales POS
            </TabsTrigger>
            <TabsTrigger value="monitoring" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Monitoreo
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documentos
            </TabsTrigger>
          </TabsList>

          {/* Users Management Tab */}
          <TabsContent value="users">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">Gestión de Usuarios</h2>
                <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Crear Usuario
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Crear Nuevo Usuario</DialogTitle>
                    </DialogHeader>
                    <CreateUserForm 
                      onSubmit={(data) => createUserMutation.mutate(data)}
                      isLoading={createUserMutation.isPending}
                    />
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid gap-4">
                {usersLoading ? (
                  <div className="text-center py-8">Cargando usuarios...</div>
                ) : (
                  Array.isArray(users) ? users.map((user: User) => (
                    <UserCard key={user.id} user={user} />
                  )) : <div className="text-center py-8">No hay usuarios</div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* POS Terminals Tab */}
          <TabsContent value="pos">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">Terminales POS</h2>
                <Dialog open={isCreatePosOpen} onOpenChange={setIsCreatePosOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-green-600 hover:bg-green-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Registrar Terminal
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Registrar Nuevo Terminal POS</DialogTitle>
                    </DialogHeader>
                    <CreatePosForm 
                      onSubmit={(data) => createPosMutation.mutate(data)}
                      isLoading={createPosMutation.isPending}
                    />
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid gap-4">
                {posLoading ? (
                  <div className="text-center py-8">Cargando terminales...</div>
                ) : (
                  Array.isArray(posTerminals) ? posTerminals.map((terminal: PosTerminal) => (
                    <PosTerminalCard key={terminal.id} terminal={terminal} />
                  )) : <div className="text-center py-8">No hay terminales registrados</div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Monitoring Tab */}
          <TabsContent value="monitoring">
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold">Monitoreo del Sistema</h2>
              
              {monitoringLoading ? (
                <div className="text-center py-8">Cargando datos de monitoreo...</div>
              ) : (
                <MonitoringDashboard data={monitoring as MonitoringData} />
              )}
            </div>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents">
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold">Gestión de Documentos</h2>
              <DocumentsOverview />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// User Card Component
function UserCard({ user }: { user: User }) {
  const getRoleBadge = (role: string) => {
    const colors = {
      admin: "bg-red-100 text-red-800",
      certificador: "bg-blue-100 text-blue-800",
      operador: "bg-green-100 text-green-800"
    };
    return colors[role as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-lg">{user.name}</h3>
              <Badge className={getRoleBadge(user.role)}>
                {user.role}
              </Badge>
            </div>
            <p className="text-gray-600">@{user.username}</p>
            <p className="text-sm text-gray-500">
              Creado: {new Date(user.createdAt).toLocaleDateString('es-CL')}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// POS Terminal Card Component
function PosTerminalCard({ terminal }: { terminal: PosTerminal }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-lg">{terminal.name}</h3>
              <Badge className={terminal.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                {terminal.isActive ? "Activo" : "Inactivo"}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="h-4 w-4" />
              {terminal.address}
            </div>
            <p className="text-sm text-gray-500">
              Coordenadas: {terminal.coordinates}
            </p>
            <p className="text-sm text-gray-500">
              Documentos procesados: {terminal.documentsCount}
            </p>
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4 text-gray-400" />
              <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                {terminal.accessKey}
              </code>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm">
              <MapPin className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Create User Form Component
function CreateUserForm({ onSubmit, isLoading }: { onSubmit: (data: any) => void; isLoading: boolean }) {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    name: "",
    role: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Nombre de Usuario</Label>
        <Input
          value={formData.username}
          onChange={(e) => setFormData({...formData, username: e.target.value})}
          required
        />
      </div>
      <div>
        <Label>Contraseña</Label>
        <Input
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({...formData, password: e.target.value})}
          required
        />
      </div>
      <div>
        <Label>Nombre Completo</Label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          required
        />
      </div>
      <div>
        <Label>Rol</Label>
        <Select onValueChange={(value) => setFormData({...formData, role: value})}>
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar rol" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Administrador</SelectItem>
            <SelectItem value="certificador">Certificador</SelectItem>
            <SelectItem value="operador">Operador POS</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? "Creando..." : "Crear Usuario"}
      </Button>
    </form>
  );
}

// Create POS Form Component
function CreatePosForm({ onSubmit, isLoading }: { onSubmit: (data: any) => void; isLoading: boolean }) {
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    address: "",
    coordinates: "",
    accessKey: ""
  });

  const generateAccessKey = () => {
    const key = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setFormData({...formData, accessKey: key.toUpperCase()});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Nombre del Terminal</Label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          placeholder="Ej: Minimarket La Esquina"
          required
        />
      </div>
      <div>
        <Label>Ubicación</Label>
        <Input
          value={formData.location}
          onChange={(e) => setFormData({...formData, location: e.target.value})}
          placeholder="Ej: Las Condes, Santiago"
          required
        />
      </div>
      <div>
        <Label>Dirección Completa</Label>
        <Input
          value={formData.address}
          onChange={(e) => setFormData({...formData, address: e.target.value})}
          placeholder="Ej: Av. Apoquindo 1234, Las Condes"
          required
        />
      </div>
      <div>
        <Label>Coordenadas GPS</Label>
        <Input
          value={formData.coordinates}
          onChange={(e) => setFormData({...formData, coordinates: e.target.value})}
          placeholder="Ej: -33.4175, -70.6061"
          required
        />
      </div>
      <div>
        <div className="flex justify-between items-center">
          <Label>Clave de Acceso</Label>
          <Button type="button" variant="outline" size="sm" onClick={generateAccessKey}>
            Generar Clave
          </Button>
        </div>
        <Input
          value={formData.accessKey}
          onChange={(e) => setFormData({...formData, accessKey: e.target.value})}
          placeholder="Clave única para el terminal"
          required
        />
      </div>
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? "Registrando..." : "Registrar Terminal"}
      </Button>
    </form>
  );
}

// Monitoring Dashboard Component
function MonitoringDashboard({ data }: { data: MonitoringData }) {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Terminales Activos</p>
                <p className="text-2xl font-bold text-green-600">{data?.activeTerminals || 0}</p>
              </div>
              <Monitor className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Documentos</p>
                <p className="text-2xl font-bold text-blue-600">{data?.totalDocuments || 0}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pendientes</p>
                <p className="text-2xl font-bold text-orange-600">{data?.pendingDocuments || 0}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Usuarios Activos</p>
                <p className="text-2xl font-bold text-purple-600">{data?.activeUsers || 0}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>Alertas del Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          {data?.systemAlerts?.length > 0 ? (
            <div className="space-y-2">
              {data.systemAlerts.map((alert: any, index: number) => (
                <Alert key={index}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{alert.message}</AlertDescription>
                </Alert>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              No hay alertas activas
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Documents Overview Component
function DocumentsOverview() {
  return (
    <div className="space-y-6">
      <Alert>
        <FileText className="h-4 w-4" />
        <AlertDescription>
          Vista general de documentos procesados en el sistema
        </AlertDescription>
      </Alert>
      {/* Add document management functionality here */}
    </div>
  );
}
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Shield, 
  Bot, 
  FileText, 
  Plus, 
  Eye, 
  Settings, 
  BarChart3,
  LogIn,
  FileEdit,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertCircle,
  User,
  Database,
  Zap,
  Search,
  Target,
  BookOpen
} from "lucide-react";

interface DashboardUser {
  id: string;
  name: string;
  role: string;
  credentials: {
    dashboardId: string;
    accessKey: string;
  };
}

interface DocumentTemplate {
  id: number;
  name: string;
  description: string;
  template: string;
  variables: string[];
  category: string;
}

interface AIDocumentRequest {
  clientName: string;
  clientRut: string;
  documentType: string;
  additionalInfo: string;
  templateId?: number;
}

interface GeneratedDocument {
  id: string;
  content: string;
  template: string;
  variables: Record<string, string>;
  status: 'draft' | 'ready' | 'signed';
  createdAt: string;
}

interface CustomTemplate {
  id: string;
  name: string;
  description: string;
  originalTemplate: string;
  posAdaptedTemplate: string;
  variables: string[];
  category: string;
  createdBy: string;
  status: 'pending_ai' | 'ai_adapted' | 'pending_pricing' | 'priced' | 'active';
  price?: number;
  createdAt: string;
  adaptedAt?: string;
  pricedAt?: string;
}

// Simulated dashboard users
const DASHBOARD_USERS: DashboardUser[] = [
  {
    id: "DASH001",
    name: "Administrator Principal",
    role: "admin",
    credentials: { dashboardId: "DASH001", accessKey: "admin2024" }
  },
  {
    id: "DASH002", 
    name: "Supervisor Operativo",
    role: "supervisor",
    credentials: { dashboardId: "DASH002", accessKey: "super456" }
  },
  {
    id: "DASH003",
    name: "Analista de Documentos", 
    role: "analyst",
    credentials: { dashboardId: "DASH003", accessKey: "analyst789" }
  }
];

// Document templates
const DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  {
    id: 1,
    name: "Declaración Jurada Simple",
    description: "Declaración jurada para trámites generales",
    template: `DECLARACIÓN JURADA SIMPLE

Yo, {{clientName}}, cédula de identidad {{clientRut}}, declaro bajo juramento que {{declaration}}.

Esta declaración la efectúo para los fines que estime conveniente el interesado.

Lugar y fecha: {{place}}, {{date}}

Firma: _____________________
{{clientName}}
C.I. {{clientRut}}`,
    variables: ["clientName", "clientRut", "declaration", "place", "date"],
    category: "General"
  },
  {
    id: 2,
    name: "Poder Simple",
    description: "Poder para representación en trámites",
    template: `PODER SIMPLE

Yo, {{clientName}}, cédula de identidad {{clientRut}}, domiciliado en {{address}}, por el presente otorgo poder especial a {{representative}}, C.I. {{representativeRut}}, para que en mi nombre y representación pueda {{powers}}.

Este poder tendrá vigencia hasta {{expiryDate}}.

Lugar y fecha: {{place}}, {{date}}

Otorgante: _____________________     Apoderado: _____________________
{{clientName}}                       {{representative}}
C.I. {{clientRut}}                   C.I. {{representativeRut}}`,
    variables: ["clientName", "clientRut", "address", "representative", "representativeRut", "powers", "expiryDate", "place", "date"],
    category: "Legal"
  },
  {
    id: 3,
    name: "Recibo de Dinero",
    description: "Comprobante de pago recibido",
    template: `RECIBO DE DINERO

Recibí de {{payer}}, C.I. {{payerRut}}, la suma de {{amount}} ({{amountWords}}), correspondiente a {{concept}}.

Lugar y fecha: {{place}}, {{date}}

Recibí conforme: _____________________
{{clientName}}
C.I. {{clientRut}}`,
    variables: ["payer", "payerRut", "amount", "amountWords", "concept", "place", "date", "clientName", "clientRut"],
    category: "Financiero"
  }
];

export default function Dashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<DashboardUser | null>(null);
  const [loginForm, setLoginForm] = useState({ dashboardId: "", accessKey: "" });
  const [activeTab, setActiveTab] = useState("overview");
  const [aiForm, setAiForm] = useState<AIDocumentRequest>({
    clientName: "",
    clientRut: "",
    documentType: "",
    additionalInfo: "",
    templateId: undefined
  });
  const [generatedDocuments, setGeneratedDocuments] = useState<GeneratedDocument[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>([]);
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    description: "",
    template: "",
    category: "",
    variables: ""
  });
  const [isAddingTemplate, setIsAddingTemplate] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats"],
    enabled: isAuthenticated
  });

  // Fetch documents
  const { data: documents = [], isLoading: documentsLoading } = useQuery({
    queryKey: ["/api/documents"],
    enabled: isAuthenticated
  });

  // Authentication
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = DASHBOARD_USERS.find(u => 
      u.credentials.dashboardId === loginForm.dashboardId && 
      u.credentials.accessKey === loginForm.accessKey
    );
    
    if (user) {
      setCurrentUser(user);
      setIsAuthenticated(true);
      toast({
        title: "Acceso autorizado",
        description: `Bienvenido, ${user.name}`,
      });
    } else {
      toast({
        title: "Error de autenticación",
        description: "ID de Dashboard o clave de acceso incorrectos",
        variant: "destructive",
      });
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setLoginForm({ dashboardId: "", accessKey: "" });
    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión exitosamente",
    });
  };

  // AI Template Search
  const searchTemplatesWithAI = async () => {
    if (!aiForm.documentType) {
      toast({
        title: "Búsqueda incompleta",
        description: "Describe qué tipo de documento necesitas",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      // Simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 1500));

      // AI-powered template search logic
      const query = aiForm.documentType.toLowerCase();
      const purpose = aiForm.additionalInfo.toLowerCase();
      
      // Score templates based on relevance
      const scoredTemplates = DOCUMENT_TEMPLATES.map(template => {
        let score = 0;
        const name = template.name.toLowerCase();
        const description = template.description.toLowerCase();
        const category = template.category.toLowerCase();
        
        // Direct name matches
        if (name.includes('declaración') && query.includes('declaración')) score += 10;
        if (name.includes('poder') && (query.includes('poder') || query.includes('representar'))) score += 10;
        if (name.includes('recibo') && (query.includes('recibo') || query.includes('pago'))) score += 10;
        
        // Purpose-based scoring
        if (purpose.includes('vender') && name.includes('poder')) score += 8;
        if (purpose.includes('trámite') && name.includes('declaración')) score += 8;
        if (purpose.includes('dinero') && name.includes('recibo')) score += 8;
        if (purpose.includes('ingresos') && name.includes('declaración')) score += 7;
        
        // Keyword matching
        if (query.includes('simple') && name.includes('simple')) score += 5;
        if (query.includes('legal') && category.includes('legal')) score += 5;
        if (query.includes('financiero') && category.includes('financiero')) score += 5;
        
        // Generic matches
        if (description.includes(query.split(' ')[0])) score += 3;
        
        return { ...template, score, aiRecommendation: generateAIRecommendation(template, query, purpose) };
      }).filter(t => t.score > 0).sort((a, b) => b.score - a.score);

      // Generate AI search result
      const searchResult: GeneratedDocument = {
        id: `SEARCH-${Date.now()}`,
        content: generateSearchSummary(scoredTemplates, query, purpose),
        template: "Resultados de Búsqueda IA",
        variables: {
          query: aiForm.documentType,
          purpose: aiForm.additionalInfo,
          resultsCount: scoredTemplates.length.toString(),
          timestamp: new Date().toLocaleString('es-CL')
        },
        status: 'ready',
        createdAt: new Date().toISOString()
      };

      setGeneratedDocuments(prev => [searchResult, ...prev]);
      
      toast({
        title: "Búsqueda completada",
        description: `Encontré ${scoredTemplates.length} plantilla(s) relevante(s)`,
      });

      // Reset form
      setAiForm({
        clientName: "",
        clientRut: "",
        documentType: "",
        additionalInfo: "",
        templateId: undefined
      });

    } catch (error) {
      toast({
        title: "Error en búsqueda",
        description: "No se pudo completar la búsqueda",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateAIRecommendation = (template: DocumentTemplate, query: string, purpose: string): string => {
    if (template.name.includes("Declaración")) {
      return "Ideal para declarar información personal o profesional ante autoridades. Perfecta para trámites que requieren declaración bajo juramento.";
    } else if (template.name.includes("Poder")) {
      return "Recomendada cuando necesitas autorizar a otra persona para actuar en tu nombre. Útil para ventas, trámites bancarios o gestiones legales.";
    } else if (template.name.includes("Recibo")) {
      return "Excelente para formalizar pagos y crear comprobantes. Garantiza respaldo legal en transacciones comerciales.";
    }
    return "Plantilla versátil que puede adaptarse a diversos propósitos legales.";
  };

  // Add Custom Template (Supervisor only)
  const addCustomTemplate = async () => {
    if (!newTemplate.name || !newTemplate.template) {
      toast({
        title: "Campos requeridos",
        description: "Nombre y template son obligatorios",
        variant: "destructive",
      });
      return;
    }

    setIsAddingTemplate(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      const template: CustomTemplate = {
        id: `CUSTOM-${Date.now()}`,
        name: newTemplate.name,
        description: newTemplate.description,
        originalTemplate: newTemplate.template,
        posAdaptedTemplate: "", // Will be filled by AI
        variables: newTemplate.variables.split(',').map(v => v.trim()).filter(v => v),
        category: newTemplate.category || "Personalizado",
        createdBy: currentUser?.name || "Usuario",
        status: 'pending_ai',
        createdAt: new Date().toISOString()
      };

      setCustomTemplates(prev => [template, ...prev]);
      
      toast({
        title: "Template agregado",
        description: "El template será procesado por IA automáticamente",
      });

      // Reset form
      setNewTemplate({
        name: "",
        description: "",
        template: "",
        category: "",
        variables: ""
      });

      // Auto-trigger AI adaptation
      setTimeout(() => adaptTemplateWithAI(template.id), 2000);

    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo agregar el template",
        variant: "destructive",
      });
    } finally {
      setIsAddingTemplate(false);
    }
  };

  // AI Template Adaptation (Automatic)
  const adaptTemplateWithAI = async (templateId: string) => {
    setCustomTemplates(prev => prev.map(t => 
      t.id === templateId ? { ...t, status: 'ai_adapted' as const } : t
    ));

    try {
      await new Promise(resolve => setTimeout(resolve, 3000));

      setCustomTemplates(prev => prev.map(t => {
        if (t.id === templateId) {
          // AI adapts template for POS interface
          const posAdapted = `${t.originalTemplate}

=== ADAPTACIÓN POS ===
Versión optimizada para terminal:
- Campos simplificados para pantalla táctil
- Validación RUT automática
- GPS y timestamp integrados
- Interfaz amigable para operador

Variables POS: ${t.variables.join(', ')}, fecha, lugar, gps_coords, operador_pos`;

          return {
            ...t,
            posAdaptedTemplate: posAdapted,
            adaptedAt: new Date().toISOString(),
            status: 'pending_pricing' as const
          };
        }
        return t;
      }));

      toast({
        title: "IA completó adaptación",
        description: "Template optimizado para terminales POS",
      });

    } catch (error) {
      setCustomTemplates(prev => prev.map(t => 
        t.id === templateId ? { ...t, status: 'pending_ai' as const } : t
      ));
    }
  };

  // Set Price (Admin only)
  const setPriceTemplate = async (templateId: string, price: number) => {
    if (currentUser?.role !== 'admin') {
      toast({
        title: "Sin permisos",
        description: "Solo administradores pueden valorizar templates",
        variant: "destructive",
      });
      return;
    }

    setCustomTemplates(prev => prev.map(t => {
      if (t.id === templateId) {
        return {
          ...t,
          price,
          pricedAt: new Date().toISOString(),
          status: 'priced' as const
        };
      }
      return t;
    }));

    toast({
      title: "Precio asignado",
      description: `Template valorizado en $${price.toLocaleString()}`,
    });
  };

  // Activate Template (Admin only)
  const activateTemplate = async (templateId: string) => {
    if (currentUser?.role !== 'admin') {
      toast({
        title: "Sin permisos",
        description: "Solo administradores pueden activar templates",
        variant: "destructive",
      });
      return;
    }

    setCustomTemplates(prev => prev.map(t => 
      t.id === templateId ? { ...t, status: 'active' as const } : t
    ));

    toast({
      title: "Template activado",
      description: "Ahora disponible en terminales POS",
    });
  };

  const getStatusBadgeTemplate = (status: CustomTemplate['status']) => {
    const statusConfig = {
      'pending_ai': { label: 'Esperando IA', variant: 'secondary' as const, color: 'bg-yellow-100 text-yellow-800' },
      'ai_adapted': { label: 'IA Completada', variant: 'default' as const, color: 'bg-blue-100 text-blue-800' },
      'pending_pricing': { label: 'Pendiente Precio', variant: 'default' as const, color: 'bg-orange-100 text-orange-800' },
      'priced': { label: 'Valorizado', variant: 'default' as const, color: 'bg-purple-100 text-purple-800' },
      'active': { label: 'Activo', variant: 'default' as const, color: 'bg-green-100 text-green-800' }
    };
    
    const config = statusConfig[status];
    
    return (
      <Badge variant={config.variant} className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const generateSearchSummary = (templates: any[], query: string, purpose: string): string => {
    if (templates.length === 0) {
      return `**Búsqueda IA: "${query}"**

No encontré plantillas que coincidan exactamente con tu consulta. 

**Sugerencias:**
• Prueba términos más generales como "declaración", "poder" o "recibo"
• Describe el propósito específico del documento
• Revisa las plantillas disponibles en la pestaña Templates

**Plantillas disponibles:**
${DOCUMENT_TEMPLATES.map(t => `• ${t.name} (${t.category})`).join('\n')}`;
    }

    const topTemplate = templates[0];
    
    return `**Búsqueda IA: "${query}"**

Encontré ${templates.length} plantilla(s) relevante(s) para tu necesidad.

**📋 Mejor coincidencia:**
**${topTemplate.name}** (Relevancia: ${Math.round((topTemplate.score / 10) * 100)}%)
${topTemplate.aiRecommendation}

**📝 Descripción:** ${topTemplate.description}
**🏷️ Categoría:** ${topTemplate.category}
**📄 Variables requeridas:** ${topTemplate.variables.join(', ')}

${templates.length > 1 ? `
**🔍 Otras opciones encontradas:**
${templates.slice(1, 3).map(t => `• **${t.name}** (${Math.round((t.score / 10) * 100)}%) - ${t.category}`).join('\n')}
` : ''}

**💡 Recomendación IA:**
${purpose ? `Basándome en que necesitas "${purpose}", ` : ''}la plantilla **${topTemplate.name}** es la más adecuada para tu caso.

**✅ Próximos pasos:**
1. Ve a la pestaña "Templates" para ver la plantilla completa
2. Usa el generador de documentos para crear tu documento
3. Personaliza las variables según tus datos específicos`;
  };

  const approveDocument = (docId: string) => {
    setGeneratedDocuments(prev => 
      prev.map(doc => 
        doc.id === docId ? { ...doc, status: 'ready' as const } : doc
      )
    );
    toast({
      title: "Documento aprobado",
      description: "El documento está listo para firma",
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'draft': { label: 'Borrador', variant: 'secondary' as const, icon: FileEdit },
      'ready': { label: 'Listo', variant: 'default' as const, icon: CheckCircle2 },
      'signed': { label: 'Firmado', variant: 'default' as const, icon: CheckCircle2 }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    const IconComponent = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <IconComponent className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Dashboard VecinoXpress
            </CardTitle>
            <p className="text-gray-600">
              Sistema de gestión de documentos con IA
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="dashboardId">ID de Dashboard</Label>
                <Input
                  id="dashboardId"
                  placeholder="Ej: DASH001"
                  value={loginForm.dashboardId}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, dashboardId: e.target.value }))}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accessKey">Clave de Acceso</Label>
                <Input
                  id="accessKey"
                  type="password"
                  placeholder="Ingrese su clave"
                  value={loginForm.accessKey}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, accessKey: e.target.value }))}
                  className="w-full"
                />
              </div>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                <LogIn className="h-4 w-4 mr-2" />
                Acceder al Dashboard
              </Button>
            </form>
            
            {/* Demo Credentials */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-sm text-gray-700 mb-3">Credenciales de Prueba:</h4>
              <div className="space-y-2 text-xs">
                <div><strong>DASH001</strong> / admin2024 (Admin)</div>
                <div><strong>DASH002</strong> / super456 (Supervisor)</div>
                <div><strong>DASH003</strong> / analyst789 (Analista)</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main Dashboard
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Dashboard VecinoXpress</h1>
                <p className="text-sm text-gray-600">Sistema Integral con IA</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">{currentUser?.name}</div>
                <div className="text-xs text-gray-500">{currentUser?.role} • {currentUser?.credentials.dashboardId}</div>
              </div>
              <Button variant="outline" onClick={handleLogout}>
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Resumen
            </TabsTrigger>
            <TabsTrigger value="ai-documents" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              Buscador IA
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="management" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Gestión
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Documentos Totales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    {stats?.documents?.totalDocuments || 0}
                  </div>
                  <div className="text-xs text-gray-500">+12% vs mes anterior</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Documentos IA</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {generatedDocuments.length}
                  </div>
                  <div className="text-xs text-gray-500">Generados con IA</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Pendientes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">
                    {stats?.documents?.pendingDocuments || 0}
                  </div>
                  <div className="text-xs text-gray-500">Esperando proceso</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Templates</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {DOCUMENT_TEMPLATES.length}
                  </div>
                  <div className="text-xs text-gray-500">Activos</div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Documents */}
            <Card>
              <CardHeader>
                <CardTitle>Documentos Recientes</CardTitle>
              </CardHeader>
              <CardContent>
                {documentsLoading ? (
                  <div className="space-y-3">
                    {[1,2,3].map(i => (
                      <div key={i} className="animate-pulse bg-gray-200 h-16 rounded"></div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {documents.slice(0, 5).map((doc: any) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-gray-400" />
                          <div>
                            <div className="font-medium">{doc.documentNumber}</div>
                            <div className="text-sm text-gray-500">{doc.clientName}</div>
                          </div>
                        </div>
                        <Badge variant="secondary">{doc.status}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Documents Tab */}
          <TabsContent value="ai-documents" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* AI Template Search */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-blue-600" />
                    Buscador IA de Plantillas
                    <Sparkles className="h-4 w-4 text-yellow-500" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="searchQuery">¿Qué tipo de documento necesitas?</Label>
                    <Input
                      id="searchQuery"
                      placeholder="Ej: necesito un poder para vender un auto, declaración de ingresos, recibo de pago"
                      value={aiForm.documentType}
                      onChange={(e) => setAiForm(prev => ({ ...prev, documentType: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="purpose">Propósito del documento</Label>
                    <Input
                      id="purpose"
                      placeholder="Para qué vas a usar este documento"
                      value={aiForm.additionalInfo}
                      onChange={(e) => setAiForm(prev => ({ ...prev, additionalInfo: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="clientName">Nombre del Cliente (opcional)</Label>
                    <Input
                      id="clientName"
                      placeholder="Nombre completo"
                      value={aiForm.clientName}
                      onChange={(e) => setAiForm(prev => ({ ...prev, clientName: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="clientRut">RUT del Cliente (opcional)</Label>
                    <Input
                      id="clientRut"
                      placeholder="12.345.678-9"
                      value={aiForm.clientRut}
                      onChange={(e) => setAiForm(prev => ({ ...prev, clientRut: e.target.value }))}
                    />
                  </div>
                  
                  <Button 
                    onClick={searchTemplatesWithAI}
                    disabled={isGenerating}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {isGenerating ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                        Buscando plantillas...
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4 mr-2" />
                        Buscar Plantillas con IA
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Search Results */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5 text-blue-600" />
                    Resultados de Búsqueda ({generatedDocuments.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    <div className="space-y-3">
                      {generatedDocuments.map((doc) => (
                        <div key={doc.id} className="border rounded-lg p-3">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Target className="h-4 w-4 text-blue-600" />
                              <div>
                                <div className="font-medium text-sm">{doc.template}</div>
                                <div className="text-xs text-gray-500">
                                  {new Date(doc.createdAt).toLocaleString('es-CL')}
                                </div>
                              </div>
                            </div>
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              <Search className="h-3 w-3 mr-1" />
                              Encontrado
                            </Badge>
                          </div>
                          
                          <div className="text-xs text-gray-600 mb-3">
                            Consulta: "{doc.variables.query}" • Resultados: {doc.variables.resultsCount}
                          </div>
                          
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="text-xs">
                              <Eye className="h-3 w-3 mr-1" />
                              Ver Resultados
                            </Button>
                            <Button size="sm" variant="outline" className="text-xs">
                              <BookOpen className="h-3 w-3 mr-1" />
                              Ver Templates
                            </Button>
                          </div>
                        </div>
                      ))}
                      
                      {generatedDocuments.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <Search className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                          <p>No hay búsquedas realizadas</p>
                          <p className="text-sm">Use el buscador IA para encontrar plantillas</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Templates de Documentos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {DOCUMENT_TEMPLATES.map((template) => (
                    <Card key={template.id} className="border-2 hover:border-blue-300 transition-colors">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">{template.name}</CardTitle>
                        <Badge variant="secondary" className="w-fit">{template.category}</Badge>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                        <div className="text-xs text-gray-500 mb-3">
                          Variables: {template.variables.join(", ")}
                        </div>
                        <Button size="sm" variant="outline" className="w-full">
                          <Eye className="h-3 w-3 mr-1" />
                          Ver Template
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Management Tab */}
          <TabsContent value="management" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Configuración del Sistema</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">IA Avanzada</div>
                      <div className="text-sm text-gray-500">Generación inteligente de documentos</div>
                    </div>
                    <Badge variant="default" className="bg-green-100 text-green-800">Activo</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Templates Dinámicos</div>
                      <div className="text-sm text-gray-500">Adaptación automática de formatos</div>
                    </div>
                    <Badge variant="default" className="bg-green-100 text-green-800">Activo</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Validación RUT</div>
                      <div className="text-sm text-gray-500">Verificación automática</div>
                    </div>
                    <Badge variant="default" className="bg-green-100 text-green-800">Activo</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Estadísticas de Uso</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Database className="h-8 w-8 text-blue-600" />
                      <div className="flex-1">
                        <div className="font-medium">Documentos Procesados</div>
                        <div className="text-sm text-gray-500">Último mes</div>
                      </div>
                      <div className="text-xl font-bold text-blue-600">1,234</div>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center gap-3">
                      <Bot className="h-8 w-8 text-purple-600" />
                      <div className="flex-1">
                        <div className="font-medium">Generados con IA</div>
                        <div className="text-sm text-gray-500">Eficiencia IA</div>
                      </div>
                      <div className="text-xl font-bold text-purple-600">89%</div>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center gap-3">
                      <User className="h-8 w-8 text-green-600" />
                      <div className="flex-1">
                        <div className="font-medium">Usuarios Activos</div>
                        <div className="text-sm text-gray-500">Dashboard</div>
                      </div>
                      <div className="text-xl font-bold text-green-600">{DASHBOARD_USERS.length}</div>
                    </div>
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
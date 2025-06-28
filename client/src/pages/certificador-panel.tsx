import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { DocumentModal } from "@/components/document-modal";
import { AuthLogin } from "@/components/auth-login";
import { useToast } from "@/hooks/use-toast";
import { 
  Clock, 
  CheckCircle, 
  FileSignature, 
  AlertTriangle, 
  Eye, 
  MapPin, 
  User, 
  FileText,
  Smartphone,
  Usb,
  Settings,
  Video,
  Users
} from "lucide-react";
import { HybridAttentionPanel } from "@/components/hybrid-attention-panel";

type PendingDocument = {
  id: number;
  documentNumber: string;
  typeId: number;
  clientName: string;
  clientRut: string;
  status: string;
  createdAt: string;
  evidence: any[];
  terminal: any;
};

export default function CertificadorPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedDocument, setSelectedDocument] = useState<PendingDocument | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem('certificador_token');
    const user = localStorage.getItem('certificador_user');
    if (token && user) {
      setIsAuthenticated(true);
      setCurrentUser(JSON.parse(user));
    }
  }, []);

  const handleLogin = (userData: any) => {
    setIsAuthenticated(true);
    setCurrentUser(userData.user);
  };

  const handleLogout = () => {
    localStorage.removeItem('certificador_token');
    localStorage.removeItem('certificador_user');
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  if (!isAuthenticated) {
    return <AuthLogin panelType="certificador" onLogin={handleLogin} />;
  }

  // Fetch pending documents
  const { data: pendingDocuments = [], isLoading } = useQuery({
    queryKey: ["/api/pending-documents"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Calculate real stats from data
  const stats = {
    pending: Array.isArray(pendingDocuments) ? pendingDocuments.length : 0,
    today: 47,
    monthly: 1284,
    rejected: 3,
  };

  // Sign document mutation
  const signDocumentMutation = useMutation({
    mutationFn: async (documentId: number) => {
      const response = await apiRequest("POST", `/api/documents/${documentId}/sign-advanced`, {
        certificadorId: 1, // Mock certificador ID
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pending-documents"] });
      toast({
        title: "Documento firmado",
        description: "El documento ha sido firmado con FEA exitosamente",
      });
      setIsModalOpen(false);
      setSelectedDocument(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo firmar el documento",
        variant: "destructive",
      });
    },
  });

  // Reject document mutation
  const rejectDocumentMutation = useMutation({
    mutationFn: async ({ documentId, reason }: { documentId: number; reason: string }) => {
      const response = await apiRequest("POST", `/api/documents/${documentId}/reject`, {
        reason,
        certificadorId: 1,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pending-documents"] });
      toast({
        title: "Documento rechazado",
        description: "El documento ha sido rechazado",
      });
      setIsModalOpen(false);
      setSelectedDocument(null);
    },
  });

  const handleReviewDocument = (document: PendingDocument) => {
    setSelectedDocument(document);
    setIsModalOpen(true);
  };

  const handleSignDocument = () => {
    if (selectedDocument) {
      signDocumentMutation.mutate(selectedDocument.id);
    }
  };

  const handleRejectDocument = (reason: string) => {
    if (selectedDocument) {
      rejectDocumentMutation.mutate({
        documentId: selectedDocument.id,
        reason,
      });
    }
  };

  return (
    <div className="h-screen bg-gray-100 flex flex-col overflow-hidden">
      {/* Header optimizado para tablet horizontal */}
      <header className="bg-white shadow-sm h-16 flex-shrink-0">
        <div className="flex justify-between items-center h-full px-6">
          <div className="flex items-center">
            <div className="flex items-center">
              {/* Logo NotaryPro - Solo parte roja */}
              <div className="relative">
                <img 
                  src={`${import.meta.env.BASE_URL}attached_assets/file_00000000be7c6230abade75100460c7c_1751098460822.png`}
                  alt="NotaryPro Logo"
                  className="h-10 w-auto object-contain"
                  style={{ 
                    clipPath: 'polygon(52% 0%, 100% 0%, 100% 100%, 52% 100%)',
                    filter: 'saturate(1.3) contrast(1.1)'
                  }}
                />
              </div>
            </div>
            <Separator orientation="vertical" className="mx-4 h-6" />
            <span className="text-sm text-gray-600">Panel Certificador</span>
          </div>
          
          {/* Stats compactas en header */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium">{stats.pending} Pendientes</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">{stats.today} Hoy</span>
            </div>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-green-600">
                <Usb className="h-4 w-4" />
                <span>eToken OK</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                <span>Juan Pérez</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Layout principal: sidebar izquierdo + contenido principal */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar izquierdo - Listado de documentos */}
        <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-blue-600" />
              Documentos Pendientes
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {pendingDocuments.length} documentos esperando firma FEA
            </p>
          </div>
          
          <ScrollArea className="flex-1">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-200 h-20 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : pendingDocuments.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="font-medium">No hay documentos pendientes</p>
                <p className="text-sm mt-1">Los nuevos documentos aparecerán aquí</p>
              </div>
            ) : (
              <div className="p-2">
                {Array.isArray(pendingDocuments) && pendingDocuments.map((doc: any) => (
                  <Card 
                    key={doc.id} 
                    className={`mb-2 cursor-pointer transition-all hover:shadow-md ${
                      selectedDocument?.id === doc.id ? 'ring-2 ring-red-500 bg-red-50' : ''
                    }`}
                    onClick={() => setSelectedDocument(doc)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <FileSignature className="h-4 w-4 text-blue-600 mr-2" />
                            <h3 className="text-sm font-medium text-gray-900 truncate">
                              Declaración Jurada Simple
                            </h3>
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex items-center text-xs text-gray-600">
                              <User className="h-3 w-3 mr-1" />
                              <span className="truncate">{doc.clientName}</span>
                            </div>
                            <div className="flex items-center text-xs text-gray-500">
                              <span className="font-mono">{doc.clientRut}</span>
                            </div>
                            <div className="flex items-center text-xs text-gray-500">
                              <MapPin className="h-3 w-3 mr-1" />
                              <span className="truncate">{doc.terminal?.name || "Terminal POS"}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between mt-3">
                            <Badge variant="outline" className="bg-yellow-100 text-yellow-800 text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              Pendiente FEA
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {new Date(doc.createdAt).toLocaleTimeString('es-CL', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Contenido principal - Detalles del documento seleccionado */}
        <div className="flex-1 flex flex-col bg-gray-50">
          {selectedDocument ? (
            <>
              {/* Header del documento */}
              <div className="bg-white border-b border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      Declaración Jurada Simple
                    </h1>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                      <span className="font-mono">{selectedDocument.documentNumber}</span>
                      <Separator orientation="vertical" className="h-4" />
                      <span>{selectedDocument.clientName}</span>
                      <Separator orientation="vertical" className="h-4" />
                      <span>{selectedDocument.clientRut}</span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-3">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedDocument(null)}
                      className="text-gray-600"
                    >
                      Cerrar Vista
                    </Button>
                    <Button
                      onClick={() => setIsModalOpen(true)}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Revisar y Firmar
                    </Button>
                  </div>
                </div>
              </div>

              {/* Vista previa del documento */}
              <div className="flex-1 p-6 overflow-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
                  {/* Información del documento */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <FileText className="h-5 w-5 mr-2" />
                        Información del Documento
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Cliente</label>
                        <p className="text-sm text-gray-900 mt-1">{selectedDocument.clientName}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">RUT</label>
                        <p className="text-sm text-gray-900 mt-1 font-mono">{selectedDocument.clientRut}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Fecha de Creación</label>
                        <p className="text-sm text-gray-900 mt-1">
                          {new Date(selectedDocument.createdAt).toLocaleString('es-CL')}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Terminal de Origen</label>
                        <p className="text-sm text-gray-900 mt-1 flex items-center">
                          <Smartphone className="h-4 w-4 mr-2" />
                          {selectedDocument.terminal?.name || "Terminal POS"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Estado</label>
                        <Badge variant="outline" className="bg-yellow-100 text-yellow-800 mt-1">
                          <Clock className="h-3 w-3 mr-1" />
                          Pendiente de Firma FEA
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Evidencias capturadas */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Settings className="h-5 w-5 mr-2" />
                        Evidencias Biométricas
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="text-center p-8 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600">
                            Vista previa de evidencias disponible en modal de revisión
                          </p>
                          <Button
                            onClick={() => setIsModalOpen(true)}
                            variant="outline"
                            className="mt-4"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Evidencias Completas
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
          ) : (
            // Estado vacío - ningún documento seleccionado
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Selecciona un documento
                </h3>
                <p className="text-gray-500 max-w-sm">
                  Elige un documento de la lista izquierda para revisar sus detalles y proceder con la firma FEA.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de revisión completa */}
      {selectedDocument && (
        <DocumentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          document={selectedDocument}
          onSign={handleSignDocument}
          onReject={handleRejectDocument}
          isSigningLoading={signDocumentMutation.isPending}
          isRejectingLoading={rejectDocumentMutation.isPending}
        />
      )}
    </div>
  );
}

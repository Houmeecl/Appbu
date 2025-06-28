import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Progress } from "../components/ui/progress";
import { RutInput } from "../components/rut-input";
import { CameraCapture } from "../components/camera-capture";
import { SignatureCanvas } from "../components/signature-canvas";
import { DynamicPricing } from "../components/dynamic-pricing";
import { 
  Users, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Camera,
  PenTool,
  MapPin,
  DollarSign,
  Building,
  Shield,
  Printer,
  Send,
  User,
  Calendar,
  Hash,
  Phone,
  Home,
  Eye,
  Download,
  RefreshCw
} from "lucide-react";

interface Client {
  id?: number;
  name: string;
  rut: string;
  phone: string;
  address: string;
  email?: string;
}

interface DocumentRequest {
  client: Client;
  documentTypeId: number;
  documentTypeName: string;
  content?: any;
  evidenceData: {
    photos: string[];
    signature: string;
    gpsLocation: { latitude: number; longitude: number };
    timestamp: string;
  };
  price: number;
  urgency: 'normal' | 'urgent' | 'express';
}

type WorkflowStep = 'client-data' | 'document-selection' | 'evidence-capture' | 'review' | 'signing' | 'completed';

export default function NotaryProOffice() {
  const [activeTab, setActiveTab] = useState("new-document");
  const [currentWorkflow, setCurrentWorkflow] = useState<WorkflowStep>('client-data');
  const [documentRequest, setDocumentRequest] = useState<DocumentRequest | null>(null);
  const [clientQueue, setClientQueue] = useState<any[]>([]);
  const queryClient = useQueryClient();

  // Queries para datos
  const { data: documentTypes, isLoading: typesLoading } = useQuery({
    queryKey: ['/api/document-types']
  });

  const { data: pendingDocuments, isLoading: pendingLoading } = useQuery({
    queryKey: ['/api/pending-documents'],
    refetchInterval: 30000 // Actualizar cada 30 segundos
  });

  const { data: todayStats } = useQuery({
    queryKey: ['/api/stats/today'],
    refetchInterval: 60000 // Actualizar cada minuto
  });

  // Mutación para crear documento
  const createDocumentMutation = useMutation({
    mutationFn: async (docData: any) => {
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(docData)
      });
      if (!response.ok) throw new Error("Failed to create document");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pending-documents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats/today'] });
      setCurrentWorkflow('completed');
    }
  });

  const handleNewClient = () => {
    setDocumentRequest({
      client: {
        name: '',
        rut: '',
        phone: '',
        address: '',
        email: ''
      },
      documentTypeId: 0,
      documentTypeName: '',
      evidenceData: {
        photos: [],
        signature: '',
        gpsLocation: { latitude: 0, longitude: 0 },
        timestamp: new Date().toISOString()
      },
      price: 0,
      urgency: 'normal'
    });
    setCurrentWorkflow('client-data');
    setActiveTab('new-document');
  };

  const nextStep = () => {
    const steps: WorkflowStep[] = ['client-data', 'document-selection', 'evidence-capture', 'review', 'signing', 'completed'];
    const currentIndex = steps.indexOf(currentWorkflow);
    if (currentIndex < steps.length - 1) {
      setCurrentWorkflow(steps[currentIndex + 1]);
    }
  };

  const previousStep = () => {
    const steps: WorkflowStep[] = ['client-data', 'document-selection', 'evidence-capture', 'review', 'signing', 'completed'];
    const currentIndex = steps.indexOf(currentWorkflow);
    if (currentIndex > 0) {
      setCurrentWorkflow(steps[currentIndex - 1]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-red-600 p-6">
      {/* Header NotaryPro */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white p-3 rounded-lg">
              <Building className="h-8 w-8 text-purple-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">NotaryPro</h1>
              <p className="text-purple-100">Sistema Certificador Presencial</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-white">
            <div className="text-right">
              <div className="text-2xl font-bold">{todayStats?.documents?.todayCount || 0}</div>
              <div className="text-sm text-purple-200">Documentos Hoy</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{pendingDocuments?.length || 0}</div>
              <div className="text-sm text-purple-200">Pendientes</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Panel Principal */}
        <div className="lg:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 bg-white/20 backdrop-blur-lg">
              <TabsTrigger value="new-document" className="text-white data-[state=active]:bg-white data-[state=active]:text-purple-600">
                <User className="h-4 w-4 mr-2" />
                Nuevo Cliente
              </TabsTrigger>
              <TabsTrigger value="pending-queue" className="text-white data-[state=active]:bg-white data-[state=active]:text-purple-600">
                <Clock className="h-4 w-4 mr-2" />
                Cola Pendientes
              </TabsTrigger>
              <TabsTrigger value="document-review" className="text-white data-[state=active]:bg-white data-[state=active]:text-purple-600">
                <Shield className="h-4 w-4 mr-2" />
                Revisión
              </TabsTrigger>
              <TabsTrigger value="daily-summary" className="text-white data-[state=active]:bg-white data-[state=active]:text-purple-600">
                <FileText className="h-4 w-4 mr-2" />
                Resumen Día
              </TabsTrigger>
            </TabsList>

            {/* Nuevo Documento */}
            <TabsContent value="new-document">
              <Card className="bg-white/95 backdrop-blur-lg border-white/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Atención Presencial - Nuevo Documento
                  </CardTitle>
                  {documentRequest && (
                    <div className="flex items-center gap-2">
                      <Progress value={((getStepIndex(currentWorkflow) + 1) / 6) * 100} className="flex-1" />
                      <span className="text-sm text-gray-600">
                        Paso {getStepIndex(currentWorkflow) + 1} de 6
                      </span>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  {!documentRequest ? (
                    <div className="text-center py-12">
                      <User className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-xl font-semibold mb-2">¿Nuevo Cliente?</h3>
                      <p className="text-gray-600 mb-6">Inicie el proceso de atención presencial</p>
                      <Button onClick={handleNewClient} size="lg">
                        <User className="h-4 w-4 mr-2" />
                        Atender Cliente
                      </Button>
                    </div>
                  ) : (
                    <DocumentWorkflow 
                      currentStep={currentWorkflow}
                      documentRequest={documentRequest}
                      onUpdateRequest={setDocumentRequest}
                      onNext={nextStep}
                      onPrevious={previousStep}
                      onSubmit={(data) => createDocumentMutation.mutate(data)}
                      isSubmitting={createDocumentMutation.isPending}
                      documentTypes={documentTypes || []}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Cola de Pendientes */}
            <TabsContent value="pending-queue">
              <Card className="bg-white/95 backdrop-blur-lg border-white/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Cola de Documentos Pendientes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <PendingDocumentsQueue 
                    documents={pendingDocuments || []}
                    isLoading={pendingLoading}
                    onRefresh={() => queryClient.invalidateQueries({ queryKey: ['/api/pending-documents'] })}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Revisión de Documentos */}
            <TabsContent value="document-review">
              <Card className="bg-white/95 backdrop-blur-lg border-white/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Centro de Revisión y Firma
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <DocumentReviewCenter />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Resumen Diario */}
            <TabsContent value="daily-summary">
              <Card className="bg-white/95 backdrop-blur-lg border-white/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Resumen del Día
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <DailySummary stats={todayStats} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Panel Lateral */}
        <div className="space-y-6">
          {/* Estado del Sistema */}
          <Card className="bg-white/95 backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-sm">Estado del Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">eToken</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800">Conectado</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Impresora</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800">Lista</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">GPS</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800">Activo</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Cámara</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800">Disponible</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Acciones Rápidas */}
          <Card className="bg-white/95 backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-sm">Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Printer className="h-3 w-3 mr-2" />
                Imprimir Último
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Send className="h-3 w-3 mr-2" />
                Enviar por Email
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Download className="h-3 w-3 mr-2" />
                Exportar PDFs
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <RefreshCw className="h-3 w-3 mr-2" />
                Sincronizar
              </Button>
            </CardContent>
          </Card>

          {/* Próximas Citas */}
          <Card className="bg-white/95 backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-sm">Próximas Citas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  <span>15:30 - María González</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  <span>16:00 - Juan Pérez</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  <span>16:30 - Ana López</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Componentes auxiliares
function getStepIndex(step: WorkflowStep): number {
  const steps: WorkflowStep[] = ['client-data', 'document-selection', 'evidence-capture', 'review', 'signing', 'completed'];
  return steps.indexOf(step);
}

function DocumentWorkflow({ 
  currentStep, 
  documentRequest, 
  onUpdateRequest, 
  onNext, 
  onPrevious, 
  onSubmit,
  isSubmitting,
  documentTypes 
}: {
  currentStep: WorkflowStep;
  documentRequest: DocumentRequest;
  onUpdateRequest: (req: DocumentRequest) => void;
  onNext: () => void;
  onPrevious: () => void;
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
  documentTypes: any[];
}) {
  const canProceed = () => {
    switch (currentStep) {
      case 'client-data':
        return documentRequest.client.name && documentRequest.client.rut && documentRequest.client.phone;
      case 'document-selection':
        return documentRequest.documentTypeId > 0;
      case 'evidence-capture':
        return documentRequest.evidenceData.photos.length > 0 && documentRequest.evidenceData.signature;
      case 'review':
        return true;
      case 'signing':
        return true;
      default:
        return false;
    }
  };

  const stepContent = () => {
    switch (currentStep) {
      case 'client-data':
        return (
          <ClientDataForm 
            client={documentRequest.client}
            onChange={(client) => onUpdateRequest({ ...documentRequest, client })}
          />
        );
      case 'document-selection':
        return (
          <DocumentSelectionForm 
            selectedTypeId={documentRequest.documentTypeId}
            documentTypes={documentTypes}
            onChange={(typeId, typeName) => onUpdateRequest({ 
              ...documentRequest, 
              documentTypeId: typeId, 
              documentTypeName: typeName 
            })}
          />
        );
      case 'evidence-capture':
        return (
          <EvidenceCaptureForm 
            evidenceData={documentRequest.evidenceData}
            onChange={(evidenceData) => onUpdateRequest({ ...documentRequest, evidenceData })}
          />
        );
      case 'review':
        return (
          <DocumentReviewForm 
            documentRequest={documentRequest}
            onChange={onUpdateRequest}
          />
        );
      case 'signing':
        return (
          <SigningProcessForm 
            documentRequest={documentRequest}
            onSubmit={onSubmit}
            isSubmitting={isSubmitting}
          />
        );
      case 'completed':
        return (
          <CompletedForm 
            onNewDocument={() => window.location.reload()}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {stepContent()}
      
      {currentStep !== 'completed' && (
        <div className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={onPrevious}
            disabled={currentStep === 'client-data'}
          >
            Anterior
          </Button>
          <Button 
            onClick={onNext}
            disabled={!canProceed() || currentStep === 'signing'}
          >
            {currentStep === 'review' ? 'Firmar Documento' : 'Siguiente'}
          </Button>
        </div>
      )}
    </div>
  );
}

function ClientDataForm({ client, onChange }: { client: Client; onChange: (client: Client) => void }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Datos del Cliente</h3>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Nombre Completo *</Label>
          <Input
            id="name"
            value={client.name}
            onChange={(e) => onChange({ ...client, name: e.target.value })}
            placeholder="Ingrese nombre completo"
          />
        </div>
        <div>
          <Label htmlFor="rut">RUT *</Label>
          <RutInput
            value={client.rut}
            onChange={(value, isValid) => onChange({ ...client, rut: value })}
            placeholder="XX.XXX.XXX-X"
          />
        </div>
        <div>
          <Label htmlFor="phone">Teléfono *</Label>
          <Input
            id="phone"
            value={client.phone}
            onChange={(e) => onChange({ ...client, phone: e.target.value })}
            placeholder="+569 XXXX XXXX"
          />
        </div>
        <div>
          <Label htmlFor="email">Email (Opcional)</Label>
          <Input
            id="email"
            type="email"
            value={client.email || ''}
            onChange={(e) => onChange({ ...client, email: e.target.value })}
            placeholder="correo@ejemplo.com"
          />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="address">Dirección *</Label>
          <Textarea
            id="address"
            value={client.address}
            onChange={(e) => onChange({ ...client, address: e.target.value })}
            placeholder="Dirección completa"
            rows={2}
          />
        </div>
      </div>
    </div>
  );
}

function DocumentSelectionForm({ 
  selectedTypeId, 
  documentTypes, 
  onChange 
}: { 
  selectedTypeId: number; 
  documentTypes: any[]; 
  onChange: (typeId: number, typeName: string) => void; 
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Selección de Documento</h3>
      <div className="grid gap-4">
        {documentTypes.map((docType) => (
          <Card 
            key={docType.id} 
            className={`cursor-pointer transition-colors ${
              selectedTypeId === docType.id ? 'bg-blue-50 border-blue-500' : 'hover:bg-gray-50'
            }`}
            onClick={() => onChange(docType.id, docType.name)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{docType.name}</h4>
                  <p className="text-sm text-gray-600">{docType.description}</p>
                </div>
                <div className="text-right">
                  <DynamicPricing 
                    documentTypeId={docType.id}
                    documentTypeName={docType.name}
                    showRegionalComparison={false}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function EvidenceCaptureForm({ 
  evidenceData, 
  onChange 
}: { 
  evidenceData: any; 
  onChange: (data: any) => void; 
}) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold mb-4">Captura de Evidencia</h3>
      
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Fotografía del Cliente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CameraCapture
              onCapture={(photoData) => {
                onChange({
                  ...evidenceData,
                  photos: [...evidenceData.photos, photoData]
                });
              }}
              onError={(error) => console.error("Camera error:", error)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <PenTool className="h-4 w-4" />
              Firma del Cliente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SignatureCanvas
              onSignatureComplete={(signatureData) => {
                onChange({
                  ...evidenceData,
                  signature: signatureData
                });
              }}
              onClear={() => {
                onChange({
                  ...evidenceData,
                  signature: ''
                });
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DocumentReviewForm({ 
  documentRequest, 
  onChange 
}: { 
  documentRequest: DocumentRequest; 
  onChange: (req: DocumentRequest) => void; 
}) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold mb-4">Revisión Final</h3>
      
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Datos del Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div><strong>Nombre:</strong> {documentRequest.client.name}</div>
            <div><strong>RUT:</strong> {documentRequest.client.rut}</div>
            <div><strong>Teléfono:</strong> {documentRequest.client.phone}</div>
            <div><strong>Dirección:</strong> {documentRequest.client.address}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Documento Solicitado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div><strong>Tipo:</strong> {documentRequest.documentTypeName}</div>
            <div><strong>Precio:</strong> ${documentRequest.price.toLocaleString()}</div>
            <div><strong>Urgencia:</strong> {documentRequest.urgency}</div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-2">
        <Label htmlFor="urgency">Nivel de Urgencia</Label>
        <Select 
          value={documentRequest.urgency} 
          onValueChange={(urgency: any) => onChange({ ...documentRequest, urgency })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="normal">Normal (24-48 hrs)</SelectItem>
            <SelectItem value="urgent">Urgente (4-8 hrs)</SelectItem>
            <SelectItem value="express">Express (1-2 hrs)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function SigningProcessForm({ 
  documentRequest, 
  onSubmit, 
  isSubmitting 
}: { 
  documentRequest: DocumentRequest; 
  onSubmit: (data: any) => void; 
  isSubmitting: boolean; 
}) {
  return (
    <div className="space-y-6 text-center">
      <div className="space-y-4">
        <Shield className="h-16 w-16 mx-auto text-green-600" />
        <h3 className="text-xl font-semibold">Proceso de Firma Digital</h3>
        <p className="text-gray-600">
          Se iniciará el proceso de firma electrónica avanzada (FEA) con eToken
        </p>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium mb-2">Resumen del Documento</h4>
        <div className="text-sm space-y-1">
          <div>Cliente: {documentRequest.client.name}</div>
          <div>Documento: {documentRequest.documentTypeName}</div>
          <div>Precio: ${documentRequest.price.toLocaleString()}</div>
        </div>
      </div>

      <Button 
        onClick={() => onSubmit(documentRequest)} 
        disabled={isSubmitting}
        size="lg"
        className="w-full"
      >
        {isSubmitting ? (
          <>
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            Procesando Firma...
          </>
        ) : (
          <>
            <Shield className="h-4 w-4 mr-2" />
            Iniciar Firma FEA
          </>
        )}
      </Button>
    </div>
  );
}

function CompletedForm({ onNewDocument }: { onNewDocument: () => void }) {
  return (
    <div className="space-y-6 text-center">
      <CheckCircle className="h-16 w-16 mx-auto text-green-600" />
      <h3 className="text-xl font-semibold text-green-600">¡Documento Completado!</h3>
      <p className="text-gray-600">
        El documento ha sido firmado digitalmente y está listo para entrega
      </p>
      
      <div className="flex gap-4 justify-center">
        <Button variant="outline">
          <Printer className="h-4 w-4 mr-2" />
          Imprimir
        </Button>
        <Button variant="outline">
          <Send className="h-4 w-4 mr-2" />
          Enviar por Email
        </Button>
        <Button onClick={onNewDocument}>
          <User className="h-4 w-4 mr-2" />
          Siguiente Cliente
        </Button>
      </div>
    </div>
  );
}

function PendingDocumentsQueue({ 
  documents, 
  isLoading, 
  onRefresh 
}: { 
  documents: any[]; 
  isLoading: boolean; 
  onRefresh: () => void; 
}) {
  if (isLoading) {
    return (
      <div className="text-center py-8">
        <RefreshCw className="h-8 w-8 mx-auto mb-4 animate-spin" />
        <p>Cargando documentos pendientes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="font-medium">Documentos en Cola ({documents.length})</h4>
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="h-3 w-3 mr-1" />
          Actualizar
        </Button>
      </div>
      
      {documents.length === 0 ? (
        <div className="text-center py-8">
          <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">No hay documentos pendientes</p>
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <Card key={doc.id} className="hover:bg-gray-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-medium">{doc.clientName}</h5>
                    <p className="text-sm text-gray-600">{doc.documentNumber}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline">
                      {doc.status}
                    </Badge>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(doc.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function DocumentReviewCenter() {
  return (
    <div className="space-y-6">
      <div className="text-center py-8">
        <Eye className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold mb-2">Centro de Revisión</h3>
        <p className="text-gray-600">Seleccione un documento de la cola para revisar</p>
      </div>
    </div>
  );
}

function DailySummary({ stats }: { stats: any }) {
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <FileText className="h-8 w-8 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold">{stats?.documents?.todayCount || 0}</div>
            <div className="text-sm text-gray-600">Documentos Procesados</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <div className="text-2xl font-bold">$450K</div>
            <div className="text-sm text-gray-600">Ingresos del Día</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useGeolocation } from "@/hooks/use-geolocation";
import { CameraCapture } from "@/components/camera-capture";
import { SignatureCanvas } from "@/components/signature-canvas";
import { AiDocumentSearch } from "@/components/ai-document-search";
import IdentityVerification from "@/components/identity-verification";
import { useToast } from "@/hooks/use-toast";
import { Bot, FileText, Plus, Shield, DollarSign, TrendingUp, Calendar, BarChart3 } from "lucide-react";

type DocumentType = {
  id: number;
  name: string;
  description: string;
  price: string;
};

type ProcessStep = "selection" | "identity" | "verification" | "signature" | "completed";

export default function POSInterface() {
  const [currentStep, setCurrentStep] = useState<ProcessStep>("selection");
  const [selectedDocument, setSelectedDocument] = useState<DocumentType | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [clientData, setClientData] = useState({
    name: "",
    rut: "",
    phone: "",
    email: "",
  });
  
  const { location, error: locationError } = useGeolocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Commission Panel Component
  const CommissionsPanel = () => {
    // Fetch commission data for this POS terminal
    const { data: commissionData, isLoading: commissionsLoading } = useQuery({
      queryKey: ["/api/pos/commissions"],
    });

    // Fetch recent documents processed by this terminal
    const { data: recentDocuments, isLoading: documentsLoading } = useQuery({
      queryKey: ["/api/pos/recent-documents"],
    });

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-2">💰 Mis Comisiones</h2>
          <p className="text-green-100">Ganas 12% de comisión por cada documento procesado</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Comisiones Hoy</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${commissionsLoading ? "..." : commissionData?.today || "0"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Esta Semana</p>
                  <p className="text-2xl font-bold text-blue-600">
                    ${commissionsLoading ? "..." : commissionData?.thisWeek || "0"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Este Mes</p>
                  <p className="text-2xl font-bold text-purple-600">
                    ${commissionsLoading ? "..." : commissionData?.thisMonth || "0"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Breakdown */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Desglose de Comisiones
              </h3>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Tasa: 12%
              </Badge>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Documentos procesados hoy:</span>
                <span className="font-semibold">
                  {commissionsLoading ? "..." : commissionData?.documentsToday || "0"}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Valor total generado hoy:</span>
                <span className="font-semibold">
                  ${commissionsLoading ? "..." : commissionData?.totalValueToday || "0"}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Tu comisión (12%):</span>
                <span className="font-bold text-green-600">
                  ${commissionsLoading ? "..." : commissionData?.today || "0"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Documents */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documentos Recientes
            </h3>
            
            {documentsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse bg-gray-200 h-16 rounded"></div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {recentDocuments?.slice(0, 5).map((doc: any, index: number) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{doc.documentType || "Documento Legal"}</p>
                      <p className="text-sm text-gray-600">{doc.clientName || "Cliente"}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(doc.createdAt).toLocaleDateString('es-CL')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${doc.price || "5,000"}</p>
                      <p className="text-sm text-green-600">
                        +${Math.round((doc.price || 5000) * 0.12)} comisión
                      </p>
                    </div>
                  </div>
                )) || (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>No hay documentos procesados aún</p>
                    <p className="text-sm">¡Comienza a procesar documentos para ganar comisiones!</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Commission Info */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">💡 Información sobre Comisiones</h3>
            <div className="space-y-2 text-sm text-blue-700">
              <p>• Ganas 12% de comisión por cada documento procesado exitosamente</p>
              <p>• Las comisiones se calculan en tiempo real</p>
              <p>• Los pagos se realizan semanalmente los días viernes</p>
              <p>• Consulta tu estado de cuenta en el panel de administración</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Fetch document types
  const { data: documentTypes = [], isLoading } = useQuery({
    queryKey: ["/api/document-types"],
  });

  // Create document mutation
  const createDocumentMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/documents", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast({
        title: "Documento creado",
        description: "El documento ha sido procesado exitosamente",
      });
      setCurrentStep("completed");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Error al procesar el documento",
        variant: "destructive",
      });
    },
  });

  const handleDocumentSelection = (docType: DocumentType) => {
    setSelectedDocument(docType);
    setCurrentStep("verification");
  };

  const handlePhotoCapture = (photoData: string) => {
    setCapturedPhoto(photoData);
  };

  const handleSignature = (signatureData: string) => {
    setSignature(signatureData);
    setCurrentStep("signature");
  };

  const handleComplete = async () => {
    if (!selectedDocument || !capturedPhoto || !signature) return;

    const documentData = {
      typeId: selectedDocument.id,
      clientName: clientData.name || "Cliente POS",
      clientRut: clientData.rut || "12345678-9",
      clientPhone: clientData.phone,
      clientEmail: clientData.email,
      posTerminalId: 1,
      status: "pending",
      content: {
        selectedDocument,
        clientData,
        location,
        timestamp: new Date().toISOString(),
      },
    };

    createDocumentMutation.mutate(documentData);

    // Add evidence and signature after delay
    setTimeout(async () => {
      if (capturedPhoto && signature) {
        try {
          // Add photo evidence
          await apiRequest("POST", `/api/documents/1/evidence`, {
            type: "photo",
            data: { imageData: capturedPhoto },
          });

          // Add signature evidence
          await apiRequest("POST", `/api/documents/1/evidence`, {
            type: "signature",
            data: { signatureData: signature },
          });

          // Add simple signature
          await apiRequest("POST", `/api/documents/1/sign-simple`, {
            signatureData: signature,
            signerName: clientData.name || "Cliente POS",
            signerRut: clientData.rut || "12345678-9",
          });
        } catch (error) {
          console.error("Error adding evidence:", error);
        }
      }
    }, 1000);
  };

  const resetProcess = () => {
    setCurrentStep("selection");
    setSelectedDocument(null);
    setCapturedPhoto(null);
    setSignature(null);
    setClientData({ name: "", rut: "", phone: "", email: "" });
  };

  const DocumentCreationContent = () => (
    <>
      {/* Step Progress */}
      <div className="p-4 bg-gray-50 border-b mb-4">
        <div className="flex items-center justify-between text-xs">
          <div className={`flex items-center ${currentStep === "selection" ? "text-blue-600" : "text-gray-400"}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              currentStep === "selection" ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-600"
            }`}>
              1
            </div>
            <span className="ml-2">Selección</span>
          </div>
          <div className="flex-1 h-px bg-gray-300 mx-2"></div>
          <div className={`flex items-center ${currentStep === "verification" ? "text-blue-600" : "text-gray-400"}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
              ["verification", "signature", "completed"].includes(currentStep) ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-600"
            }`}>
              2
            </div>
            <span className="ml-2">Verificación</span>
          </div>
          <div className="flex-1 h-px bg-gray-300 mx-2"></div>
          <div className={`flex items-center ${["signature", "completed"].includes(currentStep) ? "text-blue-600" : "text-gray-400"}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
              ["signature", "completed"].includes(currentStep) ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-600"
            }`}>
              3
            </div>
            <span className="ml-2">Firma</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Step 1: Document Selection */}
        {currentStep === "selection" && (
          <>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Seleccione el Documento</h2>
            
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse bg-gray-200 h-20 rounded-lg"></div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {documentTypes.map((docType: DocumentType) => (
                  <Card 
                    key={docType.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-blue-300"
                    onClick={() => handleDocumentSelection(docType)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{docType.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{docType.description}</p>
                        </div>
                        <Badge variant="secondary" className="ml-3">
                          {docType.price}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* Step 2: Verification */}
        {currentStep === "verification" && selectedDocument && (
          <>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Verificación de Identidad</h2>
            
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Documento seleccionado:</strong> {selectedDocument.name}
              </p>
            </div>

            <div className="space-y-4">
              {/* Client Data Form */}
              <div className="grid grid-cols-1 gap-3">
                <input
                  type="text"
                  placeholder="Nombre completo"
                  className="w-full p-3 border rounded-lg"
                  value={clientData.name}
                  onChange={(e) => setClientData(prev => ({ ...prev, name: e.target.value }))}
                />
                <input
                  type="text"
                  placeholder="RUT (12.345.678-9)"
                  className="w-full p-3 border rounded-lg"
                  value={clientData.rut}
                  onChange={(e) => setClientData(prev => ({ ...prev, rut: e.target.value }))}
                />
                <input
                  type="tel"
                  placeholder="Teléfono (opcional)"
                  className="w-full p-3 border rounded-lg"
                  value={clientData.phone}
                  onChange={(e) => setClientData(prev => ({ ...prev, phone: e.target.value }))}
                />
                <div>
                  <input
                    type="email"
                    placeholder="Email para recibir documento firmado"
                    className="w-full p-3 border rounded-lg"
                    value={clientData.email}
                    onChange={(e) => setClientData(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                  <p className="text-xs text-blue-600 mt-1">
                    📧 El documento firmado se enviará automáticamente a este email
                  </p>
                </div>
              </div>

              {/* Camera Capture */}
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Captura de Fotografía</h3>
                <CameraCapture 
                  onCapture={handlePhotoCapture}
                  className="w-full"
                />
                {capturedPhoto && (
                  <div className="mt-2 flex justify-end">
                    <Button 
                      onClick={() => setCurrentStep("signature")}
                      disabled={!clientData.email || !clientData.name || !clientData.rut}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      Continuar
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Step 3: Signature */}
        {currentStep === "signature" && (
          <>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Firma del Cliente</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Firme en el recuadro</h3>
                <SignatureCanvas onSave={handleSignature} />
              </div>

              {signature && (
                <div className="flex justify-end">
                  <Button 
                    onClick={handleComplete}
                    disabled={createDocumentMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {createDocumentMutation.isPending ? "Procesando..." : "Completar Documento"}
                  </Button>
                </div>
              )}
            </div>
          </>
        )}

        {/* Step 4: Completed */}
        {currentStep === "completed" && (
          <>
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">¡Documento Procesado!</h2>
              <p className="text-gray-600 mb-4">
                El documento ha sido enviado para certificación.
              </p>
              {clientData.email && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
                  <p className="text-sm text-blue-800">
                    📧 <strong>Email configurado:</strong> {clientData.email}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    El documento firmado se enviará automáticamente a este email cuando el certificador complete la firma FEA
                  </p>
                </div>
              )}
              <Button 
                onClick={resetProcess}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Nuevo Documento
              </Button>
            </div>
          </>
        )}
      </div>
    </>
  );

  return (
    <div className="max-w-6xl mx-auto bg-white min-h-screen">
      {/* POS Header */}
      <div className="bg-blue-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Logo VecinoXpress - Solo parte azul */}
            <div className="relative">
              <img 
                src={`${import.meta.env.BASE_URL}attached_assets/file_00000000be7c6230abade75100460c7c_1751098460822.png`}
                alt="VecinoXpress Logo"
                className="h-12 w-auto object-contain"
                style={{ 
                  clipPath: 'polygon(0% 0%, 52% 0%, 52% 100%, 0% 100%)',
                  filter: 'brightness(1.2) saturate(1.1)'
                }}
              />
            </div>
            <div>
              <h1 className="text-lg font-bold">POS Terminal</h1>
              <p className="text-blue-200 text-sm">Minimarket San Pedro</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-blue-200">GPS</div>
            {location && (
              <div className="text-sm font-mono">
                {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
              </div>
            )}
            {locationError && (
              <div className="text-sm text-red-200">Sin GPS</div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content with Tabs */}
      <div className="p-4">
        <Tabs defaultValue="documents" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Crear Documento
            </TabsTrigger>
            <TabsTrigger value="ai-search" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              Agente IA
            </TabsTrigger>
            <TabsTrigger value="commissions" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Mis Comisiones
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="documents">
            <div className="max-w-md mx-auto">
              <DocumentCreationContent />
            </div>
          </TabsContent>
          
          <TabsContent value="ai-search">
            <AiDocumentSearch />
          </TabsContent>
          
          <TabsContent value="commissions">
            <CommissionsPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
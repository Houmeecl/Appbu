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
import { useToast } from "@/hooks/use-toast";
import { Bot, FileText, Plus } from "lucide-react";

type DocumentType = {
  id: number;
  name: string;
  description: string;
  price: string;
};

type ProcessStep = "selection" | "verification" | "signature" | "completed";

export default function POSInterface() {
  const [currentStep, setCurrentStep] = useState<ProcessStep>("selection");
  const [selectedDocument, setSelectedDocument] = useState<DocumentType | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [clientData, setClientData] = useState({
    name: "",
    rut: "",
    phone: "",
  });
  
  const { location, error: locationError } = useGeolocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
    setClientData({ name: "", rut: "", phone: "" });
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
                      className="bg-blue-600 hover:bg-blue-700"
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
              <p className="text-gray-600 mb-6">
                El documento ha sido enviado para certificación.
              </p>
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
          <div>
            <h1 className="text-lg font-bold">VecinoXpress POS</h1>
            <p className="text-blue-200 text-sm">Terminal POS - Minimarket San Pedro</p>
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
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Crear Documento
            </TabsTrigger>
            <TabsTrigger value="ai-search" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              Agente IA
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
        </Tabs>
      </div>
    </div>
  );
}
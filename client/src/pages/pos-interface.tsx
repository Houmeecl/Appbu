import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useGeolocation } from "@/hooks/use-geolocation";
import { CameraCapture } from "@/components/camera-capture";
import { SignatureCanvas } from "@/components/signature-canvas";
import { useToast } from "@/hooks/use-toast";

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
        description: "El documento ha sido enviado para firma avanzada",
      });
      setCurrentStep("completed");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo crear el documento",
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
    setCurrentStep("signature");
  };

  const handleSignatureComplete = (signatureData: string) => {
    setSignature(signatureData);
    
    // Create document with all collected data
    if (selectedDocument && location && capturedPhoto) {
      createDocumentMutation.mutate({
        typeId: selectedDocument.id,
        clientName: clientData.name || "Cliente POS",
        clientRut: clientData.rut || "12345678-9",
        clientPhone: clientData.phone,
        posTerminalId: 1, // Mock terminal ID
        content: {
          documentType: selectedDocument.name,
          formData: clientData,
        },
        status: "pending",
      });

      // Add evidence
      setTimeout(async () => {
        try {
          // Add GPS evidence
          await apiRequest("POST", `/api/documents/1/evidence`, {
            type: "gps",
            data: { latitude: location.latitude, longitude: location.longitude },
          });

          // Add photo evidence
          await apiRequest("POST", `/api/documents/1/evidence`, {
            type: "photo", 
            data: { photoData: capturedPhoto },
          });

          // Add signature evidence
          await apiRequest("POST", `/api/documents/1/evidence`, {
            type: "signature",
            data: { signatureData },
          });

          // Add simple signature
          await apiRequest("POST", `/api/documents/1/sign-simple`, {
            signatureData,
            signerName: clientData.name || "Cliente POS",
            signerRut: clientData.rut || "12345678-9",
          });
        } catch (error) {
          console.error("Error adding evidence:", error);
        }
      }, 1000);
    }
  };

  const resetProcess = () => {
    setCurrentStep("selection");
    setSelectedDocument(null);
    setCapturedPhoto(null);
    setSignature(null);
    setClientData({ name: "", rut: "", phone: "" });
  };

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen">
      {/* POS Header */}
      <div className="bg-blue-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">VecinoXpress</h1>
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

      {/* Step Progress */}
      <div className="p-4 bg-gray-50 border-b">
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
                  <Button
                    key={docType.id}
                    variant="outline"
                    onClick={() => handleDocumentSelection(docType)}
                    className="w-full text-left p-4 h-auto border-2 hover:border-blue-600 hover:bg-blue-50"
                  >
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <i className="fas fa-file-contract text-blue-600 text-lg"></i>
                      </div>
                      <div className="ml-3 flex-1">
                        <h3 className="font-medium text-gray-900">{docType.name}</h3>
                        <p className="text-sm text-gray-500">{docType.description}</p>
                        <p className="text-xs text-blue-600 font-semibold">${docType.price} CLP</p>
                      </div>
                      <i className="fas fa-chevron-right text-gray-400"></i>
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </>
        )}

        {/* Step 2: Verification */}
        {currentStep === "verification" && (
          <div className="text-center">
            <h3 className="font-semibold text-gray-900 mb-2">Verificación de Identidad</h3>
            <p className="text-sm text-gray-600 mb-4">Posicione su rostro en el centro de la cámara</p>
            
            <CameraCapture 
              onCapture={handlePhotoCapture}
              onError={(error) => {
                toast({
                  title: "Error de cámara",
                  description: error,
                  variant: "destructive",
                });
              }}
            />
          </div>
        )}

        {/* Step 3: Signature */}
        {currentStep === "signature" && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Firma del Cliente</h3>
            
            <SignatureCanvas 
              onSignatureComplete={handleSignatureComplete}
              onClear={() => setSignature(null)}
            />
          </div>
        )}

        {/* Step 4: Completed */}
        {currentStep === "completed" && (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-check text-green-600 text-2xl"></i>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Documento Enviado</h3>
            <p className="text-sm text-gray-600 mb-6">
              Su documento ha sido enviado para firma avanzada. Recibirá el documento firmado por WhatsApp en los próximos minutos.
            </p>
            
            <Button onClick={resetProcess} className="w-full bg-blue-600 hover:bg-blue-700">
              <i className="fas fa-plus mr-2"></i>
              Nuevo Documento
            </Button>
          </div>
        )}
      </div>

      {/* Status Footer */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <i className="fas fa-wifi text-green-500 mr-1"></i>
            Conectado
          </div>
          <div className="text-sm text-gray-600">
            <i className="fas fa-shield-alt text-green-500 mr-1"></i>
            Seguro SSL
          </div>
        </div>
      </div>
    </div>
  );
}

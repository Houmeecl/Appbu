import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type ValidationResult = {
  document: any;
  evidence: any[];
  signatures: any[];
  terminal: any;
  isValid: boolean;
};

export default function ValidationInterface() {
  const [validationCode, setValidationCode] = useState("");
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidated, setIsValidated] = useState(false);
  const { toast } = useToast();

  const validateMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await apiRequest("GET", `/api/validate/${encodeURIComponent(code)}`);
      return response.json();
    },
    onSuccess: (data) => {
      setValidationResult(data);
      setIsValidated(true);
      toast({
        title: "Documento válido",
        description: "El documento ha sido verificado exitosamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error de validación",
        description: error.message || "Documento no encontrado o inválido",
        variant: "destructive",
      });
    },
  });

  const handleValidation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validationCode.trim()) {
      toast({
        title: "Código requerido",
        description: "Por favor ingrese un código de validación",
        variant: "destructive",
      });
      return;
    }
    validateMutation.mutate(validationCode.trim());
  };

  const handleReset = () => {
    setValidationCode("");
    setValidationResult(null);
    setIsValidated(false);
  };

  const handleDownload = async () => {
    if (validationResult?.document?.id) {
      try {
        const response = await fetch(`/api/documents/${validationResult.document.id}/pdf`);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${validationResult.document.documentNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (error) {
        toast({
          title: "Error de descarga",
          description: "No se pudo descargar el documento",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Validación de Documentos</h1>
            <p className="text-gray-600 mt-2">Sistema de verificación electrónica NotaryPro</p>
          </div>
        </div>
      </header>

      {/* Validation Form */}
      <main className="max-w-2xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <Card className="shadow-lg">
          <CardContent className="p-8">
            {!isValidated ? (
              <>
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-search text-blue-600 text-2xl"></i>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Verificar Documento</h2>
                  <p className="text-gray-600 mt-2">
                    Ingrese el código QR o hash del documento para validar su autenticidad
                  </p>
                </div>

                <form onSubmit={handleValidation}>
                  <div className="mb-6">
                    <Label htmlFor="document-code" className="block text-sm font-medium text-gray-700 mb-2">
                      Código de Verificación
                    </Label>
                    <div className="relative">
                      <Input
                        id="document-code"
                        type="text"
                        value={validationCode}
                        onChange={(e) => setValidationCode(e.target.value)}
                        placeholder="Ingrese el código QR o hash del documento"
                        className="pr-12"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <i className="fas fa-qrcode text-xl"></i>
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Ejemplo: DOC-2024-001847 o código QR escaneado
                    </p>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={validateMutation.isPending}
                  >
                    {validateMutation.isPending ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Validando...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-shield-alt mr-2"></i>
                        Validar Documento
                      </>
                    )}
                  </Button>
                </form>
              </>
            ) : (
              <>
                {/* Validation Result */}
                {validationResult && (
                  <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <i className="fas fa-check-circle text-green-600 text-xl"></i>
                      </div>
                      <div className="ml-3 flex-1">
                        <h3 className="text-lg font-semibold text-green-900 mb-3">Documento Válido</h3>
                        
                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                          <div>
                            <dt className="font-medium text-gray-700">Tipo de Documento:</dt>
                            <dd className="text-gray-900">Declaración Jurada Simple</dd>
                          </div>
                          <div>
                            <dt className="font-medium text-gray-700">Firmante:</dt>
                            <dd className="text-gray-900">{validationResult.document.clientName}</dd>
                          </div>
                          <div>
                            <dt className="font-medium text-gray-700">Fecha de Firma:</dt>
                            <dd className="text-gray-900">
                              {validationResult.document.signedAt 
                                ? new Date(validationResult.document.signedAt).toLocaleString('es-CL')
                                : 'No firmado'
                              }
                            </dd>
                          </div>
                          <div>
                            <dt className="font-medium text-gray-700">Ubicación:</dt>
                            <dd className="text-gray-900">
                              {validationResult.terminal?.address || 'No disponible'}
                            </dd>
                          </div>
                          <div>
                            <dt className="font-medium text-gray-700">Certificador:</dt>
                            <dd className="text-gray-900">NotaryPro - Juan Pérez</dd>
                          </div>
                          <div>
                            <dt className="font-medium text-gray-700">Hash SHA-256:</dt>
                            <dd className="text-gray-900 font-mono text-xs break-all">
                              {validationResult.document.hash}
                            </dd>
                          </div>
                        </dl>

                        {/* Document Status */}
                        <div className="mt-4">
                          <dt className="font-medium text-gray-700 mb-2">Estado del Documento:</dt>
                          <div className="flex flex-wrap gap-2">
                            {validationResult.signatures.map((sig: any, index: number) => (
                              <Badge key={index} variant="outline" className="bg-green-100 text-green-800">
                                {sig.type === 'simple' ? 'Firma Simple' : 'Firma Electrónica Avanzada (FEA)'}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-green-200 flex gap-3">
                          <Button 
                            onClick={handleDownload}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <i className="fas fa-download mr-2"></i>
                            Descargar Documento
                          </Button>
                          <Button 
                            onClick={handleReset}
                            variant="outline"
                          >
                            <i className="fas fa-search mr-2"></i>
                            Nueva Validación
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Info Section */}
        <Card className="mt-12 bg-blue-50">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">
              <i className="fas fa-info-circle mr-2"></i>
              Sobre la Validación
            </h3>
            <div className="text-sm text-blue-800 space-y-2">
              <p>• Los documentos firmados con NotaryPro utilizan Firma Electrónica Avanzada (FEA)</p>
              <p>• Cumple con la Ley 19.799 sobre Documentos Electrónicos en Chile</p>
              <p>• La validación verifica la integridad y autenticidad del documento</p>
              <p>• Los documentos incluyen trazabilidad GPS y verificación biométrica</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

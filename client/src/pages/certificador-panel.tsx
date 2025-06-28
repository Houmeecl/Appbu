import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { DocumentModal } from "@/components/document-modal";
import { useToast } from "@/hooks/use-toast";

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
  const [selectedDocument, setSelectedDocument] = useState<PendingDocument | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch pending documents
  const { data: pendingDocuments = [], isLoading } = useQuery({
    queryKey: ["/api/pending-documents"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Mock stats (would come from API)
  const stats = {
    pending: pendingDocuments.length,
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-red-600">NotaryPro</h1>
              <span className="ml-3 text-sm text-gray-500">Panel Certificador</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-sm text-gray-600">
                <i className="fas fa-usb text-green-500 mr-2"></i>
                eToken Conectado
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <i className="fas fa-user-circle mr-2"></i>
                <span>Juan Pérez - Certificador</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Stats Overview */}
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <i className="fas fa-clock text-yellow-600"></i>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pendientes</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.pending}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <i className="fas fa-check-circle text-green-600"></i>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Firmados Hoy</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.today}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <i className="fas fa-file-signature text-blue-600"></i>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Mensual</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.monthly}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-red-100 rounded-lg">
                    <i className="fas fa-exclamation-triangle text-red-600"></i>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Rechazados</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.rejected}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Documents Table */}
          <Card>
            <CardHeader>
              <CardTitle>Documentos Pendientes de Firma</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse bg-gray-200 h-16 rounded"></div>
                  ))}
                </div>
              ) : pendingDocuments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <i className="fas fa-inbox text-4xl mb-4"></i>
                  <p>No hay documentos pendientes</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Documento
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cliente
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ubicación
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Hora
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acción
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {pendingDocuments.map((doc: PendingDocument) => (
                        <tr key={doc.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <i className="fas fa-file-contract text-blue-600 mr-3"></i>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  Declaración Jurada Simple
                                </div>
                                <div className="text-sm text-gray-500 font-mono">
                                  {doc.documentNumber}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{doc.clientName}</div>
                            <div className="text-sm text-gray-500">{doc.clientRut}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {doc.terminal?.name || "Terminal POS"}
                            </div>
                            <div className="text-sm text-gray-500">
                              {doc.terminal?.address || "Ubicación"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(doc.createdAt).toLocaleTimeString('es-CL', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })} hrs
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                              <i className="fas fa-clock mr-1"></i>
                              Pendiente FEA
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <Button
                              onClick={() => handleReviewDocument(doc)}
                              className="bg-red-600 hover:bg-red-700 text-white"
                            >
                              <i className="fas fa-eye mr-2"></i>
                              Revisar
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Document Review Modal */}
      {selectedDocument && (
        <DocumentModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedDocument(null);
          }}
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

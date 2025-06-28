import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type DocumentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  document: any;
  onSign: () => void;
  onReject: (reason: string) => void;
  isSigningLoading: boolean;
  isRejectingLoading: boolean;
};

export function DocumentModal({
  isOpen,
  onClose,
  document,
  onSign,
  onReject,
  isSigningLoading,
  isRejectingLoading,
}: DocumentModalProps) {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const handleReject = () => {
    if (rejectReason.trim()) {
      onReject(rejectReason);
      setRejectReason("");
      setShowRejectForm(false);
    }
  };

  const gpsEvidence = document.evidence?.find((e: any) => e.type === "gps");
  const photoEvidence = document.evidence?.find((e: any) => e.type === "photo");
  const signatureEvidence = document.evidence?.find((e: any) => e.type === "signature");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Revisión de Documento - {document.documentNumber}</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <i className="fas fa-times"></i>
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Document Preview */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Vista Previa del Documento</h4>
            <div className="border rounded-lg h-96 bg-gray-50 p-6 overflow-y-auto">
              <div className="max-w-md mx-auto">
                <div className="border-b-2 border-gray-300 pb-4 mb-4 text-center">
                  <h5 className="font-bold text-lg">DECLARACIÓN JURADA SIMPLE</h5>
                  <p className="text-sm text-gray-600">Documento Legal Electrónico</p>
                </div>
                <div className="text-left text-sm space-y-3">
                  <p><strong>Yo,</strong> {document.clientName}, RUT {document.clientRut}...</p>
                  <p>Declaro bajo juramento que la información proporcionada es veraz y completa.</p>
                  <p>Acepto las responsabilidades legales que se deriven de esta declaración.</p>
                  
                  <div className="mt-8 pt-4 border-t border-gray-300">
                    <div className="text-xs text-gray-500 space-y-1">
                      <p><strong>Documento:</strong> {document.documentNumber}</p>
                      <p><strong>Hash:</strong> {document.hash?.substring(0, 20)}...</p>
                      <p><strong>Fecha:</strong> {new Date(document.createdAt).toLocaleString('es-CL')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Evidence Review */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Evidencia de Verificación</h4>
            
            {/* Identity Photo */}
            <div className="mb-4">
              <Label className="block text-sm font-medium text-gray-700 mb-2">
                Foto de Verificación
              </Label>
              {photoEvidence?.data?.photoData ? (
                <img 
                  src={photoEvidence.data.photoData}
                  alt="Foto de verificación de identidad" 
                  className="w-32 h-32 rounded-lg border object-cover" 
                />
              ) : (
                <div className="w-32 h-32 bg-gray-200 rounded-lg border flex items-center justify-center">
                  <i className="fas fa-user text-gray-400 text-2xl"></i>
                </div>
              )}
            </div>
            
            {/* Signature */}
            <div className="mb-4">
              <Label className="block text-sm font-medium text-gray-700 mb-2">
                Firma del Cliente
              </Label>
              {signatureEvidence?.data?.signatureData ? (
                <img 
                  src={signatureEvidence.data.signatureData}
                  alt="Firma del cliente" 
                  className="w-full h-24 border rounded-lg bg-white object-contain" 
                />
              ) : (
                <div className="w-full h-24 border rounded-lg bg-white flex items-center justify-center">
                  <span className="text-gray-500 italic">Firma no disponible</span>
                </div>
              )}
            </div>
            
            {/* Location Info */}
            <div className="mb-6">
              <Label className="block text-sm font-medium text-gray-700 mb-2">
                Información de Ubicación
              </Label>
              <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600">Coordenadas GPS:</span>
                  <span className="font-mono">
                    {gpsEvidence?.data ? 
                      `${gpsEvidence.data.latitude?.toFixed(6)}, ${gpsEvidence.data.longitude?.toFixed(6)}` :
                      'No disponible'
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Punto de Venta:</span>
                  <span>{document.terminal?.name || 'Terminal POS'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Dirección:</span>
                  <span>{document.terminal?.address || 'Dirección no disponible'}</span>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            {!showRejectForm ? (
              <div className="flex space-x-3">
                <Button 
                  onClick={() => setShowRejectForm(true)}
                  variant="outline"
                  className="flex-1"
                  disabled={isSigningLoading || isRejectingLoading}
                >
                  <i className="fas fa-times mr-2"></i>
                  Rechazar
                </Button>
                <Button 
                  onClick={onSign}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  disabled={isSigningLoading || isRejectingLoading}
                >
                  {isSigningLoading ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Firmando...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-signature mr-2"></i>
                      Firmar con eToken
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="reject-reason" className="text-sm font-medium">
                    Motivo del rechazo
                  </Label>
                  <Textarea
                    id="reject-reason"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Ingrese el motivo del rechazo..."
                    className="mt-1"
                  />
                </div>
                <div className="flex space-x-3">
                  <Button 
                    onClick={() => {
                      setShowRejectForm(false);
                      setRejectReason("");
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleReject}
                    className="flex-1 bg-red-600 hover:bg-red-700"
                    disabled={!rejectReason.trim() || isRejectingLoading}
                  >
                    {isRejectingLoading ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Rechazando...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-ban mr-2"></i>
                        Confirmar Rechazo
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

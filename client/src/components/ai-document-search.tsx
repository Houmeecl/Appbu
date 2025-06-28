import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Search, 
  Bot, 
  FileText, 
  Clock, 
  User, 
  MapPin, 
  Send, 
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Filter
} from "lucide-react";

type Document = {
  id: number;
  documentNumber: string;
  typeId: number;
  clientName: string;
  clientRut: string;
  status: string;
  createdAt: string;
  posTerminalId?: number;
  clientPhone?: string;
  qrCode?: string;
};

type Message = {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  documents?: Document[];
};

export function AiDocumentSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: '¡Hola! Soy el Agente IA de VecinoXpress. Puedo ayudarte a buscar documentos por nombre del cliente, RUT, número de documento o estado. ¿Qué documento necesitas encontrar?',
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch all documents
  const { data: allDocuments = [] } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
  });

  // Fetch document types for reference
  const { data: documentTypes = [] } = useQuery({
    queryKey: ["/api/document-types"],
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const searchDocuments = (query: string): Document[] => {
    if (!query.trim()) return [];
    
    const searchTerm = query.toLowerCase().trim();
    
    return allDocuments.filter(doc => 
      doc.clientName.toLowerCase().includes(searchTerm) ||
      doc.clientRut.includes(searchTerm) ||
      doc.documentNumber.toLowerCase().includes(searchTerm) ||
      doc.status.toLowerCase().includes(searchTerm) ||
      (doc.clientPhone && doc.clientPhone.includes(searchTerm))
    );
  };

  const generateAIResponse = (query: string, foundDocuments: Document[]): string => {
    const searchTerm = query.toLowerCase();
    
    if (foundDocuments.length === 0) {
      if (searchTerm.includes('rut') || /\d{7,8}-[\dk]/i.test(query)) {
        return `No encontré documentos para ese RUT. Verifica que esté en formato correcto (ej: 12.345.678-9) o que el documento haya sido creado en este terminal.`;
      }
      if (searchTerm.includes('pendiente') || searchTerm.includes('pending')) {
        return `No hay documentos pendientes en este momento. Todos los documentos han sido procesados.`;
      }
      return `No encontré documentos que coincidan con "${query}". Intenta buscar por:
• Nombre completo del cliente
• RUT (formato: 12.345.678-9)  
• Número de documento (ej: DOC-2024-001234)
• Estado (pendiente, firmado, completado)`;
    }

    if (foundDocuments.length === 1) {
      const doc = foundDocuments[0];
      return `Encontré 1 documento para "${query}":
      
**${doc.documentNumber}** - ${doc.clientName}
• Estado: ${doc.status}
• RUT: ${doc.clientRut}
• Creado: ${new Date(doc.createdAt).toLocaleDateString('es-CL')}

¿Necesitas realizar alguna acción con este documento?`;
    }

    const statusCounts = foundDocuments.reduce((acc, doc) => {
      acc[doc.status] = (acc[doc.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return `Encontré ${foundDocuments.length} documentos para "${query}":

**Resumen por estado:**
${Object.entries(statusCounts).map(([status, count]) => `• ${status}: ${count} documento(s)`).join('\n')}

Los documentos aparecen listados abajo. ¿Hay alguno específico que necesites revisar?`;
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: searchQuery,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // Search documents
    const foundDocuments = searchDocuments(searchQuery);
    
    // Generate AI response
    const aiResponse = generateAIResponse(searchQuery, foundDocuments);
    
    // Add AI response
    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: 'ai',
      content: aiResponse,
      timestamp: new Date(),
      documents: foundDocuments.length > 0 ? foundDocuments : undefined
    };
    
    setTimeout(() => {
      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1000);
    
    setSearchQuery("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'pending': { label: 'Pendiente', variant: 'secondary' as const, icon: Clock },
      'signed': { label: 'Firmado', variant: 'default' as const, icon: CheckCircle2 },
      'completed': { label: 'Completado', variant: 'default' as const, icon: CheckCircle2 },
      'rejected': { label: 'Rechazado', variant: 'destructive' as const, icon: AlertCircle }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const IconComponent = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <IconComponent className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getDocumentTypeName = (typeId: number) => {
    const type = documentTypes.find((t: any) => t.id === typeId);
    return type?.name || 'Documento';
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Bot className="h-5 w-5 text-blue-600" />
          </div>
          Agente IA - Buscador de Documentos
          <Sparkles className="h-4 w-4 text-yellow-500" />
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-4">
        {/* Messages Area */}
        <ScrollArea className="flex-1 mb-4 border rounded-lg">
          <div className="p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.type === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  <div className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString('es-CL', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-900 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin h-4 w-4 border-2 border-gray-400 border-t-blue-600 rounded-full"></div>
                    Buscando documentos...
                  </div>
                </div>
              </div>
            )}
            
            {/* Document Results */}
            {messages.map((message) => 
              message.documents && message.documents.length > 0 && (
                <div key={`docs-${message.id}`} className="space-y-2">
                  <Separator />
                  <div className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Documentos encontrados ({message.documents.length})
                  </div>
                  {message.documents.map((doc) => (
                    <Card key={doc.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="font-medium text-sm">{doc.documentNumber}</div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <User className="h-3 w-3" />
                              {doc.clientName}
                            </div>
                            <div className="text-xs text-gray-500">
                              RUT: {doc.clientRut} | {getDocumentTypeName(doc.typeId)}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Clock className="h-3 w-3" />
                              {new Date(doc.createdAt).toLocaleString('es-CL')}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            {getStatusBadge(doc.status)}
                            {doc.qrCode && (
                              <Button size="sm" variant="outline" className="text-xs">
                                Ver QR
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        {/* Search Input */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Buscar por nombre, RUT, número de documento..."
              className="pl-10"
              disabled={isLoading}
            />
          </div>
          <Button 
            onClick={handleSearch}
            disabled={!searchQuery.trim() || isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Quick Actions */}
        <div className="flex gap-2 mt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSearchQuery("pendiente")}
            className="text-xs"
          >
            <Filter className="h-3 w-3 mr-1" />
            Pendientes
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSearchQuery("completado")}
            className="text-xs"
          >
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Completados
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSearchQuery("hoy")}
            className="text-xs"
          >
            <Clock className="h-3 w-3 mr-1" />
            Hoy
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
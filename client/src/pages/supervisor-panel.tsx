import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  Upload, 
  FileText, 
  Eye, 
  CheckCircle, 
  AlertTriangle, 
  Code2, 
  Settings,
  Download,
  Search,
  Zap,
  BarChart3
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface UploadedTemplate {
  filename: string;
  size: number;
  created: string;
  variables: number;
  preview: string;
}

interface TemplateAnalysis {
  totalVariables: number;
  uniqueVariables: string[];
  positions: Array<{ variable: string; start: number; end: number }>;
  detectedFields: Array<{
    name: string;
    type: string;
    required: boolean;
    detected: boolean;
  }>;
  complexity: 'low' | 'medium' | 'high';
  estimatedPrice: number;
  contentStats: {
    characters: number;
    words: number;
    lines: number;
  };
}

export default function SupervisorPanel() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [templateCategory, setTemplateCategory] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [previewContent, setPreviewContent] = useState("");
  const [analysis, setAnalysis] = useState<TemplateAnalysis | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query para obtener plantillas subidas
  const { data: uploadedTemplates = [], isLoading: loadingTemplates } = useQuery({
    queryKey: ['/api/supervisor/uploaded-templates'],
  });

  // Mutation para subir plantilla
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      setUploadProgress(0);
      const response = await fetch('/api/supervisor/upload-template', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error subiendo plantilla');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setUploadProgress(100);
      toast({
        title: "Plantilla Procesada",
        description: `${data.templateName} agregada al sistema exitosamente`,
      });
      
      // Limpiar formulario
      setSelectedFile(null);
      setTemplateName("");
      setTemplateDescription("");
      setTemplateCategory("");
      setBasePrice("");
      setPreviewContent("");
      setAnalysis(null);
      setUploadProgress(0);
      
      // Refresh templates
      queryClient.invalidateQueries({ queryKey: ['/api/supervisor/uploaded-templates'] });
      queryClient.invalidateQueries({ queryKey: ['/api/document-types'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setUploadProgress(0);
    },
  });

  // Mutation para analizar plantilla
  const analyzeMutation = useMutation({
    mutationFn: async (content: string) => {
      return await apiRequest('/api/supervisor/analyze-template', {
        method: 'POST',
        body: { content }
      });
    },
    onSuccess: (data) => {
      setAnalysis(data.analysis);
      toast({
        title: "Análisis Completado",
        description: `${data.analysis.totalVariables} variables detectadas`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error de Análisis",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation para vista previa
  const previewMutation = useMutation({
    mutationFn: async (content: string) => {
      return await apiRequest('/api/supervisor/preview-template', {
        method: 'POST',
        body: { content }
      });
    },
    onSuccess: (data) => {
      setPreviewContent(data.preview);
      toast({
        title: "Vista Previa Generada",
        description: `${data.variables.length} variables reemplazadas`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error de Vista Previa",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!templateName) {
        setTemplateName(file.name.replace(/\.[^/.]+$/, ""));
      }

      // Leer contenido para análisis automático
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (content) {
          analyzeMutation.mutate(content);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleUpload = () => {
    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Por favor selecciona un archivo",
        variant: "destructive",
      });
      return;
    }

    if (!templateName.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa un nombre para la plantilla",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('template', selectedFile);
    formData.append('name', templateName);
    formData.append('description', templateDescription);
    formData.append('category', templateCategory);
    formData.append('basePrice', basePrice);

    uploadMutation.mutate(formData);
  };

  const generatePreview = () => {
    if (!selectedFile) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        previewMutation.mutate(content);
      }
    };
    reader.readAsText(selectedFile);
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getComplexityIcon = (complexity: string) => {
    switch (complexity) {
      case 'low': return <CheckCircle className="h-4 w-4" />;
      case 'medium': return <AlertTriangle className="h-4 w-4" />;
      case 'high': return <Zap className="h-4 w-4" />;
      default: return <BarChart3 className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Panel Supervisor - Gestión de Plantillas
          </h1>
          <p className="text-gray-600">
            Sube y adapta automáticamente plantillas de documentos legales al sistema VecinoXpress
          </p>
        </div>

        <Tabs defaultValue="upload" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Subir Plantilla
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Plantillas Subidas
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Análisis
            </TabsTrigger>
          </TabsList>

          {/* Tab: Subir Plantilla */}
          <TabsContent value="upload" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Formulario de Upload */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Subir Nueva Plantilla
                  </CardTitle>
                  <CardDescription>
                    Sube un archivo HTML o TXT con variables {{variable}} para adaptación automática
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Selector de archivo */}
                  <div>
                    <Label htmlFor="file-upload">Archivo de Plantilla</Label>
                    <Input
                      id="file-upload"
                      type="file"
                      accept=".html,.txt"
                      onChange={handleFileSelect}
                      className="mt-1"
                    />
                    {selectedFile && (
                      <p className="text-sm text-gray-600 mt-2">
                        Archivo: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
                      </p>
                    )}
                  </div>

                  <Separator />

                  {/* Metadatos */}
                  <div>
                    <Label htmlFor="template-name">Nombre de la Plantilla</Label>
                    <Input
                      id="template-name"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      placeholder="Ej: Poder Notarial Especial"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="template-description">Descripción (Opcional)</Label>
                    <Textarea
                      id="template-description"
                      value={templateDescription}
                      onChange={(e) => setTemplateDescription(e.target.value)}
                      placeholder="Describe el propósito de este documento..."
                      className="mt-1"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="template-category">Categoría</Label>
                      <Input
                        id="template-category"
                        value={templateCategory}
                        onChange={(e) => setTemplateCategory(e.target.value)}
                        placeholder="Ej: Poderes"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="base-price">Precio Base (CLP)</Label>
                      <Input
                        id="base-price"
                        type="number"
                        value={basePrice}
                        onChange={(e) => setBasePrice(e.target.value)}
                        placeholder="2000"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  {/* Progress bar durante upload */}
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div>
                      <Label>Progreso de Subida</Label>
                      <Progress value={uploadProgress} className="mt-2" />
                    </div>
                  )}

                  {/* Botones de acción */}
                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={handleUpload}
                      disabled={!selectedFile || uploadMutation.isPending}
                      className="flex-1"
                    >
                      {uploadMutation.isPending ? 'Procesando...' : 'Subir y Procesar'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={generatePreview}
                      disabled={!selectedFile || previewMutation.isPending}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Vista Previa
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Análisis automático */}
              {analysis && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Code2 className="h-5 w-5" />
                      Análisis Automático
                    </CardTitle>
                    <CardDescription>
                      Variables y campos detectados en la plantilla
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Estadísticas generales */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {analysis.totalVariables}
                        </div>
                        <div className="text-sm text-blue-800">Variables</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          ${analysis.estimatedPrice.toLocaleString('es-CL')}
                        </div>
                        <div className="text-sm text-green-800">Precio Estimado</div>
                      </div>
                    </div>

                    {/* Complejidad */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Complejidad:</span>
                      <Badge className={`${getComplexityColor(analysis.complexity)} flex items-center gap-1`}>
                        {getComplexityIcon(analysis.complexity)}
                        {analysis.complexity.toUpperCase()}
                      </Badge>
                    </div>

                    {/* Estadísticas de contenido */}
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>Caracteres: {analysis.contentStats.characters.toLocaleString()}</div>
                      <div>Palabras: {analysis.contentStats.words.toLocaleString()}</div>
                      <div>Líneas: {analysis.contentStats.lines.toLocaleString()}</div>
                    </div>

                    <Separator />

                    {/* Campos detectados */}
                    <div>
                      <Label className="text-sm font-medium">Campos Detectados:</Label>
                      <ScrollArea className="h-32 mt-2">
                        <div className="space-y-2">
                          {analysis.detectedFields.map((field, index) => (
                            <div key={index} className="flex items-center justify-between text-sm">
                              <span className="flex items-center gap-2">
                                <code className="bg-gray-100 px-1 rounded text-xs">
                                  {field.name}
                                </code>
                                {field.required && (
                                  <Badge variant="destructive" className="text-xs px-1">
                                    Req
                                  </Badge>
                                )}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {field.type}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Vista previa */}
            {previewContent && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Vista Previa con Datos de Muestra
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64 w-full border rounded-lg p-4 bg-white">
                    <div 
                      className="prose max-w-none"
                      dangerouslySetInnerHTML={{ __html: previewContent }}
                    />
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab: Plantillas Subidas */}
          <TabsContent value="templates">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Plantillas Subidas
                </CardTitle>
                <CardDescription>
                  Historial de plantillas procesadas y agregadas al sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingTemplates ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-600 mt-2">Cargando plantillas...</p>
                  </div>
                ) : uploadedTemplates.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No hay plantillas subidas aún</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {uploadedTemplates.map((template: UploadedTemplate, index: number) => (
                      <div key={index} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{template.filename}</h4>
                          <Badge variant="outline">
                            {template.variables} variables
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600">
                          <div>Tamaño: {Math.round(template.size / 1024)} KB</div>
                          <div>Creado: {new Date(template.created).toLocaleDateString('es-CL')}</div>
                        </div>
                        <div className="text-sm text-gray-500 bg-gray-50 p-2 rounded">
                          {template.preview}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Análisis */}
          <TabsContent value="analysis">
            {analysis ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Análisis Detallado</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <div className="text-xl font-bold text-blue-600">
                          {analysis.totalVariables}
                        </div>
                        <div className="text-sm text-blue-800">Variables</div>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg">
                        <div className="text-xl font-bold text-green-600">
                          ${analysis.estimatedPrice.toLocaleString('es-CL')}
                        </div>
                        <div className="text-sm text-green-800">Precio</div>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-lg">
                        <div className="text-xl font-bold text-purple-600">
                          {analysis.contentStats.words}
                        </div>
                        <div className="text-sm text-purple-800">Palabras</div>
                      </div>
                    </div>

                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        El sistema ha detectado automáticamente {analysis.detectedFields.filter(f => f.required).length} campos obligatorios
                        y asignado tipos de datos apropiados para validación.
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Variables Detectadas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-64">
                      <div className="space-y-2">
                        {analysis.uniqueVariables.map((variable, index) => (
                          <div key={index} className="flex items-center justify-between p-2 border rounded">
                            <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                              {variable}
                            </code>
                            <div className="flex gap-2">
                              {analysis.detectedFields.find(f => f.name === variable)?.required && (
                                <Badge variant="destructive" className="text-xs">
                                  Obligatorio
                                </Badge>
                              )}
                              <Badge variant="outline" className="text-xs">
                                {analysis.detectedFields.find(f => f.name === variable)?.type || 'text'}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    Sube una plantilla en la pestaña "Subir Plantilla" para ver el análisis detallado
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
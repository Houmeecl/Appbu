import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { useGeolocation } from "../hooks/use-geolocation";
import { Languages, MapPin, Users, BookOpen, AlertTriangle, CheckCircle } from "lucide-react";

interface CulturalAnalysisProps {
  documentType?: string;
  onTranslationRequest?: (cultureName: string, suggestions: string[]) => void;
  isVisible?: boolean;
}

interface CulturalData {
  hasIndigenousCulture: boolean;
  cultureName?: string;
  language?: string;
  territory?: string;
  culturalContext?: string;
  translationSuggestions?: string[];
  legalDocumentRecommendations?: string[];
}

interface AnalysisResponse {
  location: { latitude: number; longitude: number };
  localAnalysis: CulturalData;
  aiAnalysis?: CulturalData;
  timestamp: string;
}

export function CulturalAnalysis({ documentType = "documento legal", onTranslationRequest, isVisible = true }: CulturalAnalysisProps) {
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { location, error: gpsError } = useGeolocation({ enableHighAccuracy: true });

  // Análisis automático cuando se obtiene la ubicación
  useEffect(() => {
    if (location && isVisible) {
      performAnalysis();
    }
  }, [location, isVisible]);

  const performAnalysis = async () => {
    if (!location) {
      setError("Ubicación GPS no disponible");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/cultural/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          latitude: location.latitude,
          longitude: location.longitude,
          documentType
        }),
      });

      if (!response.ok) {
        throw new Error("Error en análisis cultural");
      }

      const data: AnalysisResponse = await response.json();
      setAnalysis(data);
    } catch (err) {
      setError("No se pudo realizar el análisis cultural");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const requestTranslationSuggestions = async (cultureName: string) => {
    if (!onTranslationRequest) return;

    try {
      const response = await fetch("/api/cultural/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cultureName,
          documentContent: `Documento legal tipo: ${documentType}`
        }),
      });

      if (response.ok) {
        const data = await response.json();
        onTranslationRequest(cultureName, data.suggestions.translations || []);
      }
    } catch (err) {
      console.error("Error obteniendo sugerencias:", err);
    }
  };

  if (!isVisible) return null;

  if (gpsError) {
    return (
      <Alert className="border-yellow-200 bg-yellow-50">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          No se puede acceder al GPS para análisis cultural: {gpsError}
        </AlertDescription>
      </Alert>
    );
  }

  if (!location) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-6">
          <div className="text-center">
            <MapPin className="h-8 w-8 mx-auto mb-2 text-muted-foreground animate-pulse" />
            <p className="text-sm text-muted-foreground">Obteniendo ubicación GPS...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Análisis Cultural Inteligente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading && (
          <div className="text-center py-4">
            <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Analizando contexto cultural...</p>
          </div>
        )}

        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {analysis && (
          <Tabs defaultValue="analysis" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="analysis">Análisis</TabsTrigger>
              <TabsTrigger value="recommendations">Recomendaciones</TabsTrigger>
            </TabsList>

            <TabsContent value="analysis" className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                GPS: {analysis.location.latitude.toFixed(4)}, {analysis.location.longitude.toFixed(4)}
              </div>

              {analysis.localAnalysis.hasIndigenousCulture ? (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <div className="font-semibold">Cultura Indígena Detectada</div>
                      <div className="grid gap-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{analysis.localAnalysis.cultureName}</Badge>
                          <span className="text-xs">Pueblo originario</span>
                        </div>
                        {analysis.localAnalysis.language && (
                          <div className="flex items-center gap-2">
                            <Languages className="h-3 w-3" />
                            <span className="text-xs">Lengua: {analysis.localAnalysis.language}</span>
                          </div>
                        )}
                        {analysis.localAnalysis.territory && (
                          <div className="text-xs text-muted-foreground">
                            Territorio: {analysis.localAnalysis.territory}
                          </div>
                        )}
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert>
                  <AlertDescription>
                    No se detectaron territorios indígenas en esta ubicación específica.
                  </AlertDescription>
                </Alert>
              )}

              {analysis.aiAnalysis && (
                <Card className="border-purple-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Análisis IA Avanzado
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-xs text-muted-foreground">
                      {analysis.aiAnalysis.culturalContext || "Información cultural adicional disponible"}
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-4">
              {analysis.localAnalysis.hasIndigenousCulture && analysis.localAnalysis.translationSuggestions && (
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Sugerencias de Traducción</h4>
                  <div className="space-y-2">
                    {analysis.localAnalysis.translationSuggestions.map((suggestion, index) => (
                      <div key={index} className="flex items-start gap-2 text-xs">
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></div>
                        <span>{suggestion}</span>
                      </div>
                    ))}
                  </div>
                  
                  {onTranslationRequest && analysis.localAnalysis.cultureName && (
                    <Button
                      size="sm"
                      onClick={() => requestTranslationSuggestions(analysis.localAnalysis.cultureName!)}
                      className="mt-2"
                    >
                      <Languages className="h-3 w-3 mr-1" />
                      Obtener Sugerencias IA
                    </Button>
                  )}
                </div>
              )}

              {analysis.localAnalysis.legalDocumentRecommendations && (
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Consideraciones Legales</h4>
                  <div className="space-y-2">
                    {analysis.localAnalysis.legalDocumentRecommendations.map((recommendation, index) => (
                      <div key={index} className="flex items-start gap-2 text-xs">
                        <div className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0"></div>
                        <span>{recommendation}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}

        <Button
          size="sm"
          variant="outline"
          onClick={performAnalysis}
          disabled={loading || !location}
          className="w-full"
        >
          {loading ? "Analizando..." : "Actualizar Análisis"}
        </Button>
      </CardContent>
    </Card>
  );
}
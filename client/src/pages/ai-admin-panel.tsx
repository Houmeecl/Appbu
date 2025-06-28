import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Textarea } from "../components/ui/textarea";
import { Progress } from "../components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Alert, AlertDescription } from "../components/ui/alert";
import { 
  Brain, 
  TrendingUp, 
  MapPin, 
  Users, 
  DollarSign, 
  Target, 
  BarChart3,
  Lightbulb,
  Search,
  Star,
  ArrowRight,
  Map,
  PieChart,
  Globe,
  Zap,
  MessageSquare,
  RefreshCw
} from "lucide-react";

interface SectorRecommendation {
  location: string;
  coordinates: { latitude: number; longitude: number };
  score: number;
  reasons: string[];
  demographics: {
    population: number;
    averageIncome: number;
    educationLevel: string;
    socialIndicators: {
      povertyRate: number;
      unemploymentRate: number;
    };
  };
  marketOpportunity: {
    estimatedMonthlyDocuments: number;
    revenueProjection: number;
    competitionLevel: string;
  };
  socialImpact: {
    accessibilityImprovement: string;
    inclusionFactor: number;
  };
  implementationPlan: {
    priority: string;
    timeframe: string;
  };
}

interface SociologicalAnalysis {
  recommendations: SectorRecommendation[];
  overallInsights: {
    marketTrends: string[];
    socialNeeds: string[];
    technologicalReadiness: string;
  };
}

export default function AIAdminPanel() {
  const [activeTab, setActiveTab] = useState("sector-analysis");
  const [aiQuery, setAiQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [analysisLoading, setAnalysisLoading] = useState(false);

  // Query para análisis sociológico
  const { data: sectorAnalysis, isLoading: sectorLoading, refetch: refetchSector } = useQuery({
    queryKey: ['/api/sociology/sector-analysis'],
    enabled: activeTab === "sector-analysis"
  });

  // Query para datos demográficos específicos
  const { data: demographicData, isLoading: demoLoading } = useQuery({
    queryKey: ['/api/sociology/demographics', selectedRegion],
    enabled: !!selectedRegion && activeTab === "demographics"
  });

  // Mutación para análisis de oportunidad específica
  const opportunityMutation = useMutation({
    mutationFn: async (coordinates: { latitude: number; longitude: number }) => {
      const response = await fetch("/api/sociology/market-opportunity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coordinates })
      });
      if (!response.ok) throw new Error("Failed to analyze opportunity");
      return response.json();
    }
  });

  // Mutación para insights AI personalizados
  const aiInsightsMutation = useMutation({
    mutationFn: async ({ context, questions }: { context: string; questions: string }) => {
      const response = await fetch("/api/sociology/ai-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          context, 
          specificQuestions: questions 
        })
      });
      if (!response.ok) throw new Error("Failed to get AI insights");
      return response.json();
    }
  });

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg">
              <Brain className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Panel Administración IA</h1>
              <p className="text-gray-600">Agente Sociólogo para Análisis de Mejores Sectores</p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="sector-analysis" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Análisis Sectorial
            </TabsTrigger>
            <TabsTrigger value="demographics" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Demografia IA
            </TabsTrigger>
            <TabsTrigger value="market-intelligence" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Inteligencia Mercado
            </TabsTrigger>
            <TabsTrigger value="ai-consultant" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Consultor IA
            </TabsTrigger>
          </TabsList>

          {/* Análisis Sectorial */}
          <TabsContent value="sector-analysis">
            <div className="space-y-6">
              <Card className="border-l-4 border-l-purple-500">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="h-5 w-5" />
                      Recomendaciones de Sectores IA
                    </CardTitle>
                    <Button 
                      onClick={() => refetchSector()}
                      disabled={sectorLoading}
                      variant="outline"
                      size="sm"
                    >
                      <RefreshCw className={`h-3 w-3 mr-1 ${sectorLoading ? 'animate-spin' : ''}`} />
                      Actualizar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {sectorLoading ? (
                    <div className="text-center py-12">
                      <div className="animate-pulse space-y-4">
                        <Brain className="h-12 w-12 mx-auto text-purple-400" />
                        <p className="text-gray-500">Agente sociólogo analizando oportunidades...</p>
                        <Progress value={75} className="w-48 mx-auto" />
                      </div>
                    </div>
                  ) : sectorAnalysis?.analysis ? (
                    <div className="space-y-6">
                      {/* Insights Generales */}
                      <Card className="bg-gradient-to-r from-purple-50 to-indigo-50">
                        <CardContent className="p-4">
                          <h3 className="font-semibold mb-3 flex items-center gap-2">
                            <Lightbulb className="h-4 w-4" />
                            Insights del Agente Sociólogo
                          </h3>
                          <div className="grid md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <h4 className="font-medium text-purple-700 mb-2">Tendencias de Mercado</h4>
                              <ul className="space-y-1">
                                {sectorAnalysis.analysis.overallInsights.marketTrends.map((trend: string, index: number) => (
                                  <li key={index} className="flex items-start gap-1">
                                    <TrendingUp className="h-3 w-3 mt-0.5 text-purple-500 flex-shrink-0" />
                                    <span>{trend}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <h4 className="font-medium text-indigo-700 mb-2">Necesidades Sociales</h4>
                              <ul className="space-y-1">
                                {sectorAnalysis.analysis.overallInsights.socialNeeds.map((need: string, index: number) => (
                                  <li key={index} className="flex items-start gap-1">
                                    <Users className="h-3 w-3 mt-0.5 text-indigo-500 flex-shrink-0" />
                                    <span>{need}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <h4 className="font-medium text-pink-700 mb-2">Preparación Tecnológica</h4>
                              <p className="text-sm flex items-start gap-1">
                                <Zap className="h-3 w-3 mt-0.5 text-pink-500 flex-shrink-0" />
                                {sectorAnalysis.analysis.overallInsights.technologicalReadiness}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Recomendaciones de Sectores */}
                      <div className="grid gap-6">
                        {sectorAnalysis.analysis.recommendations.map((recommendation: SectorRecommendation, index: number) => (
                          <Card key={index} className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
                            <CardContent className="p-6">
                              <div className="flex items-start justify-between mb-4">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-3">
                                    <h3 className="text-lg font-semibold">{recommendation.location}</h3>
                                    <Badge className={getPriorityColor(recommendation.implementationPlan.priority)}>
                                      Prioridad {recommendation.implementationPlan.priority}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <MapPin className="h-3 w-3" />
                                    {recommendation.coordinates.latitude.toFixed(4)}, {recommendation.coordinates.longitude.toFixed(4)}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className={`text-2xl font-bold ${getScoreColor(recommendation.score)}`}>
                                    {recommendation.score}
                                  </div>
                                  <div className="text-xs text-gray-500">Score IA</div>
                                </div>
                              </div>

                              <div className="grid md:grid-cols-3 gap-6 mb-4">
                                {/* Demografia */}
                                <div className="space-y-2">
                                  <h4 className="font-medium flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    Demografia
                                  </h4>
                                  <div className="text-sm space-y-1">
                                    <div>Población: {recommendation.demographics.population.toLocaleString()}</div>
                                    <div>Ingresos: ${recommendation.demographics.averageIncome.toLocaleString()}</div>
                                    <div>Pobreza: {recommendation.demographics.socialIndicators.povertyRate}%</div>
                                  </div>
                                </div>

                                {/* Oportunidad de Mercado */}
                                <div className="space-y-2">
                                  <h4 className="font-medium flex items-center gap-1">
                                    <DollarSign className="h-3 w-3" />
                                    Oportunidad
                                  </h4>
                                  <div className="text-sm space-y-1">
                                    <div>Est. mensual: {recommendation.marketOpportunity.estimatedMonthlyDocuments} docs</div>
                                    <div>Ingresos: ${recommendation.marketOpportunity.revenueProjection.toLocaleString()}</div>
                                    <div>Competencia: {recommendation.marketOpportunity.competitionLevel}</div>
                                  </div>
                                </div>

                                {/* Impacto Social */}
                                <div className="space-y-2">
                                  <h4 className="font-medium flex items-center gap-1">
                                    <Star className="h-3 w-3" />
                                    Impacto Social
                                  </h4>
                                  <div className="text-sm space-y-1">
                                    <div>Inclusión: {recommendation.socialImpact.inclusionFactor}/10</div>
                                    <div>Implementación: {recommendation.implementationPlan.timeframe}</div>
                                  </div>
                                </div>
                              </div>

                              {/* Razones del Agente IA */}
                              <div className="border-t pt-4">
                                <h4 className="font-medium mb-2 flex items-center gap-1">
                                  <Brain className="h-3 w-3" />
                                  Análisis del Agente Sociólogo
                                </h4>
                                <div className="grid md:grid-cols-2 gap-3">
                                  {recommendation.reasons.map((reason, reasonIndex) => (
                                    <div key={reasonIndex} className="flex items-start gap-2 text-sm">
                                      <ArrowRight className="h-3 w-3 mt-0.5 text-blue-500 flex-shrink-0" />
                                      <span>{reason}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="flex gap-2 mt-4">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button size="sm" variant="outline">
                                      <Search className="h-3 w-3 mr-1" />
                                      Análisis Detallado
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-2xl">
                                    <DialogHeader>
                                      <DialogTitle>Análisis Detallado - {recommendation.location}</DialogTitle>
                                    </DialogHeader>
                                    <SectorDetailAnalysis 
                                      recommendation={recommendation}
                                      onAnalyze={(coords) => opportunityMutation.mutate(coords)}
                                      isAnalyzing={opportunityMutation.isPending}
                                      analysisData={opportunityMutation.data}
                                    />
                                  </DialogContent>
                                </Dialog>
                                <Button size="sm">
                                  <Map className="h-3 w-3 mr-1" />
                                  Ver en Mapa
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Brain className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-500 mb-4">No hay análisis disponible</p>
                      <Button onClick={() => refetchSector()}>
                        Generar Análisis Sociológico
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Demographics IA */}
          <TabsContent value="demographics">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Análisis Demográfico IA por Región
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="region">Seleccionar Región</Label>
                      <select 
                        id="region"
                        className="w-full p-2 border rounded-md"
                        value={selectedRegion}
                        onChange={(e) => setSelectedRegion(e.target.value)}
                      >
                        <option value="">Seleccione una región...</option>
                        <option value="Región Metropolitana">Región Metropolitana</option>
                        <option value="Valparaíso">Valparaíso</option>
                        <option value="Biobío">Biobío</option>
                        <option value="Araucanía">Araucanía</option>
                        <option value="Antofagasta">Antofagasta</option>
                      </select>
                    </div>

                    {selectedRegion && (
                      <Card className="bg-blue-50">
                        <CardContent className="p-4">
                          {demoLoading ? (
                            <div className="text-center py-6">
                              <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                              <p>Analizando demografía de {selectedRegion}...</p>
                            </div>
                          ) : demographicData ? (
                            <DemographicDisplay data={demographicData} />
                          ) : (
                            <p className="text-center text-gray-500">No hay datos disponibles</p>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Market Intelligence */}
          <TabsContent value="market-intelligence">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Inteligencia de Mercado IA
                </CardTitle>
              </CardHeader>
              <CardContent>
                <MarketIntelligenceDashboard />
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Consultant */}
          <TabsContent value="ai-consultant">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Consultor IA Sociológico
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AIConsultantInterface 
                  onQuery={(context, questions) => aiInsightsMutation.mutate({ context, questions })}
                  isLoading={aiInsightsMutation.isPending}
                  result={aiInsightsMutation.data}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Componentes auxiliares
function SectorDetailAnalysis({ 
  recommendation, 
  onAnalyze, 
  isAnalyzing, 
  analysisData 
}: { 
  recommendation: SectorRecommendation; 
  onAnalyze: (coords: { latitude: number; longitude: number }) => void;
  isAnalyzing: boolean;
  analysisData?: any;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="font-medium mb-2">Información Demográfica</h3>
          <div className="text-sm space-y-1">
            <div>Población: {recommendation.demographics.population.toLocaleString()}</div>
            <div>Educación: {recommendation.demographics.educationLevel}</div>
            <div>Desempleo: {recommendation.demographics.socialIndicators.unemploymentRate}%</div>
          </div>
        </div>
        <div>
          <h3 className="font-medium mb-2">Proyección de Ingresos</h3>
          <div className="text-sm space-y-1">
            <div>Mensual: ${recommendation.marketOpportunity.revenueProjection.toLocaleString()}</div>
            <div>Documentos: {recommendation.marketOpportunity.estimatedMonthlyDocuments}/mes</div>
            <div>ROI estimado: 6-12 meses</div>
          </div>
        </div>
      </div>

      <Button 
        onClick={() => onAnalyze(recommendation.coordinates)}
        disabled={isAnalyzing}
        className="w-full"
      >
        {isAnalyzing ? "Analizando..." : "Generar Análisis Profundo IA"}
      </Button>

      {analysisData && (
        <Card className="bg-green-50">
          <CardContent className="p-4">
            <h3 className="font-medium mb-2">Análisis IA Avanzado</h3>
            <div className="text-sm space-y-2">
              <div>Score de mercado: {analysisData.marketScore}/100</div>
              <div>Demanda estimada: {analysisData.estimatedDemand.monthly} docs/mes</div>
              <div>Impacto social: {analysisData.socialImpact.inclusionScore}/10</div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function DemographicDisplay({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold">{data.region}</h3>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <h4 className="font-medium text-blue-700">Indicadores Básicos</h4>
          <div className="text-sm space-y-1">
            <div>Población: {data.population.toLocaleString()}</div>
            <div>Ingresos: ${data.averageIncome.toLocaleString()}</div>
            <div>Educación: {data.educationLevel}</div>
          </div>
        </div>
        <div className="space-y-2">
          <h4 className="font-medium text-green-700">Indicadores Sociales</h4>
          <div className="text-sm space-y-1">
            <div>Pobreza: {data.socialIndicators.povertyRate}%</div>
            <div>Desempleo: {data.socialIndicators.unemploymentRate}%</div>
            <div>Alfabetización: {data.socialIndicators.literacyRate}%</div>
          </div>
        </div>
        <div className="space-y-2">
          <h4 className="font-medium text-purple-700">Demanda Legal</h4>
          <div className="text-sm space-y-1">
            <div>Mensual: {data.legalServiceDemand.monthly} docs</div>
            <div>Necesidades: {data.legalServiceDemand.unmetNeeds.join(", ")}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MarketIntelligenceDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <h3 className="font-medium">Crecimiento Proyectado</h3>
            </div>
            <div className="text-2xl font-bold text-green-600">+35%</div>
            <div className="text-xs text-gray-600">Próximos 12 meses</div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-blue-600" />
              <h3 className="font-medium">Mercado Objetivo</h3>
            </div>
            <div className="text-2xl font-bold text-blue-600">2.8M</div>
            <div className="text-xs text-gray-600">Usuarios potenciales</div>
          </CardContent>
        </Card>
        <Card className="bg-purple-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-purple-600" />
              <h3 className="font-medium">Ingresos Proyectados</h3>
            </div>
            <div className="text-2xl font-bold text-purple-600">$450M</div>
            <div className="text-xs text-gray-600">Año 1</div>
          </CardContent>
        </Card>
      </div>

      <Alert>
        <Lightbulb className="h-4 w-4" />
        <AlertDescription>
          <strong>Insight IA:</strong> Los sectores rurales muestran 60% mayor demanda insatisfecha de servicios legales digitales. 
          Recomendación: Priorizar expansión en comunas con menos de 50,000 habitantes.
        </AlertDescription>
      </Alert>
    </div>
  );
}

function AIConsultantInterface({ 
  onQuery, 
  isLoading, 
  result 
}: { 
  onQuery: (context: string, questions: string) => void;
  isLoading: boolean;
  result?: any;
}) {
  const [context, setContext] = useState("");
  const [questions, setQuestions] = useState("");

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="context">Contexto del Negocio</Label>
          <Textarea
            id="context"
            placeholder="Ej: Expansión de servicios legales digitales en zonas rurales..."
            value={context}
            onChange={(e) => setContext(e.target.value)}
            rows={3}
          />
        </div>
        <div>
          <Label htmlFor="questions">Preguntas Específicas</Label>
          <Textarea
            id="questions"
            placeholder="Ej: ¿Cuáles son las mejores estrategias de penetración de mercado?..."
            value={questions}
            onChange={(e) => setQuestions(e.target.value)}
            rows={3}
          />
        </div>
      </div>

      <Button 
        onClick={() => onQuery(context, questions)}
        disabled={isLoading || !context || !questions}
        className="w-full"
      >
        {isLoading ? "Consultando Agente IA..." : "Consultar Sociólogo IA"}
      </Button>

      {result && (
        <Card className="bg-gradient-to-r from-purple-50 to-indigo-50">
          <CardContent className="p-4">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Respuesta del Agente Sociólogo IA
            </h3>
            <div className="whitespace-pre-wrap text-sm">{result.insights}</div>
            {result.citations && result.citations.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <h4 className="font-medium text-xs mb-2">Fuentes:</h4>
                <div className="space-y-1">
                  {result.citations.map((citation: string, index: number) => (
                    <div key={index} className="text-xs text-blue-600 underline">
                      {citation}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { useGeolocation } from "../hooks/use-geolocation";
import { MapPin, DollarSign, TrendingDown, Building, Info, Calculator } from "lucide-react";

interface DynamicPricingProps {
  documentTypeId: number;
  documentTypeName: string;
  onPriceCalculated?: (price: number) => void;
  showRegionalComparison?: boolean;
}

interface PricingData {
  documentTypeId: number;
  documentTypeName: string;
  location: {
    latitude: number;
    longitude: number;
    region: string;
  };
  pricing: {
    basePrice: number;
    notaryPrice: number;
    discountedPrice: number;
    discountPercentage: number;
    competitiveAdvantage: number;
    region: string;
    priceJustification: string[];
  };
  marketContext: {
    localCompetition: string;
    economicContext: string;
    recommendations: string[];
  };
}

export function DynamicPricing({ 
  documentTypeId, 
  documentTypeName, 
  onPriceCalculated,
  showRegionalComparison = false 
}: DynamicPricingProps) {
  const [pricingData, setPricingData] = useState<PricingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { location, error: gpsError } = useGeolocation({ enableHighAccuracy: true });

  useEffect(() => {
    if (location && documentTypeId) {
      calculatePrice();
    }
  }, [location, documentTypeId]);

  const calculatePrice = async () => {
    if (!location) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/pricing/calculate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          latitude: location.latitude,
          longitude: location.longitude,
          documentTypeId
        }),
      });

      if (!response.ok) {
        throw new Error("Error calculando precio dinámico");
      }

      const data: PricingData = await response.json();
      setPricingData(data);
      
      if (onPriceCalculated) {
        onPriceCalculated(data.pricing.basePrice);
      }
    } catch (err) {
      setError("No se pudo calcular el precio para esta ubicación");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (gpsError) {
    return (
      <Alert className="border-yellow-200 bg-yellow-50">
        <Info className="h-4 w-4" />
        <AlertDescription>
          No se puede calcular precio dinámico sin ubicación GPS: {gpsError}
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
            <p className="text-sm text-muted-foreground">Obteniendo ubicación para calcular precio...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-l-4 border-l-green-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Precio Dinámico GPS
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="text-center py-4">
            <div className="animate-spin h-6 w-6 border-2 border-green-500 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Calculando precio según ubicación...</p>
          </div>
        )}

        {error && (
          <Alert className="border-red-200 bg-red-50">
            <Info className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {pricingData && (
          <div className="space-y-4">
            {/* Información de ubicación */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground border-b pb-2">
              <MapPin className="h-4 w-4" />
              <span>{pricingData.location.region}</span>
              <span className="text-xs">
                ({pricingData.location.latitude.toFixed(4)}, {pricingData.location.longitude.toFixed(4)})
              </span>
            </div>

            {/* Comparación de precios */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-1">
                  <Building className="h-4 w-4" />
                  Precio Notaría Local
                </h4>
                <div className="text-2xl font-bold text-gray-500 line-through">
                  ${pricingData.pricing.notaryPrice.toLocaleString()}
                </div>
                <p className="text-xs text-gray-600">Precio promedio regional</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-1">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  Precio VecinoXpress
                </h4>
                <div className="text-3xl font-bold text-green-600">
                  ${pricingData.pricing.basePrice.toLocaleString()}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <TrendingDown className="h-3 w-3 mr-1" />
                    {pricingData.pricing.discountPercentage}% menos
                  </Badge>
                  <span className="text-xs text-gray-600">
                    Ahorras ${(pricingData.pricing.notaryPrice - pricingData.pricing.basePrice).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Ventaja competitiva */}
            <Alert className="border-green-200 bg-green-50">
              <TrendingDown className="h-4 w-4" />
              <AlertDescription>
                <div className="font-semibold mb-2">
                  Ventaja Competitiva: {pricingData.pricing.competitiveAdvantage}% más económico
                </div>
                <div className="space-y-1">
                  {pricingData.pricing.priceJustification.slice(0, 3).map((justification, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <div className="h-1.5 w-1.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0"></div>
                      <span>{justification}</span>
                    </div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>

            {/* Contexto de mercado */}
            {showRegionalComparison && (
              <div className="border-t pt-4 space-y-3">
                <h4 className="font-medium">Contexto de Mercado Local</h4>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h5 className="font-medium text-blue-700 mb-1">Competencia Local</h5>
                    <p className="text-gray-600">{pricingData.marketContext.localCompetition}</p>
                  </div>
                  <div>
                    <h5 className="font-medium text-purple-700 mb-1">Contexto Económico</h5>
                    <p className="text-gray-600">{pricingData.marketContext.economicContext}</p>
                  </div>
                </div>
                
                {pricingData.marketContext.recommendations.length > 0 && (
                  <div>
                    <h5 className="font-medium text-orange-700 mb-2">Recomendaciones de Marketing</h5>
                    <div className="grid gap-1">
                      {pricingData.marketContext.recommendations.slice(0, 3).map((rec, index) => (
                        <div key={index} className="flex items-start gap-2 text-xs text-gray-600">
                          <div className="h-1 w-1 rounded-full bg-orange-500 mt-1.5 flex-shrink-0"></div>
                          <span>{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={calculatePrice}
              disabled={loading}
              className="w-full"
            >
              {loading ? "Recalculando..." : "Actualizar Precio"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Componente para mostrar precios de toda una región
export function RegionalPricingComparison({ latitude, longitude }: { latitude: number; longitude: number }) {
  const [regionalData, setRegionalData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (latitude && longitude) {
      fetchRegionalPricing();
    }
  }, [latitude, longitude]);

  const fetchRegionalPricing = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/pricing/region", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latitude, longitude }),
      });

      if (response.ok) {
        const data = await response.json();
        setRegionalData(data);
      }
    } catch (error) {
      console.error("Error fetching regional pricing:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p>Cargando precios regionales...</p>
        </CardContent>
      </Card>
    );
  }

  if (!regionalData) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Precios Regionales - {regionalData.region}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid gap-3">
            {regionalData.documentPrices.map((doc: any) => (
              <div key={doc.documentTypeId} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">{doc.documentTypeName}</h4>
                  <p className="text-sm text-gray-600">
                    {doc.pricing.discountPercentage}% menos que notarías
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-600">
                    ${doc.pricing.basePrice.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500 line-through">
                    ${doc.pricing.notaryPrice.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Oportunidad de Mercado:</strong> {regionalData.regionInfo.marketOpportunity}
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>
    </Card>
  );
}
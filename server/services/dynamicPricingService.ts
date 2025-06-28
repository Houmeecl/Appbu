import { validateChileanGPS } from "../utils/validation";

interface NotaryPrice {
  region: string;
  coordinates: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  averagePrices: {
    declaracionJurada: number;
    poderSimple: number;
    recibodinero: number;
    contrato: number;
    certificado: number;
  };
  competitionLevel: 'high' | 'medium' | 'low';
  economicLevel: 'high' | 'medium' | 'low';
  lastUpdated: Date;
}

interface DynamicPrice {
  basePrice: number;
  notaryPrice: number;
  discountedPrice: number;
  discountPercentage: number;
  competitiveAdvantage: number;
  region: string;
  priceJustification: string[];
}

interface PricingResponse {
  documentTypeId: number;
  documentTypeName: string;
  location: {
    latitude: number;
    longitude: number;
    region: string;
  };
  pricing: DynamicPrice;
  marketContext: {
    localCompetition: string;
    economicContext: string;
    recommendations: string[];
  };
  timestamp: string;
}

class DynamicPricingService {
  private readonly STANDARD_DISCOUNT = 0.20; // 20% descuento base
  private readonly MIN_PRICE = 5000; // Precio mínimo $5.000
  private readonly MAX_DISCOUNT = 0.35; // Máximo 35% descuento

  // Precios promedio de notarías por región (datos de mercado)
  private notaryPrices: NotaryPrice[] = [
    {
      region: "Región Metropolitana",
      coordinates: { north: -33.0, south: -34.0, east: -70.0, west: -71.5 },
      averagePrices: {
        declaracionJurada: 25000,
        poderSimple: 35000,
        recibodinero: 18000,
        contrato: 45000,
        certificado: 20000
      },
      competitionLevel: 'high',
      economicLevel: 'high',
      lastUpdated: new Date()
    },
    {
      region: "Valparaíso",
      coordinates: { north: -32.0, south: -34.0, east: -70.5, west: -72.0 },
      averagePrices: {
        declaracionJurada: 22000,
        poderSimple: 30000,
        recibodinero: 16000,
        contrato: 38000,
        certificado: 18000
      },
      competitionLevel: 'medium',
      economicLevel: 'medium',
      lastUpdated: new Date()
    },
    {
      region: "Biobío",
      coordinates: { north: -36.0, south: -38.5, east: -71.5, west: -74.0 },
      averagePrices: {
        declaracionJurada: 20000,
        poderSimple: 28000,
        recibodinero: 15000,
        contrato: 35000,
        certificado: 16000
      },
      competitionLevel: 'medium',
      economicLevel: 'medium',
      lastUpdated: new Date()
    },
    {
      region: "Araucanía",
      coordinates: { north: -37.5, south: -40.0, east: -71.0, west: -73.5 },
      averagePrices: {
        declaracionJurada: 18000,
        poderSimple: 25000,
        recibodinero: 14000,
        contrato: 30000,
        certificado: 15000
      },
      competitionLevel: 'low',
      economicLevel: 'low',
      lastUpdated: new Date()
    },
    {
      region: "Antofagasta",
      coordinates: { north: -22.0, south: -26.0, east: -68.0, west: -70.5 },
      averagePrices: {
        declaracionJurada: 24000,
        poderSimple: 32000,
        recibodinero: 17000,
        contrato: 40000,
        certificado: 19000
      },
      competitionLevel: 'low',
      economicLevel: 'high',
      lastUpdated: new Date()
    },
    {
      region: "Los Lagos",
      coordinates: { north: -40.0, south: -44.0, east: -71.5, west: -74.5 },
      averagePrices: {
        declaracionJurada: 19000,
        poderSimple: 26000,
        recibodinero: 14500,
        contrato: 32000,
        certificado: 16000
      },
      competitionLevel: 'low',
      economicLevel: 'medium',
      lastUpdated: new Date()
    }
  ];

  // Mapeo de tipos de documento
  private documentTypeMapping: Record<number, keyof NotaryPrice['averagePrices']> = {
    1: 'declaracionJurada', // Declaración Jurada Simple
    2: 'poderSimple',       // Poder Simple
    3: 'recibodinero',      // Recibo de Dinero
    4: 'contrato',          // Contrato
    5: 'certificado'        // Certificado
  };

  private documentTypeNames: Record<number, string> = {
    1: 'Declaración Jurada Simple',
    2: 'Poder Simple',
    3: 'Recibo de Dinero',
    4: 'Contrato Simple',
    5: 'Certificado'
  };

  async calculateDynamicPrice(
    latitude: number, 
    longitude: number, 
    documentTypeId: number
  ): Promise<PricingResponse> {
    
    // Validar coordenadas chilenas
    if (!validateChileanGPS(latitude, longitude)) {
      throw new Error("Coordenadas fuera del territorio chileno");
    }

    // Detectar región según GPS
    const regionData = this.detectRegion(latitude, longitude);
    if (!regionData) {
      throw new Error("No se pudo determinar la región para las coordenadas proporcionadas");
    }

    // Obtener tipo de documento
    const documentKey = this.documentTypeMapping[documentTypeId];
    const documentName = this.documentTypeNames[documentTypeId];
    
    if (!documentKey || !documentName) {
      throw new Error("Tipo de documento no válido");
    }

    // Calcular precio dinámico
    const pricing = this.calculateRegionalPricing(regionData, documentKey);
    
    // Generar contexto de mercado
    const marketContext = this.generateMarketContext(regionData, pricing);

    return {
      documentTypeId,
      documentTypeName: documentName,
      location: {
        latitude,
        longitude,
        region: regionData.region
      },
      pricing,
      marketContext,
      timestamp: new Date().toISOString()
    };
  }

  private detectRegion(latitude: number, longitude: number): NotaryPrice | null {
    for (const region of this.notaryPrices) {
      const { coordinates } = region;
      if (
        latitude <= coordinates.north &&
        latitude >= coordinates.south &&
        longitude >= coordinates.west &&
        longitude <= coordinates.east
      ) {
        return region;
      }
    }
    return null;
  }

  private calculateRegionalPricing(
    regionData: NotaryPrice, 
    documentKey: keyof NotaryPrice['averagePrices']
  ): DynamicPrice {
    
    const notaryPrice = regionData.averagePrices[documentKey];
    let discount = this.STANDARD_DISCOUNT;
    
    // Ajustar descuento según competencia y nivel económico
    if (regionData.competitionLevel === 'high') {
      discount += 0.05; // 5% adicional en zonas de alta competencia
    } else if (regionData.competitionLevel === 'low') {
      discount -= 0.03; // 3% menos en zonas de baja competencia
    }
    
    if (regionData.economicLevel === 'low') {
      discount += 0.08; // 8% adicional en zonas de menor poder adquisitivo
    } else if (regionData.economicLevel === 'high') {
      discount -= 0.02; // 2% menos en zonas de alto poder adquisitivo
    }
    
    // Limitar descuento máximo
    discount = Math.min(discount, this.MAX_DISCOUNT);
    
    // Calcular precio final
    const discountedPrice = Math.round(notaryPrice * (1 - discount));
    const finalPrice = Math.max(discountedPrice, this.MIN_PRICE);
    
    // Calcular ventaja competitiva real
    const actualDiscount = (notaryPrice - finalPrice) / notaryPrice;
    const competitiveAdvantage = Math.round(actualDiscount * 100);
    
    // Generar justificación del precio
    const priceJustification = this.generatePriceJustification(
      regionData, 
      discount, 
      competitiveAdvantage
    );

    return {
      basePrice: finalPrice,
      notaryPrice,
      discountedPrice: finalPrice,
      discountPercentage: Math.round(actualDiscount * 100),
      competitiveAdvantage,
      region: regionData.region,
      priceJustification
    };
  }

  private generatePriceJustification(
    regionData: NotaryPrice,
    appliedDiscount: number,
    competitiveAdvantage: number
  ): string[] {
    
    const justifications: string[] = [];
    
    // Justificación base
    justifications.push(`Precio ${competitiveAdvantage}% menor que notarías tradicionales`);
    
    // Justificación por ubicación
    switch (regionData.economicLevel) {
      case 'high':
        justifications.push("Ajustado para zona de alto poder adquisitivo");
        break;
      case 'low':
        justifications.push("Precio social para mejorar accesibilidad a servicios legales");
        break;
      default:
        justifications.push("Precio equilibrado para el mercado local");
    }
    
    // Justificación por competencia
    switch (regionData.competitionLevel) {
      case 'high':
        justifications.push("Precio competitivo en mercado saturado");
        break;
      case 'low':
        justifications.push("Precio de penetración de mercado");
        break;
      default:
        justifications.push("Precio estratégico para el mercado regional");
    }
    
    // Beneficios del servicio digital
    justifications.push("Incluye firma electrónica avanzada (FEA)");
    justifications.push("Proceso 100% digital sin desplazamientos");
    justifications.push("Disponible 24/7 con validación inmediata");
    
    return justifications;
  }

  private generateMarketContext(regionData: NotaryPrice, pricing: DynamicPrice) {
    let localCompetition = "";
    let economicContext = "";
    const recommendations: string[] = [];
    
    // Contexto de competencia
    switch (regionData.competitionLevel) {
      case 'high':
        localCompetition = "Alta densidad de notarías. Mercado competitivo requiere diferenciación por servicio y precio.";
        recommendations.push("Enfocar marketing en ventajas digitales");
        recommendations.push("Destacar disponibilidad 24/7");
        break;
      case 'medium':
        localCompetition = "Competencia moderada. Oportunidad de captar mercado con propuesta de valor clara.";
        recommendations.push("Posicionarse como alternativa moderna");
        recommendations.push("Crear alianzas con comercios locales");
        break;
      case 'low':
        localCompetition = "Baja competencia notarial. Oportunidad de ser el primer servicio digital en la zona.";
        recommendations.push("Educación sobre servicios legales digitales");
        recommendations.push("Marketing de penetración agresivo");
        break;
    }
    
    // Contexto económico
    switch (regionData.economicLevel) {
      case 'high':
        economicContext = "Zona de alto poder adquisitivo. Usuarios valoran conveniencia y rapidez.";
        recommendations.push("Enfatizar ahorro de tiempo");
        recommendations.push("Destacar seguridad y tecnología avanzada");
        break;
      case 'medium':
        economicContext = "Nivel económico medio. Balance entre precio y calidad es clave.";
        recommendations.push("Comunicar valor agregado del servicio");
        recommendations.push("Ofertas por volumen para empresas");
        break;
      case 'low':
        economicContext = "Zona de menor poder adquisitivo. Precio accesible es factor determinante.";
        recommendations.push("Destacar ahorro económico vs notarías");
        recommendations.push("Programas de pago diferido");
        recommendations.push("Alianzas con organizaciones sociales");
        break;
    }
    
    return {
      localCompetition,
      economicContext,
      recommendations
    };
  }

  // Método para obtener todos los precios de una región
  async getRegionalPricing(latitude: number, longitude: number): Promise<{
    region: string;
    location: { latitude: number; longitude: number };
    documentPrices: Array<{
      documentTypeId: number;
      documentTypeName: string;
      pricing: DynamicPrice;
    }>;
    regionInfo: {
      competitionLevel: string;
      economicLevel: string;
      marketOpportunity: string;
    };
  }> {
    
    const regionData = this.detectRegion(latitude, longitude);
    if (!regionData) {
      throw new Error("Región no encontrada para las coordenadas");
    }

    const documentPrices = [];
    
    // Calcular precios para todos los tipos de documento
    for (const [typeId, documentKey] of Object.entries(this.documentTypeMapping)) {
      const pricing = this.calculateRegionalPricing(regionData, documentKey);
      documentPrices.push({
        documentTypeId: parseInt(typeId),
        documentTypeName: this.documentTypeNames[parseInt(typeId)],
        pricing
      });
    }

    // Analizar oportunidad de mercado
    let marketOpportunity = "";
    if (regionData.competitionLevel === 'low' && regionData.economicLevel !== 'low') {
      marketOpportunity = "Excelente oportunidad - baja competencia y buen poder adquisitivo";
    } else if (regionData.competitionLevel === 'high') {
      marketOpportunity = "Mercado competitivo - diferenciación crucial";
    } else {
      marketOpportunity = "Oportunidad moderada - requiere estrategia específica";
    }

    return {
      region: regionData.region,
      location: { latitude, longitude },
      documentPrices,
      regionInfo: {
        competitionLevel: regionData.competitionLevel,
        economicLevel: regionData.economicLevel,
        marketOpportunity
      }
    };
  }

  // Método para actualizar precios de notarías (para administradores)
  async updateNotaryPrices(region: string, newPrices: Partial<NotaryPrice['averagePrices']>): Promise<void> {
    const regionIndex = this.notaryPrices.findIndex(r => r.region === region);
    
    if (regionIndex === -1) {
      throw new Error("Región no encontrada");
    }
    
    // Actualizar precios
    this.notaryPrices[regionIndex].averagePrices = {
      ...this.notaryPrices[regionIndex].averagePrices,
      ...newPrices
    };
    
    this.notaryPrices[regionIndex].lastUpdated = new Date();
    
    console.log(`Precios actualizados para ${region}:`, newPrices);
  }

  // Obtener estadísticas de precios para análisis
  getPricingStatistics(): {
    regions: number;
    averageDiscount: number;
    priceRange: { min: number; max: number };
    lastUpdate: Date;
  } {
    
    const allPrices = this.notaryPrices.flatMap(region => 
      Object.values(region.averagePrices)
    );
    
    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);
    
    return {
      regions: this.notaryPrices.length,
      averageDiscount: this.STANDARD_DISCOUNT * 100,
      priceRange: { min: minPrice, max: maxPrice },
      lastUpdate: new Date()
    };
  }
}

export const dynamicPricingService = new DynamicPricingService();
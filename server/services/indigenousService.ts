import { validateChileanGPS } from "../utils/validation";

interface IndigenousRegion {
  name: string;
  language: string;
  territory: string;
  coordinates: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  population: number;
  culturalInfo: string;
}

interface CulturalSuggestion {
  hasIndigenousCulture: boolean;
  cultureName?: string;
  language?: string;
  territory?: string;
  translationSuggestions?: string[];
  culturalContext?: string;
  legalDocumentRecommendations?: string[];
}

class IndigenousService {
  private indigenousRegions: IndigenousRegion[] = [
    {
      name: "Mapuche",
      language: "Mapudungun",
      territory: "Araucanía, Los Ríos, Los Lagos, Biobío",
      coordinates: { north: -36.0, south: -42.0, east: -71.0, west: -75.0 },
      population: 1745147,
      culturalInfo: "Pueblo originario más numeroso de Chile. Territorio tradicional desde el río Biobío al sur."
    },
    {
      name: "Aymara",
      language: "Aymara",
      territory: "Región de Arica y Parinacota, Tarapacá",
      coordinates: { north: -17.5, south: -21.0, east: -68.0, west: -70.5 },
      population: 156754,
      culturalInfo: "Pueblo andino del altiplano. Territorio ancestral en el norte de Chile."
    },
    {
      name: "Quechua",
      language: "Quechua",
      territory: "Región de Antofagasta, Atacama",
      coordinates: { north: -22.0, south: -28.0, east: -67.0, west: -70.0 },
      population: 33868,
      culturalInfo: "Comunidades quechuas en valles y quebradas del norte."
    },
    {
      name: "Atacameño",
      language: "Kunza",
      territory: "Región de Antofagasta",
      coordinates: { north: -22.0, south: -25.0, east: -67.0, west: -69.0 },
      population: 21015,
      culturalInfo: "Pueblo del desierto de Atacama. Lengua kunza ancestral."
    },
    {
      name: "Diaguita",
      language: "Kakán",
      territory: "Región de Atacama, Coquimbo",
      coordinates: { north: -26.0, south: -32.0, east: -69.0, west: -71.5 },
      population: 88474,
      culturalInfo: "Pueblo del norte chico. Reconocimiento legal en 2006."
    },
    {
      name: "Rapanui",
      language: "Rapanui",
      territory: "Isla de Pascua",
      coordinates: { north: -27.0, south: -27.3, east: -109.2, west: -109.5 },
      population: 9399,
      culturalInfo: "Pueblo polinésico de Rapa Nui (Isla de Pascua)."
    },
    {
      name: "Kawésqar",
      language: "Kawésqar",
      territory: "Región de Magallanes",
      coordinates: { north: -48.0, south: -54.0, east: -73.0, west: -75.0 },
      population: 3448,
      culturalInfo: "Nómadas marinos de los canales patagónicos."
    },
    {
      name: "Yagán",
      language: "Yagán",
      territory: "Región de Magallanes",
      coordinates: { north: -54.0, south: -56.0, east: -67.0, west: -71.0 },
      population: 1600,
      culturalInfo: "Pueblo canoero del extremo sur de Chile."
    }
  ];

  async detectIndigenousCulture(latitude: number, longitude: number): Promise<CulturalSuggestion> {
    if (!validateChileanGPS(latitude, longitude)) {
      return {
        hasIndigenousCulture: false,
        culturalContext: "Ubicación fuera del territorio chileno"
      };
    }

    const detectedRegions = this.indigenousRegions.filter(region => {
      return latitude <= region.coordinates.north &&
             latitude >= region.coordinates.south &&
             longitude >= region.coordinates.west &&
             longitude <= region.coordinates.east;
    });

    if (detectedRegions.length === 0) {
      return {
        hasIndigenousCulture: false,
        culturalContext: "No se detectaron territorios indígenas en esta ubicación"
      };
    }

    // Usar la región con mayor población si hay múltiples
    const primaryRegion = detectedRegions.reduce((prev, current) => 
      prev.population > current.population ? prev : current
    );

    return {
      hasIndigenousCulture: true,
      cultureName: primaryRegion.name,
      language: primaryRegion.language,
      territory: primaryRegion.territory,
      culturalContext: primaryRegion.culturalInfo,
      translationSuggestions: this.generateTranslationSuggestions(primaryRegion),
      legalDocumentRecommendations: this.generateLegalRecommendations(primaryRegion)
    };
  }

  private generateTranslationSuggestions(region: IndigenousRegion): string[] {
    const suggestions = [
      `Traducir documento a ${region.language}`,
      `Incluir términos legales en ${region.language}`,
      `Agregar explicación cultural del documento`,
      `Considerar cosmovisión ${region.name} en redacción`
    ];

    // Sugerencias específicas por pueblo
    switch (region.name) {
      case "Mapuche":
        suggestions.push(
          "Incluir concepto de 'trawün' (reunión/acuerdo)",
          "Mencionar territorio ancestral 'wallmapu'",
          "Considerar autoridades tradicionales (lonko, machi)"
        );
        break;
      case "Aymara":
        suggestions.push(
          "Incluir concepto de 'ayni' (reciprocidad)",
          "Mencionar territorio 'suyu'",
          "Considerar calendario andino"
        );
        break;
      case "Rapanui":
        suggestions.push(
          "Incluir concepto de 'mata fenua' (clan territorial)",
          "Mencionar 'tangata manu' (autoridad)",
          "Considerar tradiciones polinésicas"
        );
        break;
    }

    return suggestions;
  }

  private generateLegalRecommendations(region: IndigenousRegion): string[] {
    return [
      `Aplicar Convenio 169 OIT para pueblo ${region.name}`,
      "Considerar consulta previa e informada",
      "Incluir protocolos culturalmente apropiados",
      "Mencionar derechos territoriales ancestrales",
      "Aplicar Ley Indígena 19.253",
      `Coordinar con CONADI para territorio ${region.territory}`
    ];
  }

  async getDetailedCulturalInfo(cultureName: string, latitude: number, longitude: number): Promise<any> {
    // Esta función se conectaría con Perplexity API para obtener información detallada
    // Por ahora retorna información básica
    const region = this.indigenousRegions.find(r => r.name === cultureName);
    
    if (!region) {
      return null;
    }

    return {
      basicInfo: region,
      gpsCoordinates: { latitude, longitude },
      detectedAt: new Date().toISOString(),
      recommendedActions: [
        "Contactar dirigentes locales",
        "Revisar protocolos culturales",
        "Validar terminología apropiada",
        "Considerar mediador intercultural"
      ]
    };
  }

  getAvailableLanguages(): string[] {
    const uniqueLanguages = new Set(this.indigenousRegions.map(r => r.language));
    return Array.from(uniqueLanguages);
  }

  getRegionsByLanguage(language: string): IndigenousRegion[] {
    return this.indigenousRegions.filter(r => r.language === language);
  }
}

export const indigenousService = new IndigenousService();
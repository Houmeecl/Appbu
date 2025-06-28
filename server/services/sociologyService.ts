import { perplexityService } from "./perplexityService";

interface DemographicData {
  region: string;
  population: number;
  averageIncome: number;
  educationLevel: string;
  urbanRural: 'urban' | 'rural' | 'mixed';
  ageDistribution: {
    youth: number; // 15-29
    adults: number; // 30-59
    seniors: number; // 60+
  };
  economicActivity: string[];
  socialIndicators: {
    povertyRate: number;
    unemploymentRate: number;
    literacyRate: number;
  };
  legalDocumentDemand: {
    common: string[];
    seasonal: string[];
    emergingNeeds: string[];
  };
}

interface SectorRecommendation {
  location: string;
  coordinates: { latitude: number; longitude: number };
  score: number; // 1-100
  reasons: string[];
  demographics: DemographicData;
  marketOpportunity: {
    estimatedMonthlyDocuments: number;
    revenueProjection: number;
    competitionLevel: 'low' | 'medium' | 'high';
    marketGap: string[];
  };
  socialImpact: {
    accessibilityImprovement: string;
    communityBenefit: string;
    inclusionFactor: number; // 1-10
  };
  implementationPlan: {
    priority: 'high' | 'medium' | 'low';
    timeframe: string;
    requiredResources: string[];
    challenges: string[];
  };
}

interface SociologicalAnalysis {
  recommendations: SectorRecommendation[];
  overallInsights: {
    marketTrends: string[];
    socialNeeds: string[];
    technologicalReadiness: string;
    regulatoryConsiderations: string[];
  };
  timestamp: string;
}

class SociologyService {
  private chileanRegions: DemographicData[] = [
    {
      region: "Región Metropolitana",
      population: 8125072,
      averageIncome: 850000,
      educationLevel: "Superior",
      urbanRural: "urban",
      ageDistribution: { youth: 25, adults: 55, seniors: 20 },
      economicActivity: ["Servicios", "Comercio", "Industria", "Tecnología"],
      socialIndicators: { povertyRate: 8.5, unemploymentRate: 7.2, literacyRate: 98.9 },
      legalDocumentDemand: {
        common: ["Poder Simple", "Declaración Jurada", "Recibo de Dinero"],
        seasonal: ["Contratos laborales", "Documentos académicos"],
        emergingNeeds: ["Firmas digitales", "Documentos remotos"]
      }
    },
    {
      region: "Valparaíso",
      population: 1960170,
      averageIncome: 650000,
      educationLevel: "Media",
      urbanRural: "mixed",
      ageDistribution: { youth: 22, adults: 58, seniors: 20 },
      economicActivity: ["Puerto", "Turismo", "Agricultura", "Pesca"],
      socialIndicators: { povertyRate: 12.3, unemploymentRate: 8.5, literacyRate: 97.8 },
      legalDocumentDemand: {
        common: ["Poder Simple", "Certificados", "Contratos"],
        seasonal: ["Documentos turísticos", "Contratos temporales"],
        emergingNeeds: ["Documentos portuarios", "Certificaciones digitales"]
      }
    },
    {
      region: "Biobío",
      population: 1663696,
      averageIncome: 580000,
      educationLevel: "Media",
      urbanRural: "mixed",
      ageDistribution: { youth: 24, adults: 56, seniors: 20 },
      economicActivity: ["Forestal", "Agricultura", "Pesca", "Industria"],
      socialIndicators: { povertyRate: 15.2, unemploymentRate: 9.1, literacyRate: 96.5 },
      legalDocumentDemand: {
        common: ["Poder Simple", "Declaración Jurada", "Contratos rurales"],
        seasonal: ["Documentos agrícolas", "Contratos forestales"],
        emergingNeeds: ["Certificaciones ambientales", "Documentos cooperativas"]
      }
    },
    {
      region: "Araucanía",
      population: 1014343,
      averageIncome: 520000,
      educationLevel: "Media",
      urbanRural: "rural",
      ageDistribution: { youth: 26, adults: 54, seniors: 20 },
      economicActivity: ["Agricultura", "Ganadería", "Turismo", "Forestal"],
      socialIndicators: { povertyRate: 22.1, unemploymentRate: 10.8, literacyRate: 94.2 },
      legalDocumentDemand: {
        common: ["Poder Simple", "Declaración Jurada", "Documentos agrícolas"],
        seasonal: ["Contratos temporales", "Documentos turísticos"],
        emergingNeeds: ["Documentos interculturales", "Certificaciones mapuche"]
      }
    },
    {
      region: "Antofagasta",
      population: 691854,
      averageIncome: 950000,
      educationLevel: "Superior",
      urbanRural: "urban",
      ageDistribution: { youth: 28, adults: 60, seniors: 12 },
      economicActivity: ["Minería", "Servicios", "Comercio", "Logística"],
      socialIndicators: { povertyRate: 6.8, unemploymentRate: 6.2, literacyRate: 99.1 },
      legalDocumentDemand: {
        common: ["Poder Simple", "Contratos laborales", "Documentos mineros"],
        seasonal: ["Contratos construcción", "Documentos técnicos"],
        emergingNeeds: ["Certificaciones mineras", "Documentos ambientales"]
      }
    }
  ];

  async analyzeSectorOpportunities(currentPosLocations?: Array<{latitude: number, longitude: number}>): Promise<SociologicalAnalysis> {
    const recommendations: SectorRecommendation[] = [];

    // Analizar cada región
    for (const region of this.chileanRegions) {
      const recommendation = await this.evaluateRegion(region, currentPosLocations);
      recommendations.push(recommendation);
    }

    // Ordenar por score
    recommendations.sort((a, b) => b.score - a.score);

    // Generar insights generales con IA si está disponible
    const overallInsights = await this.generateOverallInsights(recommendations);

    return {
      recommendations: recommendations.slice(0, 5), // Top 5 recomendaciones
      overallInsights,
      timestamp: new Date().toISOString()
    };
  }

  private async evaluateRegion(demographics: DemographicData, existingPos?: Array<{latitude: number, longitude: number}>): Promise<SectorRecommendation> {
    // Calcular score basado en múltiples factores
    let score = 0;

    // Factor demográfico (30%)
    const populationScore = Math.min(demographics.population / 1000000 * 20, 30);
    score += populationScore;

    // Factor económico (25%)
    const incomeScore = Math.min(demographics.averageIncome / 50000, 25);
    score += incomeScore;

    // Factor de necesidad social (20%)
    const needScore = this.calculateSocialNeed(demographics);
    score += needScore;

    // Factor de competencia (15%)
    const competitionScore = this.calculateCompetitionScore(demographics, existingPos);
    score += competitionScore;

    // Factor de accesibilidad (10%)
    const accessibilityScore = this.calculateAccessibilityScore(demographics);
    score += accessibilityScore;

    const marketOpportunity = this.calculateMarketOpportunity(demographics);
    const socialImpact = this.calculateSocialImpact(demographics);
    const implementationPlan = this.createImplementationPlan(demographics, score);

    return {
      location: demographics.region,
      coordinates: this.getRegionCoordinates(demographics.region),
      score: Math.round(score),
      reasons: this.generateRecommendationReasons(demographics, score),
      demographics,
      marketOpportunity,
      socialImpact,
      implementationPlan
    };
  }

  private calculateSocialNeed(demographics: DemographicData): number {
    let needScore = 0;
    
    // Mayor pobreza = mayor necesidad de acceso a servicios legales
    needScore += (demographics.socialIndicators.povertyRate / 25) * 8;
    
    // Menor nivel educativo = mayor necesidad de asesoría
    if (demographics.educationLevel === "Básica") needScore += 6;
    else if (demographics.educationLevel === "Media") needScore += 4;
    else needScore += 2;
    
    // Zonas rurales tienen menor acceso
    if (demographics.urbanRural === "rural") needScore += 6;
    else if (demographics.urbanRural === "mixed") needScore += 3;
    
    return Math.min(needScore, 20);
  }

  private calculateCompetitionScore(demographics: DemographicData, existingPos?: Array<{latitude: number, longitude: number}>): number {
    // Si hay menos POS existentes, mayor oportunidad
    let competitionScore = 15;
    
    if (existingPos && existingPos.length > 0) {
      const regionCoords = this.getRegionCoordinates(demographics.region);
      const nearbyPos = existingPos.filter(pos => {
        const distance = this.calculateDistance(regionCoords, pos);
        return distance < 100; // 100km radius
      });
      
      competitionScore -= Math.min(nearbyPos.length * 3, 10);
    }
    
    return Math.max(competitionScore, 5);
  }

  private calculateAccessibilityScore(demographics: DemographicData): number {
    let accessScore = 0;
    
    // Población joven y adulta mayor capacidad de adopción tecnológica
    accessScore += (demographics.ageDistribution.youth + demographics.ageDistribution.adults) / 10;
    
    // Mayor alfabetización = mejor adopción
    accessScore += (demographics.socialIndicators.literacyRate - 90) / 2;
    
    return Math.min(accessScore, 10);
  }

  private calculateMarketOpportunity(demographics: DemographicData): any {
    const baseDocuments = demographics.population / 1000; // 1 documento por 1000 habitantes/mes
    const incomeMultiplier = demographics.averageIncome / 600000; // Factor de ingreso
    
    const estimatedMonthlyDocuments = Math.round(baseDocuments * incomeMultiplier);
    const averageDocumentPrice = 15000; // $15.000 promedio
    const revenueProjection = estimatedMonthlyDocuments * averageDocumentPrice;
    
    let competitionLevel: 'low' | 'medium' | 'high' = 'medium';
    if (demographics.urbanRural === 'rural') competitionLevel = 'low';
    else if (demographics.region === 'Región Metropolitana') competitionLevel = 'high';
    
    const marketGap = this.identifyMarketGaps(demographics);
    
    return {
      estimatedMonthlyDocuments,
      revenueProjection,
      competitionLevel,
      marketGap
    };
  }

  private calculateSocialImpact(demographics: DemographicData): any {
    const accessibilityImprovement = this.getAccessibilityImprovement(demographics);
    const communityBenefit = this.getCommunityBenefit(demographics);
    
    let inclusionFactor = 5;
    if (demographics.socialIndicators.povertyRate > 15) inclusionFactor += 3;
    if (demographics.urbanRural === 'rural') inclusionFactor += 2;
    
    return {
      accessibilityImprovement,
      communityBenefit,
      inclusionFactor: Math.min(inclusionFactor, 10)
    };
  }

  private createImplementationPlan(demographics: DemographicData, score: number): any {
    let priority: 'high' | 'medium' | 'low' = 'medium';
    if (score > 70) priority = 'high';
    else if (score < 50) priority = 'low';
    
    const timeframe = priority === 'high' ? '3-6 meses' : priority === 'medium' ? '6-12 meses' : '12-18 meses';
    
    const requiredResources = [
      'Terminal POS',
      'Capacitación local',
      'Marketing dirigido',
      'Soporte técnico'
    ];
    
    const challenges = this.identifyChallenges(demographics);
    
    return {
      priority,
      timeframe,
      requiredResources,
      challenges
    };
  }

  private async generateOverallInsights(recommendations: SectorRecommendation[]): Promise<any> {
    const insights = {
      marketTrends: [
        "Creciente demanda de servicios legales digitales",
        "Mayor adopción en zonas urbanas y semi-urbanas",
        "Necesidad de accesibilidad en zonas rurales",
        "Oportunidades en sectores económicos específicos"
      ],
      socialNeeds: [
        "Reducir brecha de acceso a servicios legales",
        "Mejorar inclusión digital en comunidades rurales",
        "Facilitar trámites para población vulnerable",
        "Promover formalización de actividades económicas"
      ],
      technologicalReadiness: "Nivel medio-alto en zonas urbanas, requerirá capacitación en zonas rurales",
      regulatoryConsiderations: [
        "Cumplimiento Ley Indígena en territorios originarios",
        "Adaptación a normativas locales específicas",
        "Coordinación con servicios públicos regionales",
        "Implementación de protocolos de privacidad"
      ]
    };

    // Si hay API de Perplexity, enriquecer con análisis IA
    if (process.env.PERPLEXITY_API_KEY) {
      try {
        const aiInsights = await this.getAIInsights(recommendations);
        return { ...insights, aiEnhancedInsights: aiInsights };
      } catch (error) {
        console.log("AI insights no disponibles, usando análisis local");
      }
    }

    return insights;
  }

  private async getAIInsights(recommendations: SectorRecommendation[]): Promise<any> {
    const prompt = `Como sociólogo experto en desarrollo territorial chileno, analiza estas recomendaciones de ubicación para servicios legales digitales:

${recommendations.map(r => `- ${r.location}: Score ${r.score}, Población ${r.demographics.population}, Ingresos ${r.demographics.averageIncome}`).join('\n')}

Proporciona insights sobre:
1. Tendencias socioeconómicas relevantes
2. Factores de éxito para implementación
3. Consideraciones de impacto social
4. Estrategias de penetración de mercado

Enfócate en el contexto sociológico y demográfico chileno.`;

    try {
      const response = await fetch("https://api.perplexity.ai/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.1-sonar-small-128k-online",
          messages: [
            {
              role: "system",
              content: "Eres un sociólogo experto en desarrollo territorial y demografía chilena."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          max_tokens: 800,
          temperature: 0.3
        })
      });

      if (response.ok) {
        const data = await response.json();
        return {
          analysis: data.choices[0]?.message?.content || "",
          citations: data.citations || []
        };
      }
    } catch (error) {
      console.error("Error obteniendo insights IA:", error);
    }

    return null;
  }

  // Métodos auxiliares
  private getRegionCoordinates(region: string): { latitude: number; longitude: number } {
    const coordinates: Record<string, { latitude: number; longitude: number }> = {
      "Región Metropolitana": { latitude: -33.4489, longitude: -70.6693 },
      "Valparaíso": { latitude: -33.0472, longitude: -71.6127 },
      "Biobío": { latitude: -37.4689, longitude: -72.3527 },
      "Araucanía": { latitude: -38.9489, longitude: -72.3311 },
      "Antofagasta": { latitude: -23.6509, longitude: -70.3975 }
    };
    
    return coordinates[region] || { latitude: -33.4489, longitude: -70.6693 };
  }

  private calculateDistance(coord1: {latitude: number, longitude: number}, coord2: {latitude: number, longitude: number}): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (coord2.latitude - coord1.latitude) * Math.PI / 180;
    const dLon = (coord2.longitude - coord1.longitude) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(coord1.latitude * Math.PI / 180) * Math.cos(coord2.latitude * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private generateRecommendationReasons(demographics: DemographicData, score: number): string[] {
    const reasons: string[] = [];
    
    if (demographics.population > 1000000) {
      reasons.push(`Gran mercado potencial con ${demographics.population.toLocaleString()} habitantes`);
    }
    
    if (demographics.averageIncome > 700000) {
      reasons.push("Alto poder adquisitivo de la población");
    }
    
    if (demographics.socialIndicators.povertyRate > 15) {
      reasons.push("Alta necesidad social de servicios legales accesibles");
    }
    
    if (demographics.urbanRural === 'rural') {
      reasons.push("Baja cobertura actual de servicios legales digitales");
    }
    
    if (demographics.economicActivity.includes("Minería") || demographics.economicActivity.includes("Industria")) {
      reasons.push("Sector económico con alta demanda de documentación legal");
    }
    
    return reasons;
  }

  private identifyMarketGaps(demographics: DemographicData): string[] {
    const gaps: string[] = [];
    
    if (demographics.urbanRural === 'rural') {
      gaps.push("Servicios legales digitales en zonas rurales");
    }
    
    if (demographics.legalDocumentDemand.emergingNeeds.length > 0) {
      gaps.push("Documentos especializados para sector económico local");
    }
    
    if (demographics.socialIndicators.povertyRate > 15) {
      gaps.push("Servicios legales a precios accesibles");
    }
    
    return gaps;
  }

  private getAccessibilityImprovement(demographics: DemographicData): string {
    if (demographics.urbanRural === 'rural') {
      return "Mejora significativa del acceso a servicios legales en zonas rurales";
    } else if (demographics.socialIndicators.povertyRate > 15) {
      return "Mayor accesibilidad económica a servicios legales";
    } else {
      return "Modernización y agilización de trámites legales";
    }
  }

  private getCommunityBenefit(demographics: DemographicData): string {
    const activities = demographics.economicActivity.join(", ");
    return `Fortalecimiento del desarrollo económico local en sectores de ${activities}`;
  }

  private identifyChallenges(demographics: DemographicData): string[] {
    const challenges: string[] = [];
    
    if (demographics.urbanRural === 'rural') {
      challenges.push("Conectividad limitada a internet");
      challenges.push("Menor familiaridad con tecnología digital");
    }
    
    if (demographics.socialIndicators.literacyRate < 95) {
      challenges.push("Necesidad de capacitación en uso de tecnología");
    }
    
    if (demographics.socialIndicators.povertyRate > 15) {
      challenges.push("Sensibilidad al precio de los servicios");
    }
    
    challenges.push("Competencia con notarías tradicionales");
    
    return challenges;
  }
}

export const sociologyService = new SociologyService();
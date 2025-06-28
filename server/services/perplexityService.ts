interface PerplexityResponse {
  id: string;
  model: string;
  object: string;
  created: number;
  citations: string[];
  choices: Array<{
    index: number;
    finish_reason: string;
    message: {
      role: string;
      content: string;
    };
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface CulturalAnalysis {
  hasIndigenousCulture: boolean;
  cultureName?: string;
  language?: string;
  culturalContext?: string;
  translationRecommendations?: string[];
  legalConsiderations?: string[];
  citations?: string[];
}

class PerplexityService {
  private apiKey: string;
  private baseUrl = "https://api.perplexity.ai/chat/completions";
  
  constructor() {
    this.apiKey = process.env.PERPLEXITY_API_KEY || "";
  }

  async analyzeCulturalContext(latitude: number, longitude: number, documentType: string): Promise<CulturalAnalysis> {
    if (!this.apiKey) {
      throw new Error("PERPLEXITY_API_KEY no está configurado");
    }

    const prompt = this.buildCulturalAnalysisPrompt(latitude, longitude, documentType);
    
    try {
      const response = await this.makeRequest(prompt);
      return this.parseCulturalResponse(response);
    } catch (error) {
      console.error("Error en análisis cultural Perplexity:", error);
      throw new Error("No se pudo obtener análisis cultural");
    }
  }

  async getTranslationSuggestions(cultureName: string, documentContent: string): Promise<{
    translations: string[];
    culturalAdaptations: string[];
    citations: string[];
  }> {
    if (!this.apiKey) {
      throw new Error("PERPLEXITY_API_KEY no está configurado");
    }

    const prompt = `Como experto en culturas indígenas chilenas y traducción legal, analiza este documento legal para la cultura ${cultureName}:

"${documentContent.substring(0, 500)}..."

Proporciona:
1. Sugerencias específicas de traducción a la lengua indígena
2. Adaptaciones culturales necesarias para el documento
3. Términos legales que requieren explicación cultural
4. Protocolos culturalmente apropiados para la firma

Responde en formato JSON estructurado.`;

    try {
      const response = await this.makeRequest(prompt);
      return this.parseTranslationResponse(response);
    } catch (error) {
      console.error("Error en sugerencias de traducción:", error);
      throw new Error("No se pudieron obtener sugerencias de traducción");
    }
  }

  private buildCulturalAnalysisPrompt(latitude: number, longitude: number, documentType: string): string {
    return `Como experto en pueblos indígenas de Chile y legislación intercultural, analiza las coordenadas GPS ${latitude}, ${longitude} para determinar:

1. ¿Existe presencia de culturas indígenas en esta ubicación específica de Chile?
2. ¿Qué pueblo(s) indígena(s) habita(n) tradicionalmente esta zona?
3. ¿Qué lengua(s) indígena(s) se habla(n) en esta región?
4. Para un documento legal tipo "${documentType}", ¿qué consideraciones culturales son necesarias?
5. ¿Qué traducciones o adaptaciones se recomiendan según el Convenio 169 OIT?
6. ¿Qué protocolos legales especiales aplican según la Ley Indígena 19.253?

Proporciona información específica, actualizada y geográficamente precisa sobre Chile.`;
  }

  private async makeRequest(prompt: string): Promise<PerplexityResponse> {
    const response = await fetch(this.baseUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-sonar-small-128k-online",
        messages: [
          {
            role: "system",
            content: "Eres un experto en culturas indígenas chilenas, legislación intercultural y traducción legal. Proporciona información precisa y actualizada."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.2,
        top_p: 0.9,
        search_domain_filter: ["conadi.gob.cl", "uchile.cl", "mineduc.cl"],
        return_images: false,
        return_related_questions: false,
        search_recency_filter: "month",
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`Error de API Perplexity: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  private parseCulturalResponse(response: PerplexityResponse): CulturalAnalysis {
    const content = response.choices[0]?.message?.content || "";
    const citations = response.citations || [];

    // Análisis básico del contenido de respuesta
    const hasIndigenousCulture = this.detectIndigenousPresence(content);
    const cultureName = this.extractCultureName(content);
    const language = this.extractLanguage(content);

    return {
      hasIndigenousCulture,
      cultureName,
      language,
      culturalContext: content,
      translationRecommendations: this.extractTranslationRecommendations(content),
      legalConsiderations: this.extractLegalConsiderations(content),
      citations
    };
  }

  private parseTranslationResponse(response: PerplexityResponse): {
    translations: string[];
    culturalAdaptations: string[];
    citations: string[];
  } {
    const content = response.choices[0]?.message?.content || "";
    const citations = response.citations || [];

    return {
      translations: this.extractTranslations(content),
      culturalAdaptations: this.extractCulturalAdaptations(content),
      citations
    };
  }

  private detectIndigenousPresence(content: string): boolean {
    const indigenousKeywords = [
      "mapuche", "aymara", "quechua", "atacameño", "diaguita", 
      "rapanui", "kawésqar", "yagán", "pueblo indígena", 
      "cultura originaria", "territorio ancestral"
    ];
    
    return indigenousKeywords.some(keyword => 
      content.toLowerCase().includes(keyword)
    );
  }

  private extractCultureName(content: string): string | undefined {
    const cultures = [
      "mapuche", "aymara", "quechua", "atacameño", "diaguita", 
      "rapanui", "kawésqar", "yagán"
    ];
    
    for (const culture of cultures) {
      if (content.toLowerCase().includes(culture)) {
        return culture.charAt(0).toUpperCase() + culture.slice(1);
      }
    }
    
    return undefined;
  }

  private extractLanguage(content: string): string | undefined {
    const languages = [
      "mapudungun", "aymara", "quechua", "kunza", "kakán", 
      "rapanui", "kawésqar", "yagán"
    ];
    
    for (const language of languages) {
      if (content.toLowerCase().includes(language)) {
        return language.charAt(0).toUpperCase() + language.slice(1);
      }
    }
    
    return undefined;
  }

  private extractTranslationRecommendations(content: string): string[] {
    const recommendations: string[] = [];
    
    if (content.includes("traducir") || content.includes("traducción")) {
      recommendations.push("Considerar traducción a lengua indígena");
    }
    
    if (content.includes("adaptación cultural")) {
      recommendations.push("Realizar adaptaciones culturales del documento");
    }
    
    if (content.includes("protocolo")) {
      recommendations.push("Seguir protocolos culturalmente apropiados");
    }
    
    return recommendations;
  }

  private extractLegalConsiderations(content: string): string[] {
    const considerations: string[] = [];
    
    if (content.includes("Convenio 169") || content.includes("OIT")) {
      considerations.push("Aplicar Convenio 169 OIT sobre consulta previa");
    }
    
    if (content.includes("Ley 19.253") || content.includes("Ley Indígena")) {
      considerations.push("Cumplir con Ley Indígena 19.253");
    }
    
    if (content.includes("CONADI")) {
      considerations.push("Coordinar con CONADI para territorio indígena");
    }
    
    return considerations;
  }

  private extractTranslations(content: string): string[] {
    // Extraer sugerencias de traducción del contenido
    const lines = content.split('\n');
    return lines.filter(line => 
      line.includes('traducir') || 
      line.includes('traducción') || 
      line.includes('término')
    ).slice(0, 5);
  }

  private extractCulturalAdaptations(content: string): string[] {
    // Extraer adaptaciones culturales del contenido
    const lines = content.split('\n');
    return lines.filter(line => 
      line.includes('adaptación') || 
      line.includes('protocolo') || 
      line.includes('cultural')
    ).slice(0, 5);
  }
}

export const perplexityService = new PerplexityService();
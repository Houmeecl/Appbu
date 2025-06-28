import { db } from "../db";
import { documents, posTerminals, auditLog } from "@shared/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { pdfService } from "./pdfService";

interface CommissionCalculation {
  posTerminalId: number;
  terminalName: string;
  period: {
    startDate: Date;
    endDate: Date;
    weekNumber: number;
    year: number;
  };
  transactions: {
    totalDocuments: number;
    totalRevenue: number;
    commission: number;
    commissionRate: number;
  };
  documentBreakdown: Array<{
    documentType: string;
    count: number;
    revenue: number;
    commission: number;
  }>;
  weeklyGrowth: {
    documentsVsPreviousWeek: number;
    revenueVsPreviousWeek: number;
  };
  performance: {
    dailyAverage: number;
    bestDay: {
      date: string;
      documents: number;
      revenue: number;
    };
    trends: string[];
  };
}

interface WeeklyStatement {
  id: string;
  posTerminalId: number;
  weekStartDate: Date;
  weekEndDate: Date;
  calculation: CommissionCalculation;
  pdfUrl?: string;
  generatedAt: Date;
  status: 'generated' | 'sent' | 'paid';
  aiInsights: {
    performanceAnalysis: string;
    recommendations: string[];
    marketTrends: string;
  };
}

class CommissionService {
  private readonly COMMISSION_RATE = 0.12; // 12%

  async calculateWeeklyCommissions(weekStartDate?: Date): Promise<CommissionCalculation[]> {
    const startDate = weekStartDate || this.getWeekStart(new Date());
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);

    const terminals = await db.select().from(posTerminals).where(eq(posTerminals.isActive, true));
    const calculations: CommissionCalculation[] = [];

    for (const terminal of terminals) {
      const calculation = await this.calculateTerminalCommission(terminal.id, startDate, endDate);
      calculations.push(calculation);
    }

    return calculations;
  }

  private async calculateTerminalCommission(
    posTerminalId: number, 
    startDate: Date, 
    endDate: Date
  ): Promise<CommissionCalculation> {
    // Obtener información del terminal
    const [terminal] = await db
      .select()
      .from(posTerminals)
      .where(eq(posTerminals.id, posTerminalId));

    // Obtener documentos del período
    const weekDocuments = await db
      .select({
        id: documents.id,
        typeId: documents.typeId,
        status: documents.status,
        createdAt: documents.createdAt,
        // Asumiendo que el precio está en un campo o tabla relacionada
        price: sql<number>`15000` // Precio base, debe venir de documentTypes
      })
      .from(documents)
      .where(
        and(
          eq(documents.posTerminalId, posTerminalId),
          gte(documents.createdAt, startDate),
          lte(documents.createdAt, endDate),
          eq(documents.status, 'signed') // Solo documentos completados
        )
      );

    // Calcular totales
    const totalDocuments = weekDocuments.length;
    const totalRevenue = weekDocuments.reduce((sum, doc) => sum + doc.price, 0);
    const commission = totalRevenue * this.COMMISSION_RATE;

    // Agrupar por tipo de documento
    const documentBreakdown = this.groupDocumentsByType(weekDocuments);

    // Obtener datos de la semana anterior para comparación
    const previousWeekStart = new Date(startDate);
    previousWeekStart.setDate(previousWeekStart.getDate() - 7);
    const previousWeekEnd = new Date(endDate);
    previousWeekEnd.setDate(previousWeekEnd.getDate() - 7);

    const previousWeekDocs = await db
      .select({ id: documents.id, price: sql<number>`15000` })
      .from(documents)
      .where(
        and(
          eq(documents.posTerminalId, posTerminalId),
          gte(documents.createdAt, previousWeekStart),
          lte(documents.createdAt, previousWeekEnd),
          eq(documents.status, 'signed')
        )
      );

    const previousWeekRevenue = previousWeekDocs.reduce((sum, doc) => sum + doc.price, 0);
    const documentsGrowth = previousWeekDocs.length > 0 
      ? ((totalDocuments - previousWeekDocs.length) / previousWeekDocs.length) * 100 
      : 0;
    const revenueGrowth = previousWeekRevenue > 0 
      ? ((totalRevenue - previousWeekRevenue) / previousWeekRevenue) * 100 
      : 0;

    // Analizar rendimiento diario
    const performance = await this.analyzeWeeklyPerformance(weekDocuments, startDate, endDate);

    return {
      posTerminalId,
      terminalName: terminal.name,
      period: {
        startDate,
        endDate,
        weekNumber: this.getWeekNumber(startDate),
        year: startDate.getFullYear()
      },
      transactions: {
        totalDocuments,
        totalRevenue,
        commission,
        commissionRate: this.COMMISSION_RATE
      },
      documentBreakdown,
      weeklyGrowth: {
        documentsVsPreviousWeek: Math.round(documentsGrowth * 100) / 100,
        revenueVsPreviousWeek: Math.round(revenueGrowth * 100) / 100
      },
      performance
    };
  }

  private groupDocumentsByType(documents: any[]): Array<{
    documentType: string;
    count: number;
    revenue: number;
    commission: number;
  }> {
    const groups: Record<string, { count: number; revenue: number }> = {};
    
    documents.forEach(doc => {
      const type = `Tipo ${doc.typeId}`;
      if (!groups[type]) {
        groups[type] = { count: 0, revenue: 0 };
      }
      groups[type].count++;
      groups[type].revenue += doc.price;
    });

    return Object.entries(groups).map(([type, data]) => ({
      documentType: type,
      count: data.count,
      revenue: data.revenue,
      commission: data.revenue * this.COMMISSION_RATE
    }));
  }

  private async analyzeWeeklyPerformance(documents: any[], startDate: Date, endDate: Date) {
    // Agrupar por día
    const dailyStats: Record<string, { count: number; revenue: number }> = {};
    
    documents.forEach(doc => {
      const day = doc.createdAt.toISOString().split('T')[0];
      if (!dailyStats[day]) {
        dailyStats[day] = { count: 0, revenue: 0 };
      }
      dailyStats[day].count++;
      dailyStats[day].revenue += doc.price;
    });

    const days = Object.entries(dailyStats);
    const dailyAverage = documents.length / 7;
    
    // Encontrar el mejor día
    const bestDay = days.reduce((best, [date, stats]) => {
      return stats.revenue > (best?.stats.revenue || 0) 
        ? { date, stats } 
        : best;
    }, null as any);

    // Generar tendencias
    const trends: string[] = [];
    if (dailyAverage > 10) trends.push("Alto volumen de transacciones");
    if (bestDay && bestDay.stats.count > dailyAverage * 1.5) {
      trends.push(`Pico de actividad el ${bestDay.date}`);
    }
    if (days.length < 7) trends.push("Actividad irregular durante la semana");

    return {
      dailyAverage: Math.round(dailyAverage * 100) / 100,
      bestDay: bestDay ? {
        date: bestDay.date,
        documents: bestDay.stats.count,
        revenue: bestDay.stats.revenue
      } : { date: "", documents: 0, revenue: 0 },
      trends
    };
  }

  async generateWeeklyStatement(calculation: CommissionCalculation): Promise<WeeklyStatement> {
    const id = `WS-${calculation.posTerminalId}-${calculation.period.year}-W${calculation.period.weekNumber}`;
    
    // Generar insights con IA (si está disponible)
    const aiInsights = await this.generateAIInsights(calculation);
    
    // Crear el estado de cuenta
    const statement: WeeklyStatement = {
      id,
      posTerminalId: calculation.posTerminalId,
      weekStartDate: calculation.period.startDate,
      weekEndDate: calculation.period.endDate,
      calculation,
      generatedAt: new Date(),
      status: 'generated',
      aiInsights
    };

    // Generar PDF del estado de cuenta
    try {
      const pdfBuffer = await this.generateStatementPDF(statement);
      // En una implementación real, guardarías el PDF en almacenamiento
      statement.pdfUrl = `/api/statements/${id}.pdf`;
    } catch (error) {
      console.error("Error generando PDF del estado de cuenta:", error);
    }

    // Registrar en audit log
    await db.insert(auditLog).values({
      action: "weekly_statement_generated",
      details: `Estado de cuenta generado para terminal ${calculation.terminalName}`,
      ipAddress: "system",
      userAgent: "CommissionService"
    });

    return statement;
  }

  private async generateAIInsights(calculation: CommissionCalculation): Promise<{
    performanceAnalysis: string;
    recommendations: string[];
    marketTrends: string;
  }> {
    // Análisis básico sin IA externa
    let performanceAnalysis = "";
    const recommendations: string[] = [];
    
    if (calculation.transactions.totalDocuments === 0) {
      performanceAnalysis = "Sin actividad registrada durante la semana. Se requiere investigar las causas.";
      recommendations.push("Verificar conectividad del terminal");
      recommendations.push("Revisar capacitación del operador");
      recommendations.push("Evaluar ubicación del terminal");
    } else if (calculation.transactions.totalDocuments < 10) {
      performanceAnalysis = "Actividad baja. El terminal está operando por debajo del promedio esperado.";
      recommendations.push("Incrementar actividades de marketing local");
      recommendations.push("Considerar horarios extendidos");
      recommendations.push("Evaluar precios competitivos");
    } else if (calculation.transactions.totalDocuments > 50) {
      performanceAnalysis = "Excelente rendimiento. El terminal está superando expectativas.";
      recommendations.push("Mantener estrategias actuales");
      recommendations.push("Considerar expansión en la zona");
      recommendations.push("Optimizar procesos para mayor eficiencia");
    } else {
      performanceAnalysis = "Rendimiento estable dentro de parámetros normales.";
      recommendations.push("Continuar con operaciones regulares");
      recommendations.push("Monitorear tendencias de crecimiento");
    }

    // Análisis de crecimiento
    if (calculation.weeklyGrowth.revenueVsPreviousWeek > 20) {
      recommendations.push("Excelente crecimiento - replicar estrategias exitosas");
    } else if (calculation.weeklyGrowth.revenueVsPreviousWeek < -10) {
      recommendations.push("Declive en ingresos - investigar causas y tomar medidas correctivas");
    }

    const marketTrends = this.generateMarketTrends(calculation);

    // Si hay API de Perplexity disponible, enriquecer con análisis IA
    if (process.env.PERPLEXITY_API_KEY) {
      try {
        const aiEnhancedInsights = await this.getAIEnhancedInsights(calculation);
        return {
          performanceAnalysis: aiEnhancedInsights.analysis || performanceAnalysis,
          recommendations: [...recommendations, ...aiEnhancedInsights.recommendations],
          marketTrends: aiEnhancedInsights.trends || marketTrends
        };
      } catch (error) {
        console.log("AI insights no disponibles, usando análisis local");
      }
    }

    return {
      performanceAnalysis,
      recommendations,
      marketTrends
    };
  }

  private generateMarketTrends(calculation: CommissionCalculation): string {
    const trends = [];
    
    if (calculation.performance.trends.includes("Alto volumen de transacciones")) {
      trends.push("Demanda alta de servicios legales en la zona");
    }
    
    if (calculation.weeklyGrowth.revenueVsPreviousWeek > 0) {
      trends.push("Tendencia positiva de crecimiento semanal");
    }
    
    const mostUsedDoc = calculation.documentBreakdown.reduce((max, doc) => 
      doc.count > max.count ? doc : max, calculation.documentBreakdown[0]);
    
    if (mostUsedDoc) {
      trends.push(`Mayor demanda en ${mostUsedDoc.documentType}`);
    }

    return trends.join(". ") + ".";
  }

  private async getAIEnhancedInsights(calculation: CommissionCalculation): Promise<{
    analysis: string;
    recommendations: string[];
    trends: string;
  }> {
    const prompt = `Como analista de negocio especializado en servicios legales, analiza el siguiente rendimiento semanal de un terminal POS:

Terminal: ${calculation.terminalName}
Documentos procesados: ${calculation.transactions.totalDocuments}
Ingresos: $${calculation.transactions.totalRevenue.toLocaleString()}
Comisión: $${calculation.transactions.commission.toLocaleString()}
Crecimiento vs semana anterior: ${calculation.weeklyGrowth.revenueVsPreviousWeek}%
Promedio diario: ${calculation.performance.dailyAverage} documentos

Proporciona:
1. Análisis de rendimiento (2-3 líneas)
2. 3-5 recomendaciones específicas para mejorar
3. Tendencias de mercado observadas

Sé conciso y práctico.`;

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
            content: "Eres un analista de negocio experto en servicios legales y retail. Proporciona análisis concisos y recomendaciones prácticas."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.3
      })
    });

    if (response.ok) {
      const data = await response.json();
      const content = data.choices[0]?.message?.content || "";
      
      // Parsear la respuesta (esto es simplificado, en producción sería más robusto)
      const lines = content.split('\n').filter(line => line.trim());
      
      return {
        analysis: lines[0] || "",
        recommendations: lines.slice(1, 6).map(line => line.replace(/^\d+\.\s*/, "")),
        trends: lines[lines.length - 1] || ""
      };
    }

    throw new Error("AI service unavailable");
  }

  private async generateStatementPDF(statement: WeeklyStatement): Promise<Buffer> {
    // Generar PDF del estado de cuenta usando pdfService
    const htmlContent = this.generateStatementHTML(statement);
    
    // En una implementación real, usarías una librería como puppeteer o similar
    // Por ahora retornamos un buffer placeholder
    return Buffer.from(htmlContent);
  }

  private generateStatementHTML(statement: WeeklyStatement): string {
    const { calculation, aiInsights } = statement;
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Estado de Cuenta Semanal - ${calculation.terminalName}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .section { margin: 20px 0; }
            .summary { background: #f5f5f5; padding: 15px; border-radius: 5px; }
            .breakdown { width: 100%; border-collapse: collapse; margin: 10px 0; }
            .breakdown th, .breakdown td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .breakdown th { background-color: #f2f2f2; }
            .insights { background: #e8f4f8; padding: 15px; border-radius: 5px; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>VecinoXpress - Estado de Cuenta Semanal</h1>
            <h2>Terminal: ${calculation.terminalName}</h2>
            <p>Período: ${calculation.period.startDate.toLocaleDateString()} - ${calculation.period.endDate.toLocaleDateString()}</p>
            <p>Semana ${calculation.period.weekNumber} de ${calculation.period.year}</p>
        </div>

        <div class="section summary">
            <h3>Resumen de Comisiones</h3>
            <p><strong>Total Documentos Procesados:</strong> ${calculation.transactions.totalDocuments}</p>
            <p><strong>Ingresos Totales:</strong> $${calculation.transactions.totalRevenue.toLocaleString()}</p>
            <p><strong>Tasa de Comisión:</strong> ${(calculation.transactions.commissionRate * 100)}%</p>
            <p><strong>Comisión Ganada:</strong> $${calculation.transactions.commission.toLocaleString()}</p>
        </div>

        <div class="section">
            <h3>Desglose por Tipo de Documento</h3>
            <table class="breakdown">
                <thead>
                    <tr>
                        <th>Tipo de Documento</th>
                        <th>Cantidad</th>
                        <th>Ingresos</th>
                        <th>Comisión</th>
                    </tr>
                </thead>
                <tbody>
                    ${calculation.documentBreakdown.map(item => `
                        <tr>
                            <td>${item.documentType}</td>
                            <td>${item.count}</td>
                            <td>$${item.revenue.toLocaleString()}</td>
                            <td>$${item.commission.toLocaleString()}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div class="section">
            <h3>Análisis de Rendimiento</h3>
            <p><strong>Promedio Diario:</strong> ${calculation.performance.dailyAverage} documentos</p>
            <p><strong>Mejor Día:</strong> ${calculation.performance.bestDay.date} (${calculation.performance.bestDay.documents} docs, $${calculation.performance.bestDay.revenue.toLocaleString()})</p>
            <p><strong>Crecimiento vs Semana Anterior:</strong> ${calculation.weeklyGrowth.revenueVsPreviousWeek}% en ingresos</p>
        </div>

        <div class="section insights">
            <h3>Insights IA - Análisis Automatizado</h3>
            <p><strong>Análisis:</strong> ${aiInsights.performanceAnalysis}</p>
            <h4>Recomendaciones:</h4>
            <ul>
                ${aiInsights.recommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
            <p><strong>Tendencias de Mercado:</strong> ${aiInsights.marketTrends}</p>
        </div>

        <div class="section">
            <p><em>Estado de cuenta generado automáticamente el ${statement.generatedAt.toLocaleString()}</em></p>
            <p><em>ID: ${statement.id}</em></p>
        </div>
    </body>
    </html>`;
  }

  // Utilidades para fechas
  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Lunes como inicio de semana
    return new Date(d.setDate(diff));
  }

  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  // Método público para ejecutar el proceso semanal automatizado
  async runWeeklyAutomatedProcess(): Promise<WeeklyStatement[]> {
    console.log("Iniciando proceso automatizado de estados de cuenta semanales...");
    
    try {
      // Calcular comisiones para la semana pasada
      const lastWeekStart = new Date();
      lastWeekStart.setDate(lastWeekStart.getDate() - 7);
      const weekStart = this.getWeekStart(lastWeekStart);
      
      const calculations = await this.calculateWeeklyCommissions(weekStart);
      const statements: WeeklyStatement[] = [];
      
      for (const calculation of calculations) {
        if (calculation.transactions.totalDocuments > 0) {
          const statement = await this.generateWeeklyStatement(calculation);
          statements.push(statement);
          
          console.log(`Estado de cuenta generado para ${calculation.terminalName}: $${calculation.transactions.commission.toLocaleString()} comisión`);
        }
      }
      
      console.log(`Proceso completado. ${statements.length} estados de cuenta generados.`);
      return statements;
      
    } catch (error) {
      console.error("Error en proceso automatizado:", error);
      throw error;
    }
  }
}

export const commissionService = new CommissionService();
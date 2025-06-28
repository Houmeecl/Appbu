// Template Manager Service - Automatic template adaptation and integration
import fs from 'fs/promises';
import path from 'path';
import { storage } from '../storage';

interface TemplateField {
  name: string;
  type: 'text' | 'date' | 'number' | 'rut' | 'email' | 'phone';
  required: boolean;
  placeholder?: string;
  validation?: string;
}

interface ParsedTemplate {
  name: string;
  description: string;
  category: string;
  price: number;
  fields: TemplateField[];
  htmlContent: string;
  variables: string[];
}

class TemplateManagerService {
  private templatesDir = path.join(process.cwd(), 'server/templates/uploaded');

  constructor() {
    // Asegurar que el directorio existe
    this.ensureTemplatesDirectory();
  }

  private async ensureTemplatesDirectory() {
    try {
      await fs.access(this.templatesDir);
    } catch {
      await fs.mkdir(this.templatesDir, { recursive: true });
    }
  }

  /**
   * Procesar archivo de plantilla subido y adaptarlo automáticamente
   */
  async processUploadedTemplate(
    filename: string,
    content: string,
    metadata: {
      name: string;
      description?: string;
      category?: string;
      basePrice?: number;
    }
  ): Promise<{ success: boolean; templateId?: number; error?: string }> {
    try {
      console.log(`📝 Procesando plantilla: ${filename}`);

      // 1. Parsear y analizar la plantilla
      const parsedTemplate = await this.parseTemplate(content, metadata);
      
      // 2. Validar estructura
      const validation = this.validateTemplate(parsedTemplate);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // 3. Guardar archivo físico
      const templatePath = path.join(this.templatesDir, `${Date.now()}_${filename}`);
      await fs.writeFile(templatePath, content, 'utf8');

      // 4. Crear en base de datos
      const documentType = await storage.createDocumentType({
        name: parsedTemplate.name,
        description: parsedTemplate.description,
        price: parsedTemplate.price.toString(),
        template: parsedTemplate.htmlContent,
        isActive: true
      });

      console.log(`✅ Plantilla creada: ${documentType.name} (ID: ${documentType.id})`);
      console.log(`📊 Campos detectados: ${parsedTemplate.fields.length}`);
      console.log(`🔤 Variables encontradas: ${parsedTemplate.variables.join(', ')}`);

      return { 
        success: true, 
        templateId: documentType.id 
      };

    } catch (error: any) {
      console.error('❌ Error procesando plantilla:', error);
      return { 
        success: false, 
        error: `Error procesando plantilla: ${error.message}` 
      };
    }
  }

  /**
   * Parsear plantilla HTML/texto y extraer información automáticamente
   */
  private async parseTemplate(content: string, metadata: any): Promise<ParsedTemplate> {
    // Detectar variables en formato {{variable}} o {variable}
    const variableRegex = /\{\{?([^}]+)\}?\}/g;
    const variables: string[] = [];
    let match;

    while ((match = variableRegex.exec(content)) !== null) {
      const variable = match[1].trim();
      if (!variables.includes(variable)) {
        variables.push(variable);
      }
    }

    // Mapear variables a campos con tipos automáticos
    const fields = this.mapVariablesToFields(variables);

    // Generar precio base automático según complejidad
    const basePrice = metadata.basePrice || this.calculateBasePrice(variables.length, content.length);

    // Limpiar y optimizar HTML
    const htmlContent = this.optimizeTemplate(content);

    return {
      name: metadata.name,
      description: metadata.description || `Documento ${metadata.name} - ${variables.length} campos`,
      category: metadata.category || 'Personalizado',
      price: basePrice,
      fields,
      htmlContent,
      variables
    };
  }

  /**
   * Mapear variables detectadas a campos tipados
   */
  private mapVariablesToFields(variables: string[]): TemplateField[] {
    return variables.map(variable => {
      const lowerVar = variable.toLowerCase();
      
      // Detectar tipo automáticamente por nombre
      let type: TemplateField['type'] = 'text';
      let placeholder = `Ingrese ${variable}`;

      if (lowerVar.includes('rut') || lowerVar.includes('cedula') || lowerVar.includes('ci')) {
        type = 'rut';
        placeholder = 'XX.XXX.XXX-X';
      } else if (lowerVar.includes('email') || lowerVar.includes('correo')) {
        type = 'email';
        placeholder = 'ejemplo@email.com';
      } else if (lowerVar.includes('telefono') || lowerVar.includes('phone') || lowerVar.includes('celular')) {
        type = 'phone';
        placeholder = '+56912345678';
      } else if (lowerVar.includes('fecha') || lowerVar.includes('date')) {
        type = 'date';
        placeholder = 'DD/MM/AAAA';
      } else if (lowerVar.includes('edad') || lowerVar.includes('años') || lowerVar.includes('numero')) {
        type = 'number';
        placeholder = '0';
      }

      // Determinar si es requerido (variables importantes)
      const required = ['nombre', 'rut', 'cedula', 'email'].some(req => 
        lowerVar.includes(req)
      );

      return {
        name: variable,
        type,
        required,
        placeholder
      };
    });
  }

  /**
   * Calcular precio base según complejidad
   */
  private calculateBasePrice(fieldCount: number, contentLength: number): number {
    // Precio base: $2,000 + $300 por campo + $1 por carácter (máx $1,000)
    const basePrice = 2000;
    const fieldPrice = fieldCount * 300;
    const contentPrice = Math.min(Math.floor(contentLength / 100) * 100, 1000);
    
    return basePrice + fieldPrice + contentPrice;
  }

  /**
   * Optimizar plantilla HTML para el sistema
   */
  private optimizeTemplate(content: string): string {
    // Limpiar HTML innecesario
    let optimized = content
      .replace(/<script[^>]*>.*?<\/script>/gis, '') // Remover scripts
      .replace(/<style[^>]*>.*?<\/style>/gis, '') // Remover estilos internos
      .replace(/<!--[\s\S]*?-->/g, '') // Remover comentarios
      .replace(/\s+/g, ' ') // Normalizar espacios
      .trim();

    // Agregar metadatos del sistema
    const metadata = `
      <!-- Plantilla VecinoXpress - Generada automáticamente -->
      <!-- Fecha: ${new Date().toISOString()} -->
      <!-- Sistema: NotaryPro Template Manager -->
    `;

    return metadata + optimized;
  }

  /**
   * Validar estructura de plantilla
   */
  private validateTemplate(template: ParsedTemplate): { valid: boolean; error?: string } {
    if (!template.name || template.name.length < 3) {
      return { valid: false, error: 'Nombre de plantilla debe tener al menos 3 caracteres' };
    }

    if (template.variables.length === 0) {
      return { valid: false, error: 'Plantilla debe contener al menos una variable {{variable}}' };
    }

    if (template.variables.length > 50) {
      return { valid: false, error: 'Plantilla no puede tener más de 50 variables' };
    }

    if (template.htmlContent.length > 100000) {
      return { valid: false, error: 'Plantilla excede el tamaño máximo (100KB)' };
    }

    return { valid: true };
  }

  /**
   * Obtener lista de plantillas subidas
   */
  async getUploadedTemplates(): Promise<any[]> {
    try {
      const files = await fs.readdir(this.templatesDir);
      const templates = [];

      for (const file of files) {
        if (file.endsWith('.html') || file.endsWith('.txt')) {
          const filePath = path.join(this.templatesDir, file);
          const stats = await fs.stat(filePath);
          const content = await fs.readFile(filePath, 'utf8');
          
          // Extraer variables rápidamente
          const variableMatches = content.match(/\{\{?([^}]+)\}?\}/g) || [];
          
          templates.push({
            filename: file,
            size: stats.size,
            created: stats.birthtime,
            variables: variableMatches.length,
            preview: content.substring(0, 200) + '...'
          });
        }
      }

      return templates.sort((a, b) => b.created.getTime() - a.created.getTime());
    } catch (error) {
      console.error('Error obteniendo plantillas:', error);
      return [];
    }
  }

  /**
   * Vista previa de plantilla antes de procesar
   */
  async previewTemplate(content: string, sampleData: Record<string, string> = {}): Promise<string> {
    let preview = content;

    // Reemplazar variables con datos de muestra
    const variableRegex = /\{\{?([^}]+)\}?\}/g;
    preview = preview.replace(variableRegex, (match, variable) => {
      const varName = variable.trim();
      return sampleData[varName] || `[${varName}]`;
    });

    return preview;
  }

  /**
   * Generar datos de muestra para una plantilla
   */
  generateSampleData(variables: string[]): Record<string, string> {
    const sampleData: Record<string, string> = {};

    variables.forEach(variable => {
      const lowerVar = variable.toLowerCase();
      
      if (lowerVar.includes('nombre')) {
        sampleData[variable] = 'Juan Pérez González';
      } else if (lowerVar.includes('rut') || lowerVar.includes('cedula')) {
        sampleData[variable] = '12.345.678-9';
      } else if (lowerVar.includes('email')) {
        sampleData[variable] = 'juan.perez@email.com';
      } else if (lowerVar.includes('telefono') || lowerVar.includes('phone')) {
        sampleData[variable] = '+56912345678';
      } else if (lowerVar.includes('fecha')) {
        sampleData[variable] = new Date().toLocaleDateString('es-CL');
      } else if (lowerVar.includes('direccion')) {
        sampleData[variable] = 'Av. Providencia 123, Santiago';
      } else if (lowerVar.includes('ciudad')) {
        sampleData[variable] = 'Santiago';
      } else if (lowerVar.includes('profesion')) {
        sampleData[variable] = 'Ingeniero';
      } else {
        sampleData[variable] = `Valor de ${variable}`;
      }
    });

    return sampleData;
  }
}

export const templateManagerService = new TemplateManagerService();
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';

interface ContractData {
  terminalId: string;
  operatorName: string;
  operatorRut: string;
  businessName: string;
  businessAddress: string;
  imei: string;
  region: string;
  commissionRate: number;
  contractDate: Date;
  startDate: Date;
  coordinates?: string;
  contactPhone?: string;
  contactEmail?: string;
}

class ContractService {
  async generateServiceContract(contractData: ContractData): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([595, 842]); // A4 size
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const { width, height } = page.getSize();
    let yPosition = height - 50;

    // Header
    page.drawText('CONTRATO DE SERVICIOS VECINOXPRESS', {
      x: 50,
      y: yPosition,
      size: 18,
      font: boldFont,
      color: rgb(0, 0.3, 0.6)
    });

    yPosition -= 30;
    page.drawText(`Contrato N°: VX-${contractData.terminalId}-${Date.now().toString().slice(-6)}`, {
      x: 50,
      y: yPosition,
      size: 12,
      font: boldFont
    });

    yPosition -= 40;

    // Contract content
    const contractText = [
      '1. IDENTIFICACIÓN DE LAS PARTES',
      '',
      'PRESTADOR DE SERVICIOS:',
      '• Razón Social: VecinoXpress SpA',
      '• RUT: 77.123.456-K',
      '• Domicilio: Providencia 1234, Santiago, Chile',
      '• Representante Legal: María González Silva',
      '',
      'OPERADOR COMERCIAL:',
      `• Nombre/Razón Social: ${contractData.businessName}`,
      `• Operador Responsable: ${contractData.operatorName}`,
      `• RUT: ${contractData.operatorRut}`,
      `• Dirección: ${contractData.businessAddress}`,
      `• Región: ${contractData.region}`,
      `• Teléfono: ${contractData.contactPhone || 'No especificado'}`,
      `• Email: ${contractData.contactEmail || 'No especificado'}`,
      '',
      '2. OBJETO DEL CONTRATO',
      '',
      'El presente contrato tiene por objeto regular la prestación de servicios de',
      'procesamiento y certificación de documentos legales a través del sistema',
      'VecinoXpress en el establecimiento del OPERADOR COMERCIAL.',
      '',
      '3. EQUIPAMIENTO Y TECNOLOGÍA',
      '',
      `• Terminal ID: ${contractData.terminalId}`,
      `• IMEI del Dispositivo: ${contractData.imei}`,
      `• Ubicación GPS: ${contractData.coordinates || 'A definir'}`,
      '• Software: Sistema VecinoXpress v2.1',
      '• Conectividad: 4G/WiFi con respaldo',
      '',
      '4. COMISIONES Y FACTURACIÓN',
      '',
      `• Tasa de Comisión: ${contractData.commissionRate}% sobre valor neto`,
      '• Facturación: Semanal (días viernes)',
      '• Forma de Pago: Transferencia bancaria',
      '• Retención: 10% hasta validación de 30 días',
      '',
      '5. OBLIGACIONES DEL OPERADOR',
      '',
      '• Mantener el terminal en condiciones óptimas de funcionamiento',
      '• Brindar atención adecuada a los clientes',
      '• Cumplir con los procedimientos de verificación de identidad',
      '• Reportar inmediatamente cualquier incidente o problema técnico',
      '• Mantener confidencialidad de los datos procesados',
      '',
      '6. OBLIGACIONES DE VECINOXPRESS',
      '',
      '• Proporcionar capacitación inicial y continua',
      '• Mantener el software actualizado y funcional',
      '• Brindar soporte técnico 24/7',
      '• Realizar el pago de comisiones según lo acordado',
      '',
      '7. VIGENCIA Y RENOVACIÓN',
      '',
      `• Fecha de Inicio: ${contractData.startDate.toLocaleDateString('es-CL')}`,
      '• Duración: 12 meses renovable automáticamente',
      '• Terminación: Con aviso previo de 30 días',
      '',
      '8. CONFIDENCIALIDAD Y PROTECCIÓN DE DATOS',
      '',
      'Ambas partes se comprometen a mantener absoluta confidencialidad',
      'respecto de la información personal y documentos procesados,',
      'cumpliendo con la Ley 19.628 de Protección de Datos Personales.',
      '',
      '9. JURISDICCIÓN',
      '',
      'Para todos los efectos legales derivados del presente contrato,',
      'las partes se someten a la jurisdicción de los Tribunales de Santiago.',
    ];

    // Draw contract text
    contractText.forEach((line) => {
      if (yPosition < 100) {
        // Add new page if needed
        const newPage = pdfDoc.addPage([595, 842]);
        yPosition = height - 50;
        page = newPage;
      }

      const isTitle = line.includes('IDENTIFICACIÓN') || line.includes('OBJETO') || 
                     line.includes('EQUIPAMIENTO') || line.includes('COMISIONES') ||
                     line.includes('OBLIGACIONES') || line.includes('VIGENCIA') ||
                     line.includes('CONFIDENCIALIDAD') || line.includes('JURISDICCIÓN');
      
      const isBold = line.includes('PRESTADOR') || line.includes('OPERADOR COMERCIAL') ||
                     line.startsWith('•') || isTitle;

      page.drawText(line, {
        x: 50,
        y: yPosition,
        size: isTitle ? 11 : 9,
        font: isBold ? boldFont : font,
        color: isTitle ? rgb(0, 0.3, 0.6) : rgb(0, 0, 0)
      });

      yPosition -= line === '' ? 8 : 14;
    });

    // Signature section
    yPosition -= 30;
    page.drawText('FIRMAS:', {
      x: 50,
      y: yPosition,
      size: 12,
      font: boldFont
    });

    yPosition -= 50;
    page.drawText('_________________________', {
      x: 80,
      y: yPosition,
      size: 10,
      font
    });

    page.drawText('_________________________', {
      x: 350,
      y: yPosition,
      size: 10,
      font
    });

    yPosition -= 15;
    page.drawText('VecinoXpress SpA', {
      x: 80,
      y: yPosition,
      size: 9,
      font
    });

    page.drawText(contractData.operatorName, {
      x: 350,
      y: yPosition,
      size: 9,
      font
    });

    yPosition -= 10;
    page.drawText('Representante Legal', {
      x: 80,
      y: yPosition,
      size: 8,
      font
    });

    page.drawText('Operador Comercial', {
      x: 350,
      y: yPosition,
      size: 8,
      font
    });

    // Generate QR code for contract verification
    try {
      const qrData = `VX-CONTRACT-${contractData.terminalId}-${Date.now()}`;
      const qrCodeDataURL = await QRCode.toDataURL(qrData, {
        width: 80,
        margin: 1
      });
      
      // Convert QR to PNG bytes (simplified for this demo)
      page.drawText('QR Verificación:', {
        x: 450,
        y: 150,
        size: 8,
        font
      });
    } catch (error) {
      console.error('Error generating QR code:', error);
    }

    // Contract date
    page.drawText(`Fecha del Contrato: ${contractData.contractDate.toLocaleDateString('es-CL')}`, {
      x: 50,
      y: 50,
      size: 10,
      font
    });

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }

  async generateContractSummary(contractData: ContractData) {
    return {
      contractNumber: `VX-${contractData.terminalId}-${Date.now().toString().slice(-6)}`,
      operatorName: contractData.operatorName,
      businessName: contractData.businessName,
      terminalId: contractData.terminalId,
      imei: contractData.imei,
      commissionRate: contractData.commissionRate,
      region: contractData.region,
      contractDate: contractData.contractDate.toISOString(),
      status: 'active',
      estimatedMonthlyRevenue: this.calculateEstimatedRevenue(contractData.region),
      expectedCommission: this.calculateExpectedCommission(contractData.region, contractData.commissionRate)
    };
  }

  private calculateEstimatedRevenue(region: string): number {
    // Revenue estimates by region (CLP)
    const regionMultipliers: Record<string, number> = {
      'Región Metropolitana': 180000,
      'Valparaíso': 120000,
      'Biobío': 100000,
      'La Araucanía': 80000,
      'Los Lagos': 85000,
      'Antofagasta': 140000,
      'default': 90000
    };

    return regionMultipliers[region] || regionMultipliers.default;
  }

  private calculateExpectedCommission(region: string, commissionRate: number): number {
    const estimatedRevenue = this.calculateEstimatedRevenue(region);
    return Math.round(estimatedRevenue * (commissionRate / 100));
  }
}

export const contractService = new ContractService();
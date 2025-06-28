import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { Document, Evidence, Signature } from '@shared/schema';

class PDFService {
  async generateSignedPDF(
    document: Document, 
    evidence: Evidence[], 
    signatures: Signature[]
  ): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const timesRomanBoldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
    const courierFont = await pdfDoc.embedFont(StandardFonts.Courier);

    const page = pdfDoc.addPage([595, 842]); // A4 size
    const { width, height } = page.getSize();

    // Header with NotaryPro branding
    page.drawRectangle({
      x: 0,
      y: height - 80,
      width,
      height: 80,
      color: rgb(0.8, 0.13, 0.16), // NotaryPro red #ce2029
    });

    page.drawText('NotaryPro', {
      x: 50,
      y: height - 50,
      size: 24,
      font: timesRomanBoldFont,
      color: rgb(1, 1, 1),
    });

    page.drawText('Documento Legal Electrónico', {
      x: 50,
      y: height - 70,
      size: 12,
      font: timesRomanFont,
      color: rgb(1, 1, 1),
    });

    // Document details
    let yPosition = height - 120;
    
    page.drawText('DOCUMENTO FIRMADO ELECTRÓNICAMENTE', {
      x: 50,
      y: yPosition,
      size: 16,
      font: timesRomanBoldFont,
      color: rgb(0, 0, 0),
    });

    yPosition -= 40;

    // Document information
    const documentInfo = [
      [`Número de Documento:`, document.documentNumber],
      [`Tipo:`, 'Declaración Jurada Simple'], // Would get from document type
      [`Cliente:`, document.clientName],
      [`RUT Cliente:`, document.clientRut],
      [`Fecha de Creación:`, document.createdAt?.toLocaleString('es-CL') || ''],
      [`Fecha de Firma:`, document.signedAt?.toLocaleString('es-CL') || ''],
      [`Hash SHA-256:`, document.hash],
    ];

    documentInfo.forEach(([label, value]) => {
      page.drawText(label, {
        x: 50,
        y: yPosition,
        size: 10,
        font: timesRomanBoldFont,
      });

      page.drawText(value, {
        x: 200,
        y: yPosition,
        size: 10,
        font: timesRomanFont,
      });

      yPosition -= 20;
    });

    // Evidence section
    yPosition -= 20;
    page.drawText('EVIDENCIA DE VERIFICACIÓN', {
      x: 50,
      y: yPosition,
      size: 14,
      font: timesRomanBoldFont,
    });

    yPosition -= 30;

    evidence.forEach((ev) => {
      let evidenceText = '';
      switch (ev.type) {
        case 'gps':
          const gpsData = ev.data as any;
          evidenceText = `Ubicación GPS: ${gpsData.latitude}, ${gpsData.longitude}`;
          break;
        case 'photo':
          evidenceText = 'Verificación de identidad con fotografía capturada';
          break;
        case 'signature':
          evidenceText = 'Firma manuscrita digital capturada';
          break;
        default:
          evidenceText = `Evidencia de tipo: ${ev.type}`;
      }

      page.drawText(evidenceText, {
        x: 70,
        y: yPosition,
        size: 9,
        font: timesRomanFont,
      });

      yPosition -= 15;
    });

    // Signatures section
    yPosition -= 20;
    page.drawText('FIRMAS DIGITALES', {
      x: 50,
      y: yPosition,
      size: 14,
      font: timesRomanBoldFont,
    });

    yPosition -= 30;

    signatures.forEach((sig) => {
      const sigText = `${sig.type === 'simple' ? 'Firma Simple' : 'Firma Electrónica Avanzada (FEA)'}: ${sig.signerName}`;
      page.drawText(sigText, {
        x: 70,
        y: yPosition,
        size: 10,
        font: timesRomanFont,
      });

      if (sig.timestamp) {
        page.drawText(`Fecha: ${sig.timestamp.toLocaleString('es-CL')}`, {
          x: 70,
          y: yPosition - 15,
          size: 8,
          font: timesRomanFont,
          color: rgb(0.5, 0.5, 0.5),
        });
      }

      yPosition -= 40;
    });

    // Legal notice
    yPosition -= 30;
    page.drawText('VALIDEZ LEGAL', {
      x: 50,
      y: yPosition,
      size: 14,
      font: timesRomanBoldFont,
    });

    yPosition -= 25;

    const legalText = [
      'Este documento ha sido firmado electrónicamente de acuerdo con la Ley 19.799',
      'sobre Documentos Electrónicos, Firma Electrónica y Servicios de Certificación.',
      'La Firma Electrónica Avanzada (FEA) otorga plena validez legal al documento.',
      '',
      'Para validar este documento, ingrese el código QR o hash en:',
      'https://vecinoxpress.cl/validar',
    ];

    legalText.forEach((line) => {
      page.drawText(line, {
        x: 50,
        y: yPosition,
        size: 8,
        font: timesRomanFont,
        color: rgb(0.3, 0.3, 0.3),
      });
      yPosition -= 12;
    });

    // QR Code placeholder (would be actual QR in real implementation)
    if (document.qrCode) {
      page.drawRectangle({
        x: width - 150,
        y: 50,
        width: 100,
        height: 100,
        borderColor: rgb(0, 0, 0),
        borderWidth: 1,
      });

      page.drawText('QR Code', {
        x: width - 125,
        y: 95,
        size: 10,
        font: timesRomanFont,
      });

      page.drawText(document.qrCode, {
        x: width - 150,
        y: 30,
        size: 6,
        font: courierFont,
      });
    }

    // Watermark
    page.drawText('NotaryPro - Documento Firmado Electrónicamente', {
      x: 50,
      y: 20,
      size: 8,
      font: timesRomanFont,
      color: rgb(0.7, 0.7, 0.7),
    });

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }
}

export const pdfService = new PDFService();

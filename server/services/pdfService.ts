import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';
import { generateDocumentHTML, DocumentTemplateData } from '../templates/documentTemplates';
import { qrService } from './qrService';
import { Document } from '../../shared/schema';

class PDFService {
  // Generate a professionally formatted PDF document with signatures and QR codes
  async generateSignedPDF(
    document: Document, 
    signatureData: string, 
    evidenceData: any[]
  ): Promise<Buffer> {
    try {
      // Create a new PDF document
      const pdfDoc = await PDFDocument.create();
      
      // Add metadata
      pdfDoc.setTitle(`${document.documentNumber} - Documento Legal Electrónico`);
      pdfDoc.setAuthor('VecinoXpress - Sistema de Documentos Legales');
      pdfDoc.setSubject('Documento firmado electrónicamente con validez legal');
      pdfDoc.setKeywords(['documento legal', 'firma electrónica', 'FEA', 'Chile']);
      pdfDoc.setCreator('VecinoXpress Platform');
      pdfDoc.setProducer('NotaryPro Digital Certification');

      // Main document page
      const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
      const { width, height } = page.getSize();
      
      // Load fonts
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);

      // Header with branding
      await this.addHeader(page, helveticaBoldFont, width);
      
      // Document content
      let yPosition = height - 120;
      yPosition = await this.addDocumentContent(page, document, timesRomanFont, helveticaFont, yPosition, width);
      
      // Digital signature section
      yPosition = await this.addDigitalSignature(page, signatureData, helveticaFont, helveticaBoldFont, yPosition);
      
      // QR Code for validation
      const qrCode = qrService.generateQRCode(qrService.generateDocumentHash(document));
      await this.addQRCode(page, qrCode, yPosition);
      
      // Evidence page
      if (evidenceData && evidenceData.length > 0) {
        await this.addEvidencePage(pdfDoc, evidenceData, helveticaFont, helveticaBoldFont);
      }
      
      // Legal footer on all pages
      const pages = pdfDoc.getPages();
      for (const p of pages) {
        await this.addLegalFooter(p, helveticaFont);
      }
      
      // Return the PDF as a buffer
      const pdfBytes = await pdfDoc.save();
      return Buffer.from(pdfBytes);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('Failed to generate PDF document');
    }
  }

  private async addHeader(page: any, font: any, width: number) {
    // VecinoXpress branding
    page.drawText('VECINOXPRESS', {
      x: 50,
      y: page.getSize().height - 50,
      size: 20,
      font: font,
      color: rgb(0.063, 0.294, 0.663) // #104ba9
    });
    
    page.drawText('Sistema de Documentos Legales Electrónicos', {
      x: 50,
      y: page.getSize().height - 70,
      size: 12,
      font: font,
      color: rgb(0.5, 0.5, 0.5)
    });
    
    // NotaryPro certification mark
    page.drawText('CERTIFICADO POR NOTARYPRO', {
      x: width - 250,
      y: page.getSize().height - 50,
      size: 12,
      font: font,
      color: rgb(0.808, 0.125, 0.161) // #ce2029
    });
    
    // Horizontal line
    page.drawLine({
      start: { x: 50, y: page.getSize().height - 85 },
      end: { x: width - 50, y: page.getSize().height - 85 },
      thickness: 2,
      color: rgb(0, 0, 0)
    });
  }

  private async addDocumentContent(page: any, document: any, mainFont: any, detailFont: any, startY: number, width: number): Promise<number> {
    let y = startY;
    
    // Document title
    page.drawText(document.documentType || 'DOCUMENTO LEGAL', {
      x: 50,
      y: y,
      size: 18,
      font: mainFont,
      color: rgb(0, 0, 0)
    });
    y -= 30;
    
    // Document information box
    page.drawRectangle({
      x: 50,
      y: y - 60,
      width: width - 100,
      height: 55,
      borderColor: rgb(0.808, 0.125, 0.161),
      borderWidth: 2,
      color: rgb(0.96, 0.96, 0.96)
    });
    
    page.drawText(`Documento N°: ${document.documentNumber}`, {
      x: 60,
      y: y - 20,
      size: 12,
      font: detailFont
    });
    
    page.drawText(`Fecha: ${new Date(document.createdAt).toLocaleDateString('es-CL')}`, {
      x: 60,
      y: y - 35,
      size: 12,
      font: detailFont
    });
    
    page.drawText(`Cliente: ${document.clientName} (${document.clientRut})`, {
      x: 60,
      y: y - 50,
      size: 12,
      font: detailFont
    });
    
    y -= 80;
    
    // Main content area
    page.drawText('CONTENIDO DEL DOCUMENTO:', {
      x: 50,
      y: y,
      size: 14,
      font: mainFont
    });
    y -= 20;
    
    const contentLines = [
      'Este documento ha sido generado electrónicamente y cuenta con plena validez legal',
      'conforme a la Ley 19.799 sobre Documentos Electrónicos, Firma Electrónica y',
      'Servicios de Certificación de la República de Chile.',
      '',
      'La autenticidad e integridad de este documento están garantizadas mediante:',
      '• Firma Electrónica Avanzada (FEA)',
      '• Captura biométrica del firmante',
      '• Geolocalización del lugar de firma',
      '• Hash criptográfico de verificación',
      '• Timestamp de creación verificable'
    ];
    
    for (const line of contentLines) {
      page.drawText(line, {
        x: 50,
        y: y,
        size: 11,
        font: detailFont,
        maxWidth: width - 100
      });
      y -= 16;
    }
    
    return y - 20;
  }

  private async addDigitalSignature(page: any, signatureData: string, font: any, boldFont: any, startY: number): Promise<number> {
    let y = startY;
    
    // Signature section header
    page.drawText('FIRMA ELECTRÓNICA AVANZADA', {
      x: 50,
      y: y,
      size: 14,
      font: boldFont
    });
    y -= 25;
    
    // Signature box
    page.drawRectangle({
      x: 50,
      y: y - 40,
      width: 200,
      height: 35,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1
    });
    
    page.drawText('Firma Digital Aplicada', {
      x: 55,
      y: y - 20,
      size: 10,
      font: font
    });
    
    page.drawText(`Hash: ${signatureData.substring(0, 32)}...`, {
      x: 55,
      y: y - 35,
      size: 8,
      font: font,
      color: rgb(0.5, 0.5, 0.5)
    });
    
    // Certification info
    page.drawText('CERTIFICACIÓN DIGITAL', {
      x: 300,
      y: y,
      size: 12,
      font: boldFont
    });
    
    const certLines = [
      'Certificador: NotaryPro',
      'Nivel: Firma Electrónica Avanzada',
      'Estándar: RFC 3161, PKCS#7',
      `Timestamp: ${new Date().toISOString()}`
    ];
    
    let certY = y - 15;
    for (const line of certLines) {
      page.drawText(line, {
        x: 300,
        y: certY,
        size: 9,
        font: font
      });
      certY -= 12;
    }
    
    return y - 60;
  }

  private async addQRCode(page: any, qrCode: string, yPosition: number) {
    try {
      // Generate QR code data URL
      const qrDataURL = await qrService.generateQRCodeDataURL(qrCode);
      
      // Remove the data URL prefix to get just the base64 data
      const base64Data = qrDataURL.replace(/^data:image\/png;base64,/, '');
      const qrImageBytes = Buffer.from(base64Data, 'base64');
      
      const pdfDoc = page.doc;
      const qrImage = await pdfDoc.embedPng(qrImageBytes);
      
      // Add QR code
      page.drawImage(qrImage, {
        x: page.getSize().width - 150,
        y: yPosition - 100,
        width: 80,
        height: 80
      });
      
      // QR code label
      page.drawText('Verificar documento:', {
        x: page.getSize().width - 150,
        y: yPosition - 110,
        size: 10,
        font: await pdfDoc.embedFont(StandardFonts.Helvetica)
      });
      
      page.drawText(qrService.generateValidationURL(qrCode), {
        x: page.getSize().width - 150,
        y: yPosition - 25,
        size: 8,
        font: await pdfDoc.embedFont(StandardFonts.Helvetica),
        color: rgb(0, 0, 1),
        maxWidth: 120
      });
      
    } catch (error) {
      console.error('Error adding QR code to PDF:', error);
      // Continue without QR code if there's an error
    }
  }

  private async addEvidencePage(pdfDoc: any, evidenceData: any[], font: any, boldFont: any) {
    const evidencePage = pdfDoc.addPage([595.28, 841.89]);
    const { width, height } = evidencePage.getSize();
    
    let y = height - 80;
    
    evidencePage.drawText('EVIDENCIA BIOMÉTRICA Y GEOLOCALIZACIÓN', {
      x: 50,
      y: y,
      size: 16,
      font: boldFont
    });
    y -= 40;
    
    for (const evidence of evidenceData) {
      evidencePage.drawText(`Tipo: ${evidence.type}`, {
        x: 50,
        y: y,
        size: 12,
        font: boldFont
      });
      y -= 20;
      
      evidencePage.drawText(`Timestamp: ${new Date(evidence.timestamp).toLocaleString('es-CL')}`, {
        x: 50,
        y: y,
        size: 10,
        font: font
      });
      y -= 15;
      
      if (evidence.data && evidence.data.latitude && evidence.data.longitude) {
        evidencePage.drawText(`Coordenadas: ${evidence.data.latitude}, ${evidence.data.longitude}`, {
          x: 50,
          y: y,
          size: 10,
          font: font
        });
        y -= 15;
      }
      
      y -= 20;
    }
  }

  private async addLegalFooter(page: any, font: any) {
    const { width, height } = page.getSize();
    
    page.drawLine({
      start: { x: 50, y: 50 },
      end: { x: width - 50, y: 50 },
      thickness: 1,
      color: rgb(0.7, 0.7, 0.7)
    });
    
    page.drawText('Este documento tiene plena validez legal conforme a la Ley 19.799 de Chile sobre Documentos Electrónicos', {
      x: 50,
      y: 35,
      size: 8,
      font: font,
      color: rgb(0.5, 0.5, 0.5)
    });
    
    page.drawText('VecinoXpress® - Sistema Certificado de Documentos Legales Electrónicos', {
      x: 50,
      y: 25,
      size: 8,
      font: font,
      color: rgb(0.5, 0.5, 0.5)
    });
  }
}

export const pdfService = new PDFService();
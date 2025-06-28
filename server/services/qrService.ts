import QRCode from 'qrcode';
import crypto from 'crypto';

class QRService {
  // Generate a unique QR code identifier for document validation
  generateQRCode(documentHash: string): string {
    // Create a unique identifier combining hash and timestamp
    const timestamp = Date.now().toString();
    const combined = `${documentHash}-${timestamp}`;
    
    // Generate a shorter, URL-safe validation code
    const hash = crypto.createHash('sha256').update(combined).digest('hex');
    return hash.substring(0, 16).toUpperCase(); // 16 character validation code
  }

  // Generate the public validation URL
  generateValidationURL(qrCode: string): string {
    const baseURL = process.env.BASE_URL || 'https://vecinoxpress.cl';
    return `${baseURL}/validar/${qrCode}`;
  }

  // Generate QR code image as base64 data URL
  async generateQRCodeImage(data: string): Promise<Buffer> {
    try {
      const validationURL = this.generateValidationURL(data);
      
      const qrOptions = {
        type: 'png' as const,
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 200,
        errorCorrectionLevel: 'M' as const
      };

      return await QRCode.toBuffer(validationURL, qrOptions);
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error('Failed to generate QR code image');
    }
  }

  // Generate QR code as data URL (for embedding in HTML/PDF)
  async generateQRCodeDataURL(data: string): Promise<string> {
    try {
      const validationURL = this.generateValidationURL(data);
      
      const qrOptions = {
        type: 'image/png' as const,
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 200,
        errorCorrectionLevel: 'M' as const
      };

      return await QRCode.toDataURL(validationURL, qrOptions);
    } catch (error) {
      console.error('Error generating QR code data URL:', error);
      throw new Error('Failed to generate QR code data URL');
    }
  }

  // Validate QR code format
  validateQRCode(qrCode: string): boolean {
    // QR codes should be 16 character uppercase hex strings
    const qrPattern = /^[A-F0-9]{16}$/;
    return qrPattern.test(qrCode);
  }

  // Generate document verification hash
  generateDocumentHash(documentData: any): string {
    // Create a deterministic hash from document content
    const content = JSON.stringify({
      documentNumber: documentData.documentNumber,
      clientName: documentData.clientName,
      clientRut: documentData.clientRut,
      typeId: documentData.typeId,
      createdAt: documentData.createdAt
    });
    
    return crypto.createHash('sha256').update(content).digest('hex');
  }
}

export const qrService = new QRService();
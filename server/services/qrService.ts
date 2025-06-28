import { randomBytes } from 'crypto';
import QRCode from 'qrcode';

class QRService {
  generateQRCode(documentHash: string): string {
    // Generate a unique QR validation code
    const timestamp = Date.now().toString(36);
    const random = randomBytes(8).toString('hex');
    return `QR-${timestamp}-${random}`;
  }

  generateValidationURL(qrCode: string): string {
    const baseUrl = process.env.BASE_URL || 'https://vecinoxpress.cl';
    return `${baseUrl}/validar?code=${qrCode}`;
  }

  async generateQRCodeImage(data: string): Promise<Buffer> {
    try {
      // Generate actual QR code image using the qrcode library
      const validationURL = this.generateValidationURL(data);
      const qrCodeDataURL = await QRCode.toDataURL(validationURL, {
        type: 'image/png',
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      // Convert data URL to buffer
      const base64Data = qrCodeDataURL.replace(/^data:image\/png;base64,/, '');
      return Buffer.from(base64Data, 'base64');
    } catch (error) {
      console.error('Error generating QR code:', error);
      // Fallback to placeholder
      return Buffer.from(`QR_CODE_ERROR_${data}`);
    }
  }
}

export const qrService = new QRService();

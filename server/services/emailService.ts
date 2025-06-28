// Email Service for sending signed documents to clients
// This would use a service like SendGrid, Mailgun, or AWS SES in production

interface DocumentEmailData {
  clientEmail: string;
  clientName: string;
  documentType: string;
  documentNumber: string;
  certificadorName: string;
  signedAt: Date;
  pdfUrl?: string;
  validationUrl?: string;
}

class EmailService {
  async sendSignedDocumentEmail(data: DocumentEmailData): Promise<boolean> {
    try {
      // In production, this would use a real email service
      console.log('📧 Sending signed document email to:', data.clientEmail);
      console.log('📄 Document:', data.documentType, data.documentNumber);
      console.log('✍️ Signed by:', data.certificadorName);
      console.log('🔗 PDF URL:', data.pdfUrl);
      console.log('🔍 Validation URL:', data.validationUrl);

      // Simulate email sending delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Email template (would be HTML in production)
      const emailContent = this.generateEmailTemplate(data);
      
      // Log the email content for demo purposes
      console.log('📧 Email content generated:', emailContent.subject);
      
      return true;
    } catch (error) {
      console.error('❌ Error sending email:', error);
      return false;
    }
  }

  private generateEmailTemplate(data: DocumentEmailData) {
    const subject = `Su documento ${data.documentType} ha sido firmado - NotaryPro`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 30px; }
          .document-info { background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .footer { background: #1e293b; color: white; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
          .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Su documento ha sido firmado</h1>
            <p>NotaryPro - Certificación Digital Avanzada</p>
          </div>
          
          <div class="content">
            <h2>Estimado/a ${data.clientName},</h2>
            
            <p>Nos complace informarle que su documento ha sido certificado exitosamente con <strong>Firma Electrónica Avanzada (FEA)</strong> bajo la normativa chilena Ley 19.799.</p>
            
            <div class="document-info">
              <h3>📋 Detalles del Documento</h3>
              <ul>
                <li><strong>Tipo:</strong> ${data.documentType}</li>
                <li><strong>Número:</strong> ${data.documentNumber}</li>
                <li><strong>Certificado por:</strong> ${data.certificadorName}</li>
                <li><strong>Fecha de firma:</strong> ${data.signedAt.toLocaleDateString('es-CL', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              ${data.pdfUrl ? `<a href="${data.pdfUrl}" class="button">📄 Descargar PDF Firmado</a>` : ''}
              ${data.validationUrl ? `<a href="${data.validationUrl}" class="button">🔍 Validar Documento</a>` : ''}
            </div>

            <div class="warning">
              <strong>⚠️ Importante:</strong> Este documento tiene validez legal bajo la Ley 19.799 de Chile. 
              Conserve este email y los enlaces para futuras referencias.
            </div>

            <h3>🛡️ Características de Seguridad</h3>
            <ul>
              <li>✅ Firma Electrónica Avanzada (FEA) con eToken SafeNet</li>
              <li>✅ Timestamp criptográfico RFC 3161</li>
              <li>✅ Hash SHA-256 para verificación de integridad</li>
              <li>✅ Trazabilidad completa con evidencias biométricas</li>
              <li>✅ Validación pública mediante código QR</li>
            </ul>
          </div>
          
          <div class="footer">
            <p><strong>NotaryPro</strong> - Red Nacional de Certificación Digital</p>
            <p>500+ puntos de atención en todo Chile</p>
            <p>📧 soporte@notarypro.cl | 📞 600 123 4567</p>
            <p style="font-size: 12px; margin-top: 15px;">
              Este es un email automático. Para consultas, contacte nuestro centro de atención.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    return {
      subject,
      htmlContent,
      textContent: this.generateTextVersion(data)
    };
  }

  private generateTextVersion(data: DocumentEmailData): string {
    return `
Su documento ${data.documentType} ha sido firmado - NotaryPro

Estimado/a ${data.clientName},

Su documento ha sido certificado exitosamente:

Detalles del Documento:
- Tipo: ${data.documentType}
- Número: ${data.documentNumber}
- Certificado por: ${data.certificadorName}
- Fecha de firma: ${data.signedAt.toLocaleDateString('es-CL')}

${data.pdfUrl ? `PDF Firmado: ${data.pdfUrl}` : ''}
${data.validationUrl ? `Validar Documento: ${data.validationUrl}` : ''}

Este documento tiene validez legal bajo la Ley 19.799 de Chile.

NotaryPro - Red Nacional de Certificación Digital
soporte@notarypro.cl | 600 123 4567
    `.trim();
  }

  async sendCertificadorNotificationEmail(data: {
    certificadorEmail: string;
    certificadorName: string;
    documentCount: number;
    pendingCount: number;
  }): Promise<boolean> {
    try {
      console.log('📧 Sending certificador notification to:', data.certificadorEmail);
      console.log('📊 Documents processed today:', data.documentCount);
      console.log('⏳ Pending documents:', data.pendingCount);
      
      // In production, would send actual email
      return true;
    } catch (error) {
      console.error('❌ Error sending certificador notification:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();
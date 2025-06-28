// Professional legal document templates for Chile

export interface DocumentTemplateData {
  clientName: string;
  clientRut: string;
  clientPhone?: string;
  clientAddress?: string;
  documentNumber: string;
  createdAt: Date;
  posTerminal?: any;
  additionalData?: Record<string, any>;
}

export const documentTemplates = {
  "Declaración Jurada Simple": (data: DocumentTemplateData) => `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Declaración Jurada Simple - ${data.documentNumber}</title>
    <style>
        body { font-family: 'Times New Roman', serif; margin: 40px; line-height: 1.6; }
        .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #000; padding-bottom: 20px; }
        .title { font-size: 18px; font-weight: bold; text-transform: uppercase; }
        .subtitle { font-size: 14px; margin-top: 10px; }
        .content { margin: 30px 0; text-align: justify; }
        .signature-area { margin-top: 80px; display: flex; justify-content: space-between; }
        .signature-box { text-align: center; width: 200px; }
        .signature-line { border-top: 1px solid #000; margin-top: 60px; padding-top: 5px; }
        .footer { margin-top: 60px; font-size: 10px; color: #666; text-align: center; }
        .document-info { background: #f5f5f5; padding: 15px; margin: 20px 0; border-left: 4px solid #ce2029; }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">Declaración Jurada Simple</div>
        <div class="subtitle">Documento Legal Electrónico</div>
        <div class="subtitle">República de Chile</div>
    </div>

    <div class="document-info">
        <strong>Documento N°:</strong> ${data.documentNumber}<br>
        <strong>Fecha:</strong> ${data.createdAt.toLocaleDateString('es-CL', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}<br>
        <strong>Lugar:</strong> ${data.posTerminal?.address || 'Santiago, Chile'}
    </div>

    <div class="content">
        <p>Yo, <strong>${data.clientName}</strong>, cédula de identidad número <strong>${data.clientRut}</strong>, 
        domiciliado(a) en ${data.clientAddress || '[DOMICILIO]'}, declaro bajo juramento que:</p>

        <ol style="margin: 20px 0; padding-left: 30px;">
            <li>La información proporcionada en este documento es completamente veraz y exacta.</li>
            <li>Asumo toda responsabilidad legal por la veracidad de la presente declaración.</li>
            <li>Estoy en pleno conocimiento de las sanciones establecidas en el artículo 210 del Código Penal 
                por el delito de perjurio en caso de falsedad de esta declaración.</li>
            <li>Esta declaración se realiza para todos los efectos legales que correspondan.</li>
        </ol>

        <p>Declaro además que:</p>
        <div style="border: 1px solid #ccc; padding: 20px; margin: 20px 0; min-height: 100px; background: #fafafa;">
            [CONTENIDO ESPECÍFICO DE LA DECLARACIÓN]
        </div>

        <p>La presente declaración jurada simple se extiende para ser presentada ante quien corresponda, 
        en conformidad con lo establecido en la Ley N° 18.918.</p>
    </div>

    <div class="signature-area">
        <div class="signature-box">
            <div class="signature-line">
                <strong>${data.clientName}</strong><br>
                RUT: ${data.clientRut}<br>
                Declarante
            </div>
        </div>
        <div class="signature-box">
            <div class="signature-line">
                Certificador Digital<br>
                NotaryPro<br>
                Firma Electrónica Avanzada
            </div>
        </div>
    </div>

    <div class="footer">
        <p><strong>VALIDEZ LEGAL:</strong> Este documento ha sido firmado electrónicamente conforme a la Ley 19.799 
        sobre Documentos Electrónicos, Firma Electrónica y Servicios de Certificación.</p>
        <p><strong>VERIFICACIÓN:</strong> Para validar este documento ingrese a https://vecinoxpress.cl/validar 
        con el código: ${data.documentNumber}</p>
        <p>Documento generado por VecinoXpress - Sistema certificado de documentos legales electrónicos</p>
    </div>
</body>
</html>`,

  "Poder Simple": (data: DocumentTemplateData) => `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Poder Simple - ${data.documentNumber}</title>
    <style>
        body { font-family: 'Times New Roman', serif; margin: 40px; line-height: 1.6; }
        .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #000; padding-bottom: 20px; }
        .title { font-size: 18px; font-weight: bold; text-transform: uppercase; }
        .content { margin: 30px 0; text-align: justify; }
        .signature-area { margin-top: 80px; display: flex; justify-content: space-between; }
        .signature-box { text-align: center; width: 200px; }
        .signature-line { border-top: 1px solid #000; margin-top: 60px; padding-top: 5px; }
        .document-info { background: #f5f5f5; padding: 15px; margin: 20px 0; border-left: 4px solid #104ba9; }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">Poder Simple</div>
        <div class="subtitle">Documento Legal Electrónico</div>
    </div>

    <div class="document-info">
        <strong>Documento N°:</strong> ${data.documentNumber}<br>
        <strong>Fecha:</strong> ${data.createdAt.toLocaleDateString('es-CL')}<br>
        <strong>Lugar:</strong> ${data.posTerminal?.address || 'Santiago, Chile'}
    </div>

    <div class="content">
        <p>Yo, <strong>${data.clientName}</strong>, RUT <strong>${data.clientRut}</strong>, 
        por el presente documento otorgo poder simple, amplio y suficiente a:</p>

        <div style="border: 1px solid #ccc; padding: 20px; margin: 20px 0; background: #fafafa;">
            <strong>APODERADO:</strong> [NOMBRE DEL APODERADO]<br>
            <strong>RUT:</strong> [RUT DEL APODERADO]<br>
            <strong>DOMICILIO:</strong> [DOMICILIO DEL APODERADO]
        </div>

        <p><strong>PARA QUE EN MI NOMBRE Y REPRESENTACIÓN:</strong></p>
        <div style="border: 1px solid #ccc; padding: 20px; margin: 20px 0; min-height: 150px; background: #fafafa;">
            [ESPECIFICAR LAS FACULTADES OTORGADAS]
        </div>

        <p>Este poder se otorga por el tiempo que sea necesario para el cumplimiento del mandato, 
        pudiendo el mandatario usar de él cuantas veces estime conveniente.</p>
    </div>

    <div class="signature-area">
        <div class="signature-box">
            <div class="signature-line">
                <strong>${data.clientName}</strong><br>
                RUT: ${data.clientRut}<br>
                Mandante
            </div>
        </div>
        <div class="signature-box">
            <div class="signature-line">
                Certificador Digital<br>
                NotaryPro
            </div>
        </div>
    </div>
</body>
</html>`,

  "Recibo de Dinero": (data: DocumentTemplateData) => `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Recibo de Dinero - ${data.documentNumber}</title>
    <style>
        body { font-family: 'Times New Roman', serif; margin: 40px; line-height: 1.6; }
        .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #000; padding-bottom: 20px; }
        .title { font-size: 18px; font-weight: bold; text-transform: uppercase; }
        .amount-box { border: 2px solid #000; padding: 20px; margin: 20px 0; text-align: center; font-size: 18px; font-weight: bold; }
        .content { margin: 30px 0; text-align: justify; }
        .signature-area { margin-top: 60px; display: flex; justify-content: space-between; }
        .signature-box { text-align: center; width: 200px; }
        .signature-line { border-top: 1px solid #000; margin-top: 60px; padding-top: 5px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">Recibo de Dinero</div>
        <div class="subtitle">Documento Legal Electrónico N° ${data.documentNumber}</div>
    </div>

    <div class="content">
        <p>Yo, <strong>${data.clientName}</strong>, RUT <strong>${data.clientRut}</strong>, 
        declaro haber recibido de:</p>

        <div style="border: 1px solid #ccc; padding: 15px; margin: 20px 0; background: #fafafa;">
            <strong>PAGADOR:</strong> [NOMBRE DEL PAGADOR]<br>
            <strong>RUT:</strong> [RUT DEL PAGADOR]<br>
            <strong>DOMICILIO:</strong> [DOMICILIO DEL PAGADOR]
        </div>

        <div class="amount-box">
            LA CANTIDAD DE: $ [MONTO EN NÚMEROS]<br>
            ([MONTO EN PALABRAS])
        </div>

        <p><strong>CONCEPTO:</strong></p>
        <div style="border: 1px solid #ccc; padding: 15px; margin: 20px 0; min-height: 80px; background: #fafafa;">
            [CONCEPTO DEL PAGO]
        </div>

        <p>Cantidad que recibo a mi entera satisfacción, otorgando por el presente el más amplio 
        y completo finiquito.</p>

        <p>En fe de lo cual, firmo el presente recibo en ${data.posTerminal?.address || 'Santiago'}, 
        a ${data.createdAt.toLocaleDateString('es-CL')}.</p>
    </div>

    <div class="signature-area">
        <div class="signature-box">
            <div class="signature-line">
                <strong>${data.clientName}</strong><br>
                RUT: ${data.clientRut}<br>
                Receptor
            </div>
        </div>
    </div>
</body>
</html>`
};

export function generateDocumentHTML(documentType: string, data: DocumentTemplateData): string {
  const template = documentTemplates[documentType as keyof typeof documentTemplates];
  
  if (!template) {
    throw new Error(`Template not found for document type: ${documentType}`);
  }
  
  return template(data);
}
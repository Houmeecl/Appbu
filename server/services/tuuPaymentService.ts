import crypto from 'crypto';

interface TuuPaymentRequest {
  amount: number;
  tip?: number;
  cashback?: number;
  method: number; // 1=débito, 2=crédito, 3=efectivo
  installmentsQuantity?: number;
  printVoucherOnApp: boolean;
  dteType?: number; // 39=boleta, 48=ticket, etc
  extraData?: {
    taxIdnValidation?: string;
    exemptAmount?: number;
    netAmount?: number;
    sourceName: string;
    sourceVersion: string;
    customFields?: Array<{
      name: string;
      value: string;
      print: boolean;
    }>;
  };
}

interface TuuPaymentResponse {
  transactionStatus: boolean;
  sequenceNumber?: string;
  printerVoucherCommerce?: boolean;
  transactionTip?: number;
  transactionCashback?: number;
  extraData?: any;
  errorCode?: number;
  errorMessage?: string;
  errorCodeOnApp?: number;
  errorMessageOnApp?: string;
}

interface TuuDevice {
  imei: string;
  model: string; // SUNMI_P2_PRO, KOZEN_PRO2, etc
  partnerCredentials: {
    partnerId: string;
    apiKey: string;
    secretKey: string;
    environment: 'dev' | 'prod';
  };
  isActive: boolean;
  lastSync: Date;
  configuration: {
    allowTip: boolean;
    allowCashback: boolean;
    maxAmount: number;
    supportedMethods: number[]; // [1,2] = débito y crédito
    dteTypes: number[];
    autoprint: boolean;
  };
}

class TuuPaymentService {
  private readonly DEV_PACKAGE = 'com.haulmer.paymentapp.dev';
  private readonly PROD_PACKAGE = 'com.haulmer.paymentapp';
  private readonly TUU_API_BASE_DEV = 'https://dev-api.tuu.cl';
  private readonly TUU_API_BASE_PROD = 'https://api.tuu.cl';

  // Mapeo de métodos de pago TUU
  private readonly PAYMENT_METHODS = {
    DEBIT: 1,
    CREDIT: 2,
    CASH: 3
  };

  // Tipos de DTE chilenos
  private readonly DTE_TYPES = {
    BOLETA: 39,
    FACTURA: 33,
    TICKET: 48,
    NOTA_CREDITO: 61,
    NOTA_DEBITO: 56
  };

  // Errores conocidos de TUU
  private readonly TUU_ERROR_CODES = {
    1: 'La app de Pago no soporta propina de acuerdo a sus configuraciones',
    2: 'La app de Pago no soporta vuelto de acuerdo a sus configuraciones',
    3: 'El método de pago no esta definido en las configuraciones',
    4: 'El dispositivo no admite cuotas en este tipo de transacción',
    5: 'El dispositivo no admite vuelto en este tipo de transacción',
    6: 'El monto no fue especificado',
    7: 'El monto excede el máximo permitido',
    8: 'No todos los atributos requeridos están presentes',
    9: 'Error en proceso de pago',
    10: 'La transacción fue cancelada',
    11: 'El Terminal no esta correctamente configurado',
    12: 'El dispositivo esta aprobado pero no se han cargado las llaves',
    13: 'El dispositivo no admite un moto de más de 12 dígitos',
    14: 'El dispositivo no esta conectado a internet',
    15: 'El dispositivo no pudo obtener la configuración desde su cuenta',
    16: 'El rubro esta en espera de asignación',
    17: 'El rubro utilizado tuvo un error durante la asignación',
    18: 'El tipo de documento electrónico no esta definido en las configuraciones',
    19: 'El RUT indicado no coincide con el utilizado',
    20: 'El SDK de Pagos no se encuentra instalado',
    21: 'La aplicación de Pago necesita ser actualizada'
  };

  /**
   * Registra un nuevo dispositivo TUU con credenciales de partner
   */
  async registerTuuDevice(imei: string, model: string, partnerCredentials: any): Promise<TuuDevice> {
    const device: TuuDevice = {
      imei,
      model,
      partnerCredentials: {
        partnerId: partnerCredentials.partnerId,
        apiKey: partnerCredentials.apiKey,
        secretKey: partnerCredentials.secretKey,
        environment: partnerCredentials.environment || 'dev'
      },
      isActive: true,
      lastSync: new Date(),
      configuration: this.getDefaultConfiguration(model)
    };

    // TODO: Guardar en base de datos
    console.log(`Dispositivo TUU registrado: ${imei} - ${model}`);
    
    return device;
  }

  /**
   * Procesa un pago a través de TUU
   */
  async processPayment(
    imei: string, 
    documentId: number,
    paymentData: {
      amount: number;
      documentType: string;
      clientRut: string;
      clientName: string;
      tip?: number;
      method?: 'debit' | 'credit';
      installments?: number;
    }
  ): Promise<TuuPaymentResponse> {
    try {
      // Validar dispositivo
      const device = await this.getTuuDevice(imei);
      if (!device) {
        throw new Error('Dispositivo TUU no encontrado');
      }

      // Preparar payload para TUU
      const tuuPayload: TuuPaymentRequest = {
        amount: paymentData.amount,
        tip: paymentData.tip || 0,
        cashback: -1, // No usar vuelto por defecto
        method: this.mapPaymentMethod(paymentData.method || 'credit'),
        installmentsQuantity: paymentData.installments || -1,
        printVoucherOnApp: device.configuration.autoprint,
        dteType: this.DTE_TYPES.TICKET,
        extraData: {
          taxIdnValidation: paymentData.clientRut,
          sourceName: 'VecinoXpress',
          sourceVersion: '1.0.0',
          customFields: [
            {
              name: 'Cliente',
              value: paymentData.clientName,
              print: true
            },
            {
              name: 'Documento',
              value: `DOC-${documentId}`,
              print: true
            },
            {
              name: 'Tipo',
              value: paymentData.documentType,
              print: true
            }
          ]
        }
      };

      // Validar payload
      this.validatePaymentRequest(tuuPayload, device);

      // Simular llamada a TUU (en APK real se haría via Intent)
      const response = await this.callTuuPaymentAPI(device, tuuPayload);

      // Log de auditoría
      await this.logPaymentTransaction({
        imei,
        documentId,
        amount: paymentData.amount,
        method: paymentData.method || 'credit',
        tuuResponse: response,
        timestamp: new Date()
      });

      return response;

    } catch (error: any) {
      console.error('Error procesando pago TUU:', error);
      
      return {
        transactionStatus: false,
        errorCode: 9,
        errorMessage: error.message || 'Error en proceso de pago'
      };
    }
  }

  /**
   * Genera Intent para APK Android
   */
  generateAndroidIntent(paymentData: TuuPaymentRequest, environment: 'dev' | 'prod' = 'dev'): string {
    const packageName = environment === 'dev' ? this.DEV_PACKAGE : this.PROD_PACKAGE;
    const payload = JSON.stringify(paymentData);
    
    return `
      Intent intent = new Intent();
      intent.setPackage("${packageName}");
      intent.setAction("com.haulmer.paymentapp.PAYMENT");
      intent.putExtra("paymentData", '${payload}');
      
      try {
        startActivityForResult(intent, PAYMENT_REQUEST_CODE);
      } catch (ActivityNotFoundException e) {
        // TUU app no instalada
        Log.e("TUU", "Aplicación TUU no encontrada");
      }
    `;
  }

  /**
   * Procesa respuesta de TUU desde APK
   */
  processTuuResponse(intentData: string): TuuPaymentResponse {
    try {
      const response: TuuPaymentResponse = JSON.parse(intentData);
      
      // Validar estructura de respuesta
      if (typeof response.transactionStatus !== 'boolean') {
        throw new Error('Respuesta TUU inválida: transactionStatus faltante');
      }

      // Si hay error, mapear mensaje amigable
      if (!response.transactionStatus && response.errorCode) {
        response.errorMessage = this.TUU_ERROR_CODES[response.errorCode as keyof typeof this.TUU_ERROR_CODES] 
          || response.errorMessage 
          || 'Error desconocido';
      }

      return response;

    } catch (error: any) {
      console.error('Error procesando respuesta TUU:', error);
      
      return {
        transactionStatus: false,
        errorCode: 9,
        errorMessage: 'Error al procesar respuesta de TUU'
      };
    }
  }

  /**
   * Sincroniza configuración con TUU
   */
  async syncDeviceConfiguration(imei: string): Promise<void> {
    try {
      const device = await this.getTuuDevice(imei);
      if (!device) {
        throw new Error('Dispositivo no encontrado');
      }

      // Llamar API de configuración TUU
      const config = await this.fetchTuuConfiguration(device);
      
      // Actualizar configuración local
      device.configuration = {
        ...device.configuration,
        ...config,
      };
      
      device.lastSync = new Date();
      
      // TODO: Actualizar en base de datos
      console.log(`Configuración sincronizada para dispositivo: ${imei}`);

    } catch (error: any) {
      console.error('Error sincronizando configuración TUU:', error);
      throw error;
    }
  }

  /**
   * Valida si un dispositivo puede procesar pagos
   */
  async validateDeviceStatus(imei: string): Promise<{
    isValid: boolean;
    issues: string[];
    canProcess: boolean;
  }> {
    const issues: string[] = [];
    
    try {
      const device = await this.getTuuDevice(imei);
      
      if (!device) {
        issues.push('Dispositivo no registrado en TUU');
        return { isValid: false, issues, canProcess: false };
      }

      if (!device.isActive) {
        issues.push('Dispositivo desactivado');
      }

      // Verificar última sincronización (no más de 24 horas)
      const lastSync = new Date(device.lastSync);
      const hoursAgo = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60);
      if (hoursAgo > 24) {
        issues.push('Configuración desactualizada (última sync: ' + lastSync.toLocaleString() + ')');
      }

      // Verificar credenciales
      if (!device.partnerCredentials.partnerId || !device.partnerCredentials.apiKey) {
        issues.push('Credenciales de partner incompletas');
      }

      const canProcess = issues.length === 0;
      
      return {
        isValid: device.isActive,
        issues,
        canProcess
      };

    } catch (error: any) {
      issues.push('Error validando dispositivo: ' + error.message);
      return { isValid: false, issues, canProcess: false };
    }
  }

  /**
   * Obtiene estadísticas de transacciones TUU
   */
  async getPaymentStats(imei?: string, dateRange?: { from: Date; to: Date }) {
    // TODO: Implementar consulta a base de datos
    return {
      totalTransactions: 0,
      successfulTransactions: 0,
      failedTransactions: 0,
      totalAmount: 0,
      averageAmount: 0,
      topErrorCodes: [],
      dailyVolume: []
    };
  }

  // Métodos privados

  private getDefaultConfiguration(model: string) {
    const baseConfig = {
      allowTip: true,
      allowCashback: false,
      maxAmount: 999999999999, // 12 dígitos
      supportedMethods: [this.PAYMENT_METHODS.DEBIT, this.PAYMENT_METHODS.CREDIT],
      dteTypes: [this.DTE_TYPES.BOLETA, this.DTE_TYPES.TICKET],
      autoprint: true
    };

    // Configuraciones específicas por modelo
    if (model.includes('KOZEN')) {
      return {
        ...baseConfig,
        allowCashback: true, // KOZEN soporta vuelto
      };
    }

    return baseConfig;
  }

  private mapPaymentMethod(method: string): number {
    switch (method.toLowerCase()) {
      case 'debit':
      case 'debito':
        return this.PAYMENT_METHODS.DEBIT;
      case 'credit':
      case 'credito':
        return this.PAYMENT_METHODS.CREDIT;
      case 'cash':
      case 'efectivo':
        return this.PAYMENT_METHODS.CASH;
      default:
        return this.PAYMENT_METHODS.CREDIT;
    }
  }

  private validatePaymentRequest(payload: TuuPaymentRequest, device: TuuDevice): void {
    // Validar monto
    if (!payload.amount || payload.amount <= 0) {
      throw new Error('Monto debe ser mayor a 0');
    }

    if (payload.amount > device.configuration.maxAmount) {
      throw new Error('Monto excede el máximo permitido');
    }

    // Validar método de pago
    if (!device.configuration.supportedMethods.includes(payload.method)) {
      throw new Error('Método de pago no soportado por el dispositivo');
    }

    // Validar propina
    if (payload.tip && payload.tip > 0 && !device.configuration.allowTip) {
      throw new Error('Dispositivo no soporta propinas');
    }

    // Validar vuelto
    if (payload.cashback && payload.cashback > 0 && !device.configuration.allowCashback) {
      throw new Error('Dispositivo no soporta vuelto');
    }

    // Validar cuotas solo para crédito
    if (payload.installmentsQuantity && payload.installmentsQuantity > 1 && payload.method !== this.PAYMENT_METHODS.CREDIT) {
      throw new Error('Cuotas solo disponibles para pagos con crédito');
    }
  }

  private async getTuuDevice(imei: string): Promise<TuuDevice | null> {
    // TODO: Implementar consulta a base de datos
    // Por ahora retornamos un dispositivo mock
    return {
      imei,
      model: 'SUNMI_P2_PRO',
      partnerCredentials: {
        partnerId: 'VECINO_XPRESS',
        apiKey: 'test_api_key',
        secretKey: 'test_secret_key',
        environment: 'dev'
      },
      isActive: true,
      lastSync: new Date(),
      configuration: this.getDefaultConfiguration('SUNMI_P2_PRO')
    };
  }

  private async callTuuPaymentAPI(device: TuuDevice, payload: TuuPaymentRequest): Promise<TuuPaymentResponse> {
    // Simular respuesta exitosa de TUU
    // En producción real, esto sería manejado por el Intent de Android
    
    return {
      transactionStatus: true,
      sequenceNumber: this.generateSequenceNumber(),
      printerVoucherCommerce: device.configuration.autoprint,
      transactionTip: payload.tip || 0,
      extraData: payload.extraData
    };
  }

  private async fetchTuuConfiguration(device: TuuDevice) {
    // TODO: Implementar llamada real a API TUU
    return device.configuration;
  }

  private async logPaymentTransaction(transactionData: any): Promise<void> {
    // TODO: Implementar log en base de datos
    console.log('Transacción TUU registrada:', {
      imei: transactionData.imei,
      documentId: transactionData.documentId,
      amount: transactionData.amount,
      success: transactionData.tuuResponse.transactionStatus,
      sequenceNumber: transactionData.tuuResponse.sequenceNumber,
      timestamp: transactionData.timestamp
    });
  }

  private generateSequenceNumber(): string {
    return Date.now().toString().slice(-12).padStart(12, '0');
  }

  /**
   * Genera código para APK Android completo
   */
  generateAPKIntegrationCode(): string {
    return `
// VecinoXpress TUU Integration for Android POS
// Archivo: TuuPaymentIntegration.java

package cl.vecinoxpress.pos.payment;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import org.json.JSONObject;
import org.json.JSONArray;

public class TuuPaymentIntegration {
    private static final String TAG = "VecinoXpress_TUU";
    private static final int PAYMENT_REQUEST_CODE = 1001;
    
    // Packages TUU
    private static final String TUU_DEV_PACKAGE = "com.haulmer.paymentapp.dev";
    private static final String TUU_PROD_PACKAGE = "com.haulmer.paymentapp";
    
    private Activity activity;
    private boolean isProduction;
    
    public TuuPaymentIntegration(Activity activity, boolean isProduction) {
        this.activity = activity;
        this.isProduction = isProduction;
    }
    
    /**
     * Procesa pago a través de TUU
     */
    public void processPayment(PaymentRequest request) {
        try {
            JSONObject payload = new JSONObject();
            payload.put("amount", request.getAmount());
            payload.put("tip", request.getTip());
            payload.put("cashback", -1); // No usar vuelto
            payload.put("method", request.getMethod()); // 1=débito, 2=crédito
            payload.put("installmentsQuantity", request.getInstallments());
            payload.put("printVoucherOnApp", true);
            payload.put("dteType", 48); // Ticket
            
            // Extra data para VecinoXpress
            JSONObject extraData = new JSONObject();
            extraData.put("taxIdnValidation", request.getClientRut());
            extraData.put("sourceName", "VecinoXpress");
            extraData.put("sourceVersion", "1.0.0");
            
            JSONArray customFields = new JSONArray();
            customFields.put(createCustomField("Cliente", request.getClientName(), true));
            customFields.put(createCustomField("Documento", request.getDocumentNumber(), true));
            customFields.put(createCustomField("Tipo", request.getDocumentType(), true));
            extraData.put("customFields", customFields);
            
            payload.put("extraData", extraData);
            
            // Crear Intent para TUU
            Intent intent = new Intent();
            String packageName = isProduction ? TUU_PROD_PACKAGE : TUU_DEV_PACKAGE;
            intent.setPackage(packageName);
            intent.setAction("com.haulmer.paymentapp.PAYMENT");
            intent.putExtra("paymentData", payload.toString());
            
            Log.d(TAG, "Enviando pago a TUU: " + payload.toString());
            activity.startActivityForResult(intent, PAYMENT_REQUEST_CODE);
            
        } catch (ActivityNotFoundException e) {
            Log.e(TAG, "Aplicación TUU no encontrada", e);
            onPaymentError("APP_NOT_FOUND", "Aplicación TUU no instalada");
        } catch (Exception e) {
            Log.e(TAG, "Error procesando pago", e);
            onPaymentError("PROCESSING_ERROR", e.getMessage());
        }
    }
    
    /**
     * Maneja respuesta de TUU
     */
    public void handleTuuResponse(Intent data) {
        try {
            if (data != null) {
                String response = data.getStringExtra("paymentResponse");
                if (response != null) {
                    JSONObject jsonResponse = new JSONObject(response);
                    
                    boolean success = jsonResponse.getBoolean("transactionStatus");
                    if (success) {
                        String sequenceNumber = jsonResponse.optString("sequenceNumber");
                        int tip = jsonResponse.optInt("transactionTip", 0);
                        
                        onPaymentSuccess(sequenceNumber, tip);
                    } else {
                        int errorCode = jsonResponse.optInt("errorCode", 0);
                        String errorMessage = jsonResponse.optString("errorMessage", "Error desconocido");
                        
                        onPaymentError("TUU_ERROR_" + errorCode, errorMessage);
                    }
                } else {
                    onPaymentError("NO_RESPONSE", "Sin respuesta de TUU");
                }
            } else {
                onPaymentError("CANCELLED", "Pago cancelado por usuario");
            }
        } catch (Exception e) {
            Log.e(TAG, "Error procesando respuesta TUU", e);
            onPaymentError("RESPONSE_ERROR", e.getMessage());
        }
    }
    
    private JSONObject createCustomField(String name, String value, boolean print) throws Exception {
        JSONObject field = new JSONObject();
        field.put("name", name);
        field.put("value", value);
        field.put("print", print);
        return field;
    }
    
    // Callbacks implementados por la actividad principal
    private void onPaymentSuccess(String sequenceNumber, int tip) {
        if (activity instanceof TuuPaymentCallback) {
            ((TuuPaymentCallback) activity).onPaymentSuccess(sequenceNumber, tip);
        }
    }
    
    private void onPaymentError(String errorCode, String errorMessage) {
        if (activity instanceof TuuPaymentCallback) {
            ((TuuPaymentCallback) activity).onPaymentError(errorCode, errorMessage);
        }
    }
    
    // Interface para callbacks
    public interface TuuPaymentCallback {
        void onPaymentSuccess(String sequenceNumber, int tip);
        void onPaymentError(String errorCode, String errorMessage);
    }
    
    // Clase para request de pago
    public static class PaymentRequest {
        private int amount;
        private int tip;
        private int method;
        private int installments;
        private String clientRut;
        private String clientName;
        private String documentNumber;
        private String documentType;
        
        // Getters y setters
        public int getAmount() { return amount; }
        public void setAmount(int amount) { this.amount = amount; }
        
        public int getTip() { return tip; }
        public void setTip(int tip) { this.tip = tip; }
        
        public int getMethod() { return method; }
        public void setMethod(int method) { this.method = method; }
        
        public int getInstallments() { return installments; }
        public void setInstallments(int installments) { this.installments = installments; }
        
        public String getClientRut() { return clientRut; }
        public void setClientRut(String clientRut) { this.clientRut = clientRut; }
        
        public String getClientName() { return clientName; }
        public void setClientName(String clientName) { this.clientName = clientName; }
        
        public String getDocumentNumber() { return documentNumber; }
        public void setDocumentNumber(String documentNumber) { this.documentNumber = documentNumber; }
        
        public String getDocumentType() { return documentType; }
        public void setDocumentType(String documentType) { this.documentType = documentType; }
    }
}

// Uso en MainActivity:
/*
public class MainActivity extends AppCompatActivity implements TuuPaymentIntegration.TuuPaymentCallback {
    private TuuPaymentIntegration tuuIntegration;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        
        // Inicializar integración TUU (false = development, true = production)
        tuuIntegration = new TuuPaymentIntegration(this, false);
    }
    
    private void procesarPago() {
        TuuPaymentIntegration.PaymentRequest request = new TuuPaymentIntegration.PaymentRequest();
        request.setAmount(15000); // $15.000
        request.setTip(0);
        request.setMethod(2); // Crédito
        request.setInstallments(-1); // Sin cuotas
        request.setClientRut("12345678-9");
        request.setClientName("Juan Pérez");
        request.setDocumentNumber("DOC-2024-001234");
        request.setDocumentType("Declaración Jurada");
        
        tuuIntegration.processPayment(request);
    }
    
    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        
        if (requestCode == 1001) { // PAYMENT_REQUEST_CODE
            tuuIntegration.handleTuuResponse(data);
        }
    }
    
    @Override
    public void onPaymentSuccess(String sequenceNumber, int tip) {
        Log.d("Payment", "Pago exitoso: " + sequenceNumber);
        // Actualizar UI, enviar a backend VecinoXpress
    }
    
    @Override
    public void onPaymentError(String errorCode, String errorMessage) {
        Log.e("Payment", "Error: " + errorCode + " - " + errorMessage);
        // Mostrar error al usuario
    }
}
*/
    `;
  }
}

export const tuuPaymentService = new TuuPaymentService();
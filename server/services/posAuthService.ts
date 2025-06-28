import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

interface POSCredentials {
  terminalId: string;
  accessKey: string;
  deviceType: 'SUNMI' | 'KOZEN' | 'GENERIC';
  imei: string;
  businessName: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
    region: string;
  };
  permissions: string[];
  isActive: boolean;
  lastLogin?: Date;
  deviceFingerprint?: string;
}

interface POSLoginRequest {
  terminalId: string;
  accessKey: string;
  deviceInfo: {
    imei: string;
    model: string;
    androidVersion: string;
    appVersion: string;
    fingerprint: string;
  };
  locationInfo: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
}

interface POSLoginResponse {
  success: boolean;
  token?: string;
  terminalInfo?: {
    id: string;
    businessName: string;
    permissions: string[];
    documentTypes: any[];
    pricingConfig: any;
    tuuConfig?: any;
  };
  error?: string;
  errorCode?: string;
}

class POSAuthService {
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'pos_secret_key_2024';
  private readonly TOKEN_EXPIRY = '12h'; // Tokens válidos por 12 horas

  // Configuración por defecto para terminales POS
  private readonly DEFAULT_POS_PERMISSIONS = [
    'create_document',
    'capture_evidence',
    'process_payment',
    'print_receipt',
    'sync_data'
  ];

  /**
   * Autentica un terminal POS con ID y clave
   */
  async authenticatePOS(loginRequest: POSLoginRequest): Promise<POSLoginResponse> {
    try {
      // Validar datos de entrada
      const validation = this.validateLoginRequest(loginRequest);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error,
          errorCode: 'INVALID_REQUEST'
        };
      }

      // Buscar terminal por ID
      const terminal = await this.findTerminalById(loginRequest.terminalId);
      if (!terminal) {
        return {
          success: false,
          error: 'Terminal no encontrado',
          errorCode: 'TERMINAL_NOT_FOUND'
        };
      }

      // Verificar que esté activo
      if (!terminal.isActive) {
        return {
          success: false,
          error: 'Terminal desactivado',
          errorCode: 'TERMINAL_INACTIVE'
        };
      }

      // Verificar clave de acceso
      const isValidKey = await this.verifyAccessKey(loginRequest.accessKey, terminal.accessKey);
      if (!isValidKey) {
        // Log intento de acceso fallido
        await this.logFailedAttempt(loginRequest.terminalId, loginRequest.deviceInfo.imei, 'INVALID_KEY');
        
        return {
          success: false,
          error: 'Clave de acceso inválida',
          errorCode: 'INVALID_ACCESS_KEY'
        };
      }

      // Verificar IMEI (seguridad adicional)
      if (terminal.imei && terminal.imei !== loginRequest.deviceInfo.imei) {
        await this.logFailedAttempt(loginRequest.terminalId, loginRequest.deviceInfo.imei, 'IMEI_MISMATCH');
        
        return {
          success: false,
          error: 'Dispositivo no autorizado',
          errorCode: 'DEVICE_NOT_AUTHORIZED'
        };
      }

      // Validar ubicación (dentro de rango permitido)
      const locationValid = await this.validateLocation(terminal, loginRequest.locationInfo);
      if (!locationValid.isValid) {
        return {
          success: false,
          error: locationValid.error,
          errorCode: 'LOCATION_INVALID'
        };
      }

      // Generar token JWT para el POS
      const token = this.generatePOSToken(terminal, loginRequest.deviceInfo);

      // Actualizar información de último login
      await this.updateLastLogin(terminal.terminalId, {
        loginTime: new Date(),
        deviceInfo: loginRequest.deviceInfo,
        location: loginRequest.locationInfo
      });

      // Obtener configuración específica del terminal
      const terminalConfig = await this.getTerminalConfiguration(terminal);

      // Log login exitoso
      await this.logSuccessfulLogin(terminal.terminalId, loginRequest.deviceInfo.imei);

      return {
        success: true,
        token,
        terminalInfo: {
          id: terminal.terminalId,
          businessName: terminal.businessName,
          permissions: terminal.permissions,
          documentTypes: terminalConfig.documentTypes,
          pricingConfig: terminalConfig.pricingConfig,
          tuuConfig: terminalConfig.tuuConfig
        }
      };

    } catch (error: any) {
      console.error('Error en autenticación POS:', error);
      return {
        success: false,
        error: 'Error interno del servidor',
        errorCode: 'INTERNAL_ERROR'
      };
    }
  }

  /**
   * Registra un nuevo terminal POS (solo admin)
   */
  async registerNewTerminal(terminalData: {
    businessName: string;
    contactName: string;
    contactPhone: string;
    address: string;
    region: string;
    latitude: number;
    longitude: number;
    deviceType: 'SUNMI' | 'KOZEN' | 'GENERIC';
    imei?: string;
  }): Promise<{
    terminalId: string;
    accessKey: string;
    qrCode: string;
    instructions: string[];
  }> {
    try {
      // Generar ID único de terminal
      const terminalId = this.generateTerminalId();
      
      // Generar clave de acceso segura
      const accessKey = this.generateAccessKey();
      
      // Hash de la clave para almacenamiento
      const hashedKey = await bcrypt.hash(accessKey, 12);

      // Crear registro del terminal
      const terminal: POSCredentials = {
        terminalId,
        accessKey: hashedKey,
        deviceType: terminalData.deviceType,
        imei: terminalData.imei || '',
        businessName: terminalData.businessName,
        location: {
          latitude: terminalData.latitude,
          longitude: terminalData.longitude,
          address: terminalData.address,
          region: terminalData.region
        },
        permissions: [...this.DEFAULT_POS_PERMISSIONS],
        isActive: true
      };

      // Guardar en base de datos
      await this.saveTerminal(terminal);

      // Generar código QR para configuración rápida
      const qrData = {
        terminalId,
        accessKey,
        serverUrl: process.env.APP_URL || 'https://vecinoxpress.cl',
        deviceType: terminalData.deviceType
      };
      
      const qrCode = await this.generateQRCode(JSON.stringify(qrData));

      // Instrucciones de configuración
      const instructions = this.generateSetupInstructions(terminalId, accessKey, terminalData.deviceType);

      return {
        terminalId,
        accessKey,
        qrCode,
        instructions
      };

    } catch (error: any) {
      console.error('Error registrando terminal:', error);
      throw new Error('Error al registrar terminal POS');
    }
  }

  /**
   * Valida token de POS
   */
  async validatePOSToken(token: string): Promise<{
    isValid: boolean;
    terminalId?: string;
    permissions?: string[];
    error?: string;
  }> {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as any;
      
      if (decoded.type !== 'POS') {
        return {
          isValid: false,
          error: 'Token inválido para POS'
        };
      }

      // Verificar que el terminal siga activo
      const terminal = await this.findTerminalById(decoded.terminalId);
      if (!terminal || !terminal.isActive) {
        return {
          isValid: false,
          error: 'Terminal no activo'
        };
      }

      return {
        isValid: true,
        terminalId: decoded.terminalId,
        permissions: terminal.permissions
      };

    } catch (error: any) {
      return {
        isValid: false,
        error: 'Token expirado o inválido'
      };
    }
  }

  /**
   * Renueva token de POS
   */
  async renewPOSToken(currentToken: string): Promise<{
    success: boolean;
    newToken?: string;
    error?: string;
  }> {
    try {
      const validation = await this.validatePOSToken(currentToken);
      if (!validation.isValid || !validation.terminalId) {
        return {
          success: false,
          error: validation.error || 'Token inválido'
        };
      }

      const terminal = await this.findTerminalById(validation.terminalId);
      if (!terminal) {
        return {
          success: false,
          error: 'Terminal no encontrado'
        };
      }

      const newToken = this.generatePOSToken(terminal, {
        imei: terminal.imei,
        model: 'RENEWED',
        androidVersion: 'N/A',
        appVersion: 'N/A',
        fingerprint: 'RENEWED'
      });

      return {
        success: true,
        newToken
      };

    } catch (error: any) {
      return {
        success: false,
        error: 'Error renovando token'
      };
    }
  }

  /**
   * Desactiva un terminal POS
   */
  async deactivateTerminal(terminalId: string): Promise<boolean> {
    try {
      // TODO: Implementar en base de datos
      console.log(`Terminal ${terminalId} desactivado`);
      return true;
    } catch (error) {
      console.error('Error desactivando terminal:', error);
      return false;
    }
  }

  /**
   * Obtiene estadísticas de acceso de terminales
   */
  async getAccessStats(terminalId?: string): Promise<{
    totalLogins: number;
    failedAttempts: number;
    lastLogin?: Date;
    activeTerminals: number;
    loginsByHour: Array<{ hour: number; count: number }>;
  }> {
    // TODO: Implementar consultas reales a base de datos
    return {
      totalLogins: 156,
      failedAttempts: 3,
      lastLogin: new Date(),
      activeTerminals: 12,
      loginsByHour: Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        count: Math.floor(Math.random() * 20)
      }))
    };
  }

  // Métodos privados

  private validateLoginRequest(request: POSLoginRequest): { isValid: boolean; error?: string } {
    if (!request.terminalId || !request.accessKey) {
      return { isValid: false, error: 'Terminal ID y clave de acceso requeridos' };
    }

    if (!request.deviceInfo?.imei || !request.deviceInfo?.model) {
      return { isValid: false, error: 'Información del dispositivo incompleta' };
    }

    if (!request.locationInfo?.latitude || !request.locationInfo?.longitude) {
      return { isValid: false, error: 'Información de ubicación requerida' };
    }

    return { isValid: true };
  }

  private async findTerminalById(terminalId: string): Promise<POSCredentials | null> {
    // TODO: Implementar consulta real a base de datos
    // Mock de terminal para desarrollo
    return {
      terminalId,
      accessKey: '$2b$12$8XZvNqKrJp9.8KjKqXZvNO8J.K9J8JKqXZvNO8J.K9J8JKqXZvNO', // 'pos123'
      deviceType: 'SUNMI',
      imei: '123456789012345',
      businessName: 'Minimarket Los Andes',
      location: {
        latitude: -33.4489,
        longitude: -70.6693,
        address: 'Av. Principal 123',
        region: 'Metropolitana'
      },
      permissions: this.DEFAULT_POS_PERMISSIONS,
      isActive: true,
      lastLogin: new Date()
    };
  }

  private async verifyAccessKey(inputKey: string, hashedKey: string): Promise<boolean> {
    try {
      return await bcrypt.compare(inputKey, hashedKey);
    } catch (error) {
      return false;
    }
  }

  private async validateLocation(
    terminal: POSCredentials, 
    currentLocation: { latitude: number; longitude: number; accuracy: number }
  ): Promise<{ isValid: boolean; error?: string }> {
    // Calcular distancia desde ubicación registrada
    const distance = this.calculateDistance(
      terminal.location.latitude,
      terminal.location.longitude,
      currentLocation.latitude,
      currentLocation.longitude
    );

    // Permitir hasta 500 metros de diferencia (configurable)
    const maxDistance = 0.5; // km
    
    if (distance > maxDistance) {
      return {
        isValid: false,
        error: `Ubicación muy distante del punto registrado (${distance.toFixed(2)}km)`
      };
    }

    // Verificar precisión GPS
    if (currentLocation.accuracy > 100) { // 100 metros de precisión máxima
      return {
        isValid: false,
        error: 'Precisión GPS insuficiente'
      };
    }

    return { isValid: true };
  }

  private generatePOSToken(terminal: POSCredentials, deviceInfo: any): string {
    const payload = {
      type: 'POS',
      terminalId: terminal.terminalId,
      businessName: terminal.businessName,
      deviceType: terminal.deviceType,
      imei: deviceInfo.imei,
      permissions: terminal.permissions,
      iat: Math.floor(Date.now() / 1000)
    };

    return jwt.sign(payload, this.JWT_SECRET, { expiresIn: this.TOKEN_EXPIRY });
  }

  private generateTerminalId(): string {
    return 'POS-' + Date.now().toString().slice(-8) + '-' + Math.random().toString(36).substr(2, 4).toUpperCase();
  }

  private generateAccessKey(): string {
    // Generar clave alfanumérica de 8 caracteres
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Sin caracteres confusos
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private async getTerminalConfiguration(terminal: POSCredentials) {
    // TODO: Implementar consulta real de configuración
    return {
      documentTypes: [
        { id: 1, name: 'Declaración Jurada Simple', price: 5000 },
        { id: 2, name: 'Autorización Notarial', price: 8000 },
        { id: 3, name: 'Certificado de Residencia', price: 4000 }
      ],
      pricingConfig: {
        region: terminal.location.region,
        discountRate: 0.20, // 20% descuento vs notarías
        expressFee: 2000
      },
      tuuConfig: {
        enabled: true,
        environment: 'dev',
        supportedMethods: [1, 2], // débito y crédito
        maxAmount: 50000
      }
    };
  }

  private async generateQRCode(data: string): Promise<string> {
    // TODO: Implementar generación real de QR
    return `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==`;
  }

  private generateSetupInstructions(terminalId: string, accessKey: string, deviceType: string): string[] {
    const baseInstructions = [
      '1. Instalar APK VecinoXpress POS en el dispositivo',
      `2. Abrir la aplicación y seleccionar "Configurar Terminal"`,
      `3. Ingresar Terminal ID: ${terminalId}`,
      `4. Ingresar Clave de Acceso: ${accessKey}`,
      '5. Permitir acceso a GPS y cámara cuando se solicite',
      '6. Esperar sincronización inicial de datos',
      '7. Realizar prueba de conexión y primer documento'
    ];

    if (deviceType === 'SUNMI') {
      baseInstructions.push('8. Configurar integración TUU para pagos (opcional)');
      baseInstructions.push('9. Activar modo quiosco en configuración SUNMI');
    } else if (deviceType === 'KOZEN') {
      baseInstructions.push('8. Configurar impresora térmica KOZEN');
      baseInstructions.push('9. Instalar SDK de pagos TUU PRO2');
    }

    return baseInstructions;
  }

  private async saveTerminal(terminal: POSCredentials): Promise<void> {
    // TODO: Implementar guardado en base de datos
    console.log('Terminal registrado:', terminal.terminalId);
  }

  private async updateLastLogin(terminalId: string, loginInfo: any): Promise<void> {
    // TODO: Implementar actualización en base de datos
    console.log(`Login actualizado para terminal: ${terminalId}`);
  }

  private async logFailedAttempt(terminalId: string, imei: string, reason: string): Promise<void> {
    // TODO: Implementar log de seguridad
    console.log(`Intento fallido - Terminal: ${terminalId}, IMEI: ${imei}, Razón: ${reason}`);
  }

  private async logSuccessfulLogin(terminalId: string, imei: string): Promise<void> {
    // TODO: Implementar log de auditoría
    console.log(`Login exitoso - Terminal: ${terminalId}, IMEI: ${imei}`);
  }

  /**
   * Genera código completo para APK Android con autenticación
   */
  generateAPKAuthCode(): string {
    return `
// VecinoXpress POS Authentication for Android
// Archivo: POSAuthManager.java

package cl.vecinoxpress.pos.auth;

import android.content.Context;
import android.content.SharedPreferences;
import android.location.Location;
import android.util.Log;
import okhttp3.*;
import org.json.JSONObject;
import java.io.IOException;

public class POSAuthManager {
    private static final String TAG = "VecinoXpress_Auth";
    private static final String PREFS_NAME = "pos_auth";
    private static final String KEY_TERMINAL_ID = "terminal_id";
    private static final String KEY_ACCESS_KEY = "access_key";
    private static final String KEY_TOKEN = "auth_token";
    
    private Context context;
    private SharedPreferences prefs;
    private OkHttpClient httpClient;
    private String serverUrl;
    
    public POSAuthManager(Context context, String serverUrl) {
        this.context = context;
        this.serverUrl = serverUrl;
        this.prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        this.httpClient = new OkHttpClient();
    }
    
    /**
     * Configuración inicial del terminal
     */
    public void setupTerminal(String terminalId, String accessKey) {
        prefs.edit()
            .putString(KEY_TERMINAL_ID, terminalId)
            .putString(KEY_ACCESS_KEY, accessKey)
            .apply();
        
        Log.d(TAG, "Terminal configurado: " + terminalId);
    }
    
    /**
     * Login del terminal POS
     */
    public void loginPOS(Location location, POSAuthCallback callback) {
        String terminalId = prefs.getString(KEY_TERMINAL_ID, null);
        String accessKey = prefs.getString(KEY_ACCESS_KEY, null);
        
        if (terminalId == null || accessKey == null) {
            callback.onError("Terminal no configurado");
            return;
        }
        
        try {
            JSONObject loginData = new JSONObject();
            loginData.put("terminalId", terminalId);
            loginData.put("accessKey", accessKey);
            
            // Device Info
            JSONObject deviceInfo = new JSONObject();
            deviceInfo.put("imei", getDeviceIMEI());
            deviceInfo.put("model", android.os.Build.MODEL);
            deviceInfo.put("androidVersion", android.os.Build.VERSION.RELEASE);
            deviceInfo.put("appVersion", getAppVersion());
            deviceInfo.put("fingerprint", android.os.Build.FINGERPRINT);
            loginData.put("deviceInfo", deviceInfo);
            
            // Location Info
            JSONObject locationInfo = new JSONObject();
            locationInfo.put("latitude", location.getLatitude());
            locationInfo.put("longitude", location.getLongitude());
            locationInfo.put("accuracy", location.getAccuracy());
            loginData.put("locationInfo", locationInfo);
            
            RequestBody body = RequestBody.create(
                loginData.toString(),
                MediaType.get("application/json; charset=utf-8")
            );
            
            Request request = new Request.Builder()
                .url(serverUrl + "/api/pos/login")
                .post(body)
                .build();
            
            httpClient.newCall(request).enqueue(new Callback() {
                @Override
                public void onFailure(Call call, IOException e) {
                    callback.onError("Error de conexión: " + e.getMessage());
                }
                
                @Override
                public void onResponse(Call call, Response response) throws IOException {
                    try {
                        String responseBody = response.body().string();
                        JSONObject jsonResponse = new JSONObject(responseBody);
                        
                        if (jsonResponse.getBoolean("success")) {
                            String token = jsonResponse.getString("token");
                            JSONObject terminalInfo = jsonResponse.getJSONObject("terminalInfo");
                            
                            // Guardar token
                            prefs.edit().putString(KEY_TOKEN, token).apply();
                            
                            callback.onSuccess(token, terminalInfo);
                        } else {
                            String error = jsonResponse.getString("error");
                            String errorCode = jsonResponse.optString("errorCode", "UNKNOWN");
                            callback.onError(error + " (" + errorCode + ")");
                        }
                    } catch (Exception e) {
                        callback.onError("Error procesando respuesta: " + e.getMessage());
                    }
                }
            });
            
        } catch (Exception e) {
            callback.onError("Error preparando login: " + e.getMessage());
        }
    }
    
    /**
     * Verifica si hay token válido
     */
    public boolean hasValidToken() {
        String token = prefs.getString(KEY_TOKEN, null);
        return token != null && !isTokenExpired(token);
    }
    
    /**
     * Obtiene token actual
     */
    public String getCurrentToken() {
        return prefs.getString(KEY_TOKEN, null);
    }
    
    /**
     * Renueva token automáticamente
     */
    public void renewToken(POSAuthCallback callback) {
        String currentToken = getCurrentToken();
        if (currentToken == null) {
            callback.onError("No hay token para renovar");
            return;
        }
        
        try {
            JSONObject renewData = new JSONObject();
            renewData.put("currentToken", currentToken);
            
            RequestBody body = RequestBody.create(
                renewData.toString(),
                MediaType.get("application/json; charset=utf-8")
            );
            
            Request request = new Request.Builder()
                .url(serverUrl + "/api/pos/renew-token")
                .post(body)
                .build();
            
            httpClient.newCall(request).enqueue(new Callback() {
                @Override
                public void onFailure(Call call, IOException e) {
                    callback.onError("Error renovando token: " + e.getMessage());
                }
                
                @Override
                public void onResponse(Call call, Response response) throws IOException {
                    try {
                        String responseBody = response.body().string();
                        JSONObject jsonResponse = new JSONObject(responseBody);
                        
                        if (jsonResponse.getBoolean("success")) {
                            String newToken = jsonResponse.getString("newToken");
                            prefs.edit().putString(KEY_TOKEN, newToken).apply();
                            
                            callback.onTokenRenewed(newToken);
                        } else {
                            callback.onError(jsonResponse.getString("error"));
                        }
                    } catch (Exception e) {
                        callback.onError("Error procesando renovación: " + e.getMessage());
                    }
                }
            });
            
        } catch (Exception e) {
            callback.onError("Error renovando token: " + e.getMessage());
        }
    }
    
    /**
     * Logout del terminal
     */
    public void logout() {
        prefs.edit()
            .remove(KEY_TOKEN)
            .apply();
        
        Log.d(TAG, "Logout completado");
    }
    
    // Métodos privados
    
    private String getDeviceIMEI() {
        // TODO: Implementar obtención real de IMEI
        return "123456789012345";
    }
    
    private String getAppVersion() {
        try {
            return context.getPackageManager()
                .getPackageInfo(context.getPackageName(), 0).versionName;
        } catch (Exception e) {
            return "1.0.0";
        }
    }
    
    private boolean isTokenExpired(String token) {
        // TODO: Implementar verificación real de expiración JWT
        return false;
    }
    
    // Interface para callbacks
    public interface POSAuthCallback {
        void onSuccess(String token, JSONObject terminalInfo);
        void onError(String error);
        void onTokenRenewed(String newToken);
    }
}

// Uso en MainActivity:
/*
public class MainActivity extends AppCompatActivity implements POSAuthManager.POSAuthCallback {
    private POSAuthManager authManager;
    private LocationManager locationManager;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        
        authManager = new POSAuthManager(this, "https://api.vecinoxpress.cl");
        
        // Verificar si ya está configurado
        if (!authManager.hasValidToken()) {
            mostrarPantallaConfiguracion();
        } else {
            iniciarOperacionNormal();
        }
    }
    
    private void configurarTerminal(String terminalId, String accessKey) {
        authManager.setupTerminal(terminalId, accessKey);
        realizarLogin();
    }
    
    private void realizarLogin() {
        obtenerUbicacion(location -> {
            authManager.loginPOS(location, this);
        });
    }
    
    @Override
    public void onSuccess(String token, JSONObject terminalInfo) {
        Log.d("Auth", "Login exitoso: " + terminalInfo.toString());
        iniciarOperacionNormal();
    }
    
    @Override
    public void onError(String error) {
        Log.e("Auth", "Error de autenticación: " + error);
        mostrarError(error);
    }
    
    @Override
    public void onTokenRenewed(String newToken) {
        Log.d("Auth", "Token renovado exitosamente");
    }
}
*/
    `;
  }
}

export const posAuthService = new POSAuthService();
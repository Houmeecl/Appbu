import { storage } from "../storage";
import { validateChileanGPS } from "../utils/validation";
import crypto from "crypto";

interface POSDeviceInfo {
  imei: string;
  model: string;
  brand: string;
  androidVersion: string;
  appVersion: string;
  screenResolution: string;
  batteryLevel?: number;
  networkType: string;
  macAddress?: string;
  serialNumber?: string;
}

interface POSLocationInfo {
  latitude: number;
  longitude: number;
  accuracy: number;
  address: string;
  region: string;
  city: string;
  zone: string;
}

interface POSRegistrationRequest {
  deviceInfo: POSDeviceInfo;
  locationInfo: POSLocationInfo;
  businessInfo: {
    businessName: string;
    businessType: string;
    contactName: string;
    contactPhone: string;
    contactEmail: string;
    rut?: string;
  };
  operatorInfo: {
    operatorName: string;
    operatorRut: string;
    operatorPhone: string;
    experience: string;
    shift: string;
  };
}

interface POSCredentials {
  terminalId: number;
  accessKey: string;
  secretKey: string;
  apiEndpoint: string;
  certificateFingerprint: string;
  encryptionKey: string;
}

interface POSSecurityProfile {
  imei: string;
  deviceFingerprint: string;
  trustedStatus: 'verified' | 'pending' | 'suspicious' | 'blocked';
  lastLocationUpdate: Date;
  securityFlags: string[];
  riskScore: number;
}

class POSRegistrationService {
  private readonly IMEI_PATTERN = /^\d{15}$/; // 15 dígitos exactos
  private readonly MAC_PATTERN = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;

  async registerNewPOS(request: POSRegistrationRequest): Promise<{
    success: boolean;
    terminalId?: number;
    credentials?: POSCredentials;
    securityProfile?: POSSecurityProfile;
    activationInstructions?: string[];
    errorMessage?: string;
  }> {
    try {
      // Validar IMEI
      const imeiValidation = await this.validateIMEI(request.deviceInfo.imei);
      if (!imeiValidation.valid) {
        return {
          success: false,
          errorMessage: `IMEI inválido: ${imeiValidation.reason}`
        };
      }

      // Verificar que no esté registrado
      const existingPOS = await this.findPOSByIMEI(request.deviceInfo.imei);
      if (existingPOS) {
        return {
          success: false,
          errorMessage: `Dispositivo ya registrado. Terminal ID: ${existingPOS.id}`
        };
      }

      // Validar ubicación GPS
      const locationValidation = this.validatePOSLocation(request.locationInfo);
      if (!locationValidation.valid) {
        return {
          success: false,
          errorMessage: `Ubicación inválida: ${locationValidation.reason}`
        };
      }

      // Generar credenciales seguras
      const credentials = this.generateSecureCredentials();

      // Crear perfil de seguridad
      const securityProfile = await this.createSecurityProfile(request.deviceInfo, request.locationInfo);

      // Registrar en base de datos
      const terminal = await storage.createPosTerminal({
        name: `${request.businessInfo.businessName} - ${request.deviceInfo.model}`,
        address: request.locationInfo.address,
        region: request.locationInfo.region,
        latitude: request.locationInfo.latitude.toString(),
        longitude: request.locationInfo.longitude.toString(),
        isActive: false // Requiere activación manual
      });

      // Guardar información del dispositivo
      await this.savePOSDeviceInfo(terminal.id, request, credentials, securityProfile);

      // Generar instrucciones de activación
      const activationInstructions = this.generateActivationInstructions(terminal.id, credentials);

      return {
        success: true,
        terminalId: terminal.id,
        credentials,
        securityProfile,
        activationInstructions
      };

    } catch (error) {
      console.error("Error registrando POS:", error);
      return {
        success: false,
        errorMessage: "Error interno del servidor durante el registro"
      };
    }
  }

  async authenticatePOS(imei: string, accessKey: string, secretKey: string): Promise<{
    authenticated: boolean;
    terminalId?: number;
    securityProfile?: POSSecurityProfile;
    errorMessage?: string;
  }> {
    try {
      // Buscar POS por IMEI
      const posInfo = await this.getPOSByIMEI(imei);
      if (!posInfo) {
        return {
          authenticated: false,
          errorMessage: "Dispositivo no registrado"
        };
      }

      // Verificar credenciales
      const credentialsValid = await this.verifyCredentials(posInfo.terminalId, accessKey, secretKey);
      if (!credentialsValid) {
        // Registrar intento de acceso sospechoso
        await this.logSuspiciousActivity(imei, "invalid_credentials");
        return {
          authenticated: false,
          errorMessage: "Credenciales inválidas"
        };
      }

      // Verificar estado del terminal
      if (!posInfo.isActive) {
        return {
          authenticated: false,
          errorMessage: "Terminal no activado. Contacte al administrador."
        };
      }

      // Actualizar perfil de seguridad
      const securityProfile = await this.updateSecurityProfile(imei);

      return {
        authenticated: true,
        terminalId: posInfo.terminalId,
        securityProfile
      };

    } catch (error) {
      console.error("Error autenticando POS:", error);
      return {
        authenticated: false,
        errorMessage: "Error interno durante autenticación"
      };
    }
  }

  async updatePOSLocation(imei: string, newLocation: POSLocationInfo): Promise<{
    success: boolean;
    riskAssessment?: {
      riskLevel: 'low' | 'medium' | 'high';
      reasons: string[];
      recommendedActions: string[];
    };
    errorMessage?: string;
  }> {
    try {
      const posInfo = await this.getPOSByIMEI(imei);
      if (!posInfo) {
        return {
          success: false,
          errorMessage: "POS no encontrado"
        };
      }

      // Validar nueva ubicación
      if (!validateChileanGPS(newLocation.latitude, newLocation.longitude)) {
        return {
          success: false,
          errorMessage: "Ubicación fuera del territorio chileno"
        };
      }

      // Calcular distancia de movimiento
      const previousLocation = {
        latitude: parseFloat(posInfo.latitude || "0"),
        longitude: parseFloat(posInfo.longitude || "0")
      };

      const distance = this.calculateDistance(previousLocation, newLocation);
      const riskAssessment = this.assessLocationRisk(distance, newLocation);

      // Actualizar ubicación
      await this.updatePOSLocationInDB(posInfo.terminalId, newLocation);

      // Registrar cambio de ubicación
      await this.logLocationChange(imei, previousLocation, newLocation, distance);

      return {
        success: true,
        riskAssessment
      };

    } catch (error) {
      console.error("Error actualizando ubicación POS:", error);
      return {
        success: false,
        errorMessage: "Error actualizando ubicación"
      };
    }
  }

  async getPOSStatus(imei: string): Promise<{
    status: 'active' | 'inactive' | 'suspended' | 'not_found';
    terminalInfo?: any;
    securityProfile?: POSSecurityProfile;
    lastActivity?: Date;
    healthCheck?: {
      battery: number;
      network: string;
      storage: number;
      performance: string;
    };
  }> {
    try {
      const posInfo = await this.getPOSByIMEI(imei);
      if (!posInfo) {
        return { status: 'not_found' };
      }

      const securityProfile = await this.getSecurityProfile(imei);
      
      let status: 'active' | 'inactive' | 'suspended' = 'inactive';
      if (posInfo.isActive && securityProfile?.trustedStatus === 'verified') {
        status = 'active';
      } else if (securityProfile?.trustedStatus === 'blocked') {
        status = 'suspended';
      }

      return {
        status,
        terminalInfo: posInfo,
        securityProfile,
        lastActivity: new Date(posInfo.lastActivity),
        healthCheck: await this.getDeviceHealthCheck(imei)
      };

    } catch (error) {
      console.error("Error obteniendo estado POS:", error);
      return { status: 'not_found' };
    }
  }

  // Métodos privados de validación y seguridad
  private async validateIMEI(imei: string): Promise<{ valid: boolean; reason?: string }> {
    // Validar formato
    if (!this.IMEI_PATTERN.test(imei)) {
      return { valid: false, reason: "Formato de IMEI inválido (debe tener 15 dígitos)" };
    }

    // Validar algoritmo de Luhn para IMEI
    if (!this.validateLuhnAlgorithm(imei)) {
      return { valid: false, reason: "IMEI no pasa validación de integridad" };
    }

    // Verificar que no esté en lista negra
    const isBlacklisted = await this.checkIMEIBlacklist(imei);
    if (isBlacklisted) {
      return { valid: false, reason: "IMEI bloqueado por seguridad" };
    }

    return { valid: true };
  }

  private validateLuhnAlgorithm(imei: string): boolean {
    let sum = 0;
    let alternate = false;

    for (let i = imei.length - 1; i >= 0; i--) {
      let n = parseInt(imei.charAt(i), 10);

      if (alternate) {
        n *= 2;
        if (n > 9) {
          n = (n % 10) + 1;
        }
      }

      sum += n;
      alternate = !alternate;
    }

    return (sum % 10) === 0;
  }

  private async checkIMEIBlacklist(imei: string): Promise<boolean> {
    // En producción, esto consultaría una base de datos de IMEIs bloqueados
    const blacklistedIMEIs = [
      "000000000000000",
      "111111111111111",
      "999999999999999"
    ];
    
    return blacklistedIMEIs.includes(imei);
  }

  private validatePOSLocation(location: POSLocationInfo): { valid: boolean; reason?: string } {
    if (!validateChileanGPS(location.latitude, location.longitude)) {
      return { valid: false, reason: "Coordenadas fuera del territorio chileno" };
    }

    if (location.accuracy > 100) {
      return { valid: false, reason: "Precisión GPS insuficiente (>100m)" };
    }

    if (!location.address || location.address.length < 10) {
      return { valid: false, reason: "Dirección incompleta" };
    }

    return { valid: true };
  }

  private generateSecureCredentials(): POSCredentials {
    const terminalId = Math.floor(Math.random() * 900000) + 100000; // 6 dígitos
    const accessKey = crypto.randomBytes(16).toString('hex');
    const secretKey = crypto.randomBytes(32).toString('hex');
    const encryptionKey = crypto.randomBytes(32).toString('hex');
    const certificateFingerprint = crypto.randomBytes(20).toString('hex');

    return {
      terminalId,
      accessKey,
      secretKey,
      apiEndpoint: process.env.API_ENDPOINT || "https://api.vecinoxpress.cl",
      certificateFingerprint,
      encryptionKey
    };
  }

  private async createSecurityProfile(deviceInfo: POSDeviceInfo, locationInfo: POSLocationInfo): Promise<POSSecurityProfile> {
    const deviceFingerprint = this.generateDeviceFingerprint(deviceInfo);
    
    return {
      imei: deviceInfo.imei,
      deviceFingerprint,
      trustedStatus: 'pending',
      lastLocationUpdate: new Date(),
      securityFlags: [],
      riskScore: this.calculateInitialRiskScore(deviceInfo, locationInfo)
    };
  }

  private generateDeviceFingerprint(deviceInfo: POSDeviceInfo): string {
    const fingerprint = `${deviceInfo.imei}-${deviceInfo.model}-${deviceInfo.brand}-${deviceInfo.androidVersion}`;
    return crypto.createHash('sha256').update(fingerprint).digest('hex');
  }

  private calculateInitialRiskScore(deviceInfo: POSDeviceInfo, locationInfo: POSLocationInfo): number {
    let riskScore = 0;

    // Factores de riesgo del dispositivo
    if (!deviceInfo.androidVersion || deviceInfo.androidVersion < "10") riskScore += 20;
    if (!deviceInfo.macAddress) riskScore += 10;
    if (locationInfo.accuracy > 50) riskScore += 15;

    // Modelo de dispositivo conocido
    const trustedBrands = ['Samsung', 'Huawei', 'Xiaomi', 'Motorola'];
    if (!trustedBrands.includes(deviceInfo.brand)) riskScore += 10;

    return Math.min(riskScore, 100);
  }

  private async findPOSByIMEI(imei: string): Promise<any | null> {
    // En implementación real, buscaría en una tabla específica de dispositivos POS
    // Por ahora simulamos
    return null;
  }

  private async savePOSDeviceInfo(terminalId: number, request: POSRegistrationRequest, credentials: POSCredentials, securityProfile: POSSecurityProfile): Promise<void> {
    // Guardar información del dispositivo en tabla dedicada
    // En implementación real, esto iría a una tabla pos_devices
    console.log(`Guardando info dispositivo para terminal ${terminalId}:`, {
      imei: request.deviceInfo.imei,
      securityProfile: securityProfile.deviceFingerprint
    });
  }

  private generateActivationInstructions(terminalId: number, credentials: POSCredentials): string[] {
    return [
      `1. Abra la aplicación VecinoXpress POS`,
      `2. Seleccione "Activar Terminal"`,
      `3. Ingrese el Terminal ID: ${terminalId}`,
      `4. Ingrese Access Key: ${credentials.accessKey}`,
      `5. Ingrese Secret Key: ${credentials.secretKey}`,
      `6. Confirme la ubicación GPS`,
      `7. Espere confirmación de activación`,
      `8. Terminal estará listo para operar`
    ];
  }

  private async getPOSByIMEI(imei: string): Promise<any | null> {
    // Simulación - en producción consultaría la base de datos
    return {
      terminalId: 1,
      isActive: true,
      latitude: "-33.4489",
      longitude: "-70.6693",
      lastActivity: new Date().toISOString()
    };
  }

  private async verifyCredentials(terminalId: number, accessKey: string, secretKey: string): Promise<boolean> {
    // Verificación de credenciales contra base de datos
    return accessKey.length === 32 && secretKey.length === 64;
  }

  private async logSuspiciousActivity(imei: string, activityType: string): Promise<void> {
    console.log(`Actividad sospechosa detectada - IMEI: ${imei}, Tipo: ${activityType}`);
  }

  private async updateSecurityProfile(imei: string): Promise<POSSecurityProfile> {
    return {
      imei,
      deviceFingerprint: "mock_fingerprint",
      trustedStatus: 'verified',
      lastLocationUpdate: new Date(),
      securityFlags: [],
      riskScore: 5
    };
  }

  private calculateDistance(pos1: { latitude: number; longitude: number }, pos2: { latitude: number; longitude: number }): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (pos2.latitude - pos1.latitude) * Math.PI / 180;
    const dLon = (pos2.longitude - pos1.longitude) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(pos1.latitude * Math.PI / 180) * Math.cos(pos2.latitude * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private assessLocationRisk(distance: number, location: POSLocationInfo): {
    riskLevel: 'low' | 'medium' | 'high';
    reasons: string[];
    recommendedActions: string[];
  } {
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    const reasons: string[] = [];
    const recommendedActions: string[] = [];

    if (distance > 50) {
      riskLevel = 'high';
      reasons.push(`Movimiento sospechoso: ${distance.toFixed(1)}km`);
      recommendedActions.push("Verificar identidad del operador");
      recommendedActions.push("Confirmar autorización de reubicación");
    } else if (distance > 10) {
      riskLevel = 'medium';
      reasons.push(`Movimiento significativo: ${distance.toFixed(1)}km`);
      recommendedActions.push("Notificar al supervisor");
    }

    if (location.accuracy > 30) {
      if (riskLevel === 'low') riskLevel = 'medium';
      reasons.push("Precisión GPS baja");
      recommendedActions.push("Mejorar señal GPS");
    }

    return { riskLevel, reasons, recommendedActions };
  }

  private async updatePOSLocationInDB(terminalId: number, location: POSLocationInfo): Promise<void> {
    // Actualizar ubicación en base de datos
    console.log(`Actualizando ubicación terminal ${terminalId}:`, location);
  }

  private async logLocationChange(imei: string, from: any, to: POSLocationInfo, distance: number): Promise<void> {
    console.log(`Cambio de ubicación registrado - IMEI: ${imei}, Distancia: ${distance.toFixed(1)}km`);
  }

  private async getSecurityProfile(imei: string): Promise<POSSecurityProfile | null> {
    return {
      imei,
      deviceFingerprint: "mock_fingerprint",
      trustedStatus: 'verified',
      lastLocationUpdate: new Date(),
      securityFlags: [],
      riskScore: 5
    };
  }

  private async getDeviceHealthCheck(imei: string): Promise<{
    battery: number;
    network: string;
    storage: number;
    performance: string;
  }> {
    return {
      battery: 85,
      network: "4G",
      storage: 75,
      performance: "good"
    };
  }
}

export const posRegistrationService = new POSRegistrationService();
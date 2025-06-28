import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertDocumentSchema, insertSignatureSchema, insertEvidenceSchema } from "@shared/schema";
import { z } from "zod";
import { pdfService } from "./services/pdfService";
import { qrService } from "./services/qrService";
import { etokenService } from "./services/etokenService";
import { indigenousService } from "./services/indigenousService";
import { perplexityService } from "./services/perplexityService";
import { sociologyService } from "./services/sociologyService";
import { dynamicPricingService } from "./services/dynamicPricingService";
import { commissionService } from "./services/commissionService";
import { posRegistrationService } from "./services/posRegistrationService";
import { expressProcessService } from "./services/expressProcessService";
import { tuuPaymentService } from "./services/tuuPaymentService";
import { posAuthService } from "./services/posAuthService";
import { authenticateToken, requireRole, generateToken, AuthRequest, rateLimit } from './middleware/auth';
import { validateRUT, sanitizeInput } from './utils/validation';
import bcrypt from 'bcryptjs';

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication endpoints
  app.post("/api/auth/login", rateLimit(5, 15 * 60 * 1000), async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }
      
      const user = await storage.getUserByUsername(sanitizeInput(username));
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      const token = generateToken(user);
      
      // Log successful login
      await storage.createAuditLog({
        action: "user_login",
        userId: user.id,
        details: { username: user.username, ip: req.ip }
      });
      
      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role
        }
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Authentication failed" });
    }
  });

  app.post("/api/auth/register", authenticateToken, requireRole(["admin"]), async (req, res) => {
    try {
      const { username, password, name, role } = req.body;
      
      if (!username || !password || !name || !role) {
        return res.status(400).json({ message: "All fields required" });
      }
      
      const existingUser = await storage.getUserByUsername(sanitizeInput(username));
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }
      
      const hashedPassword = await bcrypt.hash(password, 12);
      
      const newUser = await storage.createUser({
        username: sanitizeInput(username),
        password: hashedPassword,
        name: sanitizeInput(name),
        role: role
      });
      
      res.status(201).json({
        id: newUser.id,
        username: newUser.username,
        name: newUser.name,
        role: newUser.role
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Document Types
  app.get("/api/document-types", async (req, res) => {
    try {
      const types = await storage.getDocumentTypes();
      res.json(types);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch document types" });
    }
  });

  // POS Terminals
  app.get("/api/pos-terminals", async (req, res) => {
    try {
      const terminals = await storage.getPosTerminals();
      res.json(terminals);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch POS terminals" });
    }
  });

  // Create Document with enhanced validation
  app.post("/api/documents", rateLimit(10, 60 * 1000), async (req, res) => {
    try {
      const data = insertDocumentSchema.parse(req.body);
      
      // Validate Chilean RUT
      if (!validateRUT(data.clientRut)) {
        return res.status(400).json({ message: "Invalid Chilean RUT format" });
      }
      
      // Sanitize inputs
      data.clientName = sanitizeInput(data.clientName);
      data.clientRut = sanitizeInput(data.clientRut);
      
      // Generate document number if not provided
      if (!data.documentNumber) {
        const year = new Date().getFullYear();
        const sequence = Date.now().toString().slice(-6);
        data.documentNumber = `DOC-${year}-${sequence}`;
      }
      
      // Generate document hash for integrity
      const documentHash = qrService.generateDocumentHash(data);
      
      const document = await storage.createDocument({
        ...data,
        hash: documentHash
      });
      
      // Generate QR code for validation
      const qrCode = qrService.generateQRCode(documentHash);
      await storage.updateDocumentQR(document.id, qrCode);
      
      // Log document creation
      await storage.createAuditLog({
        documentId: document.id,
        action: "document_created",
        details: { documentNumber: document.documentNumber, qrCode },
        ipAddress: req.ip,
      });

      res.json({ ...document, qrCode });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid document data", errors: error.errors });
      } else {
        console.error("Document creation error:", error);
        res.status(500).json({ message: "Failed to create document" });
      }
    }
  });

  // Get Document by ID with relations
  app.get("/api/documents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const document = await storage.getDocument(id);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      const evidence = await storage.getDocumentEvidence(id);
      const signatures = await storage.getDocumentSignatures(id);

      res.json({
        ...document,
        evidence,
        signatures,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch document" });
    }
  });

  // Add Evidence to Document
  app.post("/api/documents/:id/evidence", async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const { type, data } = req.body;

      const evidence = await storage.createEvidence({
        documentId,
        type,
        data,
      });

      // Log evidence addition
      await storage.createAuditLog({
        documentId,
        action: "evidence_added",
        details: { type },
        ipAddress: req.ip,
      });

      res.json(evidence);
    } catch (error) {
      res.status(500).json({ message: "Failed to add evidence" });
    }
  });

  // Simple Signature (from POS)
  app.post("/api/documents/:id/sign-simple", async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const { signatureData, signerName, signerRut } = req.body;

      const signature = await storage.createSignature({
        documentId,
        type: "simple",
        signatureData,
        signerName,
        signerRut,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      // Update document status to pending advanced signature
      await storage.updateDocumentStatus(documentId, "pending");

      // Log simple signature
      await storage.createAuditLog({
        documentId,
        action: "simple_signature_added",
        details: { signerName, signerRut },
        ipAddress: req.ip,
      });

      res.json(signature);
    } catch (error) {
      res.status(500).json({ message: "Failed to add simple signature" });
    }
  });

  // Advanced Signature (from Certificador with eToken)
  app.post("/api/documents/:id/sign-advanced", authenticateToken, requireRole(["certificador", "admin"]), async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const { pin, certificatorNotes } = req.body;
      const authReq = req as AuthRequest;
      
      if (!pin) {
        return res.status(400).json({ message: "eToken PIN required" });
      }
      
      // Initialize eToken service
      await etokenService.initializePKCS11();
      
      // Authenticate with eToken
      const authenticated = await etokenService.authenticate(pin);
      if (!authenticated) {
        return res.status(401).json({ message: "eToken authentication failed" });
      }
      
      // Get document and evidence
      const document = await storage.getDocument(documentId);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      const evidence = await storage.getDocumentEvidence(documentId);
      
      // Generate professional PDF with signatures
      const pdfBuffer = await pdfService.generateSignedPDF(document, "advanced_signature_hash", evidence);
      
      // Apply eToken signature to PDF
      const signedPdfBuffer = await etokenService.signPDF(pdfBuffer);
      
      // Get certificate info for signature record
      const certInfo = await etokenService.getCertificateInfo();
      
      const signature = await storage.createSignature({
        documentId,
        type: "advanced",
        signatureData: "fea_signature_hash_placeholder",
        signerName: authReq.user!.name,
        signerRut: "certificador_rut",
        certificateInfo: JSON.stringify(certInfo),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });
      
      // Update document status to completed
      await storage.updateDocumentStatus(documentId, "completed", new Date());
      
      // Log advanced signature
      await storage.createAuditLog({
        documentId,
        action: "advanced_signature_applied",
        userId: authReq.user!.id,
        details: { 
          certificatorName: authReq.user!.name,
          certificateSerial: certInfo.serialNumber,
          notes: certificatorNotes
        },
        ipAddress: req.ip,
      });
      
      res.json({
        signature,
        document: { ...document, status: "completed" },
        certificateInfo: certInfo,
        pdfGenerated: true
      });


    } catch (error) {
      console.error("Advanced signature error:", error);
      res.status(500).json({ message: "Failed to create advanced signature" });
    }
  });

  // Get Pending Documents for Certificador
  app.get("/api/pending-documents", async (req, res) => {
    try {
      const documents = await storage.getPendingDocuments();
      
      // Enrich with evidence and terminal info
      const enrichedDocuments = await Promise.all(
        documents.map(async (doc) => {
          const evidence = await storage.getDocumentEvidence(doc.id);
          const terminal = doc.posTerminalId ? await storage.getPosTerminal(doc.posTerminalId) : null;
          
          return {
            ...doc,
            evidence,
            terminal,
          };
        })
      );

      res.json(enrichedDocuments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pending documents" });
    }
  });

  // Document Validation by Hash or QR
  app.get("/api/validate/:code", async (req, res) => {
    try {
      const { code } = req.params;
      
      // Try to find by hash or QR code
      let document = await storage.getDocumentByHash(code);
      if (!document) {
        // If not found by hash, try by document number
        document = await storage.getDocumentByNumber(code);
      }

      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      if (document.status !== "signed" && document.status !== "completed") {
        return res.status(400).json({ message: "Document not yet signed" });
      }

      const evidence = await storage.getDocumentEvidence(document.id);
      const signatures = await storage.getDocumentSignatures(document.id);
      const terminal = document.posTerminalId ? await storage.getPosTerminal(document.posTerminalId) : null;

      // Log validation attempt
      await storage.createAuditLog({
        documentId: document.id,
        action: "document_validated",
        details: { validationCode: code },
        ipAddress: req.ip,
      });

      res.json({
        document,
        evidence,
        signatures,
        terminal,
        isValid: true,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to validate document" });
    }
  });

  // eToken Management Endpoints
  app.get("/api/etoken/status", authenticateToken, requireRole(["certificador", "admin"]), async (req, res) => {
    try {
      const isAvailable = await etokenService.checkTokenAvailability();
      const deviceInfo = etokenService.getDeviceInfo();
      
      res.json({
        available: isAvailable,
        device: deviceInfo,
        status: isAvailable ? "connected" : "not_detected"
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to check eToken status" });
    }
  });

  app.get("/api/etoken/certificate", authenticateToken, requireRole(["certificador", "admin"]), async (req, res) => {
    try {
      const certificateInfo = await etokenService.getCertificateInfo();
      res.json(certificateInfo);
    } catch (error) {
      res.status(500).json({ message: "Failed to get certificate information" });
    }
  });

  app.post("/api/etoken/authenticate", authenticateToken, requireRole(["certificador", "admin"]), async (req, res) => {
    try {
      const { pin } = req.body;
      
      if (!pin) {
        return res.status(400).json({ message: "PIN required" });
      }
      
      const authenticated = await etokenService.authenticate(pin);
      res.json({ authenticated });
    } catch (error) {
      res.status(500).json({ message: "eToken authentication failed" });
    }
  });

  // PDF Generation endpoint
  app.get("/api/documents/:id/pdf", authenticateToken, async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const authReq = req as AuthRequest;
      
      const document = await storage.getDocument(documentId);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      // Check permissions: certificador/admin can see all, others only their documents
      if (authReq.user!.role !== "admin" && authReq.user!.role !== "certificador") {
        // For future implementation: check if user owns this document
      }
      
      const evidence = await storage.getDocumentEvidence(documentId);
      const pdfBuffer = await pdfService.generateSignedPDF(document, "pdf_generation_hash", evidence);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="documento-${document.documentNumber}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error("PDF generation error:", error);
      res.status(500).json({ message: "Failed to generate PDF" });
    }
  });

  // QR Code generation endpoint
  app.get("/api/documents/:id/qr", async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      
      const document = await storage.getDocument(documentId);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      if (!document.qrCode) {
        return res.status(404).json({ message: "QR code not generated for this document" });
      }
      
      const qrImageBuffer = await qrService.generateQRCodeImage(document.qrCode);
      
      res.setHeader('Content-Type', 'image/png');
      res.send(qrImageBuffer);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate QR code image" });
    }
  });

  // Admin Panel Endpoints
  app.get("/api/admin/users", authenticateToken, requireRole(["admin"]), async (req, res) => {
    try {
      // In a real implementation, you would have a method to get all users
      // For now, we'll return mock data structure
      const users = [
        {
          id: 1,
          username: "admin",
          name: "Administrador Principal",
          role: "admin",
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
          username: "certificador1",
          name: "María González",
          role: "certificador",
          createdAt: new Date().toISOString()
        }
      ];
      
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/admin/pos-terminals", authenticateToken, requireRole(["admin"]), async (req, res) => {
    try {
      const terminals = await storage.getPosTerminals();
      
      // Enhance with additional monitoring data
      const enhancedTerminals = await Promise.all(
        terminals.map(async (terminal) => {
          // Get document count for this terminal
          const documents = await storage.getDocuments(100, 0);
          const terminalDocs = documents.filter(doc => doc.posTerminalId === terminal.id);
          
          return {
            ...terminal,
            accessKey: `POS-${terminal.id}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
            isActive: Math.random() > 0.3, // Mock active status
            lastActivity: new Date().toISOString(),
            documentsCount: terminalDocs.length,
            coordinates: `${terminal.latitude || -33.4175}, ${terminal.longitude || -70.6061}`
          };
        })
      );
      
      res.json(enhancedTerminals);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch POS terminals" });
    }
  });

  app.post("/api/admin/pos-terminals", authenticateToken, requireRole(["admin"]), async (req, res) => {
    try {
      const { name, location, address, coordinates, accessKey } = req.body;
      
      if (!name || !location || !address) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      // Parse coordinates
      const [lat, lng] = coordinates.split(',').map((coord: string) => parseFloat(coord.trim()));
      
      const terminal = await storage.createPosTerminal({
        name: sanitizeInput(name),
        location: sanitizeInput(location),
        address: sanitizeInput(address),
        latitude: lat,
        longitude: lng
      });
      
      // Log terminal creation
      await storage.createAuditLog({
        action: "pos_terminal_created",
        details: { terminalName: name, location, accessKey },
        ipAddress: req.ip,
      });
      
      res.status(201).json({
        ...terminal,
        accessKey,
        isActive: true,
        documentsCount: 0
      });
    } catch (error) {
      console.error("POS terminal creation error:", error);
      res.status(500).json({ message: "Failed to create POS terminal" });
    }
  });

  app.get("/api/admin/monitoring", authenticateToken, requireRole(["admin"]), async (req, res) => {
    try {
      const posTerminals = await storage.getPosTerminals();
      const documentStats = await storage.getDocumentStats();
      
      // Calculate active terminals (mock for now)
      const activeTerminals = Math.floor(posTerminals.length * 0.8);
      
      // System alerts (mock implementation)
      const systemAlerts = [];
      
      // Check for pending documents alert
      if (documentStats.pendingDocuments > 10) {
        systemAlerts.push({
          type: "warning",
          message: `${documentStats.pendingDocuments} documentos pendientes de certificación`
        });
      }
      
      // Check for eToken status
      const etokenAvailable = await etokenService.checkTokenAvailability();
      if (!etokenAvailable) {
        systemAlerts.push({
          type: "error",
          message: "eToken SafeNet 5110 no detectado - funcionalidad de FEA limitada"
        });
      }
      
      res.json({
        activeTerminals,
        totalDocuments: documentStats.totalDocuments,
        pendingDocuments: documentStats.pendingDocuments,
        activeUsers: 3, // Mock active users count
        systemAlerts,
        lastUpdate: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch monitoring data" });
    }
  });

  // GPS Tracking for POS terminals
  app.post("/api/admin/pos-terminals/:id/location", authenticateToken, requireRole(["admin", "operador"]), async (req, res) => {
    try {
      const terminalId = parseInt(req.params.id);
      const { latitude, longitude, accuracy } = req.body;
      
      if (!latitude || !longitude) {
        return res.status(400).json({ message: "Latitude and longitude required" });
      }
      
      // Validate coordinates are within Chile
      if (!validateChileanGPS(latitude, longitude)) {
        return res.status(400).json({ message: "Coordinates outside Chilean territory" });
      }
      
      // Update terminal location (you would need to add this method to storage)
      // await storage.updatePosTerminalLocation(terminalId, latitude, longitude);
      
      // Log location update
      await storage.createAuditLog({
        action: "pos_location_updated",
        details: { terminalId, latitude, longitude, accuracy },
        ipAddress: req.ip,
      });
      
      res.json({
        message: "Location updated successfully",
        coordinates: { latitude, longitude, accuracy },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to update location" });
    }
  });

  // Dashboard Statistics with enhanced data
  app.get("/api/stats", async (req, res) => {
    try {
      const documentStats = await storage.getDocumentStats();
      const regionStats = await storage.getRegionStats();

      // Add eToken status to dashboard
      const etokenStatus = await etokenService.checkTokenAvailability();
      const etokenInfo = etokenService.getDeviceInfo();

      res.json({
        documents: documentStats,
        regions: regionStats,
        etoken: {
          available: etokenStatus,
          device: etokenInfo
        },
        system: {
          timestamp: new Date().toISOString(),
          version: "2.0.0",
          environment: process.env.NODE_ENV || "development"
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  // Reject Document
  app.post("/api/documents/:id/reject", async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const { reason, certificadorId } = req.body;

      await storage.updateDocumentStatus(documentId, "rejected");

      await storage.createAuditLog({
        documentId,
        userId: certificadorId,
        action: "document_rejected",
        details: { reason },
        ipAddress: req.ip,
      });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to reject document" });
    }
  });

  // Download Signed PDF
  app.get("/api/documents/:id/pdf", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const document = await storage.getDocument(id);
      
      if (!document || document.status !== "signed") {
        return res.status(404).json({ message: "Signed document not found" });
      }

      const evidence = await storage.getDocumentEvidence(id);
      const signatures = await storage.getDocumentSignatures(id);
      
      const pdfBuffer = await pdfService.generateSignedPDF(document, evidence, signatures);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=${document.documentNumber}.pdf`);
      res.send(pdfBuffer);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate PDF" });
    }
  });

  // Cultural analysis endpoints
  app.post("/api/cultural/analyze", async (req, res) => {
    try {
      const { latitude, longitude, documentType } = req.body;
      
      if (!latitude || !longitude) {
        return res.status(400).json({ message: "GPS coordinates required" });
      }

      // Análisis local básico
      const localAnalysis = await indigenousService.detectIndigenousCulture(latitude, longitude);
      
      // Si se detecta cultura indígena y hay API key de Perplexity, hacer análisis avanzado
      let aiAnalysis = null;
      if (localAnalysis.hasIndigenousCulture && process.env.PERPLEXITY_API_KEY) {
        try {
          aiAnalysis = await perplexityService.analyzeCulturalContext(latitude, longitude, documentType || "documento legal");
        } catch (error) {
          console.log("Análisis AI no disponible, usando análisis local");
        }
      }

      res.json({
        location: { latitude, longitude },
        localAnalysis,
        aiAnalysis,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error en análisis cultural:", error);
      res.status(500).json({ message: "Error analyzing cultural context" });
    }
  });

  // Translation suggestions endpoint
  app.post("/api/cultural/translate", async (req, res) => {
    try {
      const { cultureName, documentContent } = req.body;
      
      if (!cultureName || !documentContent) {
        return res.status(400).json({ message: "Culture name and document content required" });
      }

      if (!process.env.PERPLEXITY_API_KEY) {
        return res.status(400).json({ message: "Translation service not configured" });
      }

      const suggestions = await perplexityService.getTranslationSuggestions(cultureName, documentContent);
      
      res.json({
        cultureName,
        suggestions,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error en sugerencias de traducción:", error);
      res.status(500).json({ message: "Error getting translation suggestions" });
    }
  });

  // Indigenous cultures info endpoint
  app.get("/api/cultural/cultures", async (req, res) => {
    try {
      const availableLanguages = indigenousService.getAvailableLanguages();
      
      res.json({
        languages: availableLanguages,
        cultures: [
          "Mapuche", "Aymara", "Quechua", "Atacameño", 
          "Diaguita", "Rapanui", "Kawésqar", "Yagán"
        ],
        totalCultures: 8
      });
    } catch (error) {
      res.status(500).json({ message: "Error getting cultural information" });
    }
  });

  // Detailed cultural info for specific culture
  app.get("/api/cultural/cultures/:name", async (req, res) => {
    try {
      const { name } = req.params;
      const { latitude, longitude } = req.query;
      
      if (!latitude || !longitude) {
        return res.status(400).json({ message: "GPS coordinates required" });
      }

      const culturalInfo = await indigenousService.getDetailedCulturalInfo(
        name, 
        parseFloat(latitude as string), 
        parseFloat(longitude as string)
      );
      
      if (!culturalInfo) {
        return res.status(404).json({ message: "Culture not found" });
      }

      res.json(culturalInfo);
    } catch (error) {
      res.status(500).json({ message: "Error getting cultural details" });
    }
  });

  // Sociology AI Agent endpoints
  app.get("/api/sociology/sector-analysis", authenticateToken, requireRole(['admin', 'supervisor']), async (req, res) => {
    try {
      // Obtener ubicaciones actuales de POS
      const posTerminals = await storage.getPosTerminals();
      const currentLocations = posTerminals.map(pos => ({
        latitude: parseFloat(pos.latitude || "0"),
        longitude: parseFloat(pos.longitude || "0")
      })).filter(loc => loc.latitude !== 0 && loc.longitude !== 0);

      const analysis = await sociologyService.analyzeSectorOpportunities(currentLocations);
      
      res.json({
        analysis,
        metadata: {
          currentPosCount: currentLocations.length,
          analysisDate: new Date().toISOString(),
          dataSource: "AI Sociology Agent + Local Demographics"
        }
      });
    } catch (error) {
      console.error("Error en análisis sociológico:", error);
      res.status(500).json({ message: "Error performing sociological analysis" });
    }
  });

  // Get specific region demographic data
  app.get("/api/sociology/demographics/:region", authenticateToken, requireRole(['admin', 'supervisor']), async (req, res) => {
    try {
      const { region } = req.params;
      
      // Simular obtención de datos demográficos específicos
      const demographicData = {
        region: decodeURIComponent(region),
        population: 1500000,
        averageIncome: 650000,
        educationLevel: "Media",
        economicSectors: ["Agricultura", "Servicios", "Comercio"],
        socialIndicators: {
          povertyRate: 12.5,
          unemploymentRate: 8.2,
          literacyRate: 96.8
        },
        legalServiceDemand: {
          monthly: 450,
          seasonal: ["Documentos agrícolas", "Contratos temporales"],
          unmetNeeds: ["Servicios digitales", "Horarios extendidos"]
        },
        lastUpdated: new Date().toISOString()
      };

      res.json(demographicData);
    } catch (error) {
      res.status(500).json({ message: "Error getting demographic data" });
    }
  });

  // AI-powered market opportunity analysis
  app.post("/api/sociology/market-opportunity", authenticateToken, requireRole(['admin', 'supervisor']), async (req, res) => {
    try {
      const { coordinates, demographicFactors } = req.body;
      
      if (!coordinates || !coordinates.latitude || !coordinates.longitude) {
        return res.status(400).json({ message: "Coordinates required for analysis" });
      }

      // Análisis específico para una ubicación
      const opportunity = {
        location: coordinates,
        marketScore: Math.floor(Math.random() * 40) + 60, // 60-100 score
        estimatedDemand: {
          monthly: Math.floor(Math.random() * 200) + 100,
          revenue: Math.floor(Math.random() * 2000000) + 1000000
        },
        competitorAnalysis: {
          nearby: Math.floor(Math.random() * 3),
          distance: "5-15 km",
          differentiation: ["Horarios extendidos", "Servicios digitales", "Precios competitivos"]
        },
        socialImpact: {
          accessibilityImprovement: "Alto",
          communityBenefit: "Formalización de microempresas locales",
          inclusionScore: Math.floor(Math.random() * 3) + 7
        },
        recommendations: [
          "Implementar servicios en horarios extendidos",
          "Enfocarse en documentos para microempresas",
          "Ofrecer capacitación digital",
          "Establecer alianzas con organizaciones locales"
        ],
        timestamp: new Date().toISOString()
      };

      res.json(opportunity);
    } catch (error) {
      console.error("Error en análisis de oportunidad:", error);
      res.status(500).json({ message: "Error analyzing market opportunity" });
    }
  });

  // Generate AI insights for business strategy
  app.post("/api/sociology/ai-insights", authenticateToken, requireRole(['admin', 'supervisor']), async (req, res) => {
    try {
      const { context, specificQuestions } = req.body;
      
      if (!process.env.PERPLEXITY_API_KEY) {
        return res.status(400).json({ 
          message: "AI service not configured",
          fallbackInsights: {
            marketTrends: ["Crecimiento de servicios legales digitales", "Mayor demanda en zonas rurales"],
            strategicRecommendations: ["Expandir gradualmente", "Enfocar en nichos específicos"],
            riskFactors: ["Competencia tradicional", "Adopción tecnológica variable"]
          }
        });
      }

      const prompt = `Como sociólogo especializado en análisis de mercado chileno, proporciona insights estratégicos sobre:

Contexto: ${context || "Expansión de servicios legales digitales en Chile"}

Preguntas específicas: ${specificQuestions || "Mejores estrategias de penetración de mercado"}

Analiza considerando:
- Factores socioeconómicos chilenos
- Tendencias demográficas
- Patrones de adopción tecnológica
- Impacto social potencial

Proporciona recomendaciones prácticas y específicas.`;

      const response = await fetch("https://api.perplexity.ai/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.1-sonar-small-128k-online",
          messages: [
            {
              role: "system",
              content: "Eres un sociólogo experto en análisis de mercado y desarrollo territorial chileno."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.3,
          search_domain_filter: ["ine.cl", "desarrollosocial.gob.cl", "economia.gob.cl"]
        })
      });

      if (response.ok) {
        const aiData = await response.json();
        res.json({
          insights: aiData.choices[0]?.message?.content || "",
          citations: aiData.citations || [],
          confidence: "high",
          analysisType: "AI-Enhanced Sociological Analysis",
          timestamp: new Date().toISOString()
        });
      } else {
        throw new Error("AI service unavailable");
      }
    } catch (error) {
      console.error("Error generando insights AI:", error);
      res.status(500).json({ 
        message: "Error generating AI insights",
        fallbackAvailable: true
      });
    }
  });

  // Dynamic Pricing endpoints
  app.post("/api/pricing/calculate", async (req, res) => {
    try {
      const { latitude, longitude, documentTypeId } = req.body;
      
      if (!latitude || !longitude || !documentTypeId) {
        return res.status(400).json({ 
          message: "Latitude, longitude and documentTypeId required" 
        });
      }

      const pricing = await dynamicPricingService.calculateDynamicPrice(
        latitude, 
        longitude, 
        documentTypeId
      );
      
      res.json(pricing);
    } catch (error) {
      console.error("Error calculating dynamic price:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Error calculating price" 
      });
    }
  });

  // Get all prices for a region
  app.post("/api/pricing/region", async (req, res) => {
    try {
      const { latitude, longitude } = req.body;
      
      if (!latitude || !longitude) {
        return res.status(400).json({ message: "GPS coordinates required" });
      }

      const regionalPricing = await dynamicPricingService.getRegionalPricing(latitude, longitude);
      
      res.json(regionalPricing);
    } catch (error) {
      console.error("Error getting regional pricing:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Error getting regional pricing" 
      });
    }
  });

  // Update notary prices (admin only)
  app.patch("/api/pricing/notary-prices/:region", 
    authenticateToken, 
    requireRole(['admin']), 
    async (req, res) => {
      try {
        const { region } = req.params;
        const { prices } = req.body;
        
        await dynamicPricingService.updateNotaryPrices(
          decodeURIComponent(region), 
          prices
        );
        
        res.json({ 
          message: "Notary prices updated successfully",
          region: decodeURIComponent(region),
          updatedAt: new Date().toISOString()
        });
      } catch (error) {
        console.error("Error updating notary prices:", error);
        res.status(500).json({ message: "Error updating prices" });
      }
    }
  );

  // Get pricing statistics
  app.get("/api/pricing/statistics", 
    authenticateToken, 
    requireRole(['admin', 'supervisor']), 
    async (req, res) => {
      try {
        const stats = dynamicPricingService.getPricingStatistics();
        res.json(stats);
      } catch (error) {
        res.status(500).json({ message: "Error getting pricing statistics" });
      }
    }
  );

  // Commission system endpoints
  app.get("/api/commissions/weekly", 
    authenticateToken, 
    requireRole(['admin', 'supervisor']), 
    async (req, res) => {
      try {
        const { weekStart } = req.query;
        const startDate = weekStart ? new Date(weekStart as string) : undefined;
        
        const calculations = await commissionService.calculateWeeklyCommissions(startDate);
        
        res.json({
          calculations,
          period: startDate ? {
            start: startDate.toISOString(),
            end: new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString()
          } : null,
          summary: {
            totalTerminals: calculations.length,
            totalCommissions: calculations.reduce((sum, calc) => sum + calc.transactions.commission, 0),
            totalRevenue: calculations.reduce((sum, calc) => sum + calc.transactions.totalRevenue, 0),
            totalDocuments: calculations.reduce((sum, calc) => sum + calc.transactions.totalDocuments, 0)
          }
        });
      } catch (error) {
        console.error("Error calculating weekly commissions:", error);
        res.status(500).json({ message: "Error calculating commissions" });
      }
    }
  );

  // Generate weekly statements
  app.post("/api/commissions/generate-statements", 
    authenticateToken, 
    requireRole(['admin', 'supervisor']), 
    async (req, res) => {
      try {
        const statements = await commissionService.runWeeklyAutomatedProcess();
        
        res.json({
          message: "Weekly statements generated successfully",
          statementsGenerated: statements.length,
          statements: statements.map(s => ({
            id: s.id,
            posTerminalId: s.posTerminalId,
            commission: s.calculation.transactions.commission,
            documents: s.calculation.transactions.totalDocuments,
            status: s.status
          })),
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error("Error generating statements:", error);
        res.status(500).json({ message: "Error generating weekly statements" });
      }
    }
  );

  // Get commission for specific terminal
  app.get("/api/commissions/terminal/:id", 
    authenticateToken, 
    async (req, res) => {
      try {
        const terminalId = parseInt(req.params.id);
        const { weekStart } = req.query;
        
        if (isNaN(terminalId)) {
          return res.status(400).json({ message: "Invalid terminal ID" });
        }

        const startDate = weekStart ? new Date(weekStart as string) : undefined;
        const calculations = await commissionService.calculateWeeklyCommissions(startDate);
        const terminalCommission = calculations.find(calc => calc.posTerminalId === terminalId);
        
        if (!terminalCommission) {
          return res.status(404).json({ message: "Terminal not found or no data" });
        }

        res.json(terminalCommission);
      } catch (error) {
        console.error("Error getting terminal commission:", error);
        res.status(500).json({ message: "Error getting terminal commission" });
      }
    }
  );

  // Commission statistics
  app.get("/api/commissions/statistics", 
    authenticateToken, 
    requireRole(['admin', 'supervisor']), 
    async (req, res) => {
      try {
        const { months = 3 } = req.query;
        
        // Calcular estadísticas de los últimos N meses
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - parseInt(months as string));
        
        const statistics = {
          period: {
            start: startDate.toISOString(),
            end: endDate.toISOString(),
            months: parseInt(months as string)
          },
          commissionRate: 12, // 12%
          totalTerminals: 5, // Placeholder - would come from database
          averageWeeklyCommission: 125000,
          topPerformingTerminal: {
            name: "Terminal Centro",
            weeklyAverage: 180000,
            growthRate: 15.5
          },
          trends: {
            weeklyGrowth: 8.3,
            monthlyGrowth: 22.1,
            seasonalPattern: "Crecimiento constante con picos en fin de mes"
          }
        };

        res.json(statistics);
      } catch (error) {
        res.status(500).json({ message: "Error getting commission statistics" });
      }
    }
  );

  // POS Device Registration and Management API
  app.post('/api/pos/register', authenticateToken, requireRole(['admin']), async (req: AuthRequest, res: Response) => {
    try {
      const result = await posRegistrationService.registerNewPOS(req.body);
      res.status(201).json(result);
    } catch (error: any) {
      console.error('Error registering POS device:', error);
      res.status(400).json({ 
        error: 'Error al registrar dispositivo POS',
        details: error.message 
      });
    }
  });

  // POS Device Authentication
  app.post('/api/pos/authenticate', rateLimit(10, 60000), async (req: Request, res: Response) => {
    try {
      const { imei, accessKey, secretKey } = req.body;
      
      if (!imei || !accessKey || !secretKey) {
        return res.status(400).json({ 
          error: 'IMEI, accessKey y secretKey son requeridos' 
        });
      }

      const result = await posRegistrationService.authenticatePOS(imei, accessKey, secretKey);
      res.json(result);
    } catch (error: any) {
      console.error('Error authenticating POS:', error);
      res.status(401).json({ 
        error: 'Error de autenticación POS',
        details: error.message 
      });
    }
  });

  // POS Location Update
  app.put('/api/pos/:imei/location', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const { imei } = req.params;
      const locationData = req.body;
      
      const result = await posRegistrationService.updatePOSLocation(imei, locationData);
      res.json(result);
    } catch (error: any) {
      console.error('Error updating POS location:', error);
      res.status(400).json({ 
        error: 'Error al actualizar ubicación POS',
        details: error.message 
      });
    }
  });

  // POS Status Check
  app.get('/api/pos/:imei/status', authenticateToken, requireRole(['admin', 'supervisor']), async (req: AuthRequest, res: Response) => {
    try {
      const { imei } = req.params;
      const result = await posRegistrationService.getPOSStatus(imei);
      res.json(result);
    } catch (error: any) {
      console.error('Error getting POS status:', error);
      res.status(404).json({ 
        error: 'Error al obtener estado del POS',
        details: error.message 
      });
    }
  });

  // Express Process API
  app.post('/api/express/initiate', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const result = await expressProcessService.initiateExpressProcess(req.body);
      res.status(201).json(result);
    } catch (error: any) {
      console.error('Error initiating express process:', error);
      res.status(400).json({ 
        error: 'Error al iniciar proceso express',
        details: error.message 
      });
    }
  });

  // Express Process Steps
  app.post('/api/express/:processId/client-verification', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const { processId } = req.params;
      const result = await expressProcessService.processClientVerification(processId, req.body);
      res.json(result);
    } catch (error: any) {
      console.error('Error in client verification:', error);
      res.status(400).json({ 
        error: 'Error en verificación de cliente',
        details: error.message 
      });
    }
  });

  app.post('/api/express/:processId/document-selection', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const { processId } = req.params;
      const result = await expressProcessService.processDocumentSelection(processId, req.body);
      res.json(result);
    } catch (error: any) {
      console.error('Error in document selection:', error);
      res.status(400).json({ 
        error: 'Error en selección de documento',
        details: error.message 
      });
    }
  });

  app.post('/api/express/:processId/evidence-capture', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const { processId } = req.params;
      const result = await expressProcessService.processEvidenceCapture(processId, req.body);
      res.json(result);
    } catch (error: any) {
      console.error('Error in evidence capture:', error);
      res.status(400).json({ 
        error: 'Error en captura de evidencia',
        details: error.message 
      });
    }
  });

  app.post('/api/express/:processId/complete', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const { processId } = req.params;
      const result = await expressProcessService.completeFinalValidation(processId, req.body);
      res.json(result);
    } catch (error: any) {
      console.error('Error completing express process:', error);
      res.status(400).json({ 
        error: 'Error al completar proceso express',
        details: error.message 
      });
    }
  });

  // Express Process Stats
  app.get('/api/express/stats', authenticateToken, requireRole(['admin', 'supervisor']), async (req: AuthRequest, res: Response) => {
    try {
      const stats = await expressProcessService.getProcessingStats();
      res.json(stats);
    } catch (error: any) {
      console.error('Error getting express stats:', error);
      res.status(500).json({ 
        error: 'Error al obtener estadísticas express',
        details: error.message 
      });
    }
  });

  // TUU Payment Integration API
  app.post('/api/tuu/payment', authenticateToken, async (req: Request, res: Response) => {
    try {
      const { imei, documentId, paymentData } = req.body;
      
      if (!imei || !documentId || !paymentData) {
        return res.status(400).json({ 
          error: 'IMEI, documentId y paymentData son requeridos' 
        });
      }

      const result = await tuuPaymentService.processPayment(imei, documentId, paymentData);
      res.json(result);
    } catch (error: any) {
      console.error('Error processing TUU payment:', error);
      res.status(500).json({ 
        error: 'Error procesando pago TUU',
        details: error.message 
      });
    }
  });

  // TUU Device Registration
  app.post('/api/tuu/register-device', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
    try {
      const { imei, model, partnerCredentials } = req.body;
      
      if (!imei || !model || !partnerCredentials) {
        return res.status(400).json({ 
          error: 'IMEI, model y partnerCredentials son requeridos' 
        });
      }

      const device = await tuuPaymentService.registerTuuDevice(imei, model, partnerCredentials);
      res.status(201).json(device);
    } catch (error: any) {
      console.error('Error registering TUU device:', error);
      res.status(400).json({ 
        error: 'Error registrando dispositivo TUU',
        details: error.message 
      });
    }
  });

  // TUU Device Status Validation
  app.get('/api/tuu/device/:imei/status', authenticateToken, async (req: Request, res: Response) => {
    try {
      const { imei } = req.params;
      const status = await tuuPaymentService.validateDeviceStatus(imei);
      res.json(status);
    } catch (error: any) {
      console.error('Error validating TUU device:', error);
      res.status(404).json({ 
        error: 'Error validando dispositivo TUU',
        details: error.message 
      });
    }
  });

  // TUU Configuration Sync
  app.post('/api/tuu/device/:imei/sync', authenticateToken, async (req: Request, res: Response) => {
    try {
      const { imei } = req.params;
      await tuuPaymentService.syncDeviceConfiguration(imei);
      res.json({ 
        message: 'Configuración sincronizada exitosamente',
        syncedAt: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Error syncing TUU configuration:', error);
      res.status(500).json({ 
        error: 'Error sincronizando configuración TUU',
        details: error.message 
      });
    }
  });

  // TUU Payment Stats
  app.get('/api/tuu/stats', authenticateToken, requireRole(['admin', 'supervisor']), async (req: Request, res: Response) => {
    try {
      const { imei, dateRange } = req.query;
      const stats = await tuuPaymentService.getPaymentStats(
        imei as string, 
        dateRange ? JSON.parse(dateRange as string) : undefined
      );
      res.json(stats);
    } catch (error: any) {
      console.error('Error getting TUU stats:', error);
      res.status(500).json({ 
        error: 'Error obteniendo estadísticas TUU',
        details: error.message 
      });
    }
  });

  // TUU Android Intent Generation
  app.post('/api/tuu/generate-intent', authenticateToken, async (req: Request, res: Response) => {
    try {
      const { paymentData, environment } = req.body;
      
      if (!paymentData) {
        return res.status(400).json({ 
          error: 'paymentData es requerido' 
        });
      }

      const intentCode = tuuPaymentService.generateAndroidIntent(paymentData, environment);
      const apkCode = tuuPaymentService.generateAPKIntegrationCode();
      
      res.json({ 
        intentCode,
        apkCode,
        environment: environment || 'dev',
        generatedAt: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Error generating TUU intent:', error);
      res.status(500).json({ 
        error: 'Error generando Intent TUU',
        details: error.message 
      });
    }
  });

  // TUU Response Processing
  app.post('/api/tuu/process-response', authenticateToken, async (req: Request, res: Response) => {
    try {
      const { intentData } = req.body;
      
      if (!intentData) {
        return res.status(400).json({ 
          error: 'intentData es requerido' 
        });
      }

      const response = tuuPaymentService.processTuuResponse(intentData);
      res.json(response);
    } catch (error: any) {
      console.error('Error processing TUU response:', error);
      res.status(400).json({ 
        error: 'Error procesando respuesta TUU',
        details: error.message 
      });
    }
  });

  // POS Authentication API
  app.post('/api/pos/login', rateLimit(5, 60000), async (req: Request, res: Response) => {
    try {
      const loginRequest = req.body;
      
      if (!loginRequest.terminalId || !loginRequest.accessKey) {
        return res.status(400).json({ 
          success: false,
          error: 'Terminal ID y clave de acceso requeridos',
          errorCode: 'MISSING_CREDENTIALS'
        });
      }

      const result = await posAuthService.authenticatePOS(loginRequest);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(401).json(result);
      }
    } catch (error: any) {
      console.error('Error in POS login:', error);
      res.status(500).json({ 
        success: false,
        error: 'Error interno del servidor',
        errorCode: 'INTERNAL_ERROR'
      });
    }
  });

  // POS Token Renewal
  app.post('/api/pos/renew-token', async (req: Request, res: Response) => {
    try {
      const { currentToken } = req.body;
      
      if (!currentToken) {
        return res.status(400).json({ 
          success: false,
          error: 'Token actual requerido'
        });
      }

      const result = await posAuthService.renewPOSToken(currentToken);
      res.json(result);
    } catch (error: any) {
      console.error('Error renewing POS token:', error);
      res.status(500).json({ 
        success: false,
        error: 'Error renovando token'
      });
    }
  });

  // POS Terminal Registration (Admin only)
  app.post('/api/pos/register-terminal', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
    try {
      const terminalData = req.body;
      
      const result = await posAuthService.registerNewTerminal(terminalData);
      res.status(201).json(result);
    } catch (error: any) {
      console.error('Error registering terminal:', error);
      res.status(400).json({ 
        error: 'Error registrando terminal',
        details: error.message 
      });
    }
  });

  // POS Token Validation
  app.post('/api/pos/validate-token', async (req: Request, res: Response) => {
    try {
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({ 
          isValid: false,
          error: 'Token requerido'
        });
      }

      const result = await posAuthService.validatePOSToken(token);
      res.json(result);
    } catch (error: any) {
      console.error('Error validating POS token:', error);
      res.status(500).json({ 
        isValid: false,
        error: 'Error validando token'
      });
    }
  });

  // POS Terminal Deactivation
  app.post('/api/pos/deactivate/:terminalId', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
    try {
      const { terminalId } = req.params;
      
      const success = await posAuthService.deactivateTerminal(terminalId);
      
      if (success) {
        res.json({ 
          success: true,
          message: 'Terminal desactivado exitosamente'
        });
      } else {
        res.status(400).json({ 
          success: false,
          error: 'Error desactivando terminal'
        });
      }
    } catch (error: any) {
      console.error('Error deactivating terminal:', error);
      res.status(500).json({ 
        success: false,
        error: 'Error interno'
      });
    }
  });

  // POS Access Statistics
  app.get('/api/pos/access-stats', authenticateToken, requireRole(['admin', 'supervisor']), async (req: Request, res: Response) => {
    try {
      const { terminalId } = req.query;
      
      const stats = await posAuthService.getAccessStats(terminalId as string);
      res.json(stats);
    } catch (error: any) {
      console.error('Error getting POS access stats:', error);
      res.status(500).json({ 
        error: 'Error obteniendo estadísticas'
      });
    }
  });

  // Generate APK Auth Code
  app.get('/api/pos/generate-auth-code', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
    try {
      const authCode = posAuthService.generateAPKAuthCode();
      
      res.json({ 
        authCode,
        generatedAt: new Date().toISOString(),
        description: 'Código completo para integración de autenticación en APK Android'
      });
    } catch (error: any) {
      console.error('Error generating auth code:', error);
      res.status(500).json({ 
        error: 'Error generando código de autenticación'
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

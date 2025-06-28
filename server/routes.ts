import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertDocumentSchema, insertSignatureSchema, insertEvidenceSchema } from "@shared/schema";
import { z } from "zod";
import { pdfService } from "./services/pdfService";
import { qrService } from "./services/qrService";
import { etokenService } from "./services/etokenService";
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

  const httpServer = createServer(app);
  return httpServer;
}

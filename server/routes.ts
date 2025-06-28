import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertDocumentSchema, insertSignatureSchema, insertEvidenceSchema } from "@shared/schema";
import { z } from "zod";
import { pdfService } from "./services/pdfService";
import { qrService } from "./services/qrService";
import { etokenService } from "./services/etokenService";

export async function registerRoutes(app: Express): Promise<Server> {
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

  // Create Document
  app.post("/api/documents", async (req, res) => {
    try {
      const data = insertDocumentSchema.parse(req.body);
      const document = await storage.createDocument(data);
      
      // Log document creation
      await storage.createAuditLog({
        documentId: document.id,
        action: "document_created",
        details: { documentNumber: document.documentNumber },
        ipAddress: req.ip,
      });

      res.json(document);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid document data", errors: error.errors });
      } else {
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
  app.post("/api/documents/:id/sign-advanced", async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const { certificadorId } = req.body;

      const document = await storage.getDocument(documentId);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Get document evidence and signatures for PDF generation
      const evidence = await storage.getDocumentEvidence(documentId);
      const signatures = await storage.getDocumentSignatures(documentId);

      // Generate PDF with advanced signature
      const pdfBuffer = await pdfService.generateSignedPDF(document, evidence, signatures);
      
      // Sign PDF with eToken (mock implementation)
      const signedPdfBuffer = await etokenService.signPDF(pdfBuffer);

      // Generate QR code for validation
      const qrCode = qrService.generateQRCode(document.hash);
      await storage.updateDocumentQR(documentId, qrCode);

      // Create advanced signature record
      const advancedSignature = await storage.createSignature({
        documentId,
        type: "advanced",
        signatureData: "eToken_certificate_data", // In real implementation, this would be certificate data
        signerName: "Certificador",
        certificadorId,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      // Update document status to signed
      await storage.updateDocumentStatus(documentId, "signed", new Date());

      // Log advanced signature
      await storage.createAuditLog({
        documentId,
        userId: certificadorId,
        action: "advanced_signature_added",
        details: { qrCode },
        ipAddress: req.ip,
      });

      res.json({
        signature: advancedSignature,
        qrCode,
        pdfGenerated: true,
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

  // Dashboard Statistics
  app.get("/api/stats", async (req, res) => {
    try {
      const documentStats = await storage.getDocumentStats();
      const regionStats = await storage.getRegionStats();

      res.json({
        documents: documentStats,
        regions: regionStats,
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

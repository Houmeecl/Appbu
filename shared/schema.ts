import { pgTable, text, serial, integer, boolean, timestamp, jsonb, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"), // user, certificador, admin
  name: text("name").notNull(),
  rut: text("rut"), // Chilean RUT
  createdAt: timestamp("created_at").defaultNow(),
});

export const posTerminals = pgTable("pos_terminals", {
  id: serial("id").primaryKey(),
  terminalId: text("terminal_id").notNull().unique(), // Unique terminal identifier (e.g., POS001)
  name: text("name").notNull(),
  address: text("address").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  region: text("region").notNull(),
  accessKey: text("access_key").notNull(), // Hashed access key for authentication
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const documentTypes = pgTable("document_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  template: text("template"), // HTML template for the document
  isActive: boolean("is_active").default(true),
});

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  documentNumber: text("document_number").notNull().unique(), // DOC-2024-XXXXXX
  typeId: integer("type_id").notNull().references(() => documentTypes.id),
  clientName: text("client_name").notNull(),
  clientRut: text("client_rut").notNull(),
  clientPhone: text("client_phone"),
  clientEmail: text("client_email"),
  posTerminalId: integer("pos_terminal_id").references(() => posTerminals.id),
  content: jsonb("content"), // Document content and form data
  status: text("status").notNull().default("pending"), // pending, signed, rejected, completed
  hash: text("hash").notNull().unique(), // SHA-256 hash
  qrCode: text("qr_code"), // QR validation code
  createdAt: timestamp("created_at").defaultNow(),
  signedAt: timestamp("signed_at"),
  completedAt: timestamp("completed_at"),
});

export const signatures = pgTable("signatures", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").notNull().references(() => documents.id),
  type: text("type").notNull(), // simple, advanced
  signatureData: text("signature_data"), // Base64 signature image or certificate data
  signerName: text("signer_name").notNull(),
  signerRut: text("signer_rut"),
  certificadorId: integer("certificador_id").references(() => users.id),
  timestamp: timestamp("timestamp").defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
});

export const evidence = pgTable("evidence", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").notNull().references(() => documents.id),
  type: text("type").notNull(), // photo, gps, signature
  data: jsonb("data"), // Evidence data (photo base64, GPS coords, etc.)
  timestamp: timestamp("timestamp").defaultNow(),
});

export const auditLog = pgTable("audit_log", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").references(() => documents.id),
  userId: integer("user_id").references(() => users.id),
  action: text("action").notNull(),
  details: jsonb("details"),
  timestamp: timestamp("timestamp").defaultNow(),
  ipAddress: text("ip_address"),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  signatures: many(signatures),
  auditLogs: many(auditLog),
}));

export const posTerminalsRelations = relations(posTerminals, ({ many }) => ({
  documents: many(documents),
}));

export const documentTypesRelations = relations(documentTypes, ({ many }) => ({
  documents: many(documents),
}));

export const documentsRelations = relations(documents, ({ one, many }) => ({
  type: one(documentTypes, {
    fields: [documents.typeId],
    references: [documentTypes.id],
  }),
  posTerminal: one(posTerminals, {
    fields: [documents.posTerminalId],
    references: [posTerminals.id],
  }),
  signatures: many(signatures),
  evidence: many(evidence),
  auditLogs: many(auditLog),
}));

export const signaturesRelations = relations(signatures, ({ one }) => ({
  document: one(documents, {
    fields: [signatures.documentId],
    references: [documents.id],
  }),
  certificador: one(users, {
    fields: [signatures.certificadorId],
    references: [users.id],
  }),
}));

export const evidenceRelations = relations(evidence, ({ one }) => ({
  document: one(documents, {
    fields: [evidence.documentId],
    references: [documents.id],
  }),
}));

export const auditLogRelations = relations(auditLog, ({ one }) => ({
  document: one(documents, {
    fields: [auditLog.documentId],
    references: [documents.id],
  }),
  user: one(users, {
    fields: [auditLog.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertPosTerminalSchema = createInsertSchema(posTerminals).omit({
  id: true,
  createdAt: true,
});

export const insertDocumentTypeSchema = createInsertSchema(documentTypes).omit({
  id: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  documentNumber: true,
  hash: true,
  qrCode: true,
  createdAt: true,
  signedAt: true,
  completedAt: true,
});

export const insertSignatureSchema = createInsertSchema(signatures).omit({
  id: true,
  timestamp: true,
});

export const insertEvidenceSchema = createInsertSchema(evidence).omit({
  id: true,
  timestamp: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLog).omit({
  id: true,
  timestamp: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type PosTerminal = typeof posTerminals.$inferSelect;
export type InsertPosTerminal = z.infer<typeof insertPosTerminalSchema>;
export type DocumentType = typeof documentTypes.$inferSelect;
export type InsertDocumentType = z.infer<typeof insertDocumentTypeSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Signature = typeof signatures.$inferSelect;
export type InsertSignature = z.infer<typeof insertSignatureSchema>;
export type Evidence = typeof evidence.$inferSelect;
export type InsertEvidence = z.infer<typeof insertEvidenceSchema>;
export type AuditLog = typeof auditLog.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;

// POS Device tables
export const posDevices = pgTable("pos_devices", {
  id: serial("id").primaryKey(),
  terminalId: integer("terminal_id").references(() => posTerminals.id).notNull(),
  imei: text("imei").notNull().unique(),
  deviceFingerprint: text("device_fingerprint").notNull(),
  model: text("model"),
  brand: text("brand"),
  androidVersion: text("android_version"),
  appVersion: text("app_version"),
  macAddress: text("mac_address"),
  serialNumber: text("serial_number"),
  accessKey: text("access_key").notNull(),
  secretKey: text("secret_key").notNull(),
  encryptionKey: text("encryption_key").notNull(),
  trustedStatus: text("trusted_status").default("pending"),
  riskScore: integer("risk_score").default(0),
  securityFlags: text("security_flags").array(),
  lastLocationUpdate: timestamp("last_location_update").defaultNow(),
  lastHealthCheck: timestamp("last_health_check"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const posSecurityLogs = pgTable("pos_security_logs", {
  id: serial("id").primaryKey(),
  deviceId: integer("device_id").references(() => posDevices.id).notNull(),
  imei: text("imei").notNull(),
  eventType: text("event_type").notNull(),
  eventData: jsonb("event_data"),
  riskLevel: text("risk_level"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  location: jsonb("location"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Relations for new tables
export const posDevicesRelations = relations(posDevices, ({ one, many }) => ({
  terminal: one(posTerminals, {
    fields: [posDevices.terminalId],
    references: [posTerminals.id],
  }),
  securityLogs: many(posSecurityLogs),
}));

export const posSecurityLogsRelations = relations(posSecurityLogs, ({ one }) => ({
  device: one(posDevices, {
    fields: [posSecurityLogs.deviceId],
    references: [posDevices.id],
  }),
}));

// Schema validation for new tables
export const insertPosDeviceSchema = createInsertSchema(posDevices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPosSecurityLogSchema = createInsertSchema(posSecurityLogs).omit({
  id: true,
});

export type PosDevice = typeof posDevices.$inferSelect;
export type InsertPosDevice = z.infer<typeof insertPosDeviceSchema>;

export type PosSecurityLog = typeof posSecurityLogs.$inferSelect;
export type InsertPosSecurityLog = z.infer<typeof insertPosSecurityLogSchema>;

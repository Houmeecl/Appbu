import { 
  users, documents, documentTypes, posTerminals, signatures, evidence, auditLog,
  type User, type InsertUser, type Document, type InsertDocument,
  type DocumentType, type InsertDocumentType, type PosTerminal, type InsertPosTerminal,
  type Signature, type InsertSignature, type Evidence, type InsertEvidence,
  type AuditLog, type InsertAuditLog
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Document Types
  getDocumentTypes(): Promise<DocumentType[]>;
  createDocumentType(type: InsertDocumentType): Promise<DocumentType>;

  // POS Terminals
  getPosTerminals(): Promise<PosTerminal[]>;
  getPosTerminal(id: number): Promise<PosTerminal | undefined>;
  createPosTerminal(terminal: InsertPosTerminal): Promise<PosTerminal>;

  // Documents
  getDocument(id: number): Promise<Document | undefined>;
  getDocumentByNumber(documentNumber: string): Promise<Document | undefined>;
  getDocumentByHash(hash: string): Promise<Document | undefined>;
  getPendingDocuments(): Promise<Document[]>;
  getDocuments(limit?: number, offset?: number): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocumentStatus(id: number, status: string, signedAt?: Date): Promise<void>;
  updateDocumentQR(id: number, qrCode: string): Promise<void>;

  // Signatures
  createSignature(signature: InsertSignature): Promise<Signature>;
  getDocumentSignatures(documentId: number): Promise<Signature[]>;

  // Evidence
  createEvidence(evidence: InsertEvidence): Promise<Evidence>;
  getDocumentEvidence(documentId: number): Promise<Evidence[]>;

  // Audit Log
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;

  // Analytics
  getDocumentStats(): Promise<{
    totalDocuments: number;
    pendingDocuments: number;
    todayCount: number;
    monthlyCount: number;
    rejectedCount: number;
  }>;
  getRegionStats(): Promise<{
    region: string;
    documentCount: number;
    posCount: number;
  }[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getDocumentTypes(): Promise<DocumentType[]> {
    return await db.select().from(documentTypes).where(eq(documentTypes.isActive, true));
  }

  async createDocumentType(type: InsertDocumentType): Promise<DocumentType> {
    const [documentType] = await db.insert(documentTypes).values(type).returning();
    return documentType;
  }

  async getPosTerminals(): Promise<PosTerminal[]> {
    return await db.select().from(posTerminals).where(eq(posTerminals.isActive, true));
  }

  async getPosTerminal(id: number): Promise<PosTerminal | undefined> {
    const [terminal] = await db.select().from(posTerminals).where(eq(posTerminals.id, id));
    return terminal || undefined;
  }

  async createPosTerminal(terminal: InsertPosTerminal): Promise<PosTerminal> {
    const [posTerminal] = await db.insert(posTerminals).values(terminal).returning();
    return posTerminal;
  }

  async getDocument(id: number): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document || undefined;
  }

  async getDocumentByNumber(documentNumber: string): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.documentNumber, documentNumber));
    return document || undefined;
  }

  async getDocumentByHash(hash: string): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.hash, hash));
    return document || undefined;
  }

  async getPendingDocuments(): Promise<Document[]> {
    return await db.select().from(documents)
      .where(eq(documents.status, 'pending'))
      .orderBy(desc(documents.createdAt));
  }

  async getDocuments(limit = 50, offset = 0): Promise<Document[]> {
    return await db.select().from(documents)
      .orderBy(desc(documents.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    // Generate document number
    const year = new Date().getFullYear();
    const count = await db.select({ count: sql`count(*)` }).from(documents);
    const documentNumber = `DOC-${year}-${String(Number(count[0].count) + 1).padStart(6, '0')}`;
    
    // Generate hash
    const crypto = await import('crypto');
    const hash = crypto.randomBytes(32).toString('hex');

    const [newDocument] = await db.insert(documents).values({
      ...document,
      documentNumber,
      hash,
    }).returning();
    
    return newDocument;
  }

  async updateDocumentStatus(id: number, status: string, signedAt?: Date): Promise<void> {
    const updates: any = { status };
    if (signedAt) updates.signedAt = signedAt;
    if (status === 'completed') updates.completedAt = new Date();

    await db.update(documents).set(updates).where(eq(documents.id, id));
  }

  async updateDocumentQR(id: number, qrCode: string): Promise<void> {
    await db.update(documents).set({ qrCode }).where(eq(documents.id, id));
  }

  async createSignature(signature: InsertSignature): Promise<Signature> {
    const [newSignature] = await db.insert(signatures).values(signature).returning();
    return newSignature;
  }

  async getDocumentSignatures(documentId: number): Promise<Signature[]> {
    return await db.select().from(signatures).where(eq(signatures.documentId, documentId));
  }

  async createEvidence(evidence: InsertEvidence): Promise<Evidence> {
    const [newEvidence] = await db.insert(evidence).values(evidence).returning();
    return newEvidence;
  }

  async getDocumentEvidence(documentId: number): Promise<Evidence[]> {
    return await db.select().from(evidence).where(eq(evidence.documentId, documentId));
  }

  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [newLog] = await db.insert(auditLog).values(log).returning();
    return newLog;
  }

  async getDocumentStats(): Promise<{
    totalDocuments: number;
    pendingDocuments: number;
    todayCount: number;
    monthlyCount: number;
    rejectedCount: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [stats] = await db.select({
      totalDocuments: sql`count(*)::int`,
      pendingDocuments: sql`count(*) filter (where status = 'pending')::int`,
      todayCount: sql`count(*) filter (where created_at >= ${today})::int`,
      monthlyCount: sql`count(*) filter (where created_at >= ${firstDayOfMonth})::int`,
      rejectedCount: sql`count(*) filter (where status = 'rejected')::int`,
    }).from(documents);

    return stats;
  }

  async getRegionStats(): Promise<{
    region: string;
    documentCount: number;
    posCount: number;
  }[]> {
    return await db.select({
      region: posTerminals.region,
      documentCount: sql`count(${documents.id})::int`,
      posCount: sql`count(distinct ${posTerminals.id})::int`,
    })
    .from(posTerminals)
    .leftJoin(documents, eq(documents.posTerminalId, posTerminals.id))
    .groupBy(posTerminals.region)
    .orderBy(desc(sql`count(${documents.id})`));
  }
}

export const storage = new DatabaseStorage();

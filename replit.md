# VecinoXpress - Electronic Legal Document System

## Overview

VecinoXpress is a comprehensive electronic signature system for legal documents in Chile, featuring biometric validation and FEA (Firma Electrónica Avanzada) compliance. The system provides a multi-interface platform for document creation, certification, and public validation with full traceability and audit capabilities.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query for server state management
- **Build Tool**: Vite with custom configuration for development and production

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Database Provider**: Neon serverless PostgreSQL
- **API Design**: RESTful API with proper error handling and logging middleware

### Development Stack
- **Language**: TypeScript throughout (frontend and backend)
- **Package Manager**: npm with lockfile version 3
- **Monorepo Structure**: Shared schema and types between client and server

## Key Components

### 1. Document Management System
- **Document Types**: Configurable legal document templates with pricing
- **Document Creation**: Multi-step process with client data collection
- **Status Tracking**: Comprehensive workflow from pending to completed
- **Document Templates**: HTML-based templates for different legal document types

### 2. Multi-Interface Design
- **POS Interface**: Terminal-based document creation with biometric capture
- **Certificador Panel**: Professional certification interface for legal validators
- **Public Validation**: QR-code based document verification system
- **Dashboard**: Analytics and reporting interface

### 3. Biometric Evidence Collection
- **Camera Integration**: Real-time photo capture with WebRTC API
- **Signature Canvas**: Digital signature capture with touch/mouse support
- **GPS Location**: Geolocation tracking for document authenticity
- **Device Fingerprinting**: Browser and device identification

### 4. Advanced Digital Signature (FEA)
- **eToken Integration**: SafeNet eToken 5110 support for advanced signatures
- **PKCS#11 Interface**: Hardware security module integration (planned)
- **Certificate Management**: X.509 certificate handling and validation
- **PDF Signing**: Advanced electronic signature embedding in PDF documents

### 5. Audit and Compliance
- **Complete Audit Trail**: All actions logged with timestamps and IP addresses
- **Evidence Storage**: Secure storage of biometric and location data
- **QR Validation**: Public verification system with unique codes
- **Document Hashing**: SHA-256 integrity verification

## Data Flow

### Document Creation Process
1. **Client Selection**: Choose document type and enter client information
2. **Evidence Capture**: Photo, signature, and GPS location collection
3. **Document Generation**: Template rendering with client data
4. **Hash Creation**: SHA-256 hash generation for integrity
5. **Queue for Certification**: Document enters certification workflow

### Certification Process
1. **Certificador Review**: Professional validates document and evidence
2. **Advanced Signature**: eToken-based FEA signature application
3. **PDF Generation**: Final document with embedded signatures and evidence
4. **QR Code Generation**: Unique validation code creation
5. **Completion**: Document marked as completed and available for validation

### Public Validation
1. **QR Code Scan**: Public access to validation interface
2. **Document Retrieval**: Secure lookup by validation code
3. **Integrity Check**: Hash verification and signature validation
4. **Evidence Display**: Presentation of captured biometric evidence

## External Dependencies

### Core Libraries
- **@neondatabase/serverless**: Serverless PostgreSQL client
- **drizzle-orm**: Type-safe database ORM
- **@tanstack/react-query**: Server state management
- **@radix-ui/react-***: Accessible UI component primitives

### Development Tools
- **tsx**: TypeScript execution for development
- **esbuild**: Fast bundling for production
- **vite**: Development server with HMR
- **drizzle-kit**: Database schema management

### Biometric and Security
- **pdf-lib**: PDF generation and manipulation
- **crypto**: Node.js cryptographic functions
- **WebRTC APIs**: Camera and media device access

## Deployment Strategy

### Development Environment
- **Local Development**: Vite dev server with Express backend
- **Hot Module Replacement**: Real-time code updates during development
- **Environment Variables**: DATABASE_URL and other configuration via .env

### Production Build
- **Frontend Build**: Vite builds static assets to `dist/public`
- **Backend Build**: esbuild bundles server code to `dist/index.js`
- **Database Migrations**: Drizzle Kit handles schema changes
- **Static File Serving**: Express serves built frontend assets

### Database Management
- **Schema Definition**: Centralized in `shared/schema.ts`
- **Migrations**: Automatic generation and application via drizzle-kit
- **Connection Pooling**: Neon serverless with WebSocket support
- **Environment Isolation**: Separate databases for development and production

## Changelog

```
Changelog:
- June 28, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```
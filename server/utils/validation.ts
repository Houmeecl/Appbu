// Chilean RUT validation utility
export function validateRUT(rut: string): boolean {
  if (!rut || typeof rut !== 'string') return false;
  
  // Remove dots and hyphens
  const cleanRut = rut.replace(/\./g, '').replace(/-/g, '').toUpperCase();
  
  if (cleanRut.length < 8 || cleanRut.length > 9) return false;
  
  const rutNumber = cleanRut.slice(0, -1);
  const checkDigit = cleanRut.slice(-1);
  
  // Validate that the number part contains only digits
  if (!/^\d+$/.test(rutNumber)) return false;
  
  // Calculate check digit
  let sum = 0;
  let multiplier = 2;
  
  for (let i = rutNumber.length - 1; i >= 0; i--) {
    sum += parseInt(rutNumber[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  
  const remainder = sum % 11;
  const calculatedCheckDigit = remainder === 0 ? '0' : 
                               remainder === 1 ? 'K' : 
                               String(11 - remainder);
  
  return checkDigit === calculatedCheckDigit;
}

// Format RUT with dots and hyphen
export function formatRUT(rut: string): string {
  if (!rut) return '';
  
  const cleanRut = rut.replace(/\./g, '').replace(/-/g, '').toUpperCase();
  
  if (cleanRut.length < 8) return rut;
  
  const rutNumber = cleanRut.slice(0, -1);
  const checkDigit = cleanRut.slice(-1);
  
  // Add dots every 3 digits from right to left
  const formatted = rutNumber.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  
  return `${formatted}-${checkDigit}`;
}

// Chilean phone number validation
export function validateChileanPhone(phone: string): boolean {
  if (!phone) return false;
  
  // Remove spaces, dots, and hyphens
  const cleanPhone = phone.replace(/[\s.-]/g, '');
  
  // Chilean mobile: +56 9 XXXX XXXX or 9 XXXX XXXX
  // Chilean landline: +56 2 XXXX XXXX or 2 XXXX XXXX
  const mobileRegex = /^(\+56)?9[0-9]{8}$/;
  const landlineRegex = /^(\+56)?[2-6][0-9]{8}$/;
  
  return mobileRegex.test(cleanPhone) || landlineRegex.test(cleanPhone);
}

// Sanitize input to prevent injection attacks
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/['";]/g, '') // Remove potential SQL injection characters
    .slice(0, 1000); // Limit length
}

// Document number validation
export function validateDocumentNumber(docNumber: string): boolean {
  // Format: DOC-YYYY-XXXXXX
  const regex = /^DOC-\d{4}-\d{6}$/;
  return regex.test(docNumber);
}

// Hash validation (SHA-256)
export function validateHash(hash: string): boolean {
  // SHA-256 produces 64 character hex string
  const regex = /^[a-f0-9]{64}$/i;
  return regex.test(hash);
}

// GPS coordinates validation for Chile
export function validateChileanGPS(lat: number, lng: number): boolean {
  // Chile's approximate boundaries
  // Latitude: -55.98 to -17.5
  // Longitude: -109.45 to -66.42
  return lat >= -55.98 && lat <= -17.5 && 
         lng >= -109.45 && lng <= -66.42;
}

// Email validation
export function validateEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}
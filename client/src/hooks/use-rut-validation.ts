import { useState, useCallback } from 'react';

// Chilean RUT validation hook
export function useRutValidation() {
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [formattedRut, setFormattedRut] = useState<string>('');

  const validateRUT = useCallback((rut: string): boolean => {
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
  }, []);

  const formatRUT = useCallback((rut: string): string => {
    if (!rut) return '';
    
    const cleanRut = rut.replace(/\./g, '').replace(/-/g, '').toUpperCase();
    
    if (cleanRut.length < 8) return rut;
    
    const rutNumber = cleanRut.slice(0, -1);
    const checkDigit = cleanRut.slice(-1);
    
    // Add dots every 3 digits from right to left
    const formatted = rutNumber.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    
    return `${formatted}-${checkDigit}`;
  }, []);

  const handleRutChange = useCallback((value: string) => {
    const formatted = formatRUT(value);
    const valid = validateRUT(value);
    
    setFormattedRut(formatted);
    setIsValid(valid);
    
    return { formatted, valid };
  }, [formatRUT, validateRUT]);

  return {
    isValid,
    formattedRut,
    handleRutChange,
    validateRUT,
    formatRUT,
  };
}
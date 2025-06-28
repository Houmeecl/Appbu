import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRutValidation } from "@/hooks/use-rut-validation";

type RutInputProps = {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange: (value: string, isValid: boolean) => void;
  required?: boolean;
  className?: string;
};

export function RutInput({ 
  label = "RUT", 
  placeholder = "Ej: 12.345.678-9",
  value = "",
  onChange,
  required = false,
  className = ""
}: RutInputProps) {
  const [inputValue, setInputValue] = useState(value);
  const { isValid, handleRutChange } = useRutValidation();

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const { formatted, valid } = handleRutChange(rawValue);
    
    setInputValue(formatted);
    onChange(formatted, valid);
  };

  const getInputStyles = () => {
    if (!inputValue) return "";
    if (isValid === true) return "border-green-500 focus:border-green-600";
    if (isValid === false) return "border-red-500 focus:border-red-600";
    return "";
  };

  const getValidationIcon = () => {
    if (!inputValue) return null;
    if (isValid === true) return <i className="fas fa-check text-green-500 text-sm"></i>;
    if (isValid === false) return <i className="fas fa-times text-red-500 text-sm"></i>;
    return null;
  };

  return (
    <div className={className}>
      {label && (
        <Label htmlFor="rut-input" className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      <div className="relative">
        <Input
          id="rut-input"
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          maxLength={12} // 11.111.111-1 format
          className={`pr-8 ${getInputStyles()}`}
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {getValidationIcon()}
        </div>
      </div>
      {isValid === false && inputValue && (
        <p className="text-red-500 text-xs mt-1">
          <i className="fas fa-exclamation-circle mr-1"></i>
          RUT inválido. Verifique el formato y dígito verificador.
        </p>
      )}
      {isValid === true && inputValue && (
        <p className="text-green-600 text-xs mt-1">
          <i className="fas fa-check-circle mr-1"></i>
          RUT válido
        </p>
      )}
    </div>
  );
}
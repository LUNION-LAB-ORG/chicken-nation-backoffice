/**
 * 🔒 COMPOSANT D'INPUT SÉCURISÉ
 * Validation et sanitisation automatique des entrées utilisateur
 */

import React, { useState, useCallback, useEffect } from 'react';
import { sanitizeUserInput, sanitizeName, sanitizeEmail, sanitizePhone, containsSuspiciousContent } from '@/utils/sanitization';

export interface SecureInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  validationType?: 'text' | 'name' | 'email' | 'phone' | 'description';
  maxLength?: number;
  showCharacterCount?: boolean;
  validateOnBlur?: boolean;
  onValidationChange?: (isValid: boolean, error?: string) => void;
  className?: string;
  label?: string;
  required?: boolean;
}

export function SecureInput({
  value,
  onChange,
  validationType = 'text',
  maxLength = 255,
  showCharacterCount = false,
  validateOnBlur = true,
  onValidationChange,
  className = '',
  label,
  required = false,
  ...props
}: SecureInputProps) {
  const [error, setError] = useState<string>('');
  const [isValid, setIsValid] = useState(true);
  const [isFocused, setIsFocused] = useState(false);

  // Fonction de sanitisation selon le type
  const sanitizeValue = useCallback((inputValue: string): string => {
    switch (validationType) {
      case 'name':
        return sanitizeName(inputValue);
      case 'email':
        return sanitizeEmail(inputValue);
      case 'phone':
        return sanitizePhone(inputValue);
      case 'description':
        return sanitizeUserInput(inputValue).substring(0, maxLength);
      default:
        return sanitizeUserInput(inputValue).substring(0, maxLength);
    }
  }, [validationType, maxLength]);

  // Fonction de validation
  const validateValue = useCallback((inputValue: string): { isValid: boolean; error?: string } => {
    // Vérification du contenu suspect
    if (containsSuspiciousContent(inputValue)) {
      return { isValid: false, error: 'Contenu non autorisé détecté' };
    }

    // Validation selon le type
    switch (validationType) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (inputValue && !emailRegex.test(inputValue)) {
          return { isValid: false, error: 'Format d\'email invalide' };
        }
        break;
      
      case 'phone':
        const phoneRegex = /^[\+]?[0-9\-\s\(\)]{8,20}$/;
        if (inputValue && !phoneRegex.test(inputValue)) {
          return { isValid: false, error: 'Format de téléphone invalide' };
        }
        break;
      
      case 'name':
        if (inputValue && inputValue.length < 2) {
          return { isValid: false, error: 'Le nom doit contenir au moins 2 caractères' };
        }
        break;
    }

    // Validation de la longueur
    if (inputValue.length > maxLength) {
      return { isValid: false, error: `Maximum ${maxLength} caractères autorisés` };
    }

    // Validation required
    if (required && !inputValue.trim()) {
      return { isValid: false, error: 'Ce champ est requis' };
    }

    return { isValid: true };
  }, [validationType, maxLength, required]);

  // Gestion du changement de valeur
  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = event.target.value;
    const sanitizedValue = sanitizeValue(rawValue);
    
    // Validation en temps réel
    const validation = validateValue(sanitizedValue);
    setIsValid(validation.isValid);
    setError(validation.error || '');
    
    // Notification du parent
    onValidationChange?.(validation.isValid, validation.error);
    onChange(sanitizedValue);
  }, [sanitizeValue, validateValue, onValidationChange, onChange]);

  // Validation au blur
  const handleBlur = useCallback(() => {
    setIsFocused(false);
    
    if (validateOnBlur) {
      const validation = validateValue(value);
      setIsValid(validation.isValid);
      setError(validation.error || '');
      onValidationChange?.(validation.isValid, validation.error);
    }
  }, [validateOnBlur, validateValue, value, onValidationChange]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    setError(''); // Efface l'erreur au focus
  }, []);

  // Validation initiale
  useEffect(() => {
    const validation = validateValue(value);
    setIsValid(validation.isValid);
    if (!isFocused && validation.error) {
      setError(validation.error);
    }
    onValidationChange?.(validation.isValid, validation.error);
  }, [value, validateValue, isFocused, onValidationChange]);

  // Classes CSS dynamiques
  const inputClasses = `
    w-full px-3 py-2 border-2 rounded-lg transition-colors duration-200
    focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent
    ${isValid 
      ? 'border-gray-300 hover:border-gray-400' 
      : 'border-red-300 bg-red-50'
    }
    ${className}
  `.trim();

  const characterCount = value.length;
  const isNearLimit = characterCount > maxLength * 0.8;

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <input
          {...props}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          className={inputClasses}
          maxLength={maxLength}
        />
        
        {/* Indicateur de validation */}
        {!isFocused && value && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {isValid ? (
              <span className="text-green-500 text-sm">✓</span>
            ) : (
              <span className="text-red-500 text-sm">✗</span>
            )}
          </div>
        )}
      </div>

      {/* Compteur de caractères */}
      {showCharacterCount && (
        <div className={`text-xs mt-1 text-right ${
          isNearLimit ? 'text-orange-500' : 'text-gray-500'
        }`}>
          {characterCount}/{maxLength}
        </div>
      )}

      {/* Message d'erreur */}
      {error && !isFocused && (
        <div className="text-red-500 text-xs mt-1">
          {error}
        </div>
      )}
    </div>
  );
}

/**
 * Input spécialisé pour les noms
 */
export function SecureNameInput(props: Omit<SecureInputProps, 'validationType'>) {
  return (
    <SecureInput
      {...props}
      validationType="name"
      maxLength={100}
      placeholder="Nom complet"
    />
  );
}

/**
 * Input spécialisé pour les emails
 */
export function SecureEmailInput(props: Omit<SecureInputProps, 'validationType'>) {
  return (
    <SecureInput
      {...props}
      validationType="email"
      maxLength={254}
      type="email"
      placeholder="email@exemple.com"
    />
  );
}

/**
 * Input spécialisé pour les téléphones
 */
export function SecurePhoneInput(props: Omit<SecureInputProps, 'validationType'>) {
  return (
    <SecureInput
      {...props}
      validationType="phone"
      maxLength={20}
      type="tel"
      placeholder="+33 1 23 45 67 89"
    />
  );
}

/**
 * Textarea sécurisé pour les descriptions
 */
export interface SecureTextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  showCharacterCount?: boolean;
  label?: string;
  required?: boolean;
}

export function SecureTextarea({
  value,
  onChange,
  maxLength = 2000,
  showCharacterCount = true,
  label,
  required = false,
  className = '',
  ...props
}: SecureTextareaProps) {
  const [error, setError] = useState<string>('');

  const handleChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const rawValue = event.target.value;
    const sanitizedValue = sanitizeUserInput(rawValue).substring(0, maxLength);
    
    // Vérification du contenu suspect
    if (containsSuspiciousContent(sanitizedValue)) {
      setError('Contenu non autorisé détecté');
      return;
    }
    
    setError('');
    onChange(sanitizedValue);
  }, [maxLength, onChange]);

  const characterCount = value.length;
  const isNearLimit = characterCount > maxLength * 0.8;

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <textarea
        {...props}
        value={value}
        onChange={handleChange}
        maxLength={maxLength}
        className={`
          w-full px-3 py-2 border-2 border-gray-300 rounded-lg transition-colors duration-200
          focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent
          hover:border-gray-400 resize-vertical min-h-[100px]
          ${error ? 'border-red-300 bg-red-50' : ''}
          ${className}
        `.trim()}
      />

      {/* Compteur de caractères */}
      {showCharacterCount && (
        <div className={`text-xs mt-1 text-right ${
          isNearLimit ? 'text-orange-500' : 'text-gray-500'
        }`}>
          {characterCount}/{maxLength}
        </div>
      )}

      {/* Message d'erreur */}
      {error && (
        <div className="text-red-500 text-xs mt-1">
          {error}
        </div>
      )}
    </div>
  );
}

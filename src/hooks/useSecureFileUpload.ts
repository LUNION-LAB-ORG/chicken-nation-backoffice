/**
 * 🔒 HOOK SÉCURISÉ POUR L'UPLOAD DE FICHIERS
 * Validation côté client avec protection contre les fichiers malveillants
 */

import { useState, useCallback } from 'react';
import {
  validateFile,
  validateImageDimensions,
  sanitizeFileName,
  FileValidationOptions,
  FileValidationResult
} from '@/utils/fileValidation';

export interface SecureFileUploadState {
  file: File | null;
  preview: string | null;
  isValidating: boolean;
  error: string | null;
  warnings: string[];
  isValid: boolean;
}

export interface SecureFileUploadOptions extends FileValidationOptions {
  generatePreview?: boolean;
  validateDimensions?: boolean;
  onValidationComplete?: (result: FileValidationResult) => void;
  onFileSelect?: (file: File) => void;
}

export function useSecureFileUpload(options: SecureFileUploadOptions = {}) {
  const [state, setState] = useState<SecureFileUploadState>({
    file: null,
    preview: null,
    isValidating: false,
    error: null,
    warnings: [],
    isValid: false
  });

  const resetState = useCallback(() => {
    setState({
      file: null,
      preview: null,
      isValidating: false,
      error: null,
      warnings: [],
      isValid: false
    });
  }, []);

  const validateAndSetFile = useCallback(async (file: File) => {
    setState(prev => ({ ...prev, isValidating: true, error: null, warnings: [] }));

    try {
      // 1. Validation de base du fichier
      const basicValidation = validateFile(file, options);

      if (!basicValidation.isValid) {
        setState(prev => ({
          ...prev,
          isValidating: false,
          error: basicValidation.error || 'Fichier invalide',
          warnings: basicValidation.warnings || [],
          isValid: false
        }));

        options.onValidationComplete?.(basicValidation);
        return;
      }

      // 2. Validation des dimensions si demandée
      if (options.validateDimensions && file.type.startsWith('image/')) {
        const dimensionValidation = await validateImageDimensions(file, options);

        if (!dimensionValidation.isValid) {
          setState(prev => ({
            ...prev,
            isValidating: false,
            error: dimensionValidation.error || 'Dimensions invalides',
            warnings: [...(basicValidation.warnings || []), ...(dimensionValidation.warnings || [])],
            isValid: false
          }));

          options.onValidationComplete?.(dimensionValidation);
          return;
        }
      }

      // 3. Génération du preview si demandée
      let preview: string | null = null;
      if (options.generatePreview && file.type.startsWith('image/')) {
        try {
          preview = await generateSecurePreview(file);
        } catch (previewError) {
          console.warn('Erreur lors de la génération du preview:', previewError);
        }
      }

      // 4. Sanitisation du nom de fichier
      const sanitizedFile = new File([file], sanitizeFileName(file.name), {
        type: file.type,
        lastModified: file.lastModified
      });

      // 5. Mise à jour de l'état avec succès
      setState(prev => ({
        ...prev,
        file: sanitizedFile,
        preview,
        isValidating: false,
        error: null,
        warnings: basicValidation.warnings || [],
        isValid: true
      }));

      const successResult: FileValidationResult = {
        isValid: true,
        warnings: basicValidation.warnings
      };

      options.onValidationComplete?.(successResult);
      options.onFileSelect?.(sanitizedFile);

    } catch {
      setState(prev => ({
        ...prev,
        isValidating: false,
        error: 'Erreur lors de la validation du fichier',
        warnings: [],
        isValid: false
      }));

      const errorResult: FileValidationResult = {
        isValid: false,
        error: 'Erreur lors de la validation du fichier'
      };

      options.onValidationComplete?.(errorResult);
    }
  }, [options]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      resetState();
      return;
    }

    validateAndSetFile(file);
  }, [validateAndSetFile, resetState]);

  const handleFileDrop = useCallback((event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();

    const file = event.dataTransfer.files?.[0];

    if (!file) {
      resetState();
      return;
    }

    validateAndSetFile(file);
  }, [validateAndSetFile, resetState]);

  const removeFile = useCallback(() => {
    if (state.preview) {
      URL.revokeObjectURL(state.preview);
    }
    resetState();
  }, [state.preview, resetState]);

  return {
    // État
    ...state,

    // Actions
    handleFileSelect,
    handleFileDrop,
    removeFile,
    resetState,

    // Utilitaires
    formatFileSize: (bytes: number) => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
  };
}

/**
 * Génère un preview sécurisé d'une image
 */
async function generateSecurePreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    // Vérification supplémentaire du type
    if (!file.type.startsWith('image/')) {
      reject(new Error('Le fichier n\'est pas une image'));
      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        resolve(result);
      } else {
        reject(new Error('Impossible de générer le preview'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Erreur lors de la lecture du fichier'));
    };

    // Limite de taille pour le preview (5MB)
    if (file.size > 5 * 1024 * 1024) {
      reject(new Error('Fichier trop volumineux pour le preview'));
      return;
    }

    reader.readAsDataURL(file);
  });
}

/**
 * Hook spécialisé pour les images de promotion
 */
export function usePromoImageUpload() {
  return useSecureFileUpload({
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
    maxWidth: 2000,
    maxHeight: 2000,
    generatePreview: true,
    validateDimensions: true
  });
}

/**
 * Hook spécialisé pour les avatars
 */
export function useAvatarUpload() {
  return useSecureFileUpload({
    maxSize: 2 * 1024 * 1024, // 2MB
    allowedTypes: ['image/jpeg', 'image/png'],
    allowedExtensions: ['.jpg', '.jpeg', '.png'],
    maxWidth: 1024,
    maxHeight: 1024,
    generatePreview: true,
    validateDimensions: true
  });
}

/**
 * Hook spécialisé pour les images de restaurant
 */
export function useRestaurantImageUpload() {
  return useSecureFileUpload({
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
    maxWidth: 4096,
    maxHeight: 4096,
    generatePreview: true,
    validateDimensions: true
  });
}

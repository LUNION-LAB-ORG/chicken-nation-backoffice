 

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  warnings?: string[];
}

export interface FileValidationOptions {
  maxSize?: number; // en bytes
  allowedTypes?: string[];
  allowedExtensions?: string[];
  maxWidth?: number;
  maxHeight?: number;
}

// Configuration par défaut sécurisée
const DEFAULT_OPTIONS: Required<FileValidationOptions> = {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
  maxWidth: 4096,
  maxHeight: 4096
};

/**
 * Valide un fichier selon les critères de sécurité
 */
export function validateFile(
  file: File, 
  options: FileValidationOptions = {}
): FileValidationResult {
  const config = { ...DEFAULT_OPTIONS, ...options };
  const warnings: string[] = [];

  // 1. Vérification de la taille
  if (file.size > config.maxSize) {
    return {
      isValid: false,
      error: `Le fichier est trop volumineux. Taille maximale autorisée: ${formatFileSize(config.maxSize)}`
    };
  }

  // 2. Vérification du type MIME
  if (!config.allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `Type de fichier non autorisé. Types acceptés: ${config.allowedTypes.join(', ')}`
    };
  }

  // 3. Vérification de l'extension
  const fileExtension = getFileExtension(file.name).toLowerCase();
  if (!config.allowedExtensions.includes(fileExtension)) {
    return {
      isValid: false,
      error: `Extension de fichier non autorisée. Extensions acceptées: ${config.allowedExtensions.join(', ')}`
    };
  }

  // 4. Vérification de cohérence type MIME / extension
  if (!isMimeTypeConsistentWithExtension(file.type, fileExtension)) {
    warnings.push('Le type de fichier ne correspond pas à son extension');
  }

  // 5. Vérifications de sécurité supplémentaires
  if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
    return {
      isValid: false,
      error: 'Nom de fichier non autorisé (caractères dangereux détectés)'
    };
  }

  // 6. Vérification de la longueur du nom
  if (file.name.length > 255) {
    return {
      isValid: false,
      error: 'Nom de fichier trop long (maximum 255 caractères)'
    };
  }

  return {
    isValid: true,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}

/**
 * Valide les dimensions d'une image
 */
export function validateImageDimensions(
  file: File,
  options: Pick<FileValidationOptions, 'maxWidth' | 'maxHeight'> = {}
): Promise<FileValidationResult> {
  return new Promise((resolve) => {
    const config = { ...DEFAULT_OPTIONS, ...options };
    
    if (!file.type.startsWith('image/')) {
      resolve({
        isValid: false,
        error: 'Le fichier n\'est pas une image'
      });
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      
      if (img.width > config.maxWidth || img.height > config.maxHeight) {
        resolve({
          isValid: false,
          error: `Dimensions trop importantes. Maximum autorisé: ${config.maxWidth}x${config.maxHeight}px`
        });
      } else {
        resolve({ isValid: true });
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({
        isValid: false,
        error: 'Impossible de lire l\'image (fichier corrompu ou format non supporté)'
      });
    };

    img.src = url;
  });
}

/**
 * Sanitise le nom d'un fichier
 */
export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Remplace les caractères spéciaux
    .replace(/_{2,}/g, '_') // Évite les underscores multiples
    .replace(/^_+|_+$/g, '') // Supprime les underscores en début/fin
    .substring(0, 255); // Limite la longueur
}

/**
 * Formate la taille d'un fichier en format lisible
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Extrait l'extension d'un fichier
 */
function getFileExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf('.');
  return lastDot === -1 ? '' : fileName.substring(lastDot);
}

/**
 * Vérifie la cohérence entre type MIME et extension
 */
function isMimeTypeConsistentWithExtension(mimeType: string, extension: string): boolean {
  const mimeToExtension: Record<string, string[]> = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/webp': ['.webp'],
    'image/gif': ['.gif']
  };

  const expectedExtensions = mimeToExtension[mimeType];
  return expectedExtensions ? expectedExtensions.includes(extension) : false;
}

/**
 * Configuration spécifique pour les images de promotion
 */
export const PROMO_IMAGE_VALIDATION: FileValidationOptions = {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
  maxWidth: 2000,
  maxHeight: 2000
};

/**
 * Configuration spécifique pour les avatars
 */
export const AVATAR_VALIDATION: FileValidationOptions = {
  maxSize: 2 * 1024 * 1024, // 2MB
  allowedTypes: ['image/jpeg', 'image/png'],
  allowedExtensions: ['.jpg', '.jpeg', '.png'],
  maxWidth: 1024,
  maxHeight: 1024
};

/**
 * Configuration spécifique pour les images de restaurant
 */
export const RESTAURANT_IMAGE_VALIDATION: FileValidationOptions = {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
  maxWidth: 4096,
  maxHeight: 4096
};

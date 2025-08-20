/**
 * 🔒 GESTION SÉCURISÉE DES ERREURS
 * Évite l'exposition d'informations sensibles dans les messages d'erreur
 */

export interface SecureError {
  message: string;
  code?: string;
  statusCode?: number;
  userMessage: string;
  timestamp: string;
}

/**
 * Messages d'erreur génériques pour l'utilisateur final
 */
const USER_FRIENDLY_MESSAGES = {
  NETWORK_ERROR: 'Problème de connexion. Veuillez réessayer.',
  VALIDATION_ERROR: 'Les données saisies ne sont pas valides.',
  AUTHENTICATION_ERROR: 'Erreur d\'authentification. Veuillez vous reconnecter.',
  AUTHORIZATION_ERROR: 'Vous n\'avez pas les permissions nécessaires.',
  NOT_FOUND_ERROR: 'La ressource demandée n\'a pas été trouvée.',
  SERVER_ERROR: 'Une erreur technique est survenue. Veuillez réessayer plus tard.',
  TIMEOUT_ERROR: 'La requête a pris trop de temps. Veuillez réessayer.',
  FILE_ERROR: 'Erreur lors du traitement du fichier.',
  RATE_LIMIT_ERROR: 'Trop de tentatives. Veuillez patienter avant de réessayer.',
  MAINTENANCE_ERROR: 'Service temporairement indisponible pour maintenance.',
  UNKNOWN_ERROR: 'Une erreur inattendue s\'est produite.'
};

/**
 * Codes d'erreur internes (ne pas exposer à l'utilisateur)
 */
export enum ErrorCode {
  NETWORK_ERROR = 'NETWORK_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  FILE_ERROR = 'FILE_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  MAINTENANCE_ERROR = 'MAINTENANCE_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Crée une erreur sécurisée avec message utilisateur approprié
 */
export function createSecureError(
  originalError: unknown,
  code: ErrorCode = ErrorCode.UNKNOWN_ERROR,
  statusCode?: number
): SecureError {
  // ✅ SÉCURITÉ : Ne jamais exposer les détails techniques
  const userMessage = USER_FRIENDLY_MESSAGES[code] || USER_FRIENDLY_MESSAGES.UNKNOWN_ERROR;

  // Log interne pour le debugging (côté serveur uniquement)
  const internalMessage = originalError instanceof Error
    ? originalError.message
    : String(originalError);

  return {
    message: internalMessage, // Pour les logs internes
    code,
    statusCode,
    userMessage, // Pour l'affichage utilisateur
    timestamp: new Date().toISOString()
  };
}

/**
 * Détermine le type d'erreur basé sur le status HTTP
 */
export function getErrorCodeFromStatus(status: number): ErrorCode {
  switch (status) {
    case 400:
      return ErrorCode.VALIDATION_ERROR;
    case 401:
      return ErrorCode.AUTHENTICATION_ERROR;
    case 403:
      return ErrorCode.AUTHORIZATION_ERROR;
    case 404:
      return ErrorCode.NOT_FOUND_ERROR;
    case 408:
      return ErrorCode.TIMEOUT_ERROR;
    case 413:
      return ErrorCode.FILE_ERROR;
    case 429:
      return ErrorCode.RATE_LIMIT_ERROR;
    case 503:
      return ErrorCode.MAINTENANCE_ERROR;
    case 500:
    case 502:
    case 504:
      return ErrorCode.SERVER_ERROR;
    default:
      return ErrorCode.UNKNOWN_ERROR;
  }
}

/**
 * Gère les erreurs de requête API de manière sécurisée
 */
export function handleApiError(error: unknown): SecureError {
  // Erreur réseau
  if (!navigator.onLine) {
    return createSecureError(error, ErrorCode.NETWORK_ERROR);
  }

  // Erreur avec response
  if (error && typeof error === 'object' && 'response' in error) {
    const errorWithResponse = error as { response: { status: number } };
    const status = errorWithResponse.response.status;
    const code = getErrorCodeFromStatus(status);
    return createSecureError(error, code, status);
  }

  // Erreur de requête (timeout, etc.)
  if (error && typeof error === 'object' && 'request' in error) {
    return createSecureError(error, ErrorCode.NETWORK_ERROR);
  }

  // Erreur générique
  return createSecureError(error, ErrorCode.UNKNOWN_ERROR);
}

/**
 * Wrapper sécurisé pour les appels API
 */
export async function safeApiCall<T>(
  apiCall: () => Promise<T>,
  errorContext?: string
): Promise<{ data?: T; error?: SecureError }> {
  try {
    const data = await apiCall();
    return { data };
  } catch (error) {
    const secureError = handleApiError(error);

    // Log interne avec contexte (ne pas exposer à l'utilisateur)
    if (typeof window === 'undefined') {
      // Côté serveur - log complet
      console.error(`[API Error] ${errorContext || 'Unknown context'}:`, {
        originalError: error,
        secureError,
        stack: error instanceof Error ? error.stack : undefined
      });
    } else {
      // Côté client - log minimal
      console.error(`[API Error] ${errorContext || 'Unknown context'}:`, secureError.userMessage);
    }

    return { error: secureError };
  }
}

/**
 * Valide et sanitise les messages d'erreur côté client
 */
export function sanitizeErrorMessage(message: string): string {
  if (!message || typeof message !== 'string') {
    return USER_FRIENDLY_MESSAGES.UNKNOWN_ERROR;
  }

  // Supprime les informations potentiellement sensibles
  const sensitivePatterns = [
    /password/gi,
    /token/gi,
    /key/gi,
    /secret/gi,
    /api[_-]?key/gi,
    /authorization/gi,
    /bearer/gi,
    /jwt/gi,
    /session/gi,
    /cookie/gi,
    /localhost/gi,
    /127\.0\.0\.1/gi,
    /192\.168\./gi,
    /10\./gi,
    /172\./gi,
    /file:\/\//gi,
    /c:\\/gi,
    /\/home\//gi,
    /\/var\//gi,
    /\/etc\//gi
  ];

  let sanitized = message;
  sensitivePatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  });

  // Limite la longueur
  return sanitized.substring(0, 200);
}

/**
 * Hook React pour la gestion d'erreurs sécurisée
 */
export function useSecureErrorHandler() {
  const handleError = (error: unknown, context?: string): string => {
    const secureError = handleApiError(error);

    // Log pour le développement
    if (process.env.NODE_ENV === 'development') {
      console.error(`[Error Handler] ${context || 'Unknown'}:`, error);
    }

    return secureError.userMessage;
  };

  const handleApiCall = async <T>(
    apiCall: () => Promise<T>,
    context?: string
  ): Promise<{ data?: T; error?: string }> => {
    const result = await safeApiCall(apiCall, context);

    if (result.error) {
      return { error: result.error.userMessage };
    }

    return { data: result.data };
  };

  return {
    handleError,
    handleApiCall
  };
}

/**
 * Composant d'affichage d'erreur sécurisé
 */
export interface ErrorDisplayProps {
  error: SecureError | string | null;
  onRetry?: () => void;
  className?: string;
}

/**
 * Utilitaire pour créer des messages d'erreur contextuels
 */
export function createContextualError(
  operation: string,
  originalError: unknown
): SecureError {
  const baseCode = handleApiError(originalError).code;

  const contextualMessages: Record<string, Partial<Record<ErrorCode, string>>> = {
    login: {
      [ErrorCode.AUTHENTICATION_ERROR]: 'Email ou mot de passe incorrect.',
      [ErrorCode.NETWORK_ERROR]: 'Impossible de se connecter. Vérifiez votre connexion.',
      [ErrorCode.RATE_LIMIT_ERROR]: 'Trop de tentatives de connexion. Réessayez dans quelques minutes.',
      [ErrorCode.SERVER_ERROR]: 'Problème de connexion au serveur. Réessayez plus tard.',
      [ErrorCode.UNKNOWN_ERROR]: 'Erreur de connexion. Veuillez réessayer.'
    },
    upload: {
      [ErrorCode.FILE_ERROR]: 'Le fichier ne peut pas être téléchargé. Vérifiez le format et la taille.',
      [ErrorCode.VALIDATION_ERROR]: 'Le fichier ne respecte pas les critères requis.',
      [ErrorCode.NETWORK_ERROR]: 'Échec du téléchargement. Vérifiez votre connexion.',
      [ErrorCode.SERVER_ERROR]: 'Erreur serveur lors du téléchargement.',
      [ErrorCode.UNKNOWN_ERROR]: 'Erreur lors du téléchargement du fichier.'
    },
    save: {
      [ErrorCode.VALIDATION_ERROR]: 'Les données saisies ne sont pas valides.',
      [ErrorCode.AUTHORIZATION_ERROR]: 'Vous n\'avez pas les droits pour effectuer cette action.',
      [ErrorCode.NETWORK_ERROR]: 'Impossible de sauvegarder. Vérifiez votre connexion.',
      [ErrorCode.SERVER_ERROR]: 'Erreur lors de la sauvegarde.',
      [ErrorCode.UNKNOWN_ERROR]: 'Erreur lors de la sauvegarde.'
    }
  };

  const contextMessages = contextualMessages[operation];
  const errorCode: ErrorCode = (baseCode as ErrorCode) || ErrorCode.UNKNOWN_ERROR;
  const userMessage = (contextMessages && errorCode && contextMessages[errorCode as keyof typeof contextMessages]) ||
                     USER_FRIENDLY_MESSAGES[errorCode as keyof typeof USER_FRIENDLY_MESSAGES] ||
                     USER_FRIENDLY_MESSAGES.UNKNOWN_ERROR;

  // Créer l'erreur avec le message contextuel
  const secureError = createSecureError(originalError, errorCode);
  secureError.userMessage = userMessage;

  return secureError;
}

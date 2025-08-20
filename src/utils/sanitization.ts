 

// Import conditionnel pour éviter les erreurs SSR
interface DOMPurifyInterface {
  sanitize: (input: string, config?: Record<string, unknown>) => string;
}

let DOMPurify: DOMPurifyInterface | null = null;

// Initialisation côté client uniquement
if (typeof window !== 'undefined') {
  import('dompurify').then((module) => {
    DOMPurify = module.default;
  }).catch(() => {
    if (process.env.NODE_ENV === 'development') {
      console.warn('DOMPurify non disponible - sanitisation basique utilisée');
    }
  });
}

/**
 * Configuration DOMPurify sécurisée
 */
const PURIFY_CONFIG = {
  // Autorise uniquement les balises de base pour le texte
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br'],
  ALLOWED_ATTR: [],
  KEEP_CONTENT: true,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  RETURN_DOM_IMPORT: false,
  SANITIZE_DOM: true,
  FORCE_BODY: false,
  WHOLE_DOCUMENT: false
};

/**
 * Configuration stricte - aucune balise HTML autorisée
 */
const STRICT_CONFIG = {
  ALLOWED_TAGS: [],
  ALLOWED_ATTR: [],
  KEEP_CONTENT: true
};

/**
 * Sanitise une chaîne de caractères contre les attaques XSS
 */
export function sanitizeHtml(input: string, strict: boolean = true): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Fallback si DOMPurify n'est pas disponible
  if (!DOMPurify) {
    return sanitizeBasic(input);
  }

  try {
    const config = strict ? STRICT_CONFIG : PURIFY_CONFIG;
    return DOMPurify.sanitize(input, config);
  } catch (error) {
    console.warn('Erreur lors de la sanitisation DOMPurify:', error);
    return sanitizeBasic(input);
  }
}

/**
 * Sanitisation basique sans DOMPurify (fallback)
 */
function sanitizeBasic(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .replace(/&/g, '&amp;');
}

/**
 * Sanitise les entrées utilisateur pour les formulaires
 */
export function sanitizeUserInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return sanitizeHtml(input, true)
    .trim()
    .substring(0, 1000); // Limite la longueur
}

/**
 * Sanitise les noms (utilisateurs, restaurants, etc.)
 */
export function sanitizeName(name: string): string {
  if (!name || typeof name !== 'string') {
    return '';
  }

  return name
    .replace(/[<>\"'&]/g, '') // Supprime les caractères dangereux
    .replace(/\s+/g, ' ') // Normalise les espaces
    .trim()
    .substring(0, 100); // Limite la longueur
}

/**
 * Sanitise les emails
 */
export function sanitizeEmail(email: string): string {
  if (!email || typeof email !== 'string') {
    return '';
  }

  return email
    .toLowerCase()
    .replace(/[<>\"'&\s]/g, '') // Supprime les caractères dangereux et espaces
    .trim()
    .substring(0, 254); // Limite RFC
}

/**
 * Sanitise les numéros de téléphone
 */
export function sanitizePhone(phone: string): string {
  if (!phone || typeof phone !== 'string') {
    return '';
  }

  return phone
    .replace(/[^0-9+\-\s()]/g, '') // Garde uniquement les caractères valides
    .trim()
    .substring(0, 20);
}

/**
 * Sanitise les descriptions et commentaires
 */
export function sanitizeDescription(description: string): string {
  if (!description || typeof description !== 'string') {
    return '';
  }

  return sanitizeHtml(description, false) // Autorise quelques balises de base
    .trim()
    .substring(0, 2000); // Limite la longueur
}

/**
 * Sanitise les URLs
 */
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return '';
  }

  // Vérifie que l'URL commence par http:// ou https://
  const urlPattern = /^https?:\/\/.+/i;
  if (!urlPattern.test(url)) {
    return '';
  }

  return url
    .replace(/[<>\"'&\s]/g, '') // Supprime les caractères dangereux
    .trim()
    .substring(0, 2048); // Limite la longueur
}

/**
 * Valide et sanitise un objet de données utilisateur
 */
export function sanitizeUserData(data: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      switch (key) {
        case 'email':
          sanitized[key] = sanitizeEmail(value);
          break;
        case 'phone':
        case 'telephone':
          sanitized[key] = sanitizePhone(value);
          break;
        case 'name':
        case 'fullname':
        case 'firstName':
        case 'lastName':
          sanitized[key] = sanitizeName(value);
          break;
        case 'description':
        case 'comment':
        case 'message':
          sanitized[key] = sanitizeDescription(value);
          break;
        case 'url':
        case 'website':
          sanitized[key] = sanitizeUrl(value);
          break;
        default:
          sanitized[key] = sanitizeUserInput(value);
      }
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      sanitized[key] = value;
    } else if (value === null || value === undefined) {
      sanitized[key] = value;
    } else {
      // Pour les objets et tableaux, on les ignore ou on les traite récursivement
      console.warn(`Type non supporté pour la sanitisation: ${key}`, typeof value);
    }
  }

  return sanitized;
}

/**
 * Échappe les caractères spéciaux pour l'affichage sécurisé
 */
export function escapeHtml(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Vérifie si une chaîne contient du contenu potentiellement dangereux
 */
export function containsSuspiciousContent(input: string): boolean {
  if (!input || typeof input !== 'string') {
    return false;
  }

  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /data:text\/html/i,
    /vbscript:/i
  ];

  return suspiciousPatterns.some(pattern => pattern.test(input));
}

/**
 * Nettoie les données avant envoi à l'API
 */
export function sanitizeForApi(data: unknown): unknown {
  if (typeof data === 'string') {
    return sanitizeUserInput(data);
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeForApi(item));
  }

  if (data && typeof data === 'object' && !Array.isArray(data)) {
    return sanitizeUserData(data as Record<string, unknown>);
  }

  return data;
}

/**
 * 🔒 UTILITAIRES DE SÉCURITÉ POUR LES CLÉS API
 * Gestion sécurisée des clés API et credentials
 */

/**
 * Valide qu'une clé API est présente et non vide
 */
export function validateApiKey(key: string | undefined, keyName: string): string {
  if (!key || key.trim() === '') {
    // ✅ SÉCURITÉ: Ne pas exposer le nom de la clé en production
    if (process.env.NODE_ENV === 'development') {
      console.error(`🚨 ERREUR SÉCURITÉ: ${keyName} manquante ou vide`);
    }
    throw new Error(`Configuration manquante`);
  }

  if (key.includes('votre_') || key.includes('example') || key.includes('test')) {
    if (process.env.NODE_ENV === 'development') {
      console.error(`🚨 ERREUR SÉCURITÉ: ${keyName} contient une valeur d'exemple`);
    }
    throw new Error(`Configuration non configurée correctement`);
  }

  return key;
}

/**
 * Masque une clé API pour les logs (affiche seulement les premiers et derniers caractères)
 */
export function maskApiKey(key: string): string {
  if (!key || key.length < 8) {
    return '[CLEF_INVALIDE]';
  }

  const start = key.substring(0, 4);
  const end = key.substring(key.length - 4);
  const middle = '*'.repeat(Math.max(0, key.length - 8));

  return `${start}${middle}${end}`;
}

/**
 * Vérifie si l'environnement est en développement
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Vérifie si l'environnement est en production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Récupère une clé API de manière sécurisée
 */
export function getSecureApiKey(envVarName: string, keyName: string): string {
  const key = process.env[envVarName];

  if (isProduction() && !key) {
    console.error(`🚨 ERREUR CRITIQUE: ${keyName} manquante en production`);
    throw new Error(`Configuration de production manquante: ${keyName}`);
  }

  if (isDevelopment() && !key) {
    console.warn(`⚠️ AVERTISSEMENT: ${keyName} manquante en développement`);
    return ''; // Retourne une chaîne vide en dev pour éviter les crashes
  }

  return validateApiKey(key, keyName);
}

/**
 * Configuration sécurisée des clés API
 */
export const SecureApiConfig = {
  /**
   * Récupère la clé Google Maps de manière sécurisée
   */
  getGoogleMapsApiKey(): string {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!key) {
      if (isDevelopment()) {
        console.warn('⚠️ Google Maps API Key manquante - fonctionnalités de carte désactivées');
        return '';
      }
      throw new Error('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY manquante en production');
    }

    if (key.includes('votre_') || key.includes('example') || key.includes('test')) {
      console.error('🚨 ERREUR SÉCURITÉ: Google Maps API Key contient une valeur d\'exemple');
      throw new Error('Google Maps API Key non configurée correctement');
    }

    return key;
  },

  /**
   * Récupère l'URL de l'API de manière sécurisée
   */
  getApiUrl(): string {
    const url = process.env.NEXT_PUBLIC_API_URL;
    if (!url) {
      if (isDevelopment()) {
        console.warn('⚠️ API URL manquante - utilisation de l\'URL par défaut');
        return 'https://api-private.chicken-nation.com';
      }
      throw new Error('NEXT_PUBLIC_API_URL manquante en production');
    }
    return url;
  },
  /**
   * Récupère le préfixe API de manière sécurisée
   */
  getApiPrefix(): string {
    const prefix = process.env.NEXT_PUBLIC_API_PREFIX;
    if (!prefix) {
      if (isDevelopment()) {
        console.warn('⚠️ API PREFIX manquant - utilisation du préfixe par défaut');
        return 'https://api-private.chicken-nation.com/api/v1';
      }
      throw new Error('NEXT_PUBLIC_API_PREFIX manquant en production');
    }
    return prefix;
  },

  /**
   * Log sécurisé des configurations (masque les clés sensibles)
   */
  logSecureConfig(): void {
    if (isDevelopment()) {
      console.log('🔒 Configuration API sécurisée:');
      console.log('- API URL:', this.getApiUrl());
      console.log('- API PREFIX:', this.getApiPrefix());

      const googleKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (googleKey) {
        console.log('- Google Maps API Key:', maskApiKey(googleKey));
      } else {
        console.log('- Google Maps API Key: [NON_CONFIGURÉE]');
      }
    }
  }
};

/**
 * Middleware de validation des clés API au démarrage
 */
export function validateApiConfiguration(): void {
  if (isProduction()) {
    console.log('🔒 Validation de la configuration de production...');

    try {
      SecureApiConfig.getApiUrl();
      SecureApiConfig.getApiPrefix();
      console.log('✅ Configuration API validée');
    } catch (error) {
      console.error('🚨 ERREUR CRITIQUE: Configuration API invalide en production');
      throw error;
    }
  } else {
    console.log('🔧 Mode développement - validation souple des clés API');
    SecureApiConfig.logSecureConfig();
  }
}

/**
 * Détecte si des clés API sont exposées dans le code
 */
export function detectExposedApiKeys(codeString: string): string[] {
  const exposedKeys: string[] = [];

  // Patterns de clés API communes
  const apiKeyPatterns = [
    /AIza[0-9A-Za-z-_]{35}/g, // Google API Keys
    /sk_live_[0-9a-zA-Z]{24}/g, // Stripe Live Keys
    /sk_test_[0-9a-zA-Z]{24}/g, // Stripe Test Keys
    /pk_live_[0-9a-zA-Z]{24}/g, // Stripe Publishable Live Keys
    /pk_test_[0-9a-zA-Z]{24}/g, // Stripe Publishable Test Keys
    /[0-9a-f]{32}/g, // Generic 32-char hex keys
    /[A-Za-z0-9]{40}/g, // Generic 40-char keys
  ];

  apiKeyPatterns.forEach(pattern => {
    const matches = codeString.match(pattern);
    if (matches) {
      exposedKeys.push(...matches);
    }
  });

  return exposedKeys;
}

/**
 * Audit de sécurité des clés API
 */
export function auditApiKeySecurity(): {
  isSecure: boolean;
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];

  // Vérifier les variables d'environnement
  const requiredEnvVars = [
    'NEXT_PUBLIC_API_URL',
    'NEXT_PUBLIC_API_PREFIX'
  ];

  requiredEnvVars.forEach(envVar => {
    if (!process.env[envVar]) {
      issues.push(`Variable d'environnement manquante: ${envVar}`);
      recommendations.push(`Configurer ${envVar} dans .env.local`);
    }
  });

  // Vérifier Google Maps API Key
  const googleKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!googleKey) {
    issues.push('Google Maps API Key manquante');
    recommendations.push('Configurer NEXT_PUBLIC_GOOGLE_MAPS_API_KEY pour les fonctionnalités de carte');
  } else if (googleKey.includes('votre_') || googleKey.includes('example')) {
    issues.push('Google Maps API Key contient une valeur d\'exemple');
    recommendations.push('Remplacer par une vraie clé Google Maps API');
  }

  return {
    isSecure: issues.length === 0,
    issues,
    recommendations
  };
}

/**
 * Utilitaires pour la gestion des cookies d'authentification
 */

export interface CookieOptions {
  expires?: Date;
  maxAge?: number;
  path?: string;
  domain?: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
}

/**
 * Définit un cookie avec les options spécifiées
 */
export const setCookie = (name: string, value: string, options: CookieOptions = {}): void => {
  if (typeof document === 'undefined') return; // SSR protection

  const {
    expires,
    maxAge,
    path = '/',
    domain,
    secure = process.env.NODE_ENV === 'production',
    // httpOnly = false, // Note: httpOnly ne peut pas être défini côté client
    sameSite = 'strict' // Plus sécurisé pour la production
  } = options;

  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

  if (expires) {
    cookieString += `; expires=${expires.toUTCString()}`;
  }

  if (maxAge !== undefined) {
    cookieString += `; max-age=${maxAge}`;
  }

  cookieString += `; path=${path}`;

  if (domain) {
    cookieString += `; domain=${domain}`;
  }

  if (secure) {
    cookieString += `; secure`;
  }

  cookieString += `; samesite=${sameSite}`;

  document.cookie = cookieString;
};

/**
 * Récupère la valeur d'un cookie
 */
export const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null; // SSR protection

  const nameEQ = encodeURIComponent(name) + '=';
  const cookies = document.cookie.split(';');

  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.indexOf(nameEQ) === 0) {
      return decodeURIComponent(cookie.substring(nameEQ.length));
    }
  }

  return null;
};

/**
 * Supprime un cookie
 */
export const deleteCookie = (name: string, options: Partial<CookieOptions> = {}): void => {
  if (typeof document === 'undefined') return; // SSR protection

  const { path = '/', domain } = options;

  let cookieString = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}`;

  if (domain) {
    cookieString += `; domain=${domain}`;
  }

  document.cookie = cookieString;
};

/**
 * Vérifie si un cookie existe
 */
export const hasCookie = (name: string): boolean => {
  return getCookie(name) !== null;
};

/**
 * Récupère tous les cookies sous forme d'objet
 */
export const getAllCookies = (): Record<string, string> => {
  if (typeof document === 'undefined') return {}; // SSR protection

  const cookies: Record<string, string> = {};
  
  if (document.cookie) {
    document.cookie.split(';').forEach(cookie => {
      const [name, value] = cookie.trim().split('=');
      if (name && value) {
        cookies[decodeURIComponent(name)] = decodeURIComponent(value);
      }
    });
  }

  return cookies;
};

/**
 * Nettoie tous les cookies d'authentification
 */
export const clearAuthCookies = (): void => {
  const authCookieNames = [
    'chicken-nation-token',
    'chicken-nation-refresh-token',
    'chicken-nation-user',
    'chicken-nation-auth'
  ];

  authCookieNames.forEach(name => {
    deleteCookie(name);
    // Essayer aussi avec différents paths au cas où
    deleteCookie(name, { path: '/' });
    deleteCookie(name, { path: '' });
  });
};

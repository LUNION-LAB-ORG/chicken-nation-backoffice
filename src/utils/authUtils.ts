 // Vérifier si le token est valide
export function isTokenValid() {
  try {
    if (typeof document === 'undefined') return false;

    // Récupérer le token depuis les cookies
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'chicken-nation-token') {
        const token = decodeURIComponent(value);
        if (!token) return false;

        // Vérifier si le token est expiré (si JWT avec exp)
        try {
          const tokenParts = token.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            if (payload.exp && payload.exp * 1000 < Date.now()) {
              return false;
            }
          }
        } catch {
          // Si on ne peut pas décoder le token, on suppose qu'il est valide
        }

        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}

 
export function getAuthToken(): string {
  try {
    // Vérifier si nous sommes côté client (browser)
    if (typeof document === 'undefined') {
      return '';
    }

    // Récupérer le token depuis les cookies
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'chicken-nation-token') {
        const token = decodeURIComponent(value);

        // Vérifier si le token est expiré (si JWT avec exp)
        try {
          const tokenParts = token.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            if (payload.exp && payload.exp * 1000 < Date.now()) {
              // On retourne quand même le token expiré pour qu'il puisse être utilisé pour le refresh
            }
          }
        } catch {
          // Si on ne peut pas décoder le token, on suppose qu'il est valide
        }

        return token;
      }
    }

    return '';
  } catch {
    return '';
  }
}

 
export async function handleAuthError<T>(response: Response, retryFn: () => Promise<T>): Promise<T> {
  if (response.status === 401) {
    
    // Tenter de rafraichir le token
    try {
      // Récupérer le token expiré
      const expiredToken = getAuthToken();
      if (!expiredToken) {
        throw new Error('Session expirée');
      }
      
      // Appel direct à l'API de refresh
      const refreshUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/refresh-token`;
      
      const refreshResponse = await fetch(refreshUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${expiredToken}`,
        },
      });
      
      if (!refreshResponse.ok) {
        throw new Error('Échec du rafraîchissement');
      }
      
      const refreshData = await refreshResponse.json();
      
      const newToken = refreshData.token || refreshData.accessToken;
      
      if (!newToken) {
        throw new Error('Réponse de rafraîchissement invalide');
      }
      
      // Mettre à jour le token dans les cookies
      try {
        if (typeof document !== 'undefined') {
          const expires = new Date();
          expires.setDate(expires.getDate() + 7);
          const cookieString = `chicken-nation-token=${encodeURIComponent(newToken)}; expires=${expires.toUTCString()}; path=/; secure=${process.env.NODE_ENV === 'production'}; samesite=lax`;
          document.cookie = cookieString;
          return await retryFn();
        }
      } catch {
        // Erreur lors de la mise à jour du token
      }
      
      throw new Error('Impossible de mettre à jour le token');
    } catch {
      // Ne pas rediriger immédiatement, laisser le composant gérer l'erreur
      throw new Error(`Erreur d'authentification: ${response.status} ${response.statusText}`);
    }
  }
  
  throw new Error(`API Error: ${response.status} ${response.statusText}`);
}

 
export function withAuth(options: RequestInit = {}): RequestInit {
  const token = getAuthToken();
 
  const isFormData = options.body instanceof FormData;
  
  // Créer un nouvel objet headers pour éviter de modifier l'original
  const headers: Record<string, string> = {};
  
  // Ajouter les headers existants
  if (options.headers) {
    const existingHeaders = options.headers as Record<string, string>;
    Object.keys(existingHeaders).forEach(key => {
      headers[key] = existingHeaders[key];
    });
  }
  
  // Ajouter le header d'autorisation
  headers['Authorization'] = `Bearer ${token}`;
  
  // Ajouter les headers de contenu seulement si ce n'est pas un FormData
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
    headers['Accept'] = 'application/json';
  } else {
    // Pour FormData, ajouter seulement Accept
    headers['Accept'] = 'application/json';
    // Ne PAS ajouter Content-Type pour FormData, le navigateur le fera automatiquement
  }
  
  return {
    ...options,
    headers
  };
}

 
export async function fetchWithAuth<T>(url: string, options: RequestInit = {}): Promise<T> {
  try {
    const authOptions = withAuth(options);
    const response = await fetch(url, authOptions);
    
    if (!response.ok) {
      
      if (response.status === 401) {
        return await handleAuthError(response, () => fetchWithAuth<T>(url, options));
      }
      
      // Pour les autres erreurs, essayer de récupérer le message d'erreur
      let errorMessage = `${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        // Si ce n'est pas du JSON valide, essayer de récupérer le texte
        try {
          const errorText = await response.text();
          if (errorText) {
            errorMessage = errorText;
          }
        } catch {
          // Impossible de lire les détails de l'erreur
        }
      }
      
      throw new Error(`API Error: ${errorMessage}`);
    }
    
    // Gérer les réponses vides
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const text = await response.text();
      return text ? JSON.parse(text) : ({} as T);
    } else {
      // Pour les réponses non-JSON
      return ({} as T);
    }
  } catch (error) {
    throw error;
  }
}

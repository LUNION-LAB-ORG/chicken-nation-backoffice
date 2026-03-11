/**
 * Service d'appel API pour l'intégration HubRise.
 * Communique avec les endpoints backend /hubrise/*
 */

const API_URL = process.env.NEXT_PUBLIC_API_PREFIX;

// Récupérer le token depuis les cookies
function getAuthToken(): string | null {
  if (typeof document === 'undefined') return null;
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'chicken-nation-token') {
      return decodeURIComponent(value);
    }
  }
  return null;
}

// Headers communs
function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  if (!token) throw new Error('Authentification requise');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

// === Types ===

export interface HubriseConnectionStatus {
  connected: boolean;
  locationId: string | null;
  catalogId: string | null;
  customerListId: string | null;
}

export interface ConnectedRestaurant {
  id: string;
  name: string;
  hubrise_location_id: string | null;
  hubrise_catalog_id: string | null;
}

export interface MatchProposal {
  hubriseRef: string;
  hubriseName: string;
  cnId: string | null;
  cnName: string | null;
  confidence: number;
  status: 'already_linked' | 'proposed' | 'no_match';
}

export interface DishMatchProposal extends MatchProposal {
  hubrisePrice: number;
  cnPrice: number | null;
  cnCategory: string | null;
}

export interface AutoMatchPreview {
  success: boolean;
  summary: {
    categories: { total: number; alreadyLinked: number; proposed: number; noMatch: number };
    dishes: { total: number; alreadyLinked: number; proposed: number; noMatch: number };
  };
  categoryMatches: MatchProposal[];
  dishMatches: DishMatchProposal[];
}

export interface MatchConfirmation {
  type: 'category' | 'dish';
  cnId: string;
  hubriseRef: string;
}

export interface SyncResult {
  success: boolean;
  message: string;
  result?: unknown;
}

// === Auth ===

/** Récupère l'URL de connexion OAuth pour un restaurant */
export function getConnectUrl(restaurantId: string): string {
  return `${API_URL}/hubrise/auth/connect/${restaurantId}`;
}

/** Vérifie le statut de connexion HubRise d'un restaurant */
export async function getConnectionStatus(restaurantId: string): Promise<HubriseConnectionStatus> {
  const response = await fetch(`${API_URL}/hubrise/auth/status/${restaurantId}`, {
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error('Erreur lors de la vérification du statut');
  return response.json();
}

/** Déconnecte un restaurant de HubRise */
export async function disconnectRestaurant(restaurantId: string): Promise<SyncResult> {
  const response = await fetch(`${API_URL}/hubrise/auth/disconnect/${restaurantId}`, {
    method: 'POST',
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error('Erreur lors de la déconnexion');
  return response.json();
}

/** Récupère la liste des restaurants connectés */
export async function getConnectedRestaurants(): Promise<{ count: number; restaurants: ConnectedRestaurant[] }> {
  const response = await fetch(`${API_URL}/hubrise/auth/connected`, {
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error('Erreur lors de la récupération');
  return response.json();
}

// === Sync Catalogue ===

/** Importe le catalogue HubRise dans CN */
export async function pullCatalog(restaurantId: string): Promise<SyncResult> {
  const response = await fetch(`${API_URL}/hubrise/sync/catalog/pull/${restaurantId}`, {
    method: 'POST',
    headers: authHeaders(),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Erreur lors de l\'import du catalogue');
  }
  return response.json();
}

/** Envoie le catalogue CN vers HubRise */
export async function pushCatalog(restaurantId: string): Promise<SyncResult> {
  const response = await fetch(`${API_URL}/hubrise/sync/catalog/push/${restaurantId}`, {
    method: 'POST',
    headers: authHeaders(),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Erreur lors de l\'envoi du catalogue');
  }
  return response.json();
}

// === Sync Clients ===

/** Importe les clients HubRise dans CN */
export async function pullCustomers(restaurantId: string): Promise<SyncResult> {
  const response = await fetch(`${API_URL}/hubrise/sync/customers/pull/${restaurantId}`, {
    method: 'POST',
    headers: authHeaders(),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Erreur lors de l\'import des clients');
  }
  return response.json();
}

// === Auto-Matching ===

/** Prévisualise l'auto-matching catalogue */
export async function previewAutoMatch(restaurantId: string): Promise<AutoMatchPreview> {
  const response = await fetch(`${API_URL}/hubrise/sync/catalog/match/${restaurantId}`, {
    headers: authHeaders(),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Erreur lors de la prévisualisation');
  }
  return response.json();
}

/** Applique les correspondances validées */
export async function applyAutoMatch(restaurantId: string, matches: MatchConfirmation[]): Promise<SyncResult> {
  const response = await fetch(`${API_URL}/hubrise/sync/catalog/match/${restaurantId}`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ matches }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Erreur lors de l\'application');
  }
  return response.json();
}

import { getAuthToken } from "@/utils/authUtils";

const API_URL = process.env.NEXT_PUBLIC_API_PREFIX;
const BASE_URL = API_URL + '/settings';

export interface Setting {
  id: string;
  key: string;
  value: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

const getHeaders = () => {
  const token = getAuthToken();
  if (!token) throw new Error('Authentication required');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

export async function getSettings(prefix?: string): Promise<Setting[]> {
  const params = prefix ? `?prefix=${encodeURIComponent(prefix)}` : '';
  const response = await fetch(`${BASE_URL}${params}`, { headers: getHeaders() });
  if (!response.ok) throw new Error('Erreur lors du chargement des paramètres');
  return response.json();
}

export async function getSetting(key: string): Promise<{ key: string; value: string | null }> {
  const response = await fetch(`${BASE_URL}/${encodeURIComponent(key)}`, { headers: getHeaders() });
  if (!response.ok) throw new Error('Erreur lors du chargement du paramètre');
  return response.json();
}

export async function updateSetting(key: string, value: string, description?: string): Promise<Setting> {
  const response = await fetch(`${BASE_URL}/${encodeURIComponent(key)}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ value, description }),
  });
  if (!response.ok) throw new Error('Erreur lors de la mise à jour du paramètre');
  return response.json();
}

export async function deleteSetting(key: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/${encodeURIComponent(key)}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error('Erreur lors de la suppression du paramètre');
}

import { api } from './api';
import { LoginCredentials, LoginResponse } from '@/types/auth';
import { User } from './userService';

 const AUTH_ENDPOINT = '/auth';

export type AuthResponse = LoginResponse;

export interface RefreshTokenResponse {
  accessToken?: string;
  token?: string;
}


export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  try {
    const response = await api.post<AuthResponse>(`${AUTH_ENDPOINT}/login`, credentials, false);

     const normalizedResponse: AuthResponse = {
      ...response,
      accessToken: response.token || response.accessToken,
    };

    if (!normalizedResponse.user && normalizedResponse.id) {
      normalizedResponse.user = {
        id: normalizedResponse.id, // id is guaranteed by the if condition
        email: normalizedResponse.email || '',
        fullname: normalizedResponse.fullname || '',
        role: normalizedResponse.role || '',
        type: normalizedResponse.type,
        restaurant_id: normalizedResponse.restaurant_id || null,
        // Ensure all fields from the User interface are mapped
        phone: (normalizedResponse as unknown as Record<string, unknown>).phone as string,
        address: (normalizedResponse as unknown as Record<string, unknown>).address as string,
        image: (normalizedResponse as unknown as Record<string, unknown>).image as string || null,
        entity_status: (normalizedResponse as unknown as Record<string, unknown>).entity_status as string,
        created_at: (normalizedResponse as unknown as Record<string, unknown>).created_at as string,
        updated_at: (normalizedResponse as unknown as Record<string, unknown>).updated_at as string,
        password_is_updated: (normalizedResponse as unknown as Record<string, unknown>).password_is_updated as boolean,
      } as User; 
    }

    return normalizedResponse;
  } catch (err) { 
    throw (err);
  }
};

export const refreshToken = async (refreshTokenValue: string): Promise<RefreshTokenResponse> => { 

  const url = `${process.env.NEXT_PUBLIC_API_URL}/api/v1${AUTH_ENDPOINT}/refresh-token?type=USER`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${refreshTokenValue}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
     throw new Error(errorData.message || `API request failed with status ${response.status}`); 
    }

    const data = await response.json();
    // Normaliser la réponse
    const normalizedData = {
      accessToken: data.token || data.accessToken,
      ...data
    };

    return normalizedData;
  } catch (error) {
    throw (error);
  }
};

export const logout = async (): Promise<void> => {
  return Promise.resolve();
};

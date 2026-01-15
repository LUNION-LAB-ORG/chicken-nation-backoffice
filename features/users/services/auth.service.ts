import { api } from '../../../src/services/api';
import { LoginCredentials, LoginResponse } from '../types/auth.type';
import { User } from '../types/user.types';

const AUTH_ENDPOINT = '/auth';

export interface RefreshTokenResponse {
  accessToken?: string;
  token?: string;
}


export const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  try {
    const response = await api.post<LoginResponse>(`${AUTH_ENDPOINT}/login`, credentials, false);

    return response;
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

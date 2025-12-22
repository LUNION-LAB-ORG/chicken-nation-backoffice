import { User } from "@/services";

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  user?: User;
  accessToken?: string;
  token?: string;
  refreshToken: string;

 
  id?: string;
  email?: string;
  fullname?: string;
  role?: string;
  type?: string;
  restaurant_id?: string | null;
}

export interface RefreshTokenResponse {
  accessToken?: string;
  token?: string;
}

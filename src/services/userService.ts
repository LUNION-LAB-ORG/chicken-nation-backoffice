import { api } from './api';
import { getHumanReadableError, validatePersonnelError } from '@/utils/errorMessages';

const USERS_ENDPOINT = '/users';

export interface RestaurantDetails {
  id: string;
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  image?: string;
  latitude?: number;
  longitude?: number;
  opening_hours?: string; 
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface User {
  id: string;
  email: string;
  fullname: string;
  phone?: string;
  address?: string;
  image?: string;  
  password_is_updated?: boolean; 
  role: string;
  type?: string;
  restaurant_id?: string; 
  restaurant?: RestaurantDetails; 
  entity_status?: 'NEW' | 'ACTIVE' | 'INACTIVE' | 'DELETED';
  created_at?: string; 
  updated_at?: string; 
}

export interface CreateUserDto {
  email: string;
  fullname: string;
  phone?: string;
  address?: string;
  password: string;
  role: string;
  type?: string;
  restaurant?: string;
}

export interface UpdateUserDto {
  email?: string;
  fullname?: string;
  password?: string;
  role?: string;
  type?: string;
  restaurant?: string;
}

/**
 * Récupère tous les utilisateurs
 */
export const getAllUsers = async (): Promise<User[]> => {
  try {
    return api.get<User[]>(USERS_ENDPOINT, true);
  } catch (error) {
    const userMessage = getHumanReadableError(error);
    throw new Error(userMessage);
  }
};

/**
 * Récupère un utilisateur par son ID
 */
export const getUserById = async (id: string): Promise<User> => {
  try {
    return api.get<User>(`${USERS_ENDPOINT}/${id}`, true);
  } catch (error) {
    const userMessage = getHumanReadableError(error);
    throw new Error(userMessage);
  }
};

/**
 * Crée un nouvel utilisateur
 */
export async function createUser(data: {
  fullname: string;
  email: string;
  phone?: string;
  address?: string;
  image?: File;
  role: string;
  type?: string;
  restaurant_id?: string;
}) {
  const formData = new FormData();
  formData.append('fullname', String(data.fullname));
  formData.append('email', String(data.email));
  if (data.phone) formData.append('phone', data.phone);
  if (data.address) formData.append('address', String(data.address));
  formData.append('role', String(data.role));
  if (data.type) formData.append('type', String(data.type));
  if (data.restaurant_id) {
    formData.append('restaurant_id', String(data.restaurant_id));
    formData.append('restaurantId', String(data.restaurant_id)); 
  }
  if (data.image) formData.append('image', data.image);

  try {
    return api.post<User>(USERS_ENDPOINT, formData, true);
  } catch (error) {
    const userMessage = validatePersonnelError(error, 'create');
    throw new Error(userMessage);
  }
}

/**
 * Crée un nouveau membre (utilisé par les managers) - endpoint spécifique /users/member
 */
export async function createMember(data: {
  fullname: string;
  email: string;
  phone?: string;
  address?: string;
  image?: File;
  role: string;
  type?: string;
  restaurant_id?: string;
}) {
  const formData = new FormData();
  formData.append('fullname', String(data.fullname));
  formData.append('email', String(data.email));
  if (data.phone) formData.append('phone', data.phone);
  if (data.address) formData.append('address', String(data.address));
  formData.append('role', String(data.role));
  if (data.type) formData.append('type', String(data.type));
  if (data.restaurant_id) {
    formData.append('restaurant_id', String(data.restaurant_id));
    formData.append('restaurantId', String(data.restaurant_id));  
  }
  if (data.image) formData.append('image', data.image);

  try {
    return api.post<User>(`${USERS_ENDPOINT}/member`, formData, true);
  } catch (error) {
    const userMessage = validatePersonnelError(error, 'create');
    throw new Error(userMessage);
  }
}

export const updateUser = async (id: string, data: Partial<Omit<User, 'image'>> & { image?: File | string }): Promise<User> => {
  const formData = new FormData();

 
  if (data.fullname !== undefined) formData.append('fullname', data.fullname);
  if (data.email !== undefined) formData.append('email', data.email);
  if (data.phone !== undefined) formData.append('phone', data.phone);
  if (data.address !== undefined) formData.append('address', data.address);
  if (data.role !== undefined) formData.append('role', data.role);
  if (data.type !== undefined) formData.append('type', data.type);
  if (data.restaurant_id !== undefined) formData.append('restaurant_id', data.restaurant_id);
  
  if (data.image) {
    if (typeof data.image === 'string') {
      formData.append('image', data.image); 
    } else {
      formData.append('image', data.image as File); 
    }
  }


  try {
    const result = await api.patch<User>(USERS_ENDPOINT, formData, true);
    return result;
  } catch (error) {
    const userMessage = validatePersonnelError(error, 'update');
    throw new Error(userMessage);
  }
};

export const updateUserJSON = async (id: string, data: Partial<User>): Promise<User> => {
  const cleanData: Partial<User> = {};
  

  if (data.fullname !== undefined) cleanData.fullname = data.fullname;
  if (data.email !== undefined) cleanData.email = data.email;
  if (data.phone !== undefined) cleanData.phone = data.phone;
  if (data.address !== undefined) cleanData.address = data.address;
  if (data.role !== undefined) cleanData.role = data.role;
  if (data.type !== undefined) cleanData.type = data.type;
  if (data.restaurant !== undefined) cleanData.restaurant = data.restaurant;

  try {
    return api.patch<User>(USERS_ENDPOINT, cleanData, true);
  } catch (error) {
    const userMessage = validatePersonnelError(error, 'update');
    throw new Error(userMessage);
  }
};

export const updateUserWithImage = async (id: string, formData: FormData): Promise<User> => {
  
  if (formData.has('id')) {
    formData.delete('id');
  }
  
  try {
    return api.patch<User>(USERS_ENDPOINT, formData, true);
  } catch (error) {
    const userMessage = validatePersonnelError(error, 'update');
    throw new Error(userMessage);
  }
};

/**
 * Met à jour le mot de passe de l'utilisateur via l'endpoint spécialisé
 */
export const updateUserPassword = async (passwordData: {
  password: string;
  confirmPassword: string;
}): Promise<User> => {
  const data = {
    password: passwordData.password,
    confirmPassword: passwordData.confirmPassword,
  };

  try {
    return api.patch<User>(`${USERS_ENDPOINT}/password`, data, true);
  } catch (error) {
    const userMessage = validatePersonnelError(error, 'update');
    throw new Error(userMessage);
  }
};

/**
 * Supprime un utilisateur définitivement (delete réel)
 */
export const deleteUser = async (id: string): Promise<void> => {
  try {
    return api.delete<void>(`${USERS_ENDPOINT}/delete/${id}`, true);
  } catch (error) {
    const userMessage = validatePersonnelError(error, 'delete');
    throw new Error(userMessage);
  }
};

/**
 * Supprime un utilisateur en soft delete (change le status à DELETED)
 */
export const softDeleteUser = async (id: string): Promise<void> => {
  try {
    return api.post<void>(`${USERS_ENDPOINT}/soft-delete`, { id }, true);
  } catch (error) {
    const userMessage = validatePersonnelError(error, 'delete');
    throw new Error(userMessage);
  }
};

/**
 * Bloque un utilisateur (change le status à INACTIVE)
 */
export const blockUser = async (id: string): Promise<void> => {
  try {
    return api.post<void>(`${USERS_ENDPOINT}/inactive/${id}`, {}, true);
  } catch (error) {
    const userMessage = validatePersonnelError(error, 'block');
    throw new Error(userMessage);
  }
};

/**
 * Restaure un utilisateur (change le status à ACTIVE)
 */
export const restoreUser = async (id: string): Promise<void> => {
  try {
    // L'ID de l'utilisateur est maintenant inclus dans le chemin de l'URL
    // et un corps de requête vide est envoyé, conformément à l'endpoint /api/v1/users/restore/{id}
    return api.post<void>(`${USERS_ENDPOINT}/restore/${id}`, {}, true);
  } catch (error) {
    const userMessage = validatePersonnelError(error, 'restore');
    throw new Error(userMessage);
  }
};

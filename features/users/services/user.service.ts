import { api } from '../../../src/services/api';
import { getHumanReadableError, validatePersonnelError } from '@/utils/errorMessages';
import { CreateUserDto, User } from '../types/user.types';

const USERS_ENDPOINT = '/users';

type ContextePersonnel = 'create' | 'update' | 'delete' | 'block' | 'restore';

/**
 * Messages de validation automatiques du serveur (class-validator), en anglais
 * (« phone must be a string ») : jamais montrés tels quels.
 */
const MESSAGE_TECHNIQUE = /\b(must|should|property)\b|\(\d{3}\)/i;

/**
 * Message montré après l'échec d'une action sur le personnel. Le serveur
 * explique précisément ses refus (« Vous ne pouvez gérer que le personnel de
 * votre restaurant. », adresse déjà prise, suspension de son propre compte) :
 * pour les statuts 400, 403 et 409, déjà nettoyés par `apiRequest`, on garde
 * son texte, sauf un message de validation automatique. Sinon, le message
 * générique du contexte.
 */
function messageEchecPersonnel(error: unknown, contexte: ContextePersonnel): string {
  const status = (error as { status?: number } | null)?.status;
  if (
    error instanceof Error &&
    error.message &&
    (status === 400 || status === 403 || status === 409) &&
    !MESSAGE_TECHNIQUE.test(error.message)
  ) {
    return error.message;
  }
  // Le bouton s'appelle « Suspendre » : on garde ce mot dans le message.
  return validatePersonnelError(error, contexte).replace('bloquer', 'suspendre');
}

/**
 * Récupère tous les utilisateurs
 */
export const getAllUsers = async (
  params?: { type?: 'BACKOFFICE' | 'RESTAURANT'; restaurantId?: string }
): Promise<User[]> => {
  try {
    const qs = new URLSearchParams();
    if (params?.type) qs.append('type', params.type);
    if (params?.restaurantId) qs.append('restaurantId', params.restaurantId);
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return api.get<User[]>(`${USERS_ENDPOINT}${suffix}`, true);
  } catch (error) {
    const userMessage = getHumanReadableError(error);
    throw new Error(userMessage);
  }
};

/**
 * Définit un manager comme « principal » de son restaurant (Restaurant.manager).
 */
export const setPrincipalManager = async (userId: string): Promise<void> => {
  try {
    return await api.patch(`${USERS_ENDPOINT}/${userId}/set-principal-manager`, {}, true);
  } catch (error) {
    throw new Error(messageEchecPersonnel(error, 'update'));
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
    return await api.post<User>(USERS_ENDPOINT, formData, true);
  } catch (error) {
    throw new Error(messageEchecPersonnel(error, 'create'));
  }
}

/**
 * Crée un nouveau membre (utilisé par les managers) - endpoint spécifique /users/member
 */
export async function createMember(data: CreateUserDto) {
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
    return await api.post<User>(`${USERS_ENDPOINT}/member`, formData, true);
  } catch (error) {
    throw new Error(messageEchecPersonnel(error, 'create'));
  }
}

export const updateUser = async (id: string, data: Partial<Omit<CreateUserDto, 'image'>> & { image?: File | string }): Promise<User> => {
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

/**
 * Met à jour un membre CIBLÉ par son id (admin éditant n'importe quel membre,
 * ou un utilisateur sur son propre profil) — PATCH /users/:id.
 * (À ne pas confondre avec `updateUser` qui patch le compte connecté.)
 */
export const updateMember = async (
  id: string,
  data: Partial<Omit<CreateUserDto, 'image'>> & { image?: File | string }
): Promise<User> => {
  const formData = new FormData();
  if (data.fullname !== undefined) formData.append('fullname', data.fullname);
  if (data.email !== undefined) formData.append('email', data.email);
  if (data.phone !== undefined) formData.append('phone', data.phone);
  if (data.address !== undefined) formData.append('address', data.address);
  if (data.role !== undefined) formData.append('role', data.role);
  if (data.restaurant_id !== undefined) formData.append('restaurant_id', data.restaurant_id ?? '');
  if (data.email_notifications_enabled !== undefined) formData.append('email_notifications_enabled', String(data.email_notifications_enabled));
  if (data.in_app_notifications_enabled !== undefined) formData.append('in_app_notifications_enabled', String(data.in_app_notifications_enabled));
  if (data.image) {
    formData.append('image', typeof data.image === 'string' ? data.image : (data.image as File));
  }
  try {
    return await api.patch<User>(`${USERS_ENDPOINT}/${id}`, formData, true);
  } catch (error) {
    throw new Error(messageEchecPersonnel(error, 'update'));
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
    // `await` : sans lui, le catch ne s'exécutait jamais. La règle du serveur
    // (8 caractères, une majuscule, un chiffre, un caractère spécial) s'affiche.
    return await api.patch<User>(`${USERS_ENDPOINT}/password`, data, true);
  } catch (error) {
    throw new Error(messageEchecPersonnel(error, 'update'));
  }
};

/**
 * Supprime un utilisateur définitivement (delete réel). Réservé à l'ADMIN.
 */
export const deleteUser = async (id: string): Promise<void> => {
  try {
    return await api.delete<void>(`${USERS_ENDPOINT}/delete/${id}`, true);
  } catch (error) {
    throw new Error(messageEchecPersonnel(error, 'delete'));
  }
};

/**
 * Suspend un utilisateur (statut INACTIVE) : POST /users/inactive/:id.
 * C'est la route du bouton « Suspendre ». L'ancienne `softDeleteUser` visait
 * POST /users/soft-delete, qui n'a jamais existé : la suspension échouait
 * toujours.
 */
export const blockUser = async (id: string): Promise<void> => {
  try {
    return await api.post<void>(`${USERS_ENDPOINT}/inactive/${id}`, {}, true);
  } catch (error) {
    throw new Error(messageEchecPersonnel(error, 'block'));
  }
};

/**
 * Restaure un utilisateur (change le status à ACTIVE)
 */
export const restoreUser = async (id: string): Promise<void> => {
  try {
    // L'ID de l'utilisateur est maintenant inclus dans le chemin de l'URL
    // et un corps de requête vide est envoyé, conformément à l'endpoint /api/v1/users/restore/{id}
    return await api.post<void>(`${USERS_ENDPOINT}/restore/${id}`, {}, true);
  } catch (error) {
    throw new Error(messageEchecPersonnel(error, 'restore'));
  }
};

/**
 * Réinitialise le mot de passe d'un utilisateur
 */
export const resetUserPassword = async (userId: string): Promise<{ email: string; password: string }> => {
  try {
    return await api.patch(`${USERS_ENDPOINT}/${userId}/reset-password`, {}, true);
  } catch (error) {
    throw new Error(messageEchecPersonnel(error, 'update'));
  }
};

import { EntityStatus } from "../../../types";
import { UserRole, UserType } from "./user.types";

export enum Modules {
  DASHBOARD = 'dashboard',
  COMMANDES = 'orders',
  MENUS = 'menus',
  MARKETING = 'marketing',
  CLIENTS = 'clients',
  INVENTAIRE = 'inventory',
  RESTAURANTS = 'restaurants',
  PERSONNELS = 'personnel',
  PROMOTIONS = 'promos',
  FIDELITE = 'loyalty',
  MESSAGES = 'inbox',
  CARD_NATION = 'card_nation',
  COMMENTAIRES = 'reviews',
  ALL = 'all',
}

export enum Action {
  READ = 'read',
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  IMPORT = 'import',
  REPORT = 'report',
  EXPORT = 'export',
  PRINT = 'print',
}

export interface RolePermissions {
  modules: Partial<Record<Modules, string[]>>;
  exclusions?: Modules[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  id: string,
  fullname: string,
  email: string,
  phone: string,
  image: string,
  address: string,
  password_is_updated: boolean,
  type: UserType,
  role: UserRole,
  restaurant_id: string,
  entity_status: EntityStatus,
  created_at: string,
  updated_at: string,
  last_login_at: string,
  token: string;
  refreshToken: string;
  permissions: RolePermissions
}

export interface RefreshTokenResponse {
  accessToken?: string;
  token?: string;
}

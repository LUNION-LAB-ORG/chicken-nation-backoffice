import { UserRole, UserType } from "../../users/types/user.types";

export enum CallStatus {
  RINGING = "RINGING",
  ONGOING = "ONGOING",
  ENDED = "ENDED",
  MISSED = "MISSED",
  CANCELLED = "CANCELLED",
  FAILED = "FAILED",
}

/**
 * `DELIVERER` : un livreur précis (appel du service client vers un livreur, 24/10).
 * `CUSTOMER` : un client dans l'appli Chicken Nation (26/11).
 */
export type CallTargetKind = "RESTAURANT" | "CALL_CENTER" | "USER" | "DELIVERER" | "CUSTOMER";

/** Type de l'appelant : un membre du personnel, un livreur ou un client depuis son appli. */
export type CallerType = UserType | "DELIVERER" | "CUSTOMER";

/** Payload d'ouverture d'appel. */
export interface IStartCallPayload {
  targetKind?: CallTargetKind;
  restaurantId?: string;
  targetUserId?: string;
  /** Requis avec `targetKind: "DELIVERER"` : le livreur dont l'appli sonne. */
  deliverer_id?: string;
  /** Requis avec `targetKind: "CUSTOMER"` : le client dont l'appli sonne. */
  customer_id?: string;
  /** Avec `targetKind: "CUSTOMER"` : la commande dont on veut parler. */
  order_id?: string;
}

/** Fonction de déclenchement d'appel partagée par les pickers. */
export type CallInvoker = (
  args: IStartCallPayload & { targetLabel: string },
) => void | Promise<void>;

/** Accès à la room renvoyé par le backend (token participant à TTL court). */
export interface ICallAccess {
  room: string;
  token: string;
  url: string;
  identity: string;
}

/** Livreur tel que l'historique le renvoie (appelant ou cible d'un appel). */
export interface ICallDeliverer {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  restaurant?: { id: string; name: string } | null;
}

/** Client tel que l'historique le renvoie (appelant ou cible d'un appel). */
export interface ICallCustomer {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
}

export interface ICall {
  id: string;
  room_slug: string;
  room_name?: string | null;
  status: CallStatus;
  /** Null quand c'est un livreur (`caller_deliverer_id`) ou un client (`caller_customer_id`) qui appelle. */
  caller_id: string | null;
  caller_type: CallerType;
  caller_deliverer_id?: string | null;
  target_deliverer_id?: string | null;
  caller_customer_id?: string | null;
  target_customer_id?: string | null;
  target_kind: CallTargetKind;
  target_restaurant_id?: string | null;
  target_user_id?: string | null;
  answered_by_id?: string | null;
  started_at: string;
  answered_at?: string | null;
  ended_at?: string | null;
  // relations (include historique)
  caller?: {
    id: string;
    fullname: string;
    image?: string | null;
    type: UserType;
    restaurant?: { id: string; name: string } | null;
  };
  answered_by?: { id: string; fullname: string } | null;
  target_restaurant?: { id: string; name: string } | null;
  target_user?: { id: string; fullname: string } | null;
  caller_deliverer?: ICallDeliverer | null;
  target_deliverer?: ICallDeliverer | null;
  /** Course dont parle l'appel avec un livreur (historique). */
  course?: { id: string; reference: string | null } | null;
  course_id?: string | null;
  order_id?: string | null;
  caller_customer?: ICallCustomer | null;
  target_customer?: ICallCustomer | null;
  /** Commande dont parle l'appel avec un client (historique). */
  order?: { id: string; reference: string | null } | null;
}

export interface IStartCallResponse {
  call: ICall;
  access: ICallAccess;
  ringing: number;
  online: number;
  targetLabel: string;
  /** Appel vers un livreur : lui, son restaurant et sa course en cours. */
  livreur?: IAppelantLivreur | null;
  /** Appel vers un client dans l'appli : lui et la commande. */
  client?: IAppelantClient | null;
}

export interface IAnswerCallResponse {
  taken: boolean;
  call?: { id: string; room_slug: string };
  access?: ICallAccess;
}

/** Appel actif restauré après un rechargement de page (GET /calls/active). */
export interface IActiveCallRestore {
  callId: string;
  direction: "outgoing" | "incoming";
  phase: "calling" | "connected";
  peerLabel: string;
  access: ICallAccess;
  /** Appel avec un livreur (il appelle, ou on l'appelle). */
  livreur?: IAppelantLivreur | null;
  /** Appel avec un client (il appelle, ou on l'appelle). */
  client?: IAppelantClient | null;
}

/** Statut léger renvoyé par GET /calls/:id (polling de convergence). */
export interface ICallStatus {
  id: string;
  status: CallStatus;
  answered_by?: { id: string; fullname: string } | null;
  started_at: string;
  answered_at?: string | null;
  ended_at?: string | null;
}

export interface ICallerRoleConfig {
  canCall: boolean;
  targetKind: CallTargetKind;
  receiverType: UserType;
  receiverRoles: UserRole[];
}

export type ICallsConfig = Record<UserType, ICallerRoleConfig>;

// ─── Payloads Socket.io ───
export interface IIncomingCallEvent {
  callId: string;
  room: string;
  callerId: string;
  callerName: string;
  callerType: CallerType;
  targetKind: CallTargetKind;
  targetLabel: string;
  startedAt: string;
  /**
   * Appel venant d'un livreur (`callerType: "DELIVERER"`) : de quoi le
   * reconnaître sans chercher. Absent pour un appel du personnel.
   */
  livreur?: IAppelantLivreur | null;
  /** Appel venant d'un client (`callerType: "CUSTOMER"`) : lui et sa commande. */
  client?: IAppelantClient | null;
}

/**
 * Client d'un appel, tel que le serveur le renvoie (commit 3cea51a) : sur
 * `call:incoming`, sur chaque entrée de `GET /calls/ringing`, sur
 * `GET /calls/active` et dans la réponse de `POST /calls` vers un client.
 */
export interface IAppelantClient {
  id: string;
  /** « Awa Koné » ; à défaut son téléphone ; à défaut « Client ». */
  nom: string;
  /** Numéro complet (+225…). */
  telephone: string | null;
  /** Commande dont il est question, null sans commande. */
  commande_id: string | null;
  commande_reference: string | null;
}

/**
 * Livreur d'un appel, tel que le serveur le renvoie (commit e00a1bd) : sur
 * `call:incoming`, sur chaque entrée de `GET /calls/ringing`, sur
 * `GET /calls/active` et dans la réponse de `POST /calls` vers un livreur.
 */
export interface IAppelantLivreur {
  id: string;
  /** « Koffi Kouassi » ; à défaut son téléphone ; à défaut « Livreur ». */
  nom: string;
  /** Numéro complet (+225…). */
  telephone: string | null;
  /** Nom du restaurant du livreur. */
  restaurant: string | null;
  /** Référence de la course (« CRS-A1 »), null sans course. */
  course_reference: string | null;
}

export interface ICallAcceptedEvent {
  callId: string;
  answeredById: string;
  answeredByName: string;
}
export interface ICallTakenEvent { callId: string; takenBy: string }
/** `rejected` : le livreur a refusé ; `no-answer` : personne n'a décroché. */
export type RaisonFinAppel = "hangup" | "no-answer" | "cancelled" | "rejected";
export interface ICallEndedEvent { callId: string; reason?: RaisonFinAppel | string }
export interface ICallCancelledEvent { callId: string }
export interface ICallRejectedEvent { callId: string; rejectedBy: string }

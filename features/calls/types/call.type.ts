import { UserRole, UserType } from "../../users/types/user.types";

export enum CallStatus {
  RINGING = "RINGING",
  ONGOING = "ONGOING",
  ENDED = "ENDED",
  MISSED = "MISSED",
  CANCELLED = "CANCELLED",
  FAILED = "FAILED",
}

export type CallTargetKind = "RESTAURANT" | "CALL_CENTER" | "USER";

/** Payload d'ouverture d'appel. */
export interface IStartCallPayload {
  targetKind?: CallTargetKind;
  restaurantId?: string;
  targetUserId?: string;
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

export interface ICall {
  id: string;
  room_slug: string;
  room_name?: string | null;
  status: CallStatus;
  caller_id: string;
  caller_type: UserType;
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
}

export interface IStartCallResponse {
  call: ICall;
  access: ICallAccess;
  ringing: number;
  online: number;
  targetLabel: string;
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
  callerType: UserType;
  targetKind: CallTargetKind;
  targetLabel: string;
  startedAt: string;
}
export interface ICallAcceptedEvent {
  callId: string;
  answeredById: string;
  answeredByName: string;
}
export interface ICallTakenEvent { callId: string; takenBy: string }
export interface ICallEndedEvent { callId: string; reason?: string }
export interface ICallCancelledEvent { callId: string }
export interface ICallRejectedEvent { callId: string; rejectedBy: string }

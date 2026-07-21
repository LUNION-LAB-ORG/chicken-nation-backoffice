import { create } from "zustand";
import type { ICallAccess, IIncomingCallEvent } from "../types/call.type";

export type ActiveCallDirection = "outgoing" | "incoming";
export type ActiveCallPhase = "calling" | "connected";

export interface ActiveCall {
  callId: string;
  access: ICallAccess;
  direction: ActiveCallDirection;
  phase: ActiveCallPhase;
  peerLabel: string; // qui on appelle (sortant) / qui appelle (entrant)
  myName: string;
}

interface CallState {
  incoming: IIncomingCallEvent | null;
  active: ActiveCall | null;
  /**
   * `call:accepted` arrivé AVANT que la réponse HTTP de POST /calls ne revienne
   * (le receveur a décroché ultra-vite) : on le met de côté, useOutgoingCall le
   * consomme juste après setActive — sinon l'appelant resterait sur « Appel en
   * cours… » avec la tonalité, alors que l'appel est établi.
   */
  earlyAccepted: { callId: string; byName: string } | null;
  setIncoming: (c: IIncomingCallEvent | null) => void;
  setActive: (c: ActiveCall | null) => void;
  patchActive: (p: Partial<ActiveCall>) => void;
  setEarlyAccepted: (e: { callId: string; byName: string } | null) => void;
  clearIncomingIf: (callId: string) => void;
  endIfMatches: (callId: string) => void;
}

export const useCallStore = create<CallState>((set) => ({
  incoming: null,
  active: null,
  earlyAccepted: null,
  setIncoming: (c) => set({ incoming: c }),
  setActive: (c) => set({ active: c }),
  patchActive: (p) => set((s) => (s.active ? { active: { ...s.active, ...p } } : s)),
  setEarlyAccepted: (e) => set({ earlyAccepted: e }),
  clearIncomingIf: (callId) =>
    set((s) => (s.incoming?.callId === callId ? { incoming: null } : s)),
  endIfMatches: (callId) => set((s) => (s.active?.callId === callId ? { active: null } : s)),
}));

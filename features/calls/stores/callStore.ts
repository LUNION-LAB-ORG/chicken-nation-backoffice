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
  setIncoming: (c: IIncomingCallEvent | null) => void;
  setActive: (c: ActiveCall | null) => void;
  patchActive: (p: Partial<ActiveCall>) => void;
  clearIncomingIf: (callId: string) => void;
  endIfMatches: (callId: string) => void;
}

export const useCallStore = create<CallState>((set) => ({
  incoming: null,
  active: null,
  setIncoming: (c) => set({ incoming: c }),
  setActive: (c) => set({ active: c }),
  patchActive: (p) => set((s) => (s.active ? { active: { ...s.active, ...p } } : s)),
  clearIncomingIf: (callId) =>
    set((s) => (s.incoming?.callId === callId ? { incoming: null } : s)),
  endIfMatches: (callId) => set((s) => (s.active?.callId === callId ? { active: null } : s)),
}));

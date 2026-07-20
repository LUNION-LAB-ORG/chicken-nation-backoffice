"use client";

import dynamic from "next/dynamic";
import { useCallSocket } from "../hooks/useCallSocket";
import { useCallStore } from "../stores/callStore";
import IncomingCallModal from "./IncomingCallModal";

// Chargé côté navigateur uniquement (WebRTC / getUserMedia dans @lunionlab/meet-react).
const CallPanel = dynamic(() => import("./CallPanel"), { ssr: false });

/**
 * Superposition globale des appels : écoute le socket, affiche la sonnerie
 * entrante et le panneau d'appel actif. Monté une fois dans le layout /gestion.
 */
export default function CallOverlay() {
  useCallSocket();
  const incoming = useCallStore((s) => s.incoming);
  const active = useCallStore((s) => s.active);

  return (
    <>
      {incoming && !active && <IncomingCallModal incoming={incoming} />}
      {active && <CallPanel key={active.callId} call={active} />}
    </>
  );
}

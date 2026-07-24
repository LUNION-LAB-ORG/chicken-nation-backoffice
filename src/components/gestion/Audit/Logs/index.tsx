"use client";

import React from "react";
import AuditView from "../AuditView";

/**
 * Audits → Logs : l'angle TECHNIQUE. Toutes les entrées capturées, méthode,
 * statut HTTP, durée — et un filtre « Erreurs » pour isoler les échecs (>=400).
 */
export default function AuditLogsModule() {
  return (
    <AuditView
      view="logs"
      title="Logs"
      subtitle="Journal technique : méthode, statut HTTP, durée. Filtrez sur les erreurs pour diagnostiquer."
    />
  );
}

"use client";

import React from "react";
import AuditView from "../AuditView";

/**
 * Audits → Actions : l'audit MÉTIER. Qui a créé / modifié / supprimé quoi, et
 * les connexions — les mutations réussies du personnel, sans le bruit technique.
 */
export default function AuditActionsModule() {
  return (
    <AuditView
      view="actions"
      title="Actions"
      subtitle="Qui a fait quoi : créations, modifications, suppressions et connexions du personnel."
    />
  );
}

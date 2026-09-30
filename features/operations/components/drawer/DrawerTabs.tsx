"use client";

import React from "react";

export type DrawerTabKey = "details" | "historique" | "payment";

interface Props {
  value: DrawerTabKey;
  onChange: (v: DrawerTabKey) => void;
  /** Affiche le tab « Paiement ». L'admin l'a quel que soit le statut. */
  showPayment: boolean;
  /**
   * Un encaissement est réellement attendu : seul cas qui allume la pastille.
   * Distinct de `showPayment` — une alerte qui s'allume partout ne se lit plus.
   */
  alertePaiement?: boolean;
}

const TABS: { key: DrawerTabKey; label: string }[] = [
  { key: "details", label: "Détails" },
  { key: "historique", label: "Historique" },
  { key: "payment", label: "Paiement" },
];

/** Tabs segmentées pour naviguer dans le drawer Opérations. */
export function DrawerTabs({ value, onChange, showPayment, alertePaiement = false }: Props) {
  const visible = TABS.filter((t) => t.key !== "payment" || showPayment);
  return (
    <div className="flex items-center gap-1 px-4 pt-2 bg-white border-b border-gray-100">
      {visible.map((t) => {
        const active = t.key === value;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={`relative py-2.5 px-4 text-sm font-medium transition-colors ${
              active ? "text-[#F17922]" : "text-gray-500 hover:text-gray-900"
            }`}
          >
            {t.label}
            {t.key === "payment" && alertePaiement && (
              <span className="absolute -top-0.5 -right-1 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-60 animate-ping" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
            )}
            {active && (
              <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#F17922] rounded-t" />
            )}
          </button>
        );
      })}
    </div>
  );
}

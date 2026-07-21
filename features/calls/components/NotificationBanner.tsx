"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, X } from "lucide-react";
import {
  notificationPermission,
  requestNotificationPermission,
} from "../utils/notifications";

/**
 * Bannière d'activation des notifications système (alerte hors-onglet).
 * Visible seulement si la permission n'est pas encore accordée.
 */
export default function NotificationBanner() {
  const [perm, setPerm] = useState<ReturnType<typeof notificationPermission>>("unsupported");
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setPerm(notificationPermission());
  }, []);

  if (dismissed || perm === "granted" || perm === "unsupported") return null;

  if (perm === "denied") {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <BellOff className="h-4 w-4 shrink-0" />
        <span className="flex-1">
          Notifications bloquées par le navigateur — vous ne serez pas alerté des appels sur un
          autre onglet. Autorisez-les dans les réglages du site (icône 🔒 dans la barre d&apos;adresse).
        </span>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Fermer"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-amber-100"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[#F17922]/20 bg-[#F17922]/5 px-4 py-3 text-sm text-slate-700 sm:flex-row sm:items-center">
      <Bell className="hidden h-4 w-4 shrink-0 text-[#F17922] sm:block" />
      <span className="flex-1">
        Activez les notifications pour être alerté d&apos;un appel même quand vous êtes sur un
        autre onglet.
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            void requestNotificationPermission().then((ok) =>
              setPerm(ok ? "granted" : notificationPermission()),
            );
          }}
          className="rounded-full bg-[#F17922] px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-[#e06a15]"
        >
          Activer
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Fermer"
          className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

"use client";

import React from "react";

/**
 * Primitives du poste de support.
 *
 * Parti pris : l'orange de la marque ne décore rien. Il signale uniquement ce
 * qui réclame l'agent (non lu, sélection, action principale). Tout le reste
 * vit dans une gamme de gris chauds, pour que l'œil trouve l'urgent sans
 * chercher. Pas de boîte dans une boîte : la hiérarchie vient du texte et de
 * l'espace, les traits ne servent qu'à séparer deux zones qui défilent.
 */

export const ORANGE = "#F17922";

/* ── Avatar : initiales sur fond neutre, photo si elle existe ─────────────── */

export function Avatar({
  name,
  src,
  size = 36,
  ring,
}: {
  name?: string | null;
  src?: string | null;
  size?: number;
  /** Anneau discret pour marquer l'agent en charge. */
  ring?: boolean;
}) {
  const initiales = (name ?? "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((m) => m[0]?.toUpperCase())
    .join("");

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-stone-200 text-stone-600 font-semibold select-none ${
        ring ? "outline outline-2 outline-offset-2 outline-[#F17922]/30" : ""
      }`}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {src ? (
        // Image simple : les avatars viennent de sources variées (S3, Google),
        // next/image imposerait une liste blanche de domaines pour rien.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        initiales || "?"
      )}
    </span>
  );
}

/* ── Puce d'état : lisible, jamais criarde ────────────────────────────────── */

type Ton = "neutre" | "attente" | "resolu" | "urgent";

const TONS: Record<Ton, string> = {
  neutre: "bg-stone-100 text-stone-600",
  attente: "bg-amber-50 text-amber-700",
  resolu: "bg-emerald-50 text-emerald-700",
  urgent: "bg-[#F17922]/10 text-[#B45309]",
};

export function Puce({
  children,
  ton = "neutre",
}: {
  children: React.ReactNode;
  ton?: Ton;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium leading-none ${TONS[ton]}`}
    >
      {children}
    </span>
  );
}

/* ── Horodatage court : ce qu'un agent lit d'un coup d'œil ────────────────── */

export function heureCourte(iso: string): string {
  const d = new Date(iso);
  const maintenant = new Date();
  const memeJour = d.toDateString() === maintenant.toDateString();
  if (memeJour) {
    return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  }
  const hier = new Date(maintenant);
  hier.setDate(hier.getDate() - 1);
  if (d.toDateString() === hier.toDateString()) return "Hier";
  const memeAnnee = d.getFullYear() === maintenant.getFullYear();
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: memeAnnee ? "short" : "2-digit",
    ...(memeAnnee ? {} : { year: "2-digit" }),
  });
}

/** Libellé de séparateur dans un fil : Aujourd'hui, Hier, ou la date. */
export function jourLisible(iso: string): string {
  const d = new Date(iso);
  const maintenant = new Date();
  if (d.toDateString() === maintenant.toDateString()) return "Aujourd'hui";
  const hier = new Date(maintenant);
  hier.setDate(hier.getDate() - 1);
  if (d.toDateString() === hier.toDateString()) return "Hier";
  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

/* ── États de chargement : des silhouettes, pas des roues qui tournent ────── */

export function LigneFantome() {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-stone-100" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-3 w-1/3 animate-pulse rounded bg-stone-100" />
        <div className="h-3 w-3/4 animate-pulse rounded bg-stone-100" />
      </div>
    </div>
  );
}

/* ── Écran vide : une phrase, jamais un paragraphe ───────────────────────── */

export function Vide({
  icone,
  titre,
  aide,
}: {
  icone: React.ReactNode;
  titre: string;
  aide?: string;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <div className="mb-3 text-stone-300">{icone}</div>
      <p className="text-sm font-medium text-stone-600">{titre}</p>
      {aide && <p className="mt-1 text-xs text-stone-400">{aide}</p>}
    </div>
  );
}

import React from "react";
import { Loader2, LucideIcon, SearchX } from "lucide-react";

export function Chargement({ texte = "Chargement…" }: { texte?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-500">
      <Loader2 className="w-4 h-4 animate-spin text-[#F17922]" />
      {texte}
    </div>
  );
}

export function Vide({
  titre,
  texte,
  Icone = SearchX,
  action,
}: {
  titre: string;
  texte?: string;
  Icone?: LucideIcon;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center text-center py-12 px-6">
      <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center mb-3">
        <Icone className="w-5 h-5 text-[#F17922]" />
      </div>
      <p className="text-sm font-semibold text-gray-800">{titre}</p>
      {texte && <p className="text-sm text-gray-500 mt-1 max-w-md">{texte}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Erreur({ message }: { message?: string }) {
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
      {message || "Impossible de charger ces données. Réessayez dans un instant."}
    </div>
  );
}

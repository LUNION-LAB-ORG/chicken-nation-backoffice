"use client";

import React, { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";

/**
 * Repli quand le presse-papiers moderne est refusé.
 *
 * `navigator.clipboard` n'existe qu'en contexte sécurisé et la politique de
 * permissions du navigateur peut le bloquer. `execCommand` est obsolète mais
 * reste accepté partout : un bouton copier qui échoue en silence est pire que
 * pas de bouton du tout, l'agent croit avoir le numéro et colle du vide.
 */
function copierParRepli(texte: string): boolean {
  try {
    const zone = document.createElement("textarea");
    zone.value = texte;
    zone.setAttribute("readonly", "");
    // Hors écran, pas masqué : un champ en `display:none` ne peut pas être
    // sélectionné, et la copie échouerait sans rien dire.
    zone.style.position = "fixed";
    zone.style.top = "-1000px";
    document.body.appendChild(zone);
    zone.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(zone);
    return ok;
  } catch {
    return false;
  }
}

/** Copier une valeur en un geste, avec un accusé de réception visible. */
export function BoutonCopier({
  valeur,
  titre = "Copier",
  className = "",
}: {
  valeur: string;
  titre?: string;
  className?: string;
}) {
  const [copie, setCopie] = useState(false);
  const minuteur = useRef<ReturnType<typeof setTimeout> | null>(null);

  // La fiche peut se fermer avant la fin du délai : sans ce nettoyage, chaque
  // copie suivie d'une fermeture rapide laisse un minuteur derrière elle.
  useEffect(
    () => () => {
      if (minuteur.current) clearTimeout(minuteur.current);
    },
    [],
  );

  const copier = async () => {
    const texte = valeur.trim();
    if (!texte) return;

    let ok = false;
    try {
      await navigator.clipboard.writeText(texte);
      ok = true;
    } catch {
      ok = copierParRepli(texte);
    }
    if (!ok) return;

    setCopie(true);
    if (minuteur.current) clearTimeout(minuteur.current);
    minuteur.current = setTimeout(() => setCopie(false), 1500);
  };

  return (
    <button
      type="button"
      onClick={copier}
      title={copie ? "Copié" : titre}
      aria-label={copie ? "Copié" : titre}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-sm font-semibold transition-colors cursor-pointer ${
        copie
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-800"
      } ${className}`}
    >
      {copie ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      {copie && <span>Copié</span>}
    </button>
  );
}

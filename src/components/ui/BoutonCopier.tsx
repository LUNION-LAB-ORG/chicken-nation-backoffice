"use client";

import React, { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { copierDansLePressePapiers } from "@/utils/deeplinks";

interface BoutonCopierProps {
  valeur: string;
  titre?: string;
  className?: string;
}

/**
 * Copier une valeur courte en un geste : un numéro, un code, une référence.
 *
 * Icône seule, pour se poser à côté de la donnée sans la noyer. Pour un lien
 * de partage, préférer `BoutonCopierLien`, qui porte son libellé et annonce
 * la copie par une notification.
 *
 * Le presse-papiers passe par `copierDansLePressePapiers`, la primitive
 * partagée : elle sait se replier quand `navigator.clipboard` est refusé,
 * hors contexte sécurisé ou bloqué par la politique de permissions. Une copie
 * qui échoue en silence est pire que pas de bouton du tout — on croit avoir
 * le numéro et on colle du vide.
 */
export function BoutonCopier({ valeur, titre = "Copier", className = "" }: BoutonCopierProps) {
  const [copie, setCopie] = useState(false);
  const minuteur = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Le panneau peut se fermer avant la fin du délai : sans ce nettoyage,
  // chaque copie suivie d'une fermeture rapide laisse un minuteur derrière.
  useEffect(
    () => () => {
      if (minuteur.current) clearTimeout(minuteur.current);
    },
    [],
  );

  const copier = async () => {
    const texte = valeur.trim();
    if (!texte) return;
    if (!(await copierDansLePressePapiers(texte))) return;

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

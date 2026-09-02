"use client";

import { useState } from "react";
import { Check, Link2 } from "lucide-react";
import toast from "react-hot-toast";
import { copierDansLePressePapiers } from "@/utils/deeplinks";

/**
 * Copie d'un lien de partage, avec retour visuel.
 *
 * Mutualisé pour que tous les liens de l'application se comportent pareil :
 * même message, même pastille verte, même repli quand la copie échoue. Sans
 * cela, chaque écran réinventerait sa version et l'une d'elles finirait muette.
 */
export function useCopieLien() {
  const [copie, setCopie] = useState(false);

  const copier = async (lien: string, quoi = "Lien") => {
    const ok = await copierDansLePressePapiers(lien);
    if (!ok) {
      // On montre le lien : une copie manuelle vaut mieux qu'un échec muet.
      toast.error(`Copie impossible. Le lien est : ${lien}`, { duration: 8000 });
      return false;
    }
    setCopie(true);
    toast.success(`${quoi} copié`);
    setTimeout(() => setCopie(false), 2000);
    return true;
  };

  return { copier, copie };
}

export function BoutonCopierLien({
  lien,
  quoi = "Lien",
  libelle = "Copier le lien",
  titre,
  compact = false,
}: {
  lien: string;
  quoi?: string;
  libelle?: string;
  titre?: string;
  compact?: boolean;
}) {
  const { copier, copie } = useCopieLien();

  return (
    <button
      type="button"
      onClick={() => copier(lien, quoi)}
      title={titre ?? `Copier le lien de partage (${quoi})`}
      className={`flex items-center gap-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors ${
        compact ? "h-8 px-2.5" : "h-9 sm:h-10 px-3"
      }`}
    >
      {copie ? (
        <Check className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 shrink-0" />
      ) : (
        <Link2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#F17922] shrink-0" />
      )}
      <span className="text-xs font-medium text-slate-600 whitespace-nowrap">
        {copie ? "Copié" : libelle}
      </span>
    </button>
  );
}

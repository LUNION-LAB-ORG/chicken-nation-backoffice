import React from "react";
import { ArrowLeft, PhoneForwarded, Send, Sparkles, Store, Ticket, CalendarClock } from "lucide-react";
import type { Dossier } from "../../utils/dossiers-file";
import { SectionFile } from "./SectionFile";

/**
 * L'intérieur d'un dossier : les contacts à appeler, dans l'ordre où il faut
 * les traiter.
 *
 * ⚠️ Les sections restent celles de l'ancienne file. Ranger par campagne ne
 * change pas l'ordre de travail : on appelle d'abord ceux qui attendent depuis
 * le plus longtemps, et un intéressé passe avant un coupon déjà envoyé. Le
 * dossier dit QUI, les sections disent DANS QUEL ORDRE.
 */
export function DossierFile({
  dossier,
  onRetour,
  onOuvrir,
}: {
  dossier: Dossier;
  onRetour: () => void;
  onOuvrir: (id: string, telephone?: string) => void;
}) {
  const s = dossier.sections;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onRetour}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          <ArrowLeft className="w-4 h-4" /> Tous les dossiers
        </button>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{dossier.nom}</p>
          <p className="text-xs text-gray-500 tabular-nums">
            {dossier.jamais_appeles + dossier.a_relancer} à appeler sur {dossier.total}
          </p>
        </div>
      </div>

      <SectionFile
        titre="File commune Glovo/Yango"
        aide="Relevés en caisse la veille ou avant, les plus anciens d'abord. Le premier agent qui appelle prend le client."
        Icone={Store}
        lignes={s.commune}
        onOuvrir={onOuvrir}
        commune
      />
      <SectionFile
        titre="Intéressés"
        aide="Envoyez-leur le coupon pendant qu'ils y pensent."
        Icone={Sparkles}
        lignes={s.interesses}
        onOuvrir={onOuvrir}
      />
      <SectionFile
        titre="Jamais appelés"
        aide="Les entrées les plus récentes d'abord : un inscrit se souvient de l'application, un ancien client de son dernier repas."
        Icone={PhoneForwarded}
        lignes={s.nouveaux}
        onOuvrir={onOuvrir}
      />
      <SectionFile
        titre="À relancer"
        aide="Pas de réponse la dernière fois, les plus anciennes tentatives d'abord."
        Icone={Send}
        lignes={s.relances}
        onOuvrir={onOuvrir}
      />
      <SectionFile
        titre="Coupons envoyés"
        aide="Pas encore de commande : un rappel peut les décider."
        Icone={Ticket}
        lignes={s.coupons}
        onOuvrir={onOuvrir}
        replieeParDefaut
      />
      <SectionFile
        titre="Rappels planifiés"
        aide="À faire plus tard, ils reviendront en tête de file à l'heure dite."
        Icone={CalendarClock}
        lignes={s.rappels_planifies}
        onOuvrir={onOuvrir}
        replieeParDefaut
      />
    </div>
  );
}

"use client";

import React from "react";
import { Check, Circle, MapPin, Navigation, Package, Truck, XCircle, type LucideIcon } from "lucide-react";

// ⚠️ Import RELATIF entre features : `@/` pointe sur src/, `features/` est à la racine.
import { COULEURS_ETAT } from "../../livreurs/utils/disponibilite";
import type { Order } from "../../orders/types/order.types";
import type { GroupeHors, IconeLigne, LigneHors, TonHors } from "../utils/groupes-hors-restaurant";

const TEXTE: Record<TonHors, string> = {
  gris: "text-gray-500",
  vert: "text-green-700",
  bleu: "text-blue-700",
  ambre: "text-amber-700",
  rouge: "text-red-600",
  violet: "text-purple-700",
};

const ICONES: Record<Exclude<IconeLigne, "sans_livreur">, { Icone: LucideIcon; couleur: string }> = {
  livree: { Icone: Check, couleur: "text-green-600" },
  en_route: { Icone: Navigation, couleur: "text-blue-600" },
  chez_le_client: { Icone: MapPin, couleur: "text-blue-600" },
  a_livrer: { Icone: Circle, couleur: "text-gray-300" },
  echec: { Icone: XCircle, couleur: "text-red-600" },
};

/** Violet de Turbo (`TONS` des états de course). */
const VIOLET_TURBO = "#7C3AED";
/** Anneau sans état (il ne reste que de l'argent à rapporter) : gris des bordures, aucune couleur d'état. */
const ANNEAU_NEUTRE = "#E4E4E7";

interface Props {
  groupe: GroupeHors;
  /** Toucher une ligne : tiroir sur Détails. */
  onOuvrir: (order: Order) => void;
  /** « Encaisser 8.000 F » : tiroir sur Paiement. */
  onEncaisser: (order: Order) => void;
  /** Droit d'encaisser (`COMMANDES.UPDATE_FULL`) : le bouton, sinon le texte « À encaisser ». */
  peutEncaisser: boolean;
}

/**
 * Groupe d'un livreur dans la colonne « Hors restaurant » (demande du 24/10
 * au soir) : qui porte quoi dehors, où il en est, ce qu'il rapporte.
 *
 *   (KY) Koffi Yao                     En retard de 12 min
 *        Angré · 1 sur 3 livrée · appli fermée
 *   ✓ ORD-4818  Arrêt 1 · Livrée 12 h 52   [Encaisser 8.000 F]
 *   ➜ ORD-4819  Arrêt 2 · En route
 *   · ORD-4820  Arrêt 3 · À livrer
 *
 * Textes et ordre : `utils/groupes-hors-restaurant.ts`.
 */
export const GroupeLivreurCard: React.FC<Props> = ({ groupe, onOuvrir, onEncaisser, peutEncaisser }) => {
  const titre2 = groupe.ligne2.map((m) => m.texte).join(" · ");

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <Avatar groupe={groupe} />
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate text-sm font-bold text-gray-900" title={groupe.titre}>
              {groupe.titre}
            </span>
            {groupe.droite && (
              <span className={`ml-auto shrink-0 text-xs font-semibold ${TEXTE[groupe.droite.ton]}`}>
                {groupe.droite.texte}
              </span>
            )}
          </div>
          <p className="h-4 truncate text-xs leading-4" title={titre2}>
            {groupe.ligne2.map((m, i) => (
              <span key={`${m.texte}-${i}`} className={TEXTE[m.ton]} title={m.titre}>
                {i > 0 && <span className="text-gray-400"> · </span>}
                {m.texte}
              </span>
            ))}
          </p>
        </div>
      </div>

      <ul className="border-t border-gray-100 divide-y divide-gray-100">
        {groupe.lignes.map((ligne) => (
          <Ligne
            key={ligne.commande.id}
            ligne={ligne}
            onOuvrir={onOuvrir}
            onEncaisser={onEncaisser}
            peutEncaisser={peutEncaisser}
          />
        ))}
      </ul>
    </div>
  );
};

function Avatar({ groupe }: { groupe: GroupeHors }) {
  if (groupe.genre === "sans_livreur") {
    return (
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-400">
        <Package className="h-4 w-4" aria-hidden />
      </span>
    );
  }
  if (groupe.etatAvatar === "TURBO") {
    return (
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-50 text-purple-700"
        style={{ boxShadow: `0 0 0 2px ${VIOLET_TURBO}` }}
      >
        <Truck className="h-4 w-4" aria-hidden />
      </span>
    );
  }
  const couleur =
    groupe.etatAvatar === "EN_COURSE" || groupe.etatAvatar === "APPLI_FERMEE"
      ? COULEURS_ETAT[groupe.etatAvatar].couleur
      : ANNEAU_NEUTRE;
  return (
    <span
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-50 text-xs font-bold text-gray-700"
      style={{ boxShadow: `0 0 0 2px ${couleur}` }}
    >
      {groupe.initiales}
    </span>
  );
}

function Ligne({
  ligne,
  onOuvrir,
  onEncaisser,
  peutEncaisser,
}: {
  ligne: LigneHors;
  onOuvrir: (order: Order) => void;
  onEncaisser: (order: Order) => void;
  peutEncaisser: boolean;
}) {
  const order = ligne.commande as unknown as Order;
  const icone = ligne.icone === "sans_livreur" ? null : ICONES[ligne.icone];
  const encaisser = ligne.encaisser;
  return (
    <li className="flex h-9 items-center gap-2 pr-2 text-xs">
      <button
        type="button"
        onClick={() => onOuvrir(order)}
        title={`${ligne.reference} · ${ligne.detail.texte}`}
        className="flex h-full min-w-0 flex-1 items-center gap-2 pl-3 text-left hover:bg-gray-50 focus:outline-none focus-visible:bg-gray-50"
      >
        {icone && <icone.Icone className={`h-3.5 w-3.5 shrink-0 ${icone.couleur}`} aria-hidden />}
        <span className="shrink-0 font-bold text-gray-900">{ligne.reference}</span>
        <span className={`min-w-0 truncate ${TEXTE[ligne.detail.ton]}`}>{ligne.detail.texte}</span>
      </button>
      {encaisser &&
        (peutEncaisser ? (
          <button
            type="button"
            onClick={() => onEncaisser(order)}
            title={encaisser.titre ?? undefined}
            className={`shrink-0 rounded-lg px-2 py-1 text-[11px] font-bold text-white ${
              encaisser.enRetard ? "bg-red-600 hover:bg-red-700" : "bg-[#F17922] hover:bg-[#D96A1D]"
            }`}
          >
            {encaisser.bouton}
          </button>
        ) : (
          <span
            className={`shrink-0 font-semibold ${encaisser.enRetard ? "text-red-600" : "text-amber-700"}`}
            title={encaisser.titre ?? undefined}
          >
            {encaisser.texte}
          </span>
        ))}
      {!encaisser && ligne.nonPayee && <span className="shrink-0 font-semibold text-amber-700">Non payée</span>}
    </li>
  );
}

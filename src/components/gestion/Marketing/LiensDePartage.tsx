"use client";

import { Download, Gift, IdCard, Sparkles } from "lucide-react";
import { BoutonCopierLien } from "@/components/ui/CopierLien";
import { QrCodeLien } from "@/components/ui/QrCodeLien";
import {
  lienBons,
  lienCarteNation,
  lienFidelite,
  lienTelechargement,
} from "@/utils/deeplinks";

/**
 * Les liens de partage qui ne dépendent d'aucun objet.
 *
 * ⚠️ Ces quatre adresses sont FIXES : elles ne changent jamais et ne visent
 * rien de particulier. Mettre un bouton de copie sur quatre écrans différents
 * n'aurait aucun sens, personne n'irait ouvrir la fiche d'un bon pour copier un
 * lien qui ne dépend d'aucun bon. Ils sont donc réunis ici, dans le module qui
 * mesure déjà leurs clics.
 *
 * Les liens qui visent un objet précis, eux, restent sur l'objet : le plat dans
 * sa fiche, la catégorie dans sa ligne, la commande dans son tiroir.
 */
const LIENS: {
  cle: string;
  icone: typeof Download;
  titre: string;
  detail: string;
  lien: string;
  couleur: string;
  nonMesure?: boolean;
}[] = [
  {
    cle: "download",
    icone: Download,
    titre: "Télécharger l'application",
    detail:
      "Pour les affiches, les QR codes et les appels à l'action généraux. Ouvre l'accueil de l'application.",
    // ⚠️ Seule la page de redirection compte les clics : celle de
    // téléchargement n'est pas instrumentée. Sans cette mention, un zéro dans
    // les statistiques se lirait comme une panne.
    nonMesure: true,
    lien: lienTelechargement(),
    couleur: "text-slate-600 bg-slate-50",
  },
  {
    cle: "voucher",
    icone: Gift,
    titre: "Bons et codes promo",
    detail:
      "Ouvre le portefeuille de réductions du client. Levier de relance et de réactivation.",
    lien: lienBons(),
    couleur: "text-purple-600 bg-purple-50",
  },
  {
    cle: "loyalty",
    icone: Sparkles,
    titre: "Club de fidélité",
    detail:
      "Ouvre le programme de fidélité, pour inviter à consulter son solde de points.",
    lien: lienFidelite(),
    couleur: "text-amber-600 bg-amber-50",
  },
  {
    cle: "nation-card",
    icone: IdCard,
    titre: "Carte de la Nation",
    detail: "Accès direct à la carte du client.",
    lien: lienCarteNation(),
    couleur: "text-red-600 bg-red-50",
  },
];

export function LiensDePartage() {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 md:p-6">
      <div className="mb-4">
        <h3 className="text-[15px] font-bold text-gray-900">Liens de partage</h3>
        <p className="mt-1 text-xs text-gray-500 leading-relaxed">
          Un seul lien suffit : si le client a l&apos;application, elle
          s&apos;ouvre sur la bonne page ; sinon il est renvoyé vers la boutique.
          Les liens vers un plat, une catégorie ou une commande se copient
          depuis l&apos;élément concerné.
        </p>
      </div>

      <ul className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {LIENS.map(({ cle, icone: Icone, titre, detail, lien, couleur, nonMesure }) => (
          <li
            key={cle}
            className="flex items-start gap-3 p-3.5 rounded-2xl border border-gray-100 hover:border-gray-200 transition-colors"
          >
            <span
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${couleur}`}
            >
              <Icone className="w-4 h-4" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">{titre}</p>
              <p className="mt-0.5 text-[11px] text-gray-500 leading-relaxed">
                {detail}
              </p>
              <p className="mt-1.5 text-[10px] text-gray-400 break-all font-mono">
                {lien}
              </p>
              {nonMesure && (
                <p className="mt-1 text-[10px] text-amber-600">
                  Non compté dans les statistiques ci-dessous : seule la page de
                  redirection enregistre les clics.
                </p>
              )}
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <BoutonCopierLien lien={lien} quoi={titre} compact />
                <QrCodeLien lien={lien} titre={titre} />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

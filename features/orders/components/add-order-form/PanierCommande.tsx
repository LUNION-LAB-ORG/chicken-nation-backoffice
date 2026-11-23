"use client";

import React from "react";
import { Loader2, MapPin, Store, UserRound } from "lucide-react";
import { ReductionAffichee } from "../../types/coupon.types";
import { OrderFormData } from "../../types/order-form.types";
import { OrderType } from "../../types/order.types";
import { getParsedAddress } from "../../utils/getParsedAddress";

interface PanierCommandeProps {
  formData: OrderFormData;
  /** Nom du restaurant choisi, s'il y en a un. */
  restaurant?: string;
  /** Quantité totale d'articles. */
  nombreArticles: number;
  /** Reçoit l'élément où les lignes du panier sont rendues (OrderItemsSection). */
  cibleLignes: (element: HTMLElement | null) => void;
  /** Section « Réduction » (code promo ou bon), sous les articles. Absente si le compte n'y a pas droit. */
  blocReduction?: React.ReactNode;
  /** Sous-total affiché : celui du serveur quand un coupon est vérifié. */
  sousTotal: number;
  /** Le serveur a recalculé le sous-total aux prix du jour. */
  sousTotalRecalcule: boolean;
  fraisLivraison: number;
  /** Taxe figée d'une commande modifiée. Zéro en création. */
  taxe: number;
  reduction?: ReductionAffichee;
  total: number;
  enModification: boolean;
  envoiEnCours: boolean;
  onAnnuler: () => void;
}

/** Mêmes mots que le sélecteur du type de commande. */
const LIBELLE_TYPE: Record<OrderType, string> = {
  [OrderType.DELIVERY]: "Livraison",
  [OrderType.PICKUP]: "Retrait",
  [OrderType.TABLE]: "Sur place",
};

const Rappel = ({
  Icone,
  texte,
  manque,
}: {
  Icone: React.FC<{ className?: string }>;
  texte: string;
  manque: string;
}) => (
  <p className="flex items-start gap-2">
    <Icone className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
    {texte ? (
      <span className="min-w-0 break-words font-semibold text-[#595959]">{texte}</span>
    ) : (
      <span className="text-gray-400">{manque}</span>
    )}
  </p>
);

/**
 * Le panier, toujours visible à côté du formulaire : à qui et où va la
 * commande, ses articles, son total, et le bouton pour l'enregistrer. L'agent
 * relit la commande au client sans faire défiler la page.
 *
 * Écran étroit : le panneau se range sous les articles et la barre du bas
 * garde le total et les boutons.
 */
const PanierCommande: React.FC<PanierCommandeProps> = ({
  formData,
  restaurant,
  nombreArticles,
  cibleLignes,
  blocReduction,
  sousTotal,
  sousTotalRecalcule,
  fraisLivraison,
  taxe,
  reduction,
  total,
  enModification,
  envoiEnCours,
  onAnnuler,
}) => {
  const livraison = formData.type === OrderType.DELIVERY;
  const adresse = livraison ? getParsedAddress(formData.address) : null;
  const client = [formData.fullname?.trim(), formData.phone?.trim()].filter(Boolean).join(" · ");
  const lieu = [LIBELLE_TYPE[formData.type], restaurant].filter(Boolean).join(" · ");

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white @4xl/commande:max-h-[calc(100dvh-5.5rem)]">
      {/* En-tête */}
      <div className="flex shrink-0 items-center justify-between bg-[#F17922] px-4 py-3">
        <h4 className="flex items-center gap-2 text-sm font-bold text-white">
          <span>🛒</span>
          Panier
        </h4>
        <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold text-white">
          {nombreArticles} article{nombreArticles > 1 ? "s" : ""}
        </span>
      </div>

      {/* À qui et où : ce que l'agent relit avant d'enregistrer */}
      <div className="shrink-0 space-y-1.5 border-b border-gray-100 px-4 py-3 text-xs">
        <Rappel Icone={UserRound} texte={client} manque="Client à renseigner" />
        <Rappel Icone={Store} texte={restaurant ? lieu : ""} manque={`${LIBELLE_TYPE[formData.type]} · restaurant à choisir`} />
        {livraison && (
          <Rappel
            Icone={MapPin}
            texte={adresse?.title || adresse?.address || ""}
            manque="Adresse de livraison à renseigner"
          />
        )}
      </div>

      {/* Articles (rendus ici par OrderItemsSection) puis réduction : ils
          défilent ensemble quand le panier est long, le total et les boutons
          restent visibles. */}
      <div className="@4xl/commande:min-h-0 @4xl/commande:flex-1 @4xl/commande:overflow-y-auto">
        <div ref={cibleLignes} />
        {blocReduction && <div className="border-t border-gray-100 px-4 py-3.5">{blocReduction}</div>}
      </div>

      {/* Résumé de prix */}
      <div className="shrink-0 space-y-2 border-t-2 border-[#F17922]/10 px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[13px] font-medium text-[#71717A]">
            Sous-total articles
            {sousTotalRecalcule && (
              <span className="block text-[11px] font-normal text-gray-400">
                Recalculé par le serveur aux prix du jour
              </span>
            )}
          </span>
          <span className="shrink-0 text-[13px] font-semibold text-[#595959]">
            {sousTotal.toLocaleString()} XOF
          </span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-[13px] font-medium text-[#71717A]">Frais de livraison</span>
          {livraison ? (
            <span className="shrink-0 text-[13px] font-semibold text-[#595959]">
              {fraisLivraison > 0
                ? `${fraisLivraison.toLocaleString()} XOF`
                : adresse
                  ? "Gratuit"
                  : "Non calculé"}
            </span>
          ) : (
            <span className="shrink-0 text-[13px] font-semibold text-green-600">Non applicable</span>
          )}
        </div>

        {taxe > 0 && (
          <div className="flex items-center justify-between gap-3">
            <span className="text-[13px] font-medium text-[#71717A]">Taxe</span>
            <span className="shrink-0 text-[13px] font-semibold text-[#595959]">{taxe.toLocaleString()} XOF</span>
          </div>
        )}

        {reduction && (
          <div className="flex items-center justify-between gap-3">
            <span className="min-w-0 break-words text-[13px] font-medium text-green-700">
              Réduction{reduction.libelle ? ` · ${reduction.libelle}` : ""}
            </span>
            <span className="shrink-0 text-[13px] font-semibold text-green-700">
              {reduction.montant === null ? "En attente" : `−${reduction.montant.toLocaleString()} XOF`}
            </span>
          </div>
        )}

        <div className="!my-3 border-t-2 border-dashed border-[#D9D9D9]/50" />

        <div className="flex items-center justify-between gap-3">
          <span className="text-base font-bold text-[#595959]">Total à payer</span>
          <div className="shrink-0 text-right">
            <span className="text-xl font-extrabold text-[#F17922]">{total.toLocaleString()}</span>
            <span className="ml-1 text-sm font-bold text-[#F17922]">XOF</span>
          </div>
        </div>
      </div>

      {/* Boutons : ici quand le panneau est à côté du formulaire ; sinon la barre du bas. */}
      <div className="hidden shrink-0 gap-2 px-4 pb-4 @4xl/commande:flex">
        <button
          type="button"
          onClick={onAnnuler}
          disabled={envoiEnCours}
          className="h-11 shrink-0 rounded-xl bg-gray-100 px-4 text-[13px] font-semibold text-gray-500 transition hover:bg-gray-200 disabled:opacity-50"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={envoiEnCours || formData.items.length === 0}
          className="inline-flex h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl bg-[#F17922] px-3 text-[13px] font-semibold text-white transition hover:bg-[#F17922]/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {envoiEnCours ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Enregistrement...
            </>
          ) : enModification ? (
            "Mettre à jour la commande"
          ) : (
            "Enregistrer la commande"
          )}
        </button>
      </div>
    </div>
  );
};

export default PanierCommande;

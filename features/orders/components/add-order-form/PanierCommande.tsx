"use client";

import React from "react";
import { Bike, Loader2, Navigation, ShoppingBag, Store, UserRound, UtensilsCrossed } from "lucide-react";
import { ReductionAffichee } from "../../types/coupon.types";
import { OrderFormData } from "../../types/order-form.types";
import { OrderType } from "../../types/order.types";
import { getParsedAddress } from "../../utils/getParsedAddress";
import { texteTrajet, TrajetLivraison } from "../../utils/panier";

interface PanierCommandeProps {
  formData: OrderFormData;
  /** Nom du restaurant choisi, s'il y en a un. */
  restaurant?: string;
  /** Trajet du restaurant à l'adresse (livraison), remonté par la section Livraison. */
  trajet?: TrajetLivraison | null;
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

/** Mêmes mots et mêmes icônes que le sélecteur du type de commande. */
const TYPE: Record<OrderType, { libelle: string; detail: string; Icone: React.FC<{ className?: string }> }> = {
  [OrderType.DELIVERY]: { libelle: "Livraison", detail: "", Icone: Bike },
  [OrderType.PICKUP]: { libelle: "Retrait", detail: "Le client vient chercher", Icone: ShoppingBag },
  [OrderType.TABLE]: { libelle: "Sur place", detail: "Service à table", Icone: UtensilsCrossed },
};

/** Une ligne du rappel : libellé à gauche, valeur à droite. */
const Rappel = ({
  Icone,
  libelle,
  texte,
  manque,
  complement,
}: {
  Icone: React.FC<{ className?: string }>;
  libelle: string;
  texte: string;
  manque: string;
  complement?: React.ReactNode;
}) => (
  <div className="grid grid-cols-[5.75rem_minmax(0,1fr)] items-start gap-2">
    <dt className="flex items-center gap-1.5 text-gray-400">
      <Icone className="h-3.5 w-3.5 shrink-0" />
      {libelle}
    </dt>
    <dd className="min-w-0">
      {texte ? (
        <span className="break-words font-semibold text-gray-800">{texte}</span>
      ) : (
        <span className="text-gray-400">{manque}</span>
      )}
      {complement}
    </dd>
  </div>
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
  trajet,
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
  const type = TYPE[formData.type];
  const distanceDuree = livraison ? texteTrajet(trajet) : null;

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white @4xl/commande:max-h-[calc(100dvh-5.5rem)]">
      {/* En-tête */}
      <div className="flex shrink-0 items-center justify-between bg-[#F17922] px-4 py-3">
        <h4 className="flex items-center gap-2 text-sm font-bold text-blanc">
          <span>🛒</span>
          Panier
        </h4>
        <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold text-blanc">
          {nombreArticles} article{nombreArticles > 1 ? "s" : ""}
        </span>
      </div>

      {/* À qui, d'où et où : ce que l'agent relit avant d'enregistrer. Le
          restaurant qui prépare et le lieu de livraison sur deux lignes. */}
      <dl className="shrink-0 space-y-2 border-b border-gray-100 px-4 py-3 text-xs">
        <Rappel Icone={UserRound} libelle="Client" texte={client} manque="À renseigner" />
        <Rappel Icone={Store} libelle="Restaurant" texte={restaurant ?? ""} manque="À choisir" />
        <Rappel
          Icone={type.Icone}
          libelle={type.libelle}
          texte={livraison ? adresse?.title || adresse?.address || "" : type.detail}
          manque="Adresse à renseigner"
          complement={
            distanceDuree && (
              <span className="mt-1.5 flex w-fit items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-[11px] font-semibold text-[#F17922]">
                <Navigation className="h-3 w-3 shrink-0" />
                {distanceDuree}
              </span>
            )
          }
        />
      </dl>

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
          <span className="text-[13px] font-medium text-hex-71717a">
            Sous-total articles
            {sousTotalRecalcule && (
              <span className="block text-[11px] font-normal text-gray-400">
                Recalculé par le serveur aux prix du jour
              </span>
            )}
          </span>
          <span className="shrink-0 text-[13px] font-semibold text-hex-595959">
            {sousTotal.toLocaleString()} XOF
          </span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-[13px] font-medium text-hex-71717a">Frais de livraison</span>
          {livraison ? (
            <span className="shrink-0 text-[13px] font-semibold text-hex-595959">
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
            <span className="text-[13px] font-medium text-hex-71717a">Taxe</span>
            <span className="shrink-0 text-[13px] font-semibold text-hex-595959">{taxe.toLocaleString()} XOF</span>
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

        <div className="!my-3 border-t-2 border-dashed border-hex-d9d9d9/50" />

        <div className="flex items-center justify-between gap-3">
          <span className="text-base font-bold text-hex-595959">Total à payer</span>
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
          className="inline-flex h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl bg-[#F17922] px-3 text-[13px] font-semibold text-blanc transition hover:bg-[#F17922]/90 disabled:cursor-not-allowed disabled:opacity-50"
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

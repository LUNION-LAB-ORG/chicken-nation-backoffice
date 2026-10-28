"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle, Info, PackageX, RotateCw, Truck, Undo2 } from "lucide-react";

import { useOrderActions } from "../../../orders/hooks/useOrderActions";
import { format } from "date-fns";
// ⚠️ Import RELATIF entre features : `@/` pointe sur src/, `features/` est à la racine.
import { AVANCE_PREPARATION_MS, momentSouhaite } from "../../../orders/utils/momentSouhaite";
import { OrderStatus, type Order } from "../../../orders/types/order.types";
import { DrawerCancelAction } from "./DrawerCancelAction";
import { piedDuTiroir } from "../../utils/pied-tiroir";
import { useDroitsCommande } from "../../../orders/hooks/useDroitsCommande";
import { useCommandeEnCours, useCommandesDeLaCourse } from "../../hooks/use-commande-en-cours";
import { useMaintenant } from "../../hooks/use-maintenant";
import { useAuthStore } from "../../../users/hook/authStore";
import { peutConfirmerRecuperation } from "../../utils/code-retrait";
import { courseDeLaPrete, quelquUnARemettre } from "../../utils/group-orders";
import { courseDeCommande, type CommandeOperations, type CourseOperations } from "../../utils/suivi-course";
import { ligneDepart, ligneRetenue } from "../../utils/ligne-retenue";
import { LIBELLE_SAC_RAPPORTE, peutRapporterSac, sacARapporter, texteSacARapporter } from "../../utils/sac-a-rapporter";
import { useSacRapporteMutation } from "../../queries/sac-rapporte.mutation";
import { useDroitsLivraison } from "../../../livreurs/hook/use-droits-livraison";
import { useRelanceLivraisonMutation } from "../../../courses/queries/relance-livraison.mutation";
import {
  LIBELLE_RELANCER_LIVRAISON,
  gestesSacARapporter,
  peutRelancerLivraison,
} from "../../../courses/utils/relance-livraison";
import { BoutonConfirmerRecuperation } from "../course/BandeauCourse";
import { EtatCourseLivreur } from "../course/EtatCourseLivreur";
import { PickupValidationModal } from "../PickupValidationModal";

interface Props {
  order: Order;
}

/**
 * Bouton d'action principal pour les commandes Chicken Nation — footer du drawer.
 *
 * L'encaissement espèce est maintenant géré dans le tab "Paiement" dédié,
 * ce composant ne gère plus que les transitions ACCEPTED → IN_PROGRESS → READY
 * + des infos d'état pour les autres statuts.
 */
export const DrawerActionsChickenNation: React.FC<Props> = ({ order }) => {
  const { peutChangerStatut } = useDroitsCommande();
  const { handleOrderUpdateStatus, isLoading } = useOrderActions();
  // Course complète (code, livreur, retenue) : celle de la liste des
  // Opérations, le détail de la commande n'en porte qu'une partie.
  const enCours = useCommandeEnCours(order.id);
  const maintenant = useMaintenant(15_000);
  const membre = useAuthStore((s) => s.user);
  // « Confirmer la récupération » depuis le tiroir (demande du 24/10 : « la
  // caissière clique sur le groupe ou la commande »), même fenêtre que le groupe.
  const [aRemettre, setARemettre] = useState<CourseOperations | null>(null);
  const commandesDeLaCourse = useCommandesDeLaCourse(aRemettre?.id);
  // « Sac rapporté » (28/10) : un toucher, sans fenêtre de confirmation.
  const { mutate: rapporterSac, isPending: envoiSac } = useSacRapporteMutation();
  // « Relancer la livraison » (28/10), à côté : même livreur, sans passage au
  // restaurant. Pour qui pilote les courses (administrateur, centre d'appels).
  const droitsLivraison = useDroitsLivraison();
  const { mutate: relancerLivraison, isPending: envoiRelance } = useRelanceLivraisonMutation();
  // Un seul envoi à la fois entre les deux gestes.
  const envoiGeste = envoiSac || envoiRelance;

  /*
    Un rôle de CONSULTATION ne doit pas voir ces boutons. Le tiroir masque déjà
    tout le pied de page, mais la garde vit aussi ICI : un composant d'action
    doit refuser d'agir où qu'on le monte, sinon le trou revient au prochain
    écran qui le réutilise.

    Il garde en revanche le SUIVI de la course (livreur et son état, retenue,
    code), qui n'est que de l'information (`pied-tiroir.ts`, relecture
    du 24/10) : sans boutons ni annulation.

    ⚠️ APRÈS tous les hooks, jamais avant. Les droits arrivent après
    l'hydratation du magasin : un retour anticipé placé plus haut sauterait les
    hooks suivants au premier rendu puis les appellerait au second, et React
    casse sur « plus de hooks qu'au rendu précédent ».
  */
  if (!piedDuTiroir(order, peutChangerStatut)) return null;
  // Rôle de consultation : jamais d'annulation.
  const annulation = peutChangerStatut ? <DrawerCancelAction order={order} /> : null;

  const suivie = (enCours ?? order) as unknown as CommandeOperations;
  const course = courseDeCommande(suivie) ?? courseDeCommande(order as unknown as CommandeOperations);
  const pickup =
    course?.pickup_code ??
    (order as unknown as { delivery?: { course?: { pickup_code: string } } }).delivery?.course?.pickup_code;
  /**
   * La préparation ne s'ouvre qu'une heure avant l'heure souhaitée.
   *
   * Le serveur applique la même règle et refuserait de toute façon : ce
   * blocage-ci sert à l'expliquer AVANT le clic, plutôt que de laisser
   * découvrir un refus. Les deux calculs partagent le même utilitaire, pour
   * qu'aucun ne dérive de l'autre.
   */
  const moment = momentSouhaite(order.date, order.time);
  const ouverture = moment ? new Date(moment.getTime() - AVANCE_PREPARATION_MS) : null;
  // Heure relue toutes les 15 s (`useMaintenant`), sans lecture de l'horloge pendant le rendu.
  const tropTot = !!ouverture && maintenant.getTime() < ouverture.getTime();

  if (order.status === OrderStatus.ACCEPTED) {
    return (
      <div className="space-y-2">
        <button
          onClick={() => handleOrderUpdateStatus(order.id, OrderStatus.IN_PROGRESS)}
          disabled={isLoading || tropTot}
          title={
            tropTot && ouverture
              ? `Commande programmée : la préparation s'ouvre à ${format(ouverture, "HH'h'mm")}`
              : undefined
          }
          className="w-full py-3 bg-[#F17922] hover:bg-[#e06816] text-white font-semibold rounded-xl transition disabled:bg-gray-300"
        >
          {isLoading ? "…" : "Commencer la préparation"}
        </button>
        {tropTot && ouverture && (
          <p className="text-[11px] text-[#8A4B00] text-center">
            Commande programmée pour {format(moment!, "HH'h'mm")} · préparation à partir de{" "}
            {format(ouverture, "HH'h'mm")}
          </p>
        )}
        <DrawerCancelAction order={order} />
      </div>
    );
  }

  if (order.status === OrderStatus.IN_PROGRESS) {
    return (
      <div className="space-y-2">
        <button
          onClick={() => handleOrderUpdateStatus(order.id, OrderStatus.READY)}
          disabled={isLoading}
          className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition disabled:bg-gray-300"
        >
          <CheckCircle className="w-4 h-4" />
          {isLoading ? "…" : "Marquer comme prête"}
        </button>
        <DrawerCancelAction order={order} />
      </div>
    );
  }

  if (order.status === OrderStatus.READY && course) {
    // Planificateur v2 : livreur et son état, retenue en une ligne, code.
    // Demande du 24/10 (« reste simple ») : plus de phrase d'ajout à la course.
    // Demande du 27/10 : l'heure limite du départ en seconde ligne, comme le groupe.
    const retenue = ligneRetenue(course, maintenant);
    const depart = ligneDepart(course, maintenant);
    // Mêmes conditions que le bouton du groupe : rôle admis par le serveur,
    // quelqu'un pour prendre les sacs, commande encore dans cette course.
    const aConfirmer = courseDeLaPrete(suivie as unknown as Order);
    const peutConfirmer =
      peutChangerStatut && peutConfirmerRecuperation(membre) && !!aConfirmer && quelquUnARemettre(aConfirmer);
    return (
      <div className="space-y-2">
        <EtatCourseLivreur
          course={course}
          commandes={[suivie]}
          service={order.delivery_service}
          maintenant={maintenant}
        />
        {retenue && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            <p className="font-semibold">{retenue}</p>
            {depart && <p>{depart}</p>}
          </div>
        )}
        {pickup && (
          <p className="text-xs text-gray-600">
            Code retrait :{" "}
            <span className="font-mono font-bold text-[#F17922] text-base">{pickup}</span>
          </p>
        )}
        {peutConfirmer && aConfirmer && (
          <BoutonConfirmerRecuperation
            course={aConfirmer}
            commandes={[suivie]}
            service={order.delivery_service}
            maintenant={maintenant}
            onClick={() => setARemettre(aConfirmer)}
          />
        )}
        {annulation}
        {/* Hors du tiroir (qui glisse avec `transform`) : la fenêtre couvre tout l'écran. */}
        {aRemettre &&
          typeof document !== "undefined" &&
          createPortal(
            <PickupValidationModal
              course={aRemettre}
              commandes={commandesDeLaCourse.length > 0 ? commandesDeLaCourse : [suivie as unknown as Order]}
              restaurantNom={order.restaurant?.name ?? null}
              onClose={() => setARemettre(null)}
            />,
            document.body,
          )}
      </div>
    );
  }

  if (order.status === OrderStatus.READY) {
    return (
      <div className="space-y-2">
        <div className="flex items-start gap-3 rounded-xl bg-orange-50 border border-orange-200 px-3 py-3">
          <Truck className="w-5 h-5 text-[#F17922] shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">En attente du livreur</p>
            {pickup && (
              <p className="text-xs text-gray-600 mt-0.5">
                Code retrait :{" "}
                <span className="font-mono font-bold text-[#F17922] text-base">{pickup}</span>
              </p>
            )}
            <p className="text-[11px] text-gray-500 mt-1">
              Le livreur dictera le code à la caissière dès son arrivée.
            </p>
          </div>
        </div>
        {annulation}
      </div>
    );
  }

  if (order.status === OrderStatus.PICKED_UP || order.status === OrderStatus.COLLECTED) {
    /*
      Demande du 28/10 : livraison annulée par le livreur, le sac est chez
      lui. L'encadré se lit sur la liste des Opérations (`sac_a_rapporter`) ;
      champ absent (serveur ancien) : rien. Le bouton, pour les rôles admis
      par le serveur seulement, remet la commande « prête » : elle repart
      dans une nouvelle course. Le suivi et l'encadré bleu restent dessous.

      « Relancer la livraison » (28/10) à gauche, contour orange : la même
      livraison repart avec le même livreur, sans passage au restaurant. Les
      deux gestes (administrateur) sur deux colonnes ; un seul (centre
      d'appels : Relancer ; restaurant : Sac rapporté) en pleine largeur.
    */
    const sac = order.status === OrderStatus.PICKED_UP ? sacARapporter(enCours ?? order) : null;
    const peutRapporter = peutRapporterSac(peutChangerStatut, membre);
    const { gestes, deuxColonnes } = gestesSacARapporter(peutRelancerLivraison(droitsLivraison), peutRapporter);
    return (
      <div className="space-y-2">
        {sac && (
          <div role="alert" className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2">
            <PackageX className="w-4 h-4 text-red-600 shrink-0" />
            <p className="text-sm font-semibold text-red-800">{texteSacARapporter(sac)}</p>
          </div>
        )}
        {sac && gestes.length > 0 && (
          <div className={deuxColonnes ? "grid grid-cols-2 gap-2" : undefined}>
            {gestes.map((geste) =>
              geste === "RELANCER_LIVRAISON" ? (
                <button
                  key={geste}
                  type="button"
                  onClick={() => relancerLivraison({ orderId: order.id, reference: order.reference })}
                  disabled={envoiGeste}
                  className="w-full py-3 px-2 border border-[#F17922] text-[#F17922] bg-white hover:bg-orange-50 font-semibold rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-60"
                >
                  <RotateCw className="w-4 h-4 shrink-0" />
                  {envoiRelance ? "…" : LIBELLE_RELANCER_LIVRAISON}
                </button>
              ) : (
                <button
                  key={geste}
                  type="button"
                  onClick={() => rapporterSac({ orderId: order.id, reference: order.reference })}
                  disabled={envoiGeste}
                  className="w-full py-3 bg-[#F17922] hover:bg-[#e06816] text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition disabled:bg-gray-300"
                >
                  <Undo2 className="w-4 h-4" />
                  {envoiSac ? "…" : LIBELLE_SAC_RAPPORTE}
                </button>
              ),
            )}
          </div>
        )}
        {order.status === OrderStatus.PICKED_UP && course && (
          <EtatCourseLivreur
            course={course}
            commandes={[suivie]}
            service={order.delivery_service}
            maintenant={maintenant}
            compact
          />
        )}
        <div className="flex items-center gap-2 rounded-xl bg-blue-50 border border-blue-200 px-3 py-2">
          <Info className="w-4 h-4 text-blue-600 shrink-0" />
          <p className="text-xs text-blue-800">
            Commande récupérée par le livreur : suivi dans le module Courses.
          </p>
        </div>
      </div>
    );
  }

  if (order.status === OrderStatus.COMPLETED) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-green-50 border border-green-200 px-3 py-2">
        <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
        <p className="text-xs text-green-800">
          Commande terminée
          {order.paied ? ", paiement enregistré ✓" : ""}
        </p>
      </div>
    );
  }

  return null;
};

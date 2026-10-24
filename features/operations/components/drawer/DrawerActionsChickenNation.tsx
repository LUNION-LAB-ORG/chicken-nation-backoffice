"use client";

import React, { useState } from "react";
import { CheckCircle, Truck } from "lucide-react";

import { useOrderActions } from "../../../orders/hooks/useOrderActions";
import { format } from "date-fns";
// ⚠️ Import RELATIF entre features : `@/` pointe sur src/, `features/` est à la racine.
import { AVANCE_PREPARATION_MS, momentSouhaite } from "../../../orders/utils/momentSouhaite";
import { OrderStatus, type Order } from "../../../orders/types/order.types";
import { DrawerCancelAction } from "./DrawerCancelAction";
import { piedDuTiroir } from "../../utils/pied-tiroir";
import { useDroitsCommande } from "../../../orders/hooks/useDroitsCommande";
import { useCommandeEnCours, useCommandesDeCourse } from "../../hooks/use-commande-en-cours";
import { useMaintenant } from "../../hooks/use-maintenant";
import { useAuthStore } from "../../../users/hook/authStore";
import { peutConfirmerRecuperation } from "../../utils/code-retrait";
import { courseDeCommande, type CommandeOperations, type CourseOperations } from "../../utils/suivi-course";
import { ligneRetenue } from "../../utils/ligne-retenue";
import { EtatCourseLivreur, useEtatCourseLivreur } from "../course/EtatCourseLivreur";
import { BoutonConfirmerRecuperation, FenetreRecuperation } from "../FenetreRecuperation";

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
  // Course complète (livreur, retenue, code pour la fenêtre) : celle de la
  // liste des Opérations, le détail de la commande n'en porte qu'une partie.
  const enCours = useCommandeEnCours(order.id);
  const maintenant = useMaintenant(15_000);

  /*
    Un rôle de CONSULTATION ne doit pas voir ces boutons. Le tiroir masque déjà
    tout le pied de page, mais la garde vit aussi ICI : un composant d'action
    doit refuser d'agir où qu'on le monte, sinon le trou revient au prochain
    écran qui le réutilise.

    Il garde en revanche le SUIVI de la course (livreur et son état,
    retenue), qui n'est que de l'information (`pied-tiroir.ts`, relecture
    du 24/10) : sans boutons ni annulation, ni « Confirmer la récupération ».

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
  const tropTot = !!ouverture && Date.now() < ouverture.getTime();


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
    // Livreur et son état, retenue en une ligne, « Confirmer la récupération »
    // (demande du 24/10 au soir : le code est en grand dans la fenêtre).
    return (
      <PiedCourseAuRestaurant
        course={course}
        commande={suivie}
        service={order.delivery_service}
        maintenant={maintenant}
        annulation={annulation}
      />
    );
  }

  if (order.status === OrderStatus.READY) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-3 rounded-xl bg-orange-50 border border-orange-200 px-3 py-3">
          <Truck className="w-5 h-5 text-[#F17922] shrink-0" />
          <p className="text-sm font-semibold text-gray-900">En attente du livreur</p>
        </div>
        {annulation}
      </div>
    );
  }

  if (order.status === OrderStatus.PICKED_UP) {
    return course ? (
      <EtatCourseLivreur
        course={course}
        commandes={[suivie]}
        service={order.delivery_service}
        maintenant={maintenant}
        compact
      />
    ) : null;
  }

  if (order.status === OrderStatus.COLLECTED) return null;

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

/**
 * Pied du tiroir d'une commande prête qui a sa course : état du livreur et
 * retenue (une ligne chacun), puis « Confirmer la récupération », même
 * fenêtre et même règle qu'au groupe de la course : pour qui peut la
 * confirmer, dès qu'un livreur a accepté ou que Turbo a la course.
 */
function PiedCourseAuRestaurant({
  course,
  commande,
  service,
  maintenant,
  annulation,
}: {
  course: CourseOperations;
  commande: CommandeOperations;
  service: string | null | undefined;
  maintenant: Date;
  annulation: React.ReactNode;
}) {
  const [fenetre, setFenetre] = useState(false);
  const membre = useAuthStore((s) => s.user);
  const commandes = useCommandesDeCourse(course.id);
  const suivies = commandes.length > 0 ? (commandes as unknown as CommandeOperations[]) : [commande];
  const { etat } = useEtatCourseLivreur(course, suivies, service, maintenant);
  const retenue = ligneRetenue(course, maintenant);
  const bouton = peutConfirmerRecuperation(membre) && (!!course.deliverer_id || !!course.turbo_escalated_at);

  return (
    <div className="space-y-2">
      <EtatCourseLivreur course={course} commandes={suivies} service={service} maintenant={maintenant} compact />
      {retenue && (
        <p className="truncate text-xs font-semibold text-amber-700" title={retenue}>
          {retenue}
        </p>
      )}
      {bouton && (
        <BoutonConfirmerRecuperation auRestaurant={etat.etat === "AU_COMPTOIR"} onClick={() => setFenetre(true)} />
      )}
      {annulation}
      {fenetre && (
        <FenetreRecuperation
          course={course}
          commandes={commandes.length > 0 ? commandes : [commande]}
          onClose={() => setFenetre(false)}
        />
      )}
    </div>
  );
}

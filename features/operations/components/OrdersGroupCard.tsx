"use client";

import React, { useState } from "react";

import { OrderStatus, OrderType, type Order } from "../../orders/types/order.types";
import { useAuthStore } from "../../users/hook/authStore";
import type { IGroupeLivreur, IOrderGroup } from "../types/operations.types";
import { peutConfirmerRecuperation } from "../utils/code-retrait";
import { isOrderLate, quelquUnARemettre } from "../utils/group-orders";
import { courseDeCommande, type CommandeOperations, type CourseOperations } from "../utils/suivi-course";
import { OperationsCard } from "./OperationsCard";
import { PickupValidationModal } from "./PickupValidationModal";
import { BandeauCourse } from "./course/BandeauCourse";
import { EtatCourseLivreur } from "./course/EtatCourseLivreur";

/** Cadre orange d'un groupe : course au restaurant, livreur hors restaurant. */
const CADRE_GROUPE =
  "rounded-3xl border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50/40 p-3 space-y-2 shadow-sm";

interface Props {
  group: IOrderGroup;
  onCardClick: (order: Order) => void;
  onPayClick?: (order: Order) => void;
  /** Toutes les commandes affichées (état du livreur, livraisons commencées). */
  commandes?: readonly Order[];
  /** Heure courante, relue régulièrement par la page (retenues, départ). */
  maintenant?: Date;
}

/**
 * Commandes prêtes d'une même course. Planificateur v2 : la course naît dès
 * qu'une commande est prête, souvent avec une seule commande. Toute course a
 * donc son en-tête (code de retrait en grand, livreur et son état, retenue),
 * quel que soit son nombre de commandes. Une commande sans course reste une
 * carte seule, comme avant.
 *
 * « Confirmer la récupération » (demande du 24/10 au soir, plus de saisie du
 * code) : pour les rôles admis par le serveur, dès qu'un livreur a accepté
 * ou que Turbo a la course. Il ouvre la fenêtre « Récupération · code ».
 */
export const OrdersGroupCard: React.FC<Props> = ({ group, onCardClick, onPayClick, commandes, maintenant }) => {
  const [aRemettre, setARemettre] = useState<CourseOperations | null>(null);
  const membre = useAuthStore((s) => s.user);

  if (group.courseId === null) {
    return (
      <>
        {group.orders.map((o) => (
          <OperationsCard
            key={o.id}
            order={o}
            onClick={() => onCardClick(o)}
            onPayClick={onPayClick ? () => onPayClick(o) : undefined}
          />
        ))}
      </>
    );
  }

  const plusieurs = group.orders.length > 1;
  const toutes = commandes ?? group.orders;
  const course = group.orders.map((o) => courseDeCommande(o as unknown as CommandeOperations)).find(Boolean) ?? null;
  const peutConfirmer = peutConfirmerRecuperation(membre) && quelquUnARemettre(course);

  return (
    <div className={CADRE_GROUPE}>
      <BandeauCourse
        group={group}
        commandes={toutes as unknown as CommandeOperations[]}
        maintenant={maintenant ?? new Date()}
        onConfirmer={peutConfirmer ? setARemettre : undefined}
      />

      <div className="space-y-2">
        {group.orders.map((o) => (
          <OperationsCard
            key={o.id}
            order={o}
            onClick={() => onCardClick(o)}
            onPayClick={onPayClick ? () => onPayClick(o) : undefined}
            // Plusieurs commandes : le groupe porte l'état ; une seule, elle garde son minuteur.
            hideUrgencyRing={plusieurs}
          />
        ))}
      </div>

      {aRemettre && (
        <PickupValidationModal
          course={aRemettre}
          commandes={toutes}
          restaurantNom={group.orders[0]?.restaurant?.name ?? null}
          onClose={() => setARemettre(null)}
        />
      )}
    </div>
  );
};

interface PropsLivreur {
  group: IGroupeLivreur;
  onCardClick: (order: Order) => void;
  onPayClick?: (order: Order) => void;
  /** Toutes les commandes affichées (état du livreur, livraisons commencées). */
  commandes: readonly Order[];
  maintenant: Date;
}

/**
 * Commandes « Hors restaurant » d'un même livreur (demande du 24/10), avec
 * la même présentation que le groupe d'une course au restaurant : même
 * cadre orange, même ligne du livreur et de son état (« Koffi · Parti à
 * 12 h 45 », « Course terminée », « Confiée à Turbo »), mêmes cartes en
 * dessous. Chaque carte garde son minuteur (temps depuis la sortie de CETTE
 * commande) et sa pastille « En retard ». Une commande sans livreur reste
 * une carte seule, avec la ligne du livreur d'avant s'il y en a une.
 */
export const GroupeLivreurCard: React.FC<PropsLivreur> = ({ group, onCardClick, onPayClick, commandes, maintenant }) => {
  const suivies = commandes as unknown as CommandeOperations[];

  if (!group.course) {
    return (
      <>
        {group.orders.map((o) => {
          const course =
            o.type === OrderType.DELIVERY && o.status === OrderStatus.PICKED_UP
              ? courseDeCommande(o as unknown as CommandeOperations)
              : null;
          return (
            <OperationsCard
              key={o.id}
              order={o}
              onClick={() => onCardClick(o)}
              onPayClick={onPayClick ? () => onPayClick(o) : undefined}
              showWarningBadge={isOrderLate(o)}
              warningLabel="En retard"
              extra={
                course ? (
                  <EtatCourseLivreur
                    course={course}
                    commandes={suivies}
                    service={o.delivery_service}
                    maintenant={maintenant}
                    compact
                  />
                ) : undefined
              }
            />
          );
        })}
      </>
    );
  }

  return (
    <div className={CADRE_GROUPE}>
      <div className="px-1 pt-1">
        <EtatCourseLivreur
          course={group.course}
          commandes={suivies}
          service={group.deliveryService}
          maintenant={maintenant}
        />
      </div>

      <div className="space-y-2">
        {group.orders.map((o) => (
          <OperationsCard
            key={o.id}
            order={o}
            onClick={() => onCardClick(o)}
            onPayClick={onPayClick ? () => onPayClick(o) : undefined}
            showWarningBadge={isOrderLate(o)}
            warningLabel="En retard"
          />
        ))}
      </div>
    </div>
  );
};

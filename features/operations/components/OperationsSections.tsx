"use client";

import React, { useMemo, useState } from "react";
import { AlertTriangle, ChefHat, PackageCheck, Truck } from "lucide-react";

import { useDashboardStore } from "@/store/dashboardStore";
// ⚠️ Import RELATIF entre features : `@/` pointe sur src/, `features/` est à la racine.
import { useDroitsCommande } from "../../orders/hooks/useDroitsCommande";
import { type Order, OrderStatus } from "../../orders/types/order.types";
import { useAuthStore } from "../../users/hook/authStore";
import { UserType } from "../../users/types/user.types";
import { useMaintenant } from "../hooks/use-maintenant";
import type { IOperationsBuckets, IOrderGroup } from "../types/operations.types";
import { getUrgencyLevel } from "../utils/card-urgency";
import { peutConfirmerRecuperation } from "../utils/code-retrait";
import {
  commandesAuRestaurantDeLaCourse,
  groupesRetenusSansCommandePrete,
  isOrderLate,
  ordonnerGroupesPretes,
} from "../utils/group-orders";
import { groupesHorsRestaurant, type CommandeHors } from "../utils/groupes-hors-restaurant";
import { attentesParCommande, type CommandeOperations, type CourseOperations } from "../utils/suivi-course";
import { FenetreRecuperation } from "./FenetreRecuperation";
import { GroupeLivreurCard } from "./GroupeLivreurCard";
import { OperationsCard, OperationsCardSquelette } from "./OperationsCard";
import { OrdersGroupCard } from "./OrdersGroupCard";

/**
 * Ordre d'« En cuisine » : nouvelles (PENDING, ACCEPTED) puis en
 * préparation, les plus anciennes d'abord.
 */
function statusOrder(status: OrderStatus): number {
  if (status === OrderStatus.PENDING || status === OrderStatus.ACCEPTED) return 0;
  if (status === OrderStatus.IN_PROGRESS) return 1;
  return 2;
}

type Onglet = "au_restaurant" | "hors_restaurant";

interface Props {
  buckets: IOperationsBuckets;
  onCardClick: (order: Order) => void;
  /** « Encaisser 8.000 F » : ouvre le tiroir sur Paiement. */
  onPayClick: (order: Order) => void;
}

/**
 * Onglet « En cours » de l'écran Commandes (demande du 24/10 au soir) :
 * « qu'est-ce que je dois préparer, remettre ou encaisser maintenant, et qui
 * porte quoi dehors ? ».
 *
 *  - grand écran : trois colonnes, En cuisine, Prêtes, Hors restaurant ;
 *  - écran moyen : deux colonnes sans changer l'ordre des éléments, Prêtes
 *    au-dessus d'En cuisine à gauche, Hors restaurant à droite ;
 *  - petit écran : deux onglets comme la caisse, « Au restaurant » (Prêtes
 *    puis En cuisine) et « Hors restaurant ».
 *
 * En-tête de colonne : titre, nombre de commandes, pastille rouge des
 * retards. En cuisine : minuteur rouge (même règle que la carte et que la
 * caisse : `isOrderLate` ne vise que les commandes prêtes ou livrées).
 */
export const OperationsSections: React.FC<Props> = ({ buckets, onCardClick, onPayClick }) => {
  const { aPreparer, pretesGroupes, recuperees } = buckets;
  const [onglet, setOnglet] = useState<Onglet>("au_restaurant");
  const [aRemettre, setARemettre] = useState<CourseOperations | null>(null);

  const membre = useAuthStore((s) => s.user);
  const { peutModifier } = useDroitsCommande();
  const restaurantChoisi = useDashboardStore((s) => s.selectedRestaurantId);
  // Compte du siège sur « Tous » : le restaurant en tête de chaque carte et groupe.
  const surTous = membre?.type === UserType.BACKOFFICE && !restaurantChoisi;
  const peutConfirmer = peutConfirmerRecuperation(membre);

  // Retenues qui échoient, livreur réputé parti, offres expirées : l'heure est
  // relue toutes les 15 s, en plus des événements.
  const maintenant = useMaintenant(15_000);

  const pretesOrders = useMemo<Order[]>(() => pretesGroupes.flatMap((g) => g.orders), [pretesGroupes]);
  const toutes = useMemo<Order[]>(
    () => [...aPreparer, ...pretesOrders, ...recuperees],
    [aPreparer, pretesOrders, recuperees],
  );
  const commandesSuivi = toutes as unknown as CommandeOperations[];
  const attentes = useMemo(() => attentesParCommande(commandesSuivi, maintenant), [commandesSuivi, maintenant]);

  const enCuisine = useMemo<Order[]>(
    () =>
      [...aPreparer].sort((a, b) => {
        const diff = statusOrder(a.status) - statusOrder(b.status);
        if (diff !== 0) return diff;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }),
    [aPreparer],
  );

  const groupesPretes = useMemo<IOrderGroup[]>(
    () =>
      ordonnerGroupesPretes(
        [...pretesGroupes, ...groupesRetenusSansCommandePrete(toutes, pretesGroupes, maintenant)],
        { maintenant, commandes: toutes },
      ),
    [pretesGroupes, toutes, maintenant],
  );

  const groupesHors = useMemo(
    () =>
      groupesHorsRestaurant(recuperees as unknown as CommandeHors[], {
        maintenant,
        toutes: commandesSuivi,
        avecRestaurant: surTous,
      }),
    [recuperees, commandesSuivi, maintenant, surTous],
  );

  const retardsCuisine = aPreparer.filter((o) => getUrgencyLevel(o) === "danger").length;
  const retardsPretes = pretesOrders.filter(isOrderLate).length;
  const retardsHors = recuperees.filter(isOrderLate).length;
  const auRestaurant = aPreparer.length + pretesOrders.length;

  if (auRestaurant + recuperees.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-center">
        <div>
          <PackageCheck className="mx-auto mb-3 h-12 w-12 text-gray-300" />
          <p className="text-sm text-gray-500">Aucune commande en cours</p>
        </div>
      </div>
    );
  }

  const restaurantDe = (o: Order | undefined): string | null => (surTous ? o?.restaurant?.name ?? null : null);
  const deLaCourse = (courseId: string | null | undefined) =>
    toutes.filter((o) => !!courseId && (o as unknown as CommandeOperations).delivery?.course?.id === courseId);
  // Fenêtre de récupération : toutes les commandes de la course à l'écran (y compris déjà remises).
  const commandesFenetre = aRemettre ? deLaCourse(aRemettre.id) : [];

  return (
    <div className="space-y-3">
      <OngletsPetitEcran
        onglet={onglet}
        onChange={setOnglet}
        auRestaurant={auRestaurant}
        horsRestaurant={recuperees.length}
      />

      {/* Écran moyen : Hors restaurant couvre les deux rangées. Rangées `auto 1fr` :
          seule la seconde grandit quand Hors restaurant est plus haute que Prêtes et
          En cuisine réunies, pas de trou sous Prêtes. */}
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2 lg:grid-rows-[auto_1fr] xl:grid-cols-3 xl:grid-rows-none">
        {/* En cuisine : à gauche en bas sur écran moyen, première colonne sur grand écran. */}
        <Colonne
          Icon={ChefHat}
          title="En cuisine"
          count={aPreparer.length}
          lateCount={retardsCuisine}
          accent="amber"
          className={`${onglet === "au_restaurant" ? "order-2 flex" : "hidden"} lg:order-none lg:flex lg:col-start-1 lg:row-start-2 xl:col-start-1 xl:row-start-1`}
        >
          {enCuisine.length === 0 ? (
            <Vide message="Rien en cuisine" />
          ) : (
            enCuisine.map((o) => (
              <OperationsCard
                key={o.id}
                order={o}
                onClick={() => onCardClick(o)}
                maintenant={maintenant}
                restaurant={restaurantDe(o)}
                attente={attentes.get(o.id)?.texte ?? null}
              />
            ))
          )}
        </Colonne>

        {/* Prêtes : à gauche en haut sur écran moyen, au milieu sur grand écran. */}
        <Colonne
          Icon={PackageCheck}
          title="Prêtes"
          count={pretesOrders.length}
          lateCount={retardsPretes}
          accent="green"
          className={`${onglet === "au_restaurant" ? "order-1 flex" : "hidden"} lg:order-none lg:flex lg:col-start-1 lg:row-start-1 xl:col-start-2 xl:row-start-1`}
        >
          {groupesPretes.length === 0 ? (
            <Vide message="Aucune commande prête" />
          ) : (
            groupesPretes.map((g) =>
              g.course ? (
                <OrdersGroupCard
                  key={g.key}
                  group={g as IOrderGroup & { course: CourseOperations }}
                  lignes={commandesAuRestaurantDeLaCourse(g.course.id, toutes)}
                  commandes={toutes}
                  maintenant={maintenant}
                  onCardClick={onCardClick}
                  peutConfirmer={peutConfirmer}
                  onConfirmer={setARemettre}
                  restaurant={restaurantDe(g.orders[0] ?? deLaCourse(g.courseId)[0])}
                />
              ) : (
                g.orders.map((o) => (
                  <OperationsCard
                    key={o.id}
                    order={o}
                    onClick={() => onCardClick(o)}
                    maintenant={maintenant}
                    restaurant={restaurantDe(o)}
                  />
                ))
              ),
            )
          )}
        </Colonne>

        {/* Hors restaurant : à droite sur les deux rangées sur écran moyen, troisième colonne sur grand écran. */}
        <Colonne
          Icon={Truck}
          title="Hors restaurant"
          count={recuperees.length}
          lateCount={retardsHors}
          accent="purple"
          className={`${onglet === "hors_restaurant" ? "flex" : "hidden"} lg:flex lg:col-start-2 lg:row-start-1 lg:row-span-2 xl:col-start-3 xl:row-span-1`}
        >
          {groupesHors.length === 0 ? (
            <Vide message="Aucune commande hors restaurant" />
          ) : (
            groupesHors.map((g) => (
              <GroupeLivreurCard
                key={g.cle}
                groupe={g}
                onOuvrir={onCardClick}
                onEncaisser={onPayClick}
                peutEncaisser={peutModifier}
              />
            ))
          )}
        </Colonne>
      </div>

      {aRemettre && (
        <FenetreRecuperation
          course={aRemettre}
          commandes={commandesFenetre}
          restaurantNom={commandesFenetre[0]?.restaurant?.name ?? null}
          onClose={() => setARemettre(null)}
        />
      )}
    </div>
  );
};

/** Chargement : trois cartes grises de la hauteur exacte d'une carte, par colonne. */
export const OperationsSectionsSquelette: React.FC = () => (
  <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2 xl:grid-cols-3" aria-busy="true">
    {[0, 1, 2].map((colonne) => (
      <div
        key={colonne}
        className={`flex-col gap-2 rounded-2xl border border-gray-200 bg-white p-3 ${colonne === 0 ? "flex" : "hidden lg:flex"}`}
      >
        <div className="mb-1 h-8 w-40 animate-pulse rounded-lg bg-gray-100" />
        {[0, 1, 2].map((carte) => (
          <OperationsCardSquelette key={carte} />
        ))}
      </div>
    ))}
  </div>
);

// ============================================================================
// Pièces de la page
// ============================================================================

/** Petit écran : deux onglets, comme la caisse. */
function OngletsPetitEcran({
  onglet,
  onChange,
  auRestaurant,
  horsRestaurant,
}: {
  onglet: Onglet;
  onChange: (onglet: Onglet) => void;
  auRestaurant: number;
  horsRestaurant: number;
}) {
  const onglets: { cle: Onglet; libelle: string; nombre: number }[] = [
    { cle: "au_restaurant", libelle: "Au restaurant", nombre: auRestaurant },
    { cle: "hors_restaurant", libelle: "Hors restaurant", nombre: horsRestaurant },
  ];
  return (
    <div className="flex gap-1 rounded-[14px] bg-[#f4f4f5] p-1 lg:hidden">
      {onglets.map((o) => {
        const actif = onglet === o.cle;
        return (
          <button
            key={o.cle}
            type="button"
            onClick={() => onChange(o.cle)}
            className={`inline-flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-[11px] text-[13px] font-bold ${
              actif ? "bg-white text-gray-900 shadow-sm" : "text-[#71717A]"
            }`}
          >
            {o.libelle}
            <span className={`text-xs tabular-nums ${actif ? "text-[#F17922]" : "text-gray-400"}`}>{o.nombre}</span>
          </button>
        );
      })}
    </div>
  );
}

type Accent = "amber" | "green" | "purple";

const ACCENT_ICON: Record<Accent, string> = {
  amber: "bg-amber-500 text-white",
  green: "bg-green-600 text-white",
  purple: "bg-purple-600 text-white",
};

function Colonne({
  Icon,
  title,
  count,
  lateCount,
  accent,
  className,
  children,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  title: string;
  count: number;
  lateCount: number;
  accent: Accent;
  className: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`flex-col overflow-hidden rounded-2xl border border-gray-200 bg-gray-50/60 ${className}`}>
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${ACCENT_ICON[accent]}`}>
            <Icon className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-bold text-gray-900">{title}</h3>
          <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-full border border-gray-200 bg-white px-2 text-xs font-bold text-gray-700">
            {count}
          </span>
        </div>
        {lateCount > 0 && (
          <span
            title={`${lateCount} commande${lateCount > 1 ? "s" : ""} en retard`}
            className="inline-flex h-6 items-center gap-1 rounded-full bg-red-600 px-2 text-[11px] font-bold text-white"
          >
            <AlertTriangle className="h-3 w-3" />
            {lateCount}
          </span>
        )}
      </header>
      <div className="flex flex-col gap-2 p-3">{children}</div>
    </section>
  );
}

function Vide({ message }: { message: string }) {
  return (
    <div className="flex min-h-[92px] items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white text-center">
      <p className="text-sm text-gray-400">{message}</p>
    </div>
  );
}

"use client";

import { Map as IconeCarte } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import DashboardPageHeader from "@/components/ui/DashboardPageHeader";
import { useDashboardStore } from "@/store/dashboardStore";

import { BandeauRestaurants } from "../../../../features/courses/components/BandeauRestaurants";
import { useTableauLivraisonQuery } from "../../../../features/courses/queries/tableau-livraison.query";
import type { SignalLivraison } from "../../../../features/courses/types/tableau-livraison.types";
import { estRouteAbsente, peutLireTableau } from "../../../../features/courses/utils/tableau-livraison";
import { CarteEnDirect, type RestaurantSurCarte } from "../../../../features/livreurs/components/CarteEnDirect";
import { ListeAlertes } from "../../../../features/livreurs/components/ListeAlertes";
import { ListeEnDirect } from "../../../../features/livreurs/components/ListeEnDirect";
import { useMaintenant } from "../../../../features/livreurs/hook/use-maintenant";
import { useDelivererLiveLocationsQuery } from "../../../../features/livreurs/queries/deliverer-live.query";
import {
  alertesEnDirect,
  cibleDuSignal,
  groupesEnDirect,
  positionValable,
} from "../../../../features/livreurs/utils/groupes-en-direct";
import { useDelivererLiveSync } from "../../../../features/maps/hooks/use-deliverer-live-socket";
import type { PositionGps } from "../../../../features/operations/utils/suivi-course";
import { useRestaurantListQuery } from "../../../../features/restaurants/queries/restaurant-list.query";
import { nomCourtRestaurant } from "../../../../features/restaurants/utils/nom-court";
import { useAuthStore } from "../../../../features/users/hook/authStore";

/**
 * En direct (conception du 24/10, section 9) : qu'est-ce qui ne va pas en ce
 * moment, et où sont les livreurs ? Admin et suivi des livraisons (droit
 * LIVREURS READ, menu Livraison). Aucun geste ici : les gestes sont dans les
 * fiches (course, livreur).
 *
 *  - bandeau des restaurants, qui sert de filtre (le même que Commandes,
 *    Courses et Livreurs) ;
 *  - à gauche (380 px) : « À surveiller », les alertes du serveur, puis
 *    « Livreurs », groupés par état ;
 *  - à droite : la carte, sur toute la hauteur de la fenêtre. Sous `lg`, elle
 *    passe sous la liste, derrière « Voir la carte ».
 *
 * Toucher un livreur (ligne, marqueur, alerte qui le nomme) le choisit : la
 * carte se centre et ouvre sa fenêtre. Une alerte sans livreur à montrer
 * ouvre la fiche de la course. Une pastille de la ligne Livreurs de
 * Commandes ouvre cet écran sur son livreur (`pendingEnDirectLivreurId`).
 *
 * Serveur pas encore à jour : sans `GET /livraison/tableau`, ni « À
 * surveiller » ni bandeau (les onglets des restaurants gardent le filtre) ;
 * sans les champs nouveaux de live-locations, les heures et la place dans la
 * file restent vides.
 */

const GRAND_ECRAN = "(min-width: 1024px)";

/** Écran `lg` et plus : la carte est toujours montée à côté de la liste. */
function useGrandEcran(): boolean {
  const [grand, setGrand] = useState(
    () => typeof window !== "undefined" && window.matchMedia(GRAND_ECRAN).matches,
  );
  useEffect(() => {
    const requete = window.matchMedia(GRAND_ECRAN);
    const suivre = () => setGrand(requete.matches);
    suivre();
    requete.addEventListener("change", suivre);
    return () => requete.removeEventListener("change", suivre);
  }, []);
  return grand;
}

export default function EnDirect() {
  // Positions en direct : chaque position reçue déplace le marqueur sans relire la liste.
  useDelivererLiveSync();

  const selectedRestaurantId = useDashboardStore((s) => s.selectedRestaurantId);
  const openCourse = useDashboardStore((s) => s.openCourse);
  const openLivreur = useDashboardStore((s) => s.openLivreur);
  const clearPendingEnDirect = useDashboardStore((s) => s.clearPendingEnDirect);
  const membre = useAuthStore((s) => s.user);
  const maintenant = useMaintenant(30_000);
  const grandEcran = useGrandEcran();
  // Venu d'une pastille de la ligne Livreurs (Commandes) : ce livreur est
  // choisi dès l'ouverture (l'écran est monté par ce changement d'onglet).
  const [demande] = useState(() => useDashboardStore.getState().pendingEnDirectLivreurId);
  const [choix, setChoix] = useState<{ id: string; n: number } | null>(() => (demande ? { id: demande, n: 1 } : null));
  const [carteOuverte, setCarteOuverte] = useState(
    () => !!demande && typeof window !== "undefined" && !window.matchMedia(GRAND_ECRAN).matches,
  );
  const carteRef = useRef<HTMLDivElement>(null);

  // Demande lue une fois ; petit écran : la carte, ouverte sous la liste, vient à l'écran.
  useEffect(() => {
    if (!demande) return;
    clearPendingEnDirect();
    if (!window.matchMedia(GRAND_ECRAN).matches) {
      window.requestAnimationFrame(() => carteRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  }, [demande, clearPendingEnDirect]);

  const livreursQuery = useDelivererLiveLocationsQuery({
    restaurantId: selectedRestaurantId ?? undefined,
    includeOffline: true,
  });
  const tableauQuery = useTableauLivraisonQuery();
  const { data: restaurantsData } = useRestaurantListQuery({ limit: 100 });

  const restaurants = useMemo<RestaurantSurCarte[]>(() => {
    const liste: RestaurantSurCarte[] = [];
    for (const r of restaurantsData?.data ?? []) {
      if (r.entity_status === "DELETED") continue;
      const position = positionValable({ lat: r.latitude, lng: r.longitude });
      if (position) liste.push({ id: r.id, nom: r.name, position });
    }
    return liste;
  }, [restaurantsData]);

  const coordonneesRestaurants = useMemo(
    () => new Map<string, PositionGps>(restaurants.map((r) => [r.id, r.position])),
    [restaurants],
  );

  const sections = useMemo(
    () =>
      groupesEnDirect(livreursQuery.data ?? [], {
        maintenant,
        unSeulRestaurant: !!selectedRestaurantId,
        coordonneesRestaurants,
      }),
    [livreursQuery.data, maintenant, selectedRestaurantId, coordonneesRestaurants],
  );
  const lignes = useMemo(() => sections.flatMap((s) => s.lignes), [sections]);
  const presents = useMemo(() => new Set(lignes.map((l) => l.id)), [lignes]);

  // « À surveiller » : absent pour un compte que la route refuserait, et
  // tant que le serveur n'a pas la route (404) ou qu'il ne répond pas.
  const tableau = tableauQuery.data;
  const avecAlertes =
    peutLireTableau(membre) && !estRouteAbsente(tableauQuery.error) && (!!tableau || tableauQuery.isPending);
  const signaux = useMemo(
    () => (tableau ? alertesEnDirect(tableau.signaux, selectedRestaurantId) : null),
    [tableau, selectedRestaurantId],
  );
  const nomsRestaurants = useMemo(
    () =>
      selectedRestaurantId
        ? null
        : new Map((tableau?.restaurants ?? []).map((r) => [r.id, nomCourtRestaurant(r.nom) ?? r.nom])),
    [tableau, selectedRestaurantId],
  );

  // Livreur choisi qui n'est plus dans la liste (autre restaurant) : plus de choix.
  const choisi = choix?.id ?? null;
  const choisiAbsent = !!choisi && !!livreursQuery.data && !presents.has(choisi);
  useEffect(() => {
    if (choisiAbsent) setChoix(null);
  }, [choisiAbsent]);

  const choisir = useCallback(
    (livreurId: string) => {
      setChoix((c) => ({ id: livreurId, n: (c?.n ?? 0) + 1 }));
      if (!grandEcran) {
        // Petit écran : la carte s'ouvre sous la liste et vient à l'écran.
        setCarteOuverte(true);
        window.requestAnimationFrame(() =>
          carteRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
        );
      }
    },
    [grandEcran],
  );

  const toucherAlerte = useCallback(
    (s: SignalLivraison) => {
      const cible = cibleDuSignal(s, presents);
      if (!cible) return;
      if (cible.type === "livreur") choisir(cible.id);
      else if (cible.type === "course") openCourse(cible.id);
      else openLivreur(cible.id);
    },
    [presents, choisir, openCourse, openLivreur],
  );

  const centreRestaurant = selectedRestaurantId ? (coordonneesRestaurants.get(selectedRestaurantId) ?? null) : null;
  const restaurantsSurCarte = selectedRestaurantId
    ? restaurants.filter((r) => r.id === selectedRestaurantId)
    : restaurants;
  const carteMontee = grandEcran || carteOuverte;

  return (
    <div className="flex flex-col gap-4 p-4 lg:h-[calc(100dvh-3.5rem)]">
      <DashboardPageHeader mode="list" title="En direct" />
      <BandeauRestaurants className="shrink-0" />

      <div className="flex flex-col gap-4 lg:grid lg:min-h-[520px] lg:flex-1 lg:grid-cols-[380px_minmax(0,1fr)]">
        <div className="min-w-0 overflow-hidden rounded-xl border border-[#E4E4E7] bg-white lg:min-h-0 lg:overflow-y-auto">
          {avecAlertes && (
            <div className="border-b border-[#F4F4F5]">
              <ListeAlertes
                signaux={signaux}
                nomsRestaurants={nomsRestaurants}
                maintenant={maintenant}
                onToucher={toucherAlerte}
              />
            </div>
          )}
          <ListeEnDirect
            sections={sections}
            choisi={choisi}
            onChoisir={choisir}
            chargement={livreursQuery.isPending}
            erreur={livreursQuery.isError}
            onReessayer={() => void livreursQuery.refetch()}
            reessaiEnCours={livreursQuery.isFetching}
          />
        </div>

        <div ref={carteRef} className="min-w-0 scroll-mt-16 lg:min-h-0">
          <button
            type="button"
            onClick={() => setCarteOuverte((v) => !v)}
            aria-expanded={carteOuverte}
            className="mb-3 inline-flex items-center gap-1.5 rounded-lg border border-[#E4E4E7] bg-white px-3 py-2 text-sm font-semibold text-[#18181B] hover:bg-[#FAFAFA] lg:hidden"
          >
            <IconeCarte className="h-4 w-4 text-[#F17922]" />
            {carteOuverte ? "Masquer la carte" : "Voir la carte"}
          </button>
          {carteMontee && (
            <div className="h-[480px] lg:h-full">
              <CarteEnDirect
                lignes={lignes}
                choix={choix}
                onChoisir={choisir}
                onFermer={() => setChoix(null)}
                restaurants={restaurantsSurCarte}
                centreRestaurant={centreRestaurant}
                maintenant={maintenant}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

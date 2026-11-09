"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Check, ShieldAlert, Store } from "lucide-react";

import ModalShell from "./ModalShell";
import {
  useAssignRestaurant,
  useForceActivateLivreur,
  useValidateLivreur,
} from "../../../../features/livreurs/hook/use-livreurs";
import {
  distanceDeChezLui,
  restaurantPropose,
  restaurantsParProximite,
} from "../../../../features/livreurs/utils/rattachement";
import { getAllRestaurants, Restaurant } from "@/services/restaurantService";

/**
 * « affecter » : changer de restaurant. « valider » : valider le livreur avec
 * son restaurant, en un geste (09/11). « forcer » : l'activer sans documents,
 * avec son restaurant.
 */
export type GesteRestaurant = "affecter" | "valider" | "forcer";

interface AssignRestaurantModalProps {
  isOpen: boolean;
  onClose: () => void;
  livreurId: string;
  livreurNom: string;
  currentRestaurantId?: string | null;
  /** Nom du restaurant actuel, pour le message après le changement. */
  currentRestaurantName?: string | null;
  /** Domicile du livreur : les restaurants du plus proche au plus loin. */
  domicile?: { lat: number; lng: number } | null;
  geste?: GesteRestaurant;
}

type RestaurantActif = Restaurant & { id: string };

const TITRES: Record<GesteRestaurant, string> = {
  affecter: "Affecter un restaurant",
  valider: "Valider le livreur",
  forcer: "Forcer l'activation",
};

const BOUTONS: Record<GesteRestaurant, { repos: string; envoi: string }> = {
  affecter: { repos: "Affecter", envoi: "Affectation…" },
  valider: { repos: "Valider", envoi: "Validation…" },
  forcer: { repos: "Activer", envoi: "Activation…" },
};

const AssignRestaurantModal: React.FC<AssignRestaurantModalProps> = ({
  isOpen,
  onClose,
  livreurId,
  livreurNom,
  currentRestaurantId,
  currentRestaurantName,
  domicile,
  geste = "affecter",
}) => {
  const [restaurants, setRestaurants] = useState<RestaurantActif[]>([]);
  const [selectedId, setSelectedId] = useState<string>(currentRestaurantId ?? "");
  const [loading, setLoading] = useState(false);
  const affecter = useAssignRestaurant();
  const valider = useValidateLivreur();
  const forcer = useForceActivateLivreur();
  const isPending = affecter.isPending || valider.isPending || forcer.isPending;

  const classes = useMemo(() => restaurantsParProximite(restaurants, domicile), [restaurants, domicile]);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedId(currentRestaurantId ?? "");
    setLoading(true);
    getAllRestaurants()
      .then((data) => setRestaurants(data.filter((r): r is RestaurantActif => !!r.active && !!r.id)))
      .finally(() => setLoading(false));
  }, [isOpen, currentRestaurantId]);

  // Choix de départ : son restaurant, sinon le plus proche de chez lui.
  const choisi = selectedId || restaurantPropose(classes, currentRestaurantId);

  const handleConfirm = () => {
    if (!choisi) return;
    const selectedId = choisi;
    const nouveauNom = restaurants.find((r) => r.id === selectedId)?.name ?? null;
    if (geste === "affecter") {
      affecter.mutate(
        { id: livreurId, payload: { restaurant_id: selectedId }, ancienNom: currentRestaurantName, nouveauNom },
        { onSuccess: onClose },
      );
      return;
    }
    const mutation = geste === "valider" ? valider : forcer;
    mutation.mutate({ id: livreurId, restaurantId: selectedId, nomRestaurant: nouveauNom }, { onSuccess: onClose });
  };

  const icone =
    geste === "affecter" ? (
      <Store className="w-5 h-5 text-[#F17922]" />
    ) : geste === "valider" ? (
      <Check className="w-5 h-5 text-[#22C55E]" />
    ) : (
      <ShieldAlert className="w-5 h-5 text-amber-600" />
    );

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title={TITRES[geste]} icon={icone}>
      {geste === "affecter" ? (
        <p className="text-sm text-[#52525B] mb-4">
          Choisissez le restaurant auquel affecter <strong>{livreurNom}</strong>. Le livreur recevra
          les courses de ce restaurant et rejoindra son planning dès le prochain créneau.
        </p>
      ) : (
        <p className="text-sm text-[#52525B] mb-4">
          Choisissez le restaurant de <strong>{livreurNom}</strong>. Il sera rattaché à ce restaurant
          et ajouté à son planning dès le prochain créneau.
        </p>
      )}
      {geste === "forcer" && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
          Ses pièces justificatives manquent : vérifiez son identité par un autre moyen avant de l&apos;activer.
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#F17922]" />
        </div>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {classes.map(({ restaurant: r, distanceKm }) => {
            const isSelected = choisi === r.id;
            const distance = distanceDeChezLui(distanceKm);
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setSelectedId(r.id)}
                className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                  isSelected
                    ? "border-[#F17922] bg-[#FFF7F2]"
                    : "border-[#E4E4E7] hover:border-[#F17922]/50 hover:bg-[#FAFAFA]"
                }`}
              >
                <div className="font-semibold text-sm text-[#18181B]">{r.name}</div>
                {r.address && <div className="text-xs text-[#71717A] mt-0.5">{r.address}</div>}
                {distance && <div className="text-xs text-[#F17922] mt-0.5">{distance}</div>}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex justify-end gap-2 mt-6">
        <button
          type="button"
          onClick={onClose}
          disabled={isPending}
          className="px-4 py-2 text-sm font-medium text-[#52525B] rounded-lg hover:bg-[#F4F4F5] disabled:opacity-50"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!choisi || (geste === "affecter" && choisi === currentRestaurantId) || isPending}
          className="px-4 py-2 text-sm font-semibold text-white bg-[#F17922] rounded-lg hover:bg-[#DC6718] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? BOUTONS[geste].envoi : BOUTONS[geste].repos}
        </button>
      </div>
    </ModalShell>
  );
};

export default AssignRestaurantModal;

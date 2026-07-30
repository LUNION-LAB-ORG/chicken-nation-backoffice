"use client";

import React, { useEffect, useMemo } from "react";
import { toast } from "react-hot-toast";
import {
  Banknote,
  Clock,
  MapPin,
  MapPinned,
  Navigation,
  StickyNote,
} from "lucide-react";

import { OrderFormData } from "../../types/order-form.types";
import { DeliveryService, OrderType } from "../../types/order.types";
import {
  getCurrentDate,
  getCurrentTime,
} from "../../../../utils/date/format-date";
import AddressSearchInput from "./AddressSearchInput";
import { getParsedAddress } from "../../utils/getParsedAddress";
import { useDeliveryFeeQuery } from "../../queries/delivery-fee.query";
import { useRestaurantListQuery } from "../../../restaurants/queries/restaurant-list.query";
import { useDirectionsQuery } from "../../../maps/queries/directions.query";
import {
  RouteMapCanvas,
  formatDistance,
  formatDuration,
} from "../../../maps/components/RouteMapCanvas";

interface DeliveryInfoSectionProps {
  formData: OrderFormData;
  onFormDataChange: (data: Partial<OrderFormData>) => void;
  /** Sous-total du panier → applique les offres de livraison à montant minimum dans l'aperçu. */
  orderAmount?: number;
}

const INPUT_CLASS =
  "w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-[13px] font-semibold text-[#595959] placeholder:font-normal placeholder:text-gray-400 focus:outline-none focus:border-[#F17922] focus:ring-2 focus:ring-[#F17922]/15 transition";

const LABEL_CLASS = "text-xs font-semibold text-gray-500 mb-1.5 block";

/** Convertit une coordonnée API (number | string | null) en nombre exploitable. */
function toCoord(value: unknown): number | null {
  const n = typeof value === "string" ? Number(value) : (value as number);
  return Number.isFinite(n) ? n : null;
}

/** Distance à vol d'oiseau (km) — suffisant pour comparer des restaurants. */
function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

function formatKm(km: number): string {
  return `${km.toFixed(1).replace(".", ",")} km`;
}

const DeliveryInfoSection: React.FC<DeliveryInfoSectionProps> = ({
  formData,
  onFormDataChange,
  orderAmount,
}) => {
  const isDelivery = formData.type === OrderType.DELIVERY;

  // Initialiser date et heure par défaut
  useEffect(() => {
    const update: Partial<OrderFormData> = {};
    if (!formData.date) update.date = getCurrentDate();
    if (!formData.time) update.time = getCurrentTime();
    if (Object.keys(update).length > 0) onFormDataChange(update);
  }, [formData.date, formData.time, onFormDataChange]);

  // Remettre delivery_fee à 0 quand le type change de DELIVERY → autre
  useEffect(() => {
    if (!isDelivery && formData.delivery_fee && formData.delivery_fee > 0) {
      onFormDataChange({ delivery_fee: 0 });
    }
  }, [isDelivery]);

  // Query frais de livraison
  const adresse = getParsedAddress(formData.address);
  const { data: deliveryFee } = useDeliveryFeeQuery(
    isDelivery && adresse
      ? {
          lat: adresse.latitude,
          long: adresse.longitude,
          restaurant_id: formData.restaurant_id || undefined,
          // Sous-total → le backend applique les offres à montant minimum dès l'aperçu.
          order_amount: orderAmount,
        }
      : undefined
  );

  // Auto-mettre à jour les frais de livraison quand la query retourne un nouveau résultat
  // (changement d'adresse ou de restaurant)
  useEffect(() => {
    if (isDelivery && deliveryFee?.montant !== undefined) {
      onFormDataChange({ delivery_fee: deliveryFee.montant });
    }
  }, [deliveryFee?.montant, isDelivery]);

  const handleAddressChange = (addressData: unknown) => {
    if (addressData) {
      onFormDataChange({ address: JSON.stringify(addressData) });
    } else {
      onFormDataChange({ address: "" });
    }
  };

  // ── Carte restaurant → adresse choisie ────────────────────────────────────
  // Même liste de restaurants que le sélecteur du haut (clé React Query
  // identique → aucune requête réseau supplémentaire).
  const { data: restaurantsData } = useRestaurantListQuery();
  const selectedRestaurant = useMemo(
    () =>
      restaurantsData?.data?.find((r) => r.id === formData.restaurant_id) ??
      null,
    [restaurantsData?.data, formData.restaurant_id]
  );

  const restoCoords = useMemo(() => {
    const lat = toCoord(selectedRestaurant?.latitude);
    const lng = toCoord(selectedRestaurant?.longitude);
    return lat !== null && lng !== null ? { lat, lng } : null;
  }, [selectedRestaurant?.latitude, selectedRestaurant?.longitude]);

  const clientCoords = useMemo(() => {
    if (!adresse) return null;
    const lat = toCoord(adresse.latitude);
    const lng = toCoord(adresse.longitude);
    return lat !== null && lng !== null ? { lat, lng } : null;
  }, [adresse?.latitude, adresse?.longitude]);

  // ── Restaurant le plus proche de l'adresse choisie ────────────────────────
  // Comportement historique du formulaire : l'adresse guide le choix du
  // restaurant. Aucun restaurant sélectionné → on prend le plus proche
  // automatiquement ; un restaurant déjà choisi mais nettement plus loin →
  // bannière de suggestion (le staff garde la main).
  const procheRestaurant = useMemo(() => {
    if (!clientCoords || !restaurantsData?.data?.length) return null;
    let best: { id: string; name: string; distanceKm: number } | null = null;
    for (const r of restaurantsData.data) {
      const lat = toCoord(r.latitude);
      const lng = toCoord(r.longitude);
      if (lat === null || lng === null) continue;
      const d = haversineKm(clientCoords, { lat, lng });
      if (!best || d < best.distanceKm) {
        best = { id: r.id, name: r.name, distanceKm: d };
      }
    }
    return best;
  }, [clientCoords, restaurantsData?.data]);

  const distanceSelection = useMemo(
    () =>
      restoCoords && clientCoords ? haversineKm(clientCoords, restoCoords) : null,
    [restoCoords, clientCoords]
  );

  // Auto-sélection : adresse choisie SANS restaurant → le plus proche.
  useEffect(() => {
    if (!isDelivery || !procheRestaurant || formData.restaurant_id) return;
    onFormDataChange({ restaurant_id: procheRestaurant.id });
    toast.success(
      `Restaurant le plus proche sélectionné : ${procheRestaurant.name} (${formatKm(procheRestaurant.distanceKm)})`
    );
  }, [isDelivery, procheRestaurant?.id, formData.restaurant_id]);

  // Suggestion : un autre restaurant est nettement plus proche (> 500 m d'écart).
  const suggestionProche =
    isDelivery &&
    procheRestaurant &&
    formData.restaurant_id &&
    procheRestaurant.id !== formData.restaurant_id &&
    distanceSelection !== null &&
    distanceSelection - procheRestaurant.distanceKm > 0.5
      ? procheRestaurant
      : null;

  // Distance / durée : MÊME clé de cache que la requête interne de la carte →
  // un seul appel Directions (proxy backend + Redis + React Query 10 min).
  const routeParams = useMemo(
    () =>
      restoCoords && clientCoords
        ? { origin: restoCoords, destination: clientCoords }
        : null,
    [restoCoords, clientCoords]
  );
  const { data: route } = useDirectionsQuery(isDelivery ? routeParams : null);

  const sectionTitle = isDelivery
    ? "Livraison"
    : formData.type === OrderType.PICKUP
      ? "Retrait"
      : "Service";
  const sectionSubtitle = isDelivery
    ? "Adresse, trajet depuis le restaurant et frais."
    : formData.type === OrderType.PICKUP
      ? "Date et heure de retrait au restaurant."
      : "Date et heure du service à table.";

  return (
    <div className="space-y-4">
      {/* En-tête de section */}
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-[#F17922]">
          <MapPinned className="w-4 h-4" />
        </span>
        <div>
          <h3 className="text-[15px] font-bold text-gray-800">{sectionTitle}</h3>
          <p className="text-xs text-gray-400">{sectionSubtitle}</p>
        </div>
      </div>

      {/* Adresse avec recherche Google Maps */}
      {isDelivery && (
        <AddressSearchInput
          value={adresse}
          onChange={handleAddressChange}
          placeholder="Rechercher votre adresse de livraison"
        />
      )}

      {/* Un restaurant plus proche existe pour cette adresse : suggestion,
          jamais d'écrasement silencieux du choix du staff. */}
      {suggestionProche && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5">
          <MapPin className="w-4 h-4 shrink-0 text-amber-500" />
          <p className="flex-1 text-xs text-amber-800">
            <span className="font-semibold">{suggestionProche.name}</span> est plus
            proche de cette adresse ({formatKm(suggestionProche.distanceKm)} contre{" "}
            {formatKm(distanceSelection!)}).
          </p>
          <button
            type="button"
            onClick={() => onFormDataChange({ restaurant_id: suggestionProche.id })}
            className="shrink-0 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-600"
          >
            Choisir
          </button>
        </div>
      )}

      {/* Carte : où se trouve l'adresse choisie par rapport au restaurant.
          Affichée dès qu'au moins un point existe ; placeholder sinon. */}
      {isDelivery &&
        (restoCoords || clientCoords ? (
          <div className="space-y-2">
            <RouteMapCanvas
              resto={restoCoords}
              client={clientCoords}
              restoLabel={selectedRestaurant?.name ?? "Restaurant"}
              clientLabel={adresse?.title || adresse?.address || "Client"}
              height={230}
            />

            {/* Distance, durée (trafic compris) et zone tarifaire */}
            {route && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-[#F17922]">
                  <Navigation className="w-3.5 h-3.5" />
                  {formatDistance(route.distanceMeters)}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-[#F17922]">
                  <Clock className="w-3.5 h-3.5" />
                  {formatDuration(route.durationSeconds)} de trajet
                </span>
                {deliveryFee?.zone && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                    <MapPin className="w-3.5 h-3.5" />
                    Zone {deliveryFee.zone}
                  </span>
                )}
              </div>
            )}

            {!restoCoords && (
              <p className="text-[11px] text-gray-400">
                Sélectionnez un restaurant pour tracer le trajet jusqu'au client.
              </p>
            )}
            {!clientCoords && (
              <p className="text-[11px] text-gray-400">
                Recherchez l'adresse du client pour la placer sur la carte.
              </p>
            )}
          </div>
        ) : (
          <div className="flex h-[120px] flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-gray-200 bg-gray-50/60 text-center">
            <MapPin className="w-5 h-5 text-gray-300" />
            <p className="text-xs text-gray-400 px-6">
              La carte s'affichera dès qu'un restaurant et une adresse seront
              choisis.
            </p>
          </div>
        ))}

      {/* Service de livraison — Override admin du choix auto */}
      {isDelivery && (
        <div>
          <label className={LABEL_CLASS}>Service de livraison</label>
          <div className="flex gap-2">
            {(
              [
                { value: undefined, label: "Auto (selon zone)", desc: "Le backend choisit" },
                { value: DeliveryService.CHICKEN_NATION, label: "Chicken Nation", desc: "Livreur interne" },
                { value: DeliveryService.TURBO, label: "Turbo Delivery", desc: "Sous-traitant" },
              ] as const
            ).map((opt) => {
              const selected = formData.delivery_service === opt.value;
              return (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => onFormDataChange({ delivery_service: opt.value })}
                  className={`flex-1 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                    selected
                      ? "border-[#F17922] bg-orange-50 text-[#F17922]"
                      : "border-gray-200 bg-white text-[#595959] hover:border-[#F17922]/40 hover:bg-gray-50"
                  }`}
                >
                  <div>{opt.label}</div>
                  <div className="mt-0.5 text-[10px] font-normal opacity-70">{opt.desc}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Frais de livraison — uniquement pour DELIVERY */}
      {isDelivery && (
        <div>
          <label htmlFor="delivery_fee" className={LABEL_CLASS}>
            Frais de livraison (XOF)
          </label>
          <div className="relative">
            <Banknote className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="number"
              id="delivery_fee"
              value={formData.delivery_fee || ""}
              onChange={(e) =>
                onFormDataChange({ delivery_fee: Number(e.target.value) })
              }
              placeholder={
                deliveryFee?.montant
                  ? `Auto: ${deliveryFee.montant.toLocaleString()} XOF`
                  : "0"
              }
              className={`${INPUT_CLASS} pl-10`}
            />
            {deliveryFee?.montant !== undefined && (
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-semibold text-green-600 whitespace-nowrap">
                Auto : {deliveryFee.montant.toLocaleString()} XOF
              </span>
            )}
          </div>
          {deliveryFee?.distance !== undefined && (
            <p className="mt-1 text-[11px] text-gray-400">
              Calculé automatiquement selon la zone ({deliveryFee.distance?.toFixed(1)} km).
              Modifiez le champ pour forcer un autre montant.
            </p>
          )}
        </div>
      )}

      {/* Date + Heure */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="date" className={LABEL_CLASS}>
            Date souhaitée
          </label>
          <input
            type="date"
            id="date"
            value={formData.date || ""}
            onChange={(e) => onFormDataChange({ date: e.target.value })}
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label htmlFor="time" className={LABEL_CLASS}>
            Heure souhaitée
          </label>
          <input
            type="time"
            id="time"
            value={formData.time || ""}
            onChange={(e) => onFormDataChange({ time: e.target.value })}
            className={INPUT_CLASS}
          />
        </div>
      </div>

      {/* Note */}
      <div>
        <label htmlFor="note" className={`${LABEL_CLASS} flex items-center gap-1.5`}>
          <StickyNote className="w-3.5 h-3.5 text-gray-400" />
          Note ou commentaire
        </label>
        <textarea
          id="note"
          value={formData.note || ""}
          onChange={(e) => onFormDataChange({ note: e.target.value })}
          className={`${INPUT_CLASS} resize-none`}
          rows={3}
          placeholder="Instructions particulières, allergies, etc."
        />
      </div>
    </div>
  );
};

export default DeliveryInfoSection;

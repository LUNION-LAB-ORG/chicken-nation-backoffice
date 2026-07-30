"use client";

import React, { useEffect, useMemo } from "react";
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

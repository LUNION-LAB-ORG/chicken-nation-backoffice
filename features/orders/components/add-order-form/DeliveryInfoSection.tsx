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
import EnTeteSection from "./EnTeteSection";
import { getParsedAddress } from "../../utils/getParsedAddress";
import {
  aideFrais,
  fraisAutomatiques,
  FraisEnregistres,
  lireSaisieFrais,
  livraisonInchangee,
  valeurChampFrais,
} from "../../utils/frais-livraison";
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
  /**
   * Modification d'une commande : sa livraison et ses frais ENREGISTRÉS. Ils
   * restent tant que l'agent ne change ni l'adresse, ni le restaurant, ni le
   * type : ouvrir une commande ne refait pas le calcul (`fraisAutomatiques`).
   */
  fraisEnregistres?: FraisEnregistres | null;
  /**
   * Reprise au téléphone d'une commande du site à payer à la livraison : le
   * client a accepté ces frais sur le site, et le serveur les garde tant que
   * la livraison ne change pas. Le champ est alors fermé.
   */
  fraisDuSite?: boolean;
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
  fraisEnregistres,
  fraisDuSite = false,
}) => {
  const isDelivery = formData.type === OrderType.DELIVERY;

  // Initialiser date et heure par défaut
  useEffect(() => {
    const update: Partial<OrderFormData> = {};
    if (!formData.date) update.date = getCurrentDate();
    if (!formData.time) update.time = getCurrentTime();
    if (Object.keys(update).length > 0) onFormDataChange(update);
  }, [formData.date, formData.time, onFormDataChange]);

  // Remettre delivery_fee à 0 quand le type change de DELIVERY → autre. Une
  // saisie de l'agent ne vaut que pour une livraison : elle repart aussi.
  useEffect(() => {
    if (!isDelivery && ((formData.delivery_fee ?? 0) > 0 || formData.frais_manuels)) {
      onFormDataChange({ delivery_fee: 0, frais_manuels: false });
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
          // Client et plats : sans eux, une offre réservée aux étudiants ou à
          // des menus serait sautée, et le frais plein remplirait le formulaire
          // puis écraserait l'offre à l'enregistrement.
          customer_id: formData.customer_id || undefined,
          dish_ids: [...new Set(formData.items.map((i) => i.dish_id))].sort().join(",") || undefined,
        }
      : undefined
  );

  // FRAIS POSÉS PAR L'ÉCRAN. Modification : ceux de la commande enregistrée,
  // tant que sa livraison ne change pas (ouvrir une commande ne refait plus
  // le calcul). Sinon : l'aperçu du serveur. Ce que l'agent a saisi dans le
  // champ, zéro compris, n'est plus jamais écrasé (`formData.frais_manuels`).
  const memeLivraison = livraisonInchangee(formData, fraisEnregistres);
  const fraisVerrouilles = fraisDuSite && memeLivraison;
  const fraisAuto = fraisAutomatiques({
    livraison: formData,
    apercu: deliveryFee?.montant,
    enregistres: fraisEnregistres,
    // Frais du site : la saisie n'y change rien, le serveur les garde.
    saisis: !!formData.frais_manuels && !fraisVerrouilles,
  });
  useEffect(() => {
    if (!isDelivery || fraisAuto === undefined || formData.delivery_fee === fraisAuto) return;
    onFormDataChange({ delivery_fee: fraisAuto });
  }, [fraisAuto, isDelivery, formData.delivery_fee]);

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
    // Conteneur de requête : la disposition suit la largeur de la carte, pas
    // celle de l'écran (le panier occupe la droite).
    <div className="space-y-4 @container">
      {/* En-tête de section */}
      <EnTeteSection Icone={MapPinned} titre={sectionTitle} sousTitre={sectionSubtitle} />

      {/* Livraison, carte large : adresse et carte à gauche, service, frais,
          date et note à droite. Sinon tout s'empile, comme avant. */}
      <div className={isDelivery ? "grid grid-cols-1 gap-4 @[38rem]:grid-cols-2 @[38rem]:gap-5" : "space-y-4"}>
      {isDelivery && (
      <div className="min-w-0 space-y-4">
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

      </div>
      )}

      <div className="min-w-0 space-y-4">
      {/* Service de livraison — Override admin du choix auto */}
      {isDelivery && (
        <div>
          <label className={LABEL_CLASS}>Service de livraison</label>
          {/* Trois mots courts, sur une ligne à toute largeur. Le détail est dans l'infobulle. */}
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { value: undefined, label: "Auto", aide: "Choisi selon la zone de livraison" },
                { value: DeliveryService.CHICKEN_NATION, label: "Interne", aide: "Livreur Chicken Nation" },
                { value: DeliveryService.TURBO, label: "Turbo", aide: "Turbo Delivery, sous-traitant" },
              ] as const
            ).map((opt) => {
              const selected = formData.delivery_service === opt.value;
              return (
                <button
                  key={opt.label}
                  type="button"
                  title={opt.aide}
                  aria-pressed={selected}
                  onClick={() => onFormDataChange({ delivery_service: opt.value })}
                  className={`rounded-xl border px-3 py-2.5 text-[13px] font-semibold transition ${
                    selected
                      ? "border-[#F17922] bg-orange-50 text-[#F17922]"
                      : "border-gray-200 bg-white text-[#595959] hover:border-[#F17922]/40 hover:bg-gray-50"
                  }`}
                >
                  {opt.label}
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
              min={0}
              inputMode="numeric"
              // Vide tant que rien n'est posé ; « 0 » s'affiche et se garde
              // (livraison offerte), il n'est plus pris pour un champ vide.
              value={valeurChampFrais(formData.delivery_fee)}
              disabled={fraisVerrouilles}
              onChange={(e) =>
                onFormDataChange({ delivery_fee: lireSaisieFrais(e.target.value), frais_manuels: true })
              }
              // Champ laissé vide : retour aux frais posés par l'écran.
              onBlur={() => {
                if (formData.delivery_fee !== undefined) return;
                onFormDataChange({
                  delivery_fee: fraisAutomatiques({
                    livraison: formData,
                    apercu: deliveryFee?.montant,
                    enregistres: fraisEnregistres,
                    saisis: false,
                  }),
                  frais_manuels: false,
                });
              }}
              placeholder={
                deliveryFee?.montant
                  ? `Auto: ${deliveryFee.montant.toLocaleString()} XOF`
                  : "0"
              }
              className={`${INPUT_CLASS} pl-10 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400`}
            />
            {/* Frais calculés par le serveur. Différents de ceux du champ :
                un clic les applique (jamais d'office sur une saisie ni sur
                les frais d'une commande enregistrée). */}
            {deliveryFee?.montant !== undefined &&
              (fraisVerrouilles || formData.delivery_fee === deliveryFee.montant ? (
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-semibold text-green-600 whitespace-nowrap">
                  Auto : {deliveryFee.montant.toLocaleString()} XOF
                </span>
              ) : (
                <button
                  type="button"
                  title="Appliquer les frais calculés"
                  onClick={() =>
                    onFormDataChange({
                      delivery_fee: deliveryFee.montant,
                      // Modification : le choix de l'agent tient, sinon les
                      // frais enregistrés reviendraient aussitôt.
                      frais_manuels: !!fraisEnregistres,
                    })
                  }
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-[11px] font-semibold text-green-700 whitespace-nowrap transition hover:bg-green-100"
                >
                  Auto : {deliveryFee.montant.toLocaleString()} XOF
                </button>
              ))}
          </div>
          {(() => {
            const aide = aideFrais({
              verrouilles: fraisVerrouilles,
              saisis: !!formData.frais_manuels,
              enregistres: memeLivraison,
              distance: deliveryFee?.distance ?? undefined,
            });
            return aide ? <p className="mt-1 text-[11px] text-gray-400">{aide}</p> : null;
          })()}
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
      </div>
    </div>
  );
};

export default DeliveryInfoSection;

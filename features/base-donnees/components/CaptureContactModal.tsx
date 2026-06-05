"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, UserPlus, X } from "lucide-react";

import { useAuthStore } from "../../users/hook/authStore";
import { useRestaurantListQuery } from "../../restaurants/queries/restaurant-list.query";

import { useProspectAddMutation } from "../queries/prospect-add.mutation";
import { checkProspectPhone } from "../services/prospect.service";
import { ProspectPlatform } from "../types/prospect.types";
import { PLATFORM_META } from "../utils/prospect-ui";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const ORANGE = "#F17922";

/**
 * Normalise un numéro ivoirien : accepte +225 / 00225 / 10 chiffres.
 * Renvoie les 10 chiffres locaux, ou null si invalide.
 */
function normalizeCiPhone(input: string): string | null {
  let d = input.replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("225") && d.length === 13) d = d.slice(3);
  return d.length === 10 ? d : null;
}

/**
 * Capture d'un client Glovo/Yango (cf. cahier §4.3) — utilisable depuis la page
 * Commandes. 4 champs obligatoires. Store pré-rempli pour un agent store ;
 * sélectionnable pour l'admin central. Affiche un écran de confirmation après création.
 */
export function CaptureContactModal({ isOpen, onClose }: Props) {
  const user = useAuthStore((s) => s.user);
  const userRestaurantId = user?.restaurant_id || "";
  const isStore = !!userRestaurantId;

  const { data: restaurantsResp } = useRestaurantListQuery();
  const restaurants = useMemo(
    () => (restaurantsResp?.data ?? []) as { id: string; name: string }[],
    [restaurantsResp],
  );

  const [platform, setPlatform] = useState<ProspectPlatform | null>(null);
  const [name, setName] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [restaurantId, setRestaurantId] = useState("");
  const [dup, setDup] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState(false);

  const mutation = useProspectAddMutation();

  const reset = () => {
    setPlatform(null);
    setName("");
    setOrderNumber("");
    setPhone("");
    setRestaurantId(isStore ? userRestaurantId : "");
    setDup(null);
    setError(null);
    setCreated(false);
  };

  useEffect(() => {
    if (isOpen) {
      setRestaurantId(isStore ? userRestaurantId : "");
      setCreated(false);
      setError(null);
    }
  }, [isOpen, isStore, userRestaurantId]);

  const normalizedPhone = normalizeCiPhone(phone);
  const phoneValid = normalizedPhone !== null;

  // Détection de doublon (debounce) dès que le numéro est valide
  useEffect(() => {
    if (!normalizedPhone) {
      setDup(null);
      return;
    }
    let active = true;
    const t = setTimeout(async () => {
      try {
        const res = await checkProspectPhone(normalizedPhone);
        if (active) {
          setDup(
            res.exists && res.prospect
              ? `Doublon possible : « ${res.prospect.name} » déjà enregistré`
              : null,
          );
        }
      } catch {
        /* silencieux : la détection de doublon est non bloquante */
      }
    }, 400);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [normalizedPhone]);

  if (!isOpen) return null;

  const restaurantName = restaurants.find(
    (r) => r.id === (isStore ? userRestaurantId : restaurantId),
  )?.name;

  const canSubmit =
    !!platform &&
    !!name.trim() &&
    !!orderNumber.trim() &&
    phoneValid &&
    (isStore || !!restaurantId);

  const handleSubmit = async () => {
    setError(null);
    if (!canSubmit || !platform || !normalizedPhone) return;
    try {
      await mutation.mutateAsync({
        platform,
        name: name.trim(),
        order_number: orderNumber.trim(),
        phone: normalizedPhone,
        ...(isStore ? {} : { restaurant_id: restaurantId }),
      });
      setCreated(true);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div
          className="flex items-start gap-3 px-6 py-5 text-white rounded-t-2xl"
          style={{ background: `linear-gradient(135deg, #ff9f5a, ${ORANGE})` }}
        >
          <div className="w-11 h-11 rounded-xl bg-white/20 grid place-items-center flex-none">
            <UserPlus className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold leading-tight">
              Enregistrer un client Glovo / Yango
            </h3>
            <p className="text-sm text-white/90">Sans quitter la page des commandes</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-lg bg-white/20 grid place-items-center flex-none hover:bg-white/30"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {created ? (
          /* ---------- Écran de confirmation (caissier) ---------- */
          <div className="px-6 py-10 text-center">
            <div className="w-20 h-20 rounded-full bg-green-50 text-green-600 grid place-items-center mx-auto mb-5">
              <CheckCircle2 className="w-11 h-11" />
            </div>
            <h4 className="text-xl font-bold text-gray-900 mb-2">Contact créé</h4>
            <p className="text-sm text-gray-500 leading-relaxed mb-7 max-w-sm mx-auto">
              Le contact a bien été enregistré. Il sera appelé dès demain (J+1) par
              le call center. Vous n&apos;avez rien d&apos;autre à faire.
            </p>
            <div className="flex gap-2 justify-center">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Fermer
              </button>
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm font-semibold"
                style={{ backgroundColor: ORANGE }}
              >
                <UserPlus className="w-4 h-4" />
                Ajouter un autre contact
              </button>
            </div>
          </div>
        ) : (
          /* ---------- Formulaire ---------- */
          <div className="px-6 py-5">
            <div className="flex gap-2 items-start bg-orange-50 text-[#8a4a1c] rounded-xl px-4 py-3 text-sm mb-5">
              <AlertTriangle className="w-4 h-4 flex-none mt-0.5 text-[#F17922]" />
              <span>
                Les <b>4 champs</b> sont obligatoires.
              </span>
            </div>

            {/* Plateforme */}
            <label className="block text-xs font-semibold text-gray-700 mb-2">
              1 · Plateforme <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {(["GLOVO", "YANGO"] as ProspectPlatform[]).map((p) => {
                const meta = PLATFORM_META[p];
                const selected = platform === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPlatform(p)}
                    className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 font-bold transition ${
                      selected
                        ? "border-[#F17922] bg-orange-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <span
                      className={`w-9 h-9 rounded-lg grid place-items-center text-lg ${meta.className}`}
                    >
                      {meta.emoji}
                    </span>
                    {meta.label}
                  </button>
                );
              })}
            </div>

            {/* Nom */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                2 · Nom / Prénom / Pseudo <span className="text-red-500">*</span>
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nom utilisé pour la commande"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F17922]/40"
              />
            </div>

            {/* N° commande */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                3 · Numéro de la commande <span className="text-red-500">*</span>
              </label>
              <input
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="Ex. 101672547192"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-[#F17922]/40"
              />
            </div>

            {/* Téléphone */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                4 · Numéro de téléphone <span className="text-red-500">*</span>
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                inputMode="numeric"
                maxLength={14}
                placeholder="Ex. 0700000000"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-[#F17922]/40"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                Numéro ivoirien à 10 chiffres (avec ou sans +225).
              </p>
              {dup && (
                <div className="mt-2 flex gap-2 items-center bg-amber-50 text-amber-800 rounded-lg px-3 py-2 text-xs">
                  <AlertTriangle className="w-3.5 h-3.5 flex-none" />
                  {dup}
                </div>
              )}
            </div>

            {/* Restaurant */}
            <div className="mb-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Restaurant (store)
              </label>
              {isStore ? (
                <input
                  value={restaurantName ? `${restaurantName} (pré-rempli)` : "Votre restaurant (pré-rempli)"}
                  disabled
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500"
                />
              ) : (
                <select
                  value={restaurantId}
                  onChange={(e) => setRestaurantId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#F17922]/40"
                >
                  <option value="">— Choisir un restaurant —</option>
                  {restaurants.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {error && (
              <div className="mt-3 rounded-lg bg-red-50 border border-red-200 p-3">
                <p className="text-xs text-red-700">{error}</p>
              </div>
            )}

            {/* Footer */}
            <div className="flex gap-2 mt-5">
              <button
                type="button"
                onClick={handleClose}
                disabled={mutation.isPending}
                className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit || mutation.isPending}
                className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-lg text-white text-sm font-semibold disabled:opacity-50"
                style={{ backgroundColor: ORANGE }}
              >
                {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Enregistrer le contact
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

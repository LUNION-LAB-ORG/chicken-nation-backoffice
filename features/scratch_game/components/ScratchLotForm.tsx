"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Gift, Ticket, Tag, Loader2, Star } from "lucide-react";
import { getPromoCodes } from "../../promo_code/services/promo-code.service";
import { useQuery } from "@tanstack/react-query";
import GiftItemPicker, { PickedGift } from "./GiftItemPicker";
import {
  CreateScratchLotDto,
  ScratchLevel,
  ScratchLot,
  ScratchRewardType,
} from "../types/scratch.types";

const inputCls =
  "w-full h-11 rounded-lg border border-[#E4E4E7] px-3 text-sm text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#F17922]/30";

const Label: React.FC<{ children: React.ReactNode; hint?: string }> = ({
  children,
  hint,
}) => (
  <label className="block text-sm font-medium text-[#71717A] mb-1.5">
    {children}
    {hint && <span className="text-[#9796A1] font-normal"> — {hint}</span>}
  </label>
);

// Types créables (POINTS réservé au plancher, non créable côté serveur)
const CREATABLE_TYPES: {
  key: Exclude<ScratchRewardType, "POINTS">;
  label: string;
  icon: React.ElementType;
  desc: string;
}[] = [
  { key: "GIFT", label: "Cadeau", icon: Gift, desc: "Un plat offert à 0 fr" },
  { key: "VOUCHER", label: "Bon d'achat", icon: Ticket, desc: "Un montant crédité" },
  { key: "PROMO_CODE", label: "Code promo", icon: Tag, desc: "Un code promo existant" },
];

const LEVELS: { key: ScratchLevel; label: string }[] = [
  { key: "STANDARD", label: "Standard" },
  { key: "VIP", label: "VIP" },
  { key: "VVIP", label: "VVIP" },
];

interface ScratchLotFormProps {
  /** Lot à éditer (null = création). */
  lot: ScratchLot | null;
  onSubmit: (data: CreateScratchLotDto) => void;
  onCancel: () => void;
  isPending: boolean;
}

export default function ScratchLotForm({
  lot,
  onSubmit,
  onCancel,
  isPending,
}: ScratchLotFormProps) {
  const isFloor = lot?.is_floor ?? false;
  const payload = (lot?.payload ?? {}) as Record<string, unknown>;

  const [label, setLabel] = useState(lot?.label ?? "");
  const [type, setType] = useState<ScratchRewardType>(
    lot?.reward_type ?? "GIFT"
  );

  // Payload states — cadeau = plat OU supplément
  const [giftItem, setGiftItem] = useState<PickedGift | null>(
    isFloor || lot?.reward_type !== "GIFT"
      ? null
      : payload.item_type === "SUPPLEMENT" && payload.supplement_id
      ? {
          kind: "SUPPLEMENT",
          id: String(payload.supplement_id),
          name:
            (payload.name as string) ||
            (payload.label as string) ||
            "Supplément sélectionné",
          price: Number(payload.price) || 0,
          image: (payload.image as string) ?? null,
        }
      : payload.dish_id
      ? {
          kind: "DISH",
          id: String(payload.dish_id),
          name:
            (payload.name as string) ||
            (payload.label as string) ||
            "Plat sélectionné",
          price: Number(payload.price) || 0,
          image: (payload.image as string) ?? null,
        }
      : null
  );
  const [giftLabel, setGiftLabel] = useState(
    lot?.reward_type === "GIFT" ? (payload.label as string) ?? "" : ""
  );
  const [giftQty, setGiftQty] = useState(
    lot?.reward_type === "GIFT" && payload.quantity != null
      ? String(payload.quantity)
      : "1"
  );
  const [voucherAmount, setVoucherAmount] = useState(
    lot?.reward_type === "VOUCHER" && payload.amount != null
      ? String(payload.amount)
      : ""
  );
  const [promoCode, setPromoCode] = useState(
    lot?.reward_type === "PROMO_CODE" ? (payload.code as string) ?? "" : ""
  );
  const [floorPoints, setFloorPoints] = useState(
    isFloor && payload.points != null ? String(payload.points) : ""
  );

  // Paramètres communs
  const [weight, setWeight] = useState(String(lot?.weight ?? "1"));
  const [unitCost, setUnitCost] = useState(String(lot?.unit_cost ?? "0"));
  const [minCart, setMinCart] = useState(String(lot?.min_cart ?? "0"));
  // Fidélité requise (pensée pour les CADEAUX) : l'UN des deux critères suffit.
  const [minPaidOrders, setMinPaidOrders] = useState(String(lot?.min_paid_orders ?? "0"));
  const [minRevenue, setMinRevenue] = useState(String(lot?.min_revenue ?? "0"));
  const [frequencyCap, setFrequencyCap] = useState(
    lot?.frequency_cap != null ? String(lot.frequency_cap) : ""
  );
  const [stock, setStock] = useState(
    lot?.stock != null ? String(lot.stock) : ""
  );
  const [levelMin, setLevelMin] = useState<ScratchLevel | "">(
    lot?.level_min ?? ""
  );
  const [active, setActive] = useState(lot?.active ?? true);
  const [error, setError] = useState<string | null>(null);

  const promoQuery = useQuery({
    queryKey: ["promo-codes-scratch"],
    queryFn: () => getPromoCodes(),
    enabled: type === "PROMO_CODE" && !isFloor,
  });
  const promos = useMemo(() => {
    const d = promoQuery.data;
    return Array.isArray(d)
      ? d
      : ((d as { data?: unknown[] } | undefined)?.data ?? []);
  }, [promoQuery.data]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!label.trim()) {
      setError("Le libellé est obligatoire.");
      return;
    }

    const w = Number(weight);
    if (!(w >= 1)) {
      setError("Le poids doit être au moins égal à 1.");
      return;
    }
    if (Number(unitCost) < 0) {
      setError("Le coût unitaire ne peut pas être négatif.");
      return;
    }
    if (Number(minCart) < 0) {
      setError("Le panier minimum ne peut pas être négatif.");
      return;
    }

    // Construction du payload selon le type
    let rewardType: ScratchRewardType = type;
    let builtPayload: Record<string, unknown> = {};

    if (isFloor) {
      rewardType = "POINTS";
      if (floorPoints !== "") builtPayload.points = Number(floorPoints);
    } else if (type === "GIFT") {
      if (!giftItem) {
        setError("Choisissez le plat ou le supplément offert.");
        return;
      }
      if (giftItem.kind === "SUPPLEMENT") builtPayload.supplement_id = giftItem.id;
      else builtPayload.dish_id = giftItem.id;
      if (giftLabel.trim()) builtPayload.label = giftLabel.trim();
      if (giftQty && Number(giftQty) > 0)
        builtPayload.quantity = Number(giftQty);
    } else if (type === "VOUCHER") {
      const a = Number(voucherAmount);
      if (!(a > 0)) {
        setError("Le montant du bon doit être positif.");
        return;
      }
      builtPayload.amount = a;
    } else if (type === "PROMO_CODE") {
      if (!promoCode) {
        setError("Choisissez un code promo.");
        return;
      }
      builtPayload.code = promoCode;
    }

    const data: CreateScratchLotDto = {
      label: label.trim(),
      reward_type: rewardType,
      payload: builtPayload,
      weight: w,
      unit_cost: Number(unitCost) || 0,
      min_cart: Number(minCart) || 0,
      min_paid_orders: Number(minPaidOrders) || 0,
      min_revenue: Number(minRevenue) || 0,
      frequency_cap: frequencyCap === "" ? null : Number(frequencyCap),
      stock: stock === "" ? null : Number(stock),
      level_min: levelMin === "" ? null : levelMin,
      active,
    };
    // Ne pas envoyer is_floor à la création (jamais créable) ; à l'édition c'est immuable
    if (!lot) {
      data.is_floor = false;
    }

    onSubmit(data);
  };

  return (
    <motion.form
      key="scratch-lot-form"
      onSubmit={handleSubmit}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      {isFloor && (
        <div className="flex items-center gap-2 rounded-lg bg-[#FFF6E9] border border-[#F5D8AE] px-4 py-3">
          <Star size={16} className="text-[#F17922]" />
          <p className="text-sm text-[#7A3502]">
            Lot <strong>PLANCHER</strong> (points). Son type est fixe et il ne
            peut pas être supprimé — il garantit une récompense minimale. Sa
            fréquence se règle globalement dans l&apos;onglet{" "}
            <strong>Réglages</strong> (« Poids du plancher »), pas ici.
          </p>
        </div>
      )}

      {/* Type de récompense (masqué pour le plancher) */}
      {!isFloor && (
        <div>
          <Label>Type de récompense</Label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {CREATABLE_TYPES.map((t) => {
              const Icon = t.icon;
              const activeType = type === t.key;
              const disabled = !!lot && lot.reward_type !== t.key; // type immuable en édition
              return (
                <button
                  key={t.key}
                  type="button"
                  disabled={disabled}
                  onClick={() => setType(t.key)}
                  className={`text-left rounded-lg border p-3 transition-colors ${
                    disabled
                      ? "opacity-40 cursor-not-allowed border-[#E4E4E7]"
                      : activeType
                      ? "border-[#F17922] bg-[#FFF6E9] cursor-pointer"
                      : "border-[#E4E4E7] hover:bg-gray-50 cursor-pointer"
                  }`}
                >
                  <Icon
                    size={18}
                    className={activeType ? "text-[#F17922]" : "text-[#71717A]"}
                  />
                  <div
                    className={`mt-1.5 text-sm font-semibold ${
                      activeType ? "text-[#F17922]" : "text-[#18181B]"
                    }`}
                  >
                    {t.label}
                  </div>
                  <div className="text-[11px] text-[#9796A1] leading-tight mt-0.5">
                    {t.desc}
                  </div>
                </button>
              );
            })}
          </div>
          {lot && (
            <p className="text-[11px] text-[#9796A1] mt-1.5">
              Le type d&apos;un lot existant ne peut pas être modifié.
            </p>
          )}
        </div>
      )}

      {/* Libellé */}
      <div>
        <Label>Libellé du lot</Label>
        <input
          className={inputCls}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Ex. Menu offert, Bon de 2000 FCFA…"
        />
      </div>

      {/* Sous-formulaire payload */}
      {isFloor ? (
        <div className="max-w-xs">
          <Label hint="optionnel">Points attribués</Label>
          <input
            type="number"
            min={0}
            className={inputCls}
            value={floorPoints}
            onChange={(e) => setFloorPoints(e.target.value)}
            placeholder="Ex. 10"
          />
        </div>
      ) : type === "GIFT" ? (
        <div className="space-y-4">
          <div>
            <Label>Article offert</Label>
            <GiftItemPicker value={giftItem} onChange={setGiftItem} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label hint="optionnel">Libellé affiché</Label>
              <input
                className={inputCls}
                value={giftLabel}
                onChange={(e) => setGiftLabel(e.target.value)}
                placeholder="Ex. Un menu Chicken offert"
              />
            </div>
            <div>
              <Label hint="optionnel">Quantité</Label>
              <input
                type="number"
                min={1}
                className={inputCls}
                value={giftQty}
                onChange={(e) => setGiftQty(e.target.value)}
              />
            </div>
          </div>
        </div>
      ) : type === "VOUCHER" ? (
        <div className="max-w-xs">
          <Label>Montant du bon (FCFA)</Label>
          <input
            type="number"
            min={1}
            className={inputCls}
            value={voucherAmount}
            onChange={(e) => setVoucherAmount(e.target.value)}
            placeholder="Ex. 2000"
          />
        </div>
      ) : (
        <div className="max-w-sm">
          <Label>Code promo</Label>
          <select
            className={inputCls}
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
          >
            <option value="">Choisir un code promo…</option>
            {promoCode &&
              !(promos as { code: string }[]).some(
                (p) => p.code === promoCode
              ) && <option value={promoCode}>{promoCode}</option>}
            {(promos as { code: string; is_active?: boolean }[])
              .filter((p) => p.is_active !== false)
              .map((p) => (
                <option key={p.code} value={p.code}>
                  {p.code}
                </option>
              ))}
          </select>
        </div>
      )}

      {/* Paramètres de tirage — inutiles pour le plancher : sa fréquence est
          réglée globalement (Réglages » Poids du plancher), et le moteur ignore
          ces champs pour le lot plancher. */}
      {!isFloor && (
      <div className="border-2 border-[#D9D9D9]/50 rounded-2xl p-6 space-y-4">
        <h3 className="text-lg font-semibold text-[#595959]">
          Paramètres de tirage
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label hint="≥ 1">Poids relatif</Label>
            <input
              type="number"
              min={1}
              step="1"
              className={inputCls}
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </div>
          <div>
            <Label hint="FCFA">Coût unitaire estimé</Label>
            <input
              type="number"
              min={0}
              className={inputCls}
              value={unitCost}
              onChange={(e) => setUnitCost(e.target.value)}
            />
          </div>
          <div>
            <Label hint="FCFA">Panier minimum</Label>
            <input
              type="number"
              min={0}
              className={inputCls}
              value={minCart}
              onChange={(e) => setMinCart(e.target.value)}
            />
          </div>
          <div>
            <Label hint="vide = illimité">Plafond de fréquence / client</Label>
            <input
              type="number"
              min={0}
              className={inputCls}
              value={frequencyCap}
              onChange={(e) => setFrequencyCap(e.target.value)}
              placeholder="Illimité"
            />
          </div>
          <div>
            <Label hint="vide = illimité">Stock total</Label>
            <input
              type="number"
              min={0}
              className={inputCls}
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              placeholder="Illimité"
            />
          </div>
          <div>
            <Label hint="0 = inactif">Fidélité : commandes payées min.</Label>
            <input
              type="number"
              min={0}
              className={inputCls}
              value={minPaidOrders}
              onChange={(e) => setMinPaidOrders(e.target.value)}
            />
          </div>
          <div>
            <Label hint="FCFA, 0 = inactif — l'un des deux suffit">Fidélité : CA minimum</Label>
            <input
              type="number"
              min={0}
              className={inputCls}
              value={minRevenue}
              onChange={(e) => setMinRevenue(e.target.value)}
            />
          </div>
          <div>
            <Label hint="vide = tous">Niveau minimum</Label>
            <select
              className={inputCls}
              value={levelMin}
              onChange={(e) =>
                setLevelMin(e.target.value as ScratchLevel | "")
              }
            >
              <option value="">Tous les niveaux</option>
              {LEVELS.map((l) => (
                <option key={l.key} value={l.key}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      )}

      {/* Actif */}
      <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl cursor-pointer select-none">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
          className="h-5 w-5 accent-[#F17922]"
        />
        <span className="text-sm font-medium text-gray-700">
          Lot actif (inclus dans les tirages)
        </span>
      </label>

      {error && (
        <div className="rounded-lg bg-[#FDECEA] text-[#C0392B] text-sm px-4 py-2.5">
          {error}
        </div>
      )}

      <div className="flex items-center justify-center gap-4 pt-2">
        <motion.button
          type="button"
          onClick={onCancel}
          className="px-8 py-3 rounded-xl bg-[#ECECEC] text-[#9796A1] min-w-[160px]"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={isPending}
        >
          Annuler
        </motion.button>
        <motion.button
          type="submit"
          className="px-8 py-3 rounded-xl bg-[#F17922] text-white min-w-[170px] disabled:opacity-50 flex items-center justify-center gap-2"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={isPending}
        >
          {isPending && <Loader2 size={16} className="animate-spin" />}
          {isPending
            ? "Enregistrement..."
            : lot
            ? "Enregistrer les modifications"
            : "Créer le lot"}
        </motion.button>
      </div>
    </motion.form>
  );
}

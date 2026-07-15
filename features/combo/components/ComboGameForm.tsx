"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Gift, Loader2, Plus, Trash2, Lightbulb } from "lucide-react";
import DishPicker, {
  PickedDish,
} from "../../scratch_game/components/DishPicker";
import ComboSolutionPicker from "./ComboSolutionPicker";
import {
  ComboGame,
  ComboSolutionItem,
  CreateComboGameDto,
} from "../types/combo.types";
import { fromLocalInput, toLocalInput } from "../utils/combo.utils";

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

interface ComboGameFormProps {
  /** Jeu à éditer (null = création). */
  game: ComboGame | null;
  onSubmit: (data: CreateComboGameDto) => void;
  onCancel: () => void;
  isPending: boolean;
}

export default function ComboGameForm({
  game,
  onSubmit,
  onCancel,
  isPending,
}: ComboGameFormProps) {
  const [title, setTitle] = useState(game?.title ?? "");
  const [description, setDescription] = useState(game?.description ?? "");

  // Indices (liste éditable) — au moins une ligne visible
  const [hints, setHints] = useState<string[]>(
    game?.hints && game.hints.length > 0 ? game.hints : [""]
  );

  // Combinaison-solution (items du menu réel)
  const [solutionItems, setSolutionItems] = useState<ComboSolutionItem[]>(
    game?.solution_items ?? []
  );

  // Fenêtre temporelle
  const [startsAt, setStartsAt] = useState(toLocalInput(game?.starts_at));
  const [endsAt, setEndsAt] = useState(toLocalInput(game?.ends_at));

  // Paramètres du jeu
  const [maxAttempts, setMaxAttempts] = useState(
    String(game?.max_attempts ?? 3)
  );
  const [winnersCount, setWinnersCount] = useState(
    String(game?.winners_count ?? 1)
  );
  const [active, setActive] = useState(game?.active ?? true);

  // Lot = plat offert (GIFT)
  const [giftDish, setGiftDish] = useState<PickedDish | null>(
    game?.gift?.dish_id
      ? {
          id: String(game.gift.dish_id),
          name: game.gift.label || "Plat sélectionné",
          price: 0,
          image: null,
        }
      : null
  );
  const [giftLabel, setGiftLabel] = useState(game?.gift?.label ?? "");
  const [giftQty, setGiftQty] = useState(
    game?.gift?.quantity != null ? String(game.gift.quantity) : "1"
  );

  const [error, setError] = useState<string | null>(null);

  const setHint = (index: number, val: string) =>
    setHints((prev) => prev.map((h, i) => (i === index ? val : h)));
  const addHint = () => setHints((prev) => [...prev, ""]);
  const removeHint = (index: number) =>
    setHints((prev) =>
      prev.length <= 1 ? [""] : prev.filter((_, i) => i !== index)
    );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Le titre est obligatoire.");
      return;
    }

    const cleanHints = hints.map((h) => h.trim()).filter(Boolean);
    if (cleanHints.length === 0) {
      setError("Ajoutez au moins un indice.");
      return;
    }

    if (solutionItems.length === 0) {
      setError("Composez la combinaison-solution (au moins un item du menu).");
      return;
    }

    if (!startsAt || !endsAt) {
      setError("Renseignez la fenêtre de jeu (début et fin).");
      return;
    }
    if (new Date(endsAt).getTime() <= new Date(startsAt).getTime()) {
      setError("La date de fin doit être postérieure à la date de début.");
      return;
    }

    const attempts = Number(maxAttempts);
    if (!(attempts >= 1)) {
      setError("Le nombre d'essais doit être au moins égal à 1.");
      return;
    }

    const winners = Number(winnersCount);
    if (!(winners >= 1)) {
      setError("Le nombre de gagnants doit être au moins égal à 1.");
      return;
    }

    if (!giftDish) {
      setError("Choisissez le plat offert (lot du jeu).");
      return;
    }

    const data: CreateComboGameDto = {
      title: title.trim(),
      description: description.trim() || null,
      hints: cleanHints,
      solution_items: solutionItems.map((it) => ({
        item_type: it.item_type,
        item_id: it.item_id,
        name: it.name,
        quantity: it.quantity && it.quantity > 0 ? it.quantity : 1,
      })),
      starts_at: fromLocalInput(startsAt),
      ends_at: fromLocalInput(endsAt),
      max_attempts: attempts,
      winners_count: winners,
      gift: {
        dish_id: giftDish.id,
        ...(giftLabel.trim() ? { label: giftLabel.trim() } : {}),
        ...(giftQty && Number(giftQty) > 0
          ? { quantity: Number(giftQty) }
          : {}),
      },
      active,
    };

    onSubmit(data);
  };

  return (
    <motion.form
      key="combo-game-form"
      onSubmit={handleSubmit}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      {/* Titre + description */}
      <div className="grid grid-cols-1 gap-4">
        <div>
          <Label>Titre du jeu</Label>
          <input
            className={inputCls}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex. Le Combo Mystère de la semaine"
          />
        </div>
        <div>
          <Label hint="optionnel">Description</Label>
          <textarea
            className="w-full rounded-lg border border-[#E4E4E7] px-3 py-2.5 text-sm text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#F17922]/30 min-h-[80px]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Règle du jeu, contexte…"
          />
        </div>
      </div>

      {/* Indices */}
      <div>
        <Label hint="ce que voit le joueur">Indices</Label>
        <div className="space-y-2">
          {hints.map((h, index) => (
            <div key={index} className="flex items-center gap-2">
              <Lightbulb size={16} className="text-[#F5B301] shrink-0" />
              <input
                className={inputCls}
                value={h}
                onChange={(e) => setHint(index, e.target.value)}
                placeholder={`Indice ${index + 1}`}
              />
              <button
                type="button"
                onClick={() => removeHint(index)}
                className="p-2 rounded-lg text-[#C0392B] hover:bg-[#FDECEA] cursor-pointer shrink-0"
                title="Retirer l'indice"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addHint}
          className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-[#F17922] hover:underline cursor-pointer"
        >
          <Plus size={15} /> Ajouter un indice
        </button>
      </div>

      {/* Combinaison-solution */}
      <div>
        <Label hint="items du menu réel à deviner">
          Combinaison-solution
        </Label>
        <ComboSolutionPicker
          value={solutionItems}
          onChange={setSolutionItems}
        />
      </div>

      {/* Paramètres du jeu */}
      <div className="border-2 border-[#D9D9D9]/50 rounded-2xl p-6 space-y-4">
        <h3 className="text-lg font-semibold text-[#595959]">
          Paramètres de la partie
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Début</Label>
            <input
              type="datetime-local"
              className={inputCls}
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
            />
          </div>
          <div>
            <Label>Fin</Label>
            <input
              type="datetime-local"
              className={inputCls}
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
            />
          </div>
          <div>
            <Label hint="par compte et par partie (RG-10)">
              Essais autorisés
            </Label>
            <input
              type="number"
              min={1}
              step="1"
              className={inputCls}
              value={maxAttempts}
              onChange={(e) => setMaxAttempts(e.target.value)}
            />
          </div>
          <div>
            <Label hint="tirés au sort parmi les bonnes réponses">
              Nombre de gagnants
            </Label>
            <input
              type="number"
              min={1}
              step="1"
              className={inputCls}
              value={winnersCount}
              onChange={(e) => setWinnersCount(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Lot = plat offert (GIFT) */}
      <div className="border-2 border-[#F5D8AE] bg-[#FFFBF5] rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Gift size={18} className="text-[#F17922]" />
          <h3 className="text-lg font-semibold text-[#595959]">
            Lot mis en jeu
          </h3>
        </div>
        <p className="text-[13px] text-[#9796A1] -mt-1">
          Le lot est un <strong>plat offert</strong> (récompense GIFT),
          récupérable au panier à 0 fr dans l&apos;app.
        </p>
        <div>
          <Label>Plat offert</Label>
          <DishPicker value={giftDish} onChange={setGiftDish} />
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

      {/* Actif */}
      <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl cursor-pointer select-none">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
          className="h-5 w-5 accent-[#F17922]"
        />
        <span className="text-sm font-medium text-gray-700">
          Jeu actif (visible et jouable dans sa fenêtre)
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
            : game
            ? "Enregistrer les modifications"
            : "Créer le jeu"}
        </motion.button>
      </div>
    </motion.form>
  );
}

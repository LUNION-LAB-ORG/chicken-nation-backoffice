"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { useComboGamesQuery } from "../queries/combo.queries";
import {
  useCreateComboGameMutation,
  useDeleteComboGameMutation,
  useUpdateComboGameMutation,
} from "../queries/combo.mutations";
import ComboGamesList from "./ComboGamesList";
import ComboGameForm from "./ComboGameForm";
import ComboTrackingPanel from "./ComboTrackingPanel";
import { ComboGame, CreateComboGameDto } from "../types/combo.types";
import { useAuthStore } from "../../users/hook/authStore";
import { UserRole } from "../../users/types/user.types";

type ComboMode = null | "create" | "edit" | "track";

export default function ComboGameManager() {
  const [mode, setMode] = useState<ComboMode>(null);
  const [selected, setSelected] = useState<ComboGame | null>(null);

  const { user } = useAuthStore();
  const canManage = user?.role === UserRole.ADMIN;

  const { data: games, isLoading } = useComboGamesQuery();
  const createMut = useCreateComboGameMutation();
  const updateMut = useUpdateComboGameMutation();
  const deleteMut = useDeleteComboGameMutation();

  const openCreate = () => {
    setSelected(null);
    setMode("create");
  };
  const openEdit = (game: ComboGame) => {
    setSelected(game);
    setMode("edit");
  };
  const openTrack = (game: ComboGame) => {
    setSelected(game);
    setMode("track");
  };
  const close = () => {
    setMode(null);
    setSelected(null);
  };

  const handleSubmit = (data: CreateComboGameDto) => {
    if (mode === "edit" && selected) {
      updateMut.mutate({ id: selected.id, data }, { onSuccess: close });
    } else {
      createMut.mutate(data, { onSuccess: close });
    }
  };

  const handleDelete = (game: ComboGame) => {
    if (
      typeof window !== "undefined" &&
      !window.confirm(`Supprimer le jeu « ${game.title} » ?`)
    )
      return;
    deleteMut.mutate(game.id);
  };

  // Reprend la version fraîche du jeu suivi (stats à jour après tirage)
  const trackedGame =
    mode === "track" && selected
      ? games?.find((g) => g.id === selected.id) ?? selected
      : null;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg p-6 sm:p-8"
      >
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[#595959]">
              Combo Mystère
            </h1>
            <p className="text-sm text-[#9796A1]">
              Devinez la combinaison du menu — les bonnes réponses entrent au
              tirage au sort du lot.
            </p>
          </div>
          {!mode && canManage && (
            <motion.button
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#F17922] text-white rounded-xl"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus size={16} /> Créer un jeu
            </motion.button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {mode === "create" || mode === "edit" ? (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="mb-5">
                <h2 className="text-lg font-semibold text-[#595959]">
                  {mode === "edit" ? "Modifier le jeu" : "Nouveau jeu"}
                </h2>
              </div>
              <ComboGameForm
                game={selected}
                onSubmit={handleSubmit}
                onCancel={close}
                isPending={createMut.isPending || updateMut.isPending}
              />
            </motion.div>
          ) : mode === "track" && trackedGame ? (
            <ComboTrackingPanel
              key="track"
              game={trackedGame}
              onBack={close}
              canManage={canManage}
            />
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ComboGamesList
                games={games}
                isLoading={isLoading}
                onEdit={openEdit}
                onDelete={handleDelete}
                onTrack={openTrack}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

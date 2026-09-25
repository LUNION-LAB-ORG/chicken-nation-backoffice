"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Layers, Calculator, Activity, SlidersHorizontal, History } from "lucide-react";
import { useScratchLotsQuery } from "../queries/scratch.queries";
import {
  useCreateScratchLotMutation,
  useDeleteScratchLotMutation,
  useUpdateScratchLotMutation,
} from "../queries/scratch.mutations";
import ScratchLotsList from "./ScratchLotsList";
import ScratchLotForm from "./ScratchLotForm";
import ScratchSimulator from "./ScratchSimulator";
import ScratchEnvelopeMonitor from "./ScratchEnvelopeMonitor";
import ScratchSettingsPanel from "./ScratchSettingsPanel";
import ScratchDrawsHistory from "./ScratchDrawsHistory";
import { CreateScratchLotDto, ScratchLot } from "../types/scratch.types";
import { useAuthStore } from "../../users/hook/authStore";
import { Action, Modules } from "../../users/types/auth.type";

type ScratchTab = "lots" | "draws" | "simulator" | "envelope" | "settings";

const TABS: { key: ScratchTab; label: string; icon: React.ElementType }[] = [
  { key: "lots", label: "Lots", icon: Layers },
  { key: "draws", label: "Tirages", icon: History },
  { key: "simulator", label: "Simulateur", icon: Calculator },
  { key: "envelope", label: "Enveloppe", icon: Activity },
  { key: "settings", label: "Réglages", icon: SlidersHorizontal },
];

export default function ScratchGameManager() {
  const [tab, setTab] = useState<ScratchTab>("lots");
  const [formMode, setFormMode] = useState<null | "create" | "edit">(null);
  const [editing, setEditing] = useState<ScratchLot | null>(null);

  // Mêmes droits que le serveur : lots = FIDELITE (CREATE, UPDATE, DELETE),
  // Réglages = /settings (SETTINGS READ pour les voir).
  const peutCreer = useAuthStore((s) => s.can(Modules.FIDELITE, Action.CREATE));
  const peutModifier = useAuthStore((s) => s.can(Modules.FIDELITE, Action.UPDATE));
  const peutSupprimer = useAuthStore((s) => s.can(Modules.FIDELITE, Action.DELETE));
  const peutVoirReglages = useAuthStore((s) => s.can(Modules.SETTINGS, Action.READ));
  const onglets = TABS.filter((t) => t.key !== "settings" || peutVoirReglages);
  // Un onglet devenu interdit (droits relus) retombe sur les lots.
  const ongletActif: ScratchTab =
    tab === "settings" && !peutVoirReglages ? "lots" : tab;
  // Le formulaire n'est ouvert que si le geste correspondant est permis.
  const formulaireOuvert =
    formMode === "create" ? peutCreer : formMode === "edit" ? peutModifier : false;

  const { data: lots, isLoading } = useScratchLotsQuery();
  const createMut = useCreateScratchLotMutation();
  const updateMut = useUpdateScratchLotMutation();
  const deleteMut = useDeleteScratchLotMutation();

  const openCreate = () => {
    setEditing(null);
    setFormMode("create");
  };
  const openEdit = (lot: ScratchLot) => {
    setEditing(lot);
    setFormMode("edit");
  };
  const closeForm = () => {
    setFormMode(null);
    setEditing(null);
  };

  const handleSubmit = (data: CreateScratchLotDto) => {
    if (formMode === "edit" && editing) {
      updateMut.mutate(
        { id: editing.id, data },
        { onSuccess: closeForm }
      );
    } else {
      createMut.mutate(data, { onSuccess: closeForm });
    }
  };

  const handleDelete = (lot: ScratchLot) => {
    if (lot.is_floor) return;
    if (
      typeof window !== "undefined" &&
      !window.confirm(`Supprimer le lot « ${lot.label} » ?`)
    )
      return;
    deleteMut.mutate(lot.id);
  };

  const handleToggleActive = (lot: ScratchLot) => {
    updateMut.mutate({ id: lot.id, data: { active: !lot.active } });
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg p-6 sm:p-8"
      >
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[#595959]">
              Gratte &amp; Gagne
            </h1>
            <p className="text-sm text-[#9796A1]">
              Lots, calibrage et pilotage de l&apos;enveloppe budgétaire.
            </p>
          </div>
          {ongletActif === "lots" && !formulaireOuvert && peutCreer && (
            <motion.button
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#F17922] text-white rounded-xl"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus size={16} /> Ajouter un lot
            </motion.button>
          )}
        </div>

        {/* Onglets internes (masqués pendant l'édition d'un lot) */}
        {!formulaireOuvert && (
          <div className="flex items-center gap-1.5 border-b border-[#F1F3F5] mb-6 overflow-x-auto">
            {onglets.map((t) => {
              const Icon = t.icon;
              const active = ongletActif === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap cursor-pointer ${
                    active
                      ? "border-[#F17922] text-[#F17922]"
                      : "border-transparent text-[#71717A] hover:text-[#18181B]"
                  }`}
                >
                  <Icon size={16} /> {t.label}
                </button>
              );
            })}
          </div>
        )}

        <AnimatePresence mode="wait">
          {formulaireOuvert ? (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="mb-5">
                <h2 className="text-lg font-semibold text-[#595959]">
                  {formMode === "edit"
                    ? "Modifier le lot"
                    : "Nouveau lot"}
                </h2>
              </div>
              <ScratchLotForm
                lot={editing}
                onSubmit={handleSubmit}
                onCancel={closeForm}
                isPending={createMut.isPending || updateMut.isPending}
              />
            </motion.div>
          ) : ongletActif === "lots" ? (
            <motion.div
              key="lots"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ScratchLotsList
                lots={lots}
                isLoading={isLoading}
                onEdit={peutModifier ? openEdit : undefined}
                onDelete={peutSupprimer ? handleDelete : undefined}
                onToggleActive={peutModifier ? handleToggleActive : undefined}
                canCreate={peutCreer}
              />
            </motion.div>
          ) : ongletActif === "draws" ? (
            <motion.div
              key="draws"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ScratchDrawsHistory />
            </motion.div>
          ) : ongletActif === "simulator" ? (
            <motion.div
              key="simulator"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ScratchSimulator />
            </motion.div>
          ) : ongletActif === "envelope" ? (
            <motion.div
              key="envelope"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ScratchEnvelopeMonitor />
            </motion.div>
          ) : (
            <motion.div
              key="settings"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ScratchSettingsPanel />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

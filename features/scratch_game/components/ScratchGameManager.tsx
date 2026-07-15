"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Layers, Calculator, Activity, SlidersHorizontal } from "lucide-react";
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
import { CreateScratchLotDto, ScratchLot } from "../types/scratch.types";
import { useAuthStore } from "../../users/hook/authStore";
import { UserRole } from "../../users/types/user.types";

type ScratchTab = "lots" | "simulator" | "envelope" | "settings";

const TABS: { key: ScratchTab; label: string; icon: React.ElementType }[] = [
  { key: "lots", label: "Lots", icon: Layers },
  { key: "simulator", label: "Simulateur", icon: Calculator },
  { key: "envelope", label: "Enveloppe", icon: Activity },
  { key: "settings", label: "Réglages", icon: SlidersHorizontal },
];

export default function ScratchGameManager() {
  const [tab, setTab] = useState<ScratchTab>("lots");
  const [formMode, setFormMode] = useState<null | "create" | "edit">(null);
  const [editing, setEditing] = useState<ScratchLot | null>(null);

  const { user } = useAuthStore();
  const canManage = user?.role === UserRole.ADMIN;

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
    <div className="max-w-6xl mx-auto space-y-6">
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
          {tab === "lots" && !formMode && canManage && (
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
        {!formMode && (
          <div className="flex items-center gap-1.5 border-b border-[#F1F3F5] mb-6 overflow-x-auto">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.key;
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
          {formMode ? (
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
          ) : tab === "lots" ? (
            <motion.div
              key="lots"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ScratchLotsList
                lots={lots}
                isLoading={isLoading}
                onEdit={openEdit}
                onDelete={handleDelete}
                onToggleActive={handleToggleActive}
              />
            </motion.div>
          ) : tab === "simulator" ? (
            <motion.div
              key="simulator"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ScratchSimulator />
            </motion.div>
          ) : tab === "envelope" ? (
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

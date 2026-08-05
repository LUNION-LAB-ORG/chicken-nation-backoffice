"use client";

import React from "react";
import { Pencil, Trash2, Star, Power, PowerOff } from "lucide-react";
import { ScratchLot } from "../types/scratch.types";
import {
  describePayload,
  LEVEL_LABEL,
  money,
  REWARD_TYPE_BADGE,
  REWARD_TYPE_LABEL,
} from "../utils/scratch.utils";

interface ScratchLotsListProps {
  lots: ScratchLot[] | undefined;
  isLoading: boolean;
  onEdit: (lot: ScratchLot) => void;
  onDelete: (lot: ScratchLot) => void;
  onToggleActive: (lot: ScratchLot) => void;
}

const Th: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => (
  <th
    className={`px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[#9796A1] ${className}`}
  >
    {children}
  </th>
);

const Td: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => <td className={`px-4 py-3 text-sm text-[#18181B] ${className}`}>{children}</td>;

export default function ScratchLotsList({
  lots,
  isLoading,
  onEdit,
  onDelete,
  onToggleActive,
}: ScratchLotsListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-[#F17922] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!lots || lots.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-[#E4E4E7]">
        <div className="text-5xl mb-3">🎰</div>
        <h3 className="text-lg font-semibold text-gray-700">Aucun lot</h3>
        <p className="text-gray-500">
          Ajoutez des lots pour alimenter le moteur Gratte &amp; Gagne.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[#E4E4E7] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] border-collapse">
          <thead className="bg-[#FAFAFA] border-b border-[#F1F3F5]">
            <tr>
              <Th>Lot</Th>
              <Th>Type</Th>
              <Th>Contenu</Th>
              <Th className="text-right">Poids</Th>
              <Th className="text-right">Coût unit.</Th>
              <Th className="text-right">Panier min</Th>
              <Th className="text-right">Stock</Th>
              <Th className="text-right">Plafond</Th>
              <Th>Niveau</Th>
              <Th>Statut</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F3F5]">
            {lots.map((lot) => (
              <tr
                key={lot.id}
                className={`hover:bg-[#FFF9F2] transition-colors ${
                  lot.is_floor ? "bg-[#FFFBF5]" : ""
                }`}
              >
                <Td>
                  <div className="flex items-center gap-2">
                    {lot.is_floor && (
                      <span className="inline-flex items-center gap-1 bg-[#FFF6E9] text-[#B25A00] text-[10px] font-bold px-2 py-0.5 rounded-full">
                        <Star size={11} /> PLANCHER
                      </span>
                    )}
                    <span className="font-medium">{lot.label}</span>
                  </div>
                </Td>
                <Td>
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      REWARD_TYPE_BADGE[lot.reward_type]
                    }`}
                  >
                    {REWARD_TYPE_LABEL[lot.reward_type]}
                  </span>
                </Td>
                <Td className="text-[#71717A]">
                  {describePayload(
                    lot.reward_type,
                    lot.payload as Record<string, unknown>
                  )}
                </Td>
                <Td className="text-right font-medium">{lot.weight}</Td>
                <Td className="text-right">{money(lot.unit_cost)}</Td>
                <Td className="text-right">
                  {lot.min_cart > 0 ? money(lot.min_cart) : "Aucun"}
                </Td>
                <Td className="text-right">
                  {lot.stock == null ? (
                    <span className="text-[#9796A1]">∞</span>
                  ) : (
                    <span>
                      {lot.stock_used}
                      <span className="text-[#9796A1]"> / {lot.stock}</span>
                    </span>
                  )}
                </Td>
                <Td className="text-right">
                  {lot.frequency_cap == null ? (
                    <span className="text-[#9796A1]">∞</span>
                  ) : (
                    lot.frequency_cap
                  )}
                </Td>
                <Td>
                  {lot.level_min ? (
                    <span className="text-[11px] font-medium text-[#71717A]">
                      {LEVEL_LABEL[lot.level_min] ?? lot.level_min}+
                    </span>
                  ) : (
                    <span className="text-[#9796A1]">Tous</span>
                  )}
                </Td>
                <Td>
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      lot.active
                        ? "bg-[#E6F4EC] text-[#1E8E5A]"
                        : "bg-[#EEF1F4] text-[#6C757D]"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        lot.active ? "bg-[#1E8E5A]" : "bg-[#6C757D]"
                      }`}
                    />
                    {lot.active ? "Actif" : "Inactif"}
                  </span>
                </Td>
                <Td>
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      title={lot.active ? "Désactiver" : "Activer"}
                      onClick={() => onToggleActive(lot)}
                      className="p-1.5 rounded-lg text-[#71717A] hover:bg-[#F1F3F5] cursor-pointer"
                    >
                      {lot.active ? (
                        <PowerOff size={16} />
                      ) : (
                        <Power size={16} />
                      )}
                    </button>
                    <button
                      type="button"
                      title="Éditer"
                      onClick={() => onEdit(lot)}
                      className="p-1.5 rounded-lg text-[#2B6CB0] hover:bg-[#E7F0FB] cursor-pointer"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      title={
                        lot.is_floor
                          ? "Le plancher n'est pas supprimable"
                          : "Supprimer"
                      }
                      disabled={lot.is_floor}
                      onClick={() => onDelete(lot)}
                      className={`p-1.5 rounded-lg ${
                        lot.is_floor
                          ? "text-[#D9D9D9] cursor-not-allowed"
                          : "text-[#C0392B] hover:bg-[#FDECEA] cursor-pointer"
                      }`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

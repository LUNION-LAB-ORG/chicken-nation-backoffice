"use client";

import React from "react";
import { Pencil, Trash2, BarChart3, Gift } from "lucide-react";
import { ComboGame } from "../types/combo.types";
import {
  dateTimeFmt,
  describeSolution,
  resolveStatus,
  STATUS_BADGE,
  STATUS_LABEL,
} from "../utils/combo.utils";

interface ComboGamesListProps {
  games: ComboGame[] | undefined;
  isLoading: boolean;
  onEdit: (game: ComboGame) => void;
  onDelete: (game: ComboGame) => void;
  onTrack: (game: ComboGame) => void;
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
}) => (
  <td className={`px-4 py-3 text-sm text-[#18181B] ${className}`}>{children}</td>
);

export default function ComboGamesList({
  games,
  isLoading,
  onEdit,
  onDelete,
  onTrack,
}: ComboGamesListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-[#F17922] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!games || games.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-[#E4E4E7]">
        <div className="text-5xl mb-3">🍔</div>
        <h3 className="text-lg font-semibold text-gray-700">Aucun jeu</h3>
        <p className="text-gray-500">
          Créez un jeu pour lancer un Combo Mystère.
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
              <Th>Jeu</Th>
              <Th>Solution</Th>
              <Th>Lot</Th>
              <Th>Fenêtre</Th>
              <Th className="text-right">Essais</Th>
              <Th className="text-right">Gagnants</Th>
              <Th>Statut</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F3F5]">
            {games.map((game) => {
              const status = resolveStatus(game);
              return (
                <tr
                  key={game.id}
                  className="hover:bg-[#FFF9F2] transition-colors"
                >
                  <Td>
                    <div className="font-medium">{game.title}</div>
                    {game.stats && (
                      <div className="text-[11px] text-[#9796A1] mt-0.5">
                        {game.stats.participants_count} joueur(s) ·{" "}
                        {game.stats.correct_count} bonne(s) réponse(s)
                      </div>
                    )}
                  </Td>
                  <Td className="text-[#71717A] max-w-[220px]">
                    <span className="line-clamp-2">
                      {describeSolution(game.solution_items)}
                    </span>
                  </Td>
                  <Td className="text-[#71717A]">
                    <span className="inline-flex items-center gap-1">
                      <Gift size={13} className="text-[#F17922]" />
                      {game.gift?.label ||
                        game.gift?.name ||
                        (game.gift?.supplement_id
                          ? "Supplément offert"
                          : game.gift?.dish_id
                          ? "Plat offert"
                          : "—")}
                      {game.gift?.quantity && game.gift.quantity > 1
                        ? ` ×${game.gift.quantity}`
                        : ""}
                    </span>
                  </Td>
                  <Td className="text-[#71717A] whitespace-nowrap text-[12px]">
                    <div>{dateTimeFmt(game.starts_at)}</div>
                    <div className="text-[#9796A1]">
                      → {dateTimeFmt(game.ends_at)}
                    </div>
                  </Td>
                  <Td className="text-right font-medium">
                    {game.max_attempts}
                  </Td>
                  <Td className="text-right font-medium">
                    {game.winners_count}
                  </Td>
                  <Td>
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[status]}`}
                    >
                      {STATUS_LABEL[status]}
                    </span>
                  </Td>
                  <Td>
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        title="Suivi"
                        onClick={() => onTrack(game)}
                        className="p-1.5 rounded-lg text-[#1E8E5A] hover:bg-[#E6F4EC] cursor-pointer"
                      >
                        <BarChart3 size={16} />
                      </button>
                      <button
                        type="button"
                        title="Éditer"
                        onClick={() => onEdit(game)}
                        className="p-1.5 rounded-lg text-[#2B6CB0] hover:bg-[#E7F0FB] cursor-pointer"
                      >
                        <Pencil size={16} />
                      </button>
                      {/* Un jeu déjà tiré se conserve pour l'audit des
                          gagnants : le bouton reste visible mais inactif,
                          avec l'explication au survol. */}
                      <button
                        type="button"
                        title={
                          game.status === "DRAWN"
                            ? "Un jeu déjà tiré se conserve pour garder la trace des gagnants"
                            : "Supprimer"
                        }
                        disabled={game.status === "DRAWN"}
                        onClick={() => onDelete(game)}
                        className={`p-1.5 rounded-lg ${
                          game.status === "DRAWN"
                            ? "text-gray-300 cursor-not-allowed"
                            : "text-[#C0392B] hover:bg-[#FDECEA] cursor-pointer"
                        }`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

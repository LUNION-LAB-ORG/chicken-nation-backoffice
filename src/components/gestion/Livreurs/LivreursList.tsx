"use client";

import React from "react";
import { Users2 } from "lucide-react";

import LivreurRow from "./LivreurRow";
import type { Livreur } from "../../../../features/livreurs/types/livreur.types";

interface LivreursListProps {
  livreurs: Livreur[];
  isLoading: boolean;
  onView: (livreur: Livreur) => void;
  onMenu: (livreur: Livreur) => void;
}

const LivreursList: React.FC<LivreursListProps> = ({ livreurs, isLoading, onView, onMenu }) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F17922]" />
      </div>
    );
  }

  if (livreurs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-[#71717A]">
        <Users2 className="w-12 h-12 mb-3 text-[#D4D4D8]" />
        <p className="text-sm font-medium">Aucun livreur pour ce filtre</p>
        <p className="text-xs mt-1">Les livreurs apparaîtront ici après leur inscription via l'app mobile.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[12px] border border-[#F4F4F5] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#FAFAFA] border-b border-[#F4F4F5]">
            <tr>
              <th className="text-left py-3 px-4 text-xs font-semibold text-[#71717A] uppercase tracking-wide">Livreur</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-[#71717A] uppercase tracking-wide">Email</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-[#71717A] uppercase tracking-wide">Véhicule</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-[#71717A] uppercase tracking-wide">Restaurant</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-[#71717A] uppercase tracking-wide">Statut</th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-[#71717A] uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody>
            {livreurs.map((livreur) => (
              <LivreurRow
                key={livreur.id}
                livreur={livreur}
                onView={() => onView(livreur)}
                onMenu={() => onMenu(livreur)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LivreursList;

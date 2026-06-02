"use client";

import React from "react";
import { Users2 } from "lucide-react";

import LivreurRow from "./LivreurRow";
import type { Livreur } from "../../../../features/livreurs/types/livreur.types";
import type { IDelivererLive } from "../../../../features/livreurs/types/deliverer-live.type";

interface LivreursListProps {
  livreurs: Livreur[];
  isLoading: boolean;
  onView: (livreur: Livreur) => void;
  liveMap?: Map<string, IDelivererLive>;
}

const HEADERS = [
  "Livreur",
  "Restaurant",
  "Véhicule",
  "Disponibilité",
  "File",
  "GPS",
  "Statut",
  "Actions",
] as const;

const SkeletonRow: React.FC = () => (
  <tr className="border-b border-[#F4F4F5]">
    {/* Livreur */}
    <td className="py-3 px-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-[#F4F4F5] animate-pulse flex-shrink-0" />
        <div className="space-y-1.5">
          <div className="h-3 w-28 rounded-full bg-[#F4F4F5] animate-pulse" />
          <div className="h-2.5 w-20 rounded-full bg-[#F4F4F5] animate-pulse" />
        </div>
      </div>
    </td>
    {/* Restaurant */}
    <td className="py-3 px-4">
      <div className="h-3 w-24 rounded-full bg-[#F4F4F5] animate-pulse" />
    </td>
    {/* Véhicule */}
    <td className="py-3 px-4">
      <div className="h-3 w-12 rounded-full bg-[#F4F4F5] animate-pulse" />
    </td>
    {/* Dispo */}
    <td className="py-3 px-4">
      <div className="h-5 w-20 rounded-full bg-[#F4F4F5] animate-pulse" />
    </td>
    {/* File */}
    <td className="py-3 px-4">
      <div className="h-3 w-8 rounded-full bg-[#F4F4F5] animate-pulse" />
    </td>
    {/* GPS */}
    <td className="py-3 px-4">
      <div className="h-3 w-16 rounded-full bg-[#F4F4F5] animate-pulse" />
    </td>
    {/* Statut */}
    <td className="py-3 px-4">
      <div className="h-5 w-16 rounded-full bg-[#F4F4F5] animate-pulse" />
    </td>
    {/* Actions */}
    <td className="py-3 px-4">
      <div className="h-7 w-7 rounded-md bg-[#F4F4F5] animate-pulse ml-auto" />
    </td>
  </tr>
);

const LivreursList: React.FC<LivreursListProps> = ({
  livreurs,
  isLoading,
  onView,
  liveMap,
}) => {
  return (
    <div className="bg-white rounded-[12px] border border-[#F4F4F5] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#FAFAFA] border-b border-[#F4F4F5]">
            <tr>
              {HEADERS.map((header, idx) => (
                <th
                  key={header}
                  className={`py-3 px-4 text-xs font-semibold text-[#71717A] uppercase tracking-wide ${
                    idx === HEADERS.length - 1 ? "text-right" : "text-left"
                  }`}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <>
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </>
            ) : livreurs.length === 0 ? (
              <tr>
                <td colSpan={HEADERS.length}>
                  <div className="flex flex-col items-center justify-center py-16 text-[#71717A]">
                    <Users2 className="w-12 h-12 mb-3 text-[#D4D4D8]" />
                    <p className="text-sm font-medium">Aucun livreur pour ce filtre</p>
                  </div>
                </td>
              </tr>
            ) : (
              livreurs.map((livreur) => (
                <LivreurRow
                  key={livreur.id}
                  livreur={livreur}
                  live={liveMap?.get(livreur.id)}
                  onView={() => onView(livreur)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LivreursList;

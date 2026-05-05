"use client";

import React from "react";
import { Store, Truck } from "lucide-react";

import type { Livreur, VehiculeType } from "../../types/livreur.types";

interface AffectationSectionProps {
  livreur: Livreur;
  onAssignRestaurant: () => void;
}

const vehiculeLabel: Record<VehiculeType, string> = {
  MOTO: "Moto",
  VELO: "Vélo",
  VOITURE: "Voiture",
};

const AffectationSection: React.FC<AffectationSectionProps> = ({
  livreur,
  onAssignRestaurant,
}) => (
  <div className="mb-6">
    <p className="text-[18px] font-medium text-[#F17922] mb-3">Affectation</p>

    {/* Restaurant */}
    <div className="rounded-xl border border-[#E4E4E7] bg-white p-4 mb-3">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-lg bg-[#F17922]/10 flex items-center justify-center flex-shrink-0">
          <Store className="w-5 h-5 text-[#F17922]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-[#71717A]">Restaurant affecté</p>
          {livreur.restaurant ? (
            <>
              <p className="text-sm font-semibold text-[#18181B] mt-0.5">
                {livreur.restaurant.name}
              </p>
              {livreur.restaurant.address && (
                <p className="text-xs text-[#71717A] mt-0.5">{livreur.restaurant.address}</p>
              )}
            </>
          ) : (
            <p className="text-sm text-[#A1A1AA] italic mt-0.5">Aucun restaurant affecté</p>
          )}
        </div>
        <button
          type="button"
          onClick={onAssignRestaurant}
          className="px-3 py-1.5 text-xs font-semibold text-[#F17922] bg-[#F17922]/10 rounded-lg hover:bg-[#F17922]/20"
        >
          {livreur.restaurant_id ? "Changer" : "Affecter"}
        </button>
      </div>
    </div>

    {/* Véhicule */}
    <div className="rounded-xl border border-[#E4E4E7] bg-white p-4">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-lg bg-[#F17922]/10 flex items-center justify-center flex-shrink-0">
          <Truck className="w-5 h-5 text-[#F17922]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-[#71717A]">Type de véhicule</p>
          <p className="text-sm font-semibold text-[#18181B] mt-0.5">
            {livreur.type_vehicule ? vehiculeLabel[livreur.type_vehicule] : "Non renseigné"}
          </p>
        </div>
      </div>
    </div>
  </div>
);

export default AffectationSection;

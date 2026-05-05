"use client";

import React, { useEffect, useState } from "react";
import { Store } from "lucide-react";

import ModalShell from "./ModalShell";
import { useAssignRestaurant } from "../../../../features/livreurs/hook/use-livreurs";
import { getAllRestaurants, Restaurant } from "@/services/restaurantService";

interface AssignRestaurantModalProps {
  isOpen: boolean;
  onClose: () => void;
  livreurId: string;
  livreurNom: string;
  currentRestaurantId?: string | null;
}

const AssignRestaurantModal: React.FC<AssignRestaurantModalProps> = ({
  isOpen,
  onClose,
  livreurId,
  livreurNom,
  currentRestaurantId,
}) => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedId, setSelectedId] = useState<string>(currentRestaurantId ?? "");
  const [loading, setLoading] = useState(false);
  const { mutate, isPending } = useAssignRestaurant();

  useEffect(() => {
    if (!isOpen) return;
    setSelectedId(currentRestaurantId ?? "");
    setLoading(true);
    getAllRestaurants()
      .then((data) => setRestaurants(data.filter((r) => r.active)))
      .finally(() => setLoading(false));
  }, [isOpen, currentRestaurantId]);

  const handleConfirm = () => {
    if (!selectedId) return;
    mutate(
      { id: livreurId, payload: { restaurant_id: selectedId } },
      { onSuccess: onClose },
    );
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Affecter un restaurant"
      icon={<Store className="w-5 h-5 text-[#F17922]" />}
    >
      <p className="text-sm text-[#52525B] mb-4">
        Choisissez le restaurant auquel affecter <strong>{livreurNom}</strong>. Le livreur
        recevra les courses de ce restaurant uniquement.
      </p>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#F17922]" />
        </div>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {restaurants.map((r) => {
            const isSelected = selectedId === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setSelectedId(r.id)}
                className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                  isSelected
                    ? "border-[#F17922] bg-[#FFF7F2]"
                    : "border-[#E4E4E7] hover:border-[#F17922]/50 hover:bg-[#FAFAFA]"
                }`}
              >
                <div className="font-semibold text-sm text-[#18181B]">{r.name}</div>
                {r.address && <div className="text-xs text-[#71717A] mt-0.5">{r.address}</div>}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex justify-end gap-2 mt-6">
        <button
          type="button"
          onClick={onClose}
          disabled={isPending}
          className="px-4 py-2 text-sm font-medium text-[#52525B] rounded-lg hover:bg-[#F4F4F5] disabled:opacity-50"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!selectedId || selectedId === currentRestaurantId || isPending}
          className="px-4 py-2 text-sm font-semibold text-white bg-[#F17922] rounded-lg hover:bg-[#DC6718] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "Affectation…" : "Affecter"}
        </button>
      </div>
    </ModalShell>
  );
};

export default AssignRestaurantModal;

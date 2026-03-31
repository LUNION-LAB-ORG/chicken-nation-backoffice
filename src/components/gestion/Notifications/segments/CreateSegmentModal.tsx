"use client";

import React, { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import {
  useCreateSegmentMutation,
  useUpdateSegmentMutation,
  usePreviewCustomFiltersMutation,
} from "@/hooks/usePushCampaignQuery";
import type { PushSegment, SegmentFilters } from "@/types/push-campaign";
import { Loader2, Users, Eye } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  editSegment?: PushSegment | null;
}

const LOYALTY_LEVELS = [
  { value: "", label: "Tous" },
  { value: "STANDARD", label: "Standard" },
  { value: "GOLD", label: "Gold" },
  { value: "PREMIUM", label: "Premium" },
];

export default function CreateSegmentModal({
  isOpen,
  onClose,
  editSegment,
}: Props) {
  const createMutation = useCreateSegmentMutation();
  const updateMutation = useUpdateSegmentMutation();
  const previewMutation = usePreviewCustomFiltersMutation();

  const isEdit = !!editSegment && !editSegment.is_system;
  const isPending = createMutation.isPending || updateMutation.isPending;

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [nameContains, setNameContains] = useState("");
  const [phoneContains, setPhoneContains] = useState("");
  const [emailContains, setEmailContains] = useState("");
  const [minOrders, setMinOrders] = useState("");
  const [maxOrders, setMaxOrders] = useState("");
  const [minSpent, setMinSpent] = useState("");
  const [maxSpent, setMaxSpent] = useState("");
  const [loyaltyLevel, setLoyaltyLevel] = useState("");
  const [city, setCity] = useState("");
  const [minPoints, setMinPoints] = useState("");
  const [maxPoints, setMaxPoints] = useState("");
  const [lastOrderDays, setLastOrderDays] = useState("");
  const [noOrderDays, setNoOrderDays] = useState("");

  useEffect(() => {
    if (editSegment && !editSegment.is_system) {
      setName(editSegment.label);
      setDescription(editSegment.description ?? "");

      const seg = editSegment as any;
      const filters: SegmentFilters = seg.filters ?? {};
      setNameContains(filters.name_contains ?? "");
      setPhoneContains(filters.phone_contains ?? "");
      setEmailContains(filters.email_contains ?? "");
      setMinOrders(filters.min_orders?.toString() ?? "");
      setMaxOrders(filters.max_orders?.toString() ?? "");
      setMinSpent(filters.min_spent?.toString() ?? "");
      setMaxSpent(filters.max_spent?.toString() ?? "");
      setLoyaltyLevel(filters.loyalty_level ?? "");
      setCity(filters.city ?? "");
      setMinPoints(filters.min_points?.toString() ?? "");
      setMaxPoints(filters.max_points?.toString() ?? "");
      setLastOrderDays(filters.last_order_days?.toString() ?? "");
      setNoOrderDays(filters.no_order_days?.toString() ?? "");
    } else {
      resetForm();
    }
  }, [editSegment, isOpen]);

  const resetForm = () => {
    setName("");
    setDescription("");
    setNameContains("");
    setPhoneContains("");
    setEmailContains("");
    setMinOrders("");
    setMaxOrders("");
    setMinSpent("");
    setMaxSpent("");
    setLoyaltyLevel("");
    setCity("");
    setMinPoints("");
    setMaxPoints("");
    setLastOrderDays("");
    setNoOrderDays("");
    previewMutation.reset();
  };

  const buildFilters = (): SegmentFilters => {
    const filters: SegmentFilters = {};
    if (nameContains) filters.name_contains = nameContains;
    if (phoneContains) filters.phone_contains = phoneContains;
    if (emailContains) filters.email_contains = emailContains;
    if (minOrders) filters.min_orders = Number(minOrders);
    if (maxOrders) filters.max_orders = Number(maxOrders);
    if (minSpent) filters.min_spent = Number(minSpent);
    if (maxSpent) filters.max_spent = Number(maxSpent);
    if (loyaltyLevel) filters.loyalty_level = loyaltyLevel;
    if (city) filters.city = city;
    if (minPoints) filters.min_points = Number(minPoints);
    if (maxPoints) filters.max_points = Number(maxPoints);
    if (lastOrderDays) filters.last_order_days = Number(lastOrderDays);
    if (noOrderDays) filters.no_order_days = Number(noOrderDays);
    return filters;
  };

  const handlePreview = () => {
    const filters = buildFilters();
    previewMutation.mutate(filters);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const filters = buildFilters();
    const payload = {
      name,
      description: description || undefined,
      filters,
    };

    if (isEdit && editSegment?.id) {
      updateMutation.mutate(
        { id: editSegment.id, payload },
        {
          onSuccess: () => {
            resetForm();
            onClose();
          },
        }
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          resetForm();
          onClose();
        },
      });
    }
  };

  const hasAnyFilter =
    nameContains ||
    phoneContains ||
    emailContains ||
    minOrders ||
    maxOrders ||
    minSpent ||
    maxSpent ||
    loyaltyLevel ||
    city ||
    minPoints ||
    maxPoints ||
    lastOrderDays ||
    noOrderDays;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Modifier le segment" : "Nouveau segment"}
      size="large"
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-6 max-h-[75vh] overflow-y-auto pr-1"
      >
        {/* Nom + description */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nom du segment
            </label>
            <input
              type="text"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Ex: VIP Abidjan"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Description (optionnel)
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Ex: Clients Gold d'Abidjan avec 5+ commandes"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        {/* Filtres */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Critères de ciblage
          </label>
          <p className="text-xs text-gray-400 mb-4">
            Tous les critères sont combinés en AND (intersection). Laissez vide
            pour ignorer un critère.
          </p>

          <div className="grid grid-cols-2 gap-4">
            {/* Identité client */}
            <div className="col-span-2 border border-gray-100 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Client
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Nom / prénom contient
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Ex: Koné"
                    value={nameContains}
                    onChange={(e) => setNameContains(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Téléphone contient
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Ex: +225"
                    value={phoneContains}
                    onChange={(e) => setPhoneContains(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Email contient
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Ex: gmail.com"
                    value={emailContains}
                    onChange={(e) => setEmailContains(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Commandes */}
            <div className="col-span-2 border border-gray-100 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Commandes
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Min commandes
                  </label>
                  <input
                    type="number"
                    min={0}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Ex: 5"
                    value={minOrders}
                    onChange={(e) => setMinOrders(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Max commandes
                  </label>
                  <input
                    type="number"
                    min={0}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Ex: 10"
                    value={maxOrders}
                    onChange={(e) => setMaxOrders(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Dépenses */}
            <div className="col-span-2 border border-gray-100 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Dépenses (FCFA)
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Min total dépensé
                  </label>
                  <input
                    type="number"
                    min={0}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Ex: 50000"
                    value={minSpent}
                    onChange={(e) => setMinSpent(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Max total dépensé
                  </label>
                  <input
                    type="number"
                    min={0}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Ex: 200000"
                    value={maxSpent}
                    onChange={(e) => setMaxSpent(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Fidélité + Points */}
            <div className="border border-gray-100 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Fidélité
              </h4>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                value={loyaltyLevel}
                onChange={(e) => setLoyaltyLevel(e.target.value)}
              >
                {LOYALTY_LEVELS.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Min points
                  </label>
                  <input
                    type="number"
                    min={0}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="0"
                    value={minPoints}
                    onChange={(e) => setMinPoints(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Max points
                  </label>
                  <input
                    type="number"
                    min={0}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="10000"
                    value={maxPoints}
                    onChange={(e) => setMaxPoints(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Ville */}
            <div className="border border-gray-100 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Ville
              </h4>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Ex: Abidjan"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>

            {/* Activité */}
            <div className="col-span-2 border border-gray-100 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Activité récente
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    A commandé dans les X derniers jours
                  </label>
                  <input
                    type="number"
                    min={1}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Ex: 7"
                    value={lastOrderDays}
                    onChange={(e) => setLastOrderDays(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Inactif depuis X jours
                  </label>
                  <input
                    type="number"
                    min={1}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Ex: 30"
                    value={noOrderDays}
                    onChange={(e) => setNoOrderDays(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handlePreview}
            disabled={!hasAnyFilter || previewMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer disabled:opacity-50 transition-all"
          >
            {previewMutation.isPending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Eye size={14} />
            )}
            Prévisualiser
          </button>
          {previewMutation.data && (
            <div className="flex items-center gap-2 px-3 py-2 bg-[#FFF3E8] rounded-xl">
              <Users size={14} className="text-[#F17922]" />
              <span className="text-sm font-semibold text-[#F17922]">
                {previewMutation.data.count.toLocaleString("fr-FR")}{" "}
                destinataires
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 cursor-pointer"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isPending || !name}
            className="px-6 py-2.5 bg-[#F17922] text-white rounded-xl text-sm font-semibold hover:bg-[#e06816] transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            {isPending && <Loader2 size={16} className="animate-spin" />}
            {isEdit ? "Enregistrer" : "Créer le segment"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

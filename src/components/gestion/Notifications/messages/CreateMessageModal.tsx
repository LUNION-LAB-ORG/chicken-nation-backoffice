"use client";

import React, { useState } from "react";
import Modal from "@/components/ui/Modal";
import {
  useCreateCampaignMutation,
  useSegmentsQuery,
  usePreviewSegmentMutation,
} from "@/hooks/usePushCampaignQuery";
import type { CreateCampaignPayload, PushSegment } from "@/types/push-campaign";
import { Bell, Loader2, Users, Filter, Send } from "lucide-react";
import VariablePicker from "../VariablePicker";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type TargetMode = "all" | "segment" | "filters";

export default function CreateMessageModal({ isOpen, onClose }: Props) {
  const { mutate: createCampaign, isPending } = useCreateCampaignMutation();
  const { data: segments } = useSegmentsQuery();
  const previewMutation = usePreviewSegmentMutation();

  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  // Targeting
  const [targetMode, setTargetMode] = useState<TargetMode>("all");
  const [selectedSegment, setSelectedSegment] = useState("");

  // Filters
  const [filterField, setFilterField] = useState("orders");
  const [filterOperator, setFilterOperator] = useState("gte");
  const [filterValue, setFilterValue] = useState("");

  const resetForm = () => {
    setName("");
    setTitle("");
    setBody("");
    setImageUrl("");
    setTargetMode("all");
    setSelectedSegment("");
    setFilterField("orders");
    setFilterOperator("gte");
    setFilterValue("");
  };

  const buildTargetConfig = (): { target_type: string; target_config: Record<string, any> } => {
    if (targetMode === "all") {
      return { target_type: "all", target_config: {} };
    }
    if (targetMode === "segment") {
      return { target_type: "segment", target_config: { segment: selectedSegment } };
    }
    // filters
    return {
      target_type: "filters",
      target_config: {
        filters: [
          { field: filterField, operator: filterOperator, value: filterValue },
        ],
      },
    };
  };

  const handlePreview = () => {
    const { target_type, target_config } = buildTargetConfig();
    previewMutation.mutate({
      target_type: target_type as any,
      target_config,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { target_type, target_config } = buildTargetConfig();

    const payload: CreateCampaignPayload = {
      name: name || title,
      title,
      body,
      target_type: target_type as any,
      target_config,
      ...(imageUrl ? { image_url: imageUrl } : {}),
    };

    createCampaign(payload, {
      onSuccess: () => {
        resetForm();
        onClose();
      },
    });
  };

  const FILTER_FIELDS = [
    { key: "orders", label: "Nombre de commandes" },
    { key: "total_spent", label: "Total dépensé (FCFA)" },
    { key: "loyalty_level", label: "Niveau fidélité" },
    { key: "city", label: "Ville" },
  ];

  const OPERATORS = [
    { key: "gte", label: "Supérieur ou égal à" },
    { key: "lte", label: "Inférieur ou égal à" },
    { key: "eq", label: "Égal à" },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Envoyer une notification push">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Nom de la campagne
          </label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="Ex: Promo weekend"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* Title */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium text-gray-700">
              Titre de la notification
            </label>
            <VariablePicker onInsert={(v) => setTitle((prev) => prev + v)} />
          </div>
          <input
            type="text"
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="Ex: Bonjour {{first_name}} !"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* Body */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium text-gray-700">
              Message
            </label>
            <VariablePicker onInsert={(v) => setBody((prev) => prev + v)} />
          </div>
          <textarea
            required
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
            placeholder="Ex: {{first_name}}, profitez de -20% aujourd'hui !"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </div>

        {/* Image URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Image URL (optionnel)
          </label>
          <input
            type="url"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="https://..."
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />
        </div>

        {/* Targeting */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ciblage
          </label>
          <div className="flex gap-2 mb-3">
            {[
              { id: "all" as const, label: "Tous les abonnés", icon: <Users size={14} /> },
              { id: "segment" as const, label: "Segment", icon: <Bell size={14} /> },
              { id: "filters" as const, label: "Filtres", icon: <Filter size={14} /> },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setTargetMode(opt.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                  targetMode === opt.id
                    ? "border-[#F17922] bg-[#FFF3E8] text-[#F17922]"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                {opt.icon}
                {opt.label}
              </button>
            ))}
          </div>

          {/* Segment picker */}
          {targetMode === "segment" && (
            <select
              value={selectedSegment}
              onChange={(e) => setSelectedSegment(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Choisir un segment</option>
              {(segments ?? []).map((seg) => (
                <option key={seg.key} value={seg.key}>
                  {seg.label} ({seg.count})
                </option>
              ))}
            </select>
          )}

          {/* Filters */}
          {targetMode === "filters" && (
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <select
                  value={filterField}
                  onChange={(e) => setFilterField(e.target.value)}
                  className="border border-gray-300 rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {FILTER_FIELDS.map((f) => (
                    <option key={f.key} value={f.key}>
                      {f.label}
                    </option>
                  ))}
                </select>
                <select
                  value={filterOperator}
                  onChange={(e) => setFilterOperator(e.target.value)}
                  className="border border-gray-300 rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {OPERATORS.map((op) => (
                    <option key={op.key} value={op.key}>
                      {op.label}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Valeur"
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                  className="border border-gray-300 rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          )}

          {/* Preview count */}
          <button
            type="button"
            onClick={handlePreview}
            disabled={previewMutation.isPending}
            className="mt-2 text-xs text-[#F17922] hover:underline cursor-pointer flex items-center gap-1"
          >
            {previewMutation.isPending ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Users size={12} />
            )}
            {previewMutation.data
              ? `${previewMutation.data.count} destinataire${previewMutation.data.count > 1 ? "s" : ""}`
              : "Calculer le nombre de destinataires"}
          </button>
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
            disabled={isPending}
            className="px-6 py-2.5 bg-[#F17922] text-white rounded-xl text-sm font-semibold hover:bg-[#e06816] transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            {isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
            Envoyer
          </button>
        </div>
      </form>
    </Modal>
  );
}

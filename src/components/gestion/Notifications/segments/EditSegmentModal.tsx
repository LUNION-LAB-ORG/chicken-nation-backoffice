"use client";

import React, { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import { useUpdateSegmentMutation } from "@/hooks/useOnesignalQuery";
import type { OnesignalSegment, OnesignalFilter } from "@/types/onesignal";
import { Loader2, Plus, Trash2, AlertTriangle } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  segment: OnesignalSegment;
}

const FILTER_TYPES = [
  { value: "tag", label: "Tag utilisateur" },
  { value: "last_session", label: "Dernière session" },
  { value: "first_session", label: "Première session" },
  { value: "session_count", label: "Nombre de sessions" },
  { value: "language", label: "Langue" },
  { value: "app_version", label: "Version de l'app" },
  { value: "country", label: "Pays" },
];

const TAG_RELATIONS = [
  { value: ">", label: "supérieur à (>)" },
  { value: "<", label: "inférieur à (<)" },
  { value: "=", label: "égal à (=)" },
  { value: "!=", label: "différent de (!=)" },
  { value: "exists", label: "existe" },
  { value: "not_exists", label: "n'existe pas" },
];

const TIME_RELATIONS = [
  { value: ">", label: "il y a plus de (heures)" },
  { value: "<", label: "il y a moins de (heures)" },
];

const NUMERIC_RELATIONS = [
  { value: ">", label: "supérieur à" },
  { value: "<", label: "inférieur à" },
  { value: "=", label: "égal à" },
];

const STRING_RELATIONS = [
  { value: "=", label: "égal à" },
  { value: "!=", label: "différent de" },
];

const SUGGESTED_TAGS = [
  { key: "orders", label: "Commandes" },
  { key: "total_spent", label: "Total dépensé" },
  { key: "name", label: "Nom" },
  { key: "first_name", label: "Prénom" },
  { key: "birthday", label: "Anniversaire" },
  { key: "city", label: "Ville" },
  { key: "last_order_days", label: "Jours sans commande" },
  { key: "loyalty_points", label: "Points fidélité" },
  { key: "is_vip", label: "VIP" },
];

function getRelationsForField(field: string) {
  if (field === "tag") return TAG_RELATIONS;
  if (field === "last_session" || field === "first_session") return TIME_RELATIONS;
  if (field === "session_count") return NUMERIC_RELATIONS;
  return STRING_RELATIONS;
}

interface FilterRow {
  field: string;
  key: string;
  relation: string;
  value: string;
  operator: "AND" | "OR";
}

function emptyFilter(): FilterRow {
  return { field: "tag", key: "", relation: "=", value: "", operator: "AND" };
}

function toOnesignalFilters(rows: FilterRow[]): OnesignalFilter[] {
  const result: OnesignalFilter[] = [];
  rows.forEach((row, i) => {
    if (i > 0) {
      result.push({ field: row.operator === "OR" ? "OR" : "AND" } as unknown as OnesignalFilter);
    }
    const filter: OnesignalFilter = { field: row.field, relation: row.relation };
    if (row.field === "tag") filter.key = row.key;
    if (!["exists", "not_exists"].includes(row.relation)) filter.value = row.value;
    result.push(filter);
  });
  return result;
}

export default function EditSegmentModal({ isOpen, onClose, segment }: Props) {
  const { mutate: updateSegment, isPending } = useUpdateSegmentMutation();
  const [name, setName] = useState("");
  const [filters, setFilters] = useState<FilterRow[]>([emptyFilter()]);

  useEffect(() => {
    setName(segment.name || "");
    // OneSignal API doesn't return filters in the list endpoint
    setFilters([emptyFilter()]);
  }, [segment]);

  const updateFilter = (index: number, patch: Partial<FilterRow>) => {
    setFilters((prev) =>
      prev.map((f, i) => (i === index ? { ...f, ...patch } : f))
    );
  };

  const addFilter = () => {
    setFilters((prev) => [...prev, emptyFilter()]);
  };

  const removeFilter = (index: number) => {
    setFilters((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const onesignalFilters = toOnesignalFilters(filters);
    updateSegment(
      { id: segment.id, payload: { name, filters: onesignalFilters } },
      { onSuccess: () => onClose() }
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Modifier le segment" size="large">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Nom du segment
          </label>
          <input
            type="text"
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="flex items-start gap-3 bg-amber-50 rounded-xl p-4">
          <AlertTriangle size={18} className="text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-amber-800 font-medium">
              Redéfinition des filtres
            </p>
            <p className="text-xs text-amber-600 mt-1">
              L&apos;API OneSignal ne retourne pas les filtres existants d&apos;un segment.
              Les filtres ci-dessous remplaceront entièrement ceux définis précédemment.
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Nouveaux filtres
          </label>
          <div className="space-y-3">
            {filters.map((filter, index) => {
              const relations = getRelationsForField(filter.field);
              const needsValue = !["exists", "not_exists"].includes(filter.relation);

              return (
                <div key={index}>
                  {index > 0 && (
                    <div className="flex items-center gap-2 mb-2">
                      <select
                        value={filter.operator}
                        onChange={(e) =>
                          updateFilter(index, {
                            operator: e.target.value as "AND" | "OR",
                          })
                        }
                        className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      >
                        <option value="AND">ET</option>
                        <option value="OR">OU</option>
                      </select>
                      <div className="flex-1 h-px bg-gray-200" />
                    </div>
                  )}
                  <div className="bg-gray-50 rounded-xl p-3 space-y-3">
                    <div className="flex items-center gap-3">
                      <select
                        value={filter.field}
                        onChange={(e) => {
                          const newField = e.target.value;
                          const newRelations = getRelationsForField(newField);
                          updateFilter(index, {
                            field: newField,
                            relation: newRelations[0].value,
                            key: newField === "tag" ? filter.key : "",
                          });
                        }}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 min-w-[160px]"
                      >
                        {FILTER_TYPES.map((f) => (
                          <option key={f.value} value={f.value}>
                            {f.label}
                          </option>
                        ))}
                      </select>

                      {filter.field === "tag" && (
                        <input
                          type="text"
                          placeholder="Clé du tag"
                          required
                          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 w-40"
                          value={filter.key}
                          onChange={(e) => updateFilter(index, { key: e.target.value })}
                        />
                      )}

                      <select
                        value={filter.relation}
                        onChange={(e) =>
                          updateFilter(index, { relation: e.target.value })
                        }
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      >
                        {relations.map((r) => (
                          <option key={r.value} value={r.value}>
                            {r.label}
                          </option>
                        ))}
                      </select>

                      {needsValue && (
                        <input
                          type="text"
                          placeholder="Valeur"
                          required
                          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 flex-1"
                          value={filter.value}
                          onChange={(e) =>
                            updateFilter(index, { value: e.target.value })
                          }
                        />
                      )}

                      {filters.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeFilter(index)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 cursor-pointer flex-shrink-0"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>

                    {filter.field === "tag" && !filter.key && (
                      <div className="flex flex-wrap gap-1.5">
                        {SUGGESTED_TAGS.map((tag) => (
                          <button
                            key={tag.key}
                            type="button"
                            onClick={() => updateFilter(index, { key: tag.key })}
                            className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-xs text-gray-600 hover:border-[#F17922] hover:text-[#F17922] cursor-pointer transition-all"
                          >
                            {tag.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={addFilter}
            className="mt-3 flex items-center gap-1.5 text-sm text-[#F17922] font-medium hover:underline cursor-pointer"
          >
            <Plus size={16} />
            Ajouter un filtre
          </button>
        </div>

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
            {isPending && <Loader2 size={16} className="animate-spin" />}
            Enregistrer
          </button>
        </div>
      </form>
    </Modal>
  );
}

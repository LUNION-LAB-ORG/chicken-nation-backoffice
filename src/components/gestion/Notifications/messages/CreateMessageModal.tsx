"use client";

import React, { useState } from "react";
import Modal from "@/components/ui/Modal";
import { useCreateMessageMutation } from "@/hooks/useOnesignalQuery";
import { useTemplatesQuery, useSegmentsQuery } from "@/hooks/useOnesignalQuery";
import type { CreateMessagePayload, TargetChannel, OnesignalFilter } from "@/types/onesignal";
import { Bell, Mail, MessageSquare, Loader2, Plus, Trash2, Info } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type TargetType = "segments" | "filters" | "aliases";

const CHANNELS: { id: TargetChannel; label: string; icon: React.ReactNode }[] = [
  { id: "push", label: "Push", icon: <Bell size={18} /> },
  { id: "email", label: "Email", icon: <Mail size={18} /> },
  { id: "sms", label: "SMS", icon: <MessageSquare size={18} /> },
];

// Suggested tags matching Chicken Nation's data model
const SUGGESTED_TAGS = [
  { key: "orders", label: "Commandes", example: "> 5" },
  { key: "total_spent", label: "Total dépensé", example: "> 50000" },
  { key: "last_order_days", label: "Jours sans commande", example: "> 30" },
  { key: "loyalty_level", label: "Niveau fidélité", example: "= GOLD" },
  { key: "city", label: "Ville", example: "= Abidjan" },
];

const TAG_RELATIONS = [
  { value: ">", label: "supérieur à (>)" },
  { value: "<", label: "inférieur à (<)" },
  { value: "=", label: "égal à (=)" },
  { value: "!=", label: "différent de (!=)" },
  { value: "exists", label: "existe" },
  { value: "not_exists", label: "n'existe pas" },
];

interface FilterRow {
  key: string;
  relation: string;
  value: string;
  operator: "AND" | "OR";
}

function emptyFilterRow(): FilterRow {
  return { key: "", relation: "=", value: "", operator: "AND" };
}

function toOnesignalFilters(rows: FilterRow[]): OnesignalFilter[] {
  const result: OnesignalFilter[] = [];
  rows.forEach((row, i) => {
    if (i > 0) {
      result.push({ field: row.operator === "OR" ? "OR" : "AND" } as unknown as OnesignalFilter);
    }
    const filter: OnesignalFilter = { field: "tag", key: row.key, relation: row.relation };
    if (!["exists", "not_exists"].includes(row.relation)) {
      filter.value = row.value;
    }
    result.push(filter);
  });
  return result;
}

export default function CreateMessageModal({ isOpen, onClose }: Props) {
  const { mutate: createMessage, isPending } = useCreateMessageMutation();
  const { data: templatesData } = useTemplatesQuery({ limit: 50 });
  const { data: segmentsData } = useSegmentsQuery();

  const templates = templatesData?.templates ?? [];
  const segments = segmentsData?.segments ?? [];

  const [channel, setChannel] = useState<TargetChannel>("push");
  const [targetType, setTargetType] = useState<TargetType>("segments");
  const [selectedSegments, setSelectedSegments] = useState<string[]>(["Subscribed Users"]);
  const [externalIds, setExternalIds] = useState("");
  const [filterRows, setFilterRows] = useState<FilterRow[]>([emptyFilterRow()]);
  const [templateId, setTemplateId] = useState("");

  // Push
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [url, setUrl] = useState("");
  const [bigPicture, setBigPicture] = useState("");

  // Email
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  // Scheduling
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");

  const resetForm = () => {
    setChannel("push");
    setTargetType("segments");
    setSelectedSegments(["Subscribed Users"]);
    setExternalIds("");
    setFilterRows([emptyFilterRow()]);
    setTemplateId("");
    setTitle("");
    setMessage("");
    setUrl("");
    setBigPicture("");
    setEmailSubject("");
    setEmailBody("");
    setScheduleEnabled(false);
    setScheduledDate("");
  };

  const updateFilterRow = (index: number, patch: Partial<FilterRow>) => {
    setFilterRows((prev) =>
      prev.map((f, i) => (i === index ? { ...f, ...patch } : f))
    );
  };

  const addFilterRow = () => {
    setFilterRows((prev) => [...prev, emptyFilterRow()]);
  };

  const removeFilterRow = (index: number) => {
    setFilterRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload: CreateMessagePayload = {
      target_channel: channel,
    };

    // Content based on channel
    if (channel === "push") {
      if (templateId) {
        payload.template_id = templateId;
      } else {
        payload.headings = { en: title, fr: title };
        payload.contents = { en: message, fr: message };
        if (url) payload.url = url;
        if (bigPicture) payload.big_picture = bigPicture;
      }
    } else if (channel === "email") {
      payload.email_subject = emailSubject;
      payload.email_body = emailBody;
    } else if (channel === "sms") {
      payload.contents = { en: message, fr: message };
    }

    // Targeting
    if (targetType === "segments") {
      payload.included_segments = selectedSegments;
    } else if (targetType === "filters") {
      // Use tag filters — no segments needed
      payload.filters = toOnesignalFilters(filterRows);
    } else {
      const ids = externalIds
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);
      payload.include_aliases = { external_id: ids };
    }

    // Scheduling
    if (scheduleEnabled && scheduledDate) {
      payload.send_after = new Date(scheduledDate).toISOString();
    }

    createMessage(payload, {
      onSuccess: () => {
        resetForm();
        onClose();
      },
    });
  };

  const toggleSegment = (name: string) => {
    setSelectedSegments((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Envoyer une notification"
      size="large"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Channel selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Canal
          </label>
          <div className="flex gap-3">
            {CHANNELS.map((ch) => (
              <button
                key={ch.id}
                type="button"
                onClick={() => setChannel(ch.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all cursor-pointer ${
                  channel === ch.id
                    ? "border-[#F17922] bg-[#FFF3E8] text-[#F17922]"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                {ch.icon}
                {ch.label}
              </button>
            ))}
          </div>
        </div>

        {/* Template select (push only) */}
        {channel === "push" && templates.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Template (optionnel)
            </label>
            <select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Aucun — contenu personnalisé</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Content — Push */}
        {channel === "push" && !templateId && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Titre
              </label>
              <input
                type="text"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Titre de la notification"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Message
              </label>
              <textarea
                required
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                placeholder="Corps du message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  URL (optionnel)
                </label>
                <input
                  type="url"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="https://..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Image (optionnel)
                </label>
                <input
                  type="url"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="https://...image.png"
                  value={bigPicture}
                  onChange={(e) => setBigPicture(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Content — Email */}
        {channel === "email" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Sujet
              </label>
              <input
                type="text"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Sujet de l'email"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Corps HTML
              </label>
              <textarea
                required
                rows={6}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none font-mono"
                placeholder="<html>...</html>"
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Content — SMS */}
        {channel === "sms" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Message SMS
            </label>
            <textarea
              required
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              placeholder="Contenu du SMS"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
        )}

        {/* Targeting */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ciblage
          </label>
          <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={() => setTargetType("segments")}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                targetType === "segments"
                  ? "bg-[#FFF3E8] text-[#F17922] border border-[#F17922]"
                  : "border border-gray-200 text-gray-600"
              }`}
            >
              Par segment
            </button>
            <button
              type="button"
              onClick={() => setTargetType("filters")}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                targetType === "filters"
                  ? "bg-[#FFF3E8] text-[#F17922] border border-[#F17922]"
                  : "border border-gray-200 text-gray-600"
              }`}
            >
              Par tags
            </button>
            <button
              type="button"
              onClick={() => setTargetType("aliases")}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                targetType === "aliases"
                  ? "bg-[#FFF3E8] text-[#F17922] border border-[#F17922]"
                  : "border border-gray-200 text-gray-600"
              }`}
            >
              Par ID utilisateur
            </button>
          </div>

          {/* Segment targeting */}
          {targetType === "segments" && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => toggleSegment("Subscribed Users")}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  selectedSegments.includes("Subscribed Users")
                    ? "bg-[#F17922] text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                Tous les abonnés
              </button>
              {segments
                .filter((s) => s.name !== "Subscribed Users")
                .map((seg) => (
                  <button
                    key={seg.id}
                    type="button"
                    onClick={() => toggleSegment(seg.name)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                      selectedSegments.includes(seg.name)
                        ? "bg-[#F17922] text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {seg.name}
                  </button>
                ))}
            </div>
          )}

          {/* Tag filter targeting */}
          {targetType === "filters" && (
            <div className="space-y-3">
              <div className="flex items-start gap-3 bg-blue-50 rounded-xl p-3">
                <Info size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-700">
                  Ciblez les utilisateurs par leurs tags (nombre de commandes, ville, fidélité, etc.).
                  Les tags sont synchronisés automatiquement par le backend.
                </p>
              </div>

              {filterRows.map((row, index) => {
                const needsValue = !["exists", "not_exists"].includes(row.relation);
                return (
                  <div key={index}>
                    {index > 0 && (
                      <div className="flex items-center gap-2 mb-2">
                        <select
                          value={row.operator}
                          onChange={(e) =>
                            updateFilterRow(index, { operator: e.target.value as "AND" | "OR" })
                          }
                          className="border border-gray-200 rounded-lg px-3 py-1 text-xs font-medium text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                          <option value="AND">ET</option>
                          <option value="OR">OU</option>
                        </select>
                        <div className="flex-1 h-px bg-gray-200" />
                      </div>
                    )}
                    <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Clé du tag"
                          required
                          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 w-40"
                          value={row.key}
                          onChange={(e) => updateFilterRow(index, { key: e.target.value })}
                        />
                        <select
                          value={row.relation}
                          onChange={(e) => updateFilterRow(index, { relation: e.target.value })}
                          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                          {TAG_RELATIONS.map((r) => (
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
                            value={row.value}
                            onChange={(e) => updateFilterRow(index, { value: e.target.value })}
                          />
                        )}
                        {filterRows.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeFilterRow(index)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 cursor-pointer flex-shrink-0"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>

                      {/* Show tag suggestions when key is empty */}
                      {!row.key && (
                        <div className="flex flex-wrap gap-1.5">
                          {SUGGESTED_TAGS.map((tag) => (
                            <button
                              key={tag.key}
                              type="button"
                              onClick={() => updateFilterRow(index, { key: tag.key })}
                              className="px-2 py-0.5 bg-white border border-gray-200 rounded-lg text-[11px] text-gray-500 hover:border-[#F17922] hover:text-[#F17922] cursor-pointer transition-all"
                              title={`${tag.label} (ex: ${tag.example})`}
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

              <button
                type="button"
                onClick={addFilterRow}
                className="flex items-center gap-1.5 text-sm text-[#F17922] font-medium hover:underline cursor-pointer"
              >
                <Plus size={16} />
                Ajouter un filtre
              </button>
            </div>
          )}

          {/* External ID targeting */}
          {targetType === "aliases" && (
            <div>
              <textarea
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none font-mono"
                placeholder="ID1, ID2, ID3 (séparés par des virgules)"
                value={externalIds}
                onChange={(e) => setExternalIds(e.target.value)}
              />
              <p className="text-xs text-gray-400 mt-1">
                Entrez les identifiants clients séparés par des virgules
              </p>
            </div>
          )}
        </div>

        {/* Scheduling */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <label className="text-sm font-medium text-gray-700">
              Planifier l&apos;envoi
            </label>
            <button
              type="button"
              onClick={() => setScheduleEnabled(!scheduleEnabled)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                scheduleEnabled ? "bg-[#F17922]" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                  scheduleEnabled ? "translate-x-4.5" : "translate-x-1"
                }`}
              />
            </button>
          </div>
          {scheduleEnabled && (
            <input
              type="datetime-local"
              required={scheduleEnabled}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
            />
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
            disabled={isPending}
            className="px-6 py-2.5 bg-[#F17922] text-white rounded-xl text-sm font-semibold hover:bg-[#e06816] transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            {isPending && <Loader2 size={16} className="animate-spin" />}
            {scheduleEnabled ? "Planifier" : "Envoyer maintenant"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

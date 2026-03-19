"use client";

import React, { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import {
  useCreateScheduledMutation,
  useUpdateScheduledMutation,
  useSegmentsQuery,
} from "@/hooks/useOnesignalQuery";
import type {
  ScheduleType,
  ScheduledNotification,
  CreateScheduledNotificationPayload,
  OnesignalFilter,
} from "@/types/onesignal";
import {
  Bell,
  Mail,
  MessageSquare,
  Loader2,
  Plus,
  Trash2,
  Info,
  Clock,
  Repeat,
  CalendarClock,
  CalendarDays,
  Calendar,
} from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  editItem?: ScheduledNotification | null;
}

type TargetChannel = "push" | "email" | "sms";
type TargetType = "segments" | "filters" | "aliases";

const CHANNELS: { id: TargetChannel; label: string; icon: React.ReactNode }[] =
  [
    { id: "push", label: "Push", icon: <Bell size={18} /> },
    { id: "email", label: "Email", icon: <Mail size={18} /> },
    { id: "sms", label: "SMS", icon: <MessageSquare size={18} /> },
  ];

const SCHEDULE_TYPES: {
  id: ScheduleType;
  label: string;
  icon: React.ReactNode;
  description: string;
}[] = [
  {
    id: "once",
    label: "Une fois",
    icon: <Clock size={16} />,
    description: "Envoi unique a une date/heure precise",
  },
  {
    id: "daily",
    label: "Quotidien",
    icon: <Repeat size={16} />,
    description: "Tous les jours a la meme heure",
  },
  {
    id: "weekly",
    label: "Hebdomadaire",
    icon: <CalendarDays size={16} />,
    description: "Chaque semaine le(s) jour(s) choisi(s)",
  },
  {
    id: "monthly",
    label: "Mensuel",
    icon: <Calendar size={16} />,
    description: "Chaque mois a une date fixe",
  },
  {
    id: "custom",
    label: "Personnalise",
    icon: <CalendarClock size={16} />,
    description: "Expression CRON personnalisee",
  },
];

const DAYS_OF_WEEK = [
  { value: 1, label: "Lun" },
  { value: 2, label: "Mar" },
  { value: 3, label: "Mer" },
  { value: 4, label: "Jeu" },
  { value: 5, label: "Ven" },
  { value: 6, label: "Sam" },
  { value: 0, label: "Dim" },
];

const SUGGESTED_TAGS = [
  { key: "orders", label: "Commandes", example: "> 5" },
  { key: "total_spent", label: "Total depense", example: "> 50000" },
  { key: "last_order_days", label: "Jours sans commande", example: "> 30" },
  { key: "loyalty_level", label: "Niveau fidelite", example: "= GOLD" },
  { key: "city", label: "Ville", example: "= Abidjan" },
];

const TAG_RELATIONS = [
  { value: ">", label: "superieur a (>)" },
  { value: "<", label: "inferieur a (<)" },
  { value: "=", label: "egal a (=)" },
  { value: "!=", label: "different de (!=)" },
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

/**
 * Build a CRON expression from user-friendly inputs
 */
function buildCron(
  scheduleType: ScheduleType,
  hour: string,
  minute: string,
  selectedDays: number[],
  monthDay: string,
  customCron: string
): string | undefined {
  const h = hour || "9";
  const m = minute || "0";

  switch (scheduleType) {
    case "once":
      return undefined;
    case "daily":
      return `${m} ${h} * * *`;
    case "weekly": {
      const days = selectedDays.length > 0 ? selectedDays.join(",") : "1";
      return `${m} ${h} * * ${days}`;
    }
    case "monthly": {
      const day = monthDay || "1";
      return `${m} ${h} ${day} * *`;
    }
    case "custom":
      return customCron || undefined;
    default:
      return undefined;
  }
}

export default function CreateScheduledModal({
  isOpen,
  onClose,
  editItem,
}: Props) {
  const createMutation = useCreateScheduledMutation();
  const updateMutation = useUpdateScheduledMutation();
  const { data: segmentsData } = useSegmentsQuery();
  const segments = segmentsData?.segments ?? [];

  const isEdit = !!editItem;
  const isPending = createMutation.isPending || updateMutation.isPending;

  // ── Form state ──
  const [name, setName] = useState("");
  const [channel, setChannel] = useState<TargetChannel>("push");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [url, setUrl] = useState("");
  const [bigPicture, setBigPicture] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  // Targeting
  const [targetType, setTargetType] = useState<TargetType>("segments");
  const [selectedSegments, setSelectedSegments] = useState<string[]>([
    "Subscribed Users",
  ]);
  const [externalIds, setExternalIds] = useState("");
  const [filterRows, setFilterRows] = useState<FilterRow[]>([emptyFilterRow()]);

  // Schedule
  const [scheduleType, setScheduleType] = useState<ScheduleType>("weekly");
  const [scheduledDate, setScheduledDate] = useState("");
  const [hour, setHour] = useState("9");
  const [minute, setMinute] = useState("0");
  const [selectedDays, setSelectedDays] = useState<number[]>([1]); // Monday
  const [monthDay, setMonthDay] = useState("1");
  const [customCron, setCustomCron] = useState("");

  // ── Populate form from editItem ──
  useEffect(() => {
    if (editItem) {
      setName(editItem.name);
      setChannel(editItem.channel as TargetChannel);
      setScheduleType(editItem.schedule_type);

      const payload = editItem.payload as Record<string, unknown>;
      const headings = payload.headings as Record<string, string> | undefined;
      const contents = payload.contents as Record<string, string> | undefined;
      setTitle(headings?.fr ?? headings?.en ?? "");
      setMessage(contents?.fr ?? contents?.en ?? "");
      setUrl((payload.url as string) ?? "");
      setBigPicture((payload.big_picture as string) ?? "");
      setEmailSubject((payload.email_subject as string) ?? "");
      setEmailBody((payload.email_body as string) ?? "");

      const targeting = editItem.targeting;
      setTargetType(targeting.type ?? "segments");
      if (targeting.segments) setSelectedSegments(targeting.segments);
      if (targeting.aliases?.external_id) {
        setExternalIds(targeting.aliases.external_id.join(", "));
      }

      if (editItem.scheduled_at) {
        const d = new Date(editItem.scheduled_at);
        setScheduledDate(d.toISOString().slice(0, 16));
      }

      if (editItem.cron_expression) {
        const parts = editItem.cron_expression.split(" ");
        if (parts.length === 5) {
          setMinute(parts[0]);
          setHour(parts[1]);
          if (editItem.schedule_type === "weekly" && parts[4] !== "*") {
            setSelectedDays(parts[4].split(",").map(Number));
          }
          if (editItem.schedule_type === "monthly" && parts[2] !== "*") {
            setMonthDay(parts[2]);
          }
        }
        if (editItem.schedule_type === "custom") {
          setCustomCron(editItem.cron_expression);
        }
      }
    } else {
      resetForm();
    }
  }, [editItem, isOpen]);

  const resetForm = () => {
    setName("");
    setChannel("push");
    setTitle("");
    setMessage("");
    setUrl("");
    setBigPicture("");
    setEmailSubject("");
    setEmailBody("");
    setTargetType("segments");
    setSelectedSegments(["Subscribed Users"]);
    setExternalIds("");
    setFilterRows([emptyFilterRow()]);
    setScheduleType("weekly");
    setScheduledDate("");
    setHour("9");
    setMinute("0");
    setSelectedDays([1]);
    setMonthDay("1");
    setCustomCron("");
  };

  const toggleSegment = (segName: string) => {
    setSelectedSegments((prev) =>
      prev.includes(segName)
        ? prev.filter((s) => s !== segName)
        : [...prev, segName]
    );
  };

  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const updateFilterRow = (index: number, patch: Partial<FilterRow>) => {
    setFilterRows((prev) =>
      prev.map((f, i) => (i === index ? { ...f, ...patch } : f))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Build payload
    const payload: Record<string, unknown> = {};
    if (channel === "push") {
      payload.headings = { en: title, fr: title };
      payload.contents = { en: message, fr: message };
      if (url) payload.url = url;
      if (bigPicture) payload.big_picture = bigPicture;
    } else if (channel === "email") {
      payload.email_subject = emailSubject;
      payload.email_body = emailBody;
    } else if (channel === "sms") {
      payload.contents = { en: message, fr: message };
    }

    // Build targeting
    const targeting: Record<string, unknown> = { type: targetType };
    if (targetType === "segments") {
      targeting.segments = selectedSegments;
    } else if (targetType === "filters") {
      const filters: OnesignalFilter[] = [];
      filterRows.forEach((row, i) => {
        if (i > 0) {
          filters.push({
            field: row.operator === "OR" ? "OR" : "AND",
          } as unknown as OnesignalFilter);
        }
        const filter: OnesignalFilter = {
          field: "tag",
          key: row.key,
          relation: row.relation,
        };
        if (!["exists", "not_exists"].includes(row.relation)) {
          filter.value = row.value;
        }
        filters.push(filter);
      });
      targeting.filters = filters;
    } else {
      const ids = externalIds
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);
      targeting.aliases = { external_id: ids };
    }

    // Build schedule
    const cronExpression = buildCron(
      scheduleType,
      hour,
      minute,
      selectedDays,
      monthDay,
      customCron
    );

    const body: CreateScheduledNotificationPayload = {
      name: name || title || "Notification planifiee",
      channel,
      payload,
      targeting,
      schedule_type: scheduleType,
      ...(cronExpression ? { cron_expression: cronExpression } : {}),
      ...(scheduleType === "once" && scheduledDate
        ? { scheduled_at: new Date(scheduledDate).toISOString() }
        : {}),
      timezone: "Africa/Abidjan",
    };

    if (isEdit && editItem) {
      updateMutation.mutate(
        { id: editItem.id, payload: body },
        {
          onSuccess: () => {
            resetForm();
            onClose();
          },
        }
      );
    } else {
      createMutation.mutate(body, {
        onSuccess: () => {
          resetForm();
          onClose();
        },
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isEdit
          ? "Modifier la notification planifiee"
          : "Nouvelle notification planifiee"
      }
      size="large"
    >
      <form onSubmit={handleSubmit} className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">
        {/* Nom */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Nom de la campagne
          </label>
          <input
            type="text"
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="Ex: Promo du lundi"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* Channel */}
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

        {/* Content — Push */}
        {channel === "push" && (
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

        {/* ── Targeting ── */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ciblage
          </label>
          <div className="flex gap-2 mb-3">
            {(
              [
                { id: "segments", label: "Par segment" },
                { id: "filters", label: "Par tags" },
                { id: "aliases", label: "Par ID utilisateur" },
              ] as { id: TargetType; label: string }[]
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTargetType(t.id)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  targetType === t.id
                    ? "bg-[#FFF3E8] text-[#F17922] border border-[#F17922]"
                    : "border border-gray-200 text-gray-600"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

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
                Tous les abonnes
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

          {targetType === "filters" && (
            <div className="space-y-3">
              <div className="flex items-start gap-3 bg-blue-50 rounded-xl p-3">
                <Info
                  size={16}
                  className="text-blue-500 mt-0.5 flex-shrink-0"
                />
                <p className="text-xs text-blue-700">
                  Ciblez les utilisateurs par leurs tags (nombre de commandes,
                  ville, fidelite, etc.).
                </p>
              </div>
              {filterRows.map((row, index) => {
                const needsValue = !["exists", "not_exists"].includes(
                  row.relation
                );
                return (
                  <div key={index}>
                    {index > 0 && (
                      <div className="flex items-center gap-2 mb-2">
                        <select
                          value={row.operator}
                          onChange={(e) =>
                            updateFilterRow(index, {
                              operator: e.target.value as "AND" | "OR",
                            })
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
                          placeholder="Cle du tag"
                          required
                          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 w-40"
                          value={row.key}
                          onChange={(e) =>
                            updateFilterRow(index, { key: e.target.value })
                          }
                        />
                        <select
                          value={row.relation}
                          onChange={(e) =>
                            updateFilterRow(index, { relation: e.target.value })
                          }
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
                            onChange={(e) =>
                              updateFilterRow(index, { value: e.target.value })
                            }
                          />
                        )}
                        {filterRows.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setFilterRows((prev) =>
                                prev.filter((_, i) => i !== index)
                              )
                            }
                            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 cursor-pointer flex-shrink-0"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                      {!row.key && (
                        <div className="flex flex-wrap gap-1.5">
                          {SUGGESTED_TAGS.map((tag) => (
                            <button
                              key={tag.key}
                              type="button"
                              onClick={() =>
                                updateFilterRow(index, { key: tag.key })
                              }
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
                onClick={() =>
                  setFilterRows((prev) => [...prev, emptyFilterRow()])
                }
                className="flex items-center gap-1.5 text-sm text-[#F17922] font-medium hover:underline cursor-pointer"
              >
                <Plus size={16} />
                Ajouter un filtre
              </button>
            </div>
          )}

          {targetType === "aliases" && (
            <div>
              <textarea
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none font-mono"
                placeholder="ID1, ID2, ID3 (separes par des virgules)"
                value={externalIds}
                onChange={(e) => setExternalIds(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* ── Schedule ── */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Planification
          </label>

          {/* Schedule type selector */}
          <div className="grid grid-cols-5 gap-2 mb-4">
            {SCHEDULE_TYPES.map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setScheduleType(st.id)}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                  scheduleType === st.id
                    ? "border-[#F17922] bg-[#FFF3E8] text-[#F17922]"
                    : "border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                {st.icon}
                {st.label}
              </button>
            ))}
          </div>

          {/* Once: date picker */}
          {scheduleType === "once" && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Date et heure d&apos;envoi
              </label>
              <input
                type="datetime-local"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
              />
            </div>
          )}

          {/* Daily: time picker */}
          {scheduleType === "daily" && (
            <div className="flex items-center gap-3">
              <label className="text-xs text-gray-500">Tous les jours a</label>
              <input
                type="number"
                min={0}
                max={23}
                className="w-16 border border-gray-300 rounded-lg px-2 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-orange-500"
                value={hour}
                onChange={(e) => setHour(e.target.value)}
              />
              <span className="text-gray-400">:</span>
              <input
                type="number"
                min={0}
                max={59}
                className="w-16 border border-gray-300 rounded-lg px-2 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-orange-500"
                value={minute}
                onChange={(e) => setMinute(e.target.value)}
              />
              <span className="text-xs text-gray-400">(heure Abidjan)</span>
            </div>
          )}

          {/* Weekly: day selector + time */}
          {scheduleType === "weekly" && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-2">
                  Jours d&apos;envoi
                </label>
                <div className="flex gap-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleDay(day.value)}
                      className={`w-10 h-10 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                        selectedDays.includes(day.value)
                          ? "bg-[#F17922] text-white"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-xs text-gray-500">a</label>
                <input
                  type="number"
                  min={0}
                  max={23}
                  className="w-16 border border-gray-300 rounded-lg px-2 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={hour}
                  onChange={(e) => setHour(e.target.value)}
                />
                <span className="text-gray-400">:</span>
                <input
                  type="number"
                  min={0}
                  max={59}
                  className="w-16 border border-gray-300 rounded-lg px-2 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={minute}
                  onChange={(e) => setMinute(e.target.value)}
                />
                <span className="text-xs text-gray-400">(heure Abidjan)</span>
              </div>
            </div>
          )}

          {/* Monthly: day of month + time */}
          {scheduleType === "monthly" && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <label className="text-xs text-gray-500">
                  Le jour
                </label>
                <input
                  type="number"
                  min={1}
                  max={28}
                  className="w-16 border border-gray-300 rounded-lg px-2 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={monthDay}
                  onChange={(e) => setMonthDay(e.target.value)}
                />
                <label className="text-xs text-gray-500">de chaque mois</label>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-xs text-gray-500">a</label>
                <input
                  type="number"
                  min={0}
                  max={23}
                  className="w-16 border border-gray-300 rounded-lg px-2 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={hour}
                  onChange={(e) => setHour(e.target.value)}
                />
                <span className="text-gray-400">:</span>
                <input
                  type="number"
                  min={0}
                  max={59}
                  className="w-16 border border-gray-300 rounded-lg px-2 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={minute}
                  onChange={(e) => setMinute(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Custom CRON */}
          {scheduleType === "custom" && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Expression CRON
              </label>
              <input
                type="text"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="0 9 * * 1  (= tous les lundis a 9h)"
                value={customCron}
                onChange={(e) => setCustomCron(e.target.value)}
              />
              <div className="mt-2 text-[11px] text-gray-400 space-y-0.5">
                <p>Format : minute heure jour-du-mois mois jour-de-la-semaine</p>
                <p>Exemples : <code className="bg-gray-100 px-1 rounded">0 10 * * 1-5</code> = Lun-Ven a 10h | <code className="bg-gray-100 px-1 rounded">30 14 1,15 * *</code> = Le 1er et 15 a 14h30</p>
              </div>
            </div>
          )}

          {/* Preview */}
          {scheduleType !== "once" && (
            <div className="mt-3 bg-[#FFF3E8] rounded-xl px-3 py-2 text-xs text-[#F17922] flex items-center gap-2">
              <Repeat size={14} />
              CRON :{" "}
              <code className="font-mono bg-white/60 px-1.5 py-0.5 rounded">
                {buildCron(
                  scheduleType,
                  hour,
                  minute,
                  selectedDays,
                  monthDay,
                  customCron
                ) ?? "—"}
              </code>
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
            disabled={isPending}
            className="px-6 py-2.5 bg-[#F17922] text-white rounded-xl text-sm font-semibold hover:bg-[#e06816] transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            {isPending && <Loader2 size={16} className="animate-spin" />}
            {isEdit ? "Enregistrer" : "Creer la planification"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

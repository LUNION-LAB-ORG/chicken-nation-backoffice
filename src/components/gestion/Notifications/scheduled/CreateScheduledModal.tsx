"use client";

import React, { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import {
  useCreateScheduledMutation,
  useCreateScheduledMultiMutation,
  useUpdateScheduledMutation,
  useSegmentsQuery,
} from "@/hooks/usePushCampaignQuery";
import type {
  ScheduledNotification,
  CreateScheduledPayload,
} from "@/types/push-campaign";

type ScheduleTypeExtended = "once" | "daily" | "weekly" | "monthly" | "custom" | "multi_dates";
import {
  Loader2,
  Clock,
  Repeat,
  CalendarClock,
  CalendarDays,
  Calendar,
  CalendarPlus,
  MousePointerClick,
} from "lucide-react";
import VariablePicker from "../VariablePicker";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  editItem?: ScheduledNotification | null;
}

const SCHEDULE_TYPES: {
  id: ScheduleTypeExtended;
  label: string;
  icon: React.ReactNode;
  description: string;
}[] = [
  {
    id: "once",
    label: "Une fois",
    icon: <Clock size={16} />,
    description: "Envoi unique à une date/heure précise",
  },
  {
    id: "multi_dates",
    label: "Multi-dates",
    icon: <CalendarPlus size={16} />,
    description: "Plusieurs dates/heures spécifiques",
  },
  {
    id: "daily",
    label: "Quotidien",
    icon: <Repeat size={16} />,
    description: "Tous les jours à la même heure",
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
    description: "Chaque mois à une date fixe",
  },
  {
    id: "custom",
    label: "CRON",
    icon: <CalendarClock size={16} />,
    description: "Expression CRON personnalisée",
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
  const createMultiMutation = useCreateScheduledMultiMutation();
  const updateMutation = useUpdateScheduledMutation();
  const { data: segments } = useSegmentsQuery();

  const isEdit = !!editItem;
  const isPending = createMutation.isPending || updateMutation.isPending || createMultiMutation.isPending;

  // ── Form state ──
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  // Action au clic
  const [clickAction, setClickAction] = useState<string>("none");
  const [clickValue, setClickValue] = useState("");

  // Targeting
  const [targetType, setTargetType] = useState<"all" | "segment">("all");
  const [selectedSegment, setSelectedSegment] = useState("");

  // Schedule
  const [scheduleType, setScheduleType] = useState<ScheduleTypeExtended>("weekly");
  const [scheduledDate, setScheduledDate] = useState("");
  const [hour, setHour] = useState("9");
  const [minute, setMinute] = useState("0");
  const [selectedDays, setSelectedDays] = useState<number[]>([1]);
  const [monthDay, setMonthDay] = useState("1");
  const [customCron, setCustomCron] = useState("");
  const [multiDates, setMultiDates] = useState<string[]>([]);
  const [newMultiDate, setNewMultiDate] = useState("");

  // ── Populate form from editItem ──
  useEffect(() => {
    if (editItem) {
      setName(editItem.name);
      setScheduleType(editItem.schedule_type);

      setTitle(editItem.payload?.title ?? "");
      setMessage(editItem.payload?.body ?? "");
      setImageUrl(editItem.payload?.image_url ?? "");

      // Restore click action from data
      const data = editItem.payload?.data;
      if (data?.menu_id) {
        setClickAction("menu");
        setClickValue(data.menu_id as string);
      } else if (data?.category_id) {
        setClickAction("category");
        setClickValue(data.category_id as string);
      } else if (data?.order_id) {
        setClickAction("order");
        setClickValue(data.order_id as string);
      } else if (data?.url) {
        setClickAction("url");
        setClickValue(data.url as string);
      } else if (data?.type === "PROMOTION" || data?.type === "promo") {
        setClickAction("promotions");
        setClickValue("");
      } else if (data?.type === "VOUCHER" || data?.type === "voucher") {
        setClickAction("vouchers");
        setClickValue("");
      } else if (data?.type === "LOYALTY" || data?.type === "loyalty") {
        setClickAction("loyalty");
        setClickValue("");
      } else {
        setClickAction("none");
        setClickValue("");
      }

      setTargetType(editItem.targeting?.type === "segment" ? "segment" : "all");
      setSelectedSegment(
        (editItem.targeting?.config as { segment?: string })?.segment ?? ""
      );

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

  const buildClickData = (): Record<string, unknown> | undefined => {
    switch (clickAction) {
      case "menu":
        return clickValue ? { menu_id: clickValue } : undefined;
      case "category":
        return clickValue ? { category_id: clickValue } : undefined;
      case "order":
        return clickValue ? { order_id: clickValue } : undefined;
      case "url":
        return clickValue ? { url: clickValue } : undefined;
      case "promotions":
        return { type: "PROMOTION" };
      case "vouchers":
        return { type: "VOUCHER" };
      case "loyalty":
        return { type: "LOYALTY" };
      default:
        return undefined;
    }
  };

  const resetForm = () => {
    setName("");
    setTitle("");
    setMessage("");
    setImageUrl("");
    setClickAction("none");
    setClickValue("");
    setTargetType("all");
    setSelectedSegment("");
    setScheduleType("weekly");
    setScheduledDate("");
    setHour("9");
    setMinute("0");
    setSelectedDays([1]);
    setMonthDay("1");
    setCustomCron("");
    setMultiDates([]);
    setNewMultiDate("");
  };

  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const addMultiDate = () => {
    if (newMultiDate && !multiDates.includes(newMultiDate)) {
      setMultiDates((prev) => [...prev, newMultiDate].sort());
      setNewMultiDate("");
    }
  };

  const removeMultiDate = (dateToRemove: string) => {
    setMultiDates((prev) => prev.filter((d) => d !== dateToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const targetConfig: Record<string, unknown> =
      targetType === "segment" && selectedSegment
        ? { segment: selectedSegment }
        : {};

    const clickData = buildClickData();

    // Multi-dates: create N scheduled notifications
    if (scheduleType === "multi_dates") {
      if (multiDates.length === 0) return;

      const basePayload: CreateScheduledPayload & { schedule_dates: string[] } = {
        name: name || title || "Notification planifiée",
        title,
        body: message,
        ...(imageUrl ? { image_url: imageUrl } : {}),
        ...(clickData ? { data: clickData } : {}),
        target_type: targetType,
        target_config: targetConfig,
        schedule_type: "once",
        timezone: "Africa/Abidjan",
        schedule_dates: multiDates.map((d) => new Date(d).toISOString()),
      };

      createMultiMutation.mutate(basePayload, {
        onSuccess: () => {
          resetForm();
          onClose();
        },
      });
      return;
    }

    const cronExpression = buildCron(
      scheduleType as any,
      hour,
      minute,
      selectedDays,
      monthDay,
      customCron
    );

    const body: CreateScheduledPayload = {
      name: name || title || "Notification planifiée",
      title,
      body: message,
      ...(imageUrl ? { image_url: imageUrl } : {}),
      ...(clickData ? { data: clickData } : {}),
      target_type: targetType,
      target_config: targetConfig,
      schedule_type: scheduleType === "multi_dates" ? "once" : scheduleType,
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
          ? "Modifier la notification planifiée"
          : "Nouvelle notification planifiée"
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

        {/* Content — Push only */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-gray-700">Titre</label>
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
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-gray-700">Message</label>
              <VariablePicker onInsert={(v) => setMessage((prev) => prev + v)} />
            </div>
            <textarea
              required
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              placeholder="Ex: {{first_name}}, ne ratez pas nos offres !"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Image URL (optionnel)
            </label>
            <input
              type="url"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="https://...image.png"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
          </div>
        </div>

        {/* ── Action au clic ── */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <MousePointerClick size={16} className="text-gray-500" />
            <label className="text-sm font-medium text-gray-700">
              Action au clic (optionnel)
            </label>
          </div>
          <p className="text-xs text-gray-400 mb-3">
            Que se passe-t-il quand le client clique sur la notification ?
          </p>

          <div className="flex flex-wrap gap-2 mb-3">
            {[
              { id: "none", label: "Accueil" },
              { id: "menu", label: "Fiche produit" },
              { id: "category", label: "Catégorie" },
              { id: "promotions", label: "Promotions" },
              { id: "vouchers", label: "Bons de réduction" },
              { id: "loyalty", label: "Fidélité / Profil" },
              { id: "url", label: "Lien externe" },
            ].map((action) => (
              <button
                key={action.id}
                type="button"
                onClick={() => {
                  setClickAction(action.id);
                  setClickValue("");
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  clickAction === action.id
                    ? "bg-[#F17922] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {action.label}
              </button>
            ))}
          </div>

          {clickAction === "menu" && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                ID du produit (menu)
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
                placeholder="Ex: clxxxxxxxxxxxxxxxxxx"
                value={clickValue}
                onChange={(e) => setClickValue(e.target.value)}
              />
            </div>
          )}

          {clickAction === "category" && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                ID de la catégorie
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
                placeholder="Ex: clxxxxxxxxxxxxxxxxxx"
                value={clickValue}
                onChange={(e) => setClickValue(e.target.value)}
              />
            </div>
          )}

          {clickAction === "url" && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                URL à ouvrir
              </label>
              <input
                type="url"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="https://chicken-nation.com/..."
                value={clickValue}
                onChange={(e) => setClickValue(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* ── Targeting ── */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ciblage
          </label>
          <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={() => setTargetType("all")}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                targetType === "all"
                  ? "bg-[#FFF3E8] text-[#F17922] border border-[#F17922]"
                  : "border border-gray-200 text-gray-600"
              }`}
            >
              Tous les abonnés
            </button>
            <button
              type="button"
              onClick={() => setTargetType("segment")}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                targetType === "segment"
                  ? "bg-[#FFF3E8] text-[#F17922] border border-[#F17922]"
                  : "border border-gray-200 text-gray-600"
              }`}
            >
              Par segment
            </button>
          </div>

          {targetType === "segment" && segments && (
            <div className="flex flex-wrap gap-2">
              {segments.map((seg) => (
                <button
                  key={seg.key}
                  type="button"
                  onClick={() => setSelectedSegment(seg.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    selectedSegment === seg.key
                      ? "bg-[#F17922] text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {seg.label}
                  <span className="ml-1 opacity-70">
                    ({seg.count.toLocaleString("fr-FR")})
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Schedule ── */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Planification
          </label>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">
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

          {/* Multi-dates picker */}
          {scheduleType === "multi_dates" && (
            <div className="space-y-3">
              <label className="block text-xs text-gray-500">
                Ajoutez les dates et heures d&apos;envoi
              </label>
              <div className="flex gap-2">
                <input
                  type="datetime-local"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={newMultiDate}
                  onChange={(e) => setNewMultiDate(e.target.value)}
                />
                <button
                  type="button"
                  onClick={addMultiDate}
                  disabled={!newMultiDate}
                  className="px-4 py-2.5 bg-[#F17922] text-white rounded-lg text-sm font-medium hover:bg-[#e06816] disabled:opacity-50 cursor-pointer"
                >
                  Ajouter
                </button>
              </div>
              {multiDates.length > 0 && (
                <div className="space-y-1.5">
                  {multiDates.map((d) => (
                    <div
                      key={d}
                      className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2"
                    >
                      <span className="text-sm text-gray-700">
                        {new Intl.DateTimeFormat("fr-FR", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(d))}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeMultiDate(d)}
                        className="text-xs text-red-500 hover:text-red-700 cursor-pointer"
                      >
                        Supprimer
                      </button>
                    </div>
                  ))}
                  <p className="text-xs text-gray-400">
                    {multiDates.length} date{multiDates.length > 1 ? "s" : ""} programmée{multiDates.length > 1 ? "s" : ""}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Daily: time picker */}
          {scheduleType === "daily" && (
            <div className="flex items-center gap-3">
              <label className="text-xs text-gray-500">Tous les jours à</label>
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
                <label className="text-xs text-gray-500">à</label>
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
                <label className="text-xs text-gray-500">Le jour</label>
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
                <label className="text-xs text-gray-500">à</label>
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
                placeholder="0 9 * * 1  (= tous les lundis à 9h)"
                value={customCron}
                onChange={(e) => setCustomCron(e.target.value)}
              />
              <div className="mt-2 text-[11px] text-gray-400 space-y-0.5">
                <p>Format : minute heure jour-du-mois mois jour-de-la-semaine</p>
                <p>Exemples : <code className="bg-gray-100 px-1 rounded">0 10 * * 1-5</code> = Lun-Ven à 10h | <code className="bg-gray-100 px-1 rounded">30 14 1,15 * *</code> = Le 1er et 15 à 14h30</p>
              </div>
            </div>
          )}

          {/* CRON Preview */}
          {scheduleType !== "once" && scheduleType !== "multi_dates" && (
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
            {isEdit ? "Enregistrer" : "Créer la planification"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

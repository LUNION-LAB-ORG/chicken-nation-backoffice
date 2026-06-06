"use client";

import React, { useState } from "react";
import { AlertTriangle, ChefHat, PackageCheck, Truck } from "lucide-react";

import type { Order } from "../../orders/types/order.types";
import type { IOperationsBuckets } from "../types/operations.types";
import { OperationsCard } from "./OperationsCard";
import { OrdersGroupCard } from "./OrdersGroupCard";

interface Props {
  buckets: IOperationsBuckets;
  onCardClick: (order: Order) => void;
  /** Clic sur « Faire le paiement » en bas d'une card — ouvre le drawer sur le tab Paiement */
  onPayClick: (order: Order) => void;
}

type SectionKey = "aPreparer" | "pretes" | "collectees" | "problemes";
type Tone = "amber" | "green" | "purple" | "red";

const TONE_ACTIVE: Record<Tone, string> = {
  amber: "bg-amber-500 border-amber-500 text-white",
  green: "bg-green-600 border-green-600 text-white",
  purple: "bg-purple-600 border-purple-600 text-white",
  red: "bg-red-600 border-red-600 text-white",
};
const TONE_PANEL: Record<Tone, string> = {
  amber: "bg-amber-50 border-amber-200",
  green: "bg-green-50 border-green-200",
  purple: "bg-purple-50 border-purple-200",
  red: "bg-red-50 border-red-200",
};

/**
 * Sections des commandes en cours.
 *
 *  • **Desktop (md+)** : 4 colonnes simultanées (À préparer / Prêtes / Collectées / Problèmes).
 *  • **Mobile (< md)** : onglets d'état (compteurs intégrés) → une seule section visible
 *    à la fois. Évite d'empiler 4 sections de 200 px et de scroller à travers du vide ;
 *    les compteurs remplacent la barre KPI (masquée sur mobile).
 */
export const OperationsSections: React.FC<Props> = ({ buckets, onCardClick, onPayClick }) => {
  const { aPreparer, pretesGroupes, recuperees, problemes } = buckets;
  const pretesTotal = pretesGroupes.reduce((s, g) => s + g.orders.length, 0);
  const hasAny =
    aPreparer.length + pretesGroupes.length + recuperees.length + problemes.length > 0;

  const meta: {
    key: SectionKey;
    title: string;
    Icon: React.ComponentType<{ className?: string }>;
    tone: Tone;
    count: number;
  }[] = [
    { key: "aPreparer", title: "À préparer", Icon: ChefHat, tone: "amber", count: aPreparer.length },
    { key: "pretes", title: "Prêtes", Icon: PackageCheck, tone: "green", count: pretesTotal },
    { key: "collectees", title: "Collectées", Icon: Truck, tone: "purple", count: recuperees.length },
    { key: "problemes", title: "Problèmes", Icon: AlertTriangle, tone: "red", count: problemes.length },
  ];

  // Onglet actif (vue mobile) : par défaut la première section non vide.
  const [active, setActive] = useState<SectionKey>(
    () => meta.find((m) => m.count > 0)?.key ?? "aPreparer",
  );

  const renderItems = (key: SectionKey): React.ReactNode => {
    switch (key) {
      case "aPreparer":
        return aPreparer.length ? (
          aPreparer.map((o) => (
            <OperationsCard key={o.id} order={o} onClick={() => onCardClick(o)} onPayClick={() => onPayClick(o)} />
          ))
        ) : (
          <Empty />
        );
      case "pretes":
        return pretesGroupes.length ? (
          pretesGroupes.map((g) => (
            <OrdersGroupCard key={g.key} group={g} onCardClick={onCardClick} onPayClick={onPayClick} />
          ))
        ) : (
          <Empty />
        );
      case "collectees":
        return recuperees.length ? (
          recuperees.map((o) => (
            <OperationsCard key={o.id} order={o} onClick={() => onCardClick(o)} onPayClick={() => onPayClick(o)} />
          ))
        ) : (
          <Empty />
        );
      case "problemes":
        return problemes.length ? (
          problemes.map((o) => (
            <OperationsCard
              key={o.id}
              order={o}
              onClick={() => onCardClick(o)}
              onPayClick={() => onPayClick(o)}
              showWarningBadge={o.paied}
              warningLabel="En retard"
            />
          ))
        ) : (
          <Empty />
        );
      default:
        return null;
    }
  };

  if (!hasAny) {
    return (
      <div className="flex-1 flex items-center justify-center py-16 text-center">
        <div>
          <PackageCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Aucune commande en cours</p>
          <p className="text-xs text-gray-400 mt-1">
            Les commandes acceptées apparaissent ici en temps réel.
          </p>
        </div>
      </div>
    );
  }

  const activeTone = meta.find((m) => m.key === active)?.tone ?? "amber";

  return (
    <>
      {/* ── Mobile (< md) : onglets d'état → une seule section visible ───────── */}
      <div className="md:hidden">
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
          {meta.map((m) => {
            const isActive = active === m.key;
            const Icon = m.Icon;
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => setActive(m.key)}
                className={`snap-start shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                  isActive ? TONE_ACTIVE[m.tone] : "bg-white border-gray-200 text-gray-600 active:bg-gray-50"
                }`}
              >
                <Icon className="w-4 h-4" />
                {m.title}
                <span
                  className={`min-w-[20px] h-5 px-1 grid place-items-center rounded-full text-[11px] font-bold ${
                    isActive ? "bg-white/25 text-white" : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {m.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className={`mt-3 rounded-2xl border p-3 space-y-2 ${TONE_PANEL[activeTone]}`}>
          {renderItems(active)}
        </div>
      </div>

      {/* ── Desktop (md+) : 4 colonnes simultanées (inchangé) ───────────────── */}
      <div className="hidden md:grid grid-cols-2 xl:grid-cols-4 gap-4">
        <Section
          title="À préparer"
          icon={<ChefHat className="w-4 h-4 text-amber-600" />}
          count={aPreparer.length}
          tone="amber"
        >
          {aPreparer.map((o) => (
            <OperationsCard key={o.id} order={o} onClick={() => onCardClick(o)} onPayClick={() => onPayClick(o)} />
          ))}
        </Section>

        <Section
          title="Prêtes"
          icon={<PackageCheck className="w-4 h-4 text-green-600" />}
          count={pretesTotal}
          tone="green"
        >
          {pretesGroupes.map((g) => (
            <OrdersGroupCard key={g.key} group={g} onCardClick={onCardClick} onPayClick={onPayClick} />
          ))}
        </Section>

        <Section
          title="Collectées"
          icon={<Truck className="w-4 h-4 text-purple-600" />}
          count={recuperees.length}
          tone="purple"
        >
          {recuperees.map((o) => (
            <OperationsCard key={o.id} order={o} onClick={() => onCardClick(o)} onPayClick={() => onPayClick(o)} />
          ))}
        </Section>

        <Section
          title="⚠ Problèmes"
          icon={<AlertTriangle className="w-4 h-4 text-red-600" />}
          count={problemes.length}
          tone="red"
        >
          {problemes.map((o) => (
            <OperationsCard
              key={o.id}
              order={o}
              onClick={() => onCardClick(o)}
              onPayClick={() => onPayClick(o)}
              showWarningBadge={o.paied}
              warningLabel="En retard"
            />
          ))}
        </Section>
      </div>
    </>
  );
};

function Empty() {
  return <p className="text-xs text-gray-400 text-center py-8">Aucune commande</p>;
}

function Section({
  title,
  icon,
  count,
  tone,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  count: number;
  tone: Tone;
  children: React.ReactNode;
}) {
  const toneBg = {
    amber: "bg-amber-50",
    green: "bg-green-50",
    purple: "bg-purple-50",
    red: "bg-red-50",
  }[tone];
  const hasContent = React.Children.count(children) > 0;
  return (
    <div className={`rounded-2xl border border-gray-200 ${toneBg} p-3 min-h-[200px]`}>
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          {icon}
          <h4 className="text-sm font-bold text-gray-900">{title}</h4>
        </div>
        <span className="text-xs font-medium text-gray-500 bg-white rounded-full px-2 py-0.5 border border-gray-200">
          {count}
        </span>
      </div>
      <div className="space-y-2">
        {hasContent ? children : <Empty />}
      </div>
    </div>
  );
}

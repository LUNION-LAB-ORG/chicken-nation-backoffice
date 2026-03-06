'use client';

import React from 'react';
import { TOOLTIP_CONTAINER_STYLE } from '../../../../../features/statistics/utils/chart-config';

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: number;
    color?: string;
    dataKey?: string;
    payload?: Record<string, unknown>;
  }>;
  label?: string;
  /** Clé pour extraire le label depuis payload[0].payload au lieu du label Recharts.
   *  Utile pour layout="vertical" où le label Recharts peut être incorrect. */
  payloadLabelKey?: string;
  labelFormatter?: (label: string) => string;
  valueFormatter?: (value: number, name: string) => string;
}

/**
 * Tooltip personnalisé pour les graphiques Recharts.
 * Affiche le label + chaque série avec pastille colorée et valeur formatée.
 */
export default function ChartTooltip({
  active,
  payload,
  label,
  payloadLabelKey,
  labelFormatter,
  valueFormatter,
}: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  // Pour les BarChart layout="vertical", on extrait le label depuis le payload data
  let rawLabel = String(label);
  if (payloadLabelKey && payload[0]?.payload) {
    const extracted = payload[0].payload[payloadLabelKey];
    if (typeof extracted === 'string') rawLabel = extracted;
  }

  const displayLabel = labelFormatter ? labelFormatter(rawLabel) : rawLabel;

  return (
    <div style={TOOLTIP_CONTAINER_STYLE}>
      {displayLabel && (
        <p className="text-xs font-medium text-gray-900 mb-1.5">{displayLabel}</p>
      )}
      <div className="space-y-1">
        {payload.map((entry, index) => {
          const value = entry.value ?? 0;
          const name = entry.name ?? '';
          const formattedValue = valueFormatter
            ? valueFormatter(value, name)
            : value.toLocaleString('fr-FR');

          return (
            <div key={index} className="flex items-center gap-2 text-xs">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-500">{name} :</span>
              <span className="font-semibold text-gray-900">{formattedValue}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Tooltip simple pour les PieChart (affiche name + value + pourcentage).
 */
interface PieTooltipProps {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: number;
    payload?: {
      name?: string;
      value?: number;
      fill?: string;
      percentage?: number;
      [key: string]: unknown;
    };
  }>;
  valueFormatter?: (value: number) => string;
}

export function PieChartTooltip({
  active,
  payload,
  valueFormatter,
}: PieTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0];
  const name = data.payload?.name ?? data.name ?? '';
  const value = data.value ?? 0;
  const percentage = data.payload?.percentage;
  const color = data.payload?.fill ?? '#F17922';
  const formattedValue = valueFormatter
    ? valueFormatter(value)
    : value.toLocaleString('fr-FR');

  return (
    <div style={TOOLTIP_CONTAINER_STYLE}>
      <div className="flex items-center gap-2 text-xs">
        <span
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: color }}
        />
        <span className="font-medium text-gray-900">{name}</span>
      </div>
      <div className="mt-1 text-xs text-gray-600">
        <span className="font-semibold text-gray-900">{formattedValue}</span>
        {percentage !== undefined && (
          <span className="ml-1.5 text-gray-400">({percentage}%)</span>
        )}
      </div>
    </div>
  );
}

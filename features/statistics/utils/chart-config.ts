/**
 * Configuration partagée pour les graphiques Recharts.
 * Couleurs, styles d'axes, grille et tooltip alignés avec le design du dashboard.
 */

// === Palette de couleurs ===
export const CHART_COLORS = {
  // Couleur principale (orange Chicken Nation)
  primary: '#F17922',
  primaryLight: 'rgba(241, 121, 34, 0.15)',
  primaryFaded: 'rgba(241, 121, 34, 0.05)',

  // Couleurs secondaires
  secondary: '#FA6345',
  blue: '#3B82F6',
  purple: '#8B5CF6',
  teal: '#14B8A6',
  pink: '#EC4899',

  // Statuts
  success: '#22C55E',
  successLight: 'rgba(34, 197, 94, 0.15)',
  danger: '#EF4444',
  dangerLight: 'rgba(239, 68, 68, 0.15)',
  warning: '#F59E0B',
  warningLight: 'rgba(245, 158, 11, 0.15)',

  // Axes et grille
  axisText: '#9796A1',
  gridStroke: 'rgba(241, 121, 34, 0.1)',

  // Texte
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
} as const;

// === Couleurs par type de commande ===
export const ORDER_TYPE_COLORS = {
  DELIVERY: CHART_COLORS.primary,
  PICKUP: CHART_COLORS.blue,
  TABLE: CHART_COLORS.purple,
} as const;

export const ORDER_TYPE_LABELS: Record<string, string> = {
  DELIVERY: 'Livraison',
  PICKUP: 'Retrait',
  TABLE: 'Sur place',
};

// === Couleurs par canal ===
export const CHANNEL_COLORS = {
  app: CHART_COLORS.primary,
  callCenter: CHART_COLORS.blue,
} as const;

export const CHANNEL_LABELS: Record<string, string> = {
  app: 'Application',
  App: 'App',
  callCenter: 'Call Center',
  'Call Center': 'Call Center',
};

// === Couleurs par statut de ponctualité ===
export const PUNCTUALITY_COLORS = {
  onTime: CHART_COLORS.success,
  late: CHART_COLORS.danger,
} as const;

// === Styles d'axes Recharts ===
export const AXIS_STYLE = {
  fontSize: 12,
  fill: CHART_COLORS.axisText,
  fontFamily: 'inherit',
} as const;

// === Style de grille ===
export const GRID_STYLE = {
  strokeDasharray: '3 3',
  stroke: CHART_COLORS.gridStroke,
} as const;

// === Style de tooltip ===
export const TOOLTIP_CONTAINER_STYLE: React.CSSProperties = {
  backgroundColor: 'white',
  border: '1px solid #F3F4F6',
  borderRadius: '12px',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  padding: '12px 16px',
};

// === Gradient fill pour AreaChart ===
export const AREA_GRADIENT_ID = 'colorPrimary';
export const AREA_GRADIENT_CONFIG = {
  id: AREA_GRADIENT_ID,
  startColor: CHART_COLORS.primary,
  startOpacity: 0.3,
  endColor: CHART_COLORS.primary,
  endOpacity: 0.02,
} as const;

// === Palette pour les graphiques multi-séries ===
export const MULTI_SERIES_COLORS = [
  CHART_COLORS.primary,
  CHART_COLORS.blue,
  CHART_COLORS.purple,
  CHART_COLORS.teal,
  CHART_COLORS.pink,
  CHART_COLORS.secondary,
  CHART_COLORS.warning,
  CHART_COLORS.success,
] as const;

// === Palette de couleurs pour les restaurants (histogrammes empilés + cartes) ===
export const RESTAURANT_COLORS = [
  '#F17922', // Orange
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#22C55E', // Green
  '#EF4444', // Red
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#14B8A6', // Teal
  '#6366F1', // Indigo
  '#84CC16', // Lime
  '#D946EF', // Fuchsia
] as const;

// === Hauteurs par défaut des graphiques ===
export const CHART_HEIGHTS = {
  small: 200,
  medium: 280,
  large: 350,
} as const;

// Import React pour les types CSS
import React from 'react';

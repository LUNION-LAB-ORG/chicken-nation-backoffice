"use client";

import React from "react";
import type { DelivererStatus } from "../../../../features/livreurs/types/livreur.types";

interface StatutBadgeProps {
  status: DelivererStatus;
  isOperational?: boolean;
}

interface BadgeConfig {
  label: string;
  color: string;
  bg: string;
}

const getBadgeConfig = (status: DelivererStatus, isOperational?: boolean): BadgeConfig => {
  if (status === "REJECTED") return { label: "Refusé", color: "#EF4444", bg: "rgba(239, 68, 68, 0.15)" };
  if (status === "SUSPENDED") return { label: "Suspendu", color: "#EF4444", bg: "rgba(239, 68, 68, 0.15)" };
  if (status === "ACTIVE" && isOperational) return { label: "Actif", color: "#22C55E", bg: "rgba(34, 197, 94, 0.15)" };
  if (status === "ACTIVE") return { label: "À affecter", color: "#F59E0B", bg: "rgba(245, 158, 11, 0.15)" };
  return { label: "En attente", color: "#F59E0B", bg: "rgba(245, 158, 11, 0.15)" };
};

const StatutBadge: React.FC<StatutBadgeProps> = ({ status, isOperational }) => {
  const { label, color, bg } = getBadgeConfig(status, isOperational);
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ color, backgroundColor: bg }}
    >
      {label}
    </span>
  );
};

export default StatutBadge;

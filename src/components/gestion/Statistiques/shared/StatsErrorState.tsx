"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";

interface StatsErrorStateProps {
  onRetry?: () => void;
  message?: string;
}

export default function StatsErrorState({
  onRetry,
  message = "Une erreur est survenue lors du chargement des statistiques.",
}: StatsErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <AlertTriangle className="w-12 h-12 text-orange-400" />
      <p className="text-gray-500 text-sm text-center max-w-xs">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-[#F17922] text-white text-sm font-medium rounded-xl hover:bg-orange-600 transition-colors"
        >
          Réessayer
        </button>
      )}
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

import { exportProspectsCsv } from "../services/prospect.service";
import { ExportType } from "../types/prospect.types";

/**
 * Le bouton exporte EXACTEMENT ce que l'écran affiche.
 *
 * Il ne recevait que le restaurant : la plateforme, le statut, la recherche et
 * les dates choisis dans la liste étaient perdus, et le fichier sortait avec
 * tout le monde dedans.
 */
export function ExportButton({
  type,
  filtres,
}: {
  type: ExportType;
  filtres?: Record<string, string | undefined>;
}) {
  const [loading, setLoading] = useState(false);

  const onClick = async () => {
    setLoading(true);
    try {
      await exportProspectsCsv(type, filtres);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Download className="w-4 h-4" />
      )}
      Exporter
    </button>
  );
}

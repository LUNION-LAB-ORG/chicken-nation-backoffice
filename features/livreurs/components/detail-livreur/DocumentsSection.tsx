"use client";

import React from "react";
import { CheckCircle2, FileText, XCircle } from "lucide-react";

import ZoomableImage from "../common/ZoomableImage";
import { formatImageUrl } from "@/utils/imageHelpers";
import type { Livreur } from "../../types/livreur.types";

interface DocumentsSectionProps {
  livreur: Livreur;
}

const DocCard: React.FC<{ title: string; keyUrl?: string | null }> = ({ title, keyUrl }) => {
  const url = keyUrl ? formatImageUrl(keyUrl) : null;
  const present = !!url;

  return (
    <div className="rounded-xl border border-[#E4E4E7] bg-white overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#F4F4F5] bg-[#FAFAFA]">
        <span className="text-sm font-semibold text-[#18181B]">{title}</span>
        {present ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#22C55E]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Fourni
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#F59E0B]">
            <XCircle className="w-3.5 h-3.5" />
            Manquant
          </span>
        )}
      </div>
      <div className="p-3">
        <ZoomableImage
          src={url}
          alt={title}
          height={200}
          fallback={
            <div className="flex flex-col items-center gap-2 text-[#A1A1AA]">
              <FileText className="w-8 h-8" />
              <span className="text-xs italic">Document non fourni</span>
            </div>
          }
        />
      </div>
    </div>
  );
};

const DocumentsSection: React.FC<DocumentsSectionProps> = ({ livreur }) => (
  <div className="mb-6">
    <p className="text-[18px] font-medium text-[#F17922] mb-1">Documents</p>
    <p className="text-xs text-[#71717A] mb-4">Cliquez sur un document pour l'agrandir.</p>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
      <DocCard title="Pièce d'identité" keyUrl={livreur.piece_identite} />
      <DocCard title="Permis de conduire" keyUrl={livreur.permis_conduire} />
    </div>

    {/* Numéros associés au véhicule / permis */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <NumeroCard label="Numéro du permis" value={livreur.numero_permis} />
      <NumeroCard label="Immatriculation" value={livreur.numero_immatriculation} />
    </div>
  </div>
);

const NumeroCard: React.FC<{ label: string; value?: string | null }> = ({ label, value }) => (
  <div className="rounded-xl border border-[#E4E4E7] bg-white px-4 py-3">
    <p className="text-xs text-[#71717A]">{label}</p>
    <p className="text-sm font-mono font-semibold text-[#18181B] mt-1">
      {value || <span className="text-[#A1A1AA] italic font-normal">Non renseigné</span>}
    </p>
  </div>
);

export default DocumentsSection;

"use client";

import React from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import type { Livreur } from "../../types/livreur.types";

interface ContactSectionProps {
  livreur: Livreur;
}

const genreLabel: Record<string, string> = { HOMME: "Homme", FEMME: "Femme" };

const formatDate = (iso?: string | null): string => {
  if (!iso) return "—";
  try {
    return format(new Date(iso), "dd MMM yyyy", { locale: fr });
  } catch {
    return "—";
  }
};

const Row: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex flex-row items-start justify-between py-2 border-b border-[#F4F4F5] last:border-b-0">
    <p className="text-sm text-[#71717A]">{label}</p>
    <p className="text-sm text-[#18181B] font-semibold text-right max-w-[60%] break-words">
      {value}
    </p>
  </div>
);

const ContactSection: React.FC<ContactSectionProps> = ({ livreur }) => (
  <div className="mb-6">
    <p className="text-[18px] font-medium text-[#F17922] mb-2">Coordonnées</p>

    <Row label="Téléphone" value={livreur.phone} />
    <Row label="Email" value={livreur.email || "—"} />
    <Row label="Genre" value={livreur.genre ? genreLabel[livreur.genre] : "—"} />
    <Row label="Inscrit le" value={formatDate(livreur.created_at)} />
    <Row label="Dernière connexion" value={formatDate(livreur.last_login_at)} />
  </div>
);

export default ContactSection;

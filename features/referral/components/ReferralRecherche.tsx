"use client";

import React, { useState } from "react";
import { Search } from "lucide-react";

/** Champ de recherche d'une liste : la recherche part au clic sur « Chercher ». */
export default function ReferralRecherche({
  placeholder,
  onChercher,
}: {
  placeholder: string;
  onChercher: (texte: string) => void;
}) {
  const [saisie, setSaisie] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onChercher(saisie.trim());
      }}
      className="flex items-center gap-2"
    >
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9796A1]" />
        <input
          value={saisie}
          onChange={(e) => setSaisie(e.target.value)}
          placeholder={placeholder}
          className="h-10 w-56 rounded-lg border border-[#E4E4E7] pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F17922]/30"
        />
      </div>
      <button
        type="submit"
        className="h-10 px-4 rounded-lg bg-[#F17922] text-white text-sm font-medium hover:bg-[#e06816] cursor-pointer"
      >
        Chercher
      </button>
    </form>
  );
}

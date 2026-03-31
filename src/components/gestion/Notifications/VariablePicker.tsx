"use client";

import React, { useState } from "react";
import { Braces } from "lucide-react";

const VARIABLES = [
  { key: "first_name", label: "Prénom", example: "Amadou" },
  { key: "last_name", label: "Nom", example: "Koné" },
  { key: "phone", label: "Téléphone", example: "+22507..." },
  { key: "city", label: "Ville", example: "Abidjan" },
  { key: "loyalty_level", label: "Fidélité", example: "GOLD" },
  { key: "total_points", label: "Points", example: "1500" },
];

interface Props {
  onInsert: (variable: string) => void;
}

export default function VariablePicker({ onInsert }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-all cursor-pointer"
        title="Insérer une variable dynamique"
      >
        <Braces size={14} />
        Variables
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-lg p-2 min-w-[220px]">
            <p className="text-[10px] text-gray-400 px-2 pb-1.5 uppercase tracking-wider font-semibold">
              Cliquer pour insérer
            </p>
            {VARIABLES.map((v) => (
              <button
                key={v.key}
                type="button"
                onClick={() => {
                  onInsert(`{{${v.key}}}`);
                  setOpen(false);
                }}
                className="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-left hover:bg-[#FFF3E8] transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono bg-gray-100 group-hover:bg-[#F17922]/10 px-1.5 py-0.5 rounded text-gray-600 group-hover:text-[#F17922]">
                    {`{{${v.key}}}`}
                  </code>
                  <span className="text-xs text-gray-500">{v.label}</span>
                </div>
                <span className="text-[10px] text-gray-300 italic">
                  {v.example}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { paiementDataSelect } from "../constantes/paiement-data-select";

export function CustomPaymentSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = paiementDataSelect.find((opt) => opt.source === value);

  // Fermer le menu si on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={containerRef}>
      <label className="block text-xs font-medium text-gray-600 mb-1.5">
        Mode de paiement
      </label>

      {/* Bouton déclencheur */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all text-left shadow-sm"
      >
        {selectedOption?.image && (
          <div className="relative w-6 h-6 shrink-0">
            <Image
              src={selectedOption.image}
              alt={selectedOption.label}
              fill
              className="object-contain rounded"
            />
          </div>
        )}
        <span className="flex-1 truncate">
          {selectedOption ? selectedOption.label : "Choisir un mode"}
        </span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Liste des options */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden py-1 animate-in fade-in zoom-in duration-100">
          {paiementDataSelect.map((option) => (
            <button
              key={option.source}
              type="button"
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-orange-50 transition-colors ${
                value === option.key
                  ? "bg-orange-50 text-orange-600 font-semibold"
                  : "text-gray-700"
              }`}
              onClick={() => {
                onChange(option.source);
                setIsOpen(false);
              }}
            >
              {option.image && (
                <div className="relative w-6 h-6 shrink-0">
                  <Image
                    src={option.image}
                    alt={option.label}
                    fill
                    className="object-contain rounded"
                  />
                </div>
              )}
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

import React from "react";

/**
 * Champs de formulaire du module, au style des autres écrans du backoffice.
 * Un libellé est toujours affiché : les agents s'en servent sur téléphone.
 */

export const classeChamp =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#F17922] focus:ring-2 focus:ring-orange-100 disabled:bg-gray-50 disabled:text-gray-400";

export function Libelle({ children, requis }: { children: React.ReactNode; requis?: boolean }) {
  return (
    <span className="block text-xs font-semibold text-gray-600 mb-1">
      {children}
      {requis && <span className="text-rose-500"> *</span>}
    </span>
  );
}

export function ChampSelect({
  label,
  valeur,
  onChange,
  options,
  vide,
  requis,
  desactive,
}: {
  label?: string;
  valeur: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  vide?: string;
  requis?: boolean;
  desactive?: boolean;
}) {
  return (
    <label className="block">
      {label && <Libelle requis={requis}>{label}</Libelle>}
      <select
        value={valeur}
        onChange={(e) => onChange(e.target.value)}
        disabled={desactive}
        className={`${classeChamp} cursor-pointer`}
      >
        {vide !== undefined && <option value="">{vide}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function ChampTexte({
  label,
  valeur,
  onChange,
  type = "text",
  placeholder,
  requis,
  min,
  max,
}: {
  label?: string;
  valeur: string;
  onChange: (v: string) => void;
  type?: "text" | "date" | "datetime-local" | "number" | "url";
  placeholder?: string;
  requis?: boolean;
  min?: string | number;
  max?: string | number;
}) {
  return (
    <label className="block">
      {label && <Libelle requis={requis}>{label}</Libelle>}
      <input
        type={type}
        value={valeur}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        min={min}
        max={max}
        className={classeChamp}
      />
    </label>
  );
}

export function Bouton({
  children,
  onClick,
  variante = "secondaire",
  desactive,
  type = "button",
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variante?: "primaire" | "secondaire" | "danger" | "discret";
  desactive?: boolean;
  type?: "button" | "submit";
  className?: string;
}) {
  const styles = {
    primaire: "bg-[#F17922] text-white hover:bg-[#e06a15] border border-[#F17922]",
    secondaire: "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50",
    danger: "bg-white text-rose-600 border border-rose-200 hover:bg-rose-50",
    discret: "bg-transparent text-gray-600 hover:bg-gray-100 border border-transparent",
  }[variante];
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={desactive}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${styles} ${className}`}
    >
      {children}
    </button>
  );
}

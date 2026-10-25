"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";

interface Props {
  /** Déclenché quand le code saisi est valide (3 chiffres) et stable depuis 300 ms */
  onSubmit: (code: string) => void;
  /** En cours de lookup côté parent */
  isLoading: boolean;
}

/**
 * Champ de saisie 3 chiffres pour le code retrait.
 * Debounce 300 ms → déclenche automatiquement le lookup quand les 3 chiffres sont saisis.
 */
export const PickupCodeInput: React.FC<Props> = ({ onSubmit, isLoading }) => {
  const [value, setValue] = useState("");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (value.length === 3 && /^\d{3}$/.test(value)) {
      timeoutRef.current = setTimeout(() => onSubmit(value), 300);
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [value, onSubmit]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 3);
    setValue(digits);
  }, []);

  return (
    <div className="flex items-center gap-2 bg-white border-2 border-[#F17922] rounded-xl pr-3 pl-4 shadow-sm">
      <Search className="w-4 h-4 text-[#F17922]" />
      <input
        type="text"
        inputMode="numeric"
        maxLength={3}
        value={value}
        onChange={handleChange}
        placeholder="Code retrait (ex: 421)"
        className="flex-1 py-2.5 text-sm font-mono text-gray-900 placeholder-gray-400 outline-none bg-transparent tracking-widest"
      />
      {isLoading && (
        <div className="w-4 h-4 border-2 border-[#F17922] border-t-transparent rounded-full animate-spin" />
      )}
    </div>
  );
};

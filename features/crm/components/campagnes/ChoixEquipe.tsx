import React from "react";
import { useAgentsQuery } from "../../queries/contact.query";
import { Libelle } from "../commun/Champs";
import { EtatRequete } from "../commun/Etats";

const ROLES: Record<string, string> = {
  CALL_CENTER: "Call center",
  MARKETING: "Marketing",
  ADMIN: "Direction",
};

/** Sélection multiple de l'équipe parmi les agents habilités (cahier §6.1). */
export function ChoixEquipe({ choisis, onChange }: { choisis: string[]; onChange: (ids: string[]) => void }) {
  const requete = useAgentsQuery();
  const agents = requete.data ?? [];
  const basculer = (id: string) =>
    onChange(choisis.includes(id) ? choisis.filter((a) => a !== id) : [...choisis, id]);

  return (
    <div>
      <Libelle requis>Équipe d&apos;agents</Libelle>
      <EtatRequete requete={requete}>
        <div className="grid sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto">
          {agents.map((a) => (
            <label
              key={a.id}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer text-sm ${
                choisis.includes(a.id) ? "border-[#F17922] bg-orange-50" : "border-gray-200"
              }`}
            >
              <input
                type="checkbox"
                checked={choisis.includes(a.id)}
                onChange={() => basculer(a.id)}
                className="w-4 h-4 accent-[#F17922]"
              />
              <span className="flex-1 min-w-0">
                <span className="block font-semibold text-gray-800 truncate">{a.fullname}</span>
                <span className="block text-xs text-gray-500">
                  {ROLES[a.role] ?? a.role} · {a.portefeuille} en cours
                </span>
              </span>
            </label>
          ))}
        </div>
      </EtatRequete>
    </div>
  );
}

import { ReactNode } from "react";

interface StatCardProps {
  icon: ReactNode;
  value: string | number;
  label: string;
  /** Seconde ligne : ce que le chiffre veut dire, quand il ne se suffit pas. */
  detail?: string;
}

/**
 * Un chiffre de la fiche client.
 *
 * ⚠️ VOLONTAIREMENT SOBRE. Ces cartes étaient bleue, verte, jaune et rose en
 * dégradé : quatre couleurs qui n'existent nulle part ailleurs dans le
 * backoffice, et qui donnaient le même poids visuel à « 52 500 F dépensés » et
 * à « 0 favori ». La couleur doit dire quelque chose ; ici, elle ne disait rien.
 *
 * Le chiffre porte seul, en chiffres tabulaires pour que quatre cartes côte à
 * côte s'alignent.
 */
export function StatCard({ icon, value, label, detail }: StatCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
      <div className="flex items-center gap-2 text-gray-400">
        {icon}
        <span className="text-[11px] font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-1.5 text-2xl font-bold tabular-nums text-gray-900">{value}</p>
      {detail && <p className="text-[11px] text-gray-500">{detail}</p>}
    </div>
  );
}

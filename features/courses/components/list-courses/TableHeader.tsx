export function TableHeader() {
  return (
    <thead className="bg-slate-50/60">
      <tr className="border-b border-slate-200 text-left text-[11px] font-semibold text-gray-600 uppercase tracking-wide">
        <th className="px-3 py-3">Référence</th>
        <th className="px-3 py-3">Code</th>
        <th className="px-3 py-3">Restaurant</th>
        <th className="px-3 py-3">Livreur</th>
        <th className="px-3 py-3">Livraisons</th>
        <th className="px-3 py-3">Statut</th>
        <th className="px-3 py-3">Frais</th>
        <th className="px-3 py-3 w-16 text-right">Actions</th>
      </tr>
    </thead>
  );
}

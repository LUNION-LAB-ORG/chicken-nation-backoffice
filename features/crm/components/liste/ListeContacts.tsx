import React, { useCallback, useState } from "react";
import { Users } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { useContactsQuery } from "../../queries/contact.query";
import { IContactFiltres } from "../../types/contact.type";
import { fmtNombre } from "../../utils/crm-ui";
import { Chargement, Erreur, Vide } from "../commun/Etats";
import { BarreSelection } from "./BarreSelection";
import { ExportContacts } from "./ExportContacts";
import { FiltresContacts } from "./FiltresContacts";
import { TableContacts } from "./TableContacts";

export const FILTRES_DEFAUT: IContactFiltres = { page: 1, limit: 25, sort: "entree_desc" };

/**
 * Liste des contacts (cahier §4). La direction voit tout le monde, un agent
 * son portefeuille, un pilote toute sa campagne : c'est le serveur qui tranche.
 */
export function ListeContacts({
  filtresInitiaux = FILTRES_DEFAUT,
  peutAssigner,
  peutExporter,
  voitTousLesAgents,
  onOuvrir,
}: {
  filtresInitiaux?: IContactFiltres;
  peutAssigner: boolean;
  peutExporter: boolean;
  voitTousLesAgents: boolean;
  onOuvrir: (id: string) => void;
}) {
  const [filtres, setFiltres] = useState<IContactFiltres>(filtresInitiaux);
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const { data, isPending, isError, error, isFetching } = useContactsQuery(filtres);
  const lignes = data?.data ?? [];

  const changerFiltres = useCallback((f: IContactFiltres) => {
    setFiltres(f);
    setSelection(new Set());
  }, []);

  const basculer = (id: string) =>
    setSelection((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const basculerPage = () =>
    setSelection((s) => {
      const toutes = lignes.every((l) => s.has(l.id));
      const n = new Set(s);
      lignes.forEach((l) => (toutes ? n.delete(l.id) : n.add(l.id)));
      return n;
    });

  return (
    <div className="space-y-3">
      <FiltresContacts filtres={filtres} onChange={changerFiltres} avecAgent={voitTousLesAgents} />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-gray-600">
          {data && (
            <>
              <span className="font-semibold text-gray-900">{fmtNombre(data.meta.total)}</span> contact
              {data.meta.total > 1 ? "s" : ""}
            </>
          )}
          {isFetching && !isPending && <span className="text-xs text-gray-400"> · mise à jour…</span>}
        </p>
        <div className="flex items-center gap-2">
          <select
            value={filtres.limit}
            onChange={(e) => changerFiltres({ ...filtres, limit: Number(e.target.value), page: 1 })}
            className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white"
            aria-label="Lignes par page"
          >
            {[25, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n} par page
              </option>
            ))}
          </select>
          {peutExporter && <ExportContacts filtres={filtres} />}
        </div>
      </div>

      {isError ? (
        <Erreur message={(error as Error)?.message} />
      ) : isPending ? (
        <Chargement />
      ) : lignes.length === 0 ? (
        <Vide
          Icone={Users}
          titre="Aucun contact ne correspond"
          texte="Élargissez les filtres. Un client qui commande sort de cette liste."
        />
      ) : (
        <TableContacts
          lignes={lignes}
          selection={selection}
          onBasculer={basculer}
          onBasculerPage={basculerPage}
          onOuvrir={onOuvrir}
          selectionnable={peutAssigner}
        />
      )}

      {(data?.meta.totalPages ?? 0) > 1 && (
        <Pagination
          currentPage={filtres.page ?? 1}
          totalPages={data!.meta.totalPages}
          onPageChange={(page) => setFiltres((f) => ({ ...f, page }))}
          isLoading={isFetching}
        />
      )}

      {peutAssigner && <BarreSelection ids={[...selection]} onVider={() => setSelection(new Set())} />}
    </div>
  );
}

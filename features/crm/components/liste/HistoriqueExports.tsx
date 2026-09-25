import React, { useState } from "react";
import Modal from "@/components/ui/Modal";
import { Pagination } from "@/components/ui/pagination";
import { useExportsQuery } from "../../queries/contact.query";
import { filtresLisibles } from "../../utils/filtres-lisibles";
import { fmtDateHeure, fmtNombre } from "../../utils/crm-ui";
import { EtatRequete, Vide } from "../commun/Etats";

const NATURE: Record<string, string> = {
  CONTACTS: "Liste des contacts",
  RAPPORT_CAMPAGNE: "Rapport de campagne",
  TABLEAU_PUBLICS: "Tableau de bord par public",
  COMPARATIF_CAMPAGNES: "Comparatif des campagnes",
};

/** Qui a sorti quelles données, quand, et avec quels filtres (cahier §4.2 et §10). */
export function HistoriqueExports({ ouvert, onFermer }: { ouvert: boolean; onFermer: () => void }) {
  const [page, setPage] = useState(1);
  const requete = useExportsQuery(page, ouvert);
  const { data } = requete;

  return (
    <Modal isOpen={ouvert} onClose={onFermer} title="Historique des exports">
      <EtatRequete requete={requete}>
        {!data?.data.length ? (
          <Vide titre="Aucun export pour l'instant" />
        ) : (
          <div className="space-y-2">
            {data.data.map((e) => {
              const filtres = filtresLisibles(e.filters);
              return (
                <div key={e.id} className="border border-gray-100 rounded-xl px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-gray-800">
                      {NATURE[e.kind] ?? e.kind} · {e.format}
                    </p>
                    <p className="text-xs text-gray-500 whitespace-nowrap">{fmtDateHeure(e.created_at)}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {e.user?.fullname ?? "Compte supprimé"} · {fmtNombre(e.row_count)} ligne{e.row_count > 1 ? "s" : ""}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {e.kind === "CONTACTS" && (filtres.length > 0 ? filtres.join(" · ") : "Sans filtre : toute la liste")}
                  </p>
                </div>
              );
            })}
            {data.meta.totalPages > 1 && (
              <Pagination currentPage={page} totalPages={data.meta.totalPages} onPageChange={setPage} />
            )}
          </div>
        )}
      </EtatRequete>
    </Modal>
  );
}

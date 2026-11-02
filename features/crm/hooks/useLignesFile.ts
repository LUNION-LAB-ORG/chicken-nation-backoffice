import { useEffect, useState } from "react";
import { LIGNES_PAR_PAGE, useLignesFileQuery } from "../queries/contact.query";
import { IContactLigne, RubriqueFile } from "../types/contact.type";
import { lignesDesPages } from "../utils/dossiers-file";

/**
 * Les lignes d'une rubrique de « Ma file », page par page.
 *
 * `lignes` et `total` : ce que l'accueil a déjà reçu, affiché tant que rien
 * d'autre n'est chargé. `ouvrir` : charger la première page tout de suite
 * (dossier qu'on ouvre) ; sinon la première lecture attend « Voir les
 * suivants » (rappels dus de l'accueil, déjà reçus). Sans `ouvrir` ni clic,
 * aucune requête ne part : face à un serveur plus ancien, rien ne change.
 */
export function useLignesFile({
  cle,
  rubrique,
  lignes: recues,
  total: annonce,
  ouvrir,
}: {
  cle: string;
  rubrique: RubriqueFile;
  lignes: IContactLigne[];
  total: number;
  ouvrir: boolean;
}) {
  const [demandees, setDemandees] = useState(0);
  // Un compte passé de 0 à plus pendant que le dossier est ouvert charge aussi sa page.
  const voulues = Math.max(demandees, ouvrir ? 1 : 0);
  const actif = voulues > 0;
  const requete = useLignesFileQuery(cle, rubrique, actif);
  // Une requête coupée garde son cache, que le temps réel ne relit plus : on ne s'y fie pas.
  const data = actif ? requete.data : undefined;
  const { hasNextPage, isFetching, isFetchingNextPage, fetchNextPage } = requete;
  const chargees = data?.pages.length ?? 0;

  // « Voir les suivants » avant la toute première lecture : la page 1 arrive,
  // puis la suivante est demandée d'elle-même.
  useEffect(() => {
    if (data && voulues > chargees && hasNextPage && !isFetching) void fetchNextPage();
  }, [data, voulues, chargees, hasNextPage, isFetching, fetchNextPage]);

  const lignes = data ? lignesDesPages(data.pages) : recues;
  const total = data ? data.pages[data.pages.length - 1].meta.total : annonce;
  const aDesSuivants = lignes.length < total && (!data || !!hasNextPage);

  return {
    lignes,
    total,
    aDesSuivants,
    chargement: isFetchingNextPage || (voulues > chargees && isFetching),
    // Les lignes reçues avec l'accueil valent déjà une page : le premier clic va à la suivante.
    suivants: () => setDemandees(Math.max(voulues, chargees, Math.ceil(recues.length / LIGNES_PAR_PAGE)) + 1),
  };
}

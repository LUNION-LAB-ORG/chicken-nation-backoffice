import { useState } from "react";

/**
 * Page d'une liste filtrée : elle revient à 1 dès que les filtres changent,
 * sans effet ni rendu intermédiaire sur l'ancienne page.
 */
export function usePageSelonFiltres(filtres: unknown): [number, (page: number) => void] {
  const cle = JSON.stringify(filtres);
  const [etat, setEtat] = useState({ cle, page: 1 });
  return [etat.cle === cle ? etat.page : 1, (page) => setEtat({ cle, page })];
}

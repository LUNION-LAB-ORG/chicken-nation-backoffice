"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { relancesKey, usePeutVoirLesBrouillons, useRelancesQuery } from "../queries/relance.query";
import { useRelanceUiStore } from "../stores/relance-ui.store";
import { useRelancesSocketSync } from "./useRelancesSocketSync";
import { useSonRelances } from "./useSonRelances";

/** Au-delà, on s'en remet à la relecture de fond (une minute) plutôt qu'à une minuterie lointaine. */
const ECHEANCE_MAX_MS = 30 * 60_000;

/**
 * Guetteur global de la relance, monté UNE fois pour tout `/gestion`
 * (useNotificationBootstrap). Il pilote la seule lecture à intervalle de la
 * liste ; compteur, badge, bandeau et onglet lisent le même cache.
 *
 *  - recale l'horloge de l'écran sur celle du serveur ;
 *  - relit la liste à `prochaine_echeance` (un paiement en cours qui passe
 *    le délai, une prise qui expire : aucun événement ne le signale) ;
 *  - écoute `relance:changed` et fait sonner les nouvelles alertes.
 *
 * Pour un rôle non habilité : aucune requête, aucun écouteur, aucun son.
 */
export const useRelancesWatcher = () => {
  const habilite = usePeutVoirLesBrouillons();
  const { data, dataUpdatedAt, refetch } = useRelancesQuery({ pilote: true });
  const setEcartHorloge = useRelanceUiStore((s) => s.setEcartHorloge);
  const queryClient = useQueryClient();

  // La déconnexion ne vide pas le cache : un compte non habilité qui prend
  // l'onglet ne doit rien garder des relances du compte précédent.
  useEffect(() => {
    if (!habilite) queryClient.removeQueries({ queryKey: relancesKey() });
  }, [habilite, queryClient]);

  // Décalage d'horloge mesuré à la réception de la réponse.
  useEffect(() => {
    if (!data?.maintenant || !dataUpdatedAt) return;
    const serveur = Date.parse(data.maintenant);
    if (Number.isFinite(serveur)) setEcartHorloge(serveur - dataUpdatedAt);
  }, [data?.maintenant, dataUpdatedAt, setEcartHorloge]);

  // Relecture à la prochaine échéance (+1 s, pour que le serveur ait basculé).
  const echeance = data?.prochaine_echeance;
  useEffect(() => {
    if (!habilite || !echeance) return;
    const cible = Date.parse(echeance);
    if (!Number.isFinite(cible)) return;
    const ecart = useRelanceUiStore.getState().ecartHorloge;
    const delai = cible - (Date.now() + ecart) + 1000;
    if (delai > ECHEANCE_MAX_MS) return;
    const id = window.setTimeout(() => void refetch(), Math.max(1000, delai));
    return () => window.clearTimeout(id);
  }, [habilite, echeance, refetch]);

  const { alerter } = useSonRelances(habilite ? data : undefined);
  useRelancesSocketSync(habilite, alerter);
};

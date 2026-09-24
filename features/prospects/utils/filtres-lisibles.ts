import { ProspectStatut } from "../types/prospect.type";
import { ETAT_COUPON_META, STATUT_META } from "./prospect-ui";

const LIBELLES: Record<string, string> = {
  search: "Recherche",
  status: "Statut",
  agent_id: "Agent",
  campaign_id: "Campagne",
  call_status_id: "Statut d'appel",
  loss_reason_id: "Raison",
  coupon: "Coupon",
  registered_from: "Inscrits depuis le",
  registered_to: "Inscrits jusqu'au",
  last_call_from: "Appelés depuis le",
  last_call_to: "Appelés jusqu'au",
  never_called: "Jamais appelés",
  abandoned: "Paiement abandonné",
};

function valeurLisible(cle: string, valeur: string): string {
  if (cle === "status") {
    return valeur
      .split(",")
      .map((s) => STATUT_META[s as ProspectStatut]?.label ?? s)
      .join(", ");
  }
  if (cle === "coupon") return ETAT_COUPON_META[valeur as keyof typeof ETAT_COUPON_META]?.label ?? valeur;
  if (valeur === "true") return "oui";
  if (valeur === "none") return cle === "campaign_id" ? "hors campagne" : "sans agent";
  // Un identifiant ne dit rien à personne : on signale seulement qu'un choix a été fait.
  if (/^[0-9a-f-]{36}$/i.test(valeur)) return "choisi";
  return valeur;
}

/** Filtres d'un export, écrits pour être lus par un humain. */
export function filtresLisibles(filtres: Record<string, string> | null): string[] {
  return Object.entries(filtres ?? {})
    .filter(([cle, v]) => v && LIBELLES[cle])
    .map(([cle, v]) => `${LIBELLES[cle]} : ${valeurLisible(cle, v)}`);
}

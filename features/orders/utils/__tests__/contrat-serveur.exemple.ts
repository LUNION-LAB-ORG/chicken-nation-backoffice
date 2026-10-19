import type { BrouillonLigne, RelancesReponse } from "../../types/relance.types";

/**
 * RÉPONSE RÉELLE DU SERVEUR à `GET /orders/relances` (paiement à la livraison
 * sur le site, 19/10/2026), sérialisée comme en HTTP.
 *
 * Copie EXACTE de `REPONSE_RELANCES` dans
 * backend/src/modules/order/contrat-paiement-livraison.spec.ts, où le vrai
 * service la produit. Les deux copies changent ensemble.
 *
 * Fichier typé (et non `@ts-nocheck` comme les tests bun) : `tsc` vérifie que
 * les types de l'écran (`relance.types.ts`) acceptent ce que le serveur
 * envoie, sans champ en trop ni en moins. Lu par `contrat-serveur.test.ts`.
 *
 * Trois clients : Yao (commande à confirmer de 4 h, puis une commande
 * confirmée : doublon possible), Awa (panier de l'application, puis commande
 * à confirmer : elle devient la tête), Blé (panier de l'application seul).
 */

const ligne = (
  id: string,
  reference: string,
  created_at: string,
  client_nom: string,
  telephone: string,
  amount: number,
  channel: string,
  paiement_a_la_livraison: boolean,
): BrouillonLigne => ({
  id,
  reference,
  created_at,
  client_nom,
  telephone,
  restaurant: { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", name: "Riviera" },
  type: "DELIVERY",
  amount,
  paiement_refuse: false,
  annulee_par_client: false,
  channel,
  paiement_a_la_livraison,
});

const SIGNAUX_VIDES = {
  paiement_refuse: false,
  paiement_partiel: null,
  commande_recente: null,
  annulee_par_client: null,
  commande_suivante: null,
};

export const REPONSE_RELANCES = {
  maintenant: "2026-10-19T12:00:00.000Z",
  regles: { delai_minutes: 3, fenetre_heures: 3, duree_prise_minutes: 10, rappel_minutes: 5 },
  prochaine_echeance: null,
  compteurs: { a_relancer: 3, pris: 0, pris_par_moi: 0, en_cours: 0, ignorees: 0, a_confirmer: 2 },
  groupes: [
    {
      cle: "a0000000-0000-4000-8000-000000000003",
      etat: "A_RELANCER",
      a_confirmer: true,
      tete: ligne(
        "a0000000-0000-4000-8000-000000000003",
        "ORD-261019-00003",
        "2026-10-19T08:00:00.000Z",
        "Yao Kouassi",
        "0700000002",
        9100,
        "WEB",
        true,
      ),
      autres: [],
      alerte_le: null,
      prise: null,
      signaux: {
        ...SIGNAUX_VIDES,
        commande_suivante: { reference: "ORD-261019-00004", created_at: "2026-10-19T11:30:00.000Z" },
      },
      crm: null,
    },
    {
      cle: "a0000000-0000-4000-8000-000000000002",
      etat: "A_RELANCER",
      a_confirmer: true,
      tete: ligne(
        "a0000000-0000-4000-8000-000000000002",
        "ORD-261019-00002",
        "2026-10-19T11:59:00.000Z",
        "Awa Koné",
        "0700000001",
        7600,
        "WEB",
        true,
      ),
      autres: [
        ligne(
          "a0000000-0000-4000-8000-000000000001",
          "ORD-261019-00001",
          "2026-10-19T11:50:00.000Z",
          "Awa Koné",
          "0700000001",
          5050,
          "APP",
          false,
        ),
      ],
      alerte_le: null,
      prise: null,
      signaux: SIGNAUX_VIDES,
      crm: null,
    },
    {
      cle: "a0000000-0000-4000-8000-000000000005",
      etat: "A_RELANCER",
      a_confirmer: false,
      tete: ligne(
        "a0000000-0000-4000-8000-000000000005",
        "ORD-261019-00005",
        "2026-10-19T11:52:00.000Z",
        "Blé Gnahoré",
        "0700000003",
        3500,
        "APP",
        false,
      ),
      autres: [],
      alerte_le: null,
      prise: null,
      signaux: SIGNAUX_VIDES,
      crm: null,
    },
  ],
} satisfies RelancesReponse;

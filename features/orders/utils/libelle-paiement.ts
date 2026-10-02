/**
 * Libellé AFFICHÉ du canal de paiement (`paymentChannel`).
 *
 * La valeur interne reste « Appli » / « Restaurant » : des règles s'en
 * servent (reprise d'une commande, confirmation de paiement). Seul l'écran
 * change : une commande payée en ligne peut venir de l'application OU du
 * site, d'où « En ligne » (choix de l'équipe du 02/10). D'où elle vient se
 * lit dans la colonne Source (canal-commande.ts).
 */
export function libellePaiement(paymentChannel: string | null | undefined): string {
  if (paymentChannel === "Appli") return "En ligne";
  return paymentChannel ?? "";
}

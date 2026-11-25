import type { ConfigurationPaiementEnLigne } from "../types/paiement-en-ligne.types";

const API_PAR_DEFAUT = "https://api-private.chicken-nation.com/api/v1";

/** Adresse du webhook à déclarer chez Paystack, d'après l'adresse de l'API du back-office. */
export function urlWebhookPaystack(prefixeApi: string | undefined = process.env.NEXT_PUBLIC_API_PREFIX): string {
  const base = (prefixeApi ?? "").trim().replace(/\/+$/, "");
  const absolue = /^https:\/\//.test(base) ? base : API_PAR_DEFAUT;
  return `${absolue}/paystack/webhook`;
}

/** Ce qu'il faut dire en haut de l'écran : null quand tout va. */
export function alertePaiementEnLigne(c: ConfigurationPaiementEnLigne | undefined): { ton: "rouge" | "ambre"; texte: string } | null {
  if (!c) return null;
  if (!c.en_ligne_actif) {
    return { ton: "ambre", texte: "Paiement en ligne coupé : l'appli et le site proposent seulement le paiement à la livraison ou au restaurant." };
  }
  if (c.fournisseur !== "paystack") return null;
  if (!c.paystack.cle_configuree) {
    return { ton: "rouge", texte: "Clé secrète Paystack absente : aucun paiement en ligne n'est possible." };
  }
  const sans = c.restaurants.filter((r) => !r.utilisable);
  if (sans.length === c.restaurants.length && sans.length > 0) {
    return { ton: "rouge", texte: "Aucun restaurant n'a de sous-compte Paystack utilisable : aucun paiement en ligne n'est possible." };
  }
  if (sans.length > 0) {
    const noms = sans.map((r) => r.nom).join(", ");
    return { ton: "ambre", texte: `Sans paiement en ligne tant que leur sous-compte n'est pas prêt : ${noms}.` };
  }
  return null;
}

/** Taux saisi (« 2,3 » ou « 2.3 ») : nombre de 0 à 20, ou null s'il est illisible. */
export function lireTauxSaisi(saisie: string): number | null {
  const t = Number(saisie.trim().replace(",", "."));
  if (saisie.trim() === "" || !Number.isFinite(t) || t < 0 || t > 20) return null;
  return Math.round(t * 100) / 100;
}

/**
 * Frais de paiement ajoutés au client (même calcul que le serveur). Paystack
 * prend son pourcentage sur le total débité : le client paie donc
 * commande / (1 − taux), au franc supérieur, pour que le restaurant reçoive
 * au moins la commande.
 */
export function fraisPourLeClient(montant: number, taux: number): number {
  const m = Math.round(montant);
  const centiemes = Math.round(taux * 100);
  if (m <= 0 || centiemes <= 0 || centiemes >= 10_000) return 0;
  const reste = 10_000 - centiemes;
  return Math.floor((m * 10_000 + reste - 1) / reste) - m;
}

/** Frais de service d'une commande : pourcentage du prix des plats, à la dizaine supérieure (comme le serveur). */
export function fraisDeService(plats: number, pourCent: number): number {
  const centiemes = Math.round(pourCent * 100);
  return Math.ceil((Math.round(plats) * centiemes) / 10_000 / 10 - 1e-9) * 10;
}

/** « 0 % » ou « 2,5 % » ; tiret si inconnu. */
export function partLisible(part: number | null | undefined): string {
  if (part === null || part === undefined || !Number.isFinite(part)) return "inconnue";
  return `${String(part).replace(".", ",")} %`;
}

/**
 * RECHERCHE D'UNE COMMANDE (27/11). Règles pures.
 *
 * Le champ de recherche de l'écran « Commandes » :
 *  - cherche dans toutes les commandes par le serveur (paramètre `search`,
 *    `recherche-commande.rules.ts`) ; le résultat est la liste de l'onglet
 *    « Commandes », y compris quand la recherche part de « En cours » ;
 *  - filtre sur place l'onglet « À relancer », dont les paniers non payés ne
 *    figurent pas dans cette liste. Ce filtre est écrit ici, avec les mêmes
 *    repères que le serveur : référence, nom et numéro du client.
 *
 * Le tableau « En cours » n'est jamais filtré : une recherche oubliée y
 * cacherait les commandes qui arrivent.
 */

/** En dessous, la saisie ne filtre rien (même seuil que le serveur). */
export const RECHERCHE_MIN = 2;
/** En dessous, des chiffres ne désignent pas un numéro. */
const CHIFFRES_MIN = 4;
const INDICATIF_CI = "225";

/** Saisie resserrée (« # » de tête retiré), ou chaîne vide si elle est trop courte. */
export function lireRecherche(saisie: string | null | undefined): string {
  const texte = (saisie ?? "").replace(/\s+/g, " ").trim().replace(/^#\s*/, "").trim();
  return texte.length >= RECHERCHE_MIN ? texte : "";
}

/** Minuscules, sans accents : « Koné » et « kone » se valent. */
const nu = (texte: string | null | undefined): string =>
  (texte ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

const chiffres = (texte: string | null | undefined): string => (texte ?? "").replace(/\D/g, "");

/** Chiffres d'une saisie en forme de numéro ; un numéro complet perd son indicatif. */
function numeroCherche(texte: string): string | null {
  if (!/^\+?[\d\s.\-()]+$/.test(texte)) return null;
  let lu = chiffres(texte);
  if (lu.startsWith("00")) lu = lu.slice(2);
  if (lu.startsWith(INDICATIF_CI) && lu.length === 13) lu = lu.slice(INDICATIF_CI.length);
  return lu.length >= CHIFFRES_MIN ? lu : null;
}

/** Ce qu'on sait d'une commande pour la retrouver. */
export interface ReperesCommande {
  reference?: string | null;
  /** Nom du compte, nom inscrit sur la commande : chacun doit porter TOUS les mots. */
  noms?: (string | null | undefined)[];
  telephones?: (string | null | undefined)[];
  emails?: (string | null | undefined)[];
  /** « Commande pour Awa Koné, 07 07 07 07 07 » : cherchée par nom et par numéro. */
  note?: string | null;
  /** Code promo, références de paiement : retrouvés en entier seulement. */
  codes?: (string | null | undefined)[];
}

/** La commande correspond-elle à la saisie (déjà lue par `lireRecherche`) ? */
export function commandeCorrespond(reperes: ReperesCommande, recherche: string): boolean {
  if (!recherche) return true;
  const cherche = nu(recherche);

  if (nu(reperes.reference).includes(cherche)) return true;
  if (!recherche.includes(" ") && (reperes.codes ?? []).some((code) => !!code && nu(code) === cherche)) return true;

  if (/\p{L}/u.test(recherche)) {
    const mots = cherche.split(" ").filter(Boolean);
    const porteTout = (texte: string | null | undefined) => {
      const lu = nu(texte);
      return !!lu && mots.every((mot) => lu.includes(mot));
    };
    if ([...(reperes.noms ?? []), reperes.note].some(porteTout)) return true;
  }

  const numero = numeroCherche(recherche);
  if (numero && [...(reperes.telephones ?? []), reperes.note].some((t) => chiffres(t).includes(numero))) return true;

  if (recherche.includes("@") && (reperes.emails ?? []).some((email) => nu(email).includes(cherche))) return true;

  return false;
}

/** Panier de l'onglet « À relancer » (`BrouillonLigne`). */
export function reperesDeBrouillon(ligne: {
  reference?: string | null;
  client_nom?: string | null;
  telephone?: string | null;
}): ReperesCommande {
  return { reference: ligne.reference, noms: [ligne.client_nom], telephones: [ligne.telephone] };
}

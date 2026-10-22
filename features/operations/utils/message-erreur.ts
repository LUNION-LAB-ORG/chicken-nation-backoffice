/**
 * MESSAGE D'ERREUR DU MODULE OPÉRATIONS (incident du 22/10).
 *
 * Le serveur explique ses refus en français, pour la caissière : « Aucune
 * course en cours avec ce code dans ce restaurant aujourd'hui. Vérifiez le
 * code dicté par le livreur. », « La commande ORD-… est encore « En
 * préparation » : marquez-la prête avant de la remettre. », « Ce code existe
 * dans plusieurs restaurants : choisissez le restaurant. ». C'est CE texte
 * qu'on affiche.
 *
 * Avant, le module passait par `getHumanReadableError` (écrit pour les
 * promotions) : un 400 devenait « Les informations saisies ne sont pas
 * valides », un 409 « Une promotion avec ces caractéristiques existe déjà ».
 * La caissière ne savait pas pourquoi le code était refusé.
 *
 * Ordre de lecture :
 *  1. `messageServeur` : le refus du serveur, que `apiRequest` garde à côté
 *     de son texte par défaut (404, 422, 500…) ;
 *  2. `message` : le texte de l'erreur (pour un 400, un 403 ou un 409,
 *     `apiRequest` y met déjà le message du serveur) ;
 *  3. un repli lisible selon le statut, quand aucun des deux ne dit rien
 *     d'utile (corps vide, texte technique, réseau coupé).
 */

const CONNEXION = 'Problème de connexion. Vérifiez la connexion internet et réessayez.';

const REPLI_PAR_STATUT: Record<number, string> = {
  400: 'La demande a été refusée. Vérifiez la saisie et réessayez.',
  401: 'Votre session a expiré. Veuillez vous reconnecter.',
  403: "Vous n'avez pas les droits pour cette action.",
  404: 'Introuvable. Actualisez la page et réessayez.',
  409: 'Action impossible : la donnée a changé entre-temps.',
  429: 'Trop de tentatives. Patientez quelques instants avant de réessayer.',
};

const REPLI_SERVEUR = 'Erreur temporaire du serveur. Réessayez dans quelques instants.';
const REPLI = 'Une erreur est survenue. Veuillez réessayer.';

/** Réseau coupé : `fetch` rejette avec un texte du navigateur, en anglais. */
const RESEAU = /failed to fetch|load failed|networkerror|network request failed|err_network|err_internet_disconnected/i;

/**
 * Textes techniques, jamais montrés : intitulés HTTP bruts de NestJS
 * (« Bad Request », « Forbidden resource »…), route inconnue (« Cannot GET
 * /api/v1/… »), erreurs JavaScript, JSON ou HTML brut.
 */
const TECHNIQUES = [
  /^(bad request|unauthorized|forbidden( resource)?|not found|conflict|too many requests|internal server error|bad gateway|service unavailable|gateway timeout)\.?$/i,
  /^cannot (get|post|put|patch|delete) /i,
  /^(error|typeerror|referenceerror|syntaxerror|aborterror)\b/i,
  /^unexpected (token|end of json)/i,
  /^request failed with status code/i,
  /^requête invalide \(\d+\)$/i,
  /^\s*[{[<]/,
];

/**
 * Longueur maximale d'un texte montré. Le refus « commandes pas prêtes »
 * nomme chaque commande et son statut : il dépasse 300 caractères dès six
 * commandes, et une course peut en compter dix (réglage « Nombre max de
 * commandes par course »). Au-delà de 600, ce n'est plus un message écrit
 * pour la caissière.
 */
const LONGUEUR_MAX = 600;

/** Vrai si le texte peut être montré tel quel à une caissière. */
export function estMessageLisible(texte: unknown): texte is string {
  if (typeof texte !== 'string') return false;
  const propre = texte.trim();
  if (propre.length < 5 || propre.length > LONGUEUR_MAX) return false;
  if (RESEAU.test(propre)) return false;
  return !TECHNIQUES.some((motif) => motif.test(propre));
}

/** Texte à afficher pour une erreur levée par un appel du module Opérations. */
export function messageErreurOperations(erreur: unknown): string {
  const objet = erreur && typeof erreur === 'object' ? (erreur as Record<string, unknown>) : {};
  const message = typeof erreur === 'string' ? erreur : objet.message;

  if (typeof message === 'string' && RESEAU.test(message)) return CONNEXION;

  for (const texte of [objet.messageServeur, message]) {
    if (estMessageLisible(texte)) return texte.trim();
  }

  const statut = typeof objet.status === 'number' ? objet.status : 0;
  if (REPLI_PAR_STATUT[statut]) return REPLI_PAR_STATUT[statut];
  if (statut >= 500) return REPLI_SERVEUR;
  return REPLI;
}

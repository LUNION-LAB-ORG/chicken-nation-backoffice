/**
 * PARAMÈTRES > LIVRAISON : UN SEUL « ENREGISTRER » POUR TOUTE LA PAGE, ET DES
 * RELECTURES QUI N'EFFACENT PLUS LES SAISIES (relecture du 23/10).
 *
 * Deux défauts, même cause (deux parties de la page qui se rechargeaient
 * l'une l'autre depuis la base) :
 *  - le bouton « Enregistrer » du bas n'écrivait plus le regroupement
 *    (section sortie de la liste des champs), mais affichait « Enregistré » ;
 *    ses écritures relisaient les réglages et la section remettait la méthode
 *    et les limites de la base : un repli vers l'ancienne méthode choisi puis
 *    « enregistré » par ce bouton n'était jamais écrit ;
 *  - « Enregistrer le regroupement » relisait les réglages et le reste de la
 *    page reprenait les valeurs de la base : saisies en cours effacées,
 *    grille des frais comprise.
 *
 * Désormais :
 *  - une relecture ne remplace que les champs que l'écran n'a pas modifiés
 *    depuis la dernière lecture (`rehydrater`, `garderSiModifie`) ;
 *  - le bouton du bas enregistre toute la page, regroupement compris, et
 *    seulement ce qui a changé ; une saisie refusée du regroupement bloque
 *    tout, avec un message (`etatEnregistrementPage`).
 *
 * Fichier pur : testé par `bun test`.
 */

export type Valeurs = Record<string, string>;

/**
 * Valeur gardée à la relecture : la saisie si elle a changé depuis la
 * dernière lecture, sinon la nouvelle valeur de la base.
 */
export function garderSiModifie<T>(p: {
  locale: T;
  hydratee: T | undefined;
  serveur: T;
  egal?: (a: T, b: T | undefined) => boolean;
}): T {
  const egal = p.egal ?? ((a: T, b: T | undefined) => a === b);
  return egal(p.locale, p.hydratee) ? p.serveur : p.locale;
}

/**
 * Valeurs de l'écran après une relecture. `hydratees` : ce que la lecture
 * précédente avait mis à l'écran (`null` à la première lecture : tout vient
 * de la base).
 */
export function rehydrater(p: { locales: Valeurs; hydratees: Valeurs | null; serveur: Valeurs }): Valeurs {
  if (!p.hydratees) return { ...p.serveur };
  const cles = new Set([...Object.keys(p.serveur), ...Object.keys(p.hydratees), ...Object.keys(p.locales)]);
  const resultat: Valeurs = {};
  for (const cle of cles) {
    const valeur = p.locales[cle] === p.hydratees[cle] ? p.serveur[cle] : p.locales[cle];
    if (valeur !== undefined) resultat[cle] = valeur;
  }
  return resultat;
}

/**
 * Champs à écrire par « Enregistrer » : modifiés depuis la dernière lecture
 * et non vides (un champ vidé garde la valeur du serveur, comme avant).
 */
export function champsAEcrire(cles: readonly string[], valeurs: Valeurs, hydratees: Valeurs): string[] {
  return cles.filter((cle) => {
    const v = valeurs[cle];
    return v !== undefined && v !== '' && v !== hydratees[cle];
  });
}

/** Deux listes de valeurs simples identiques (grille des frais, restaurants). */
export function memeListe<T>(a: readonly T[], b: readonly T[] | undefined): boolean {
  return !!b && JSON.stringify(a) === JSON.stringify(b);
}

export interface EtatRegroupement {
  /** Écritures ou effacements en attente dans la section « Regroupement ». */
  changements: number;
  /** Saisies que le serveur refuserait. */
  erreurs: number;
}

/**
 * Ce que dit et permet le bouton du bas : nombre total de modifications de
 * la page (regroupement compris) et, s'il y a lieu, la raison du blocage.
 */
export function etatEnregistrementPage(p: { page: number; regroupement: EtatRegroupement }): {
  total: number;
  bloque: string | null;
} {
  const total = p.page + p.regroupement.changements;
  const n = p.regroupement.erreurs;
  if (n > 0) {
    return {
      total,
      bloque:
        n === 1
          ? 'Regroupement : 1 valeur refusée, corrigez-la pour enregistrer.'
          : `Regroupement : ${n} valeurs refusées, corrigez-les pour enregistrer.`,
    };
  }
  return { total, bloque: null };
}

/** « 1 modification », « 3 modifications », rien s'il n'y en a pas. */
export function texteModifications(total: number): string | null {
  if (total <= 0) return null;
  return total === 1 ? '1 modification' : `${total} modifications`;
}

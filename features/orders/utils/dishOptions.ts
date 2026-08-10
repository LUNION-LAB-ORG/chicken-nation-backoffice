import {
  DishOptionGroup,
  DishOptionItem,
} from "../../menus/types/dish-option.types";

/**
 * MENUS COMPOSABLES — logique de composition de la prise de commande.
 *
 * L'opérateur CHOISIT parmi les options ; il ne les définit pas. C'est ce qui
 * distingue ce fichier de l'éditeur de configuration des menus.
 *
 * Tout est pur : aucun état, aucun message, aucun appel réseau. Les règles sont
 * le miroir de celles du serveur, qui reste seul juge du prix.
 */

/** Choix d'un groupe, dans l'ordre d'affichage. */
export const choixDuGroupe = (groupe: DishOptionGroup): DishOptionItem[] =>
  [...groupe.items].sort((a, b) => a.position - b.position);

/** Groupe auquel appartient un choix, ou rien si l'identifiant est étranger au plat. */
export const groupeDuChoix = (
  groups: DishOptionGroup[],
  itemId: string,
): DishOptionGroup | undefined =>
  groups.find((g) => g.items.some((i) => i.id === itemId));

/** Ordre stable : par position de groupe puis de choix. */
const trierSelection = (groups: DishOptionGroup[], ids: string[]): string[] => {
  const rang = new Map<string, number>();
  [...groups]
    .sort((a, b) => a.position - b.position)
    .forEach((g, gi) =>
      choixDuGroupe(g).forEach((i, ii) => rang.set(i.id, gi * 1000 + ii)),
    );
  return [...new Set(ids)].sort(
    (a, b) => (rang.get(a) ?? 9e9) - (rang.get(b) ?? 9e9),
  );
};

/**
 * Sélection de départ : les choix marqués par défaut ET disponibles.
 *
 * Un groupe obligatoire SANS choix par défaut reste volontairement vide.
 * Cocher d'office le premier ferait facturer au client un format qu'il n'a pas
 * demandé, sans que l'opérateur le remarque.
 */
export const idsParDefaut = (groups: DishOptionGroup[]): string[] =>
  trierSelection(
    groups,
    groups.flatMap((g) =>
      choixDuGroupe(g)
        .filter((i) => i.is_default && i.available)
        .slice(0, Math.max(g.max_select, 1))
        .map((i) => i.id),
    ),
  );

/**
 * Sélection reconstruite depuis une commande existante, nettoyée des choix qui
 * n'appartiennent plus au plat parce qu'ils ont été retirés du catalogue depuis
 * l'achat.
 */
export const idsConnus = (groups: DishOptionGroup[], ids: string[]): string[] =>
  trierSelection(groups, ids.filter((id) => !!groupeDuChoix(groups, id)));

/**
 * Bascule d'un choix.
 *
 * Un groupe à choix unique se comporte en bouton radio. Un groupe multiple
 * REFUSE l'ajout une fois son maximum atteint, plutôt que d'évincer un choix en
 * silence : l'opérateur verrait sa sélection changer sans comprendre.
 */
export const basculerChoix = (
  groups: DishOptionGroup[],
  selection: string[],
  itemId: string,
): string[] => {
  const groupe = groupeDuChoix(groups, itemId);
  if (!groupe) return selection;
  const choix = groupe.items.find((i) => i.id === itemId);
  if (!choix || !choix.available) return selection;

  const idsGroupe = new Set(groupe.items.map((i) => i.id));
  const dansGroupe = selection.filter((id) => idsGroupe.has(id));
  const horsGroupe = selection.filter((id) => !idsGroupe.has(id));

  if (dansGroupe.includes(itemId)) {
    // Retirer sous le minimum du groupe reviendrait à laisser une question
    // obligatoire sans réponse : le serveur refuserait la commande entière.
    if (dansGroupe.length <= groupe.min_select) return selection;
    return trierSelection(groups, [
      ...horsGroupe,
      ...dansGroupe.filter((id) => id !== itemId),
    ]);
  }
  if (groupe.max_select <= 1) {
    return trierSelection(groups, [...horsGroupe, itemId]);
  }
  if (dansGroupe.length >= groupe.max_select) return selection;
  return trierSelection(groups, [...horsGroupe, ...dansGroupe, itemId]);
};

/**
 * Prix des options pour UN exemplaire. Les options suivent la quantité de la
 * ligne, contrairement aux suppléments qui portent la leur : la multiplication
 * se fait donc à l'appel, exactement comme côté serveur.
 */
export const prixOptionsUnitaire = (
  groups: DishOptionGroup[],
  selection: string[],
): number =>
  groups
    .flatMap((g) => g.items)
    .filter((i) => selection.includes(i.id))
    .reduce((somme, i) => somme + (Number(i.price_delta) || 0), 0);

/**
 * Ce qui empêche d'ajouter la ligne au panier, ou `null` si tout va bien.
 *
 * Miroir des refus du serveur. Le vérifier ici évite que TOUTE la commande soit
 * rejetée au moment de l'enregistrer, pour une seule ligne mal composée.
 */
export const verifierComposition = (
  groups: DishOptionGroup[],
  selection: string[],
): string | null => {
  for (const groupe of [...groups].sort((a, b) => a.position - b.position)) {
    const idsGroupe = new Set(groupe.items.map((i) => i.id));
    const retenus = selection.filter((id) => idsGroupe.has(id));

    if (retenus.length < groupe.min_select) {
      return groupe.min_select === 1
        ? `« ${groupe.name} » : un choix est attendu`
        : `« ${groupe.name} » : ${groupe.min_select} choix attendus au minimum`;
    }
    if (retenus.length > groupe.max_select) {
      return `« ${groupe.name} » : ${groupe.max_select} choix au maximum`;
    }
    const indisponible = groupe.items.find(
      (i) => retenus.includes(i.id) && !i.available,
    );
    if (indisponible) {
      return `« ${indisponible.label} » n'est plus disponible`;
    }
  }
  return null;
};

/** « Sauce : Piquante · Format : Menu ». Chaîne vide si aucun choix. */
export const resumeComposition = (
  groups: DishOptionGroup[],
  selection: string[],
): string =>
  [...groups]
    .sort((a, b) => a.position - b.position)
    .flatMap((g) =>
      choixDuGroupe(g)
        .filter((i) => selection.includes(i.id))
        .map((i) => `${g.name} : ${i.label}`),
    )
    .join(" · ");

/** Consigne affichée sous le titre d'un groupe. */
export const consigneGroupe = (groupe: DishOptionGroup): string => {
  if (groupe.max_select === 1) {
    return groupe.required ? "Choisissez 1 option" : "Facultatif, 1 option";
  }
  if (groupe.min_select === groupe.max_select) {
    return `Choisissez ${groupe.min_select} options`;
  }
  if (groupe.min_select === 0) {
    return `Jusqu'à ${groupe.max_select} options`;
  }
  return `De ${groupe.min_select} à ${groupe.max_select} options`;
};

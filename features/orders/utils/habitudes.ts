import { Dish } from "../../menus/types/dish.types";
import { DishOptionGroup } from "../../menus/types/dish-option.types";
import { DepartPlat, LigneDerniereCommande } from "../types/habitudes.types";
import { OrderItemFormData, SupplementItem } from "../types/order-form.types";
import { idsConnus, verifierComposition } from "./dishOptions";

/**
 * Prise de commande : menus habituels du client, reprise de sa dernière
 * commande, recherche d'un plat. Tout est pur : aucun état, aucun appel réseau.
 */

/** « 7 fois ». */
export const texteFois = (fois: number): string => `${fois} fois`;

/** « 20/11 », avec l'année quand ce n'est pas celle en cours. */
export const dateCourte = (iso: string, maintenant: Date = new Date()): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const jour = String(date.getDate()).padStart(2, "0");
  const mois = String(date.getMonth() + 1).padStart(2, "0");
  return date.getFullYear() === maintenant.getFullYear()
    ? `${jour}/${mois}`
    : `${jour}/${mois}/${date.getFullYear()}`;
};

/** « 1 x Burger Patron, 2 x Frites et boisson ». */
export const resumeLignes = (lignes: Pick<LigneDerniereCommande, "quantity" | "nom">[]): string =>
  lignes.map((ligne) => `${ligne.quantity} x ${ligne.nom}`).join(", ");

/**
 * Suppléments encore vendus avec ce plat aujourd'hui. Le serveur les a déjà
 * triés ; ce second contrôle couvre un catalogue changé depuis la lecture,
 * car un seul supplément refusé fait rejeter TOUTE la commande.
 */
export const supplementsDuJour = (dish: Dish, supplements: SupplementItem[]): SupplementItem[] => {
  const vendus = new Set(
    (dish.dish_supplements ?? [])
      .filter((ds) => ds.supplement && ds.supplement.available !== false)
      .map((ds) => ds.supplement!.id),
  );
  return supplements.filter((s) => vendus.has(s.id) && s.quantity > 0);
};

/** Départ de la fenêtre du plat choisi dans les habitudes : sa dernière façon de le commander. */
export const departHabitude = (dish: Dish, habitude: DepartPlat): DepartPlat => ({
  epice: dish.is_alway_epice ? true : habitude.epice,
  supplements: supplementsDuJour(dish, habitude.supplements),
  option_item_ids: habitude.option_item_ids,
});

const cleSupplements = (supplements: SupplementItem[]): string =>
  supplements
    .filter((s) => s.quantity > 0)
    .map((s) => `${s.id}x${s.quantity}`)
    .sort()
    .join("|");

/** Même plat, même épicé, mêmes suppléments, mêmes choix. */
export const memeLigne = (a: OrderItemFormData, b: OrderItemFormData): boolean =>
  a.dish_id === b.dish_id &&
  a.epice === b.epice &&
  cleSupplements(a.supplements) === cleSupplements(b.supplements) &&
  [...(a.option_item_ids ?? [])].sort().join("|") === [...(b.option_item_ids ?? [])].sort().join("|");

/**
 * Ajoute une ligne au panier. Une ligne identique déjà présente voit sa
 * quantité augmenter : deux clics sur « + » ne font pas deux lignes.
 */
export const ajouterLigne = (items: OrderItemFormData[], ligne: OrderItemFormData): OrderItemFormData[] => {
  const index = items.findIndex((item) => memeLigne(item, ligne));
  if (index === -1) return [...items, ligne];
  return items.map((item, i) => (i === index ? { ...item, quantity: item.quantity + ligne.quantity } : item));
};

/** Ligne ajoutée d'un clic sur « + » : une unité, sans supplément. */
export const lignePlatSimple = (dish: Dish): OrderItemFormData => ({
  dish_id: dish.id,
  quantity: 1,
  supplements: [],
  epice: !!dish.is_alway_epice,
  option_item_ids: [],
});

export interface Reprise {
  /** Lignes prêtes pour le panier (plats ordinaires). */
  lignes: OrderItemFormData[];
  /** Plats composables : leurs choix se vérifient sur le détail du plat. */
  aVerifier: { ligne: LigneDerniereCommande; dish: Dish }[];
  /** Noms des plats qui ne sont plus au menu pour ce client. */
  retires: string[];
}

/**
 * Trie les lignes de la dernière commande. `catalogue` : les plats que
 * l'agent peut ajouter aujourd'hui.
 */
export const preparerReprise = (
  lignes: LigneDerniereCommande[],
  catalogue: Map<string, Dish>,
): Reprise => {
  const reprise: Reprise = { lignes: [], aVerifier: [], retires: [] };
  for (const ligne of lignes) {
    const dish = catalogue.get(ligne.dish_id);
    if (!ligne.disponible || !dish) {
      reprise.retires.push(ligne.nom);
      continue;
    }
    if (dish.composable) {
      reprise.aVerifier.push({ ligne, dish });
      continue;
    }
    reprise.lignes.push({
      dish_id: dish.id,
      quantity: ligne.quantity,
      supplements: supplementsDuJour(dish, ligne.supplements),
      epice: dish.is_alway_epice ? true : ligne.epice,
      option_item_ids: [],
    });
  }
  return reprise;
};

/**
 * Ligne d'un plat composable repris tel quel, ou `null` si ses choix d'alors
 * ne tiennent plus (choix retiré, en rupture, règle du groupe changée) : le
 * serveur refuserait la commande entière, l'agent le compose donc de nouveau.
 */
export const ligneComposee = (
  ligne: LigneDerniereCommande,
  dish: Dish,
  groupes: DishOptionGroup[],
): OrderItemFormData | null => {
  const choix = idsConnus(groupes, ligne.option_item_ids);
  if (choix.length !== new Set(ligne.option_item_ids).size) return null;
  if (verifierComposition(groupes, choix) !== null) return null;
  return {
    dish_id: dish.id,
    quantity: ligne.quantity,
    supplements: supplementsDuJour(dish, ligne.supplements),
    epice: dish.is_alway_epice ? true : ligne.epice,
    option_item_ids: choix,
  };
};

/** « Non repris : Menu Campus (plus au menu), Burger XL (options à choisir) ». Vide si tout est repris. */
export const messageNonRepris = (retires: string[], aComposer: string[]): string => {
  const morceaux = [
    ...retires.map((nom) => `${nom} (plus au menu)`),
    ...aComposer.map((nom) => `${nom} (options à choisir)`),
  ];
  return morceaux.length > 0 ? `Non repris : ${morceaux.join(", ")}` : "";
};

/** Sans accent ni majuscule, pour comparer ce que l'agent tape. */
export const normaliser = (texte: string): string =>
  texte
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

/** Longueur à partir de laquelle la recherche remplace la grille de la catégorie. */
export const RECHERCHE_MIN = 2;

/**
 * Plats dont le nom contient tous les mots tapés, dans n'importe quel ordre.
 * Ceux dont le nom commence par la recherche passent devant.
 */
export const chercherPlats = <P extends { name: string }>(plats: P[], recherche: string): P[] => {
  const demande = normaliser(recherche);
  if (demande.length < RECHERCHE_MIN) return [];
  const mots = demande.split(/\s+/).filter(Boolean);
  return plats
    .map((plat) => ({ plat, nom: normaliser(plat.name) }))
    .filter(({ nom }) => mots.every((mot) => nom.includes(mot)))
    .sort(
      (a, b) =>
        Number(b.nom.startsWith(demande)) - Number(a.nom.startsWith(demande)) || a.nom.localeCompare(b.nom, "fr"),
    )
    .map(({ plat }) => plat);
};

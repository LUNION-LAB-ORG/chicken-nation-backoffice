import { getAuthToken } from "@/utils/authUtils";
import { getHumanReadableError } from "@/utils/errorMessages";
import {
  DishOptionConfiguration,
  DishOptionGroupPayload,
} from "../types/dish-option.types";

/**
 * MENUS COMPOSABLES — configuration des groupes d'options d'un plat.
 *
 * Trois opérations seulement : lire la configuration, l'enregistrer en bloc,
 * la recopier sur un autre plat. L'enregistrement en bloc est volontaire :
 * l'écran manipule un arbre complet, l'envoyer entier rend l'opération
 * rejouable et évite une cascade de petits appels dont un seul peut échouer.
 */

const API_URL = process.env.NEXT_PUBLIC_API_PREFIX;

const enTete = () => {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Authentification requise");
  }
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

/**
 * Le serveur renvoie un message métier utile (bornes incohérentes, choix en
 * double, supplément disparu). Le perdre au profit d'un « une erreur est
 * survenue » obligerait le gestionnaire à deviner ce qu'il a mal saisi.
 */
const lireErreur = async (response: Response): Promise<never> => {
  let message = `Erreur ${response.status}`;
  let detail: ErreurMetier | undefined;
  try {
    const corps = await response.json();
    const brut = corps?.message ?? corps?.error;
    if (Array.isArray(brut)) {
      message = brut.join(", ");
    } else if (typeof brut === "string" && brut.trim()) {
      message = brut;
    }
    // Refus DOCUMENTÉ : le serveur joint un code et le détail de ce qui bloque.
    // Sans cette remontée, l'écran ne peut afficher qu'une phrase dans un toast
    // de trois secondes, et le gestionnaire perd l'information avant d'avoir pu
    // agir dessus.
    if (typeof corps?.code === "string") {
      detail = { code: corps.code, usages: corps.usages };
    }
  } catch {
    // Réponse sans corps lisible : le code de statut suffira.
  }
  const erreur = new Error(message) as Error & ErreurMetier;
  if (detail) {
    erreur.code = detail.code;
    erreur.usages = detail.usages;
  }
  throw erreur;
};

/** Détail structuré que le serveur joint à certains refus. */
export type ErreurMetier = {
  code?: string;
  usages?: UsagesCadeau;
};

/** Ce qui empêche un plat de devenir composable. */
export type UsagesCadeau = {
  lots: { id: string; label: string; active: boolean }[];
  campagnes: { id: string; name: string; status: string }[];
  cadeaux: {
    id: string;
    status: string;
    expires_at: string | null;
    client: string;
    telephone: string | null;
  }[];
  combos: { id: string; title: string; status: string }[];
  bloquant: boolean;
};

/** Ce qui empêche ce plat de devenir composable, sans passer par un refus. */
export const getDishGiftUsages = async (
  dishId: string,
): Promise<UsagesCadeau> => {
  try {
    const response = await fetch(
      `${API_URL}/dishes/${dishId}/option-groups/usages-cadeau`,
      { method: "GET", headers: enTete() },
    );
    if (!response.ok) return await lireErreur(response);
    return (await response.json()) as UsagesCadeau;
  } catch (error) {
    console.error(error);
    throw new Error(getHumanReadableError(error));
  }
};

/**
 * Fait pointer un cadeau DÉJÀ DISTRIBUÉ sur un autre plat.
 *
 * Repointer le lot ou la campagne ne suffit pas : le contenu d'un cadeau est
 * figé au moment du tirage. C'est le seul geste qui débloque réellement un plat
 * promis à un client.
 */
export const repointGiftReward = async (
  rewardId: string,
  dishId: string,
): Promise<{ id: string }> => {
  try {
    const response = await fetch(`${API_URL}/fidelity/rewards/${rewardId}/plat`, {
      method: "PATCH",
      headers: enTete(),
      body: JSON.stringify({ dish_id: dishId }),
    });
    if (!response.ok) return await lireErreur(response);
    return (await response.json()) as { id: string };
  } catch (error) {
    console.error(error);
    throw new Error(getHumanReadableError(error));
  }
};

/** Annule un cadeau déjà distribué. Dernier recours. */
export const revokeGiftReward = async (
  rewardId: string,
  motif?: string,
): Promise<{ id: string }> => {
  try {
    const response = await fetch(
      `${API_URL}/fidelity/rewards/${rewardId}/revoquer`,
      { method: "PATCH", headers: enTete(), body: JSON.stringify({ motif }) },
    );
    if (!response.ok) return await lireErreur(response);
    return (await response.json()) as { id: string };
  } catch (error) {
    console.error(error);
    throw new Error(getHumanReadableError(error));
  }
};

export const getDishOptionConfiguration = async (
  dishId: string,
): Promise<DishOptionConfiguration> => {
  try {
    const response = await fetch(`${API_URL}/dishes/${dishId}/option-groups`, {
      method: "GET",
      headers: enTete(),
    });
    if (!response.ok) return await lireErreur(response);
    return (await response.json()) as DishOptionConfiguration;
  } catch (error) {
    console.error(error);
    throw new Error(getHumanReadableError(error));
  }
};

export const saveDishOptionConfiguration = async (
  dishId: string,
  groups: DishOptionGroupPayload[],
): Promise<DishOptionConfiguration> => {
  try {
    const response = await fetch(`${API_URL}/dishes/${dishId}/option-groups`, {
      method: "PUT",
      headers: enTete(),
      body: JSON.stringify({ groups }),
    });
    if (!response.ok) return await lireErreur(response);
    return (await response.json()) as DishOptionConfiguration;
  } catch (error) {
    console.error(error);
    throw new Error(getHumanReadableError(error));
  }
};

/**
 * Recopie la configuration d'un plat sur un autre. Les burgers de la carte
 * partagent la même grille de sauces : la ressaisir à la main pour chacun
 * serait long et produirait des écarts.
 */
export const copyDishOptionConfiguration = async (
  sourceDishId: string,
  cibleDishId: string,
): Promise<DishOptionConfiguration> => {
  try {
    const response = await fetch(
      `${API_URL}/dishes/${sourceDishId}/option-groups/copier-vers/${cibleDishId}`,
      { method: "POST", headers: enTete() },
    );
    if (!response.ok) return await lireErreur(response);
    return (await response.json()) as DishOptionConfiguration;
  } catch (error) {
    console.error(error);
    throw new Error(getHumanReadableError(error));
  }
};

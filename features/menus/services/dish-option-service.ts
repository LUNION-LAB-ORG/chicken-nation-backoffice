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
  try {
    const corps = await response.json();
    const brut = corps?.message ?? corps?.error;
    if (Array.isArray(brut)) {
      message = brut.join(", ");
    } else if (typeof brut === "string" && brut.trim()) {
      message = brut;
    }
  } catch {
    // Réponse sans corps lisible : le code de statut suffira.
  }
  throw new Error(message);
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

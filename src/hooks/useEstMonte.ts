import { useSyncExternalStore } from "react";

const abonner = () => () => {};

/**
 * Faux pendant le rendu du serveur ET pendant l'hydratation, vrai ensuite.
 *
 * La session du back-office est lue dans les cookies du navigateur dès la
 * création du magasin (`authStore`) : le serveur, lui, ne la connaît pas. Un
 * composant rendu des deux côtés qui affiche le nom, la photo ou les droits
 * du compte écrit donc autre chose que le serveur, et React abandonne
 * l'hydratation de toute la page (« Hydration failed », l'arbre est refait
 * côté navigateur).
 *
 * Un tel composant lit la session seulement quand ce crochet dit vrai : son
 * premier rendu est alors le même que celui du serveur, et le vrai contenu
 * arrive juste après. `useSyncExternalStore` plutôt qu'un état posé dans un
 * effet : React sait que la valeur du serveur vaut pendant l'hydratation, et
 * refait le rendu de lui-même ensuite.
 */
export function useEstMonte(): boolean {
  return useSyncExternalStore(
    abonner,
    () => true,
    () => false,
  );
}

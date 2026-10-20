import { libelleAdresse, objetAdresse } from "./adresse-commande";

/**
 * Adresse courte (la ville) et complète (infobulle) pour la liste des
 * commandes. Rend toujours du texte, même si l'adresse reçue est un objet
 * (recette du 20/10 : une adresse `{}` faisait planter la liste).
 */
export const formatAddress = (adresse: unknown): { short: string; full: string } => {
  const objet = objetAdresse(adresse);
  if (objet) {
    const ville = typeof objet.city === "string" && objet.city.trim() ? objet.city.trim() : "Ville non disponible";
    return { short: ville, full: libelleAdresse(objet) };
  }
  if (typeof adresse === "string" && adresse.trim()) {
    // Adresse en texte libre : tronquée pour la colonne, entière dans l'infobulle.
    return {
      short: adresse.length > 20 ? adresse.substring(0, 20) + "..." : adresse,
      full: adresse,
    };
  }
  const vide = libelleAdresse(null);
  return { short: vide, full: vide };
};

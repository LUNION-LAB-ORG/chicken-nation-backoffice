/**
 * Adresse d'une commande, telle que le serveur la renvoie.
 *
 * `Order.address` est une colonne JSON : elle contient le plus souvent un
 * TEXTE JSON (« {"title":"Maison",...} »), mais peut aussi contenir un OBJET
 * (graine du banc, anciennes intégrations). Recette du 20/10 : une adresse
 * `{}` faisait planter la liste « Par application » (erreur React 31, un objet
 * rendu dans la page). Tout passe donc par ces deux fonctions, qui rendent
 * toujours du texte.
 */

/** Champs d'adresse connus, dans l'ordre d'affichage. */
type ObjetAdresse = Record<string, unknown>;

const estObjet = (v: unknown): v is ObjetAdresse => typeof v === "object" && v !== null && !Array.isArray(v);

/** L'adresse en objet si elle en est un (directement ou en texte JSON), sinon null. */
export function objetAdresse(adresse: unknown): ObjetAdresse | null {
  if (estObjet(adresse)) return adresse;
  if (typeof adresse !== "string") return null;
  const texte = adresse.trim();
  if (!texte.startsWith("{")) return null;
  try {
    const lu: unknown = JSON.parse(texte);
    return estObjet(lu) ? lu : null;
  } catch {
    return null;
  }
}

/**
 * Adresse brute en TEXTE, pour les lecteurs qui font `JSON.parse` (carte,
 * coordonnées, formulaire de modification). Un objet est remis en JSON ; un
 * texte reste tel quel ; rien d'autre ne passe.
 */
export function adresseBrute(adresse: unknown): string | null {
  if (adresse === null || adresse === undefined) return null;
  if (typeof adresse === "string") return adresse;
  if (estObjet(adresse)) return JSON.stringify(adresse);
  return null;
}

const champTexte = (o: ObjetAdresse, cle: string): string | null => {
  const v = o[cle];
  if (typeof v === "string") return v.trim() || null;
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return null;
};

/** Adresse lisible, TOUJOURS du texte : « Adresse non disponible » si rien d'utile. */
export function libelleAdresse(adresse: unknown): string {
  const vide = "Adresse non disponible";
  const o = objetAdresse(adresse);
  if (o) {
    const complete = champTexte(o, "formattedAddress");
    if (complete) return complete;
    const parties = [
      champTexte(o, "title"),
      champTexte(o, "address") ?? champTexte(o, "road"),
      champTexte(o, "city"),
      champTexte(o, "postalCode"),
    ].filter((p): p is string => !!p);
    return parties.length > 0 ? parties.join(", ") : vide;
  }
  if (typeof adresse === "string") return adresse.trim() || vide;
  return vide;
}

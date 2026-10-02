/**
 * CANAL D'UNE COMMANDE : application, site, ou saisie par le personnel
 * (« Manuel » : centre d'appels, comptoir, HubRise). Remplace l'ancien
 * « Auto / Manuel », qui rangeait les commandes du site avec celles de
 * l'application. « Manuel » est gardé, choix de l'équipe du 02/10 : une
 * commande saisie à la main n'est pas forcément un appel.
 *
 * Jumeau EXACT de `libelleSource` côté serveur
 * (backend/src/modules/order/helpers/canal-commande.rules.ts), qui écrit la
 * colonne « Source » des exports : l'écran et le fichier Excel doivent dire
 * la même chose. Le test bun compare les deux sur toutes les combinaisons.
 *
 * Le site et le comptoir se lisent sur `channel`. Le reste garde l'ancienne
 * lecture par `auto` : commandes antérieures au canal (`channel` vide),
 * commandes HubRise (créées sans canal, `auto` faux) et commande de
 * l'application reprise au téléphone (`auto` repassé à faux).
 *
 * Une commande du site reprise au téléphone garde `channel = WEB` : la
 * modification ne touche jamais au canal. Elle reste donc « Site web », comme
 * dans les exports et les statistiques, avec la mention « reprise au
 * téléphone » pour l'agent.
 *
 * ⚠️ Sans rapport avec `paymentChannel` (« Appli » / « Restaurant ») : lui dit
 * où se règle la commande, et des règles s'en servent. Ne pas les mélanger.
 */

/** Valeurs de `Order.channel` (enum `OrderChannel` du serveur). */
export type CanalCommande = "APP" | "WEB" | "CALL_CENTER" | "RESTAURANT";

export type LibelleCanal = "Site web" | "Appli" | "Manuel";

/**
 * Ce qu'on lit d'une commande. Tout est optionnel : un serveur plus ancien
 * ne renvoie pas `channel`, et la commande retombe alors sur `auto`.
 */
export interface AvecCanal {
  channel?: CanalCommande | string | null;
  auto?: boolean | null;
}

export function libelleCanal(commande: AvecCanal): LibelleCanal {
  if (commande.channel === "WEB") return "Site web";
  // Le comptoir est aussi une saisie du personnel.
  if (commande.channel === "RESTAURANT") return "Manuel";
  return commande.auto ? "Appli" : "Manuel";
}

/** Commande passée sur le site, reprise au téléphone ou non. */
export function estDuSite(commande: AvecCanal | null | undefined): boolean {
  return commande?.channel === "WEB";
}

/**
 * Mention secondaire, à côté du libellé : seule la commande du site passée au
 * call center en a une. `auto` doit valoir `false` explicitement : absent, on
 * ne sait pas, et on ne dit rien.
 */
export function mentionCanal(commande: AvecCanal): string | null {
  return estDuSite(commande) && commande.auto === false ? "reprise au téléphone" : null;
}

/**
 * Couleurs de la pastille, fond, texte et bordure (la bordure ne s'affiche
 * que là où l'écran pose `border`). Sarcelle pour le site, comme
 * `CHANNEL_COLORS.web` des statistiques. L'application, le cas courant, reste
 * neutre pour que le site ressorte ; « Manuel » garde son ambre d'avant.
 */
export const COULEURS_CANAL: Record<LibelleCanal, string> = {
  "Site web": "bg-teal-100 text-teal-800 border-teal-200",
  Appli: "bg-slate-100 text-slate-700 border-slate-200",
  Manuel: "bg-amber-100 text-amber-800 border-amber-200",
};

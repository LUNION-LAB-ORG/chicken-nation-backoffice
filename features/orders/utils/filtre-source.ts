/**
 * FILTRE « SOURCE » DES COMMANDES : « Toutes les sources », « Par
 * application », « Site web », « Par téléphone » (demande du 19/10 : ajouter
 * « Site web »).
 *
 * Seule traduction du choix de l'écran en paramètres du serveur, partagée par
 * la liste des commandes (Opérations) et les exports.
 *
 * Le serveur lit `source` (site, appli, telephone), qui prime sur `auto`.
 * Règle (backend/src/modules/order/helpers/canal-commande.rules.ts,
 * `conditionSource`), jumelle de `libelleCanal` (canal-commande.ts) :
 *  - « Site web » : commandes du site (channel WEB), `auto` vrai ;
 *  - « Par application » : `auto` vrai hors site, anciennes commandes sans
 *    canal comprises ;
 *  - « Par téléphone » : `auto` faux, commandes du site reprises au téléphone
 *    comprises (affichées « Manuel »).
 *
 * `auto` part aussi, pour un serveur qui ne connaît pas encore `source` : il
 * garde alors l'ancien résultat (« Site web » et « Par application » y
 * rendent les commandes du site et de l'application ensemble).
 */

/** Valeur du filtre dans le magasin du tableau de bord (`orders.filters.source`). */
export type ChoixSource = "" | "auto" | "site" | "mannuel";

/** Valeurs du paramètre `source` du serveur. */
export type SourceServeur = "site" | "appli" | "telephone";

export interface OptionSource {
  id: ChoixSource;
  label: string;
  icon: string;
}

export const OPTIONS_SOURCE: OptionSource[] = [
  { id: "", label: "Toutes les sources", icon: "🌐" },
  { id: "auto", label: "Par application", icon: "📱" },
  { id: "site", label: "Site web", icon: "💻" },
  { id: "mannuel", label: "Par téléphone", icon: "☎️" },
];

export interface ParametresSource {
  auto?: boolean;
  source?: SourceServeur;
}

const PARAMETRES: Record<Exclude<ChoixSource, "">, Required<ParametresSource>> = {
  auto: { auto: true, source: "appli" },
  site: { auto: true, source: "site" },
  mannuel: { auto: false, source: "telephone" },
};

/**
 * Paramètres à envoyer au serveur pour le choix de l'écran. « Toutes les
 * sources » (ou une valeur inconnue) : aucun, le serveur rend tout.
 */
export function parametresSource(choix?: unknown): ParametresSource {
  if (typeof choix !== "string" || !Object.prototype.hasOwnProperty.call(PARAMETRES, choix)) return {};
  return { ...PARAMETRES[choix as keyof typeof PARAMETRES] };
}

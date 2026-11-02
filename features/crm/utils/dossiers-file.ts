import { IContactLigne, IDossierFileServeur, IFileAgent, ISuiviCampagne } from "../types/contact.type";

/**
 * La file de l'agent, RANGÉE PAR CAMPAGNE.
 *
 * L'agent voyait une seule longue liste où les campagnes se mélangeaient : il
 * ne pouvait pas travailler une campagne jusqu'au bout, ni dire où il en
 * était. On en fait des dossiers.
 *
 * ⚠️ Les RAPPELS DUS n'entrent dans aucun dossier. Un client à qui on a promis
 * un appel à 14 h ne doit pas dépendre du dossier que l'agent ouvre ce jour-là :
 * ils restent en tête de l'accueil, toutes campagnes confondues. C'est la
 * seule exception au rangement, et elle est volontaire.
 *
 * ⚠️ Les compteurs portent sur CE QUE L'AGENT A EN MAIN, pas sur la campagne
 * entière. Les statistiques de campagne existent côté serveur et comptent tous
 * les agents : les afficher ici donnerait des nombres qui ne correspondent à
 * aucune des lignes visibles juste en dessous. Seul le dossier de SUIVI, que
 * voit le pilote, parle de toute l'équipe : c'est son objet.
 *
 * ⚠️ DEPUIS LE 02/11, LES NOMBRES VIENNENT DU SERVEUR (`file.dossiers`). Les
 * listes reçues sont coupées à 50 lignes par rubrique : compter ces lignes
 * faisait disparaître une campagne derrière 50 contacts plus récents, et
 * annonçait « 50 au total » pour une file commune de 300. Un dossier charge
 * ses lignes à l'ouverture. Face à un serveur plus ancien (pas de
 * `dossiers`), l'ancien calcul sur les lignes reçues reste en place.
 */

/** Les sections d'un dossier, dans l'ordre où l'agent doit les traiter. */
export interface SectionsDossier {
  interesses: IContactLigne[];
  nouveaux: IContactLigne[];
  relances: IContactLigne[];
  coupons: IContactLigne[];
  rappels_planifies: IContactLigne[];
  /** File commune seulement : appeler prend d'abord le client. */
  commune: IContactLigne[];
}

export type RubriqueDossier = keyof SectionsDossier;

/**
 * « pause » : contacts confiés dans une campagne suspendue (carte grisée, qui
 * ne s'ouvre pas). « suivi » : une campagne que l'utilisateur pilote, vue de
 * toute l'équipe.
 */
export type GenreDossier = "campagne" | "commune" | "sans-campagne" | "pause" | "suivi";

export interface Dossier {
  cle: string;
  nom: string;
  genre: GenreDossier;
  /**
   * Lignes déjà reçues avec l'accueil. Avec les comptes du serveur, elles
   * s'affichent le temps que le dossier charge les siennes.
   */
  sections: SectionsDossier;
  /** Contacts du dossier, toutes sections confondues. */
  total: number;
  jamais_appeles: number;
  a_relancer: number;
  interesses: number;
  /**
   * Vrais nombres par rubrique, comptés par le serveur : le dossier charge
   * alors ses lignes à l'ouverture. Absent : ancien calcul sur les lignes reçues.
   */
  comptes?: Record<RubriqueDossier, number>;
  campaign_id: string | null;
  /** Dossier de suivi du pilote. */
  suivi?: ISuiviCampagne;
}

export const CLE_COMMUNE = "commune";
export const CLE_SANS_CAMPAGNE = "sans-campagne";

export const RUBRIQUES_DOSSIER: RubriqueDossier[] = [
  "commune",
  "interesses",
  "nouveaux",
  "relances",
  "coupons",
  "rappels_planifies",
];

const sectionsVides = (): SectionsDossier => ({
  interesses: [],
  nouveaux: [],
  relances: [],
  coupons: [],
  rappels_planifies: [],
  commune: [],
});

/** Clé et nom du dossier d'une ligne. */
function dossierDe(ligne: IContactLigne): { cle: string; nom: string; genre: GenreDossier } {
  if (ligne.campaign) {
    return { cle: ligne.campaign.id, nom: ligne.campaign.name, genre: "campagne" };
  }
  return { cle: CLE_SANS_CAMPAGNE, nom: "Hors campagne", genre: "sans-campagne" };
}

/** L'ancien calcul : les dossiers et leurs nombres tirés des lignes reçues. */
function dossiersDesLignes(file: IFileAgent): Dossier[] {
  const par = new Map<string, Dossier>();

  const ajouter = (
    ligne: IContactLigne,
    section: RubriqueDossier,
    force?: { cle: string; nom: string; genre: GenreDossier },
  ) => {
    const { cle, nom, genre } = force ?? dossierDe(ligne);
    let dossier = par.get(cle);
    if (!dossier) {
      dossier = {
        cle,
        nom,
        genre,
        sections: sectionsVides(),
        total: 0,
        jamais_appeles: 0,
        a_relancer: 0,
        interesses: 0,
        campaign_id: genre === "campagne" ? cle : null,
      };
      par.set(cle, dossier);
    }
    dossier.sections[section].push(ligne);
    dossier.total += 1;
    if (section === "nouveaux" || section === "commune") dossier.jamais_appeles += 1;
    if (section === "relances") dossier.a_relancer += 1;
    if (section === "interesses") dossier.interesses += 1;
  };

  // ⚠️ `rappels` absent à dessein : il reste à l'accueil (voir l'en-tête).
  for (const l of file.interesses ?? []) ajouter(l, "interesses");
  for (const l of file.nouveaux ?? []) ajouter(l, "nouveaux");
  for (const l of file.relances ?? []) ajouter(l, "relances");
  for (const l of file.coupons ?? []) ajouter(l, "coupons");
  for (const l of file.rappels_planifies ?? []) ajouter(l, "rappels_planifies");

  // La file commune n'appartient à personne et n'a pas de campagne : son
  // propre dossier, quoi que portent les lignes.
  for (const l of file.commune ?? []) {
    ajouter(l, "commune", {
      cle: CLE_COMMUNE,
      nom: "File commune Glovo/Yango",
      genre: "commune",
    });
  }
  return [...par.values()];
}

const GENRES_SERVEUR = new Set<IDossierFileServeur["genre"]>(["campagne", "sans-campagne", "commune", "pause"]);

/** Les dossiers comptés par le serveur, avec les lignes déjà reçues qui leur reviennent. */
function dossiersDuServeur(file: IFileAgent, liste: IDossierFileServeur[]): Dossier[] {
  return liste
    .filter((d) => GENRES_SERVEUR.has(d.genre))
    .map((d) => {
      const sections = sectionsVides();
      if (d.genre === "commune") {
        sections.commune = [...(file.commune ?? [])];
      } else if (d.genre !== "pause") {
        const lesSiennes = (lignes?: IContactLigne[]) => (lignes ?? []).filter((l) => dossierDe(l).cle === d.cle);
        sections.interesses = lesSiennes(file.interesses);
        sections.nouveaux = lesSiennes(file.nouveaux);
        sections.relances = lesSiennes(file.relances);
        sections.coupons = lesSiennes(file.coupons);
        sections.rappels_planifies = lesSiennes(file.rappels_planifies);
      }
      const c = d.comptes;
      return {
        cle: d.cle,
        nom: d.nom,
        genre: d.genre,
        sections,
        total: c.total,
        jamais_appeles: c.jamais_appeles,
        a_relancer: c.a_relancer,
        interesses: c.interesses,
        comptes: {
          interesses: c.interesses,
          nouveaux: c.nouveaux,
          relances: c.relances,
          coupons: c.coupons,
          rappels_planifies: c.rappels_planifies,
          commune: c.commune,
        },
        campaign_id: d.campaign_id,
      };
    });
}

/** Une campagne que l'utilisateur pilote : ses nombres sont ceux de toute l'équipe. */
function dossierDeSuivi(s: ISuiviCampagne): Dossier {
  return {
    cle: `suivi-${s.campaign_id}`,
    nom: s.nom,
    genre: "suivi",
    sections: sectionsVides(),
    total: s.restants,
    jamais_appeles: s.jamais_appeles,
    a_relancer: 0,
    interesses: 0,
    campaign_id: s.campaign_id,
    suivi: s,
  };
}

/*
  Ordre : les campagnes d'abord, par nom, puisque c'est ce qu'on vient
  travailler, puis le suivi de celles qu'on pilote. Puis la file commune, qui
  est périssable (le premier agent qui appelle prend le client) et ne doit pas
  finir en bas de page. « Hors campagne » est le reste. Les campagnes en pause
  ferment la marche : rien à y faire avant la reprise.
*/
const RANG: Record<GenreDossier, number> = { campagne: 0, suivi: 1, commune: 2, "sans-campagne": 3, pause: 4 };

export function dossiersDeLaFile(file: IFileAgent): Dossier[] {
  const dossiers = Array.isArray(file.dossiers) ? dossiersDuServeur(file, file.dossiers) : dossiersDesLignes(file);
  const suivis = (file.suivi ?? []).map(dossierDeSuivi);
  return [...dossiers, ...suivis].sort((a, b) => RANG[a.genre] - RANG[b.genre] || a.nom.localeCompare(b.nom, "fr"));
}

/**
 * Ce que l'accueil annonce sous « Mes dossiers ». La file commune n'est à
 * personne : elle est annoncée à part, sans se mêler à son propre travail.
 */
export function resumeDossiers(dossiers: Dossier[]): { aAppeler: number; commune: number | null } {
  const aAppeler = dossiers
    .filter((d) => d.genre === "campagne" || d.genre === "sans-campagne")
    .reduce((n, d) => n + d.jamais_appeles + d.a_relancer, 0);
  const commune = dossiers.find((d) => d.genre === "commune");
  return { aAppeler, commune: commune ? (commune.comptes?.commune ?? commune.total) : null };
}

/** Rappels dus : le vrai nombre quand le serveur le donne, sinon les lignes reçues. */
export const totalRappels = (file: IFileAgent) => file.comptes?.rappels ?? (file.rappels ?? []).length;

/** Pastille de l'onglet « Ma file » : rappels dus et intéressés qui attendent leur coupon. */
export function pastilleFile(file: IFileAgent): number {
  if (file.comptes) return (file.comptes.rappels ?? 0) + (file.comptes.interesses ?? 0);
  return (file.rappels ?? []).length + (file.interesses ?? []).length;
}

/** Rien à montrer : ni dossier (suivi compris), ni rappel dû. */
export const fileVide = (file: IFileAgent, dossiers: Dossier[]) => dossiers.length === 0 && totalRappels(file) === 0;

/** Pages d'une rubrique mises bout à bout, sans doublon (un contact peut glisser d'une page à l'autre entre deux lectures). */
export function lignesDesPages(pages: { data: IContactLigne[] }[]): IContactLigne[] {
  const vus = new Set<string>();
  const lignes: IContactLigne[] = [];
  for (const page of pages) {
    for (const l of page.data) {
      if (vus.has(l.id)) continue;
      vus.add(l.id);
      lignes.push(l);
    }
  }
  return lignes;
}

/**
 * « Voir les suivants » : faut-il demander la page suivante maintenant ?
 *
 * Jamais d'elle-même après un échec : une page en panne (erreur du serveur,
 * délai dépassé, droit retiré) était sinon redemandée à chaque fin de lecture,
 * deux fois par seconde, sans rien dire. Après un échec, c'est le clic sur
 * « Voir les suivants » qui réessaie.
 */
export function demanderLaSuivante(etat: {
  aDesDonnees: boolean;
  voulues: number;
  chargees: number;
  aUneSuivante: boolean;
  enCours: boolean;
  enEchec: boolean;
}): boolean {
  return etat.aDesDonnees && etat.voulues > etat.chargees && etat.aUneSuivante && !etat.enCours && !etat.enEchec;
}

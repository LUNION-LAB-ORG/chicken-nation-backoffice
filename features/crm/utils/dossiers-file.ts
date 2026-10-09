import { IContactLigne, IFileAgent } from "../types/contact.type";

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
 * aucune des lignes visibles juste en dessous.
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

export type GenreDossier = "campagne" | "commune" | "sans-campagne";

export interface Dossier {
  cle: string;
  nom: string;
  genre: GenreDossier;
  sections: SectionsDossier;
  /** Contacts du dossier, toutes sections confondues. */
  total: number;
  jamais_appeles: number;
  a_relancer: number;
  interesses: number;
}

export const CLE_COMMUNE = "commune";
export const CLE_SANS_CAMPAGNE = "sans-campagne";

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

export function dossiersDeLaFile(file: IFileAgent): Dossier[] {
  const par = new Map<string, Dossier>();

  const ajouter = (
    ligne: IContactLigne,
    section: keyof SectionsDossier,
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

  /*
    Ordre : les campagnes d'abord, par nom, puisque c'est ce qu'on vient
    travailler. Puis la file commune, qui est périssable (le premier agent qui
    appelle prend le client) et ne doit pas finir en bas de page. « Hors
    campagne » ferme la marche : c'est le reste.
  */
  const rang = (g: GenreDossier) => (g === "campagne" ? 0 : g === "commune" ? 1 : 2);

  return [...par.values()].sort(
    (a, b) => rang(a.genre) - rang(b.genre) || a.nom.localeCompare(b.nom, "fr"),
  );
}

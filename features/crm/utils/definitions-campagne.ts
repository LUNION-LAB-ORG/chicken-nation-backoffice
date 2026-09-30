import { ContactStatut, Public } from "../types/contact.type";
import { estCapte, vocabulaire } from "./crm-ui";

/**
 * Définitions des indicateurs du tableau de bord d'une campagne, lues dans
 * les info-bulles. Chaque texte a été vérifié contre le calcul du serveur
 * (crm-campaign-stats.service.ts, règles et registre du CRM) et contre les
 * chiffres d'une campagne réelle : ne pas en changer le sens sans relire le
 * calcul.
 */

/** Paragraphe d'une définition : une phrase seule, ou un terme (en gras) suivi de sa définition. */
export type Paragraphe = string | { terme: string; texte: string };
export type Definition = string | readonly Paragraphe[];

// Cartes du haut ; les mêmes textes servent au comparatif.
const CARTE = {
  cibles:
    "Contacts entrés dans la campagne à son lancement. Ce nombre ne bouge plus, même quand un contact commande ou sort de la campagne.",
  restants:
    "Ciblés encore à travailler que personne n'a appelés dans la campagne. Après la clôture, c'est le nombre du dernier jour.",
  ecartRestants:
    "Ne pas confondre avec le statut « À appeler » : ce nombre compte les ciblés jamais appelés dans la campagne, même ceux déjà intéressés ou qui ont déjà un coupon.",
  traites:
    "Ciblés appelés au moins une fois dans la campagne, qu'ils aient répondu ou non. Un coupon envoyé sans appel ne compte pas.",
  couverture: "Part des ciblés déjà appelés : traités divisés par ciblés.",
  joints:
    "Traités qui ont décroché au moins une fois dans la campagne. Un refus compte. Un appel sans réponse ou un numéro faux ne compte pas.",
  tauxContact: "Part des contacts appelés qui ont décroché : joints divisés par traités.",
  objectifJoints: "Nombre de contacts à joindre fixé pour la campagne. Le pourcentage montre la part déjà atteinte.",
  tauxVentes: "Part des ciblés qui ont commandé : ventes divisées par ciblés.",
  objectifTaux:
    "Taux visé pour la campagne, sur la même base : ventes divisées par ciblés. La carte reste rouge tant qu'il n'est pas atteint.",
  coupons:
    "Coupons utilisés sur une commande ni annulée ni supprimée, sur coupons créés dans la campagne. Un renvoi du même code ne compte pas deux fois. Un coupon utilisé après la clôture compte encore.",
  tauxUtilisation: "Part des coupons envoyés qui ont servi : utilisés divisés par envoyés.",
  montantCoupons: "Montant total des commandes payées avec ces coupons, pas le montant de la remise.",
  ca: "Montant des commandes comptées comme ventes, remise déduite, taxe et livraison comprises, tel qu'il était le jour de la vente. Seule la première commande de chaque client compte.",
  panierMoyen: "Chiffre d'affaires divisé par le nombre de ventes.",
  appels: "Tous les appels notés dans la campagne, avec ou sans réponse.",
  appelsParTraite: "Nombre moyen d'appels par contact traité.",
  duree:
    "Temps écoulé depuis le lancement, suspensions comprises, jusqu'à la clôture ou jusqu'à aujourd'hui.",
  dureePrevue:
    "Jours prévus de la date de début à la date de fin, les deux comprises. La carte passe au rouge si la campagne dure plus longtemps.",
} as const;

/** Ce qu'est une vente, au mot de chaque public. */
const VENTES = {
  captes:
    "Ciblés qui ont commandé en direct, sur l'appli avec leur numéro ou avec leur coupon, qu'ils aient été appelés ou non. Seule la première commande compte. Une commande annulée ou supprimée est retirée.",
  inscrits:
    "Inscrits ciblés qui ont passé leur première commande, avec leur compte ou avec leur coupon. Une commande annulée ou supprimée est retirée.",
  inactifs:
    "Clients inactifs ciblés qui ont recommandé, avec leur compte ou avec leur coupon. Seule la première commande compte.",
  tous: "Ciblés qui ont commandé, tous publics confondus. Chaque client compte une fois.",
} as const;

/** Quand une commande devient une vente de la campagne : vaut pour les cartes, la liste des ventes et les colonnes Ventes. */
const REGLE_VENTE =
  "Une commande devient une vente de la campagne quand un ciblé commande pendant qu'il est dans la campagne, ou avec un coupon reçu dans la campagne, même après la clôture. Seule sa première commande compte. La vente revient à l'agent à qui le contact est confié à ce moment. Elle sort des chiffres si la commande est annulée ou supprimée.";

/** Même choix que `vocabulaire()` : le texte du public seul (ou de Glovo + Yango), sinon le texte commun. */
function texteVentes(publics?: Public[]): string {
  if (!publics || publics.length === 0) return VENTES.tous;
  if (publics.every(estCapte)) return VENTES.captes;
  if (publics.length === 1) return publics[0] === "INACTIF" ? VENTES.inactifs : VENTES.inscrits;
  return VENTES.tous;
}

const si = <T,>(condition: boolean, ...elements: T[]): T[] => (condition ? elements : []);

// Cartes du tableau de bord

export const definitionCibles = (close: boolean): Definition => [
  { terme: "Ciblés", texte: CARTE.cibles },
  { terme: close ? "Jamais appelés à la clôture" : "Restants à appeler", texte: CARTE.restants },
  CARTE.ecartRestants,
];

export const definitionTraites = (): Definition => [
  { terme: "Traités", texte: CARTE.traites },
  { terme: "Couverture", texte: CARTE.couverture },
];

export const definitionJoints = (avecObjectif: boolean): Definition => [
  { terme: "Joints", texte: CARTE.joints },
  { terme: "Taux de contact", texte: CARTE.tauxContact },
  ...si(avecObjectif, { terme: "Objectif", texte: CARTE.objectifJoints }),
];

/** Carte des ventes, au vocabulaire des publics de la campagne. */
export function definitionVentes(publics: Public[] | undefined, avecObjectif: boolean): Definition {
  const mots = vocabulaire(publics);
  return [
    { terme: mots.conversion, texte: texteVentes(publics) },
    { terme: mots.taux, texte: CARTE.tauxVentes },
    ...si(avecObjectif, { terme: "Objectif", texte: CARTE.objectifTaux }),
    { terme: "Quand une commande compte", texte: REGLE_VENTE },
  ];
}

export const definitionCoupons = (avecMontant: boolean): Definition => [
  { terme: "Coupons utilisés / envoyés", texte: CARTE.coupons },
  { terme: "Pourcentage", texte: CARTE.tauxUtilisation },
  ...si(avecMontant, { terme: "Commandes avec coupon", texte: CARTE.montantCoupons }),
];

export const definitionCa = (): Definition => [
  { terme: "Chiffre d'affaires", texte: CARTE.ca },
  { terme: "Panier moyen", texte: CARTE.panierMoyen },
];

export const definitionAppels = (): Definition => [
  { terme: "Appels passés", texte: CARTE.appels },
  { terme: "Par contact traité", texte: CARTE.appelsParTraite },
];

export const definitionDuree = (avecFinPrevue: boolean): Definition => [
  { terme: "Durée", texte: CARTE.duree },
  ...si(avecFinPrevue, { terme: "Jours prévus", texte: CARTE.dureePrevue }),
];

// En-tête : publics visés

export const DEF_PUBLICS_VISES: Definition =
  "Critères, offre et objectifs de chaque public, et nombre de contacts entrés au lancement.";

// Tableau « Par public »

export const DEF_PUBLIC = {
  bloc: "Chiffres de chaque public visé. Un contact reste dans le public qu'il avait au lancement.",
  cibles: [
    { terme: "Ciblés", texte: "Contacts de ce public entrés dans la campagne au lancement." },
    {
      terme: "Jamais appelés",
      texte:
        "Contacts de ce public encore à travailler que personne n'a appelés dans la campagne. Ceux qui ont commandé sans être appelés n'y figurent plus.",
    },
  ],
  traites:
    "Contacts de ce public appelés au moins une fois dans la campagne. En dessous, leur part parmi les ciblés du public.",
  joints:
    "Contacts de ce public qui ont décroché au moins une fois. En dessous, l'objectif de joints du public s'il en a un, sinon la part des traités qui ont décroché.",
  coupons:
    "Coupons utilisés sur coupons envoyés pour ce public dans la campagne. En dessous, le montant des commandes passées avec.",
  ventes:
    "Contacts de ce public dont une commande compte pour la campagne. En dessous, leur part parmi les ciblés du public, et l'objectif du public s'il en a un.",
  ca: "Montant des ventes de ce public, une commande par client. En dessous, le panier moyen.",
  inscritsAppli:
    "Ciblés Glovo ou Yango qui ont créé leur compte sur l'appli entre le lancement et la clôture, qu'ils aient commandé ou non.",
} satisfies Record<string, Definition>;

// Liste « Clients qui ont commandé »

export const DEF_VENTES = {
  liste: [
    { terme: "Clients qui ont commandé", texte: "Chaque vente comptée dans les cartes, de la plus récente à la plus ancienne." },
    { terme: "Quand une commande compte", texte: REGLE_VENTE },
    {
      terme: "Autres commandes",
      texte:
        "Autres commandes du même client entre le lancement et la clôture. Elles ne s'ajoutent pas au chiffre d'affaires de la campagne.",
    },
  ],
  agent: "Agent à qui le contact était confié au moment de la vente, qu'il l'ait appelé ou non.",
  montant:
    "Montant compté pour la campagne, relevé le jour de la vente. En dessous, le montant actuel si la commande a été modifiée depuis.",
  coupon: "Coupon utilisé sur la commande. « coupon hors campagne » : il n'a pas été envoyé dans cette campagne.",
  delai: "Temps entre l'entrée du contact dans la campagne et sa commande. En dessous, le temps depuis son entrée au CRM.",
} satisfies Record<string, Definition>;

// Rythme quotidien

/** Chaque série de la légende ; l'objectif n'est tracé que s'il a été fixé. */
export const definitionRythme = (avecObjectif: boolean): Definition => [
  {
    terme: "Traités du jour",
    texte: "Contacts appelés pour la première fois dans la campagne ce jour-là. Un contact rappelé plus tard ne compte pas une seconde fois.",
  },
  { terme: "Joints du jour", texte: "Contacts qui ont décroché pour la première fois dans la campagne ce jour-là." },
  { terme: "Ventes du jour", texte: "Ventes de la campagne, placées au jour de la commande." },
  { terme: "Joints cumulés", texte: "Total des contacts joints depuis le lancement, jour après jour." },
  ...si(
    avecObjectif,
    { terme: "Objectif par jour", texte: "Objectif de contacts à joindre divisé par les jours prévus, du lancement à la date de fin." },
    {
      terme: "Objectif cumulé de joints",
      texte: "Nombre de contacts qu'il faudrait avoir joints à cette date pour tenir l'objectif à un rythme régulier.",
    },
  ),
  { terme: "Jours", texte: "Chaque jour va de minuit à minuit, heure d'Abidjan, du lancement à la clôture ou à aujourd'hui." },
];

// Raisons et statuts

export const DEF_RAISONS: Definition =
  "Pour chaque contact qui a refusé pendant la campagne, la raison notée lors de son dernier refus.";

/** Bloc « Où en sont les contacts » : ce que montre le statut, et l'écart avec la carte Ciblés. */
export const definitionStatuts = (figes: boolean, close: boolean): Definition => [
  figes
    ? {
        terme: "Chiffres figés à la clôture",
        texte: "Statuts relevés le jour de la clôture. Ce que les contacts font ensuite ne change plus ce bloc.",
      }
    : { terme: "Statut actuel des ciblés", texte: "Statut actuel de chaque ciblé, avec ce qui avait été fait avant la campagne." },
  { terme: `${close ? "Jamais appelés à la clôture" : "Restants à appeler"} (carte Ciblés)`, texte: CARTE.ecartRestants },
];

/** Chaque statut ; « Converti » vaut aussi pour « A commandé en direct » et « Reconquis ». */
export const DEF_STATUT: Record<ContactStatut, string> = {
  A_APPELER: "Contacts à appeler : jamais appelés, ou appelés sans réponse jusqu'ici.",
  A_RAPPELER: "Contacts joints qui ont demandé à être rappelés.",
  INTERESSE:
    "Contacts qui se sont dits intéressés, pendant ou avant la campagne, et qui n'ont pas encore reçu de coupon.",
  COUPON_ENVOYE:
    "Contacts qui ont reçu un coupon, pendant ou avant la campagne, et n'ont pas encore commandé. Le statut reste même si le coupon a expiré.",
  NON_INTERESSE: "Contacts joints qui ont dit ne pas vouloir commander.",
  INJOIGNABLE: "Numéro faux, ou trop d'appels restés sans réponse, en comptant ceux d'avant la campagne.",
  CONVERTI: "Ciblés qui ont commandé. Ils sortent de la liste d'appel, même si la commande est annulée ensuite.",
};

// Performance par agent

export const definitionAgents = (plusieursPublics: boolean): Definition => [
  {
    terme: "Agents affichés",
    texte: "Agents de l'équipe, et toute personne qui a appelé, envoyé un coupon ou reçu une vente dans cette campagne.",
  },
  { terme: "Classement", texte: "Classement par nombre de ventes, puis par contacts traités." },
  ...si(plusieursPublics, {
    terme: "Pastilles sous le nom",
    texte: "Ventes de l'agent par public. Au survol, contacts confiés et chiffre d'affaires de ce public.",
  }),
];

export const DEF_AGENT = {
  confies:
    "Contacts de la campagne que l'agent détient aujourd'hui, ou détenait quand ils en sont sortis. Un contact réaffecté compte pour son nouvel agent.",
  traites: "Contacts que l'agent a appelés lui-même au moins une fois dans la campagne, même sans réponse.",
  joints: "Contacts qui ont décroché lors d'un appel de l'agent. Entre parenthèses, leur part parmi ses contacts traités.",
  coupons: "Coupons envoyés par l'agent dans la campagne, utilisés ou non. Un renvoi du même code ne compte pas.",
  ventes: "Ventes des contacts confiés à l'agent au moment de la vente, qu'il les ait appelés ou non.",
  taux: "Part des contacts confiés à l'agent qui ont commandé : ventes divisées par confiés.",
  ca: "Montant des ventes comptées pour l'agent, une commande par client.",
  sansAgent: "Ventes sans agent : contacts qui n'étaient confiés à personne au moment de la vente.",
} satisfies Record<string, Definition>;

// Comparatif des campagnes

/** Périmètre, graphique et colonnes du comparatif ; avec un public choisi, les objectifs sont ceux du public. */
export function definitionsComparatif(segment?: Public) {
  const publics = segment ? [segment] : undefined;
  const mots = vocabulaire(publics);
  const porteeObjectif = segment ? "ce public" : "la campagne";
  return {
    perimetre: [
      "Toutes les campagnes lancées, dans l'ordre de lancement. Avec un public choisi, chaque ligne ne montre que ce public.",
      "Mêmes chiffres que le tableau de bord de chaque campagne.",
      "Objectifs : ceux de la campagne avec « Tous les publics », ceux du public choisi sinon.",
    ],
    graphe: "Pour chaque campagne, la part des ciblés appelés et la part des ciblés qui ont commandé.",
    cibles: CARTE.cibles,
    couverture: CARTE.couverture,
    tauxContact: CARTE.tauxContact,
    joints: [
      { terme: "Joints", texte: CARTE.joints },
      {
        terme: "Objectif",
        texte: `Nombre de contacts à joindre fixé pour ${porteeObjectif}. Le pourcentage montre la part déjà atteinte.`,
      },
    ],
    coupons: CARTE.coupons,
    ventes: [
      { terme: mots.conversion, texte: texteVentes(publics) },
      { terme: mots.taux, texte: CARTE.tauxVentes },
      {
        terme: "Objectif",
        texte: `Taux visé pour ${porteeObjectif}, sur la même base : ventes divisées par ciblés. En rouge tant qu'il n'est pas atteint.`,
      },
    ],
    ca: CARTE.ca,
    duree: "Jours écoulés depuis le lancement, sur les jours prévus.",
  } satisfies Record<string, Definition>;
}

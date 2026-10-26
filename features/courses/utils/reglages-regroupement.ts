/**
 * PARAMÈTRES > LIVRAISON, section « Regroupement des commandes » (conception
 * 6.1, planificateur v2 des demandes du 22/10).
 *
 * Chaque réglage porte la règle de lecture du serveur, recopiée de son code,
 * pour que l'écran dise ce que le serveur fera de la valeur :
 *  - `planificateur`, `direction`, `preparation`, `plafond`, `livreur` : 0
 *    permis là où il a un sens, bornes du serveur (`planification.rules.ts`,
 *    `direction.rules.ts`, `preparation.rules.ts`,
 *    `compteur-appels-google.service.ts`, `deliverer-scoring-settings.helper.ts`) ;
 *  - `ancienne` : le `toNumber` historique du module course, qui refuse 0 et
 *    toute valeur négative et applique alors le défaut sans prévenir
 *    (`course-settings.helper.ts`).
 *
 * Une valeur que le serveur refuserait n'est pas enregistrée (message sous le
 * champ) ; une valeur déjà en base que le serveur refuse est signalée, avec
 * la valeur qu'il applique à la place.
 */

export type Lecture = 'planificateur' | 'direction' | 'preparation' | 'plafond' | 'livreur' | 'ancienne';

export type TypeReglage = 'nombre' | 'oui_non';

export interface DefinitionReglage {
  cle: string;
  /** Libellé sans unité (« Attente maximale d'une commande prête »). */
  libelle: string;
  /** Unité affichée entre parenthèses (« secondes », « minutes », « mètres »…). */
  unite?: string;
  /** Phrase d'aide, courte. */
  aide?: string;
  type: TypeReglage;
  /** Valeur appliquée par le serveur quand la clé est absente. */
  defaut: string;
  lecture: Lecture;
  min?: number;
  max?: number;
  /** Nombre entier exigé. */
  entier?: boolean;
  /** Pas de saisie. */
  pas?: string;
  /**
   * Le serveur le lit aussi avec l'ancienne méthode (relecture du 23/10) :
   * repéré à l'écran quand l'ancienne méthode est choisie.
   */
  aussiAncienne?: boolean;
}

export interface GroupeReglages {
  titre: string;
  description: string;
  reglages: DefinitionReglage[];
}

// ============================================================
// MÉTHODE ET RESTAURANTS
// ============================================================

/**
 * Aide du plafond Google (`maps.plafond_appels_jour`) : ce qu'il coupe
 * vraiment au serveur. Testé contre les sources du serveur
 * (`reglages-regroupement.test.ts`) : les frais de livraison sont sortis du
 * plafond (serveur 8ec6b0c), la phrase ne doit plus les nommer.
 */
export const TEXTE_PLAFOND_GOOGLE =
  "Tracés, détours et temps de trajet du regroupement des commandes, et temps de trajet des livreurs pour choisir à qui proposer une course. Au-delà, jusqu'à minuit, l'un et l'autre continuent à vol d'oiseau. 0 : aucun de ces appels.";

/** Repère des réglages que l'ancienne méthode lit aussi. */
export const TEXTE_AUSSI_ANCIENNE = "Aussi pour l'ancienne méthode";

/**
 * Note affichée quand l'ancienne méthode est choisie. Relecture du 23/10 :
 * elle disait que seules les limites « de la nouvelle » étaient concernées,
 * alors que la bascule vers Turbo, le classement et la mise hors service
 * des livreurs, le plafond Google et les alertes servent aussi à l'ancienne.
 */
export const TEXTE_ANCIENNE_METHODE_CHOISIE = `Ancienne méthode choisie : seuls les réglages marqués « ${TEXTE_AUSSI_ANCIENNE} » servent encore, avec ceux de l'ancienne méthode plus bas. Les courses en cours se terminent normalement.`;

export const CLE_METHODE = 'course.planificateur';
export const CLE_RESTAURANTS = 'course.planificateur_restaurants';

export type Methode = 'v1' | 'v2';

export const METHODES: { valeur: Methode; libelle: string; description: string }[] = [
  {
    valeur: 'v2',
    libelle: 'Nouvelle',
    description:
      "La course part dès qu'une commande est prête et reçoit les commandes de la même direction. Elle attend au restaurant une commande presque prête, ou plus longtemps quand le trajet est long, dans les limites ci-dessous.",
  },
  {
    valeur: 'v1',
    libelle: 'Ancienne',
    description: 'Les commandes prêtes attendent dans un lot de 2 à 3 minutes avant de partir ensemble.',
  },
];

/** Méthode appliquée par le serveur : `v2` par défaut, `v1` ou `1` pour l'ancienne. */
export function lireMethode(brut: string | null | undefined): { methode: Methode; refusee: boolean } {
  if (brut === undefined || brut === null || brut.trim() === '') return { methode: 'v2', refusee: false };
  const v = brut.trim().toLowerCase();
  if (v === 'v1' || v === '1') return { methode: 'v1', refusee: false };
  if (v === 'v2' || v === '2') return { methode: 'v2', refusee: false };
  return { methode: 'v2', refusee: true };
}

/**
 * Restaurants passés à la nouvelle méthode : identifiants séparés par des
 * virgules, espaces ou points-virgules, ou tableau JSON ; vide = tous.
 */
export function lireRestaurants(brut: string | null | undefined): { ids: string[]; refusee: boolean } {
  const texte = (brut ?? '').trim();
  if (!texte) return { ids: [], refusee: false };
  if (texte.startsWith('[')) {
    try {
      const tableau: unknown = JSON.parse(texte);
      if (Array.isArray(tableau) && tableau.every((x) => typeof x === 'string')) {
        return { ids: tableau.map((x) => x.trim()).filter(Boolean), refusee: false };
      }
    } catch {
      // illisible : refusé ci-dessous
    }
    return { ids: [], refusee: true };
  }
  return { ids: texte.split(/[\s,;]+/).filter(Boolean), refusee: false };
}

/** Valeur enregistrée : identifiants triés, séparés par des virgules, sans doublon ; vide = tous. */
export function ecrireRestaurants(ids: readonly string[]): string {
  return Array.from(new Set(ids.map((x) => x.trim()).filter(Boolean)))
    .sort()
    .join(',');
}

/** « Tous les restaurants », « 1 restaurant », « 3 restaurants ». */
export function resumeRestaurants(ids: readonly string[]): string {
  if (ids.length === 0) return 'Tous les restaurants';
  return `${ids.length} restaurant${ids.length > 1 ? 's' : ''}`;
}

// ============================================================
// RÉGLAGES DE LA NOUVELLE MÉTHODE (et communs)
// ============================================================

const minutes = 'minutes';
const secondes = 'secondes';
const metres = 'mètres';

export const GROUPES_NOUVELLE_METHODE: GroupeReglages[] = [
  {
    titre: 'Attente au restaurant',
    description:
      "Une commande prête peut attendre une commande de la même direction encore en préparation, jamais au-delà de ces limites. La commande attendue est ajoutée dès qu'elle est prête. Si le livreur ne peut pas livrer et revenir à temps pour elle, le trajet est long et l'attente peut durer plus.",
    reglages: [
      {
        cle: 'course.attente_max_commande_prete_s',
        libelle: "Attente maximale d'une commande prête",
        unite: secondes,
        aide: "Attente courte, quand le trajet n'est pas long. 0 : une commande prête n'attend plus que pour un trajet long.",
        type: 'nombre',
        defaut: '300',
        lecture: 'planificateur',
        min: 0,
        max: 3600,
        pas: '10',
      },
      {
        cle: 'course.horizon_preparation_s',
        libelle: 'Attendre une commande en préparation si elle est prête dans moins de',
        unite: secondes,
        aide: "Attente courte, quand le trajet n'est pas long. 0 : une commande en préparation n'est plus attendue que pour un trajet long.",
        type: 'nombre',
        defaut: '420',
        lecture: 'planificateur',
        min: 0,
        max: 3600,
        pas: '10',
      },
      // Demande du 24/10 : une commande prête attend plus longtemps quand le
      // livreur reviendrait trop tard s'il partait livrer tout de suite.
      {
        cle: 'course.petit_retard_retour_min',
        libelle: 'Petit retard toléré au retour du livreur',
        unite: minutes,
        aide: "Le trajet est court si le livreur peut livrer et revenir avant que la commande attendue soit prête, à ce retard près : l'attente maximale d'une commande prête s'applique. Sinon le trajet est long. 0 : aucun retard toléré.",
        type: 'nombre',
        defaut: '5',
        lecture: 'planificateur',
        min: 0,
        max: 120,
      },
      {
        cle: 'course.attente_max_trajet_long_s',
        libelle: 'Attente maximale quand le trajet est long',
        unite: secondes,
        aide: "Trajet long : la commande prête attend que la commande attendue soit prête, sans dépasser ce délai ni le retard toléré sur la promesse. 0 : jamais, seule l'attente courte reste.",
        type: 'nombre',
        defaut: '1200',
        lecture: 'planificateur',
        min: 0,
        max: 3600,
        pas: '60',
      },
      {
        cle: 'course.retenue_meme_si_livreur_libre',
        libelle: 'Attendre même si un autre livreur est libre',
        aide: "Non : la course n'attend pas si un autre livreur peut prendre la commande à temps.",
        type: 'oui_non',
        defaut: '0',
        lecture: 'planificateur',
      },
    ],
  },
  {
    titre: 'Taille et durée des courses',
    description: 'Aucun ajout ni regroupement ne dépasse ces limites.',
    reglages: [
      {
        cle: 'course.max_orders_per_course',
        libelle: 'Nombre maximal de commandes par course',
        type: 'nombre',
        defaut: '3',
        lecture: 'planificateur',
        min: 1,
        max: 10,
        entier: true,
        aussiAncienne: true,
      },
      {
        cle: 'course.max_route_duration_min',
        libelle: "Durée maximale d'une tournée",
        unite: minutes,
        aide: 'Du restaurant au dernier client, arrêts compris.',
        type: 'nombre',
        defaut: '25',
        lecture: 'planificateur',
        min: 1,
        max: 240,
      },
      {
        cle: 'course.promesse_client_min',
        libelle: 'Délai promis au client',
        unite: minutes,
        aide: 'Compté depuis la commande.',
        type: 'nombre',
        defaut: '35',
        lecture: 'planificateur',
        min: 1,
        max: 240,
      },
      {
        cle: 'course.retard_max_client_min',
        libelle: 'Retard toléré sur la promesse',
        unite: minutes,
        aide: '0 : aucun retard toléré.',
        type: 'nombre',
        defaut: '5',
        lecture: 'planificateur',
        min: 0,
        max: 120,
      },
      {
        cle: 'course.detour_max_ajout_min',
        libelle: 'Retard maximal imposé par un ajout',
        unite: minutes,
        aide: 'Un ajout ne retarde pas un client déjà prévu de plus que cette durée.',
        type: 'nombre',
        defaut: '8',
        lecture: 'planificateur',
        min: 0,
        max: 120,
      },
    ],
  },
  {
    titre: 'Même direction',
    description:
      "Deux clients vont dans la même direction si l'un est sur le trajet de l'autre ou s'ils sont dans la même zone. Jamais deux sens opposés.",
    reglages: [
      {
        cle: 'course.direction_couloir_m',
        libelle: 'Largeur du couloir le long du trajet',
        unite: metres,
        aide: '0 : jamais « sur le trajet ».',
        type: 'nombre',
        defaut: '600',
        lecture: 'direction',
        min: 0,
        pas: '50',
      },
      {
        cle: 'course.direction_zone_rayon_m',
        libelle: "Rayon d'une même zone",
        unite: metres,
        aide: '0 : jamais « même zone ».',
        type: 'nombre',
        defaut: '800',
        lecture: 'direction',
        min: 0,
        pas: '50',
      },
      {
        cle: 'course.direction_angle_max_deg',
        libelle: "Écart d'angle sans carte",
        unite: 'degrés',
        aide: 'Sert quand les trajets Google ne répondent pas.',
        type: 'nombre',
        defaut: '35',
        lecture: 'direction',
        min: 0,
        max: 180,
      },
      {
        cle: 'course.direction_detour_max_min',
        libelle: 'Détour maximal',
        unite: minutes,
        type: 'nombre',
        defaut: '6',
        lecture: 'direction',
        min: 0,
      },
      {
        cle: 'course.direction_detour_max_pct',
        libelle: 'Détour maximal, en part du trajet direct',
        unite: 'pour cent',
        type: 'nombre',
        defaut: '40',
        lecture: 'direction',
        min: 0,
      },
      {
        cle: 'course.direction_google',
        libelle: 'Utiliser les trajets Google',
        aide: 'Non : la direction se juge sans carte (angle et distance).',
        type: 'oui_non',
        defaut: '1',
        lecture: 'direction',
      },
    ],
  },
  {
    titre: 'Ajout après le retrait',
    description:
      "Un livreur qui a récupéré sa course mais est encore au restaurant reçoit une commande prête de la même direction, remise avec le même code. Seulement avec la nouvelle version de l'appli livreur.",
    reglages: [
      {
        cle: 'course.ajout_apres_retrait',
        libelle: 'Ajouter à un livreur encore au restaurant après le retrait',
        type: 'oui_non',
        defaut: '1',
        lecture: 'planificateur',
      },
      {
        cle: 'course.ajout_apres_retrait_max_s',
        libelle: 'Pendant',
        unite: secondes,
        aide: "Au-delà, la course est réputée partie. 0 : jamais d'ajout après le retrait.",
        type: 'nombre',
        defaut: '240',
        lecture: 'planificateur',
        min: 0,
        max: 3600,
        pas: '10',
      },
      {
        cle: 'course.depart_rayon_m',
        libelle: 'Rayon de départ du restaurant',
        unite: metres,
        aide: "Une position du livreur plus loin après le retrait veut dire qu'il est parti.",
        type: 'nombre',
        defaut: '250',
        lecture: 'planificateur',
        min: 1,
        max: 5000,
        pas: '10',
      },
    ],
  },
  {
    titre: 'Livreurs',
    description: 'Comment le serveur sait où est un livreur et lequel prévenir en premier.',
    reglages: [
      {
        cle: 'deliverer.au_restaurant_rayon_m',
        libelle: 'Livreur considéré au restaurant à moins de',
        unite: metres,
        type: 'nombre',
        defaut: '200',
        lecture: 'planificateur',
        min: 1,
        max: 5000,
        pas: '10',
      },
      {
        cle: 'deliverer.au_restaurant_fraicheur_min',
        libelle: 'Si sa position date de moins de',
        unite: minutes,
        aide: "Un livreur qui attend téléphone verrouillé n'envoie plus sa position.",
        type: 'nombre',
        defaut: '15',
        lecture: 'planificateur',
        min: 1,
        max: 240,
      },
      {
        cle: 'course.vitesse_moyenne_kmh',
        libelle: "Vitesse moyenne d'un livreur",
        unite: 'km/h',
        type: 'nombre',
        defaut: '22',
        lecture: 'planificateur',
        min: 1,
        max: 120,
      },
      {
        cle: 'course.vitesse_pointe_kmh',
        libelle: 'Vitesse aux heures de pointe',
        unite: 'km/h',
        aide: 'De 11 h 30 à 14 h 30 et de 18 h 30 à 22 h.',
        type: 'nombre',
        defaut: '16',
        lecture: 'planificateur',
        min: 1,
        max: 120,
      },
      // Seconde relecture du 23/10 : lus par le serveur (planification.rules.ts), absents de l'écran.
      {
        cle: 'deliverer.eta_par_defaut_min',
        libelle: "Temps supposé jusqu'au restaurant d'un livreur sans position récente",
        unite: minutes,
        type: 'nombre',
        defaut: '8',
        lecture: 'planificateur',
        min: 1,
        max: 120,
      },
      {
        cle: 'course.trajet_sans_coordonnees_min',
        libelle: "Trajet supposé vers une adresse sans position",
        unite: minutes,
        aide: "Sert à l'urgence de la commande et au retour estimé de son livreur.",
        type: 'nombre',
        defaut: '12',
        lecture: 'planificateur',
        min: 1,
        max: 120,
      },
      {
        cle: 'deliverer.travel_time_ranking',
        libelle: 'Classer les livreurs par temps de trajet réel',
        aide: "Oui : temps de trajet Google jusqu'au restaurant. Non : distance à vol d'oiseau.",
        type: 'oui_non',
        defaut: '0',
        lecture: 'livreur',
        aussiAncienne: true,
      },
      {
        cle: 'deliverer.hors_service_sans_signal_min',
        libelle: 'Mettre hors service un livreur qui ignore une offre sans donner signe de vie depuis',
        unite: minutes,
        aide: '0 : jamais.',
        type: 'nombre',
        defaut: '20',
        lecture: 'livreur',
        min: 0,
        aussiAncienne: true,
      },
      // Demande du 24/10 : appli fermée (glissée hors de la liste des applis) = plus d'offre.
      // Depuis le 25/10, le même délai vaut pour une connexion coupée (même effet, autre mot).
      {
        cle: 'deliverer.appli_fermee_apres_s',
        libelle: 'Appli considérée fermée après',
        unite: secondes,
        // En arrière-plan, l'appli envoie sa position environ une fois par minute, et chaque
        // position est notée au serveur : à 120 s, une seule position perdue suffirait.
        aide: "Ni connexion ni signal de son appli depuis ce délai : plus d'offre pour ce livreur, sans pause ni pénalité, jusqu'à son retour (appli fermée ou connexion coupée). En arrière-plan, l'appli envoie sa position environ une fois par minute : 180 conseillé. 0 : jamais.",
        type: 'nombre',
        defaut: '180',
        lecture: 'livreur',
        min: 0,
        aussiAncienne: true,
      },
    ],
  },
  {
    titre: 'Préparation en cuisine',
    description:
      "Quand la cuisine ne donne pas de durée et qu'il n'y a pas assez de mesures pour le restaurant.",
    reglages: [
      {
        cle: 'preparation.duree_defaut_min',
        libelle: 'Durée de préparation par défaut',
        unite: minutes,
        aide: 'Affichée comme « prête vers ».',
        type: 'nombre',
        defaut: '12',
        lecture: 'preparation',
        min: 0,
        max: 180,
      },
      {
        cle: 'preparation.duree_p80_min',
        libelle: 'Durée de préparation prudente',
        unite: minutes,
        aide: "8 commandes sur 10 sont prêtes avant. Sert à décider d'attendre.",
        type: 'nombre',
        defaut: '18',
        lecture: 'preparation',
        min: 0,
        max: 180,
      },
    ],
  },
  {
    titre: 'Turbo, alertes et Google',
    description:
      "Turbo reste le dernier recours quand aucun livreur interne n'est libre. Le restaurant et le siège sont prévenus quand une course attend ou traîne.",
    reglages: [
      {
        cle: 'course.turbo_fallback_enabled',
        libelle: 'Confier à Turbo une course sans livreur',
        type: 'oui_non',
        defaut: '1',
        lecture: 'planificateur',
        aussiAncienne: true,
      },
      {
        cle: 'course.turbo_fallback_after_min_v2',
        libelle: 'Bascule vers Turbo après',
        unite: 'minutes, depuis la commande prête',
        type: 'nombre',
        defaut: '6',
        lecture: 'planificateur',
        min: 0,
        max: 240,
      },
      {
        cle: 'course.turbo_attente_retour_max_min',
        libelle: 'Avant Turbo, attendre un livreur qui revient au restaurant, au plus',
        unite: minutes,
        aide: "Seulement si les clients sont encore livrés à temps avec lui. 0 : Turbo n'attend jamais.",
        type: 'nombre',
        defaut: '4',
        lecture: 'planificateur',
        min: 0,
        max: 30,
      },
      // Réglages déjà lus par le serveur, absents de l'écran jusqu'ici
      // (conception 6.1, relecture du 23/10). Lecture historique du module
      // course : 0 et les nombres négatifs y sont refusés.
      {
        cle: 'course.no_deliverer_alert_after_min',
        libelle: 'Prévenir le restaurant et le siège si aucun livreur après',
        unite: minutes,
        aide: 'Compté depuis la création de la course. Nouvelle méthode avec Turbo : jamais avant la bascule vers Turbo plus 1 minute.',
        type: 'nombre',
        defaut: '5',
        lecture: 'ancienne',
        aussiAncienne: true,
      },
      {
        cle: 'course.no_deliverer_max_wait_min',
        libelle: "Abandonner la recherche d'un livreur après",
        unite: minutes,
        aide: 'Compté depuis la création de la course, qui passe alors en « Aucun livreur trouvé ».',
        type: 'nombre',
        defaut: '60',
        lecture: 'ancienne',
        aussiAncienne: true,
      },
      {
        cle: 'course.delay_alert_factor',
        libelle: 'Signaler une tournée en retard au-delà de',
        unite: 'fois la durée estimée',
        aide: 'Compté depuis le retrait. 1,5 : la cloche sonne quand la tournée dure moitié plus que prévu.',
        type: 'nombre',
        defaut: '1.5',
        lecture: 'ancienne',
        pas: '0.1',
        aussiAncienne: true,
      },
      {
        cle: 'maps.plafond_appels_jour',
        libelle: "Plafond d'appels Google par jour",
        unite: 'appels',
        // Relecture du 23/10 : le plafond du serveur (`FONCTIONS_PLAFONNEES`)
        // ne couvre plus que les appels du regroupement (tracés, détours,
        // temps de trajet), dont le temps de trajet qui classe les livreurs
        // (`getTravelTimes`, ancienne méthode comprise) ; les frais de
        // livraison et le choix du restaurant gardent Google sans limite.
        aide: TEXTE_PLAFOND_GOOGLE,
        type: 'nombre',
        defaut: '2000',
        lecture: 'plafond',
        min: 0,
        entier: true,
        pas: '100',
        aussiAncienne: true,
      },
      {
        cle: 'course.planificateur_tache_s',
        libelle: 'Passage automatique du planificateur toutes les',
        unite: secondes,
        type: 'nombre',
        defaut: '10',
        lecture: 'planificateur',
        min: 5,
        max: 300,
        entier: true,
      },
    ],
  },
];

// ============================================================
// ANCIENNE MÉTHODE (lots)
// ============================================================

export const GROUPE_ANCIENNE_METHODE: GroupeReglages = {
  titre: 'Ancienne méthode',
  description:
    "Lots de l'ancienne méthode. Avec la nouvelle, les trois premiers servent encore aux commandes dont le service de livraison est Turbo. 0 n'y est jamais accepté.",
  reglages: [
    {
      cle: 'course.batch_window_seconds',
      libelle: 'Attente maximale du lot',
      unite: secondes,
      type: 'nombre',
      defaut: '180',
      lecture: 'ancienne',
      min: 1,
      pas: '10',
    },
    {
      cle: 'course.batch_min_wait_seconds',
      libelle: 'Attente minimale avant le départ du lot',
      unite: secondes,
      type: 'nombre',
      defaut: '120',
      lecture: 'ancienne',
      min: 1,
      pas: '10',
    },
    {
      cle: 'course.lookahead_in_progress',
      libelle: 'Tenir compte des commandes en préparation',
      aide: 'Non : le lot attend toujours le temps maximal.',
      type: 'oui_non',
      defaut: '1',
      lecture: 'ancienne',
    },
    {
      cle: 'course.rebalance_enabled',
      libelle: 'Rééquilibrer les courses pas encore récupérées',
      type: 'oui_non',
      defaut: '1',
      lecture: 'ancienne',
    },
    {
      cle: 'course.max_detour_meters',
      libelle: 'Distance maximale entre deux clients',
      unite: metres,
      type: 'nombre',
      defaut: '1500',
      lecture: 'ancienne',
      min: 1,
      pas: '100',
    },
    {
      cle: 'course.turbo_fallback_after_min',
      libelle: 'Bascule vers Turbo après',
      unite: 'minutes, depuis la création de la course',
      type: 'nombre',
      defaut: '4',
      lecture: 'ancienne',
      min: 1,
    },
  ],
};

/** Tous les réglages de la section (hors méthode et restaurants). */
export const TOUS_LES_REGLAGES: DefinitionReglage[] = [
  ...GROUPES_NOUVELLE_METHODE.flatMap((g) => g.reglages),
  ...GROUPE_ANCIENNE_METHODE.reglages,
];

/** Préfixes à charger pour la section. */
export const PREFIXES_REGLAGES = ['course.', 'deliverer.', 'preparation.', 'maps.'] as const;

// ============================================================
// LIBELLÉS
// ============================================================

/** « Attente maximale d'une commande prête (secondes) ». */
export function libelleAvecUnite(def: Pick<DefinitionReglage, 'libelle' | 'unite'>): string {
  return def.unite ? `${def.libelle} (${def.unite})` : def.libelle;
}

/** « Oui » / « Non » pour un réglage oui ou non. */
export function libelleOuiNon(valeur: string): string {
  return valeur === '1' ? 'Oui' : 'Non';
}

// ============================================================
// LECTURE DU SERVEUR
// ============================================================

const VRAI_STRICT = ['1', 'true', 'on', 'oui', 'yes'];
const FAUX_STRICT = ['0', 'false', 'off', 'non', 'no'];
const VRAI_DIRECTION = ['1', 'true', 'on', 'oui'];
const FAUX_DIRECTION = ['0', 'false', 'off', 'non'];
const VRAI_HISTORIQUE = ['true', '1', 'on', 'yes'];

/** Nombre lu comme le serveur le lit, avant les bornes. */
function nombreLu(def: DefinitionReglage, brut: string): number {
  switch (def.lecture) {
    case 'ancienne':
    case 'livreur':
      return Number(brut);
    case 'plafond':
      return Number(brut.trim());
    default:
      return Number(brut.trim().replace(',', '.'));
  }
}

/** Le serveur garderait-il ce nombre ? Sinon, le message qui dit pourquoi. */
function refusNombre(def: DefinitionReglage, n: number, saisie: boolean): string | null {
  if (!Number.isFinite(n)) return 'Nombre attendu';
  // Le plafond Google enregistré est arrondi par le serveur ; à la saisie, on demande un entier.
  if (def.entier && !Number.isInteger(n) && (saisie || def.lecture !== 'plafond')) return 'Nombre entier attendu';
  const bornes = (): string => {
    if (def.max !== undefined && def.min !== undefined) return `entre ${def.min} et ${def.max}`;
    if (def.min !== undefined) return def.min === 0 ? '0 ou plus' : `au moins ${def.min}`;
    return `au plus ${def.max}`;
  };
  switch (def.lecture) {
    case 'ancienne':
      if (n <= 0) return "0 n'est pas accepté par l'ancienne méthode";
      break;
    case 'preparation':
      if (n <= 0) return 'Durée supérieure à 0 attendue';
      break;
    case 'livreur':
    case 'plafond':
    case 'direction':
      if (n < 0) return 'Nombre négatif refusé';
      break;
    default:
      break;
  }
  if ((def.min !== undefined && n < def.min) || (def.max !== undefined && n > def.max)) {
    return `Valeur attendue ${bornes()}`;
  }
  return null;
}

/** Oui ou non tel que le serveur le lit ; null si le serveur refuserait la valeur. */
function booleenLu(def: DefinitionReglage, brut: string): boolean | null {
  const v = brut.trim().toLowerCase();
  if (def.lecture === 'direction') {
    if (VRAI_DIRECTION.includes(v)) return true;
    if (FAUX_DIRECTION.includes(v)) return false;
    return null;
  }
  if (def.lecture === 'ancienne' || def.lecture === 'livreur') {
    // Lecture historique : tout ce qui n'est pas « vrai » vaut « non », jamais refusé.
    return VRAI_HISTORIQUE.includes(brut.trim().toLowerCase());
  }
  if (VRAI_STRICT.includes(v)) return true;
  if (FAUX_STRICT.includes(v)) return false;
  return null;
}

export interface ValeurAppliquee {
  /** Valeur que le serveur applique (normalisée : « 1 »/« 0 » pour oui ou non). */
  valeur: string;
  /** La valeur enregistrée est refusée par le serveur et remplacée par le défaut. */
  refusee: boolean;
  /** « Valeur enregistrée « 0 » refusée : le serveur applique 120. » */
  message: string | null;
}

/** Ce que le serveur fait de la valeur enregistrée en base (absente : le défaut). */
export function valeurAppliquee(def: DefinitionReglage, enregistree: string | null | undefined): ValeurAppliquee {
  if (enregistree === undefined || enregistree === null || enregistree.trim() === '') {
    return { valeur: def.defaut, refusee: false, message: null };
  }
  const refus = (): ValeurAppliquee => {
    const appliquee = def.type === 'oui_non' ? libelleOuiNon(def.defaut).toLowerCase() : def.defaut;
    return {
      valeur: def.defaut,
      refusee: true,
      message: `Valeur enregistrée « ${enregistree.trim()} » refusée : le serveur applique ${appliquee}.`,
    };
  };
  if (def.type === 'oui_non') {
    const b = booleenLu(def, enregistree);
    return b === null ? refus() : { valeur: b ? '1' : '0', refusee: false, message: null };
  }
  const n = nombreLu(def, enregistree);
  if (refusNombre(def, n, false)) return refus();
  const garde = def.lecture === 'plafond' ? Math.floor(n) : n;
  return { valeur: String(garde), refusee: false, message: null };
}

export type VerificationSaisie = { ok: true; valeur: string } | { ok: false; message: string };

/**
 * Saisie à enregistrer. Vide : retour au défaut du serveur (`valeur` vide).
 * Virgule décimale acceptée et remplacée par un point (l'ancienne méthode
 * ne lit pas la virgule).
 */
export function verifierSaisie(def: DefinitionReglage, saisie: string): VerificationSaisie {
  const brut = saisie.trim();
  if (brut === '') return { ok: true, valeur: '' };
  if (def.type === 'oui_non') {
    const b = booleenLu(def, brut);
    if (b === null) return { ok: false, message: 'Oui ou non attendu' };
    return { ok: true, valeur: b ? '1' : '0' };
  }
  const normalise = brut.replace(',', '.');
  const n = Number(normalise);
  const refus = refusNombre(def, n, true);
  if (refus) return { ok: false, message: refus };
  return { ok: true, valeur: normalise };
}

// ============================================================
// ENREGISTREMENT
// ============================================================

export type Changement = { cle: string; action: 'ecrire'; valeur: string; description: string } | { cle: string; action: 'effacer' };

export interface PlanEnregistrement {
  changements: Changement[];
  /** Champs dont la saisie est refusée : rien n'est enregistré tant qu'il en reste. */
  erreurs: Record<string, string>;
}

/**
 * Ce qu'il faut écrire ou effacer pour passer de `enregistrees` (valeurs en
 * base) à `saisies` (écran). Un champ vidé efface la clé (retour au défaut du
 * serveur) ; un champ inchangé n'est pas réécrit ; la méthode « Nouvelle »
 * jamais enregistrée reste absente (c'est le défaut).
 */
export function planEnregistrement(p: {
  saisies: Record<string, string>;
  enregistrees: Record<string, string>;
  methode: Methode;
  restaurants: readonly string[];
}): PlanEnregistrement {
  const changements: Changement[] = [];
  const erreurs: Record<string, string> = {};

  for (const def of TOUS_LES_REGLAGES) {
    const saisie = p.saisies[def.cle];
    if (saisie === undefined) continue;
    const avant = (p.enregistrees[def.cle] ?? '').trim();
    // Inchangé : rien à écrire. Une valeur en base refusée par le serveur est
    // signalée à part (`valeurAppliquee`) sans bloquer les autres réglages.
    if (saisie.trim() === avant) continue;
    const verif = verifierSaisie(def, saisie);
    // `in` et non `!verif.ok` : sans `strict`, TypeScript ne restreint pas l'union sur le booléen.
    if ('message' in verif) {
      erreurs[def.cle] = verif.message;
      continue;
    }
    if (verif.valeur === '') {
      if (avant !== '') changements.push({ cle: def.cle, action: 'effacer' });
      continue;
    }
    // Même sens que la valeur en base (« true » lu comme « 1 ») : pas de réécriture.
    const lue = valeurAppliquee(def, avant);
    if (avant !== '' && !lue.refusee && lue.valeur === verif.valeur) continue;
    changements.push({ cle: def.cle, action: 'ecrire', valeur: verif.valeur, description: libelleAvecUnite(def) });
  }

  const methodeAvant = p.enregistrees[CLE_METHODE];
  const lue = lireMethode(methodeAvant);
  const methodeAEcrire = methodeAvant === undefined && p.methode === 'v2' ? null : p.methode;
  if (methodeAEcrire && (methodeAEcrire !== lue.methode || lue.refusee || methodeAvant?.trim() !== methodeAEcrire)) {
    changements.push({
      cle: CLE_METHODE,
      action: 'ecrire',
      valeur: methodeAEcrire,
      description: 'Méthode de regroupement : v2 (nouvelle) ou v1 (ancienne)',
    });
  }

  const restaurantsAvant = (p.enregistrees[CLE_RESTAURANTS] ?? '').trim();
  const restaurantsApres = ecrireRestaurants(p.restaurants);
  const lus = lireRestaurants(restaurantsAvant);
  const restaurantsAvantNormalises = lus.refusee ? null : ecrireRestaurants(lus.ids);
  if (restaurantsApres !== restaurantsAvantNormalises) {
    if (restaurantsApres === '') {
      if (restaurantsAvant !== '') changements.push({ cle: CLE_RESTAURANTS, action: 'effacer' });
    } else {
      changements.push({
        cle: CLE_RESTAURANTS,
        action: 'ecrire',
        valeur: restaurantsApres,
        description: 'Restaurants concernés par la nouvelle méthode (vide = tous)',
      });
    }
  }

  return { changements, erreurs };
}

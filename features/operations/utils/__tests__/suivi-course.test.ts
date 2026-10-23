// @ts-nocheck -- lancé par `bun test` (intégré à Bun) : ses types ne sont pas installés dans le backoffice.
import { describe, expect, test } from 'bun:test';

import {
  approcheLivreur,
  attentesParCommande,
  avisDeCourse,
  avisEncoreValides,
  commandeARemettre,
  courseDeCommande,
  enumerer,
  estAjouteeARemettre,
  etatCourse,
  etiquetteMotif,
  heureCourte,
  indexerCommandes,
  lireCommandesAttendues,
  livraisonsCommencees,
  motifRegroupement,
  nomDeCourse,
  positionConnue,
  positionRestaurant,
  plusRecente,
  retenueEnCours,
  texteAjout,
  texteFusion,
  texteRetenue,
  texteToutEstPret,
} from '../suivi-course';

/**
 * Demandes du 22/10 (planificateur v2) : l'écran Opérations dit, sur chaque
 * course, où en est le livreur, ce que la course attend, ce qui lui a été
 * ajouté et quelles courses ont été fusionnées. Textes courts, sans tiret
 * cadratin ni valeur d'énumération. Heures d'Abidjan = UTC.
 */

const A = (hhmm, ss = '00') => new Date(`2026-10-22T${hhmm}:${ss}Z`);
const ISO = (hhmm, ss = '00') => A(hhmm, ss).toISOString();

// Restaurant Zone 4 (banc) et un point à environ 2,2 km au nord.
const RESTO = { lat: 5.286, lng: -3.9737 };
const LOIN = { lat: 5.306, lng: -3.9737 };
const PRES = { lat: 5.2865, lng: -3.9737 }; // environ 55 m

const KOFFI = { id: 'liv-1', first_name: 'Koffi', last_name: 'Yao' };

const course = (champs = {}) => ({
  id: 'k1',
  reference: 'CRS-A1',
  pickup_code: '123',
  statut: 'ACCEPTED',
  deliverer_id: KOFFI.id,
  deliverer: KOFFI,
  ...champs,
});

const commande = (id, status, champsCourse, livraison = {}) => ({
  id,
  reference: `CMD-${id}`,
  status,
  delivery: champsCourse === null ? null : { id: `d-${id}`, statut: 'PENDING', ...livraison, course: course(champsCourse) },
});

describe('textes de base', () => {
  test('heure courte d\'Abidjan', () => {
    expect(heureCourte(A('12:38'))).toBe('12 h 38');
    expect(heureCourte(A('09:05'))).toBe('9 h 05');
  });

  test('énumération française', () => {
    expect(enumerer([])).toBe('');
    expect(enumerer(['CMD-B'])).toBe('CMD-B');
    expect(enumerer(['CMD-B', 'CMD-C'])).toBe('CMD-B et CMD-C');
    expect(enumerer(['CMD-A', 'CMD-B', 'CMD-C'])).toBe('CMD-A, CMD-B et CMD-C');
  });

  test('nom de la course : prénom du livreur, sinon sa référence', () => {
    expect(nomDeCourse(course())).toBe('la course de Koffi');
    expect(nomDeCourse(course({ deliverer: { id: 'x', first_name: '  ', last_name: 'Kouassi' } }))).toBe(
      'la course de Kouassi',
    );
    expect(nomDeCourse(course({ deliverer_id: null, deliverer: null }))).toBe('la course CRS-A1');
  });

  test("élision devant une voyelle ou un h", () => {
    expect(nomDeCourse(course({ deliverer: { id: 'x', first_name: 'Ali' } }))).toBe("la course d'Ali");
    expect(nomDeCourse(course({ deliverer: { id: 'x', first_name: 'Émile' } }))).toBe("la course d'Émile");
    expect(nomDeCourse(course({ deliverer: { id: 'x', first_name: 'Hervé' } }))).toBe("la course d'Hervé");
    expect(texteAjout(course({ deliverer: { id: 'x', first_name: 'Ali' } }), [])).toBe(
      "Ajoutée à la course d'Ali : remettre avec le code 123",
    );
  });
});

describe('motif de regroupement', () => {
  test('libellés du serveur en mots simples', () => {
    expect(motifRegroupement('sur le trajet')).toBe('même trajet');
    expect(motifRegroupement('même zone')).toBe('même zone');
    expect(motifRegroupement('même adresse')).toBe('même adresse');
    expect(motifRegroupement('même direction (sans carte)')).toBe('même direction');
    expect(motifRegroupement('détour de 4 min')).toBe('détour de 4 min');
    expect(etiquetteMotif('sur le trajet')).toBe('Même trajet');
    expect(etiquetteMotif('même zone')).toBe('Même zone');
  });

  test("jamais de valeur d'énumération brute, jamais un motif de refus", () => {
    expect(motifRegroupement('SUR_LE_TRAJET')).toBe('même trajet');
    expect(motifRegroupement('MEME_ZONE')).toBe('même zone');
    expect(motifRegroupement('DIRECTION_DIFFERENTE')).toBeNull();
    expect(motifRegroupement('INCONNU_X')).toBeNull();
    expect(motifRegroupement('sens opposés')).toBeNull();
    expect(motifRegroupement('détour de 9 min, trop long')).toBeNull();
    expect(motifRegroupement(null)).toBeNull();
    expect(motifRegroupement('  ')).toBeNull();
  });
});

describe('commandes attendues (colonne JSON)', () => {
  test('forme du contrat, avec ou sans « prête au plus tard »', () => {
    expect(
      lireCommandesAttendues([
        { order_id: 'o2', reference: 'CMD-B', prete_vers: ISO('12:41') },
        { order_id: 'o3', reference: 'CMD-C', prete_vers: ISO('12:43'), prete_au_plus_tard: ISO('12:46') },
      ]),
    ).toEqual([
      { order_id: 'o2', reference: 'CMD-B', prete_vers: ISO('12:41'), prete_au_plus_tard: null },
      { order_id: 'o3', reference: 'CMD-C', prete_vers: ISO('12:43'), prete_au_plus_tard: ISO('12:46') },
    ]);
  });

  test('null, chaîne JSON, entrées cassées ou en double : jamais de plantage', () => {
    expect(lireCommandesAttendues(null)).toEqual([]);
    expect(lireCommandesAttendues('pas du json')).toEqual([]);
    expect(lireCommandesAttendues({ order_id: 'o2' })).toEqual([]);
    expect(lireCommandesAttendues('[{"order_id":"o2","reference":"CMD-B","prete_vers":"n\'importe"}]')).toEqual([
      { order_id: 'o2', reference: 'CMD-B', prete_vers: null, prete_au_plus_tard: null },
    ]);
    expect(
      lireCommandesAttendues([null, 3, {}, { order_id: 'o2', reference: 'CMD-B' }, { order_id: 'o2', reference: 'CMD-B' }]),
    ).toHaveLength(1);
  });
});

describe('arrivée du livreur au restaurant', () => {
  test("heure du serveur d'abord", () => {
    const r = approcheLivreur({ arriveeServeur: ISO('12:38'), position: null, restaurant: null, maintenant: A('12:30') });
    expect(r).toEqual({ auRestaurant: false, arrivee: A('12:38') });
  });

  test('position récente à moins de 200 m : au restaurant, même avec une heure du serveur', () => {
    const r = approcheLivreur({
      arriveeServeur: ISO('12:38'),
      position: { ...PRES, ts: ISO('12:29') },
      restaurant: RESTO,
      maintenant: A('12:30'),
    });
    expect(r.auRestaurant).toBe(true);
  });

  test('position à 2,2 km : vol d\'oiseau × 1,3 à 22 km/h, depuis l\'heure de la position', () => {
    const r = approcheLivreur({ position: { ...LOIN, ts: ISO('12:30') }, restaurant: RESTO, maintenant: A('12:30') });
    expect(r.auRestaurant).toBe(false);
    // 2 224 m × 1,3 = 2 891 m à 6,11 m/s = 473 s, soit 12 h 37 min 53 s.
    expect(heureCourte(r.arrivee)).toBe('12 h 37');
  });

  test('position de plus de 5 min ou restaurant sans coordonnées : aucune heure', () => {
    expect(
      approcheLivreur({ position: { ...LOIN, ts: ISO('12:20') }, restaurant: RESTO, maintenant: A('12:30') }).arrivee,
    ).toBeNull();
    expect(approcheLivreur({ position: { ...LOIN, ts: ISO('12:30') }, restaurant: null, maintenant: A('12:30') })).toEqual({
      auRestaurant: false,
      arrivee: null,
    });
  });

  test("une arrivée déjà passée devient « maintenant », jamais une heure du passé", () => {
    const r = approcheLivreur({ position: { ...LOIN, ts: ISO('12:26') }, restaurant: RESTO, maintenant: A('12:34') });
    // position de 8 min : périmée pour l'arrivée
    expect(r.arrivee).toBeNull();
    const r2 = approcheLivreur({ arriveeServeur: ISO('12:20'), position: null, restaurant: RESTO, maintenant: A('12:34') });
    expect(r2.arrivee).toEqual(A('12:34'));
  });

  test('coordonnées : restaurant (0,0 ignoré), position connue, la plus récente', () => {
    expect(positionRestaurant(null, { latitude: 0, longitude: 0 }, { latitude: 5.286, longitude: -3.9737 })).toEqual(RESTO);
    expect(positionRestaurant({ latitude: null, longitude: null })).toBeNull();
    expect(positionConnue({ id: 'x', last_location: { lat: 5.3, lng: -4 }, last_location_at: ISO('12:00') })).toEqual({
      lat: 5.3,
      lng: -4,
      ts: ISO('12:00'),
    });
    expect(positionConnue({ id: 'x', last_location: 'cassé' })).toBeNull();
    const a = { ...RESTO, ts: ISO('12:00') };
    const b = { ...LOIN, ts: ISO('12:05') };
    expect(plusRecente(a, b)).toBe(b);
    expect(plusRecente(null, a)).toBe(a);
  });
});

describe('état de la course et de son livreur', () => {
  const maintenant = A('12:30');

  test('sans livreur : recherche, offre en cours, Turbo', () => {
    const sans = { deliverer_id: null, deliverer: null, statut: 'PENDING_ASSIGNMENT' };
    expect(etatCourse(course(sans), { maintenant })).toMatchObject({ etat: 'RECHERCHE', libelle: "Recherche d'un livreur" });
    expect(etatCourse(course({ ...sans, offer_expires_at: ISO('12:32') }), { maintenant })).toMatchObject({
      etat: 'PROPOSEE',
      libelle: 'Proposée à un livreur, réponse avant 12 h 32',
    });
    // Offre échue : on cherche encore.
    expect(etatCourse(course({ ...sans, offer_expires_at: ISO('12:29') }), { maintenant }).etat).toBe('RECHERCHE');
    expect(etatCourse(course({ ...sans, turbo_escalated_at: ISO('12:28') }), { maintenant })).toMatchObject({
      etat: 'TURBO',
      libelle: 'Confiée à Turbo',
      livreur: null,
    });
  });

  test('acceptée : en route avec l\'heure d\'arrivée, ou au comptoir si sa position le dit', () => {
    expect(etatCourse(course(), { maintenant })).toMatchObject({ etat: 'EN_ROUTE', libelle: 'En route', livreur: 'Koffi' });
    expect(etatCourse(course({ arrivee_estimee: ISO('12:38') }), { maintenant }).libelle).toBe('En route, arrivée vers 12 h 38');
    expect(
      etatCourse(course(), { maintenant, position: { ...PRES, ts: ISO('12:29') }, restaurant: RESTO }),
    ).toMatchObject({ etat: 'AU_COMPTOIR', libelle: 'Au comptoir' });
  });

  test('au restaurant : au comptoir', () => {
    expect(etatCourse(course({ statut: 'AT_RESTAURANT' }), { maintenant })).toMatchObject({
      etat: 'AU_COMPTOIR',
      libelle: 'Au comptoir',
      ton: 'vert',
    });
  });

  test('retrait validé : au comptoir 4 min au plus, puis parti ; départ noté ; livraison commencée', () => {
    const retire = { statut: 'IN_DELIVERY', picked_up_at: ISO('12:28') };
    expect(etatCourse(course(retire), { maintenant }).etat).toBe('AU_COMPTOIR');
    expect(etatCourse(course(retire), { maintenant: A('12:32', '30') }).libelle).toBe('Parti');
    expect(etatCourse(course({ ...retire, parti_at: ISO('12:29') }), { maintenant }).libelle).toBe('Parti à 12 h 29');
    expect(etatCourse(course(retire), { maintenant, livraisonsCommencees: true }).libelle).toBe('En livraison');
  });

  test('serveur du 23/10 : offre nommée, fin de la fenêtre après retrait donnée par le serveur', () => {
    const sans = { deliverer_id: null, deliverer: null, statut: 'PENDING_ASSIGNMENT' };
    expect(
      etatCourse(course({ ...sans, offre_en_cours: { prenom: 'Ali', expires_at: ISO('12:31') } }), { maintenant }).libelle,
    ).toBe('Proposée à Ali, réponse avant 12 h 31');
    expect(etatCourse(course({ ...sans, offre_en_cours: { prenom: null, expires_at: ISO('12:31') } }), { maintenant }).libelle).toBe(
      'Proposée à un livreur, réponse avant 12 h 31',
    );
    // Offre expirée ou refusée : le serveur dit `offre_en_cours: null` et garde l'échéance de la
    // course. L'heure de l'écran n'avance que toutes les 15 s : jamais « Proposée à un livreur ».
    expect(etatCourse(course({ ...sans, offre_en_cours: null, offer_expires_at: ISO('12:31') }), { maintenant })).toMatchObject({
      etat: 'RECHERCHE',
      libelle: "Recherche d'un livreur",
    });
    // Fenêtre de 60 s réglée au serveur : à 12 h 30, le livreur récupéré à 12 h 28 est parti.
    const retire = { statut: 'IN_DELIVERY', picked_up_at: ISO('12:28'), fenetre_ajout_ferme_a: ISO('12:29') };
    expect(etatCourse(course(retire), { maintenant }).libelle).toBe('Parti');
    expect(etatCourse(course({ ...retire, fenetre_ajout_ferme_a: ISO('12:35') }), { maintenant }).etat).toBe('AU_COMPTOIR');
  });

  test('fin de vie', () => {
    expect(etatCourse(course({ statut: 'COMPLETED' }), { maintenant }).libelle).toBe('Course terminée');
    expect(etatCourse(course({ statut: 'CANCELLED' }), { maintenant }).libelle).toBe('Course annulée');
    expect(etatCourse(course({ statut: 'EXPIRED', deliverer_id: null }), { maintenant }).libelle).toBe('Aucun livreur trouvé');
  });

  test("jamais « Parti » tant qu'une commande de la course reste au comptoir (comme la caisse)", () => {
    const parti = course({ statut: 'IN_DELIVERY', picked_up_at: ISO('12:28'), parti_at: ISO('12:28') });
    expect(etatCourse(parti, { maintenant }).libelle).toBe('Parti à 12 h 28');
    expect(etatCourse(parti, { maintenant, resteARemettre: true })).toMatchObject({
      etat: 'AU_COMPTOIR',
      libelle: 'Au comptoir',
    });
    const commandes = [
      commande('1', 'PICKED_UP', { statut: 'IN_DELIVERY' }),
      commande('2', 'READY', { statut: 'IN_DELIVERY' }),
      commande('3', 'READY', { id: 'k2' }, { statut: 'CANCELLED' }),
    ];
    expect(commandeARemettre('k1', commandes)).toBe(true);
    expect(commandeARemettre('k1', commandes.slice(0, 1))).toBe(false);
    expect(commandeARemettre('k2', commandes)).toBe(false);
  });

  test('livraisons commencées, vues sur les commandes affichées', () => {
    const commandes = [
      commande('1', 'PICKED_UP', { statut: 'IN_DELIVERY' }, { statut: 'IN_ROUTE' }),
      commande('2', 'READY', { id: 'k2' }),
    ];
    expect(livraisonsCommencees('k1', commandes)).toBe(true);
    expect(livraisonsCommencees('k2', commandes)).toBe(false);
  });
});

describe('retenue au comptoir', () => {
  const retenue = (champs = {}) =>
    course({
      statut: 'AT_RESTAURANT',
      retenue_jusqua: ISO('12:44'),
      commandes_attendues: [{ order_id: 'oB', reference: 'CMD-B', prete_vers: ISO('12:41') }],
      ...champs,
    });

  test('le texte de la conception', () => {
    expect(texteRetenue(retenue(), A('12:35'))).toBe('Attendre CMD-B, prête vers 12 h 41, départ au plus tard 12 h 44');
  });

  test('plusieurs commandes attendues, heure inconnue', () => {
    const k = retenue({
      commandes_attendues: [
        { order_id: 'oB', reference: 'CMD-B', prete_vers: ISO('12:41') },
        { order_id: 'oC', reference: 'CMD-C', prete_vers: ISO('12:43') },
      ],
    });
    expect(texteRetenue(k, A('12:35'))).toBe(
      'Attendre CMD-B (prête vers 12 h 41) et CMD-C (prête vers 12 h 43), départ au plus tard 12 h 44',
    );
    const sansHeure = retenue({ commandes_attendues: [{ order_id: 'oB', reference: 'CMD-B' }] });
    expect(texteRetenue(sansHeure, A('12:35'))).toBe('Attendre CMD-B, départ au plus tard 12 h 44');
  });

  test('échue, levée, partie ou chez Turbo : plus de retenue', () => {
    expect(retenueEnCours(retenue(), A('12:44'))).toBeNull();
    expect(texteRetenue(retenue({ commandes_attendues: [] }), A('12:35'))).toBeNull();
    expect(texteRetenue(retenue({ statut: 'IN_DELIVERY', parti_at: ISO('12:36') }), A('12:37'))).toBeNull();
    expect(texteRetenue(retenue({ turbo_escalated_at: ISO('12:36') }), A('12:37'))).toBeNull();
    expect(texteRetenue(retenue({ statut: 'COMPLETED' }), A('12:37'))).toBeNull();
    expect(texteRetenue(course(), A('12:37'))).toBeNull();
  });

  test('« tout est prêt » après une retenue levée, avec le code', () => {
    expect(texteToutEstPret(retenue({ commandes_attendues: [], retenue_jusqua: ISO('12:34') }))).toBe(
      'Tout est prêt : remettre avec le code 123',
    );
    expect(texteToutEstPret(retenue())).toBeNull();
    expect(texteToutEstPret(course({ statut: 'AT_RESTAURANT' }))).toBeNull();
    expect(texteToutEstPret(retenue({ commandes_attendues: [], statut: 'IN_DELIVERY' }))).toBeNull();
  });

  test('la commande en cuisine sait quelle course l\'attend', () => {
    const commandes = [
      { ...commande('A', 'READY', { statut: 'AT_RESTAURANT', retenue_jusqua: ISO('12:44'), commandes_attendues: [{ order_id: 'oB', reference: 'CMD-B', prete_vers: ISO('12:41') }] }) },
      { id: 'oB', reference: 'CMD-B', status: 'IN_PROGRESS', delivery: null },
    ];
    const attentes = attentesParCommande(commandes, A('12:35'));
    expect(attentes.get('oB')).toEqual({ courseId: 'k1', texte: 'Attendue par la course de Koffi, départ au plus tard 12 h 44' });
    expect(attentesParCommande(commandes, A('12:45')).size).toBe(0);
  });
});

describe('ajout à une course', () => {
  test('texte pour la caisse', () => {
    expect(texteAjout(course(), [])).toBe('Ajoutée à la course de Koffi : remettre avec le code 123');
    expect(texteAjout(course(), ['CMD-C'])).toBe('CMD-C ajoutée à la course de Koffi : remettre avec le code 123');
    expect(texteAjout(course(), ['CMD-C', 'CMD-D'])).toBe(
      'CMD-C et CMD-D ajoutées à la course de Koffi : remettre avec le code 123',
    );
    expect(texteAjout(course({ deliverer_id: null, deliverer: null, pickup_code: null }), ['CMD-C'])).toBe(
      'CMD-C ajoutée à la course CRS-A1',
    );
  });

  test('à remettre : prête, ajoutée après l\'acceptation, course avec livreur pas encore partie', () => {
    const ajoutee = { ajoutee_at: ISO('12:40') };
    expect(estAjouteeARemettre(commande('C', 'READY', { statut: 'AT_RESTAURANT', assigned_at: ISO('12:30') }, ajoutee))).toBe(true);
    // Ajoutée (ou fusionnée) pendant la recherche : le livreur l'a acceptée avec la course.
    expect(estAjouteeARemettre(commande('C', 'READY', { statut: 'AT_RESTAURANT', assigned_at: ISO('12:41') }, ajoutee))).toBe(false);
    expect(estAjouteeARemettre(commande('C', 'READY', { statut: 'AT_RESTAURANT' }, ajoutee))).toBe(false);
    expect(
      estAjouteeARemettre(commande('C', 'READY', { statut: 'IN_DELIVERY' }, { ajoutee_at: ISO('12:40'), ajoutee_apres_retrait: true })),
    ).toBe(true);
    expect(estAjouteeARemettre(commande('C', 'READY', { statut: 'IN_DELIVERY', parti_at: ISO('12:41') }, ajoutee))).toBe(false);
    expect(estAjouteeARemettre(commande('C', 'READY', { statut: 'PENDING_ASSIGNMENT', deliverer_id: null }, ajoutee))).toBe(false);
    expect(estAjouteeARemettre(commande('C', 'PICKED_UP', { statut: 'IN_DELIVERY' }, ajoutee))).toBe(false);
    expect(estAjouteeARemettre(commande('C', 'READY', { statut: 'AT_RESTAURANT' }))).toBe(false);
    expect(estAjouteeARemettre(commande('C', 'READY', null))).toBe(false);
  });
});

describe('fusion de courses', () => {
  test('texte de la conception', () => {
    expect(texteFusion(['CRS-A', 'CRS-B'], 'sur le trajet')).toBe('Courses CRS-A et CRS-B fusionnées : même trajet');
    expect(texteFusion(['CRS-A', 'CRS-B', 'CRS-C'], 'même zone')).toBe(
      'Courses CRS-A, CRS-B et CRS-C fusionnées : même zone',
    );
    expect(texteFusion(['CRS-B'], null)).toBe('Une course fusionnée avec CRS-B');
    expect(texteFusion(['CRS-A', 'CRS-A', 'CRS-B'], 'DIRECTION_DIFFERENTE')).toBe('Courses CRS-A et CRS-B fusionnées');
  });

  test('avis après `course:statut:changed` : la course absorbée retrouvée dans la liste affichée', () => {
    const avant = indexerCommandes([
      [
        commande('1', 'READY', { id: 'kA', reference: 'CRS-A', statut: 'PENDING_ASSIGNMENT', deliverer_id: null }),
        commande('2', 'READY', { id: 'kB', reference: 'CRS-B', statut: 'PENDING_ASSIGNMENT', deliverer_id: null }),
      ],
    ]);
    const payload = {
      id: 'kB',
      reference: 'CRS-B',
      statut: 'PENDING_ASSIGNMENT',
      motif_regroupement: 'sur le trajet',
      deliveries: [
        { order_id: '2', statut: 'PENDING', order: { id: '2', reference: 'CMD-2' } },
        { order_id: '1', statut: 'PENDING', order: { id: '1', reference: 'CMD-1' } },
      ],
    };
    expect(avisDeCourse('COURSES_FUSIONNEES', payload, avant, A('12:30'))).toEqual({
      type: 'FUSION',
      courseId: 'kB',
      texte: 'Courses CRS-A et CRS-B fusionnées : même trajet',
      at: A('12:30').getTime(),
    });
  });

  test('avis de fusion : références des courses absorbées données par le serveur', () => {
    // Page ouverte après coup : la course absorbée n'est plus dans la liste.
    const avant = indexerCommandes([[commande('2', 'READY', { id: 'kB', reference: 'CRS-B', statut: 'PENDING_ASSIGNMENT', deliverer_id: null })]]);
    const payload = {
      id: 'kB',
      reference: 'CRS-B',
      statut: 'PENDING_ASSIGNMENT',
      motif_regroupement: 'même zone',
      deliveries: [{ order_id: '2', statut: 'PENDING', order: { id: '2', reference: 'CMD-2' } }],
    };
    expect(avisDeCourse('COURSES_FUSIONNEES', payload, avant, A('12:30'), ['CRS-A'])?.texte).toBe(
      'Courses CRS-A et CRS-B fusionnées : même zone',
    );
  });

  test('avis d\'ajout : la commande n\'avait pas de course', () => {
    const avant = indexerCommandes([
      [commande('1', 'READY', { statut: 'AT_RESTAURANT' }), { id: '3', reference: 'CMD-3', status: 'IN_PROGRESS', delivery: null }],
    ]);
    const payload = {
      ...course({ statut: 'AT_RESTAURANT' }),
      deliveries: [
        { order_id: '1', statut: 'PENDING', order: { reference: 'CMD-1' } },
        { order_id: '3', statut: 'PENDING', order: { reference: 'CMD-3' } },
      ],
    };
    expect(avisDeCourse('COMMANDE_AJOUTEE', payload, avant, A('12:30'))?.texte).toBe(
      'CMD-3 ajoutée à la course de Koffi : remettre avec le code 123',
    );
  });

  test('rien pour un autre restaurant, une autre raison ou rien de nouveau', () => {
    const avant = indexerCommandes([[commande('1', 'READY', {})]]);
    const autre = { ...course({ id: 'kZ' }), deliveries: [{ order_id: '99', statut: 'PENDING' }] };
    expect(avisDeCourse('COURSES_FUSIONNEES', autre, avant, A('12:30'))).toBeNull();
    const meme = { ...course(), deliveries: [{ order_id: '1', statut: 'PENDING' }] };
    expect(avisDeCourse('COMMANDE_AJOUTEE', meme, avant, A('12:30'))).toBeNull();
    expect(avisDeCourse('RETENUE', meme, avant, A('12:30'))).toBeNull();
    expect(avisDeCourse('COMMANDE_AJOUTEE', null, avant, A('12:30'))).toBeNull();
  });

  test('un avis reste 10 minutes', () => {
    const avis = [{ at: A('12:20').getTime() }, { at: A('12:25').getTime() }];
    expect(avisEncoreValides(avis, A('12:31'))).toEqual([{ at: A('12:25').getTime() }]);
  });
});

describe('lecture défensive', () => {
  test('course absente ou mal formée', () => {
    expect(courseDeCommande({ id: '1', reference: 'x', status: 'READY' })).toBeNull();
    expect(courseDeCommande({ id: '1', reference: 'x', status: 'READY', delivery: { course: { reference: 'sans id' } } })).toBeNull();
    expect(courseDeCommande(commande('1', 'READY', {}))?.id).toBe('k1');
  });
});

describe('aucun texte avec tiret cadratin', () => {
  test('échantillon de tous les textes', () => {
    const textes = [
      texteRetenue(course({ statut: 'AT_RESTAURANT', retenue_jusqua: ISO('12:44'), commandes_attendues: [{ order_id: 'o', reference: 'CMD-B', prete_vers: ISO('12:41') }] }), A('12:35')),
      texteToutEstPret(course({ retenue_jusqua: ISO('12:34'), commandes_attendues: [] })),
      texteAjout(course(), ['CMD-C']),
      texteFusion(['CRS-A', 'CRS-B'], 'sur le trajet'),
      etatCourse(course({ arrivee_estimee: ISO('12:38') }), { maintenant: A('12:30') }).libelle,
      etatCourse(course({ statut: 'IN_DELIVERY', parti_at: ISO('12:29') }), { maintenant: A('12:30') }).libelle,
    ];
    for (const t of textes) expect(t).not.toContain('—');
  });
});

// @ts-nocheck -- lancé par `bun test` (intégré à Bun) : ses types ne sont pas installés dans le backoffice.
import { describe, expect, test } from 'bun:test';

import {
  appliLivreurLivraison,
  etatLivraison,
  libelleService,
  lienAppel,
  lignesFrise,
  lireLivraison,
  livraisonTerminee,
  livreurAffiche,
  retardLivraison,
  sectionAAfficher,
  texteArret,
  texteArretTournee,
  texteDuree,
  texteEchec,
  texteHeure,
  texteTotal,
  tourneeAAfficher,
} from '../suivi-livraison';

/**
 * Demande du 24/10 : dans le tiroir d'une commande, une section « Livraison »
 * simple : le livreur, l'heure à laquelle il a pris la commande, le départ de
 * la course s'il y avait plusieurs commandes, la durée entre le livreur et le
 * restaurant ou le client. Aucune heure inventée. Heures d'Abidjan = UTC.
 */

const ISO = (hhmm) => new Date(`2026-10-24T${hhmm}:00Z`).toISOString();

const reponse = (champs = {}) => ({
  service: 'CHICKEN_NATION',
  course: { id: 'k1', reference: 'CRS-261024-0042', code_retrait: '614', nombre_commandes: 1, rang_arret: 1, statut: 'ACCEPTED' },
  livreur: { id: 'liv-1', nom: 'Andy Kouassi', telephone: '+2250102030405', etat: 'vers_restaurant' },
  etapes: [
    { cle: 'acceptee', heure: ISO('12:30'), prevue: null },
    { cle: 'arrivee_restaurant', heure: null, prevue: ISO('12:38') },
    { cle: 'recuperee', heure: null, prevue: null },
    { cle: 'depart', heure: null, prevue: null },
    { cle: 'arrivee_client', heure: null, prevue: ISO('12:55') },
    { cle: 'livree', heure: null, prevue: null },
  ],
  durees: { vers_restaurant_s: null, attente_comptoir_s: null, vers_client_s: null, pret_a_livre_s: null },
  ...champs,
});

const lue = (champs) => lireLivraison(reponse(champs));

describe('formats', () => {
  test('heures « 12 h 41 », heure d\'Abidjan', () => {
    expect(texteHeure(ISO('12:41'))).toBe('12 h 41');
    expect(texteHeure(ISO('09:05'))).toBe('9 h 05');
    expect(texteHeure(null)).toBeNull();
    expect(texteHeure('pas une date')).toBeNull();
  });

  test('durées « 6 min », « 1 h 05 »', () => {
    expect(texteDuree(360)).toBe('6 min');
    expect(texteDuree(389)).toBe('6 min');
    expect(texteDuree(3900)).toBe('1 h 05');
    expect(texteDuree(3600)).toBe('1 h');
    expect(texteDuree(7260)).toBe('2 h 01');
    expect(texteDuree(20)).toBe("moins d'1 min");
    expect(texteDuree(null)).toBeNull();
    expect(texteDuree(-5)).toBeNull();
    expect(texteDuree(Number.NaN)).toBeNull();
  });

  test('arrêt « 2 sur 3 », seulement pour plusieurs commandes', () => {
    expect(texteArret(2, 3)).toBe('Arrêt 2 sur 3');
    expect(texteArret(1, 1)).toBeNull();
    expect(texteArret(null, 3)).toBeNull();
    expect(texteArret(4, 3)).toBeNull();
    expect(texteArret(0, 3)).toBeNull();
  });

  test('service en mots', () => {
    expect(libelleService('CHICKEN_NATION')).toBe('Chicken Nation');
    expect(libelleService('TURBO')).toBe('Turbo');
    expect(libelleService(null)).toBeNull();
  });
});

describe('lecture défensive de la réponse', () => {
  test('pas un objet : rien', () => {
    expect(lireLivraison(null)).toBeNull();
    expect(lireLivraison('erreur')).toBeNull();
    expect(lireLivraison([])).toBeNull();
  });

  test('champs inconnus, étapes en double ou inconnues écartées, ordre de la frise rétabli', () => {
    const l = lireLivraison({
      service: 'GLOVO',
      course: { id: 'k1', nombre_commandes: '3', rang_arret: 2 },
      livreur: { id: 'liv-1', nom: 'Andy', etat: 'EN_ROUTE' },
      etapes: [
        { cle: 'livree', heure: null },
        { cle: 'acceptee', heure: ISO('12:30') },
        { cle: 'acceptee', heure: ISO('12:31') },
        { cle: 'au_hasard', heure: ISO('12:32') },
        { cle: 'recuperee', heure: 'pas une date' },
        null,
      ],
      durees: { vers_restaurant_s: -3, vers_client_s: '420' },
    });
    expect(l.service).toBeNull();
    expect(l.course.nombre_commandes).toBe(3);
    expect(l.course.reference).toBeNull();
    expect(l.livreur.etat).toBeNull();
    expect(l.etapes.map((e) => e.cle)).toEqual(['acceptee', 'recuperee', 'livree']);
    expect(l.etapes[0].heure).toBe(ISO('12:30'));
    expect(l.etapes[1].heure).toBeNull();
    expect(l.durees).toEqual({ vers_restaurant_s: null, attente_comptoir_s: null, vers_client_s: 420, pret_a_livre_s: null });
  });

  test('course sans identifiant : pas de course', () => {
    expect(lireLivraison({ course: { reference: 'CRS-1' }, etapes: [] }).course).toBeNull();
  });
});

describe('livreur et son état', () => {
  test('étiquettes d\'état, jamais la valeur brute', () => {
    const libelle = (etat, nom = 'Andy Kouassi') => etatLivraison(lue({ livreur: { id: 'l', nom, telephone: null, etat } }))?.libelle ?? null;
    expect(libelle('recherche')).toBe("Recherche d'un livreur");
    expect(libelle('proposee')).toBe('Proposée à Andy');
    expect(libelle('proposee', null)).toBe('Proposée à un livreur');
    expect(libelle('vers_restaurant')).toBe('En route vers le restaurant');
    expect(libelle('au_comptoir')).toBe('Au restaurant');
    expect(libelle('vers_client')).toBe('En route vers le client');
    expect(libelle('livree')).toBe('Livrée');
    expect(libelle('annulee')).toBe('Annulée');
    expect(libelle('VERS_CLIENT')).toBeNull();
    expect(etatLivraison(lue({ livreur: null }))).toBeNull();
  });

  test('nom et lien d\'appel', () => {
    expect(livreurAffiche(lue())).toEqual({
      nom: 'Andy Kouassi',
      telephone: '+2250102030405',
      lienAppel: 'tel:+2250102030405',
    });
  });

  test('numéro masqué : affiché, jamais appelable', () => {
    const l = lue({ livreur: { id: 'l', nom: 'Andy', telephone: '+225•••••••05', etat: 'vers_client' } });
    expect(livreurAffiche(l)).toEqual({ nom: 'Andy', telephone: '+225•••••••05', lienAppel: null });
    expect(lienAppel('07 07 07 07 07')).toBe('tel:0707070707');
    expect(lienAppel('123')).toBeNull();
    expect(lienAppel(null)).toBeNull();
  });

  test('personne tant que la course cherche un livreur', () => {
    expect(livreurAffiche(lue({ livreur: { id: 'l', nom: 'Andy', telephone: '+2250102030405', etat: 'proposee' } }))).toBeNull();
    expect(livreurAffiche(lue({ livreur: null }))).toBeNull();
  });

  test('Turbo : son livreur s\'il est connu, sinon « Livreur Turbo »', () => {
    const turbo = (livreur) => livreurAffiche(lue({ service: 'TURBO', course: null, livreur }));
    expect(turbo({ id: null, nom: null, telephone: null, etat: 'vers_client' })).toEqual({
      nom: 'Livreur Turbo',
      telephone: null,
      lienAppel: null,
    });
    expect(turbo({ id: 't-9', nom: 'Moussa', telephone: '+2250708091011', etat: 'vers_client' })).toEqual({
      nom: 'Moussa',
      telephone: '+2250708091011',
      lienAppel: 'tel:+2250708091011',
    });
    // Turbo n'a encore rien dit : pas de livreur, l'état le dit.
    expect(turbo(null)).toBeNull();
    expect(turbo({ id: null, nom: null, telephone: null, etat: 'recherche' })).toBeNull();
  });

  test('section montrée s\'il y a quelque chose à dire, jamais « Pas encore de livreur » sur une commande finie', () => {
    const vide = (service) => lue({ service, course: null, livreur: null, etapes: [] });
    expect(sectionAAfficher(lue(), 'READY')).toBe(true);
    expect(sectionAAfficher(vide('CHICKEN_NATION'), 'READY')).toBe(true);
    expect(sectionAAfficher(vide('TURBO'), 'IN_PROGRESS')).toBe(true);
    expect(sectionAAfficher(vide('CHICKEN_NATION'), 'COMPLETED')).toBe(false);
    expect(sectionAAfficher(vide('CHICKEN_NATION'), 'CANCELLED')).toBe(false);
    expect(sectionAAfficher(vide(null), 'READY')).toBe(false);
    expect(sectionAAfficher(null, 'READY')).toBe(false);
  });
});

describe('frise', () => {
  const resume = (l) => lignesFrise(l).map((x) => [x.libelle, x.statut, x.heure ?? x.prevue ?? '—', x.duree]);

  test('livreur en route vers le restaurant : arrivée en cours avec l\'heure prévue, départ confondu absent', () => {
    expect(resume(lue())).toEqual([
      ['Course acceptée', 'faite', '12 h 30', null],
      ['Arrivé au restaurant', 'en_cours', 'vers 12 h 38', null],
      ['Commande récupérée', 'a_venir', '—', null],
      ['Arrivé chez le client', 'a_venir', 'vers 12 h 55', null],
      ['Livrée', 'a_venir', '—', null],
    ]);
  });

  test('livrée : chaque durée sur l\'étape qu\'elle mène, plus rien en cours', () => {
    const l = lue({
      livreur: { id: 'l', nom: 'Andy', telephone: null, etat: 'livree' },
      course: { id: 'k1', reference: 'CRS-1', code_retrait: '614', nombre_commandes: 1, rang_arret: 1, statut: 'COMPLETED' },
      etapes: [
        { cle: 'acceptee', heure: ISO('12:30'), prevue: null },
        { cle: 'arrivee_restaurant', heure: ISO('12:36'), prevue: ISO('12:38') },
        { cle: 'recuperee', heure: ISO('12:40'), prevue: null },
        { cle: 'depart', heure: ISO('12:40'), prevue: null },
        { cle: 'arrivee_client', heure: ISO('12:52'), prevue: null },
        { cle: 'livree', heure: ISO('12:54'), prevue: null },
      ],
      durees: { vers_restaurant_s: 360, attente_comptoir_s: 240, vers_client_s: 720, pret_a_livre_s: 1680 },
    });
    expect(resume(l)).toEqual([
      ['Course acceptée', 'faite', '12 h 30', null],
      ['Arrivé au restaurant', 'faite', '12 h 36', '6 min de trajet'],
      ['Commande récupérée', 'faite', '12 h 40', '4 min au restaurant'],
      ['Arrivé chez le client', 'faite', '12 h 52', '12 min de trajet'],
      ['Livrée', 'faite', '12 h 54', null],
    ]);
    expect(texteTotal(l)).toBe('Prête → livrée : 28 min');
    expect(livraisonTerminee(l)).toBe(true);
  });

  test('plusieurs commandes : le départ de la course paraît quand il diffère de la récupération', () => {
    const base = {
      course: { id: 'k1', reference: 'CRS-1', code_retrait: '614', nombre_commandes: 3, rang_arret: 2, statut: 'IN_DELIVERY' },
      livreur: { id: 'l', nom: 'Andy', telephone: null, etat: 'au_comptoir' },
    };
    const attend = lue({
      ...base,
      etapes: [
        { cle: 'acceptee', heure: ISO('12:30'), prevue: null },
        { cle: 'arrivee_restaurant', heure: ISO('12:36'), prevue: null },
        { cle: 'recuperee', heure: ISO('12:40'), prevue: null },
        { cle: 'depart', heure: null, prevue: null },
        { cle: 'arrivee_client', heure: null, prevue: null },
        { cle: 'livree', heure: null, prevue: null },
      ],
    });
    expect(resume(attend).map((x) => [x[0], x[1]])).toEqual([
      ['Course acceptée', 'faite'],
      ['Arrivé au restaurant', 'faite'],
      ['Commande récupérée', 'faite'],
      ['Départ de la course', 'en_cours'],
      ['Arrivé chez le client', 'a_venir'],
      ['Livrée', 'a_venir'],
    ]);

    const parti = lue({
      ...base,
      livreur: { id: 'l', nom: 'Andy', telephone: null, etat: 'vers_client' },
      etapes: [
        { cle: 'acceptee', heure: ISO('12:30'), prevue: null },
        { cle: 'recuperee', heure: ISO('12:40'), prevue: null },
        { cle: 'depart', heure: ISO('12:47'), prevue: null },
        { cle: 'arrivee_client', heure: null, prevue: null },
      ],
    });
    expect(resume(parti).find((x) => x[0] === 'Départ de la course')).toEqual(['Départ de la course', 'faite', '12 h 47', null]);

    // Départ noté à la même minute que la récupération : confondu, pas montré.
    const ensemble = lue({
      ...base,
      etapes: [
        { cle: 'recuperee', heure: ISO('12:40'), prevue: null },
        { cle: 'depart', heure: new Date(Date.parse(ISO('12:40')) + 30_000).toISOString(), prevue: null },
      ],
    });
    expect(resume(ensemble).map((x) => x[0])).toEqual(['Commande récupérée']);
  });

  test('une seule commande, départ pas encore noté : pas d\'étape de départ', () => {
    expect(lignesFrise(lue()).some((x) => x.cle === 'depart')).toBe(false);
  });

  test('départ prévu par le serveur (retenue, fenêtre d\'ajout) : montré à venir avec son heure', () => {
    const l = lue({
      course: { id: 'k1', reference: 'CRS-1', code_retrait: '614', nombre_commandes: 1, rang_arret: 1, statut: 'AT_RESTAURANT' },
      livreur: { id: 'l', nom: 'Andy', telephone: null, etat: 'au_comptoir' },
      etapes: [
        { cle: 'acceptee', heure: ISO('12:30'), prevue: null },
        { cle: 'arrivee_restaurant', heure: ISO('12:36'), prevue: null },
        { cle: 'recuperee', heure: null, prevue: null },
        { cle: 'depart', heure: null, prevue: ISO('12:44') },
        { cle: 'arrivee_client', heure: null, prevue: null },
        { cle: 'livree', heure: null, prevue: null },
      ],
      durees: { vers_restaurant_s: 360, attente_comptoir_s: null, vers_client_s: null, pret_a_livre_s: null },
    });
    expect(resume(l)).toEqual([
      ['Course acceptée', 'faite', '12 h 30', null],
      ['Arrivé au restaurant', 'faite', '12 h 36', '6 min de trajet'],
      ['Commande récupérée', 'en_cours', '—', null],
      ['Départ de la course', 'a_venir', 'vers 12 h 44', null],
      ['Arrivé chez le client', 'a_venir', '—', null],
      ['Livrée', 'a_venir', '—', null],
    ]);
  });

  test('étape passée sans heure notée : faite, sans heure, jamais une heure inventée', () => {
    const l = lue({
      livreur: { id: 'l', nom: 'Andy', telephone: null, etat: 'livree' },
      etapes: [
        { cle: 'acceptee', heure: ISO('12:30'), prevue: null },
        { cle: 'arrivee_client', heure: null, prevue: ISO('12:50') },
        { cle: 'livree', heure: ISO('12:54'), prevue: null },
      ],
      durees: { vers_restaurant_s: null, attente_comptoir_s: null, vers_client_s: null, pret_a_livre_s: null },
    });
    const lignes = lignesFrise(l);
    expect(lignes[1]).toEqual({
      cle: 'arrivee_client',
      libelle: 'Arrivé chez le client',
      heure: null,
      prevue: null,
      duree: null,
      statut: 'faite',
    });
    expect(texteTotal(l)).toBeNull();
  });

  test('Turbo : seulement les étapes que ses webhooks ont notées, durée vers le client sur « Livrée »', () => {
    const l = lue({
      service: 'TURBO',
      course: null,
      livreur: null,
      etapes: [
        { cle: 'recuperee', heure: ISO('12:40'), prevue: null },
        { cle: 'livree', heure: ISO('13:05'), prevue: null },
      ],
      durees: { vers_restaurant_s: null, attente_comptoir_s: null, vers_client_s: 1500, pret_a_livre_s: 2100 },
    });
    expect(resume(l)).toEqual([
      ['Commande récupérée', 'faite', '12 h 40', null],
      ['Livrée', 'faite', '13 h 05', '25 min de trajet'],
    ]);
    expect(texteTotal(l)).toBe('Prête → livrée : 35 min');
  });

  test('course annulée : rien en cours, plus de relecture', () => {
    const l = lue({
      course: { id: 'k1', reference: 'CRS-1', code_retrait: null, nombre_commandes: 2, rang_arret: 1, statut: 'CANCELLED' },
      livreur: { id: 'l', nom: 'Andy', telephone: null, etat: 'annulee' },
    });
    expect(lignesFrise(l).some((x) => x.statut === 'en_cours')).toBe(false);
    expect(lignesFrise(l).some((x) => x.cle === 'depart')).toBe(false);
    expect(livraisonTerminee(l)).toBe(true);
  });

  test('relecture tant que la livraison n\'est pas finie', () => {
    expect(livraisonTerminee(lue())).toBe(false);
    expect(livraisonTerminee(null)).toBe(true);
  });
});

/**
 * Demande du 24/10 au soir : « dans le drawer de la commande avoir une section
 * qui donne des informations sur la livraison » : code tant que la commande
 * est au restaurant, retard, tournée, échec, appli du livreur.
 */
describe('section Livraison complétée (serveur du 24/10)', () => {
  const tournee = [
    { reference: 'ORD-4820', rang: 3, etat: 'a_livrer', heure: null, cette_commande: false },
    { reference: 'ORD-4818', rang: 1, etat: 'livree', heure: ISO('12:52'), cette_commande: false },
    { reference: 'ORD-4819', rang: 2, etat: 'en_route', heure: ISO('12:53'), cette_commande: true },
    { reference: 'ORD-X', rang: 4, etat: 'inconnu', heure: null, cette_commande: false },
    { rang: 5, etat: 'a_livrer' },
  ];

  test('retard : « En retard de 12 min », sinon rien', () => {
    const course = (champs) => ({ ...reponse().course, statut: 'IN_DELIVERY', ...champs });
    expect(retardLivraison(lue({ course: course({ en_retard: true, retard_min: 12, fin_prevue: ISO('13:05') }) }))).toBe(
      'En retard de 12 min',
    );
    expect(retardLivraison(lue({ course: course({ en_retard: true, retard_min: null }) }))).toBe('En retard');
    expect(retardLivraison(lue({ course: course({ en_retard: false, retard_min: 3 }) }))).toBeNull();
    // Serveur plus ancien : rien.
    expect(retardLivraison(lue())).toBeNull();
    expect(lue({ course: course({ fin_prevue: 'pas une date', retard_min: -4 }) }).course).toMatchObject({
      fin_prevue: null,
      retard_min: null,
      en_retard: null,
    });
  });

  test('tournée : arrêts lus, triés, entrées illisibles écartées ; montrée à partir de deux arrêts', () => {
    const l = lue({ tournee });
    expect(l.tournee.map(texteArretTournee)).toEqual([
      'Arrêt 1 · ORD-4818 · Livrée 12 h 52',
      'Arrêt 2 · ORD-4819 · En route',
      'Arrêt 3 · ORD-4820 · À livrer',
    ]);
    expect(l.tournee.find((a) => a.cette_commande).reference).toBe('ORD-4819');
    expect(tourneeAAfficher(l)).toBe(true);
    expect(tourneeAAfficher(lue({ tournee: [tournee[2]] }))).toBe(false);
    expect(tourneeAAfficher(lue())).toBe(false);
    expect(
      texteArretTournee({ reference: 'ORD-1', rang: 1, etat: 'chez_le_client', heure: null, cette_commande: false }),
    ).toBe('Arrêt 1 · ORD-1 · Chez le client');
    expect(texteArretTournee({ reference: 'ORD-1', rang: 1, etat: 'echec', heure: null, cette_commande: false })).toBe(
      'Arrêt 1 · ORD-1 · Échec',
    );
  });

  test('échec : « Échec : Client absent » et la note du livreur ; motif inconnu : « Échec »', () => {
    expect(texteEchec(lue({ echec: { motif: 'CLIENT_ABSENT', note: 'Personne au portail' } }))).toEqual({
      titre: 'Échec : Client absent',
      note: 'Personne au portail',
    });
    expect(texteEchec(lue({ echec: { motif: 'AU_HASARD', note: null } }))).toEqual({ titre: 'Échec', note: null });
    expect(texteEchec(lue({ echec: null }))).toBeNull();
    expect(texteEchec(lue())).toBeNull();
  });

  test('appli du livreur : seulement fermée ou en arrière-plan, jamais sans les champs', () => {
    const livreur = (champs) => ({ id: 'liv-1', nom: 'Koffi Yao', telephone: null, etat: 'vers_client', ...champs });
    const maintenant = new Date(ISO('12:55'));
    expect(
      appliLivreurLivraison(lue({ livreur: livreur({ appli_active: false, appli_vue_a: ISO('12:49'), appli_connectee: false }) }), maintenant),
    ).toMatchObject({ cas: 'FERMEE', libelle: 'Appli fermée', vue: 'vue il y a 6 min' });
    expect(
      appliLivreurLivraison(lue({ livreur: livreur({ appli_active: true, appli_vue_a: ISO('12:54'), appli_connectee: false }) }), maintenant),
    ).toMatchObject({ cas: 'ARRIERE_PLAN', libelle: 'En arrière-plan' });
    expect(
      appliLivreurLivraison(lue({ livreur: livreur({ appli_active: true, appli_vue_a: ISO('12:54'), appli_connectee: true }) }), maintenant),
    ).toBeNull();
    // Serveur plus ancien (champs absents), Turbo, livraison finie : rien.
    expect(appliLivreurLivraison(lue({ livreur: livreur({}) }), maintenant)).toBeNull();
    expect(
      appliLivreurLivraison(lue({ service: 'TURBO', livreur: livreur({ appli_active: false, appli_connectee: false }) }), maintenant),
    ).toBeNull();
    expect(
      appliLivreurLivraison(
        lue({ livreur: livreur({ etat: 'livree', appli_active: false, appli_connectee: false }) }),
        maintenant,
      ),
    ).toBeNull();
  });
});

describe('aucun texte avec tiret cadratin', () => {
  test('libellés, frise, total', () => {
    const l = lue({
      livreur: { id: 'l', nom: 'Andy', telephone: null, etat: 'livree' },
      etapes: [
        { cle: 'acceptee', heure: ISO('12:30'), prevue: null },
        { cle: 'livree', heure: ISO('12:54'), prevue: null },
      ],
      durees: { vers_restaurant_s: 1, attente_comptoir_s: 2, vers_client_s: 3, pret_a_livre_s: 1680 },
    });
    const textes = [
      ...lignesFrise(l).flatMap((x) => [x.libelle, x.heure, x.prevue, x.duree]),
      texteTotal(l),
      etatLivraison(l)?.libelle,
      ...['recherche', 'proposee', 'vers_restaurant', 'au_comptoir', 'vers_client', 'annulee'].map(
        (etat) => etatLivraison(lue({ livreur: { id: 'l', nom: null, telephone: null, etat } }))?.libelle,
      ),
    ].filter(Boolean);
    for (const t of textes) expect(t).not.toContain('—');
  });
});

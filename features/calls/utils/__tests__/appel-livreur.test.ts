// @ts-nocheck -- lancé par `bun test` (intégré à Bun) : ses types ne sont pas installés dans le backoffice.
import { describe, expect, test } from 'bun:test';

import {
  detailDepuisServeur,
  detailLivreur,
  lignesSonnerieLivreur,
  lireAppelantLivreur,
  livreurAAppeler,
  livreurAppelable,
  livreurDeLAppel,
  nomLivreur,
  peutAppelerLivreur,
  rappelLivreur,
  telephoneLisible,
  texteErreurAppelLivreur,
  texteFinAppelLivreur,
  texteSansConnexion,
  titreBoutonAppel,
} from '../appel-livreur';

/**
 * Appels avec les livreurs (24/10), contrat du serveur au commit e00a1bd :
 * sonnerie d'un appel venant d'un livreur, bouton « Appeler » réservé à
 * l'admin et au service client, historique qui nomme le livreur, refus du
 * serveur en phrases courtes.
 */

/** `call:incoming` tel que le serveur l'envoie quand un livreur appelle. */
const appelEntrant = (livreur = {}) => ({
  callId: 'call-1',
  room: 'cn-livreur-abc',
  callerId: 'liv-koffi',
  callerName: 'Koffi Kouassi',
  callerType: 'DELIVERER',
  targetKind: 'CALL_CENTER',
  targetLabel: 'Call Center',
  startedAt: '2026-10-24T18:00:00.000Z',
  livreur: {
    id: 'liv-koffi',
    nom: 'Koffi Kouassi',
    telephone: '+2250701020304',
    restaurant: 'Angré',
    course_reference: 'CRS-A1',
    ...livreur,
  },
});

/** Erreur telle que `apiRequest` la lève (src/services/api.ts). */
const erreurApi = (status, message, code) =>
  Object.assign(new Error(message), { status }, code ? { code } : {});

describe('sonnerie : appel venant d’un livreur', () => {
  test('nom, téléphone lisible, restaurant et course', () => {
    const a = lireAppelantLivreur(appelEntrant());
    expect(a).toEqual({
      id: 'liv-koffi',
      nom: 'Koffi Kouassi',
      telephone: '+2250701020304',
      restaurant: 'Angré',
      courseReference: 'CRS-A1',
    });
    expect(lignesSonnerieLivreur(a)).toEqual({
      sousTitre: 'Livreur · Angré',
      telephone: '+225 07 01 02 03 04',
      course: 'Course CRS-A1',
    });
  });

  test('sans course ni restaurant : pas de ligne de course, « Livreur » seul', () => {
    const a = lireAppelantLivreur(appelEntrant({ restaurant: null, course_reference: null }));
    expect(lignesSonnerieLivreur(a)).toEqual({ sousTitre: 'Livreur', telephone: '+225 07 01 02 03 04', course: null });
  });

  test('un appel du personnel n’est pas un appel de livreur', () => {
    const e = { ...appelEntrant(), callerType: 'RESTAURANT', livreur: undefined };
    expect(lireAppelantLivreur(e)).toBeNull();
  });

  test('champ livreur absent : le nom de l’appel, puis « Livreur »', () => {
    expect(lireAppelantLivreur({ ...appelEntrant(), livreur: undefined }).nom).toBe('Koffi Kouassi');
    expect(lireAppelantLivreur({ ...appelEntrant(), callerName: '', livreur: undefined }).nom).toBe('Livreur');
  });

  test('une ligne pour la notification et le panneau', () => {
    expect(detailLivreur('Angré', 'CRS-A1')).toBe('Livreur · Angré · Course CRS-A1');
    expect(detailLivreur(null, 'CRS-A1')).toBe('Livreur · Course CRS-A1');
    expect(detailLivreur('Angré', null)).toBe('Livreur · Angré');
    expect(detailDepuisServeur(appelEntrant().livreur)).toBe('Livreur · Angré · Course CRS-A1');
    expect(detailDepuisServeur(null)).toBeNull();
  });

  test('téléphone : un numéro ivoirien groupé par deux, le reste tel quel', () => {
    expect(telephoneLisible('2250701020304')).toBe('+225 07 01 02 03 04');
    expect(telephoneLisible('+33612345678')).toBe('+33612345678');
    expect(telephoneLisible('  ')).toBeNull();
  });
});

describe('bouton « Appeler » : qui le voit', () => {
  test('admin et service client avec le droit de lire les appels', () => {
    expect(peutAppelerLivreur('ADMIN', true)).toBe(true);
    expect(peutAppelerLivreur('CALL_CENTER', true)).toBe(true);
  });

  test('sans le droit des appels : rien, même pour le service client', () => {
    expect(peutAppelerLivreur('CALL_CENTER', false)).toBe(false);
    expect(peutAppelerLivreur('ADMIN', false)).toBe(false);
  });

  test('les autres rôles ne le voient pas (LIVRAISON_OPS en lecture seule)', () => {
    for (const role of ['LIVRAISON_OPS', 'MARKETING', 'COMPTABLE', 'MANAGER', 'ASSISTANT_MANAGER', 'CAISSIER', 'CUISINE']) {
      expect([role, peutAppelerLivreur(role, true)]).toEqual([role, false]);
    }
    expect(peutAppelerLivreur(null, true)).toBe(false);
  });

  test('seulement un livreur actif (le serveur refuse les autres)', () => {
    expect(livreurAppelable('ACTIVE')).toBe(true);
    for (const statut of ['NEW', 'INACTIVE', 'DELETED', undefined]) {
      expect(livreurAppelable(statut)).toBe(false);
    }
  });

  test('titre du bouton', () => {
    expect(titreBoutonAppel('Koffi Kouassi')).toBe('Appeler Koffi Kouassi');
    expect(titreBoutonAppel('')).toBe('Appeler le livreur');
  });

  test('nom de la fiche : prénom et nom, sinon le téléphone', () => {
    expect(nomLivreur({ first_name: 'Koffi', last_name: 'Kouassi', phone: '+2250701020304' })).toBe('Koffi Kouassi');
    expect(nomLivreur({ first_name: null, last_name: ' ', phone: '+2250701020304' })).toBe('+2250701020304');
    expect(nomLivreur(null)).toBeNull();
  });
});

describe('tiroir de commande : section Livraison', () => {
  const livraison = (service, livreur) => ({ service, livreur });

  test('livreur Chicken Nation sur la commande : on peut l’appeler', () => {
    expect(
      livreurAAppeler(livraison('CHICKEN_NATION', { id: 'liv-koffi', nom: 'Koffi Kouassi', etat: 'vers_client' })),
    ).toEqual({ delivererId: 'liv-koffi', nom: 'Koffi Kouassi' });
  });

  test('livreur Turbo : pas notre appli, pas de bouton', () => {
    expect(livreurAAppeler(livraison('TURBO', { id: 't-1', nom: 'Awa', etat: 'vers_client' }))).toBeNull();
  });

  test('pendant la recherche ou une offre en attente : pas de bouton', () => {
    expect(livreurAAppeler(livraison('CHICKEN_NATION', { id: 'liv-awa', nom: 'Awa', etat: 'proposee' }))).toBeNull();
    expect(livreurAAppeler(livraison('CHICKEN_NATION', { id: null, nom: null, etat: 'recherche' }))).toBeNull();
  });

  test('sans identifiant ni livreur : pas de bouton', () => {
    expect(livreurAAppeler(livraison('CHICKEN_NATION', { id: null, nom: 'Koffi', etat: 'vers_client' }))).toBeNull();
    expect(livreurAAppeler(livraison('CHICKEN_NATION', null))).toBeNull();
    expect(livreurAAppeler(null)).toBeNull();
  });
});

describe('refus du serveur en phrases courtes', () => {
  test('appels coupés (réglage calls.livreurs_actif)', () => {
    const e = erreurApi(403, 'Les appels avec les livreurs sont désactivés (réglage calls.livreurs_actif).', 'APPELS_LIVREURS_DESACTIVES');
    expect(texteErreurAppelLivreur(e)).toBe('Les appels avec les livreurs sont coupés.');
  });

  test('livreur déjà en appel (409)', () => {
    expect(texteErreurAppelLivreur(erreurApi(409, 'Ce livreur est déjà en communication', 'APPEL_EN_COURS'))).toBe(
      'Ce livreur est déjà en appel.',
    );
    expect(texteErreurAppelLivreur(erreurApi(409, 'x'))).toBe('Ce livreur est déjà en appel.');
  });

  test('service indisponible (503, Lunion ne répond pas)', () => {
    const e = erreurApi(503, 'Erreur temporaire du serveur. Réessayez plus tard.', 'APPELS_INDISPONIBLES');
    expect(texteErreurAppelLivreur(e)).toBe("Service d'appel indisponible, réessayez dans un instant.");
    expect(texteErreurAppelLivreur(erreurApi(502, 'x'))).toBe("Service d'appel indisponible, réessayez dans un instant.");
  });

  test('livreur introuvable, profil refusé, autre erreur', () => {
    expect(texteErreurAppelLivreur(erreurApi(404, 'Ressource non trouvée.'))).toBe('Livreur introuvable.');
    expect(texteErreurAppelLivreur(erreurApi(403, "Votre profil n'est pas autorisé à appeler un livreur"))).toBe(
      'Votre profil ne peut pas appeler un livreur.',
    );
    expect(texteErreurAppelLivreur(new Error('Failed to fetch'))).toBe("Impossible d'appeler le livreur.");
    expect(texteErreurAppelLivreur(undefined)).toBe("Impossible d'appeler le livreur.");
  });

  test('session expirée : le texte reste', () => {
    expect(texteErreurAppelLivreur(new Error('Session expirée, veuillez vous reconnecter.'))).toBe(
      'Session expirée, veuillez vous reconnecter.',
    );
  });
});

describe('fin de sonnerie et appli fermée', () => {
  test('refusé ou sans réponse : une phrase ; autre raison : rien', () => {
    expect(texteFinAppelLivreur('rejected', 'Koffi Kouassi')).toBe("Koffi Kouassi n'est pas disponible");
    expect(texteFinAppelLivreur('no-answer', 'Koffi Kouassi')).toBe("Koffi Kouassi n'a pas répondu");
    expect(texteFinAppelLivreur('hangup', 'Koffi Kouassi')).toBeNull();
    expect(texteFinAppelLivreur('cancelled', 'Koffi Kouassi')).toBeNull();
  });

  test('livreur sans l’appli ouverte : il reçoit une notification', () => {
    expect(texteSansConnexion('DELIVERER', 'Koffi Kouassi')).toBe(
      "Koffi Kouassi n'a pas l'appli ouverte, il reçoit une notification.",
    );
    expect(texteSansConnexion('RESTAURANT', 'Angré')).toBe("Personne n'est connecté pour l'instant, ça sonne quand même.");
  });
});

describe('historique : il nomme le livreur', () => {
  const koffi = {
    id: 'liv-koffi',
    first_name: 'Koffi',
    last_name: 'Kouassi',
    phone: '+2250701020304',
    restaurant: { id: 'r-angre', name: 'Angré' },
  };
  /** Ligne de `GET /calls/history` d'un appel du livreur vers le service client. */
  const entrant = {
    id: 'call-1',
    status: 'MISSED',
    caller_id: null,
    caller_type: 'DELIVERER',
    caller_deliverer_id: 'liv-koffi',
    caller_deliverer: koffi,
    target_kind: 'CALL_CENTER',
    target_deliverer: null,
    course: { id: 'crs-1', reference: 'CRS-A1' },
  };
  /** Appel du service client vers le livreur. */
  const sortant = {
    id: 'call-2',
    status: 'ENDED',
    caller_id: 'u-agent',
    caller_type: 'BACKOFFICE',
    caller_deliverer_id: null,
    target_kind: 'DELIVERER',
    target_deliverer_id: 'liv-koffi',
    target_deliverer: koffi,
    course: null,
  };

  test('le livreur qui a appelé', () => {
    expect(livreurDeLAppel(entrant)).toEqual({
      id: 'liv-koffi',
      nom: 'Koffi Kouassi',
      restaurant: 'Angré',
      courseReference: 'CRS-A1',
      sens: 'entrant',
    });
  });

  test('le livreur appelé', () => {
    expect(livreurDeLAppel(sortant)).toEqual({
      id: 'liv-koffi',
      nom: 'Koffi Kouassi',
      restaurant: 'Angré',
      courseReference: null,
      sens: 'sortant',
    });
  });

  test('appel entre membres du personnel : pas de livreur', () => {
    expect(livreurDeLAppel({ ...sortant, target_kind: 'RESTAURANT', target_deliverer: null })).toBeNull();
  });

  test('rappeler : le livreur lui-même, pour qui a le droit', () => {
    expect(rappelLivreur(entrant, 'CALL_CENTER', true)).toEqual({
      delivererId: 'liv-koffi',
      nom: 'Koffi Kouassi',
      detail: 'Livreur · Angré',
    });
    expect(rappelLivreur(entrant, 'MANAGER', true)).toBeNull();
    expect(rappelLivreur(entrant, 'CALL_CENTER', false)).toBeNull();
  });
});

// @ts-nocheck -- lancé par `bun test` (intégré à Bun) : ses types ne sont pas installés dans le backoffice.
import { describe, expect, test } from 'bun:test';

import {
  clientDeLAppel,
  detailAppelClient,
  detailClient,
  detailClientDepuisServeur,
  estAppelClient,
  lignesSonnerieClient,
  lireAppelantClient,
  nomClient,
  peutAppelerClient,
  rappelClient,
  texteClientSansConnexion,
  texteErreurAppelClient,
  texteFinAppelClient,
  titreBoutonAppelClient,
} from '../appel-client';
import { lireAppelantLivreur } from '../appel-livreur';

/**
 * Appels avec les clients dans l'appli (26/11), contrat du serveur au commit
 * 3cea51a : sonnerie d'un appel venant d'un client, bouton « Appeler dans
 * l'appli » réservé à l'admin et au service client, historique qui nomme le
 * client, refus du serveur en phrases courtes.
 */

/** `call:incoming` tel que le serveur l'envoie quand un client appelle. */
const appelEntrant = (client = {}) => ({
  callId: 'call-1',
  room: 'cn-client-abc',
  callerId: 'cli-awa',
  callerName: 'Awa Koné',
  callerType: 'CUSTOMER',
  targetKind: 'CALL_CENTER',
  targetLabel: 'Call Center',
  startedAt: '2026-11-26T12:00:00.000Z',
  client: {
    id: 'cli-awa',
    nom: 'Awa Koné',
    telephone: '+2250707070707',
    commande_id: 'ord-1',
    commande_reference: 'ORD-261126-00042',
    ...client,
  },
});

/** Erreur telle que `apiRequest` la lève (src/services/api.ts). */
const erreurApi = (status, message, code) =>
  Object.assign(new Error(message), { status }, code ? { code } : {});

describe('sonnerie : appel venant d’un client', () => {
  test('nom, téléphone lisible et commande', () => {
    const a = lireAppelantClient(appelEntrant());
    expect(a).toEqual({
      id: 'cli-awa',
      nom: 'Awa Koné',
      telephone: '+2250707070707',
      commandeId: 'ord-1',
      commandeReference: 'ORD-261126-00042',
    });
    expect(lignesSonnerieClient(a)).toEqual({
      sousTitre: 'Client',
      telephone: '+225 07 07 07 07 07',
      commande: 'Commande ORD-261126-00042',
    });
  });

  test('sans commande : pas de ligne de commande, « Client » seul', () => {
    const a = lireAppelantClient(appelEntrant({ commande_id: null, commande_reference: null }));
    expect(lignesSonnerieClient(a).commande).toBeNull();
    expect(detailAppelClient(a)).toBe('Client');
  });

  test('un appel du personnel ou d’un livreur n’est pas un appel de client', () => {
    expect(lireAppelantClient({ ...appelEntrant(), callerType: 'BACKOFFICE' })).toBeNull();
    expect(lireAppelantClient({ ...appelEntrant(), callerType: 'DELIVERER' })).toBeNull();
    expect(estAppelClient(null)).toBe(false);
    // Et un appel de client n'est pas pris pour un appel de livreur.
    expect(lireAppelantLivreur(appelEntrant())).toBeNull();
  });

  test('champ client absent : le nom de l’appel, puis « Client »', () => {
    expect(lireAppelantClient({ ...appelEntrant(), client: null }).nom).toBe('Awa Koné');
    expect(lireAppelantClient({ ...appelEntrant(), client: null, callerName: '' }).nom).toBe('Client');
  });

  test('une ligne pour la notification et le panneau', () => {
    expect(detailAppelClient(lireAppelantClient(appelEntrant()))).toBe('Client · Commande ORD-261126-00042');
    expect(detailClient(null)).toBe('Client');
    expect(detailClientDepuisServeur(appelEntrant().client)).toBe('Client · Commande ORD-261126-00042');
    expect(detailClientDepuisServeur(null)).toBeNull();
  });
});

describe('bouton « Appeler dans l’appli » : qui le voit', () => {
  test('l’admin et le service client, avec le droit de lire les appels', () => {
    expect(peutAppelerClient('ADMIN', true)).toBe(true);
    expect(peutAppelerClient('CALL_CENTER', true)).toBe(true);
    expect(peutAppelerClient('CALL_CENTER', false)).toBe(false);
  });

  test('ni le marketing, ni un restaurant, ni les opérations de livraison', () => {
    for (const role of ['MARKETING', 'MANAGER', 'CAISSIER', 'LIVRAISON_OPS', null, undefined]) {
      expect(peutAppelerClient(role, true)).toBe(false);
    }
  });

  test('titre du bouton', () => {
    expect(titreBoutonAppelClient('Awa Koné')).toBe("Appeler Awa Koné dans l'appli");
    expect(titreBoutonAppelClient('')).toBe("Appeler le client dans l'appli");
  });
});

describe('refus du serveur, en une phrase', () => {
  test('appli du client pas à jour : appeler au téléphone', () => {
    const e = erreurApi(409, "L'appli de ce client ne peut pas recevoir d'appel.", 'CLIENT_SANS_APPLI');
    expect(texteErreurAppelClient(e)).toBe(
      "L'appli de ce client ne peut pas recevoir d'appel. Appelez-le au téléphone.",
    );
  });

  test('client déjà en appel', () => {
    expect(texteErreurAppelClient(erreurApi(409, 'x', 'APPEL_EN_COURS'))).toBe('Ce client est déjà en appel.');
    expect(texteErreurAppelClient(erreurApi(409, 'x'))).toBe('Ce client est déjà en appel.');
  });

  test('appels coupés (réglage calls.clients_actif)', () => {
    expect(texteErreurAppelClient(erreurApi(403, 'x', 'APPELS_CLIENTS_DESACTIVES'))).toBe(
      "Les appels avec les clients dans l'appli sont coupés.",
    );
  });

  test('service d’appel muet, client introuvable, profil non autorisé, autre', () => {
    expect(texteErreurAppelClient(erreurApi(503, 'x', 'APPELS_INDISPONIBLES'))).toBe(
      "Service d'appel indisponible, réessayez dans un instant.",
    );
    expect(texteErreurAppelClient(erreurApi(404, 'x'))).toBe('Client introuvable.');
    expect(texteErreurAppelClient(erreurApi(403, 'x'))).toBe(
      "Votre profil ne peut pas appeler un client dans l'appli.",
    );
    expect(texteErreurAppelClient(new Error('boum'))).toBe("Impossible d'appeler le client dans l'appli.");
    expect(texteErreurAppelClient(new Error('Session expirée, reconnectez-vous'))).toBe(
      'Session expirée, reconnectez-vous',
    );
  });

  test('client sans l’appli ouverte : une notification part quand même', () => {
    expect(texteClientSansConnexion('Awa Koné')).toBe(
      "Awa Koné n'a pas l'appli ouverte : une notification lui est envoyée.",
    );
  });

  test('fin avant la réponse : refusé ou sans réponse, sinon rien', () => {
    expect(texteFinAppelClient('rejected', 'Awa Koné')).toBe("Awa Koné n'est pas disponible");
    expect(texteFinAppelClient('no-answer', 'Awa Koné')).toBe("Awa Koné n'a pas répondu");
    expect(texteFinAppelClient('hangup', 'Awa Koné')).toBeNull();
  });
});

describe('historique', () => {
  const base = {
    id: 'call-1',
    room_slug: 'r',
    status: 'ENDED',
    caller_id: null,
    started_at: '2026-11-26T12:00:00.000Z',
  };
  const awa = { id: 'cli-awa', first_name: 'Awa', last_name: 'Koné', phone: '+2250707070707' };

  test('le client a appelé : son nom, sa commande, sens entrant', () => {
    const appel = {
      ...base,
      caller_type: 'CUSTOMER',
      caller_customer_id: 'cli-awa',
      caller_customer: awa,
      target_kind: 'CALL_CENTER',
      order: { id: 'ord-1', reference: 'ORD-261126-00042' },
    };
    expect(clientDeLAppel(appel)).toEqual({
      id: 'cli-awa',
      nom: 'Awa Koné',
      commandeId: 'ord-1',
      commandeReference: 'ORD-261126-00042',
      sens: 'entrant',
    });
  });

  test('on a appelé le client : sens sortant ; sans nom, son numéro', () => {
    const appel = {
      ...base,
      caller_id: 'u1',
      caller_type: 'BACKOFFICE',
      target_kind: 'CUSTOMER',
      target_customer_id: 'cli-awa',
      target_customer: { ...awa, first_name: null, last_name: null },
    };
    expect(clientDeLAppel(appel)).toMatchObject({ id: 'cli-awa', nom: '+2250707070707', sens: 'sortant' });
    expect(nomClient(null)).toBeNull();
  });

  test('un appel entre membres du personnel n’a pas de client', () => {
    expect(clientDeLAppel({ ...base, caller_id: 'u1', caller_type: 'BACKOFFICE', target_kind: 'RESTAURANT' })).toBeNull();
  });

  test('rappeler : le client lui-même, dans l’appli, avec sa commande', () => {
    const appel = {
      ...base,
      caller_type: 'CUSTOMER',
      caller_customer_id: 'cli-awa',
      caller_customer: awa,
      target_kind: 'CALL_CENTER',
      order: { id: 'ord-1', reference: 'ORD-261126-00042' },
    };
    expect(rappelClient(appel, 'CALL_CENTER', true)).toEqual({
      customerId: 'cli-awa',
      orderId: 'ord-1',
      nom: 'Awa Koné',
      detail: 'Client · Commande ORD-261126-00042',
    });
    expect(rappelClient(appel, 'MARKETING', true)).toBeNull();
    expect(rappelClient(appel, 'CALL_CENTER', false)).toBeNull();
  });
});

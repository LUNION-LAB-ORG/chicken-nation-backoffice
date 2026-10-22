// @ts-nocheck -- lancé par `bun test` (intégré à Bun) : ses types ne sont pas installés dans le backoffice.
import { describe, expect, test } from 'bun:test';

import { getHumanReadableError } from '../../../../src/utils/errorMessages';
import { estMessageLisible, messageErreurOperations } from '../message-erreur';

/**
 * Incident du 22/10 : la caissière tape le code dicté par le livreur, le
 * serveur répond 400 « 1 commande(s) sur 1 ne sont pas encore prête(s) » (la
 * course d'un AUTRE restaurant, même code), et l'écran affichait « Les
 * informations saisies ne sont pas valides… », le texte des promotions.
 * Le module Opérations affiche désormais le texte du serveur.
 */

/** Erreur telle que `apiRequest` la lève (src/services/api.ts). */
const erreurApi = (status, message, messageServeur) =>
  Object.assign(new Error(message), messageServeur ? { status, messageServeur } : { status });

describe("message d'erreur Opérations : le texte du serveur", () => {
  test("l'incident : le refus du serveur au lieu du texte des promotions", () => {
    const erreur = erreurApi(400, '1 commande(s) sur 1 ne sont pas encore prête(s)');
    // Avant : la phrase creuse.
    expect(getHumanReadableError(erreur)).toBe(
      'Les informations saisies ne sont pas valides. Veuillez vérifier votre saisie.',
    );
    // Maintenant : ce que dit le serveur.
    expect(messageErreurOperations(erreur)).toBe('1 commande(s) sur 1 ne sont pas encore prête(s)');
  });

  test('commande pas prête : la référence et le statut en français', () => {
    const texte =
      'La commande ORD-261022-00042 est encore « En préparation » : marquez-la prête avant de la remettre.';
    expect(messageErreurOperations(erreurApi(400, texte))).toBe(texte);
  });

  test('course de dix commandes pas prêtes (plafond du réglage) : le refus du serveur en entier', () => {
    // Texte du serveur (`messageCommandesPasPretes`) : 318 caractères dès six
    // commandes. Un plafond à 300 le remplaçait par « La demande a été refusée ».
    const commandes = Array.from({ length: 10 }, (_, i) => `ORD-261022-1234${i} (« En préparation »)`);
    const texte = `Les commandes ${commandes.slice(0, -1).join(', ')} et ${commandes[9]} ne sont pas encore prêtes : marquez-les prêtes avant de les remettre.`;
    expect(texte.length).toBeGreaterThan(300);
    expect(messageErreurOperations(erreurApi(400, texte))).toBe(texte);
  });

  test('404 : le refus du serveur gardé à côté (`messageServeur`), pas « Ressource non trouvée. »', () => {
    const texte =
      "Aucune course en cours avec ce code dans ce restaurant aujourd'hui. Vérifiez le code dicté par le livreur.";
    expect(messageErreurOperations(erreurApi(404, 'Ressource non trouvée.', texte))).toBe(texte);
  });

  test('409 : code présent dans plusieurs restaurants', () => {
    const texte = 'Ce code existe dans plusieurs restaurants : choisissez le restaurant.';
    expect(messageErreurOperations(erreurApi(409, texte))).toBe(texte);
    // Le texte des promotions, pour mémoire.
    expect(getHumanReadableError(erreurApi(409, texte))).toContain('promotion');
  });

  test('403 : autre restaurant que le sien', () => {
    const texte = 'Vous ne pouvez valider que les courses de votre restaurant.';
    expect(messageErreurOperations(erreurApi(403, texte))).toBe(texte);
  });

  test('les autres appels du module : encaissement refusé', () => {
    expect(messageErreurOperations(erreurApi(400, 'Commande déjà payée'))).toBe('Commande déjà payée');
    expect(messageErreurOperations(erreurApi(404, 'Ressource non trouvée.', 'Commande introuvable'))).toBe(
      'Commande introuvable',
    );
  });

  test('session expirée (401 relu par `apiRequest`, sans statut)', () => {
    expect(messageErreurOperations(new Error('Session expirée, veuillez vous reconnecter.'))).toBe(
      'Session expirée, veuillez vous reconnecter.',
    );
  });
});

describe("message d'erreur Opérations : repli lisible", () => {
  test('texte technique du serveur : le texte de `apiRequest` à la place', () => {
    expect(
      messageErreurOperations(
        erreurApi(500, 'Erreur temporaire du serveur. Réessayez plus tard.', 'Internal server error'),
      ),
    ).toBe('Erreur temporaire du serveur. Réessayez plus tard.');
  });

  test('intitulés bruts de NestJS : un repli selon le statut', () => {
    expect(messageErreurOperations(erreurApi(403, 'Forbidden resource'))).toBe(
      "Vous n'avez pas les droits pour cette action.",
    );
    expect(messageErreurOperations(erreurApi(400, 'Bad Request'))).toBe(
      'La demande a été refusée. Vérifiez la saisie et réessayez.',
    );
    expect(messageErreurOperations(erreurApi(400, 'Requête invalide (400)'))).toBe(
      'La demande a été refusée. Vérifiez la saisie et réessayez.',
    );
    expect(messageErreurOperations(erreurApi(404, 'Cannot GET /api/v1/courses/operations/x'))).toBe(
      'Introuvable. Actualisez la page et réessayez.',
    );
  });

  test('JSON ou HTML brut : jamais affiché', () => {
    expect(messageErreurOperations(erreurApi(400, '{"statusCode":400}'))).toBe(
      'La demande a été refusée. Vérifiez la saisie et réessayez.',
    );
    expect(messageErreurOperations(erreurApi(502, '<html>Bad Gateway</html>'))).toBe(
      'Erreur temporaire du serveur. Réessayez dans quelques instants.',
    );
  });

  test('réseau coupé : le texte du navigateur (anglais) remplacé', () => {
    for (const texte of ['Failed to fetch', 'Load failed', 'NetworkError when attempting to fetch resource.']) {
      expect(messageErreurOperations(new TypeError(texte))).toBe(
        'Problème de connexion. Vérifiez la connexion internet et réessayez.',
      );
    }
  });

  test('rien d’utile : le repli général', () => {
    for (const erreur of [undefined, null, {}, new Error(''), 42]) {
      expect(messageErreurOperations(erreur)).toBe('Une erreur est survenue. Veuillez réessayer.');
    }
  });

  test('erreur sous forme de texte', () => {
    expect(messageErreurOperations('Le livreur a déjà récupéré la course.')).toBe(
      'Le livreur a déjà récupéré la course.',
    );
  });

  test('lisible : ni trop court, ni trop long, pas technique', () => {
    expect(estMessageLisible('Code inconnu.')).toBe(true);
    expect(estMessageLisible('Non')).toBe(false);
    expect(estMessageLisible('x'.repeat(600))).toBe(true);
    expect(estMessageLisible('x'.repeat(601))).toBe(false);
    expect(estMessageLisible('TypeError: x is undefined')).toBe(false);
    expect(estMessageLisible(['Le code retrait doit comporter exactement 3 chiffres'])).toBe(false);
  });
});

// @ts-nocheck -- lancé par `bun test` (intégré à Bun) : ses types ne sont pas installés dans le backoffice.
import { describe, expect, test } from 'bun:test';

import { AUCUN_LIVREUR_EN_SERVICE, pastillesLivreurs, restaurantDeLaLigne, texteLivreurDeLigne } from '../ligne-livreurs';

/**
 * Ligne Livreurs de l'écran Commandes (conception du 24/10, 6.2) : une
 * pastille par livreur en service, « Koffi au restaurant », « Yao 1er de la
 * file », dans l'ordre du serveur.
 */

const livreur = (partiel) => ({ id: partiel.prenom ?? 'x', prenom: null, rang_file: null, course: null, ...partiel });

describe('texte de chaque pastille', () => {
  test('en course : au restaurant, vers le restaurant, en livraison', () => {
    expect(
      texteLivreurDeLigne(livreur({ prenom: 'Koffi', etat: 'EN_COURSE', course: { reference: 'CRS-1', statut: 'AT_RESTAURANT' } })),
    ).toBe('Koffi au restaurant');
    expect(
      texteLivreurDeLigne(livreur({ prenom: 'Koffi', etat: 'EN_COURSE', course: { reference: 'CRS-1', statut: 'ACCEPTED' } })),
    ).toBe('Koffi vers le restaurant');
    expect(
      texteLivreurDeLigne(livreur({ prenom: 'Awa', etat: 'EN_COURSE', course: { reference: 'CRS-2', statut: 'IN_DELIVERY' } })),
    ).toBe('Awa en livraison');
  });

  test('disponible : place dans la file, sinon « disponible »', () => {
    expect(texteLivreurDeLigne(livreur({ prenom: 'Yao', etat: 'DISPONIBLE', rang_file: 1 }))).toBe('Yao 1er de la file');
    expect(texteLivreurDeLigne(livreur({ prenom: 'Yao', etat: 'DISPONIBLE', rang_file: 3 }))).toBe('Yao 3e de la file');
    expect(texteLivreurDeLigne(livreur({ prenom: 'Yao', etat: 'DISPONIBLE' }))).toBe('Yao disponible');
  });

  test('offre, pauses, appli fermée (injoignable compris)', () => {
    expect(texteLivreurDeLigne(livreur({ prenom: 'Inès', etat: 'OFFRE_EN_ATTENTE' }))).toBe('Inès offre en attente');
    expect(texteLivreurDeLigne(livreur({ prenom: 'Diane', etat: 'EN_PAUSE' }))).toBe('Diane en pause');
    expect(texteLivreurDeLigne(livreur({ prenom: 'Diane', etat: 'PAUSE_AUTO' }))).toBe('Diane pause automatique');
    expect(texteLivreurDeLigne(livreur({ prenom: 'Ali', etat: 'APPLI_FERMEE' }))).toBe('Ali appli fermée');
    expect(texteLivreurDeLigne(livreur({ prenom: 'Ali', etat: 'INJOIGNABLE' }))).toBe('Ali appli fermée');
  });

  test('sans prénom : « Livreur »', () => {
    expect(texteLivreurDeLigne(livreur({ id: 'z', etat: 'EN_PAUSE' }))).toBe('Livreur en pause');
  });
});

describe('pastilles', () => {
  test('hors service et inactifs absents, ordre du serveur gardé, couleur de l’état', () => {
    const pastilles = pastillesLivreurs([
      livreur({ prenom: 'Yao', etat: 'DISPONIBLE', rang_file: 1 }),
      livreur({ prenom: 'Koffi', etat: 'EN_COURSE', course: { reference: 'CRS-1', statut: 'AT_RESTAURANT' } }),
      livreur({ prenom: 'Seydou', etat: 'HORS_SERVICE' }),
      livreur({ prenom: 'Bakary', etat: 'INACTIF' }),
      livreur({ prenom: 'Ali', etat: 'INJOIGNABLE' }),
    ]);
    expect(pastilles).toEqual([
      { id: 'Yao', etat: 'DISPONIBLE', texte: 'Yao 1er de la file' },
      { id: 'Koffi', etat: 'EN_COURSE', texte: 'Koffi au restaurant' },
      { id: 'Ali', etat: 'APPLI_FERMEE', texte: 'Ali appli fermée' },
    ]);
  });

  test('personne en service : aucune pastille (l’écran dit « Aucun livreur en service »)', () => {
    expect(pastillesLivreurs([livreur({ prenom: 'Seydou', etat: 'HORS_SERVICE' })])).toEqual([]);
    expect(AUCUN_LIVREUR_EN_SERVICE).toBe('Aucun livreur en service');
  });
});

describe('restaurant de la ligne', () => {
  test('compte de restaurant : le sien, même si un autre est resté choisi', () => {
    expect(restaurantDeLaLigne({ role: 'CAISSIER', type: 'RESTAURANT', restaurant_id: 'angre' }, 'marcory')).toBe('angre');
    expect(restaurantDeLaLigne({ role: 'MANAGER', restaurant_id: 'angre' }, null)).toBe('angre');
    expect(restaurantDeLaLigne({ role: 'MANAGER', restaurant_id: null }, 'marcory')).toBe(null);
  });

  test('compte du siège : le restaurant choisi ; rien sur « Tous »', () => {
    expect(restaurantDeLaLigne({ role: 'ADMIN', type: 'BACKOFFICE', restaurant_id: 'angre' }, 'marcory')).toBe('marcory');
    expect(restaurantDeLaLigne({ role: 'LIVRAISON_OPS', type: 'BACKOFFICE' }, null)).toBe(null);
  });
});

describe('livreur en appel avec le service client (serveur du 24/10)', () => {
  test('« Koffi en appel », couleur des disponibles, jamais retiré de la ligne', () => {
    expect(texteLivreurDeLigne(livreur({ prenom: 'Koffi', etat: 'EN_APPEL' }))).toBe('Koffi en appel');
    expect(pastillesLivreurs([livreur({ prenom: 'Koffi', etat: 'EN_APPEL' })])).toEqual([
      { id: 'Koffi', etat: 'EN_APPEL', texte: 'Koffi en appel' },
    ]);
  });
});

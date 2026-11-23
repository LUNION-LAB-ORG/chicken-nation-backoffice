// @ts-nocheck -- lancé par `bun test` (intégré à Bun) : ses types ne sont pas installés dans le backoffice.
import { describe, expect, test } from 'bun:test';
import {
  ajouterLigne,
  chercherPlats,
  dateCourte,
  departHabitude,
  ligneComposee,
  lignePlatSimple,
  memeLigne,
  messageNonRepris,
  preparerReprise,
  resumeLignes,
  supplementsDuJour,
  texteFois,
} from '../habitudes';

/** Prise de commande : menus habituels, reprise de la dernière commande, recherche d'un plat. */

const supp = (id: string, available = true) => ({ supplement: { id, name: id, price: 200, available } });

const plat = (id: string, extra = {}) => ({
  id,
  name: id,
  price: 4000,
  is_alway_epice: false,
  composable: false,
  dish_supplements: [supp('sauce'), supp('coca'), supp('rupture', false)],
  ...extra,
});

const ligne = (dishId: string, extra = {}) => ({
  dish_id: dishId,
  nom: dishId,
  quantity: 1,
  epice: false,
  supplements: [],
  option_item_ids: [],
  disponible: true,
  ...extra,
});

const item = (dishId: string, extra = {}) => ({
  dish_id: dishId,
  quantity: 1,
  supplements: [],
  epice: false,
  option_item_ids: [],
  ...extra,
});

const groupes = [
  {
    id: 'g1',
    name: 'Format',
    position: 0,
    required: true,
    min_select: 1,
    max_select: 1,
    items: [
      { id: 'menu', label: 'Menu', price_delta: 1500, available: true, position: 0, is_default: true },
      { id: 'xl', label: 'XL', price_delta: 2500, available: false, position: 1, is_default: false },
    ],
  },
];

describe('habitudes : textes', () => {
  test('nombre de fois et résumé d’une commande', () => {
    expect(texteFois(7)).toBe('7 fois');
    expect(resumeLignes([ligne('Burger Patron'), ligne('Frites et boisson', { quantity: 2 })])).toBe(
      '1 x Burger Patron, 2 x Frites et boisson',
    );
  });

  test('date courte : l’année seulement si ce n’est pas celle en cours', () => {
    const maintenant = new Date(2026, 10, 23);
    expect(dateCourte(new Date(2026, 10, 20).toISOString(), maintenant)).toBe('20/11');
    expect(dateCourte(new Date(2025, 0, 5).toISOString(), maintenant)).toBe('05/01/2025');
    expect(dateCourte('pas une date', maintenant)).toBe('');
  });

  test('aucun tiret long dans les textes', () => {
    for (const t of [texteFois(2), messageNonRepris(['A'], ['B'])]) expect(t).not.toMatch(/[–—]/);
  });
});

describe('habitudes : dernière façon de commander un plat', () => {
  test('suppléments : seulement ceux encore vendus avec ce plat', () => {
    expect(
      supplementsDuJour(plat('burger'), [
        { id: 'sauce', quantity: 2 },
        { id: 'rupture', quantity: 1 },
        { id: 'inconnu', quantity: 1 },
        { id: 'coca', quantity: 0 },
      ]),
    ).toEqual([{ id: 'sauce', quantity: 2 }]);
    // Plat sans liste de suppléments : rien n'est repris.
    expect(supplementsDuJour(plat('burger', { dish_supplements: undefined }), [{ id: 'sauce', quantity: 1 }])).toEqual([]);
  });

  test('départ de la fenêtre : épicé, suppléments et choix de la dernière fois', () => {
    expect(
      departHabitude(plat('burger'), {
        epice: true,
        supplements: [{ id: 'sauce', quantity: 1 }, { id: 'inconnu', quantity: 1 }],
        option_item_ids: ['menu'],
      }),
    ).toEqual({ epice: true, supplements: [{ id: 'sauce', quantity: 1 }], option_item_ids: ['menu'] });
    // Plat toujours épicé : épicé d'office.
    expect(departHabitude(plat('braise', { is_alway_epice: true }), { epice: false, supplements: [], option_item_ids: [] }).epice).toBe(true);
  });
});

describe('panier : ajout d’une ligne', () => {
  test('« + » : une unité, sans supplément, épicé seulement si le plat l’est toujours', () => {
    expect(lignePlatSimple(plat('burger'))).toEqual(item('burger'));
    expect(lignePlatSimple(plat('braise', { is_alway_epice: true })).epice).toBe(true);
  });

  test('une ligne identique voit sa quantité augmenter', () => {
    const panier = [item('burger', { quantity: 2 }), item('frites')];
    expect(ajouterLigne(panier, item('burger'))).toEqual([item('burger', { quantity: 3 }), item('frites')]);
  });

  test('épicé, suppléments ou choix différents : une autre ligne', () => {
    const panier = [item('burger')];
    expect(ajouterLigne(panier, item('burger', { epice: true }))).toHaveLength(2);
    expect(ajouterLigne(panier, item('burger', { supplements: [{ id: 'sauce', quantity: 1 }] }))).toHaveLength(2);
    expect(ajouterLigne(panier, item('burger', { option_item_ids: ['menu'] }))).toHaveLength(2);
  });

  test('mêmes suppléments et mêmes choix dans un autre ordre : la même ligne', () => {
    const a = item('burger', {
      supplements: [{ id: 'sauce', quantity: 1 }, { id: 'coca', quantity: 2 }],
      option_item_ids: ['menu', 'piquante'],
    });
    const b = item('burger', {
      supplements: [{ id: 'coca', quantity: 2 }, { id: 'sauce', quantity: 1 }],
      option_item_ids: ['piquante', 'menu'],
    });
    expect(memeLigne(a, b)).toBe(true);
    // Sans le tableau des choix (plat ordinaire d'une ancienne commande) : identique à un tableau vide.
    expect(memeLigne(item('burger'), { ...item('burger'), option_item_ids: undefined })).toBe(true);
  });
});

describe('reprise de la dernière commande', () => {
  const catalogue = new Map([
    ['burger', plat('burger')],
    ['braise', plat('braise', { is_alway_epice: true })],
    ['compose', plat('compose', { composable: true })],
  ]);

  test('plats ordinaires : repris avec leur quantité et leurs suppléments encore vendus', () => {
    const reprise = preparerReprise(
      [
        ligne('burger', { quantity: 2, epice: true, supplements: [{ id: 'sauce', quantity: 1 }, { id: 'rupture', quantity: 1 }] }),
        ligne('braise'),
      ],
      catalogue,
    );
    expect(reprise.lignes).toEqual([
      item('burger', { quantity: 2, epice: true, supplements: [{ id: 'sauce', quantity: 1 }] }),
      item('braise', { epice: true }),
    ]);
    expect(reprise.aVerifier).toEqual([]);
    expect(reprise.retires).toEqual([]);
  });

  test('plat retiré du menu, ou absent du catalogue : non repris, nommé', () => {
    const reprise = preparerReprise(
      [ligne('burger', { disponible: false, nom: 'Burger Patron' }), ligne('fantome', { nom: 'Menu Campus' })],
      catalogue,
    );
    expect(reprise.lignes).toEqual([]);
    expect(reprise.retires).toEqual(['Burger Patron', 'Menu Campus']);
  });

  test('plat composable : ses choix sont à vérifier avant le panier', () => {
    const reprise = preparerReprise([ligne('compose', { option_item_ids: ['menu'] })], catalogue);
    expect(reprise.lignes).toEqual([]);
    expect(reprise.aVerifier.map((v) => v.dish.id)).toEqual(['compose']);
  });

  test('plat composable repris tel quel si ses choix tiennent toujours', () => {
    const p = catalogue.get('compose');
    expect(ligneComposee(ligne('compose', { quantity: 2, option_item_ids: ['menu'] }), p, groupes)).toEqual(
      item('compose', { quantity: 2, option_item_ids: ['menu'] }),
    );
  });

  test('plat composable : choix en rupture, retiré, ou manquant, à composer de nouveau', () => {
    const p = catalogue.get('compose');
    expect(ligneComposee(ligne('compose', { option_item_ids: ['xl'] }), p, groupes)).toBeNull();
    expect(ligneComposee(ligne('compose', { option_item_ids: ['menu', 'disparu'] }), p, groupes)).toBeNull();
    expect(ligneComposee(ligne('compose', { option_item_ids: [] }), p, groupes)).toBeNull();
  });

  test('message : ce qui n’a pas été repris, et pourquoi', () => {
    expect(messageNonRepris([], [])).toBe('');
    expect(messageNonRepris(['Menu Campus'], ['Burger XL'])).toBe(
      'Non repris : Menu Campus (plus au menu), Burger XL (options à choisir)',
    );
  });
});

describe('recherche d’un plat', () => {
  const plats = ['Burger Patron', 'Poulet braisé', 'Menu Étudiant Burger', 'Frites et boisson'].map((name) => ({ name }));
  const noms = (r) => chercherPlats(plats, r).map((p) => p.name);

  test('sans accent ni majuscule, à partir de deux lettres', () => {
    expect(noms('b')).toEqual([]);
    expect(noms('BRAISE')).toEqual(['Poulet braisé']);
    expect(noms('etud')).toEqual(['Menu Étudiant Burger']);
  });

  test('tous les mots, dans n’importe quel ordre ; le nom qui commence par la recherche d’abord', () => {
    expect(noms('burger')).toEqual(['Burger Patron', 'Menu Étudiant Burger']);
    expect(noms('burger menu')).toEqual(['Menu Étudiant Burger']);
    expect(noms('pizza')).toEqual([]);
  });
});

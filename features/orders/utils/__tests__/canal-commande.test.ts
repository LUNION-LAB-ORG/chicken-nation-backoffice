// @ts-nocheck -- lancé par `bun test` (intégré à Bun) : ses types ne sont pas installés dans le backoffice.
import { describe, expect, test } from 'bun:test';
import { COULEURS_CANAL, estDuSite, libelleCanal } from '../canal-commande';
import { CHANNEL_COLORS } from '../../../statistics/utils/chart-config';
import { mapApiOrderToUiOrder } from '../orderMapper';
import { genererTicketEscPos } from '../../../../src/lib/escpos/ticket';
import { TABLE_CP858 } from '../../../../src/lib/escpos/cp858';
// Le jumeau côté serveur (colonne « Source » des exports), lu tel quel.
import { libelleSource } from '../../../../../backend/src/modules/order/helpers/canal-commande.rules';

const CANAUX = ['APP', 'WEB', 'CALL_CENTER', 'RESTAURANT', null, undefined, 'INCONNU'];
const AUTOS = [true, false, null, undefined];

describe('canal d’une commande : écran et exports alignés', () => {
  test('même libellé que la colonne « Source » des exports, pour chaque canal et chaque `auto`', () => {
    for (const channel of CANAUX) {
      for (const auto of AUTOS) {
        expect({ channel, auto, ecran: libelleCanal({ channel, auto }) }).toEqual({
          channel,
          auto,
          ecran: libelleSource({ channel, auto }),
        });
      }
    }
  });

  test('les quatre libellés', () => {
    expect(libelleCanal({ channel: 'WEB', auto: true })).toBe('Site web');
    expect(libelleCanal({ channel: 'RESTAURANT', auto: false })).toBe('Manuel');
    expect(libelleCanal({ channel: 'APP', auto: true })).toBe('Appli');
    expect(libelleCanal({ channel: 'CALL_CENTER', auto: false })).toBe('Manuel');
  });

  test('serveur plus ancien ou commande HubRise : sans canal, retour à `auto`', () => {
    expect(libelleCanal({ auto: true })).toBe('Appli');
    expect(libelleCanal({ auto: false })).toBe('Manuel');
    expect(libelleCanal({ channel: null, auto: false })).toBe('Manuel');
    expect(libelleCanal({})).toBe('Manuel');
  });

  test('commande de l’application reprise au téléphone : « Manuel »', () => {
    expect(libelleCanal({ channel: 'APP', auto: false })).toBe('Manuel');
  });
});

describe('commande du site reprise au téléphone', () => {
  test('devient « Manuel », sans mention ; l’origine reste connue (estDuSite)', () => {
    const reprise = { channel: 'WEB', auto: false };
    expect(libelleCanal(reprise)).toBe('Manuel');
    expect(estDuSite(reprise)).toBe(true);
  });

  test('reste « Site web » tant qu’elle n’est pas reprise, ou si `auto` est inconnu', () => {
    expect(libelleCanal({ channel: 'WEB', auto: true })).toBe('Site web');
    expect(libelleCanal({ channel: 'WEB' })).toBe('Site web');
    expect(libelleCanal({ channel: 'WEB', auto: null })).toBe('Site web');
  });

  test('estDuSite : seul le canal WEB, commande absente comprise', () => {
    expect(estDuSite({ channel: 'WEB' })).toBe(true);
    for (const channel of CANAUX.filter((c) => c !== 'WEB')) expect(estDuSite({ channel, auto: true })).toBe(false);
    expect(estDuSite(null)).toBe(false);
    expect(estDuSite(undefined)).toBe(false);
  });
});

describe('couleurs', () => {
  test('chaque libellé a sa pastille', () => {
    for (const channel of CANAUX) {
      for (const auto of AUTOS) expect(COULEURS_CANAL[libelleCanal({ channel, auto })]).toBeTruthy();
    }
  });

  test('sarcelle pour le site, comme dans les statistiques, et pour lui seul', () => {
    // #14B8A6 est le teal-500 de Tailwind.
    expect(CHANNEL_COLORS.web).toBe('#14B8A6');
    expect(COULEURS_CANAL['Site web']).toContain('teal-');
    for (const [libelle, classes] of Object.entries(COULEURS_CANAL)) {
      if (libelle !== 'Site web') expect(classes).not.toContain('teal-');
    }
  });
});

/** Commande telle que l'API la renvoie, réduite à ce que lisent le mapper et le ticket. */
const commandeApi = (surcharge = {}) => ({
  id: 'o1',
  reference: 'CN-1',
  customer_id: 'c1',
  paied: false,
  delivery_fee: 0,
  delivery_service: 'CHICKEN_NATION',
  zone_id: null,
  points: 0,
  type: 'PICKUP',
  table_type: null,
  places: null,
  address: '',
  code_promo: null,
  tax: 0,
  amount: 5000,
  net_amount: 5000,
  discount: 0,
  date: null,
  time: null,
  fullname: 'Awa',
  phone: '0700000000',
  email: null,
  note: null,
  auto: true,
  payment_method: 'ONLINE',
  status: 'ACCEPTED',
  restaurant_id: 'r1',
  promotion_id: null,
  order_items: [],
  paiements: [],
  created_at: new Date(2026, 9, 2, 12, 0).toISOString(),
  updated_at: new Date(2026, 9, 2, 12, 0).toISOString(),
  ...surcharge,
});

/** Ligne « Source : » du ticket imprimé, décodée depuis CP858. */
function ligneSource(order) {
  // Seuls les octets hors ASCII sont à retraduire (la table renvoie aussi
  // les espaces insécables et les tirets sur des octets ASCII).
  const inverse = Object.fromEntries(Object.entries(TABLE_CP858).filter(([, o]) => o >= 0x80).map(([c, o]) => [o, c]));
  const texte = Array.from(genererTicketEscPos(order, { nom: 'Riviera' }))
    .map((o) => inverse[o] ?? (o >= 0x20 && o < 0x7f ? String.fromCharCode(o) : '\n'))
    .join('');
  return texte.split('\n').find((l) => l.startsWith('Source :'))?.replace(/\s+/g, ' ') ?? null;
}

describe('affichages : liste, détail, tiroir et ticket', () => {
  test('le mapper garde le canal brut ; le libellé se calcule à l’affichage', () => {
    const ui = mapApiOrderToUiOrder(commandeApi({ channel: 'WEB', auto: false }));
    expect(ui.channel).toBe('WEB');
    expect(libelleCanal(ui)).toBe('Manuel');
  });

  test('serveur plus ancien (pas de canal) : `null`, et retour à `auto`', () => {
    const ui = mapApiOrderToUiOrder(commandeApi({ auto: true }));
    expect(ui.channel).toBeNull();
    expect(libelleCanal(ui)).toBe('Appli');
  });

  test('commande mémorisée dans le navigateur avant le canal : libellé tiré de `auto`, jamais vide', () => {
    const { channel, ...ancienne } = mapApiOrderToUiOrder(commandeApi({ channel: 'WEB', auto: false }));
    expect(channel).toBe('WEB');
    expect(libelleCanal(ancienne)).toBe('Manuel');
    expect(COULEURS_CANAL[libelleCanal(ancienne)]).toBeTruthy();
  });

  test('ticket imprimé : « Source : » porte le canal', () => {
    expect(ligneSource(commandeApi({ channel: 'WEB', auto: true }))).toBe('Source : Site web');
    expect(ligneSource(commandeApi({ channel: 'WEB', auto: false }))).toBe('Source : Manuel');
    expect(ligneSource(commandeApi({ channel: 'RESTAURANT', auto: false }))).toBe('Source : Manuel');
    expect(ligneSource(commandeApi({ channel: 'APP', auto: true }))).toBe('Source : Appli');
    expect(ligneSource(commandeApi({ auto: false }))).toBe('Source : Manuel');
  });
});

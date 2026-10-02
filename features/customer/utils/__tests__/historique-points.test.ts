// @ts-nocheck -- lancé par `bun test` (intégré à Bun) : ses types ne sont pas installés dans le backoffice.
import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { mapCustomerData } from '../customer-mapper';
import { CUSTOMER_LOYALTY_POINT_TYPE_MAP, estCreditHistorique } from '../../types/customer-mapper.types';

// Valeurs de l'enum LoyaltyPointType, lues telles quelles dans le schéma du
// serveur : un type ajouté là-bas sans libellé ici fait échouer ce test.
const schema = readFileSync(join(import.meta.dir, '../../../../../backend/prisma/schema.prisma'), 'utf8');
const TYPES_SERVEUR = schema
  .match(/enum LoyaltyPointType \{([^}]*)\}/)[1]
  .split('\n')
  .map((ligne) => ligne.replace(/\/\/.*$/, '').trim())
  .filter(Boolean);

const client = (loyalty_points) => ({
  id: 'client-1',
  first_name: 'Awa',
  last_name: 'Koné',
  email: null,
  phone: '+2250700000000',
  image: null,
  entity_status: 'ACTIVE',
  created_at: '2026-01-10T10:00:00.000Z',
  loyalty_level: 'STANDARD',
  total_points: 400,
  orders: [],
  loyalty_points,
});

describe('historique des points d’un client', () => {
  test('chaque type de points du serveur a son libellé', () => {
    expect(TYPES_SERVEUR).toContain('REFUNDED');
    for (const type of TYPES_SERVEUR) {
      expect({ type, libelle: CUSTOMER_LOYALTY_POINT_TYPE_MAP[type] }).toEqual({
        type,
        libelle: expect.any(String),
      });
    }
    expect(CUSTOMER_LOYALTY_POINT_TYPE_MAP.REFUNDED).toBe('Rendus');
  });

  test('commande annulée : la dépense reste « Utilisé » (−), les points rendus sont un crédit (+)', () => {
    const { loyaltyHistory } = mapCustomerData(
      client([
        {
          id: 'retrait',
          type: 'REDEEMED',
          points: 150,
          points_used: 150,
          reason: '🔥 150 points utilisés pour la commande #ORD-261002-1',
          order_id: 'commande-1',
          created_at: '2026-10-02T09:00:00.000Z',
        },
        {
          id: 'rendus',
          type: 'REFUNDED',
          points: 150,
          points_used: 0,
          reason: '150 points rendus : commande #ORD-261002-1 annulée',
          order_id: 'commande-1',
          created_at: '2026-10-02T10:00:00.000Z',
        },
      ]),
    );

    expect(loyaltyHistory.map(({ id, type, points, reason }) => ({ id, type, points, reason }))).toEqual([
      { id: 'rendus', type: 'Rendus', points: 150, reason: '150 points rendus : commande #ORD-261002-1 annulée' },
      { id: 'retrait', type: 'Utilisé', points: 150, reason: '🔥 150 points utilisés pour la commande #ORD-261002-1' },
    ]);
    expect(loyaltyHistory.map((ligne) => estCreditHistorique(ligne.type))).toEqual([true, false]);
  });

  test('sens de chaque libellé : gains, bonus et points rendus ajoutent, le reste retire', () => {
    expect(['Gagné', 'Bonus', 'Rendus'].map(estCreditHistorique)).toEqual([true, true, true]);
    expect(['Utilisé', 'Expiré'].map(estCreditHistorique)).toEqual([false, false]);
  });
});

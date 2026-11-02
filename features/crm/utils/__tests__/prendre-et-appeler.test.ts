/* eslint-disable @typescript-eslint/ban-ts-comment -- tests bun : leurs types ne sont pas installés dans le backoffice. */
// @ts-nocheck
import { describe, expect, test } from 'bun:test';
import { MutationObserver, QueryClient } from '@tanstack/query-core';

import { prendreEtAppeler } from '../prendre-et-appeler';

/**
 * « Prendre et appeler » (relecture du 02/11). La prise relit tout le module
 * avant de se dire réussie (son onSuccess attend l'invalidation) ; la file
 * commune revient la première, sans le client pris, et sa carte disparaît.
 * Joué ici avec le vrai moteur de TanStack Query (celui de useMutation) :
 * « carte disparue » = l'observateur se désabonne avant la fin.
 */
function prise() {
  const client = new QueryClient();
  let finirRelecture = () => {};
  const relecture = new Promise<void>((r) => (finirRelecture = r));
  const observateur = new MutationObserver(client, {
    mutationFn: async (id: string) => ({ id }),
    // Comme usePrendreMutation : onSuccess renvoie la relecture, que la prise attend.
    onSuccess: () => relecture,
  });
  const desabonner = observateur.subscribe(() => {});
  return { observateur, desabonner, finirRelecture };
}

describe('Prendre et appeler : la fiche s’ouvre et le numéro se compose après la prise', () => {
  test('même si la carte a quitté la file commune avant la fin de la relecture', async () => {
    const { observateur, desabonner, finirRelecture } = prise();
    let ouverte = 0;
    const fin = prendreEtAppeler(observateur.mutate, 'client-1', () => ouverte++);
    desabonner(); // la file commune est revenue sans ce client : sa carte disparaît
    finirRelecture();
    expect(await fin).toBe(true);
    expect(ouverte).toBe(1);
  });

  test('le piège évité : un rappel passé à mutate ne part pas quand la carte a disparu', async () => {
    const { observateur, desabonner, finirRelecture } = prise();
    let ouverte = 0;
    const fin = observateur.mutate('client-1', { onSuccess: () => ouverte++ });
    desabonner();
    finirRelecture();
    await fin;
    expect(ouverte).toBe(0);
  });

  test('prise refusée (un collègue a été plus rapide) : ni fiche, ni numéro', async () => {
    let ouverte = 0;
    const refus = async () => {
      throw new Error('Un collègue a déjà pris ce client');
    };
    expect(await prendreEtAppeler(refus, 'client-1', () => ouverte++)).toBe(false);
    expect(ouverte).toBe(0);
  });
});

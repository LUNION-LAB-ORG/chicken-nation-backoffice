// @ts-nocheck -- lancé par `bun test` (intégré à Bun) : ses types ne sont pas installés dans le backoffice.
import { describe, expect, test } from 'bun:test';
import {
  cleJour,
  dansLaFenetreDeRegroupement,
  dateHeureComplete,
  dateHeureCourte,
  heureMessage,
  horodatageBulle,
  libelleJour,
  libelleVu,
  msAvantProchainJour,
} from '../dates-message';

const MAINTENANT = '2026-09-26T19:00:00Z';

describe('dates de la messagerie, à l’heure d’Abidjan', () => {
  test('heure et date complète', () => {
    expect(heureMessage('2026-09-26T18:26:00Z')).toBe('18:26');
    expect(heureMessage('2026-09-26T00:05:00Z')).toBe('00:05');
    expect(dateHeureComplete('2026-09-26T18:26:00Z')).toBe('samedi 26 septembre 2026 à 18:26');
    expect(dateHeureCourte('2026-09-26T18:26:00Z')).toBe('26/09/2026 à 18:26');
  });

  test('le jour est celui d’Abidjan, pas celui du poste', () => {
    // Lancé avec TZ=Asia/Tokyo, un calcul local donnerait le 27.
    expect(cleJour('2026-09-26T23:30:00Z')).toBe('2026-09-26');
    expect(cleJour('2026-09-27T00:30:00Z')).toBe('2026-09-27');
  });

  test('date et heure dans la bulle', () => {
    expect(horodatageBulle('2026-09-26T18:26:00Z', MAINTENANT)).toBe("Aujourd'hui 18:26");
    expect(horodatageBulle('2026-09-25T18:26:00Z', MAINTENANT)).toBe('Hier 18:26');
    expect(horodatageBulle('2026-09-24T18:26:00Z', MAINTENANT)).toBe('24/09 18:26');
    expect(horodatageBulle('2025-09-24T18:26:00Z', MAINTENANT)).toBe('24/09/2025 18:26');
    // Veille d'un premier janvier : « Hier », malgré le changement d'année.
    expect(horodatageBulle('2025-12-31T10:00:00Z', '2026-01-01T08:00:00Z')).toBe('Hier 10:00');
  });

  test('séparateur de jour', () => {
    expect(libelleJour('2026-09-26T08:00:00Z', MAINTENANT)).toBe("Aujourd'hui");
    expect(libelleJour('2026-09-25T08:00:00Z', MAINTENANT)).toBe('Hier');
    expect(libelleJour('2026-09-24T08:00:00Z', MAINTENANT)).toBe('Jeudi 24 septembre 2026');
    // Le premier du mois : « 1er ».
    expect(libelleJour('2026-09-01T08:00:00Z', MAINTENANT)).toBe('Mardi 1er septembre 2026');
    expect(dateHeureComplete('2026-10-01T07:05:00Z')).toBe('jeudi 1er octobre 2026 à 07:05');
  });

  test('accusé de lecture', () => {
    expect(libelleVu('2026-09-26T18:26:00Z', MAINTENANT)).toBe('Vu à 18:26');
    expect(libelleVu('2026-09-25T18:26:00Z', MAINTENANT)).toBe('Vu hier à 18:26');
    expect(libelleVu('2026-09-24T18:26:00Z', MAINTENANT)).toBe('Vu le 24/09 à 18:26');
    expect(libelleVu('2025-09-24T18:26:00Z', MAINTENANT)).toBe('Vu le 24/09/2025 à 18:26');
  });

  test('date invalide : rien plutôt qu’une erreur', () => {
    expect(heureMessage('')).toBe('');
    expect(horodatageBulle('pas une date', MAINTENANT)).toBe('');
    expect(libelleVu(null, MAINTENANT)).toBe('Vu');
  });

  test('regroupement à cinq minutes', () => {
    expect(dansLaFenetreDeRegroupement('2026-09-26T18:00:00Z', '2026-09-26T18:04:59Z')).toBe(true);
    expect(dansLaFenetreDeRegroupement('2026-09-26T18:00:00Z', '2026-09-26T18:05:00Z')).toBe(true);
    expect(dansLaFenetreDeRegroupement('2026-09-26T18:00:00Z', '2026-09-26T18:05:01Z')).toBe(false);
    expect(dansLaFenetreDeRegroupement(undefined, '2026-09-26T18:00:00Z')).toBe(false);
  });

  test('prochain minuit', () => {
    const ms = msAvantProchainJour('2026-09-26T23:59:00Z');
    expect(ms).toBeGreaterThanOrEqual(60 * 1000);
    expect(ms).toBeLessThan(62 * 1000);
  });
});

// @ts-nocheck -- lancé par `bun test` (intégré à Bun) : ses types ne sont pas installés dans le backoffice.
import { describe, expect, test } from 'bun:test';
import { CHOIX_THEME, CLE_THEME, estSombre, lireChoixTheme, SCRIPT_THEME, THEME_PAR_DEFAUT } from '../theme';

describe('thème : choix mémorisé', () => {
  test('clair par défaut, valeur inconnue comprise', () => {
    expect(THEME_PAR_DEFAUT).toBe('clair');
    expect(lireChoixTheme(null)).toBe('clair');
    expect(lireChoixTheme('dark')).toBe('clair');
    expect(lireChoixTheme('sombre')).toBe('sombre');
    expect(lireChoixTheme('systeme')).toBe('systeme');
  });

  test('sombre : choisi, ou « Système » sur un appareil réglé en sombre', () => {
    expect(estSombre('sombre', false)).toBe(true);
    expect(estSombre('clair', true)).toBe(false);
    expect(estSombre('systeme', true)).toBe(true);
    expect(estSombre('systeme', false)).toBe(false);
  });

  test('libellés de l’écran', () => {
    expect(CHOIX_THEME.map((c) => c.libelle)).toEqual(['Clair', 'Sombre', 'Système']);
  });
});

/** Le script du <head> rejoue la même règle, avant React. */
describe('thème : script avant affichage', () => {
  const executer = (memorise, systemeSombre) => {
    const classes = new Set();
    const window = {
      matchMedia: () => ({ matches: systemeSombre }),
    };
    const document = {
      documentElement: { classList: { toggle: (c, oui) => (oui ? classes.add(c) : classes.delete(c)) } },
    };
    const localStorage = { getItem: (cle) => (cle === CLE_THEME ? memorise : null) };
    new Function('window', 'document', 'localStorage', SCRIPT_THEME)(window, document, localStorage);
    return classes.has('dark');
  };

  test('même résultat que estSombre pour chaque choix', () => {
    for (const memorise of [null, 'clair', 'sombre', 'systeme', 'autre']) {
      for (const systeme of [true, false]) {
        expect(executer(memorise, systeme)).toBe(estSombre(lireChoixTheme(memorise), systeme));
      }
    }
  });

  test('stockage bloqué : aucune erreur, thème clair', () => {
    const classes = new Set();
    const localStorage = { getItem: () => { throw new Error('bloqué'); } };
    const document = { documentElement: { classList: { toggle: (c, o) => (o ? classes.add(c) : classes.delete(c)) } } };
    expect(() => new Function('window', 'document', 'localStorage', SCRIPT_THEME)({}, document, localStorage)).not.toThrow();
    expect(classes.has('dark')).toBe(false);
  });
});

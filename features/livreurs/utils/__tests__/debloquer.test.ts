// @ts-nocheck -- lancé par `bun test` (intégré à Bun) : ses types ne sont pas installés dans le backoffice.
import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * « Débloquer » (demande du 10/11) : le siège lève la pause automatique d'un
 * livreur (refus répétés) avant son heure. Lu dans la source.
 */

const lire = (chemin: string) => readFileSync(join(import.meta.dir, chemin), 'utf8');
const bouton = lire('../../components/BoutonDebloquer.tsx');

describe('« Débloquer »', () => {
  test('même droit que le serveur (administrateur, centre d’appels), un toucher, sans remonter à la ligne', () => {
    expect(bouton).toContain('const { piloterCourses } = useDroitsLivraison();');
    expect(bouton).toContain('if (!piloterCourses) return null;');
    expect(bouton).toContain('e.stopPropagation();');
    expect(bouton).not.toMatch(/\bconfirm\(/);
    expect(bouton).toContain("'Débloquer'");
  });

  test('route et relectures : listes, carte, fiche et tableau de la livraison', () => {
    expect(lire('../../services/livreur.service.ts')).toContain('api.patch<ReponseDeblocage>(`${ENDPOINT}/${id}/debloquer`, {}, true)');
    const mutation = lire('../../queries/debloquer-livreur.mutation.ts');
    for (const cle of ["['livreurs']", "['deliverers']", "['livraison']"]) expect(mutation).toContain(`queryKey: ${cle}`);
  });

  test('là où la pause automatique se voit', () => {
    expect(lire('../../components/LigneLivreurDuJour.tsx')).toContain(
      "{etat === 'PAUSE_AUTO' && <BoutonDebloquer livreurId={live.id}",
    );
    expect(lire('../../components/CarteEnDirect.tsx')).toContain("{etat === 'PAUSE_AUTO' && <BoutonDebloquer livreurId={live.id}");
    expect(lire('../../components/detail-livreur/ScoringQueueSection.tsx')).toContain(
      '{pauses.isAutoPaused && pauses.autoPauseUntil && <BoutonDebloquer livreurId={livreurId} />}',
    );
    const affecter = lire('../../../operations/components/drawer/AffecterCommandeModal.tsx');
    expect(affecter).toContain('{choix.etat === "PAUSE_AUTO" && <BoutonDebloquer livreurId={livreur.id}');
    // Jamais un bouton dans le bouton de la ligne.
    expect(affecter).toMatch(/<\/button>\s*\{\/\*[^*]*\*\/\}\s*\{choix\.etat === "PAUSE_AUTO"/);
  });
});

import { useEffect, useState } from 'react';
import { create } from 'zustand';

import { avisEncoreValides, DUREE_AVIS_MS, type Avis } from '../utils/suivi-course';

/**
 * Avis du planificateur reçus pendant que la page est ouverte (fusion de
 * courses, commande ajoutée), gardés 10 minutes et montrés sur la carte de la
 * course. Le serveur n'envoie pas la référence d'une course absorbée : elle
 * est déduite de la liste affichée au moment de l'événement
 * (`avisDeCourse`), d'où ce petit magasin en mémoire.
 */
interface EtatAvis {
  avis: Avis[];
  ajouter: (avis: Avis) => void;
}

export const useAvisCoursesStore = create<EtatAvis>((set) => ({
  avis: [],
  ajouter: (nouveau) =>
    set((etat) => ({
      // Un même texte pour la même course n'est gardé qu'une fois (deux passages proches).
      avis: [
        ...avisEncoreValides(etat.avis, new Date()).filter(
          (a) => !(a.courseId === nouveau.courseId && a.texte === nouveau.texte),
        ),
        nouveau,
      ],
    })),
}));

/** Avis encore valides d'une course, du plus ancien au plus récent. */
export function useAvisDeCourse(courseId: string | null): Avis[] {
  const tous = useAvisCoursesStore((s) => s.avis);
  const [maintenant, setMaintenant] = useState(() => new Date());
  // Un avis disparaît de lui-même au bout de 10 minutes.
  useEffect(() => {
    if (!courseId || tous.length === 0) return;
    const id = window.setInterval(() => setMaintenant(new Date()), Math.min(DUREE_AVIS_MS, 60_000));
    return () => window.clearInterval(id);
  }, [courseId, tous.length]);
  if (!courseId) return [];
  return avisEncoreValides(
    tous.filter((a) => a.courseId === courseId),
    maintenant,
  );
}

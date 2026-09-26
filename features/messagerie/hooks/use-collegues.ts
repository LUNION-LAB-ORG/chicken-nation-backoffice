import { useCallback, useEffect, useState } from 'react';
import { getAllUsers } from '../../users/services/user.service';
import { useAuthStore } from '../../users/hook/authStore';

/**
 * Les collègues qu'on peut mettre dans une conversation interne.
 *
 * Extrait en un seul endroit parce que la règle est subtile et qu'elle était
 * déjà fausse une fois : un administrateur doit voir TOUT le personnel, et pas
 * seulement les comptes du siège, sans quoi les agents de terrain, call center
 * et caissiers compris, sont invisibles et aucun groupe ne peut les réunir. Un
 * responsable de point de vente, lui, ne voit que son équipe, ce que le serveur
 * impose de toute façon.
 */

export interface CollegueOption {
  id: string;
  label: string;
  /** Rôle lisible suivi de l'adresse : affiché en sous-titre ET cherchable. */
  email?: string;
  phone?: string;
  image?: string;
}

/** Rôle lisible, repris en sous-titre dans la liste des mentions. */
export const LIBELLE_ROLE: Record<string, string> = {
  ADMIN: 'Administrateur',
  MARKETING: 'Agent Marketing',
  COMPTABLE: 'Agent Comptable',
  CALL_CENTER: 'Agent Call Center',
  MANAGER: 'Manager',
  ASSISTANT_MANAGER: 'Assistant Manager',
  CAISSIER: 'Agent Caissier',
  CUISINE: 'Agent Cuisinier',
};

/** Rôles autorisés à composer un groupe. Le serveur applique la même liste. */
export const ROLES_GESTION_GROUPE = ['ADMIN', 'MANAGER', 'ASSISTANT_MANAGER'];

/** Ces rôles sont rattachés à un point de vente : ils ne voient que leur équipe. */
const ROLES_CLOISONNES = [
  'MANAGER',
  'ASSISTANT_MANAGER',
  'CAISSIER',
  'CALL_CENTER',
  'CUISINE',
];

export const useCollegues = (options?: { exclureIds?: string[]; actif?: boolean }) => {
  const { user } = useAuthStore();
  const [collegues, setCollegues] = useState<CollegueOption[]>([]);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const exclureIds = options?.exclureIds;
  /**
   * `actif` évite de charger tout l'annuaire du personnel pour rien : le
   * panneau d'un groupe est monté en permanence, et la fenêtre de création
   * existe même fermée. Sans cette condition, chaque ouverture de conversation
   * déclenchait un appel, avec un refus poli pour qui n'a pas le droit de
   * gérer un groupe.
   */
  const actif = options?.actif ?? true;

  const charger = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      let donnees;
      if (user?.restaurant_id && ROLES_CLOISONNES.includes(user.role || '')) {
        const { getRestaurantUsers } = await import('@/services/restaurantService');
        donnees = await getRestaurantUsers(user.restaurant_id);
      } else {
        // Siège et administrateurs : TOUT le personnel, sans filtre de type.
        donnees = await getAllUsers();
      }

      const aExclure = new Set([user?.id, ...(exclureIds ?? [])].filter(Boolean));

      setCollegues(
        (donnees ?? [])
          .filter((u) => u.entity_status === 'ACTIVE' && !aExclure.has(u.id))
          .map((u) => {
            const role = LIBELLE_ROLE[u.role ?? ''] ?? u.role ?? '';
            return {
              id: u.id,
              label: u.fullname || u.email || u.id,
              email: [role, u.email].filter(Boolean).join(' · ') || undefined,
              phone: u.phone || undefined,
              image: u.image || undefined,
            };
          }),
      );
    } catch {
      setErreur('Chargement des agents impossible');
      setCollegues([]);
    } finally {
      setChargement(false);
    }
    // `exclureIds` est un tableau : on le compare par son contenu pour ne pas
    // relancer un chargement à chaque rendu du parent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.role, user?.restaurant_id, (exclureIds ?? []).join(',')]);

  useEffect(() => {
    if (!actif) return;
    void charger();
  }, [charger, actif]);

  return {
    collegues,
    chargement,
    erreur,
    recharger: charger,
    peutGererUnGroupe: ROLES_GESTION_GROUPE.includes(user?.role ?? ''),
  };
};

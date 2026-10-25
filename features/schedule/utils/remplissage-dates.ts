/**
 * « Modifier les dates » (relecture du 25/10) : les champs sont remplis à
 * l'ouverture de la fenêtre, ou quand elle montre un autre planning, jamais
 * à chaque relecture du détail (toutes les 15 s, nouvel objet à chaque
 * réponse d'un livreur), qui effaçait la date saisie.
 *
 * `precedent` est la clé rendue au tour d'avant (null : fenêtre fermée).
 */
export function remplissageDates(
  precedent: string | null,
  isOpen: boolean,
  plan: { id: string } | null | undefined,
): { cle: string | null; remplir: boolean } {
  const cle = isOpen && plan ? plan.id : null;
  return { cle, remplir: cle !== null && cle !== precedent };
}

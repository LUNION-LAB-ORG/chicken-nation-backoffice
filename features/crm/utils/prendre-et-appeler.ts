/**
 * « Prendre et appeler » (file commune Glovo/Yango) : la fiche s'ouvre et le
 * numéro se compose une fois la prise réussie.
 *
 * ⚠️ On attend la PROMESSE de la prise, pas un rappel passé à `mutate` : ce
 * rappel ne part que si la carte est encore à l'écran. Or la prise relit tout
 * le module avant de se dire réussie, et la file commune revient la première,
 * sans le client pris : sa carte disparaît, et ni la fiche ni le numéro ne
 * partaient. La promesse, elle, se règle même carte disparue.
 *
 * Renvoie faux si la prise a échoué (l'erreur est déjà affichée par la prise).
 */
export async function prendreEtAppeler(
  prendre: (id: string) => Promise<unknown>,
  id: string,
  apresLaPrise: () => void,
): Promise<boolean> {
  try {
    await prendre(id);
  } catch {
    return false;
  }
  apresLaPrise();
  return true;
}

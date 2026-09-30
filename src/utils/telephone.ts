/** Chiffres seuls. « 00225… » s'écrit aussi « 225… » : on ramène les deux au même. */
const chiffres = (phone?: string | null): string => {
  const d = (phone ?? "").replace(/\D/g, "");
  return d.startsWith("00") ? d.slice(2) : d;
};

/**
 * Le numéro tel qu'on le COLLE : sans espaces, et sans l'indicatif ivoirien.
 *
 * Les espaces aident à lire un numéro quand on le compose, l'indicatif sert à
 * l'appeler depuis l'étranger. Ni l'un ni l'autre n'a sa place dans un
 * presse-papiers : collés dans une recherche, un tableur ou WhatsApp, ils ne
 * font qu'empêcher la correspondance avec un numéro stocké en dix chiffres.
 *
 * ⚠️ Un numéro ÉTRANGER garde son indicatif. Le retirer le rendrait
 * incomposable, et aucune de nos listes ne le stocke sans.
 */
export function numeroACopier(phone?: string | null): string {
  const d = chiffres(phone);
  if (d.length === 10) return d;
  if (d.length === 13 && d.startsWith("225")) return d.slice(3);
  return (phone ?? "").replace(/\s+/g, "");
}

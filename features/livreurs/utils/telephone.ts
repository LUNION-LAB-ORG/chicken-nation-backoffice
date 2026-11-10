/**
 * Numéro d'un livreur, pour l'appeler hors de l'appli (demande du 10/11).
 * Côte d'Ivoire : +225 puis 10 chiffres, écrits par paires.
 */

/** « +225 05 56 44 05 04 » ; un numéro d'une autre forme est rendu tel quel. */
export function telephoneLisible(telephone: string | null | undefined): string | null {
  const brut = telephone?.trim();
  if (!brut) return null;
  const chiffres = brut.replace(/\D/g, '');
  if (chiffres.length === 13 && chiffres.startsWith('225')) {
    const local = chiffres.slice(3);
    return `+225 ${local.match(/.{1,2}/g)!.join(' ')}`;
  }
  return brut;
}

/** Lien d'appel du téléphone (« tel:+2250556440504 ») ; null sans numéro. */
export function lienAppel(telephone: string | null | undefined): string | null {
  const brut = telephone?.trim();
  if (!brut) return null;
  const chiffres = brut.replace(/[^\d+]/g, '');
  return chiffres ? `tel:${chiffres}` : null;
}

/** Lien WhatsApp (« https://wa.me/2250556440504 ») ; null sans numéro. */
export function lienWhatsApp(telephone: string | null | undefined): string | null {
  const chiffres = telephone?.replace(/\D/g, '') ?? '';
  return chiffres.length >= 8 ? `https://wa.me/${chiffres}` : null;
}

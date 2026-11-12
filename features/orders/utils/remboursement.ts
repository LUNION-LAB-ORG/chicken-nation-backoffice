/**
 * Remboursement KKiaPay depuis l'onglet Paiement (12/11) : qui voit le bouton,
 * sur quels paiements, et les messages. Les mêmes règles vivent au serveur
 * (`remboursement.rules.ts`), qui tranche.
 */

type Compte = { role?: string | null; type?: string | null; restaurant_id?: string | null } | null | undefined;

/** Administrateur du siège : toute commande ; manager : celles de son restaurant. */
export function peutRembourser(u: Compte, restaurantCommande: string | null | undefined): boolean {
  if (!u?.role) return false;
  if (u.role === "ADMIN" && u.type !== "RESTAURANT") return true;
  return u.role === "MANAGER" && u.type === "RESTAURANT" && !!u.restaurant_id && u.restaurant_id === restaurantCommande;
}

/** Paiement passé par KKiaPay : réussi, avec une référence de transaction (pas un encaissement saisi à la main). */
export function estRemboursable(p: { status: string; mode: string; reference?: string | null }): boolean {
  const ref = (p.reference ?? "").trim();
  return p.status === "SUCCESS" && p.mode !== "CASH" && !!ref && !ref.toUpperCase().startsWith("PAY-");
}

/** Le serveur dit la transaction déjà remboursée chez KKiaPay : on propose de l'enregistrer. */
export const CODE_REMBOURSEE_CHEZ_KKIAPAY = "REMBOURSEE_CHEZ_KKIAPAY";

const TEXTES_PAR_DEFAUT = new Set(["Internal server error", "Forbidden resource", "Bad Request", "Not Found"]);

/** Message du serveur quand il est écrit pour l'utilisateur, sinon une phrase simple. */
export function messageErreurRemboursement(e: unknown, parDefaut = "Une erreur est survenue. Réessayez."): string {
  const err = (e ?? {}) as { message?: unknown; messageServeur?: unknown };
  if (typeof err.messageServeur === "string" && err.messageServeur.trim() && !TEXTES_PAR_DEFAUT.has(err.messageServeur.trim())) {
    return err.messageServeur;
  }
  if (Array.isArray(err.message)) return err.message.join(" ");
  if (typeof err.message === "string" && err.message.trim() && !TEXTES_PAR_DEFAUT.has(err.message.trim())) return err.message;
  return parDefaut;
}

/** « 6.060 F », comme le reste de l'onglet. */
export function formatMontant(n: number | null | undefined): string {
  const m = typeof n === "number" && Number.isFinite(n) ? Math.round(n) : 0;
  return `${String(m).replace(/\B(?=(\d{3})+(?!\d))/g, ".")} F`;
}

const deux = (n: number) => String(n).padStart(2, "0");

/** « 12/11 à 10 h 20 » ; vide sans date lisible. */
export function formatJourHeure(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${deux(d.getDate())}/${deux(d.getMonth() + 1)} à ${d.getHours()} h ${deux(d.getMinutes())}`;
}

/** « Remboursé le 12/11 à 10 h 20 par Mariam » sous la ligne du paiement. */
export function texteRembourse(p: { rembourse_at?: string | null; rembourse_par_nom?: string | null }): string {
  const quand = formatJourHeure(p.rembourse_at);
  if (!quand) return "Remboursé";
  return `Remboursé le ${quand}${p.rembourse_par_nom ? ` par ${p.rembourse_par_nom}` : ""}`;
}

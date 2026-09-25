import { Public } from "../../types/contact.type";
import { CompteAppli, ICampagne, ICampagnePublic, ICampagnePublicInput, ModeRepartition } from "../../types/campagne.type";
import { PUBLICS, PUBLIC_META, accord, aujourdhuiISO, estCapte } from "../../utils/crm-ui";

/**
 * État du formulaire de campagne, en chaînes comme les champs, et passage
 * vers le corps attendu par le serveur.
 */

/** Un public coché et ses critères, tels que saisis. */
export interface EtatPublic {
  segment: Public;
  period_from: string;
  period_to: string;
  restaurant_ids: string[];
  /** "" : tous, avec ou sans compte. */
  account: "" | CompteAppli;
  relapsed_only: boolean;
  offer_id: string;
  target_conversion_rate: string;
  target_contacts_count: string;
}

export interface EtatForm {
  name: string;
  description: string;
  start_date: string;
  fin: "date" | "duree";
  end_date: string;
  duration_days: string;
  target_conversion_rate: string;
  target_contacts_count: string;
  lead_agent_id: string;
  agent_ids: string[];
  offer_id: string;
  distribution_mode: ModeRepartition;
  publics: EtatPublic[];
}

export const jour = (v?: string | null) => (v ? v.slice(0, 10) : "");

/** "" devient absent ; la virgule française est acceptée. */
export const versNombre = (v: string) => (v.trim() === "" ? undefined : Number(v.trim().replace(",", ".")));

export function nouveauPublic(segment: Public, depuis?: Partial<EtatPublic>): EtatPublic {
  return {
    segment,
    period_from: "",
    period_to: "",
    restaurant_ids: [],
    account: "",
    relapsed_only: false,
    offer_id: "",
    target_conversion_rate: "",
    target_contacts_count: "",
    ...depuis,
  };
}

function depuisPublic(p: ICampagnePublic): EtatPublic {
  return nouveauPublic(p.segment, {
    period_from: jour(p.period_from),
    period_to: jour(p.period_to),
    restaurant_ids: p.restaurant_ids ?? [],
    account: p.account ?? "",
    relapsed_only: !!p.relapsed_only,
    offer_id: p.offer_id ?? p.offer?.id ?? "",
    target_conversion_rate: p.target_conversion_rate?.toString() ?? "",
    target_contacts_count: p.target_contacts_count?.toString() ?? "",
  });
}

/** Publics d'une campagne existante ; repli sur l'ancien format (segments et période d'inscription). */
function publicsInitiaux(c?: ICampagne | null): EtatPublic[] {
  if (c?.publics?.length) return trier(c.publics.map(depuisPublic));
  if (c?.segments?.length) {
    return trier(
      c.segments.map((s) =>
        nouveauPublic(
          s,
          s === "JAMAIS_COMMANDE" ? { period_from: jour(c.registered_from), period_to: jour(c.registered_to) } : undefined,
        ),
      ),
    );
  }
  return [nouveauPublic("JAMAIS_COMMANDE")];
}

export const trier = (publics: EtatPublic[]) =>
  [...publics].sort((a, b) => PUBLICS.indexOf(a.segment) - PUBLICS.indexOf(b.segment));

export function etatInitial(c?: ICampagne | null): EtatForm {
  return {
    name: c?.name ?? "",
    description: c?.description ?? "",
    start_date: jour(c?.start_date) || aujourdhuiISO(),
    fin: "date",
    end_date: jour(c?.end_date),
    duration_days: "15",
    target_conversion_rate: c?.target_conversion_rate?.toString() ?? "",
    target_contacts_count: c?.target_contacts_count?.toString() ?? "",
    lead_agent_id: c?.lead_agent?.id ?? "",
    agent_ids: c?.assigned_agents?.map((a) => a.agent.id) ?? [],
    offer_id: c?.offer?.id ?? "",
    distribution_mode: c?.distribution_mode ?? "AUTOMATIQUE",
    publics: publicsInitiaux(c),
  };
}

/** Critères de ciblage seuls (aperçu, création, campagne planifiée). */
export function criteresSaisis(p: EtatPublic): ICampagnePublicInput {
  const capte = estCapte(p.segment);
  return {
    segment: p.segment,
    period_from: p.period_from || undefined,
    period_to: p.period_to || undefined,
    ...(capte && p.restaurant_ids.length > 0 && { restaurant_ids: p.restaurant_ids }),
    ...(capte && p.account && { account: p.account }),
    ...(p.segment === "INACTIF" && p.relapsed_only && { relapsed_only: true }),
  };
}

/** Critères d'une campagne enregistrée, prêts pour l'aperçu. */
export const criteresCampagne = (c: ICampagne): ICampagnePublicInput[] => publicsInitiaux(c).map(criteresSaisis);

/**
 * Corps d'un public. Campagne lancée : seuls l'offre et les objectifs partent
 * (null efface), les critères figés ne sont pas renvoyés.
 */
export function publicSaisi(p: EtatPublic, lancee: boolean): ICampagnePublicInput {
  if (lancee) {
    return {
      segment: p.segment,
      offer_id: p.offer_id || null,
      target_conversion_rate: versNombre(p.target_conversion_rate) ?? null,
      target_contacts_count: versNombre(p.target_contacts_count) ?? null,
    };
  }
  return {
    ...criteresSaisis(p),
    offer_id: p.offer_id || undefined,
    target_conversion_rate: versNombre(p.target_conversion_rate),
    target_contacts_count: versNombre(p.target_contacts_count),
  };
}

/** A-t-on saisi une offre ou un objectif propre à ce public ? */
export const aDesReglagesPropres = (p: EtatPublic) =>
  !!(p.offer_id || p.target_conversion_rate.trim() || p.target_contacts_count.trim());

/* ------------------------------------------------------------------ */
/* Critères en clair, comme le serveur les écrit                         */
/* ------------------------------------------------------------------ */

/** Nom court d'un public sur un onglet ou un sélecteur, au pluriel comme le filtre des tableaux de bord. */
export const ONGLET_PUBLIC: Record<Public, string> = {
  JAMAIS_COMMANDE: "Inscrits",
  INACTIF: "Inactifs",
  GLOVO: "Glovo",
  YANGO: "Yango",
};

const dateCourte = (v: string) =>
  new Date(v).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });

/**
 * « Captés sur Glovo du 01/09/2026 au 15/09/2026 ; restaurant de capture :
 * Angré ; sans compte sur l'appli ». Sert quand le serveur ne l'a pas encore
 * écrit (campagne planifiée, dont les statistiques ne sont pas calculées).
 */
export function criteresEnClair(
  p: Pick<ICampagnePublic, "segment" | "period_from" | "period_to" | "restaurant_ids" | "account" | "relapsed_only">,
  nomsRestaurants: Map<string, string> = new Map(),
): string {
  const morceaux: string[] = [];
  const debut = p.period_from ? dateCourte(p.period_from) : null;
  const fin = p.period_to ? dateCourte(p.period_to) : null;
  const libelle = PUBLIC_META[p.segment].entree;
  if (debut && fin) morceaux.push(`${libelle} du ${debut} au ${fin}`);
  else if (debut) morceaux.push(`${libelle} depuis le ${debut}`);
  else if (fin) morceaux.push(`${libelle} jusqu'au ${fin}`);
  else morceaux.push(`${libelle}, toutes dates`);
  const restaurants = [...new Set(p.restaurant_ids ?? [])];
  if (restaurants.length > 0) {
    // Liste pas encore chargée, ou restaurant absent de la liste : on compte au lieu d'inventer un nom.
    const connus = restaurants.map((id) => nomsRestaurants.get(id)).filter((n): n is string => !!n);
    const autres = restaurants.length - connus.length;
    if (connus.length === 0) {
      morceaux.push(`${restaurants.length} ${accord(restaurants.length, "restaurant")} de capture`);
    } else {
      const suite = autres > 0 ? ` et ${autres} ${accord(autres, "autre")}` : "";
      morceaux.push(`${accord(restaurants.length, "restaurant")} de capture : ${connus.join(", ")}${suite}`);
    }
  }
  if (p.account === "AVEC") morceaux.push("avec un compte sur l'appli");
  if (p.account === "SANS") morceaux.push("sans compte sur l'appli");
  if (p.relapsed_only) morceaux.push("déjà reconquis une fois");
  return morceaux.join(" ; ");
}

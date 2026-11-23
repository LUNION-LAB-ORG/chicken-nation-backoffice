import { api } from "@/services/api";
import {
  DerniereCommande,
  HabitudesClient,
  LigneDerniereCommande,
  PlatHabituel,
} from "../types/habitudes.types";
import { SupplementItem } from "../types/order-form.types";

const BASE = "/orders/habitudes";

const VIDES: HabitudesClient = { commandes: 0, plats: [], derniere: null };

const texte = (valeur: unknown): valeur is string => typeof valeur === "string" && valeur !== "";
const entier = (valeur: unknown): valeur is number => Number.isInteger(valeur) && (valeur as number) > 0;

type Brut = Record<string, unknown>;

/** Tableau d'objets, ou rien : ce que le serveur rend n'est jamais supposé. */
const liste = (brut: unknown): Brut[] =>
  Array.isArray(brut) ? brut.filter((e): e is Brut => typeof e === "object" && e !== null) : [];

const lireSupplements = (brut: unknown): SupplementItem[] =>
  liste(brut)
    .filter((s) => texte(s.id) && entier(s.quantity))
    .map((s) => ({ id: s.id as string, quantity: s.quantity as number }));

const lireIds = (brut: unknown): string[] => (Array.isArray(brut) ? brut.filter(texte) : []);

/**
 * Contrôle de la réponse avant qu'elle serve : une ligne illisible est
 * écartée, jamais ajoutée au panier avec une quantité `undefined`.
 */
const lireHabitudes = (brut: unknown): HabitudesClient => {
  const h = (brut ?? {}) as Brut;

  const plats: PlatHabituel[] = liste(h.plats)
    .filter((p) => texte(p.dish_id) && texte(p.nom) && entier(p.fois))
    .map((p) => ({
      dish_id: p.dish_id as string,
      nom: p.nom as string,
      image: texte(p.image) ? p.image : null,
      fois: p.fois as number,
      derniere_le: texte(p.derniere_le) ? p.derniere_le : "",
      epice: p.epice === true,
      supplements: lireSupplements(p.supplements),
      option_item_ids: lireIds(p.option_item_ids),
    }));

  const d = (h.derniere ?? null) as Brut | null;
  const lignes: LigneDerniereCommande[] = liste(d?.lignes)
    .filter((l) => texte(l.dish_id) && texte(l.nom) && entier(l.quantity))
    .map((l) => ({
      dish_id: l.dish_id as string,
      nom: l.nom as string,
      quantity: l.quantity as number,
      epice: l.epice === true,
      supplements: lireSupplements(l.supplements),
      option_item_ids: lireIds(l.option_item_ids),
      disponible: l.disponible === true,
    }));
  const derniere: DerniereCommande | null =
    d && texte(d.id) && texte(d.le) && lignes.length > 0
      ? {
          id: d.id,
          reference: texte(d.reference) ? d.reference : "",
          le: d.le,
          type: d.type as DerniereCommande["type"],
          montant: typeof d.montant === "number" && Number.isFinite(d.montant) ? d.montant : 0,
          restaurant: (d.restaurant as DerniereCommande["restaurant"]) ?? null,
          lignes,
        }
      : null;

  return {
    commandes: typeof h.commandes === "number" ? h.commandes : 0,
    plats,
    derniere,
  };
};

export const habitudesAPI = {
  /**
   * Plats habituels et dernière commande du client. Lecture d'appoint : un
   * serveur plus ancien (route absente) ou un refus ne doit jamais gêner la
   * prise de commande, l'écran n'affiche alors rien.
   */
  duClient: async (customerId: string): Promise<HabitudesClient> => {
    try {
      return lireHabitudes(await api.get<unknown>(`${BASE}/client/${encodeURIComponent(customerId)}`));
    } catch {
      return VIDES;
    }
  },
};

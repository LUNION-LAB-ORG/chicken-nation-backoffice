/**
 * Rendu d'une `Order` Chicken Nation en buffer ESC/POS pour imprimante
 * thermique 80mm. Format ticket de caisse classique.
 *
 * Module pur : depend uniquement du builder ESC/POS. Testable depuis
 * Bun/Jest sans navigateur.
 */

import { ConstructeurEscPos } from "./builder";
import type {
  Order,
  OrderItem,
  OrderType,
  PaymentMethod,
} from "../../../features/orders/types/order.types";
import type { Paiement, PaiementMode } from "../../../features/orders/types/paiement.types";
import type { Supplement } from "../../../features/menus/types/supplement.types";

export interface InfosBoutique {
  /** Nom du restaurant (gros titre haut de ticket). */
  nom: string;
  /** Adresse du restaurant. */
  adresse?: string;
  /** Telephone du restaurant. */
  telephone?: string;
  /** Email du restaurant. */
  email?: string;
  /** Devise par defaut : "F CFA". */
  devise?: string;
}

export interface InfosContexte {
  /** Nom du caissier / agent qui imprime. */
  caissier?: string;
  /** Mention "DUPLICATA" en entete si reimpression. */
  duplicata?: boolean;
  /** Message libre en pied de ticket (max 200 chars, wrap automatique). */
  footerMessage?: string | null;
}

const LABELS_TYPE: Record<OrderType, string> = {
  DELIVERY: "À LIVRER",
  PICKUP: "À EMPORTER",
  TABLE: "SUR PLACE",
};

const LABELS_MODE_PAIEMENT: Record<PaiementMode | string, string> = {
  MOBILE_MONEY: "Mobile Money",
  WALLET: "Wallet",
  CARD: "Carte",
  CASH: "Espèces",
};

const LABELS_PAYMENT_METHOD: Record<PaymentMethod, string> = {
  ONLINE: "Application",
  OFFLINE: "Restaurant",
};

/** Largeur en colonnes du ticket 80mm en font A (12x24 pixels). */
const COLS = 42;

/** Aligne `gauche` a gauche et `droite` a droite sur COLS colonnes. */
function ligneFlex(gauche: string, droite: string): string {
  const espaces = Math.max(1, COLS - gauche.length - droite.length);
  return gauche + " ".repeat(espaces) + droite;
}

/** Tronque `s` a `max` caracteres en remplacant la fin par "..." si necessaire. */
function trim(s: string, max: number): string {
  return s.length <= max ? s : s.slice(0, Math.max(0, max - 1)) + "…";
}

/** Format montant FCFA : "12 500 F CFA" -> ici on omet la devise (mise une fois sur TOTAL). */
function formatMontant(n: number | null | undefined): string {
  const v = Math.round(Number(n ?? 0));
  return new Intl.NumberFormat("fr-FR").format(v).replace(/\s/g, " ");
}

function getDishName(item: OrderItem): string {
  return item.dish?.name ?? "Plat";
}

function getSupplements(item: OrderItem): Supplement[] {
  if (!item.supplements) return [];
  if (Array.isArray(item.supplements)) return item.supplements;
  return [];
}

function getClientName(order: Order): string {
  if (order.customer) {
    const full = [order.customer.first_name, order.customer.last_name]
      .filter(Boolean)
      .join(" ")
      .trim();
    if (full) return full;
  }
  return order.fullname?.trim() ?? "";
}

function getClientPhone(order: Order): string {
  return order.customer?.phone ?? order.phone ?? "";
}

/**
 * Formate une date au format "LUNDI 11 05 2026 - 14:32:08".
 *
 * Convention ticket :
 *  - jour de semaine en lettres majuscules (LUNDI / MARDI / ...)
 *  - jour du mois en chiffres (sans padding 0)
 *  - mois en chiffres sur 2 digits (05 = mai)
 *  - annee 4 chiffres
 *  - heure HH:MM:SS
 */
function formatDateLongueMaj(d: Date): string {
  const jour = d
    .toLocaleDateString("fr-FR", { weekday: "long" })
    .toUpperCase();
  const dayNum = d.getDate();
  const moisNum = String(d.getMonth() + 1).padStart(2, "0");
  const annee = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${jour} ${dayNum} ${moisNum} ${annee} - ${hh}:${mm}:${ss}`;
}

/**
 * Construit le buffer ESC/POS d'une commande Chicken Nation :
 * 1. En-tete : nom restaurant (double largeur centre), adresse/tel, date/heure
 * 2. Reference commande, type (à livrer / emporter / sur place), source
 * 3. Client (nom + telephone) + adresse de livraison si DELIVERY
 * 4. Note client si presente
 * 5. Lignes articles avec quantite, prix unitaire, supplements
 * 6. Sous-total, code promo / remise, livraison, taxe
 * 7. TOTAL (gras double largeur)
 * 8. Paiements detailles + points fidelite utilises
 * 9. Pied de page + coupe partielle
 */
export function genererTicketEscPos(
  order: Order,
  boutique: InfosBoutique,
  contexte: InfosContexte = {},
): Uint8Array {
  // Date d'impression = maintenant si pas de date de commande.
  const date = order.date ? new Date(order.date) : new Date();
  const dateStr = date.toLocaleDateString("fr-FR");
  const heureStr = date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const devise = boutique.devise ?? "F CFA";
  const sep = "-".repeat(COLS);
  const dblSep = "=".repeat(COLS);

  const restaurantNom = boutique.nom ?? order.restaurant?.name ?? "Chicken Nation";

  const b = new ConstructeurEscPos()
    .init()
    .codePageCp858()
    .aligner("centre")
    .taille(0x10) // double largeur
    .gras(true)
    .ligne(trim(restaurantNom.toUpperCase(), COLS / 2))
    .gras(false)
    .taille(0x00);

  if (boutique.adresse) b.ligne(trim(boutique.adresse, COLS));
  if (boutique.telephone) b.ligne(`Tel : ${trim(boutique.telephone, COLS - 6)}`);
  if (boutique.email) b.ligne(`Email : ${trim(boutique.email, COLS - 8)}`);
  b.ligne(`${dateStr}  ${heureStr}`);

  if (contexte.duplicata) {
    b.gras(true).ligne("*** DUPLICATA ***").gras(false);
  }

  b.aligner("gauche").ligne(sep);

  // Reference commande (gras + taille moyenne)
  b.gras(true)
    .ligne(`Ticket #${order.reference}`)
    .gras(false)
    .ligne(ligneFlex("Type :", LABELS_TYPE[order.type]));

  if (order.table_type) {
    b.ligne(ligneFlex("Table :", order.table_type.replace("TABLE_", "")));
  }
  if (order.places && order.places > 0) {
    b.ligne(ligneFlex("Couverts :", String(order.places)));
  }

  if (contexte.caissier) {
    b.ligne(ligneFlex("Caissier :", trim(contexte.caissier, COLS - 11)));
  }
  if (order.auto !== undefined) {
    b.ligne(ligneFlex("Source :", order.auto ? "Application" : "Manuel"));
  }

  b.ligne(sep);

  // Bloc client (nom et telephone sur des lignes separees pour lisibilite)
  const clientNom = getClientName(order);
  const clientTel = getClientPhone(order);
  if (clientNom) {
    b.ligne(`Client : ${trim(clientNom, COLS - 9)}`);
  }
  if (clientTel) {
    b.ligne(`Tel    : ${trim(clientTel, COLS - 9)}`);
  }
  if (order.type === "DELIVERY" && order.address) {
    // L'adresse est parfois un JSON serialise — afficher tel quel si plain, sinon parser.
    let adresse = order.address;
    try {
      const parsed = JSON.parse(order.address);
      adresse = parsed?.address || parsed?.title || order.address;
    } catch {
      /* plain string */
    }
    b.ligne(`Adresse :`);
    // Wrap simple sur COLS
    const mots = adresse.split(/\s+/);
    let ligne = "  ";
    for (const mot of mots) {
      if (ligne.length === 2) {
        ligne += mot;
      } else if (ligne.length + 1 + mot.length <= COLS) {
        ligne += " " + mot;
      } else {
        b.ligne(ligne);
        ligne = "  " + mot;
      }
    }
    if (ligne.trim().length > 0) b.ligne(ligne);
  }
  if (order.note) {
    b.ligne(`Note : ${trim(order.note, COLS - 7)}`);
  }
  if (clientNom || clientTel || order.note || (order.type === "DELIVERY" && order.address)) {
    b.ligne(sep);
  }

  // Articles
  const items = order.order_items ?? [];
  for (const item of items) {
    const nom = getDishName(item);
    const totalLigne = formatMontant(item.amount);
    // ligne 1 : nom plat   total
    b.ligne(ligneFlex(trim(nom, COLS - totalLigne.length - 1), totalLigne));
    // ligne 2 : qty x prix unitaire
    const prixUnitaire = item.dish?.price ?? (item.amount / Math.max(item.quantity, 1));
    const detail = `  ${item.quantity} x ${formatMontant(prixUnitaire)}`;
    b.ligne(item.epice ? `${detail}   [epice]` : detail);
    // supplements
    for (const supp of getSupplements(item)) {
      const qty = (supp as Supplement & { quantity?: number }).quantity ?? 1;
      const label = `  + ${trim(supp.name, COLS - 6)} x${qty}`;
      const prix = supp.price ? formatMontant(supp.price * qty) : "";
      b.ligne(prix ? ligneFlex(label, prix) : label);
    }
  }

  b.ligne(sep)
    .ligne(ligneFlex("Sous-total", formatMontant(order.net_amount)));

  if (order.discount && order.discount > 0) {
    b.ligne(ligneFlex(
      order.code_promo ? `Promo (${trim(order.code_promo, 10)})` : "Remise",
      `- ${formatMontant(order.discount)}`,
    ));
  }
  if (order.delivery_fee && order.delivery_fee > 0) {
    b.ligne(ligneFlex("Livraison", formatMontant(order.delivery_fee)));
  }
  if (order.tax && order.tax > 0) {
    b.ligne(ligneFlex("Taxe", formatMontant(order.tax)));
  }
  if (order.points && order.points > 0) {
    b.ligne(ligneFlex("Points fidélité utilisés", `- ${formatMontant(order.points)}`));
  }

  // TOTAL en gros
  b.ligne(dblSep)
    .gras(true)
    .taille(0x10)
    .ligne(ligneFlex("TOTAL", formatMontant(order.amount)))
    .taille(0x00)
    .gras(false)
    .ligne(ligneFlex("", devise))
    .ligne(dblSep);

  // Paiements
  const paiements = order.paiements ?? [];
  if (paiements.length > 0) {
    b.ligne("Paiement :");
    for (const p of paiements as Paiement[]) {
      const label = LABELS_MODE_PAIEMENT[p.mode] ?? p.mode;
      b.ligne(ligneFlex(`  ${label}`, formatMontant(p.amount)));
    }
  } else if (order.payment_method) {
    b.ligne(ligneFlex(
      "Paiement :",
      LABELS_PAYMENT_METHOD[order.payment_method] ?? order.payment_method,
    ));
    if (!order.paied) {
      b.gras(true).ligne("  >>> NON PAYÉ <<<").gras(false);
    }
  }

  // Pied de page
  b.saut(2).aligner("centre");

  if (order.paied) {
    b.ligne("Merci de votre commande !");
  } else {
    b.gras(true).ligne("À RÉGLER").gras(false);
  }

  // Message libre par restaurant (max 200 chars, wrap)
  const footer = (contexte.footerMessage ?? "").trim().slice(0, 200);
  if (footer) {
    b.saut(1);
    const mots = footer.split(/\s+/);
    let ligne = "";
    for (const mot of mots) {
      if (ligne.length === 0) {
        ligne = mot;
      } else if (ligne.length + 1 + mot.length <= COLS) {
        ligne += " " + mot;
      } else {
        b.ligne(ligne);
        ligne = mot;
      }
    }
    if (ligne.length > 0) b.ligne(ligne);
  }

  // Date longue d'impression : "LUNDI 11 MAI 2026 - 14:32:08"
  // Place sous le message de remerciement / footer custom, en bas de ticket.
  b.saut(1).ligne(formatDateLongueMaj(new Date()));

  // Signature appli en gras
  b.saut(1).gras(true).ligne("CHICKEN NATION APPLI").gras(false);

  b.saut(3).couper();

  return b.build();
}

/**
 * Orchestration d'impression de ticket commande Chicken Nation.
 *
 * Strategie en cascade (premier qui reussit gagne) :
 *   1. WebUSB : imprimante thermique appairee → ESC/POS direct (~0.5s, silencieux)
 *   2. WebBluetooth : imprimante BT appairee (camion/marche)
 *   3. Flutter inAppWebView : si le BO est lance dans l'app native Chicken Nation
 *      (TPE Android avec imprimante interne), on delegue a l'app via le handler
 *      `printDocument`. Conserve l'existant — ne casse pas le flux TPE.
 *   4. Popup HTML 80mm + window.print() : fallback navigateur classique
 *   5. Erreur finale (popup bloquee, aucun transport) : { mode: "ERREUR" }
 *
 * Le caller affiche un toast contextuel selon `mode` + `fallback`.
 */

import {
  appairerImprimanteBT,
  envoyerCommandes,
  envoyerCommandesBT,
  genererTicketEscPos,
  imprimanteBTConnue,
  retrouverImprimante,
  supporteWebBluetooth,
  supporteWebUsb,
  verifierPapier,
  type DeviceBluetooth,
  type InfosBoutique,
  type InfosContexte,
} from "@/lib/escpos";
import type { Order } from "../types/order.types";

export type ModeImpression = "USB" | "BLUETOOTH" | "FLUTTER" | "HTML" | "ERREUR";

export interface ResultatImpression {
  mode: ModeImpression;
  /** Vrai si on a bascule sur un fallback suite a une erreur (USB / BT). */
  fallback: boolean;
  /** Message court a afficher (null si tout s'est bien passe). */
  message?: string;
}

// Cache memoire du device BT pour ne pas redemander le picker a chaque impression.
let deviceBTEnMemoire: DeviceBluetooth | null = null;

interface FlutterInAppWebView {
  callHandler?: (name: string, ...args: unknown[]) => unknown;
}

declare global {
  interface Window {
    flutter_inappwebview?: FlutterInAppWebView;
  }
}

function flutterDispo(): boolean {
  return (
    typeof window !== "undefined" &&
    !!window.flutter_inappwebview?.callHandler
  );
}

/**
 * Imprime une commande Chicken Nation.
 *
 * @param order      commande complete (avec order_items et paiements) — sinon
 *                   les lignes seront absentes du ticket
 * @param boutique   nom restaurant + adresse/tel/devise
 * @param contexte   caissier, duplicata, message footer custom
 * @param options    `forcer` : sauter directement a un mode donne
 */
export async function imprimerTicket(
  order: Order,
  boutique: InfosBoutique,
  contexte: InfosContexte = {},
  options: { forcer?: ModeImpression } = {},
): Promise<ResultatImpression> {
  const force = options.forcer;

  // Cas explicite : caller veut un mode precis (depuis la page de test)
  if (force === "HTML") {
    return imprimerViaPopup(order, boutique, contexte);
  }
  if (force === "FLUTTER") {
    return imprimerViaFlutter(order);
  }

  // 1. USB (boutique fixe)
  if (supporteWebUsb() && (!force || force === "USB")) {
    try {
      const device = await retrouverImprimante();
      if (device) {
        const etat = await verifierPapier(device);
        if (etat?.vide) {
          throw new Error(
            "Rouleau de papier épuisé — remplacez le rouleau avant de continuer",
          );
        }
        const data = genererTicketEscPos(order, boutique, contexte);
        await envoyerCommandes(device, data);
        return { mode: "USB", fallback: false };
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[imprimerTicket] USB échec:", message);
      // tente BT puis Flutter puis HTML
      const resBT = await tenterImpressionBT(order, boutique, contexte);
      if (resBT) return { ...resBT, fallback: true, message };
      if (flutterDispo()) return imprimerViaFlutter(order, true, message);
      return imprimerViaPopup(order, boutique, contexte, true, message);
    }
  }

  // 2. Bluetooth (camion/marche)
  if (!force || force === "BLUETOOTH") {
    const resBT = await tenterImpressionBT(order, boutique, contexte);
    if (resBT) return resBT;
  }

  // 3. Flutter handler (TPE Android wrapper natif) — conserve l'existant
  if (flutterDispo()) return imprimerViaFlutter(order);

  // 4. Fallback popup HTML
  return imprimerViaPopup(order, boutique, contexte);
}

async function tenterImpressionBT(
  order: Order,
  boutique: InfosBoutique,
  contexte: InfosContexte,
): Promise<ResultatImpression | null> {
  if (!supporteWebBluetooth() || !imprimanteBTConnue()) return null;
  try {
    if (!deviceBTEnMemoire) {
      deviceBTEnMemoire = await appairerImprimanteBT(false);
    }
    const data = genererTicketEscPos(order, boutique, contexte);
    await envoyerCommandesBT(deviceBTEnMemoire, data);
    return { mode: "BLUETOOTH", fallback: false };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[imprimerTicket] BT échec:", message);
    deviceBTEnMemoire = null;
    return null;
  }
}

function imprimerViaFlutter(
  order: Order,
  fallback = false,
  message?: string,
): ResultatImpression {
  try {
    window.flutter_inappwebview?.callHandler?.("printDocument", order);
    return { mode: "FLUTTER", fallback, message };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("[imprimerTicket] Flutter échec:", errMsg);
    return { mode: "ERREUR", fallback: true, message: errMsg };
  }
}

function imprimerViaPopup(
  order: Order,
  boutique: InfosBoutique,
  contexte: InfosContexte,
  fallback = false,
  message?: string,
): ResultatImpression {
  try {
    const html = construireHtml(order, boutique, contexte);
    const fenetre = window.open("", "_blank", "width=380,height=600");
    if (!fenetre) {
      // Bloqueur de popup actif : on tente blob URL
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const ouverte = window.open(url, "_blank");
      if (!ouverte) {
        return {
          mode: "ERREUR",
          fallback: true,
          message: "Bloqueur de popup actif : autorisez les popups pour imprimer",
        };
      }
      return { mode: "HTML", fallback, message };
    }
    fenetre.document.open();
    fenetre.document.write(html);
    fenetre.document.close();
    fenetre.focus();
    setTimeout(() => fenetre.print(), 200);
    return { mode: "HTML", fallback, message };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return { mode: "ERREUR", fallback: true, message: errMsg };
  }
}

// ─── HTML 80mm pour fallback ────────────────────────────────────────────

function echapperHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatMontant(n: number | null | undefined): string {
  return new Intl.NumberFormat("fr-FR").format(Math.round(Number(n ?? 0)));
}

const LABEL_TYPE: Record<string, string> = {
  DELIVERY: "À LIVRER",
  PICKUP: "À EMPORTER",
  TABLE: "SUR PLACE",
};
const LABEL_MODE_PAIEMENT: Record<string, string> = {
  MOBILE_MONEY: "Mobile Money",
  WALLET: "Wallet",
  CARD: "Carte",
  CASH: "Espèces",
};
const LABEL_PAYMENT_METHOD: Record<string, string> = {
  ONLINE: "Application",
  OFFLINE: "Restaurant",
};

/**
 * Date au format "LUNDI 11 05 2026 - 14:32:08".
 * Jour de semaine en lettres majuscules, mois en chiffres sur 2 digits.
 * Aligne sur la version ESC/POS (ticket.ts).
 */
function formatDateLongueMaj(d: Date): string {
  const jour = d.toLocaleDateString("fr-FR", { weekday: "long" }).toUpperCase();
  const dayNum = d.getDate();
  const moisNum = String(d.getMonth() + 1).padStart(2, "0");
  const annee = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${jour} ${dayNum} ${moisNum} ${annee} - ${hh}:${mm}:${ss}`;
}

function construireHtml(
  order: Order,
  boutique: InfosBoutique,
  contexte: InfosContexte,
): string {
  const date = order.date ? new Date(order.date) : new Date();
  const dateStr = date.toLocaleDateString("fr-FR");
  const heureStr = date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const devise = boutique.devise ?? "F CFA";
  const restaurantNom =
    boutique.nom ?? order.restaurant?.name ?? "Chicken Nation";

  const clientName = order.customer
    ? [order.customer.first_name, order.customer.last_name]
        .filter(Boolean)
        .join(" ")
        .trim()
    : order.fullname?.trim() ?? "";
  const clientPhone = order.customer?.phone ?? order.phone ?? "";

  let adresse = order.address ?? "";
  if (adresse) {
    try {
      const parsed = JSON.parse(adresse);
      adresse = parsed?.address || parsed?.title || adresse;
    } catch {
      /* plain string */
    }
  }

  const lignes = (order.order_items ?? [])
    .map((item) => {
      const nom = item.dish?.name ?? "Plat";
      const total = formatMontant(item.amount);
      const prixUnitaire = item.dish?.price ?? item.amount / Math.max(item.quantity, 1);
      const supps = Array.isArray(item.supplements) ? item.supplements : [];
      const suppsHtml = supps.length
        ? `<div class="supps">${supps
            .map((s) => {
              const qty = (s as { quantity?: number }).quantity ?? 1;
              const prix = s.price ? ` (${formatMontant(s.price * qty)})` : "";
              return `+ ${echapperHtml(s.name)} ×${qty}${prix}`;
            })
            .join("<br>")}</div>`
        : "";
      return `
        <tr>
          <td class="nom">
            ${echapperHtml(nom)}${item.epice ? ' <span class="epice">[épicé]</span>' : ""}
            <div class="qp">${item.quantity} × ${formatMontant(prixUnitaire)}</div>
            ${suppsHtml}
          </td>
          <td class="total">${total}</td>
        </tr>`;
    })
    .join("");

  const paiementsHtml = (order.paiements ?? [])
    .map(
      (p) => `
      <div class="lf">
        <span>${echapperHtml(LABEL_MODE_PAIEMENT[p.mode] ?? p.mode)}</span>
        <span>${formatMontant(p.amount)}</span>
      </div>`,
    )
    .join("");

  const footerCustom = (contexte.footerMessage ?? "").trim().slice(0, 200);

  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>Ticket ${echapperHtml(order.reference)}</title>
  <style>
    @page { size: 80mm auto; margin: 4mm; }
    * { box-sizing: border-box; }
    body {
      font-family: ui-monospace, "SF Mono", Menlo, monospace;
      font-size: 12px;
      margin: 0;
      padding: 0;
      width: 72mm;
    }
    .center { text-align: center; }
    .gros { font-size: 16px; font-weight: bold; }
    .sep { border-top: 1px dashed #000; margin: 6px 0; }
    .double-sep { border-top: 2px solid #000; margin: 6px 0; }
    .lf { display: flex; justify-content: space-between; gap: 6px; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 2px 0; vertical-align: top; }
    td.total { text-align: right; white-space: nowrap; padding-left: 6px; }
    .qp { font-size: 11px; color: #444; }
    .supps { font-size: 11px; color: #444; padding-left: 8px; margin-top: 2px; }
    .epice { color: #c00; font-size: 10px; }
    .total-final { font-size: 16px; font-weight: bold; }
    .footer { text-align: center; margin-top: 12px; }
    .nopay { color: #c00; font-weight: bold; }
    @media print {
      body { width: auto; }
    }
  </style>
</head>
<body>
  <div class="center gros">${echapperHtml((restaurantNom).toUpperCase())}</div>
  ${boutique.adresse ? `<div class="center">${echapperHtml(boutique.adresse)}</div>` : ""}
  ${boutique.telephone ? `<div class="center">Tel : ${echapperHtml(boutique.telephone)}</div>` : ""}
  ${boutique.email ? `<div class="center">Email : ${echapperHtml(boutique.email)}</div>` : ""}
  <div class="center">${dateStr} ${heureStr}</div>
  ${contexte.duplicata ? `<div class="center" style="font-weight:bold">*** DUPLICATA ***</div>` : ""}
  <div class="sep"></div>

  <div><strong>Ticket #${echapperHtml(order.reference)}</strong></div>
  <div class="lf"><span>Type :</span><span>${LABEL_TYPE[order.type] ?? order.type}</span></div>
  ${order.table_type ? `<div class="lf"><span>Table :</span><span>${echapperHtml(order.table_type.replace("TABLE_", ""))}</span></div>` : ""}
  ${order.places ? `<div class="lf"><span>Couverts :</span><span>${order.places}</span></div>` : ""}
  ${contexte.caissier ? `<div class="lf"><span>Caissier :</span><span>${echapperHtml(contexte.caissier)}</span></div>` : ""}
  <div class="sep"></div>

  ${clientName ? `<div><strong>Client :</strong> ${echapperHtml(clientName)}</div>` : ""}
  ${clientPhone ? `<div><strong>Tel&nbsp;&nbsp;&nbsp;&nbsp;:</strong> ${echapperHtml(clientPhone)}</div>` : ""}
  ${order.type === "DELIVERY" && adresse ? `<div><strong>Adresse :</strong> ${echapperHtml(adresse)}</div>` : ""}
  ${order.note ? `<div><strong>Note :</strong> ${echapperHtml(order.note)}</div>` : ""}
  ${clientName || clientPhone || (order.type === "DELIVERY" && adresse) || order.note ? `<div class="sep"></div>` : ""}

  <table>${lignes}</table>
  <div class="sep"></div>

  <div class="lf"><span>Sous-total</span><span>${formatMontant(order.net_amount)}</span></div>
  ${order.discount && order.discount > 0 ? `<div class="lf"><span>${order.code_promo ? `Promo (${echapperHtml(order.code_promo)})` : "Remise"}</span><span>- ${formatMontant(order.discount)}</span></div>` : ""}
  ${order.delivery_fee && order.delivery_fee > 0 ? `<div class="lf"><span>Livraison</span><span>${formatMontant(order.delivery_fee)}</span></div>` : ""}
  ${order.tax && order.tax > 0 ? `<div class="lf"><span>Taxe</span><span>${formatMontant(order.tax)}</span></div>` : ""}
  ${order.points && order.points > 0 ? `<div class="lf"><span>Points fidélité utilisés</span><span>- ${formatMontant(order.points)}</span></div>` : ""}
  <div class="double-sep"></div>
  <div class="lf total-final"><span>TOTAL</span><span>${formatMontant(order.amount)} ${devise}</span></div>
  <div class="double-sep"></div>

  ${
    paiementsHtml
      ? `<div><strong>Paiement :</strong></div>${paiementsHtml}`
      : order.payment_method
      ? `<div class="lf"><span><strong>Paiement :</strong></span><span>${LABEL_PAYMENT_METHOD[order.payment_method] ?? order.payment_method}</span></div>`
      : ""
  }
  ${!order.paied ? `<div class="nopay center">&gt;&gt;&gt; NON PAYÉ &lt;&lt;&lt;</div>` : ""}

  <div class="footer">
    ${order.paied ? "Merci de votre commande !" : "À RÉGLER"}
    ${footerCustom ? `<div style="margin-top:8px">${echapperHtml(footerCustom)}</div>` : ""}
    <div style="margin-top:10px;font-size:11px;color:#222">${formatDateLongueMaj(new Date())}</div>
    <div style="margin-top:6px;font-weight:bold">CHICKEN NATION APPLI</div>
  </div>
</body>
</html>`;
}

"use client";

import React from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Banknote,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Hash,
  Loader2,
  Mail,
  ChevronDown,
  ChevronUp,
  MapPin,
  Package,
  PackageCheck,
  PencilLine,
  Phone,
  ShoppingBag,
  Sparkles,
  StickyNote,
  Store,
  Truck,
  User,
  UserCheck,
  UtensilsCrossed,
} from "lucide-react";
import SafeImage from "@/components/ui/SafeImage";
import { BoutonCopierLien } from "@/components/ui/CopierLien";
import { lienCommande } from "@/utils/deeplinks";

import { useAuthStore } from "../../../users/hook/authStore";
import { UserRole } from "../../../users/types/user.types";
import { type Order } from "../../../orders/types/order.types";
import {
  DeliveryMapCanvas,
  DeliveryRouteSummary,
  hasDeliveryPoint,
} from "../../../orders/components/detail-order/DeliveryMapSection";
import { useOrderDetailQuery } from "../../../orders/queries/order-detail.query";
import { mapApiOrderToUiOrder } from "../../../orders/utils/orderMapper";
import TurboCancellationBanner from "../../../orders/components/detail-order/TurboCancellationBanner";
import type { OrderTable, OrderTableItem } from "../../../orders/types/ordersTable.types";
import { getStatusBadgeClasses, getTypeMeta } from "../../utils/status-colors";

interface Props {
  order: Order;
}

function formatPrice(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return `${n.toLocaleString("fr-FR").replace(/\s/g, ".")} F`;
}

/**
 * Tab Détails — design custom XL du drawer Opérations (pas une copie de la page
 * detail-commande). Hero gradient brand, cards spacieuses indépendantes, steppeur
 * horizontal premium, articles à l'horizontale avec image 96 px, total XL.
 *
 * Règle absolue : aucun enum technique ne fuit dans l'UI. On consomme uniquement
 * les champs traduits du mapper (`ui.orderType`, `ui.status`, `ui.deliveryService`,
 * `ui.paymentChannel`), jamais `source.type`/`source.status` directement.
 */
export function DrawerDetailsTab({ order }: Props) {
  const { data: full, isLoading, isError } = useOrderDetailQuery(order.id);
  const source = (full as Order | undefined) ?? order;
  const ui = React.useMemo(() => mapApiOrderToUiOrder(source), [source]);

  if (isLoading && !full) {
    return (
      <div className="p-16 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#F17922]" />
        <p className="text-sm text-gray-500">Chargement du détail…</p>
      </div>
    );
  }
  if (isError && !full) {
    return (
      <div className="m-5 p-5 rounded-2xl bg-red-50 border border-red-200 text-sm text-red-700">
        Impossible de charger le détail complet de la commande.
      </div>
    );
  }

  return (
    <div className="p-5 md:p-6 space-y-5">
      <TurboCancellationBanner order={ui} />
      <HeroBlock ui={ui} source={source} />
      <ClientBlock ui={ui} />
      <NoteBlock ui={ui} />
      <ItemsBlock ui={ui} />
      <PriceBlock ui={ui} />
      <ProgressBlock ui={ui} />
      <InfoBlock ui={ui} source={source} />
    </div>
  );
}

// ─── Shared atoms ──────────────────────────────────────────────────────────

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-3xl border border-gray-100 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function SectionTitle({
  icon,
  title,
  suffix,
}: {
  icon: React.ReactNode;
  title: string;
  suffix?: string;
}) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <span className="w-8 h-8 rounded-xl bg-[#FFF0E4] text-[#F17922] flex items-center justify-center">
        {icon}
      </span>
      <h3 className="text-[15px] font-bold text-gray-900">{title}</h3>
      {suffix && <span className="text-xs text-gray-400 ml-auto">{suffix}</span>}
    </div>
  );
}

type ChipTone = "warm" | "blue" | "green" | "amber" | "yellow" | "gray";

function Chip({ children, tone }: { children: React.ReactNode; tone: ChipTone }) {
  const cls: Record<ChipTone, string> = {
    warm: "bg-[#FFF0E4] text-[#F17922] border-[#F17922]/20",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    green: "bg-green-50 text-green-700 border-green-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    yellow: "bg-yellow-50 text-yellow-800 border-yellow-200",
    gray: "bg-gray-100 text-gray-700 border-gray-200",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${cls[tone]}`}
    >
      {children}
    </span>
  );
}

// ─── Hero ──────────────────────────────────────────────────────────────────

function HeroBlock({ ui, source }: { ui: OrderTable; source: Order }) {
  const statusCls = getStatusBadgeClasses(source.status);
  const typeMeta = getTypeMeta(source.type);
  return (
    <Card className="overflow-hidden">
      <div className="relative bg-gradient-to-br from-[#FFF0E4] via-white to-amber-50/40 p-6 md:p-7">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <p className="text-[10px] uppercase font-bold text-[#F17922] tracking-[0.18em]">
              Commande
            </p>
            <h2 className="mt-1 text-2xl md:text-3xl font-black text-gray-900 truncate">
              {ui.reference}
            </h2>
            <p className="mt-1 text-xs text-gray-500 capitalize">
              {format(new Date(source.created_at), "EEEE dd MMMM yyyy · HH:mm", { locale: fr })}
            </p>
            {/*
              ⚠️ Le lien porte l'identifiant TECHNIQUE, jamais la référence
              affichée au dessus. L'application pousse « /orders/<valeur> » sans
              rien résoudre : avec une référence du type CN-1234, le client
              tomberait sur une commande introuvable.

              Utile pour un suivi envoyé par message au client.
            */}
            <div className="mt-2.5">
              <BoutonCopierLien
                lien={lienCommande(ui.id)}
                quoi="Lien de suivi"
                libelle="Copier le lien de suivi"
                compact
              />
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">À payer</p>
            <p className="mt-1 text-3xl md:text-4xl font-black text-[#F17922] tabular-nums">
              {formatPrice(ui.amount)}
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {/* Statut — couleurs alignées sur la page Commandes */}
          <span
            className={`inline-flex items-center text-[11px] font-bold px-2.5 py-1 rounded-full border-2 ${statusCls}`}
          >
            {ui.status}
          </span>
          {/* Type — couleurs alignées sur la page Commandes */}
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${typeMeta.cls}`}
          >
            <typeMeta.Icon className="w-3 h-3" />
            {typeMeta.label}
          </span>
          <Chip tone={ui.paied ? "green" : "amber"}>
            {ui.paied ? (
              <>
                <CheckCircle2 className="w-3 h-3" /> Payée
              </>
            ) : (
              <>
                <Clock className="w-3 h-3" /> À encaisser
              </>
            )}
          </Chip>
          {!ui.auto && (
            <Chip tone="yellow">
              <Sparkles className="w-3 h-3" /> Commande manuelle
            </Chip>
          )}
        </div>
      </div>
    </Card>
  );
}

// ─── Client ────────────────────────────────────────────────────────────────

function ClientBlock({ ui }: { ui: OrderTable }) {
  const name = ui.clientName || "Client";
  // Carte restaurant → client, dépliée par un clic sur l'ADRESSE elle-même :
  // c'est l'information géographique qui sert d'affordance, pas un lien à part.
  const [mapOpen, setMapOpen] = React.useState(false);
  const mappable = ui.orderType === "À livrer" && hasDeliveryPoint(ui);
  const initials =
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0])
      .join("")
      .toUpperCase() || "";
  return (
    <Card className="p-5 md:p-6">
      <SectionTitle icon={<User className="w-4 h-4" />} title="Client" />
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#F17922] to-amber-500 flex items-center justify-center text-white font-black text-base shrink-0">
          {initials || <User className="w-6 h-6" />}
        </div>
        <div className="flex-1 min-w-0 space-y-1.5">
          <p className="text-base font-bold text-gray-900 truncate">{name}</p>
          {ui.clientPhone && (
            <a
              href={`tel:${ui.clientPhone}`}
              className="inline-flex items-center gap-1.5 text-xs text-[#F17922] font-semibold hover:underline"
            >
              <Phone className="w-3.5 h-3.5" /> {ui.clientPhone}
            </a>
          )}
          {ui.clientEmail && (
            <p className="flex items-center gap-1.5 text-xs text-gray-600">
              <Mail className="w-3.5 h-3.5 text-gray-400" />
              <span className="truncate">{ui.clientEmail}</span>
            </p>
          )}
          {ui.address &&
            (mappable ? (
              <button
                type="button"
                onClick={() => setMapOpen((v) => !v)}
                aria-expanded={mapOpen}
                className="group flex items-start gap-1.5 text-xs text-left cursor-pointer"
                title={mapOpen ? "Masquer la carte" : "Voir sur la carte"}
              >
                <MapPin className="w-3.5 h-3.5 text-[#F17922] mt-0.5 shrink-0" />
                <span className="text-[#F17922] font-semibold underline decoration-dotted underline-offset-2 group-hover:decoration-solid">
                  {ui.address}
                </span>
                {mapOpen ? (
                  <ChevronUp className="w-3.5 h-3.5 text-[#F17922] mt-0.5 shrink-0" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-[#F17922] mt-0.5 shrink-0" />
                )}
              </button>
            ) : (
              <p className="flex items-start gap-1.5 text-xs text-gray-600">
                <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                <span>{ui.address}</span>
              </p>
            ))}
          {/* Distance + temps de trajet estimé — visibles sans ouvrir la carte. */}
          <DeliveryRouteSummary order={ui} className="mt-0.5" />
        </div>
      </div>

      {/* Carte montée uniquement dépliée : aucune tuile Google chargée avant. */}
      {mappable && mapOpen && (
        <div className="mt-4">
          <DeliveryMapCanvas order={ui} height={260} />
        </div>
      )}
    </Card>
  );
}

// ─── Note client ───────────────────────────────────────────────────────────

function NoteBlock({ ui }: { ui: OrderTable }) {
  if (!ui.note) return null;
  return (
    <div className="bg-amber-50 rounded-3xl border border-amber-200 shadow-sm p-5 md:p-6">
      <div className="flex items-center gap-2.5 mb-3">
        <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
          <StickyNote className="w-4 h-4" />
        </span>
        <h3 className="text-[15px] font-bold text-amber-900">Note client</h3>
      </div>
      <p className="text-sm text-amber-900 whitespace-pre-wrap">{ui.note}</p>
    </div>
  );
}

// ─── Articles ──────────────────────────────────────────────────────────────

function ItemsBlock({ ui }: { ui: OrderTable }) {
  const lignes = ui.items?.length ?? 0;
  /**
   * ⚠️ On compte les ARTICLES A PREPARER, pas les lignes.
   *
   * L'en-tête affichait `items.length`. Sur une commande de deux burgers et
   * une boisson, elle annonçait « 2 articles » alors qu'il y en a trois à
   * mettre dans le sac. C'est exactement le genre d'écart qui fait partir une
   * commande incomplète.
   */
  const articles = ui.items?.reduce((n, it) => n + (it.quantity || 1), 0) ?? 0;
  return (
    <Card className="p-5 md:p-6">
      <SectionTitle
        icon={<UtensilsCrossed className="w-4 h-4" />}
        title="Articles"
        suffix={articles > 0 ? `${articles} article${articles > 1 ? "s" : ""}` : undefined}
      />
      {lignes === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">Aucun article</p>
      ) : (
        <ul className="space-y-5">
          {ui.items.map((it) => (
            <ItemRow key={it.id} item={it} />
          ))}
        </ul>
      )}
    </Card>
  );
}

function ItemRow({ item }: { item: OrderTableItem }) {
  // Total FIGÉ à la commande, options comprises. L'ancien calcul additionnait
  // `amount` et les suppléments : or `amount` porte le prix UNITAIRE sur le
  // canal centre d'appel, donc toute commande téléphonée de quantité
  // supérieure à 1 était sous-affichée.
  const lineTotal = item.lineTotal;
  const multiple = (item.quantity || 1) > 1;
  const supplementsUnites =
    item.rawSupplements?.reduce((n, sup) => n + (sup.quantity || 1), 0) ?? 0;
  return (
    <li className="flex gap-4">
      <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-gray-100 ring-1 ring-gray-200 shrink-0">
        <SafeImage
          src={item.image}
          alt={item.name || "Article"}
          width={96}
          height={96}
          className="object-cover w-full h-full"
        />
        {item.price === 0 && (
          <span className="absolute bottom-0 inset-x-0 bg-[#F17922] text-white text-[9px] font-bold text-center py-0.5">
            Offert
          </span>
        )}
        {/*
          ⚠️ Pastille de quantité LISIBLE.
          C'était un « ×1 » de 10 px en blanc translucide posé sur une image
          claire : illisible d'un coup d'œil. Une quantité supérieure à 1 passe
          en orange plein, parce que c'est le seul cas où se tromper coûte
          quelque chose.
        */}
        <span
          className={`absolute top-1.5 right-1.5 rounded-lg shadow-sm font-black tabular-nums ${
            multiple
              ? "px-2 py-1 text-sm bg-[#F17922] text-white ring-2 ring-white"
              : "px-1.5 py-0.5 text-[11px] bg-gray-900/85 text-white"
          }`}
        >
          ×{item.quantity}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            {/*
              Second rappel de la quantité, juste avant le nom, et seulement
              quand elle dépasse 1. La redondance est volontaire : une caissière
              lit vite, et deux occasions de voir « ×2 » valent mieux qu'une.
            */}
            <h4 className="text-sm font-bold text-gray-900 flex items-baseline gap-1.5 min-w-0">
              {multiple && (
                <span className="shrink-0 px-1.5 py-0.5 rounded-md bg-[#F17922] text-white text-xs font-black tabular-nums">
                  ×{item.quantity}
                </span>
              )}
              <span className="truncate">{item.name}</span>
            </h4>
            <div className="mt-1.5 flex gap-1 flex-wrap">
              {item.epice ? (
                <Chip tone="warm">🌶️ Épicé</Chip>
              ) : (
                <Chip tone="green">🌿 Non épicé</Chip>
              )}
            </div>
          </div>
          <p className="text-base font-black text-[#F17922] tabular-nums shrink-0">
            {item.price === 0 ? "Offert" : formatPrice(lineTotal)}
          </p>
        </div>
        {item.options.length > 0 && (
          <div className="mt-2.5 p-2.5 rounded-xl bg-orange-50/70 border border-orange-100">
            <div className="flex items-center gap-1 mb-1">
              <UtensilsCrossed className="w-3 h-3 text-[#F17922]" />
              <span className="text-[10px] font-bold uppercase text-[#F17922] tracking-wider">
                Composition
              </span>
            </div>
            <p className="text-[11px] font-semibold text-gray-700">
              {/* Valeurs seules : le nom du groupe se devine, « Taille : XL »
                  n'apprend rien de plus que « XL » et double la longueur. */}
              {item.options.map((o) => o.label).join(" · ")}
            </p>
          </div>
        )}
        {item.supplements && (
          <div className="mt-2.5 p-2.5 rounded-xl bg-gray-50 border border-gray-100">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Package className="w-3 h-3 text-gray-400" />
              <span className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">
                Suppléments
              </span>
              {supplementsUnites > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-[#F17922]/10 text-[#F17922] text-[10px] font-bold tabular-nums">
                  {/*
                    ⚠️ Le mot « unité » est indispensable.
                    Ce compteur affichait un nombre nu, qui se lisait aussi bien
                    comme « une ligne de supplément » que comme « une unité ».
                  */}
                  {supplementsUnites} unité{supplementsUnites > 1 ? "s" : ""}
                </span>
              )}
            </div>
            {/*
              ⚠️ Un supplément PAR LIGNE, avec sa quantité.
              Le bloc affichait une chaîne assemblée d'avance, sans aucune
              quantité : « CHEDDAR FRIES » se lisait comme une portion alors
              qu'il pouvait y en avoir trois. La donnée existait pourtant,
              simplement jetée à l'affichage.
            */}
            {item.rawSupplements && item.rawSupplements.length > 0 ? (
              <ul className="space-y-1">
                {item.rawSupplements.map((sup, i) => {
                  const qte = sup.quantity || 1;
                  return (
                    <li key={sup.id || i} className="flex items-center gap-2">
                      <span
                        className={`shrink-0 w-8 text-center px-1 py-0.5 rounded-md text-[11px] font-black tabular-nums ${
                          qte > 1 ? "bg-[#F17922] text-white" : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        ×{qte}
                      </span>
                      <span className="flex-1 min-w-0 truncate text-xs font-semibold text-gray-800">
                        {sup.name}
                      </span>
                      <span className="shrink-0 text-[11px] font-semibold text-gray-500 tabular-nums">
                        {sup.offert ? "offert" : `+ ${formatPrice((sup.price || 0) * qte)}`}
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              // Repli pour les commandes anciennes, dont le détail par
              // supplément n'a pas été conservé.
              <p className="text-xs text-gray-700">{item.supplements}</p>
            )}
            {(item.supplementsPrice || 0) > 0 &&
              (item.rawSupplements?.length ?? 0) !== 1 && (
                <p className="mt-1.5 pt-1.5 border-t border-gray-200 text-[11px] font-bold text-gray-600 text-right tabular-nums">
                  Total suppléments : {formatPrice(item.supplementsPrice)}
                </p>
              )}
          </div>
        )}
      </div>
    </li>
  );
}

// ─── Récapitulatif ─────────────────────────────────────────────────────────

function PriceBlock({ ui }: { ui: OrderTable }) {
  const sources = getDiscountSources(ui);
  return (
    <Card className="p-5 md:p-6">
      <SectionTitle icon={<CreditCard className="w-4 h-4" />} title="Récapitulatif" />
      <dl className="space-y-2.5">
        <Line label="Sous-total" value={formatPrice(ui.netAmount)} />
        {(ui.tax || 0) > 0 && <Line label="Taxe" value={formatPrice(ui.tax)} />}
        {/* À livrer : la ligne apparaît TOUJOURS — « Gratuite » quand les
            frais sont offerts (offre de livraison), sinon le montant. */}
        {ui.orderType === "À livrer" &&
          ((ui.deliveryFee || 0) > 0 ? (
            <Line label="Frais de livraison" value={formatPrice(ui.deliveryFee)} />
          ) : (
            <Line label="Frais de livraison" value="Gratuite" tone="green" />
          ))}
        {(ui.discount || 0) > 0 && (
          <Line
            label={sources.length > 0 ? `Réduction · ${sources.join(", ")}` : "Réduction"}
            value={`− ${formatPrice(ui.discount)}`}
            tone="green"
          />
        )}
      </dl>
      <div className="mt-4 pt-4 border-t-2 border-gray-100 flex items-center justify-between">
        <dt className="text-base font-bold text-gray-900">Total</dt>
        <dd className="text-2xl md:text-3xl font-black text-[#F17922] tabular-nums">
          {formatPrice(ui.amount)}
        </dd>
      </div>
    </Card>
  );
}

function getDiscountSources(ui: OrderTable): string[] {
  const s: string[] = [];
  if ((ui.points || 0) > 0) s.push(`Points (${ui.points})`);
  if (ui.codePromo) s.push(`Code ${ui.codePromo}`);
  if (ui.promotionTitle) s.push(ui.promotionTitle);
  return s;
}

function Line({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "green";
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-sm text-gray-600">{label}</dt>
      <dd
        className={`text-sm font-semibold tabular-nums ${
          tone === "green" ? "text-green-700" : "text-gray-900"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

// ─── Progression ───────────────────────────────────────────────────────────

// Labels alignés sur le mapper `orderMapper.ts` : Nouvelle / Prêt / Collectée / Livrée / Terminée.
const PROGRESS_STEPS = [
  { key: "created", label: "Nouvelle", Icon: ShoppingBag, pick: (u: OrderTable) => u.createdAt },
  { key: "ready", label: "Prêt", Icon: PackageCheck, pick: (u: OrderTable) => u.readyAt },
  { key: "picked", label: "Collectée", Icon: Package, pick: (u: OrderTable) => u.pickedUpAt },
  { key: "collected", label: "Livrée", Icon: Truck, pick: (u: OrderTable) => u.collectedAt },
  { key: "done", label: "Terminée", Icon: CheckCircle2, pick: (u: OrderTable) => u.completedAt },
] as const;

function ProgressBlock({ ui }: { ui: OrderTable }) {
  return (
    <Card className="p-5 md:p-6">
      <SectionTitle icon={<Clock className="w-4 h-4" />} title="Progression" />
      <ol className="flex items-start">
        {PROGRESS_STEPS.map((s, i) => {
          const at = s.pick(ui);
          const reached = !!at;
          const prevAt = i > 0 ? PROGRESS_STEPS[i - 1].pick(ui) : null;
          return (
            <li key={s.key} className="flex-1 flex flex-col items-center relative min-w-0">
              {i > 0 && (
                <div
                  className={`absolute top-5 right-1/2 w-full h-1 rounded-full ${
                    prevAt && reached ? "bg-[#F17922]" : "bg-gray-100"
                  }`}
                />
              )}
              <div
                className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center ring-4 ring-white ${
                  reached
                    ? "bg-[#F17922] text-white shadow-md shadow-[#F17922]/30"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                <s.Icon className="w-4 h-4" />
              </div>
              <p
                className={`mt-2 text-[11px] font-bold text-center ${
                  reached ? "text-gray-900" : "text-gray-400"
                }`}
              >
                {s.label}
              </p>
              {at ? (
                <p className="text-[10px] text-gray-500 mt-0.5 tabular-nums">
                  {format(new Date(at), "HH:mm")}
                </p>
              ) : (
                <p className="text-[10px] text-gray-300 mt-0.5">—</p>
              )}
            </li>
          );
        })}
      </ol>
    </Card>
  );
}

// ─── Informations ──────────────────────────────────────────────────────────

function InfoBlock({ ui, source }: { ui: OrderTable; source: Order }) {
  // Audit créateur / dernier modificateur : réservé à l'ADMIN.
  const role = useAuthStore((s) => s.user?.role);
  const isAdmin = role === UserRole.ADMIN;

  const creatorName = source.user
    ? source.user.fullname || source.user.email || "Staff"
    : "Client (application)";
  const modifierName = source.updated_by_user
    ? source.updated_by_user.fullname || source.updated_by_user.email || "Staff"
    : null;

  return (
    <Card className="p-5 md:p-6">
      <SectionTitle icon={<Hash className="w-4 h-4" />} title="Informations" />
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-3.5">
        <Field icon={<Store className="w-3.5 h-3.5" />} label="Restaurant" value={ui.restaurantName} />
        <Field
          icon={<Calendar className="w-3.5 h-3.5" />}
          label="Créée le"
          value={format(new Date(source.created_at), "dd/MM/yyyy HH:mm")}
        />
        <Field icon={<ShoppingBag className="w-3.5 h-3.5" />} label="Type" value={ui.orderType} />
        <Field
          icon={<Truck className="w-3.5 h-3.5" />}
          label="Service livraison"
          value={ui.deliveryService}
        />
        <Field
          icon={<Banknote className="w-3.5 h-3.5" />}
          label="Canal paiement"
          value={ui.paymentChannel}
        />
        {ui.paymentMode && ui.paymentMode !== "Non renseigné" && (
          <Field
            icon={<CreditCard className="w-3.5 h-3.5" />}
            label="Mode"
            value={ui.paymentMode}
          />
        )}
        <Field
          icon={<Sparkles className="w-3.5 h-3.5" />}
          label="Source"
          value={ui.auto ? "Application" : "Manuel"}
        />

        {/* Audit staff — ADMIN uniquement */}
        {isAdmin && (
          <>
            <Field
              icon={<UserCheck className="w-3.5 h-3.5" />}
              label="Créée par"
              value={creatorName}
            />
            <Field
              icon={<PencilLine className="w-3.5 h-3.5" />}
              label="Dernière modification"
              value={
                modifierName
                  ? `${modifierName} · ${format(new Date(source.updated_at), "dd/MM HH:mm")}`
                  : "—"
              }
            />
          </>
        )}
      </dl>
    </Card>
  );
}

function Field({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1 mb-0.5">
        {icon}
        {label}
      </p>
      <p className="text-sm font-semibold text-gray-900 truncate">{value}</p>
    </div>
  );
}

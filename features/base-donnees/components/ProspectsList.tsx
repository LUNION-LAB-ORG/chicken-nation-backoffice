"use client";

import React, { useState } from "react";
import { Inbox, Loader2, PhoneCall, Search, Ticket } from "lucide-react";

import { useProspectListQuery } from "../queries/prospect-list.query";
import {
  useMarkCallBulkMutation,
  useSendCouponBulkMutation,
} from "../queries/prospect-actions.mutation";
import {
  ProspectPlatform,
  ProspectQuery,
  ProspectStatus,
  ResultatGroupe,
} from "../types/prospect.types";
import {
  PLATFORM_META,
  PROSPECT_STATUSES,
  STATUS_META,
} from "../utils/prospect-ui";

const PAGE_SIZE = 20;

function StatusBadge({ status }: { status: ProspectStatus }) {
  const m = STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${m.bg} ${m.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

function PlatformChip({ platform }: { platform: ProspectPlatform }) {
  const m = PLATFORM_META[platform];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${m.className}`}
    >
      <span>{m.emoji}</span> {m.label}
    </span>
  );
}

/**
 * Case à cocher de sélection.
 *
 * `indeterminate` n'existe pas en attribut HTML, seulement en propriété du
 * nœud : c'est ce qui donne à l'en-tête son trait horizontal quand une partie
 * seulement de la page est cochée. D'où la ref.
 *
 * Le clic est arrêté net : la ligne qui l'entoure ouvre la fiche du contact,
 * et cocher une case ne doit pas ouvrir un panneau.
 */
function Case({
  cochee,
  indeterminee = false,
  onBasculer,
  label,
}: {
  cochee: boolean;
  indeterminee?: boolean;
  onBasculer: () => void;
  label: string;
}) {
  const ref = React.useRef<HTMLInputElement | null>(null);
  React.useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminee && !cochee;
  }, [indeterminee, cochee]);

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={cochee}
      onChange={onBasculer}
      onClick={(e) => e.stopPropagation()}
      aria-label={label}
      className="h-4 w-4 shrink-0 cursor-pointer accent-[#F17922]"
    />
  );
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function ProspectsList({
  onRowClick,
  restaurantId,
  onFiltresChange,
}: {
  onRowClick?: (id: string) => void;
  /** Filtre store piloté par la page (vide = tous ; store-roles déjà scopés côté serveur). */
  restaurantId?: string;
  /**
   * Remonte les filtres à la page, pour que le bouton d'export exporte ce que
   * l'utilisateur voit. Sans cela, le bouton vit dans l'en-tête et ne peut pas
   * connaître la plateforme ni le statut choisis ici.
   */
  onFiltresChange?: (filtres: Record<string, string | undefined>) => void;
} = {}) {
  const [search, setSearch] = useState("");
  const [platform, setPlatform] = useState<ProspectPlatform | "">("");
  const [status, setStatus] = useState<ProspectStatus | "">("");
  const [page, setPage] = useState(1);
  /**
   * SÉLECTION à la page. Le call center descend une page de contacts au
   * téléphone puis les qualifie en bloc ; la sélection n'a donc pas à
   * survivre à un changement de page ou de filtre, où elle porterait sur des
   * lignes que l'agent ne voit plus.
   */
  const [selection, setSelection] = useState<string[]>([]);
  const [resultat, setResultat] = useState<ResultatGroupe | null>(null);
  const [confirmeCoupon, setConfirmeCoupon] = useState(false);

  const qualifier = useMarkCallBulkMutation();
  const servirCoupons = useSendCouponBulkMutation();
  const enCours = qualifier.isPending || servirCoupons.isPending;

  // Revenir page 1 quand le filtre store global change
  React.useEffect(() => {
    setPage(1);
  }, [restaurantId]);

  // La page change, la sélection ne veut plus rien dire.
  React.useEffect(() => {
    setSelection([]);
    setResultat(null);
    setConfirmeCoupon(false);
  }, [page, search, platform, status, restaurantId]);

  const query: ProspectQuery = {
    page,
    limit: PAGE_SIZE,
    ...(search.trim() ? { search: search.trim() } : {}),
    ...(platform ? { platform } : {}),
    ...(status ? { status } : {}),
    ...(restaurantId ? { restaurantId } : {}),
  };
  const { data, isLoading, isFetching } = useProspectListQuery(query);

  React.useEffect(() => {
    onFiltresChange?.({
      search: search.trim() || undefined,
      platform: platform || undefined,
      status: status || undefined,
      restaurantId: restaurantId || undefined,
    });
    // `onFiltresChange` est volontairement hors dépendances : la page la
    // redéfinit à chaque rendu, l'y mettre relancerait l'effet en boucle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, platform, status, restaurantId]);

  const rows = data?.data ?? [];
  const meta = data?.meta;

  const idsPage = rows.map((r) => r.id);
  const choisis = new Set(selection);
  const toutePage =
    idsPage.length > 0 && idsPage.every((id) => choisis.has(id));
  const partielle = !toutePage && idsPage.some((id) => choisis.has(id));

  const basculerLigne = (id: string) =>
    setSelection((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const basculerPage = () => setSelection(toutePage ? [] : idsPage);

  /**
   * Qualifier GARDE la sélection : marquer « joint » puis envoyer le coupon
   * au même lot est le geste courant, et refaire vingt cases entre les deux
   * serait absurde.
   */
  const marquerJoint = async () => {
    setConfirmeCoupon(false);
    const r = await qualifier.mutateAsync({ ids: selection, result: "JOINT" });
    setResultat(r);
  };

  /**
   * Envoyer VIDE la sélection : des SMS sont partis, des codes promo existent,
   * le geste ne se répète pas. Deux temps avant d'agir, pour la même raison.
   */
  const envoyerCoupons = async () => {
    if (!confirmeCoupon) {
      setConfirmeCoupon(true);
      return;
    }
    const ids = selection;
    setConfirmeCoupon(false);
    const r = await servirCoupons.mutateAsync(ids);
    setResultat(r);
    setSelection(r.echecs.map((e) => e.id));
  };

  return (
    <div>
      {/* Filtres — empilés sur mobile, en ligne sur desktop */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 mb-4">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 w-full sm:flex-1 sm:min-w-[220px] sm:max-w-sm">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Rechercher nom, téléphone, n° commande…"
            className="flex-1 min-w-0 text-sm outline-none bg-transparent"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={platform}
            onChange={(e) => {
              setPlatform(e.target.value as ProspectPlatform | "");
              setPage(1);
            }}
            className="flex-1 sm:flex-none border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
          >
            <option value="">Toutes plateformes</option>
            <option value="GLOVO">Glovo</option>
            <option value="YANGO">Yango</option>
          </select>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as ProspectStatus | "");
              setPage(1);
            }}
            className="flex-1 sm:flex-none border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
          >
            <option value="">Tous statuts</option>
            {PROSPECT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_META[s].label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Actions groupées — n'apparaît qu'une fois une ligne cochée */}
      {selection.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-[#F17922]/30 bg-[#FDF3E7] px-3 py-2.5">
          <span className="text-sm font-semibold text-[#8A4B00]">
            {selection.length} sélectionné{selection.length > 1 ? "s" : ""}
          </span>
          <button
            type="button"
            onClick={() => setSelection([])}
            className="text-xs text-gray-500 hover:underline cursor-pointer"
          >
            Tout désélectionner
          </button>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={marquerJoint}
              disabled={enCours}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#F17922]/50 bg-white px-3 py-1.5 text-xs font-semibold text-[#8A4B00] disabled:opacity-50 cursor-pointer"
            >
              {qualifier.isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <PhoneCall size={14} />
              )}
              Marquer joint
            </button>

            <button
              type="button"
              onClick={envoyerCoupons}
              onBlur={() => setConfirmeCoupon(false)}
              disabled={enCours}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50 cursor-pointer ${
                confirmeCoupon ? "bg-[#C0392B]" : "bg-[#F17922]"
              }`}
            >
              {servirCoupons.isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Ticket size={14} />
              )}
              {confirmeCoupon
                ? `Confirmer ${selection.length} SMS ?`
                : "Envoyer le coupon"}
            </button>
          </div>
        </div>
      )}

      {/*
        Compte rendu des écartés. Une notification ne peut pas porter vingt
        lignes, et sans le détail l'agent ne sait pas lesquels reprendre ni
        pourquoi. Après un envoi de coupons, les écartés restent cochés :
        il suffit de corriger et de relancer.
      */}
      {resultat && resultat.echecs.length > 0 && (
        <div className="mb-3 rounded-xl border border-gray-200 bg-white p-3">
          <p className="text-sm font-semibold text-gray-800">
            {resultat.echecs.length} contact
            {resultat.echecs.length > 1 ? "s" : ""} écarté
            {resultat.echecs.length > 1 ? "s" : ""} sur {resultat.demandes}
          </p>
          <ul className="mt-2 space-y-1">
            {resultat.echecs.map((e) => (
              <li key={e.id} className="text-xs leading-relaxed text-gray-600">
                <span className="font-medium text-gray-800">
                  {e.nom ?? e.id}
                </span>{" "}
                : {e.motif}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => setResultat(null)}
            className="mt-2 text-xs text-gray-500 hover:underline cursor-pointer"
          >
            Masquer
          </button>
        </div>
      )}

      {/* États vides / chargement */}
      {isLoading ? (
        <div className="flex items-center justify-center h-56 bg-white border border-gray-200 rounded-xl">
          <Loader2 className="w-6 h-6 animate-spin text-[#F17922]" />
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-56 text-gray-400 bg-white border border-gray-200 rounded-xl">
          <Inbox className="w-10 h-10 mb-2" />
          <p className="text-sm">Aucun contact pour ces filtres.</p>
        </div>
      ) : (
        <>
          {/* Mobile : cartes tap-friendly */}
          <div className="md:hidden space-y-2">
            {rows.map((p) => (
              <div
                key={p.id}
                onClick={() => onRowClick?.(p.id)}
                className={`bg-white border border-gray-200 rounded-xl p-3 ${
                  onRowClick ? "cursor-pointer active:bg-gray-50" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Case
                      cochee={choisis.has(p.id)}
                      onBasculer={() => basculerLigne(p.id)}
                      label={`Sélectionner ${p.name}`}
                    />
                    <PlatformChip platform={p.platform} />
                  </div>
                  <StatusBadge status={p.status} />
                </div>
                <p className="mt-2 font-semibold text-gray-800">{p.name}</p>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-gray-600">
                  <span className="tabular-nums">{p.phone}</span>
                  <span className="text-gray-300">·</span>
                  <span className="tabular-nums">N° {p.order_number}</span>
                </div>
                <div className="mt-1.5 flex items-center justify-between text-xs text-gray-400">
                  <span className="truncate">{p.restaurant?.name ?? "—"}</span>
                  <span className="tabular-nums shrink-0">
                    {formatDate(p.created_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop : tableau */}
          <div className="hidden md:block bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs uppercase">
                    <th className="w-10 px-4 py-3 text-left">
                      <Case
                        cochee={toutePage}
                        indeterminee={partielle}
                        onBasculer={basculerPage}
                        label="Sélectionner toute la page"
                      />
                    </th>
                    <th className="text-left font-semibold px-4 py-3">Date</th>
                    <th className="text-left font-semibold px-4 py-3">Plateforme</th>
                    <th className="text-left font-semibold px-4 py-3">Nom / Pseudo</th>
                    <th className="text-left font-semibold px-4 py-3">N° commande</th>
                    <th className="text-left font-semibold px-4 py-3">Téléphone</th>
                    <th className="text-left font-semibold px-4 py-3">Store</th>
                    <th className="text-left font-semibold px-4 py-3">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => onRowClick?.(p.id)}
                      className={`border-t border-gray-100 hover:bg-gray-50 ${
                        onRowClick ? "cursor-pointer" : ""
                      }`}
                    >
                      <td
                        className="px-4 py-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Case
                          cochee={choisis.has(p.id)}
                          onBasculer={() => basculerLigne(p.id)}
                          label={`Sélectionner ${p.name}`}
                        />
                      </td>
                      <td className="px-4 py-3 text-gray-500 tabular-nums whitespace-nowrap">
                        {formatDate(p.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <PlatformChip platform={p.platform} />
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-800">
                        {p.name}
                      </td>
                      <td className="px-4 py-3 text-gray-500 tabular-nums">
                        {p.order_number}
                      </td>
                      <td className="px-4 py-3 tabular-nums">{p.phone}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {p.restaurant?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={p.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <span className="text-gray-500">
            {meta.total} contact(s) · page {meta.page}/{meta.totalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1 || isFetching}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-50"
            >
              Précédent
            </button>
            <button
              type="button"
              disabled={page >= meta.totalPages || isFetching}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-50"
            >
              Suivant
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

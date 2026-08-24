"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Copy } from "lucide-react";
import { getAllSupplements } from "@/services/supplementService";
import { HasPermission } from "../../users/components/HasPermission";
import { Action, Modules } from "../../users/types/auth.type";
import { useDishListQuery } from "../queries/dish-list.query";
import {
  useCopyDishOptionConfigurationMutation,
  useDishGiftUsagesQuery,
  useDishOptionConfigurationQuery,
  useRepointGiftRewardMutation,
  useRevokeGiftRewardMutation,
} from "../queries/dish-option.query";
import type { UsagesCadeau } from "../services/dish-option-service";
import { DishOptionGroupPayload } from "../types/dish-option.types";
import DishOptionsEditor from "./DishOptionsEditor";

/**
 * Ce qui empêche la copie, dit en clair et de façon PERSISTANTE.
 *
 * Le refus arrivait dans un toast de trois secondes portant une phrase unique
 * où tous les usages étaient concaténés. Deux conséquences : passé le délai il
 * ne restait rien à l'écran, et au-delà de 250 caractères le filtre de messages
 * remplaçait le tout par « une erreur inattendue s'est produite ».
 *
 * Surtout, la phrase demandait de « faire pointer ce cadeau sur un autre plat »
 * alors qu'aucun écran ne le permettait : le contenu d'un cadeau est figé au
 * tirage, repointer le lot ou la campagne ne touche pas ceux déjà distribués.
 * L'encart rend donc ce geste possible ici même.
 */
function CadeauxBloquants({
  usages,
  plats,
  onDebloque,
}: {
  usages: UsagesCadeau;
  plats: { id: string; name: string }[];
  onDebloque: () => void;
}) {
  const [remplacant, setRemplacant] = React.useState<Record<string, string>>({});
  const repointer = useRepointGiftRewardMutation();
  const revoquer = useRevokeGiftRewardMutation();

  const dateCourte = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString("fr-FR") : null;

  return (
    <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
      <p className="text-[13px] font-semibold text-amber-900">
        Ce plat est offert en cadeau, la copie est refusée
      </p>
      <p className="mt-0.5 text-[12px] text-amber-800">
        Un plat composable ne peut pas être offert : le client n&apos;a aucun
        écran pour en choisir les options, et sa commande entière serait refusée
        au moment de valider.
      </p>

      {usages.lots.length > 0 && (
        <div className="mt-3">
          <p className="text-[12px] font-semibold text-amber-900">
            Lots Gratte et Gagne
          </p>
          <ul className="mt-1 space-y-0.5">
            {usages.lots.map((l) => (
              <li key={l.id} className="text-[12px] text-amber-800">
                {l.label}
                {!l.active && " (inactif)"} — à repointer depuis Jeux &gt; Gratte
                et Gagne &gt; Lots
              </li>
            ))}
          </ul>
        </div>
      )}

      {usages.campagnes.length > 0 && (
        <div className="mt-3">
          <p className="text-[12px] font-semibold text-amber-900">
            Campagnes cadeau
          </p>
          <ul className="mt-1 space-y-0.5">
            {usages.campagnes.map((c) => (
              <li key={c.id} className="text-[12px] text-amber-800">
                {c.name} ({c.status})
              </li>
            ))}
          </ul>
        </div>
      )}

      {usages.cadeaux.length > 0 && (
        <div className="mt-3">
          <p className="text-[12px] font-semibold text-amber-900">
            Cadeaux déjà remis à des clients
          </p>
          <p className="text-[11px] text-amber-700">
            Ceux-là ne suivent pas le lot : leur contenu a été figé au tirage. À
            traiter un par un.
          </p>
          <ul className="mt-2 space-y-2">
            {usages.cadeaux.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center gap-2 rounded-xl bg-white p-2"
              >
                <span className="text-[12px] text-gray-700">
                  {r.client || "Client"}
                  {r.telephone ? ` · ${r.telephone}` : ""} ·{" "}
                  {r.status === "PENDING" ? "à gratter" : "à utiliser"}
                  {dateCourte(r.expires_at)
                    ? ` · expire le ${dateCourte(r.expires_at)}`
                    : ""}
                </span>
                {/*
                  Toucher un cadeau relève de la Fidélité, pas des Menus. Sans
                  cette garde, un gestionnaire menus verrait deux boutons qui
                  échouent en 403 au clic.
                */}
                <HasPermission
                  module={Modules.FIDELITE}
                  action={Action.UPDATE}
                  fallback={
                    <span className="text-[11px] text-amber-700">
                      Demandez à un responsable Fidélité de repointer ce cadeau.
                    </span>
                  }
                >
                  <select
                    value={remplacant[r.id] ?? ""}
                    onChange={(e) =>
                      setRemplacant((p) => ({ ...p, [r.id]: e.target.value }))
                    }
                    className="h-[34px] min-w-[180px] rounded-lg border border-[#D8D8D8] bg-white px-2 text-[12px] text-[#595959]"
                  >
                    <option value="">Offrir un autre plat</option>
                    {plats.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={!remplacant[r.id] || repointer.isPending}
                    onClick={() =>
                      repointer.mutate(
                        { rewardId: r.id, dishId: remplacant[r.id] },
                        { onSuccess: onDebloque },
                      )
                    }
                    className="h-[34px] rounded-lg bg-[#F17922] px-3 text-[12px] font-semibold text-white disabled:opacity-50 cursor-pointer"
                  >
                    Repointer
                  </button>
                  <button
                    type="button"
                    disabled={revoquer.isPending}
                    onClick={() => {
                      if (
                        window.confirm(
                          `Annuler le cadeau de ${r.client || "ce client"} ? Il le verra passer en « Annulé » sans être prévenu.`,
                        )
                      ) {
                        revoquer.mutate(
                          { rewardId: r.id, motif: "Plat rendu composable" },
                          { onSuccess: onDebloque },
                        );
                      }
                    }}
                    className="h-[34px] rounded-lg border border-amber-300 px-3 text-[12px] font-semibold text-amber-900 disabled:opacity-50 cursor-pointer"
                  >
                    Annuler le cadeau
                  </button>
                </HasPermission>
              </li>
            ))}
          </ul>
        </div>
      )}

      {usages.combos.length > 0 && (
        <p className="mt-3 text-[12px] text-amber-800">
          À surveiller : {usages.combos.length} partie
          {usages.combos.length > 1 ? "s" : ""} Combo Mystère offre
          {usages.combos.length > 1 ? "nt" : ""} aussi ce plat. À la clôture,
          de nouveaux cadeaux seront distribués et le blocage reviendra.
        </p>
      )}
    </div>
  );
}

/**
 * MENUS COMPOSABLES — section prête à poser dans un écran.
 *
 * Elle tient l'état des groupes, va chercher la configuration du plat quand il
 * existe déjà, charge le catalogue de suppléments, et propose de recopier une
 * configuration d'un plat sur un autre.
 *
 * Elle n'enregistre RIEN d'elle-même. L'écran qui l'accueille lit son état au
 * moment où il enregistre le plat, ce qui garde une seule action pour le
 * gestionnaire : il remplit son formulaire et il valide.
 *
 * L'état reste ici plutôt que dans le formulaire hôte : ces formulaires font
 * plus de mille lignes chacun, et remonter chaque frappe les ferait tous se
 * redessiner.
 */

export interface DishOptionsSectionHandle {
  /**
   * Configuration à enregistrer, ou `null` si elle n'est pas encore connue.
   *
   * Ce `null` est un garde-fou : un plat dont la configuration n'a pas fini
   * d'arriver renverrait une liste vide, et l'enregistrer effacerait en silence
   * toutes ses options.
   */
  lireGroupes: () => DishOptionGroupPayload[] | null;
}

export interface DishOptionsSectionProps {
  /** Absent en création : rien à charger, la configuration attend en mémoire. */
  dishId?: string;
  /** Grise les contrôles pendant l'enregistrement du formulaire hôte. */
  disabled?: boolean;
  /** Affichage sans édition, pour la fiche d'un plat. */
  lectureSeule?: boolean;
}

const DishOptionsSection = React.forwardRef<
  DishOptionsSectionHandle,
  DishOptionsSectionProps
>(function DishOptionsSection({ dishId, disabled = false, lectureSeule = false }, ref) {
  const [groups, setGroups] = React.useState<DishOptionGroupPayload[]>([]);
  /** Identifiant du plat dont l'état affiché provient réellement. */
  const hydrateRef = React.useRef<string | null>(null);
  const [cible, setCible] = React.useState("");

  const { data, isLoading } = useDishOptionConfigurationQuery(dishId);

  React.useEffect(() => {
    if (!dishId || !data || hydrateRef.current === dishId) return;
    // On ne recopie que les champs attendus par le serveur. Renvoyer l'objet
    // reçu tel quel ferait voyager des champs qu'il écarte en silence, et
    // masquerait une éventuelle divergence de contrat.
    setGroups(
      data.groups.map((g) => ({
        id: g.id,
        name: g.name,
        description: g.description,
        required: g.required,
        min_select: g.min_select,
        max_select: g.max_select,
        items: g.items.map((i) => ({
          id: i.id,
          label: i.label,
          price_delta: i.price_delta,
          supplement_id: i.supplement_id,
          is_default: i.is_default,
          available: i.available,
        })),
      })),
    );
    hydrateRef.current = dishId;
  }, [data, dishId]);

  React.useImperativeHandle(
    ref,
    () => ({
      lireGroupes: () =>
        dishId && hydrateRef.current !== dishId ? null : groups,
    }),
    [dishId, groups],
  );

  // Catalogue de suppléments, servi par catégorie puis aplati. Même clé de
  // cache que les autres écrans qui l'utilisent, donc une seule requête.
  const { data: parCategorie } = useQuery({
    queryKey: ["supplements", "all"],
    queryFn: getAllSupplements,
    staleTime: 5 * 60 * 1000,
  });
  const supplements = React.useMemo(
    () =>
      Object.values(parCategorie ?? {})
        .flat()
        .filter((s) => s.available !== false)
        .map((s) => ({ id: s.id, name: s.name })),
    [parCategorie],
  );

  const { data: platsResp } = useDishListQuery();
  const plats = React.useMemo(
    () =>
      (((platsResp as any)?.data ?? platsResp ?? []) as {
        id: string;
        name: string;
      }[]).filter((p) => p.id !== dishId),
    [platsResp, dishId],
  );

  const copier = useCopyDishOptionConfigurationMutation();

  /**
   * Ce qui bloque le plat CIBLE, connu dès qu'il est désigné : on prévient
   * avant la tentative plutôt que de refuser après.
   */
  const usagesCible = useDishGiftUsagesQuery(cible || undefined);

  /**
   * Détail du refus si la copie a quand même été tentée. Lu sur la mutation
   * plutôt que gardé dans un état local : il disparaît de lui-même à la
   * prochaine tentative réussie, sans qu'on ait à penser à le vider. Sert de
   * filet quand le blocage apparaît entre la sélection et le clic.
   */
  const blocage = React.useMemo(() => {
    if (usagesCible.data?.bloquant) return usagesCible.data;
    const erreur = copier.error as (Error & { code?: string; usages?: UsagesCadeau }) | null;
    if (erreur?.code !== "PLAT_OFFERT_EN_CADEAU") return null;
    return erreur.usages ?? null;
  }, [usagesCible.data, copier.error]);

  if (dishId && isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#F17922]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <DishOptionsEditor
        groups={groups}
        onChange={setGroups}
        supplements={supplements}
        disabled={disabled || lectureSeule}
      />

      {dishId && !lectureSeule && groups.length > 0 && (
        <HasPermission module={Modules.MENUS} action={Action.UPDATE}>
          <div className="rounded-2xl bg-gray-50 p-4">
            <p className={"text-[13px] font-semibold text-gray-700"}>
              Appliquer cette configuration à un autre plat
            </p>
            <p className="mt-0.5 text-[12px] text-gray-500">
              Les burgers partagent souvent la même grille de sauces. La copie
              remplace la configuration du plat choisi.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <select
                value={cible}
                onChange={(e) => setCible(e.target.value)}
                className="h-[42px] min-w-[220px] rounded-xl border border-[#D8D8D8] bg-white px-3 text-[13px] text-[#595959] focus:outline-none focus:ring-2 focus:ring-[#F17922]"
              >
                <option value="">Choisir un plat</option>
                {plats.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={!cible || copier.isPending || Boolean(blocage)}
                onClick={() =>
                  copier.mutate(
                    { sourceDishId: dishId, cibleDishId: cible },
                    { onSuccess: () => setCible("") },
                  )
                }
                className="inline-flex h-[42px] items-center gap-1.5 rounded-xl bg-[#F17922] px-4 text-[13px] font-semibold text-white transition-colors hover:bg-[#F17922]/90 disabled:opacity-50 cursor-pointer"
              >
                <Copy size={15} />
                {copier.isPending ? "Copie en cours" : "Copier"}
              </button>
            </div>
            <p className="mt-2 text-[11px] text-[#9796A1]">
              La copie part immédiatement, sans attendre l'enregistrement du
              plat courant.
            </p>

            {blocage && (
              <CadeauxBloquants
                usages={blocage}
                plats={plats}
                onDebloque={() => {
                  // On relit ce qui bloque encore plutôt que de relancer la
                  // copie : plusieurs cadeaux peuvent rester à traiter, et le
                  // gestionnaire décide lui-même quand copier.
                  copier.reset();
                  void usagesCible.refetch();
                }}
              />
            )}
          </div>
        </HasPermission>
      )}
    </div>
  );
});

export default DishOptionsSection;

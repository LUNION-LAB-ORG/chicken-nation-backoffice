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
  useDishOptionConfigurationQuery,
} from "../queries/dish-option.query";
import { DishOptionGroupPayload } from "../types/dish-option.types";
import DishOptionsEditor from "./DishOptionsEditor";

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
                disabled={!cible || copier.isPending}
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
          </div>
        </HasPermission>
      )}
    </div>
  );
});

export default DishOptionsSection;

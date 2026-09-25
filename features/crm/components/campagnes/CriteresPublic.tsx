import React, { useState } from "react";
import { ChevronDown, Info, Lock } from "lucide-react";
import { IOffre } from "../../types/reglage.type";
import { PUBLIC_META, estCapte } from "../../utils/crm-ui";
import { ChampSelect, ChampTexte, Libelle } from "../commun/Champs";
import { EtatRequete } from "../commun/Etats";
import { EtatPublic, aDesReglagesPropres } from "./etat-campagne";
import { useRestaurantsCapture } from "./useRestaurantsCapture";

/** Restaurants de capture en sélection multiple : aucun coché veut dire tous. */
function ChoixRestaurants({ choisis, onChange }: { choisis: string[]; onChange: (ids: string[]) => void }) {
  const { requete, restaurants } = useRestaurantsCapture();
  const basculer = (id: string) => onChange(choisis.includes(id) ? choisis.filter((r) => r !== id) : [...choisis, id]);

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <Libelle>Restaurants de capture</Libelle>
        {choisis.length > 0 && (
          <button type="button" onClick={() => onChange([])} className="text-xs font-semibold text-[#F17922] hover:underline">
            Tous les restaurants
          </button>
        )}
      </div>
      <EtatRequete requete={requete}>
        <div className="rounded-lg border border-gray-200 bg-white max-h-40 overflow-y-auto divide-y divide-gray-100">
          {restaurants.length === 0 ? (
            <p className="text-xs text-gray-400 px-3 py-2">Aucun restaurant.</p>
          ) : (
            restaurants.map((r) => (
              <label key={r.id} className="flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={choisis.includes(r.id)}
                  onChange={() => basculer(r.id)}
                  className="w-4 h-4 accent-[#F17922]"
                />
                <span className="truncate text-gray-700">{r.name}</span>
              </label>
            ))
          )}
        </div>
      </EtatRequete>
      <p className="text-xs text-gray-500 mt-1">
        {choisis.length === 0
          ? "Aucun coché : clients captés dans tous les restaurants."
          : `${choisis.length} ${choisis.length > 1 ? "restaurants choisis" : "restaurant choisi"} : la capture doit avoir eu lieu dans l'un d'eux, pendant la période.`}
      </p>
    </div>
  );
}

/**
 * Critères propres à un public coché (lot 3) : période au sens du public,
 * restaurants et compte pour Glovo/Yango, « déjà reconquis » pour les
 * inactifs, puis offre et objectifs facultatifs. Une campagne lancée ne
 * change plus que l'offre et les objectifs.
 */
export function CriteresPublic({
  p,
  maj,
  figes,
  offres,
}: {
  p: EtatPublic;
  maj: (patch: Partial<EtatPublic>) => void;
  figes: boolean;
  offres: IOffre[];
}) {
  const meta = PUBLIC_META[p.segment];
  const capte = estCapte(p.segment);
  const [volet, setVolet] = useState(() => figes || aDesReglagesPropres(p));
  const offresActives = offres.filter((o) => o.is_active || o.id === p.offer_id);

  return (
    <div className="space-y-3 border-t border-orange-100 pt-3 mt-2">
      {figes && (
        <p className="flex items-center gap-1.5 text-xs text-gray-500">
          <Lock className="w-3.5 h-3.5" /> Critères figés depuis le lancement : seuls l&apos;offre et les objectifs changent.
        </p>
      )}

      <fieldset disabled={figes} className="space-y-3 disabled:opacity-60">
        <div className="grid grid-cols-2 gap-3">
          <ChampTexte label={meta.periodeCampagne} type="date" valeur={p.period_from} onChange={(v) => maj({ period_from: v })} />
          <ChampTexte label="au" type="date" valeur={p.period_to} onChange={(v) => maj({ period_to: v })} min={p.period_from || undefined} />
        </div>
        <p className="text-xs text-gray-500 -mt-1">Sans date : toute l&apos;ancienneté du public.</p>

        {capte && (
          <>
            <ChoixRestaurants choisis={p.restaurant_ids} onChange={(ids) => maj({ restaurant_ids: ids })} />
            <ChampSelect
              label="Compte sur l'appli"
              valeur={p.account}
              onChange={(v) => maj({ account: v as EtatPublic["account"] })}
              options={[
                { value: "", label: "Tous" },
                { value: "AVEC", label: "Avec un compte" },
                { value: "SANS", label: "Sans compte" },
              ]}
            />
          </>
        )}

        {p.segment === "INACTIF" && (
          <label className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={p.relapsed_only}
              onChange={(e) => maj({ relapsed_only: e.target.checked })}
              className="mt-0.5 w-4 h-4 accent-[#F17922]"
            />
            Seulement les clients déjà reconquis une fois
          </label>
        )}
      </fieldset>

      {capte && (
        <p className="flex items-start gap-1.5 text-xs text-sky-800 bg-sky-50 rounded-lg px-3 py-2">
          <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          Les contacts ciblés quittent la file commune pendant la campagne. Les clients captés aujourd&apos;hui n&apos;entrent qu&apos;à partir de demain.
        </p>
      )}

      <div className="rounded-lg border border-gray-200 bg-white">
        <button
          type="button"
          onClick={() => setVolet((v) => !v)}
          className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm font-semibold text-gray-700"
          aria-expanded={volet}
        >
          <span>
            Offre et objectifs propres à ce public
            {!volet && aDesReglagesPropres(p) && <span className="ml-2 text-xs font-normal text-[#F17922]">renseignés</span>}
          </span>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${volet ? "rotate-180" : ""}`} />
        </button>
        {volet && (
          <div className="px-3 pb-3 space-y-3">
            <ChampSelect
              label="Offre des coupons"
              valeur={p.offer_id}
              onChange={(v) => maj({ offer_id: v })}
              vide="Offre de la campagne"
              /* Une offre désactivée depuis reste visible, signalée : il faut la remplacer. */
              options={offresActives.map((o) => ({ value: o.id, label: o.is_active ? o.label : `${o.label} (désactivée, à remplacer)` }))}
            />
            <div className="grid sm:grid-cols-2 gap-3">
              <ChampTexte
                label={`${meta.taux} visé (%)`}
                type="number"
                valeur={p.target_conversion_rate}
                onChange={(v) => maj({ target_conversion_rate: v })}
                min={0}
                max={100}
              />
              <ChampTexte
                label="Contacts à joindre"
                type="number"
                valeur={p.target_contacts_count}
                onChange={(v) => maj({ target_contacts_count: v })}
                min={1}
              />
            </div>
            <p className="text-xs text-gray-500">Vides : ce public suit l&apos;offre de la campagne et n&apos;a pas d&apos;objectif propre.</p>
          </div>
        )}
      </div>
    </div>
  );
}

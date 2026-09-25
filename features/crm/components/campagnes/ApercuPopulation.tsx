import React, { useState } from "react";
import { AlertTriangle, Calculator, RefreshCw } from "lucide-react";
import { toast } from "react-hot-toast";
import { useApercuMutation } from "../../queries/campagne.query";
import { publicsCampagneSchema } from "../../schemas/campagne.schema";
import { IApercu, IApercuInput, IApercuPublic } from "../../types/campagne.type";
import { ContactStatut } from "../../types/contact.type";
import { PUBLIC_META, STATUTS_ORDRE, STATUT_META, accord, estCapte, fmtDateHeure, fmtNombre } from "../../utils/crm-ui";
import { Bouton } from "../commun/Champs";
import { PucePublic } from "../commun/Puces";

const COLONNES: { cle: keyof IApercuPublic["exclus"]; label: string; aide: string }[] = [
  { cle: "autre_campagne", label: "Déjà dans une campagne", aide: "Pris par une autre campagne en cours ou suspendue" },
  { cle: "agent_hors_equipe", label: "Suivis hors équipe", aide: "Suivis par un agent actif qui n'est pas dans l'équipe : ils lui restent" },
  { cle: "captes_aujourdhui", label: "Captés aujourd'hui", aide: "Clients Glovo/Yango captés aujourd'hui : ils entrent à partir de demain" },
  { cle: "non_interesses", label: "Pas intéressés", aide: "Ont dit non : jamais reciblés" },
  { cle: "injoignables", label: "Injoignables", aide: "Numéro invalide, ou jamais joint après le nombre maximal de tentatives : jamais reciblés" },
];

const cellule = "px-3 py-2 text-right tabular-nums whitespace-nowrap";

/** « dont 4 à rappeler · 2 intéressés » : les disponibles déjà travaillés. */
function detailStatuts(par: IApercuPublic["par_statut"] = {}): string {
  const morceaux = STATUTS_ORDRE.filter((s) => s !== "A_APPELER" && ((par ?? {})[s] ?? 0) > 0).map(
    (s: ContactStatut) => `${STATUT_META[s].label.toLowerCase()} : ${fmtNombre((par ?? {})[s])}`,
  );
  return morceaux.length ? `dont ${morceaux.join(" · ")}` : "";
}

/**
 * Estimation de la population (lot 3) : ce que le lancement prendrait
 * maintenant, public par public, et pourquoi les autres fiches sont
 * écartées. Même filtre que le lancement, donc mêmes nombres.
 */
export function ApercuPopulation({ preparer }: { preparer: () => IApercuInput }) {
  const apercu = useApercuMutation();
  const [resultat, setResultat] = useState<{ signature: string; donnees: IApercu } | null>(null);

  const courant = preparer();
  const signatureCourante = JSON.stringify(courant);
  const perime = !!resultat && resultat.signature !== signatureCourante;

  const estimer = () => {
    const verif = publicsCampagneSchema.safeParse(courant.publics);
    if (!verif.success) return void toast.error(verif.error.issues[0].message);
    apercu.mutate(courant, { onSuccess: (donnees) => setResultat({ signature: signatureCourante, donnees }) });
  };

  const d = resultat?.donnees;
  const vides = d ? d.publics.filter((p) => p.disponibles === 0) : [];

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-3 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-gray-800">Population au lancement</p>
          <p className="text-xs text-gray-500">
            {d
              ? `Estimée le ${fmtDateHeure(d.calcule_le)} avec l'équipe choisie.`
              : "Combien de contacts la campagne prendrait si elle partait maintenant, avec l'équipe choisie."}
          </p>
        </div>
        <Bouton onClick={estimer} desactive={apercu.isPending}>
          {d ? <RefreshCw className="w-4 h-4" /> : <Calculator className="w-4 h-4" />}
          {apercu.isPending ? "Calcul…" : d ? "Estimer à nouveau" : "Estimer la population"}
        </Bouton>
      </div>

      {perime && (
        <p className="text-xs text-amber-800 bg-amber-50 rounded-lg px-3 py-2">
          Le formulaire a changé depuis l&apos;estimation : relancez-la pour des chiffres à jour.
        </p>
      )}

      {d && (
        <>
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs">
                  <th className="font-semibold px-3 py-2 text-left">Public</th>
                  <th className="font-semibold px-3 py-2 text-right whitespace-nowrap">Disponibles</th>
                  {COLONNES.map((c) => (
                    <th key={c.cle} title={c.aide} className="font-semibold px-3 py-2 text-right whitespace-nowrap">
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {d.publics.map((p) => (
                  <tr key={p.segment} className="border-t border-gray-100 align-top">
                    <td className="px-3 py-2">
                      <PucePublic segment={p.segment} />
                    </td>
                    <td className={cellule}>
                      <span className={`font-semibold ${p.disponibles === 0 ? "text-rose-600" : "text-emerald-700"}`}>
                        {fmtNombre(p.disponibles)}
                      </span>
                      {detailStatuts(p.par_statut) && (
                        <span className="block text-[11px] text-gray-400 font-normal">{detailStatuts(p.par_statut)}</span>
                      )}
                    </td>
                    {COLONNES.map((c) => (
                      <td key={c.cle} className={`${cellule} text-gray-600`}>
                        {c.cle === "captes_aujourdhui" && !estCapte(p.segment) ? "" : fmtNombre(p.exclus[c.cle])}
                      </td>
                    ))}
                  </tr>
                ))}
                {d.publics.length > 1 && (
                  <tr className="border-t border-gray-200 bg-gray-50 font-semibold">
                    <td className="px-3 py-2 text-gray-800">Total</td>
                    <td className={`${cellule} text-emerald-700`}>{fmtNombre(d.disponibles)}</td>
                    {COLONNES.map((c) => (
                      <td key={c.cle} className={`${cellule} text-gray-700`}>
                        {fmtNombre(d.publics.reduce((s, p) => s + p.exclus[c.cle], 0))}
                      </td>
                    ))}
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500">
            {fmtNombre(d.disponibles)} {accord(d.disponibles, "contact disponible", "contacts disponibles")},{" "}
            {fmtNombre(d.exclus)} {accord(d.exclus, "écarté", "écartés")}. Un contact n&apos;est compté qu&apos;une fois, au premier motif
            qui l&apos;écarte. Les convertis ne sont jamais ciblés.
          </p>
          {d.disponibles === 0 ? (
            <p className="flex items-start gap-1.5 text-xs text-rose-700 bg-rose-50 rounded-lg px-3 py-2">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              Aucun contact disponible : le lancement serait refusé. Élargissez les critères ou l&apos;équipe.
            </p>
          ) : (
            vides.length > 0 && (
              <p className="flex items-start gap-1.5 text-xs text-amber-800 bg-amber-50 rounded-lg px-3 py-2">
                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                {vides.length > 1 ? "Ces publics n'ont" : "Ce public n'a"} aucun contact disponible :{" "}
                {vides.map((p) => PUBLIC_META[p.segment].label).join(", ")}. La campagne partirait sans {vides.length > 1 ? "eux" : "lui"}.
              </p>
            )
          )}
        </>
      )}
    </div>
  );
}

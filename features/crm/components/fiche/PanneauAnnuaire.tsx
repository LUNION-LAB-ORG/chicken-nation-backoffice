import React from "react";
import { UserPlus } from "lucide-react";
import { usePrendreEnChargeMutation } from "../../queries/contact.mutation";

/**
 * Ce qu'on voit sur la fiche d'un client de l'ANNUAIRE.
 *
 * Ces clients commandent déjà : le call center ne les travaille pas. Leur fiche
 * est là pour que l'onglet Contacts réunisse toute la base, pas pour qu'on les
 * appelle. Elle ne propose donc ni appel ni coupon.
 *
 * Le bouton est la décision de s'en occuper : le contact passe « à appeler » et
 * entre dans la file de l'agent. Tant qu'on ne l'a pas cliqué, rien ne bouge,
 * et surtout il ne compte dans le portefeuille de personne.
 */
export function PanneauAnnuaire({ contactId }: { contactId: string }) {
  const { mutate, isPending } = usePrendreEnChargeMutation();

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
      <p className="text-sm font-semibold text-gray-900">Client actif</p>
      <p className="mt-1 text-sm text-gray-600">
        Il commande déjà : le centre d&apos;appels ne le suit pas et il
        n&apos;est dans la file de personne. Vous voyez son dossier, pas de
        geste à faire.
      </p>
      <button
        type="button"
        onClick={() => mutate(contactId)}
        disabled={isPending}
        className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#F17922] px-3.5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#e06a15] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <UserPlus className="h-4 w-4" />
        {isPending ? "Un instant…" : "Prendre en charge"}
      </button>
      <p className="mt-2 text-xs text-gray-500">
        Il passera « à appeler » et rejoindra votre file.
      </p>
    </div>
  );
}

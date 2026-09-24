import React from "react";
import { Megaphone, ShoppingBag, Store } from "lucide-react";
import { IProspectFiche } from "../../types/prospect.type";
import { fmtDate, fmtMontant } from "../../utils/prospect-ui";

function Bloc({ titre, Icone, children }: { titre: string; Icone: typeof Store; children: React.ReactNode }) {
  return (
    <div className="border border-gray-100 rounded-xl p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-2">
        <Icone className="w-4 h-4 text-[#F17922]" /> {titre}
      </p>
      <div className="space-y-1 text-sm text-gray-600">{children}</div>
    </div>
  );
}

const PLATEFORME: Record<string, string> = { GLOVO: "Glovo", YANGO: "Yango" };

/** Conversion, campagnes et passage éventuel par l'acquisition Glovo/Yango. */
export function FicheContexte({ p }: { p: IProspectFiche }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {p.commande && (
        <Bloc titre="Première commande" Icone={ShoppingBag}>
          <p>
            {p.commande.reference} du {fmtDate(p.commande.created_at)}, <strong>{fmtMontant(p.commande.amount)}</strong>
          </p>
          <p>
            {p.commande.restaurant?.name ?? "Restaurant inconnu"}
            {p.delai_conversion_jours != null && ` · ${p.delai_conversion_jours} j après l'inscription`}
          </p>
          {p.commande.status === "CANCELLED" && <p className="text-rose-600">Commande annulée depuis.</p>}
        </Bloc>
      )}

      {p.campagnes.length > 0 && (
        <Bloc titre="Campagnes" Icone={Megaphone}>
          {p.campagnes.map((m) => (
            <p key={m.id}>
              {m.campaign.name}
              <span className="text-gray-400">
                {" "}
                · {m.agent?.fullname ?? "sans agent"}
                {m.converted_at ? " · converti pendant la campagne" : m.released_at ? " · sortie" : " · en cours"}
              </span>
            </p>
          ))}
        </Bloc>
      )}

      {p.acquisition.length > 0 && (
        <Bloc titre="Déjà contacté par l'acquisition Glovo/Yango" Icone={Store}>
          {p.acquisition.map((a) => (
            <p key={a.id}>
              {PLATEFORME[a.platform] ?? a.platform}, capté le {fmtDate(a.created_at)}
              {a.restaurant && ` à ${a.restaurant.name}`}
              {a.coupon_sent_at && `, coupon reçu le ${fmtDate(a.coupon_sent_at)}`}
            </p>
          ))}
          <p className="text-xs text-gray-400">Adaptez le discours : ce client connaît déjà l&apos;offre Glovo/Yango.</p>
        </Bloc>
      )}

      {p.paiements_abandonnes.length > 0 && (
        <Bloc titre="Paiements abandonnés" Icone={ShoppingBag}>
          {p.paiements_abandonnes.map((o) => (
            <p key={o.id}>
              {fmtDate(o.created_at)} · {fmtMontant(o.amount)} <span className="text-gray-400">({o.reference})</span>
            </p>
          ))}
        </Bloc>
      )}
    </div>
  );
}

import React from "react";
import { History, Megaphone, ShoppingBag, Store } from "lucide-react";
import { IContactFiche } from "../../types/contact.type";
import { CANAL_ACHAT, fmtDate, fmtMontant, fmtNombre } from "../../utils/crm-ui";

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
export function FicheContexte({ p }: { p: IContactFiche }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {p.achats && (
        <Bloc titre="Ses achats" Icone={History}>
          <p>
            <strong>
              {fmtNombre(p.achats.commandes)} commande{p.achats.commandes > 1 ? "s" : ""}, {fmtMontant(p.achats.montant)}
            </strong>
          </p>
          <p>
            {p.achats.commandes > 1
              ? `Du ${fmtDate(p.achats.premiere)} au ${fmtDate(p.achats.derniere)}, ${CANAL_ACHAT[p.achats.canal]}`
              : `Le ${fmtDate(p.achats.derniere)}, ${p.achats.canal === "CENTRE_APPEL" ? "par le centre d'appel" : "dans l'application"}`}
          </p>
        </Bloc>
      )}

      {p.commande && (
        <Bloc titre={p.segment === "INACTIF" ? "Commande de retour" : "Première commande"} Icone={ShoppingBag}>
          <p>
            {p.commande.reference} du {fmtDate(p.commande.created_at)}, <strong>{fmtMontant(p.commande.amount)}</strong>
          </p>
          <p>
            {p.commande.restaurant?.name ?? "Restaurant inconnu"}
            {p.delai_conversion_jours != null &&
              ` · ${p.delai_conversion_jours} j après ${p.segment === "INACTIF" ? "être devenu inactif" : "l'inscription"}`}
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

import React from "react";
import { History, Megaphone, ShoppingBag, Store } from "lucide-react";
import { IContactFiche } from "../../types/contact.type";
import { CANAL_ACHAT, estCapte, fmtDate, fmtMontant, fmtNombre } from "../../utils/crm-ui";

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

/** Titre du bloc de la commande qui a fait sortir le contact, selon son public. */
const TITRE_COMMANDE: Record<IContactFiche["segment"], string> = {
  JAMAIS_COMMANDE: "Première commande",
  INACTIF: "Commande de retour",
  GLOVO: "Commande en direct",
  YANGO: "Commande en direct",
};

const DEPUIS_ENTREE: Record<IContactFiche["segment"], string> = {
  JAMAIS_COMMANDE: "l'inscription",
  INACTIF: "être devenu inactif",
  GLOVO: "la capture",
  YANGO: "la capture",
};

/** Achats, conversion, campagnes et commandes Glovo/Yango relevées en caisse. */
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
        <Bloc titre={TITRE_COMMANDE[p.segment]} Icone={ShoppingBag}>
          <p>
            {p.commande.reference} du {fmtDate(p.commande.created_at)}, <strong>{fmtMontant(p.commande.amount)}</strong>
          </p>
          <p>
            {p.commande.restaurant?.name ?? "Restaurant inconnu"}
            {p.delai_conversion_jours != null &&
              ` · ${p.delai_conversion_jours} j après ${DEPUIS_ENTREE[p.segment]}`}
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

      {p.captures.length > 0 && (
        <Bloc
          titre={`Commande${p.captures.length > 1 ? "s" : ""} Glovo/Yango relevée${p.captures.length > 1 ? "s" : ""} en caisse`}
          Icone={Store}
        >
          {p.captures.map((a) => (
            <p key={a.id}>
              {PLATEFORME[a.platform] ?? a.platform} n° {a.order_number}, le {fmtDate(a.created_at)}
              {a.restaurant && ` à ${a.restaurant.name}`}
              {a.creator && <span className="text-gray-400"> · relevée par {a.creator.fullname}</span>}
            </p>
          ))}
          {!estCapte(p.segment) && (
            <p className="text-xs text-gray-400">
              Ce client commande aussi sur Glovo ou Yango : parlez-lui de l&apos;avantage de commander en direct.
            </p>
          )}
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

import React from "react";
import { CreditCard, Mail, MessageCircle, Phone } from "lucide-react";
import { usePrendreMutation } from "../../queries/contact.mutation";
import { IContactFiche } from "../../types/contact.type";
import { PUBLIC_META, depuis, estCapte, fmtDate, fmtTelephone, lienAppel } from "../../utils/crm-ui";
import { PucePublic, PuceStatut } from "../commun/Puces";

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold">{label}</p>
      <div className="text-sm text-gray-800 mt-0.5">{children}</div>
    </div>
  );
}

/** D'où vient le contact, dans la ligne sous son nom. */
function provenance(p: IContactFiche): string {
  if (estCapte(p.segment)) {
    const capte = `Capté sur ${PUBLIC_META[p.segment].court} le ${fmtDate(p.segment_since)} (${depuis(p.segment_since)})`;
    return p.registered_at ? `${capte} · inscrit sur l'application le ${fmtDate(p.registered_at)}` : `${capte} · pas de compte sur l'application`;
  }
  if (p.segment === "INACTIF" && p.last_order_at) return `Dernière commande le ${fmtDate(p.last_order_at)} (${depuis(p.last_order_at)})`;
  const inscrit = p.registered_at ?? p.segment_since;
  return `Inscrit le ${fmtDate(inscrit)} (${depuis(inscrit)})`;
}

/** Identité et signaux utiles avant de décrocher (cahier §4.1). */
export function FicheEntete({ p }: { p: IContactFiche }) {
  const c = p.customer;
  const prendre = usePrendreMutation();
  // Client de la file commune : composer le numéro le prend d'abord, sinon un
  // collègue pourrait l'appeler en même temps.
  const aPrendre = p.mode === "commune" && p.status !== "CONVERTI";
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">{p.nom}</h2>
          <p className="text-sm text-gray-500">
            {provenance(p)}
            {p.cycle > 1 && ` · redevenu inactif ${p.cycle - 1} fois`}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <PucePublic segment={p.segment} />
          <PuceStatut statut={p.status} segment={p.segment} />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {aPrendre ? (
          <button
            type="button"
            disabled={prendre.isPending}
            onClick={() => prendre.mutate(p.id, { onSuccess: () => { window.location.href = lienAppel(p.telephone); } })}
            className="inline-flex items-center gap-2 rounded-lg bg-[#F17922] text-white px-3 py-2 text-sm font-semibold hover:bg-[#e06a15] disabled:opacity-60"
          >
            <Phone className="w-4 h-4" /> {prendre.isPending ? "Un instant…" : `Prendre et appeler ${fmtTelephone(p.telephone)}`}
          </button>
        ) : (
          <a
            href={lienAppel(p.telephone)}
            className="inline-flex items-center gap-2 rounded-lg bg-[#F17922] text-white px-3 py-2 text-sm font-semibold hover:bg-[#e06a15]"
          >
            <Phone className="w-4 h-4" /> {fmtTelephone(p.telephone)}
          </a>
        )}
        {c?.email && (
          <a
            href={`mailto:${c.email}`}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <Mail className="w-4 h-4" /> {c.email}
          </a>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-gray-50 rounded-xl p-4">
        <Info label="Dernière connexion">{!c ? "Pas de compte" : c.last_login_at ? depuis(c.last_login_at) : "Jamais connecté"}</Info>
        <Info label="Tentatives d'appel">{p.call_count}</Info>
        <Info label="WhatsApp">
          <span className="inline-flex items-center gap-1">
            <MessageCircle className="w-3.5 h-3.5 text-gray-400" />
            {c?.whatsapp_opt_in ? "Accepté" : "Non renseigné"}
          </span>
        </Info>
        <Info label="Agent">{p.assigned_to?.fullname ?? "Sans agent"}</Info>
      </div>

      {p.abandoned_orders > 0 && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <CreditCard className="w-4 h-4 mt-0.5 shrink-0" />
          <p>
            A tenté de payer en ligne {p.abandoned_orders} fois sans aboutir. Le blocage est peut-être le paiement :
            proposez-lui de l&apos;aider, ou le paiement à la livraison.
          </p>
        </div>
      )}
    </div>
  );
}

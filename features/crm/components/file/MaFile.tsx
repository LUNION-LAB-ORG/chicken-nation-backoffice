import React from "react";
import { BellRing, CalendarClock, Inbox, PhoneForwarded, Send, Sparkles, Ticket } from "lucide-react";
import { useMaFileQuery } from "../../queries/contact.query";
import { fmtNombre } from "../../utils/crm-ui";
import { Chargement, Erreur, Vide } from "../commun/Etats";
import { SectionFile } from "./SectionFile";

function Indicateur({ label, valeur, large }: { label: string; valeur: number; large?: boolean }) {
  return (
    <div className={`bg-white border border-gray-200 rounded-xl px-4 py-3 ${large ? "col-span-2 sm:col-span-1" : ""}`}>
      <p className="text-2xl font-bold text-gray-900 tabular-nums">{fmtNombre(valeur)}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}

/**
 * La file de l'agent, dans l'ordre où il doit la traiter. Un client qui
 * commande en disparaît aussitôt (temps réel), inutile de l'appeler.
 */
export function MaFile({ onOuvrir }: { onOuvrir: (id: string) => void }) {
  const { data, isError, error } = useMaFileQuery();

  if (isError) return <Erreur message={(error as Error)?.message} />;
  if (!data) return <Chargement texte="Chargement de votre file…" />;

  const i = data.indicateurs;
  const vide = ["rappels", "interesses", "nouveaux", "relances", "coupons"].every(
    (cle) => (data[cle as keyof typeof data] as unknown[]).length === 0,
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <Indicateur label="Appels aujourd'hui" valeur={i.appels_jour} />
        <Indicateur label="Joints aujourd'hui" valeur={i.joints_jour} />
        <Indicateur label="Coupons aujourd'hui" valeur={i.coupons_jour} />
        <Indicateur label="Conversions aujourd'hui" valeur={i.conversions_jour} />
        <Indicateur label="Dans mon portefeuille" valeur={i.portefeuille} large />
      </div>

      {vide ? (
        <Vide
          Icone={Inbox}
          titre="Votre file est vide"
          texte="Aucun contact ne vous est confié pour l'instant, ou votre campagne est suspendue. Voyez avec votre pilote."
        />
      ) : (
        <>
          <SectionFile titre="Rappels à faire" aide="Ils ont demandé à être rappelés : c'est l'heure." Icone={BellRing} lignes={data.rappels} onOuvrir={onOuvrir} />
          <SectionFile titre="Intéressés" aide="Envoyez-leur le coupon pendant qu'ils y pensent." Icone={Sparkles} lignes={data.interesses} onOuvrir={onOuvrir} />
          <SectionFile titre="Jamais appelés" aide="Les entrées les plus récentes d'abord : un inscrit se souvient de l'application, un ancien client de son dernier repas." Icone={PhoneForwarded} lignes={data.nouveaux} onOuvrir={onOuvrir} />
          <SectionFile titre="À relancer" aide="Pas de réponse la dernière fois, les plus anciennes tentatives d'abord." Icone={Send} lignes={data.relances} onOuvrir={onOuvrir} />
          <SectionFile titre="Coupons envoyés" aide="Pas encore de commande : un rappel peut les décider." Icone={Ticket} lignes={data.coupons} onOuvrir={onOuvrir} replieeParDefaut />
        </>
      )}

      <SectionFile
        titre="Rappels planifiés"
        aide="À faire plus tard, ils reviendront en tête de file à l'heure dite."
        Icone={CalendarClock}
        lignes={data.rappels_planifies}
        onOuvrir={onOuvrir}
        replieeParDefaut
      />
    </div>
  );
}

import React, { useMemo, useState } from "react";
import { BellRing, Inbox } from "lucide-react";
import { useMaFileQuery } from "../../queries/contact.query";
import { dossiersDeLaFile } from "../../utils/dossiers-file";
import { CarteDossier } from "./CarteDossier";
import { DossierFile } from "./DossierFile";
import { fmtNombre } from "../../utils/crm-ui";
import { Chargement, Erreur, Vide } from "../commun/Etats";
import { RechercheNumero } from "./RechercheNumero";
import { SectionFile } from "./SectionFile";

function Indicateur({
  label,
  valeur,
  detail,
  aide,
  large,
}: {
  label: string;
  valeur: number;
  detail?: string;
  aide?: string;
  large?: boolean;
}) {
  return (
    <div
      title={aide}
      className={`bg-white border border-gray-200 rounded-xl px-4 py-3 ${large ? "col-span-2 sm:col-span-1" : ""}`}
    >
      <p className="text-2xl font-bold text-gray-900 tabular-nums">{fmtNombre(valeur)}</p>
      <p className="text-xs text-gray-500">{label}</p>
      {detail && <p className="text-[11px] text-[#F17922] font-semibold mt-0.5">{detail}</p>}
    </div>
  );
}

/**
 * La file de l'agent, dans l'ordre où il doit la traiter. Un client qui
 * commande en disparaît aussitôt (temps réel), inutile de l'appeler.
 *
 * Les clients Glovo/Yango relevés en caisse arrivent le lendemain dans une
 * file commune à tous les agents : le premier qui compose le numéro le prend.
 */
export function MaFile({ onOuvrir }: { onOuvrir: (id: string, telephone?: string) => void }) {
  const { data, isError, error } = useMaFileQuery();
  const [ouvert, setOuvert] = useState<string | null>(null);

  const dossiers = useMemo(() => (data ? dossiersDeLaFile(data) : []), [data]);

  if (isError) return <Erreur message={(error as Error)?.message} />;
  if (!data) return <Chargement texte="Chargement de votre file…" />;

  const i = data.indicateurs;
  const dossier = dossiers.find((d) => d.cle === ouvert) ?? null;
  const aFaire = dossiers.reduce((n, d) => n + d.jamais_appeles + d.a_relancer, 0);
  const rappelsDus = data.rappels ?? [];
  const vide = dossiers.length === 0 && rappelsDus.length === 0;

  return (
    <div className="space-y-6">
      <RechercheNumero onOuvrir={onOuvrir} />

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <Indicateur label="Appels aujourd'hui" valeur={i.appels_jour} />
        <Indicateur label="Joints aujourd'hui" valeur={i.joints_jour} />
        <Indicateur label="Coupons aujourd'hui" valeur={i.coupons_jour} />
        <Indicateur label="Conversions aujourd'hui" valeur={i.conversions_jour} />
        {/*
          LE PORTEFEUILLE MONTE QUAND ON TRAVAILLE, et c'est normal : il compte
          un stock. « Coupon envoyé » et « Intéressé » restent des statuts
          ouverts, et prendre une fiche dans la file commune en ajoute une.
          Seul le second nombre descend à mesure qu'on appelle — c'est celui
          qu'un agent cherche des yeux en fin de journée.
        */}
        <Indicateur
          label="Dans mon portefeuille"
          valeur={i.portefeuille}
          // Replié sur zéro : pendant les quelques minutes où le backoffice est
          // déployé avant le serveur, le champ n'existe pas encore.
          detail={`${fmtNombre(i.jamais_appeles ?? 0)} jamais appelés`}
          aide="Contacts qui vous sont confiés et dont le statut est encore ouvert : à appeler, à rappeler, intéressé, coupon envoyé. Il ne baisse qu'à la conversion, au refus ou quand le client est injoignable, et il monte chaque fois que vous prenez une fiche dans la file commune. Le nombre en orange, lui, descend à chaque premier appel."
          large
        />
      </div>

      {dossier ? (
        <DossierFile dossier={dossier} onRetour={() => setOuvert(null)} onOuvrir={onOuvrir} />
      ) : vide ? (
        <Vide
          Icone={Inbox}
          titre="Votre file est vide"
          texte="Aucun contact ne vous est confié pour l'instant, la file commune Glovo/Yango est traitée, ou votre campagne est suspendue. Voyez avec votre pilote."
        />
      ) : (
        <>
          {/*
            LES RAPPELS DUS RESTENT HORS DES DOSSIERS, à dessein. Un client à
            qui on a promis un appel à 14 h ne doit pas dépendre du dossier que
            l'agent ouvre ce jour-là : il le verrait le lendemain, ou jamais.
          */}
          <SectionFile
            titre="À faire maintenant"
            aide="Ils ont demandé à être rappelés : c'est l'heure. Toutes campagnes confondues."
            Icone={BellRing}
            lignes={rappelsDus}
            onOuvrir={onOuvrir}
          />

          <section>
            <p className="text-sm font-semibold text-gray-900">
              Mes dossiers <span className="text-gray-400">({dossiers.length})</span>
            </p>
            <p className="text-xs text-gray-500 mb-3 tabular-nums">
              {fmtNombre(aFaire)} contacts à appeler en tout. Ouvrez un dossier pour le traiter.
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {dossiers.map((d) => (
                <CarteDossier key={d.cle} dossier={d} onOuvrir={() => setOuvert(d.cle)} />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

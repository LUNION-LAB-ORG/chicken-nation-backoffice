import React from "react";
import StatsCard from "@/components/gestion/Statistiques/shared/StatsCard";
import { ICampagneStats } from "../../types/campagne.type";
import { accord, fmtMontant, fmtNombre, fmtPct, vocabulaire } from "../../utils/crm-ui";
import {
  Definition,
  definitionAppels,
  definitionCa,
  definitionCibles,
  definitionCoupons,
  definitionDuree,
  definitionJoints,
  definitionTraites,
  definitionVentes,
} from "../../utils/definitions-campagne";
import { InfoBulle } from "../commun/InfoBulle";

/**
 * Carte et sa définition, en haut à droite. L'icône est posée à côté de la
 * carte, jamais dedans : une carte cliquable (ou son enveloppe role=button)
 * ne contient pas d'autre bouton. La grille à une case étire la carte sur
 * toute la cellule, comme avant l'ajout de l'enveloppe.
 */
function AvecDefinition({ libelle, texte, children }: { libelle: string; texte: Definition; children: React.ReactNode }) {
  return (
    <div className="relative grid">
      {children}
      {/*
        Sur téléphone, un titre long occupe tout le haut de la carte : l'icône descend dans la colonne vide
        à droite du chiffre. Son fond blanc la garde lisible quand un titre passe sur deux lignes.
      */}
      <InfoBulle libelle={libelle} texte={texte} className="absolute top-10 right-3 sm:top-3 bg-white" />
    </div>
  );
}

/**
 * Carte qui mène à la liste des ventes. La carte réagit au clic ; cette
 * enveloppe la rend joignable au clavier (Tab, puis Entrée ou Espace) et
 * l'annonce comme un bouton, sans doubler le clic.
 */
function VersVentes({ libelle, onActiver, children }: { libelle: string; onActiver?: () => void; children: React.ReactNode }) {
  if (!onActiver) return <>{children}</>;
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={libelle}
      title="Voir les clients qui ont commandé"
      onKeyDown={(e) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        e.preventDefault();
        onActiver();
      }}
      className="flex rounded-3xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F17922] focus-visible:ring-offset-2"
    >
      {children}
    </div>
  );
}

/** Indicateurs clés d'une campagne (cahier §6.3), au vocabulaire de ses publics. */
export function KpisCampagne({
  s,
  onVoirVentes,
}: {
  s: ICampagneStats;
  /** Ventes et chiffre d'affaires : un clic fait défiler jusqu'à la liste des clients qui ont commandé. */
  onVoirVentes?: () => void;
}) {
  const i = s.indicateurs;
  const objectif = i.objectif_taux_conversion;
  const surObjectif = objectif != null ? i.taux_conversion >= objectif : null;
  const d = s.duree;
  const segments = (s.campagne.publics ?? []).map((p) => p.segment);
  const mots = vocabulaire(segments);
  const close = s.campagne.status === "COMPLETED";

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <AvecDefinition libelle="Ciblés" texte={definitionCibles(close)}>
        <StatsCard
          title="Ciblés"
          value={fmtNombre(i.cibles)}
          subtitle={`${fmtNombre(i.restants)} ${close ? `${accord(i.restants, "jamais appelé")} à la clôture` : `${accord(i.restants, "restant")} à appeler`}`}
        />
      </AvecDefinition>
      <AvecDefinition libelle="Traités" texte={definitionTraites()}>
        <StatsCard title="Traités" value={fmtNombre(i.traites)} subtitle={`Couverture ${fmtPct(i.couverture)}`} color="blue" />
      </AvecDefinition>
      <AvecDefinition libelle="Joints" texte={definitionJoints(!!i.objectif_contacts)}>
        <StatsCard
          title="Joints"
          value={fmtNombre(i.joints)}
          subtitle={`Taux de contact ${fmtPct(i.taux_contact)}${
            i.objectif_contacts
              ? ` · objectif ${fmtNombre(i.objectif_contacts)} à joindre${
                  i.progression_objectif_contacts != null ? ` (${fmtPct(i.progression_objectif_contacts)})` : ""
                }`
              : ""
          }`}
          color="purple"
        />
      </AvecDefinition>
      <AvecDefinition libelle={mots.conversion} texte={definitionVentes(segments, objectif != null)}>
        <VersVentes libelle={`${mots.conversion} : ${fmtNombre(i.conversions)}. Voir les clients qui ont commandé`} onActiver={onVoirVentes}>
          <StatsCard
            title={mots.conversion}
            value={fmtNombre(i.conversions)}
            subtitle={`${mots.taux} ${fmtPct(i.taux_conversion)}${objectif != null ? ` · objectif ${fmtPct(objectif)}` : ""}`}
            color={surObjectif === false ? "red" : "green"}
            onClick={onVoirVentes}
          />
        </VersVentes>
      </AvecDefinition>
      <AvecDefinition libelle="Coupons" texte={definitionCoupons(!!i.ca_coupons)}>
        <StatsCard
          title="Coupons"
          value={`${fmtNombre(i.coupons_utilises)} / ${fmtNombre(i.coupons_envoyes)}`}
          subtitle={`utilisés / envoyés · ${fmtPct(i.taux_utilisation)}${i.ca_coupons ? ` · ${fmtMontant(i.ca_coupons)} de commandes` : ""}`}
        />
      </AvecDefinition>
      <AvecDefinition libelle="Chiffre d'affaires" texte={definitionCa()}>
        <VersVentes libelle={`Chiffre d'affaires : ${fmtMontant(i.ca_conversions)}. Voir les clients qui ont commandé`} onActiver={onVoirVentes}>
          <StatsCard
            title="Chiffre d'affaires"
            value={fmtMontant(i.ca_conversions)}
            subtitle={`Panier moyen ${fmtMontant(i.panier_moyen)}`}
            color="green"
            onClick={onVoirVentes}
          />
        </VersVentes>
      </AvecDefinition>
      <AvecDefinition libelle="Appels passés" texte={definitionAppels()}>
        <StatsCard
          title="Appels passés"
          value={fmtNombre(i.appels)}
          subtitle={`${i.traites ? (i.appels / i.traites).toFixed(1).replace(".", ",") : "0"} par contact traité`}
          color="blue"
        />
      </AvecDefinition>
      <AvecDefinition libelle="Durée" texte={definitionDuree(!!d.planifiee_jours)}>
        <StatsCard
          title="Durée"
          value={`${String(d.reelle_jours).replace(".", ",")} j`}
          subtitle={d.planifiee_jours ? `sur ${d.planifiee_jours} j prévus` : "sans fin prévue"}
          color={d.planifiee_jours && d.reelle_jours > d.planifiee_jours ? "red" : "purple"}
        />
      </AvecDefinition>
    </div>
  );
}

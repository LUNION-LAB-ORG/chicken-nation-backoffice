import React, { useState } from "react";
import { AlertTriangle, CheckCircle2, FileSpreadsheet, FileText, Pause, Pencil, Play, Rocket, Users, X } from "lucide-react";
import { toast } from "react-hot-toast";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { campagneAPI } from "../../apis/campagne.api";
import { ResultatGeste, useGesteCampagneMutation } from "../../queries/campagne.query";
import { ICampagne, ICampagneStats } from "../../types/campagne.type";
import { PUBLICS, accord, estCapte, fmtNombre } from "../../utils/crm-ui";
import {
  SUSPENDRE_EN_PAUSE,
  TERMINER_A_REPRENDRE,
  ligneAuPilote,
  rapportDisponible,
  texteLancer,
} from "../../utils/textes-campagne";
import { Bouton } from "../commun/Champs";
import { PucePublic } from "../commun/Puces";

type Confirmation = "lancer" | "suspendre" | "terminer";

/** Contacts Glovo/Yango encore ouverts : ceux que la suspension gèle hors de la file commune. */
function captesOuverts(s?: ICampagneStats): number {
  return (s?.par_public ?? []).filter((p) => estCapte(p.segment)).reduce((n, p) => n + (p.ouverts ?? 0), 0);
}

function textes(
  confirmer: Confirmation,
  c: ICampagne,
  s?: ICampagneStats,
): { titre: string; texte: React.ReactNode; bouton: string } {
  if (confirmer === "lancer") {
    return {
      titre: "Lancer la campagne ?",
      texte: texteLancer(c.distribution_mode),
      bouton: "Lancer",
    };
  }
  if (confirmer === "suspendre") {
    const n = captesOuverts(s);
    return {
      titre: "Suspendre la campagne ?",
      texte: (
        <>
          <span className="block">{SUSPENDRE_EN_PAUSE}</span>
          {n > 0 && (
            <span className="block mt-2 font-semibold text-gray-800">
              {fmtNombre(n)} {accord(n, "contact Glovo/Yango sera mis", "contacts Glovo/Yango seront mis")} en pause : ils ne
              reviennent pas dans la file commune.
            </span>
          )}
        </>
      ),
      bouton: "Suspendre",
    };
  }
  return {
    titre: "Terminer la campagne ?",
    texte: (
      <>
        <span className="block">
          Ses chiffres sont figés dans le rapport. Les contacts intéressés, ceux qui ont un coupon encore valable et ceux qui
          ont un rappel prévu à venir restent à leur agent, s&apos;il est toujours actif ; les autres sont libérés, et les
          clients Glovo/Yango encore à traiter retournent dans la file commune.
        </span>
        <span className="block mt-2">{TERMINER_A_REPRENDRE}</span>
      </>
    ),
    bouton: "Terminer",
  };
}

/** Ce que le serveur a fait au lancement ou à la clôture, détaillé à l'écran. */
function CompteRendu({ r, onFermer }: { r: ResultatGeste; onFermer: () => void }) {
  if (r.geste !== "lancer" && r.geste !== "terminer") return null;
  return (
    <div className="relative rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3 text-sm text-gray-700 w-full">
      <button type="button" onClick={onFermer} className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600" aria-label="Fermer">
        <X className="w-4 h-4" />
      </button>
      {r.geste === "lancer" ? (
        <div className="space-y-2 pr-6">
          <p className="font-semibold text-gray-900">
            Campagne lancée : {fmtNombre(r.lancement.cibles)} {accord(r.lancement.cibles, "contact ciblé", "contacts ciblés")},{" "}
            {fmtNombre(r.lancement.repartis)} {accord(r.lancement.repartis, "confié", "confiés")} à un agent.
          </p>
          {ligneAuPilote(r.lancement) && <p>{ligneAuPilote(r.lancement)}</p>}
          {r.lancement.par_public.length > 0 && (
            <ul className="flex flex-wrap gap-x-4 gap-y-1">
              {[...r.lancement.par_public]
                .sort((a, b) => PUBLICS.indexOf(a.segment) - PUBLICS.indexOf(b.segment))
                .map((p) => (
                  <li key={p.segment} className="flex items-center gap-1.5">
                    <PucePublic segment={p.segment} />
                    <span className="tabular-nums">
                      {fmtNombre(p.cibles)} {accord(p.cibles, "ciblé")}
                    </span>
                  </li>
                ))}
            </ul>
          )}
          {r.lancement.avertissements.map((a) => (
            <p key={a} className="flex items-start gap-1.5 text-xs text-amber-800 bg-amber-50 rounded-lg px-3 py-2">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {a}
            </p>
          ))}
        </div>
      ) : (
        <div className="space-y-1 pr-6">
          <p className="font-semibold text-gray-900">Campagne terminée, chiffres figés dans le rapport.</p>
          <p>{r.cloture.message}</p>
        </div>
      )}
    </div>
  );
}

/** Gestes autorisés selon le statut et le rôle (cahier §6.1 et §9). */
export function ActionsCampagne({
  c,
  s,
  estGestionnaire,
  estPilote,
  peutExporter,
  onModifier,
  onEquipe,
}: {
  c: ICampagne;
  /** Statistiques, pour annoncer ce que la suspension met en pause. */
  s?: ICampagneStats;
  estGestionnaire: boolean;
  estPilote: boolean;
  peutExporter: boolean;
  onModifier: () => void;
  onEquipe: () => void;
}) {
  const geste = useGesteCampagneMutation();
  const [confirmer, setConfirmer] = useState<Confirmation | null>(null);
  const [compteRendu, setCompteRendu] = useState<ResultatGeste | null>(null);
  const pilotage = estGestionnaire || estPilote;
  const enCours = c.status === "ACTIVE" || c.status === "SUSPENDED";

  const rapport = (format: "xlsx" | "pdf") =>
    campagneAPI.rapport(c.id, format).catch((e: Error) => toast.error(e.message));

  const t = confirmer ? textes(confirmer, c, s) : null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {c.status === "PLANIFIED" && estGestionnaire && (
          <>
            <Bouton onClick={onModifier}>
              <Pencil className="w-4 h-4" /> Modifier
            </Bouton>
            <Bouton variante="primaire" onClick={() => setConfirmer("lancer")}>
              <Rocket className="w-4 h-4" /> Lancer
            </Bouton>
          </>
        )}
        {enCours && estGestionnaire && (
          <Bouton onClick={onModifier}>
            <Pencil className="w-4 h-4" /> Modifier
          </Bouton>
        )}
        {c.status === "ACTIVE" && pilotage && (
          <Bouton onClick={() => setConfirmer("suspendre")} desactive={geste.isPending}>
            <Pause className="w-4 h-4" /> Suspendre
          </Bouton>
        )}
        {c.status === "SUSPENDED" && pilotage && (
          <Bouton variante="primaire" onClick={() => geste.mutate({ id: c.id, geste: "reprendre" })} desactive={geste.isPending}>
            <Play className="w-4 h-4" /> Reprendre
          </Bouton>
        )}
        {c.status !== "COMPLETED" && pilotage && (
          <Bouton onClick={onEquipe}>
            <Users className="w-4 h-4" /> Équipe
          </Bouton>
        )}
        {enCours && pilotage && (
          <Bouton variante="danger" onClick={() => setConfirmer("terminer")}>
            <CheckCircle2 className="w-4 h-4" /> Terminer
          </Bouton>
        )}
        {/* Une campagne close sans avoir été lancée n'a rien à rapporter. */}
        {rapportDisponible(c) && peutExporter && (
          <>
            <Bouton variante="discret" onClick={() => rapport("xlsx")}>
              <FileSpreadsheet className="w-4 h-4" /> Rapport Excel
            </Bouton>
            <Bouton variante="discret" onClick={() => rapport("pdf")}>
              <FileText className="w-4 h-4" /> PDF
            </Bouton>
          </>
        )}
      </div>

      {compteRendu && <CompteRendu r={compteRendu} onFermer={() => setCompteRendu(null)} />}

      {confirmer && t && (
        <ConfirmDialog
          isOpen
          onClose={() => setConfirmer(null)}
          onConfirm={() =>
            geste.mutate(
              { id: c.id, geste: confirmer },
              {
                onSuccess: (r) => setCompteRendu(r.geste === "lancer" || r.geste === "terminer" ? r : null),
                onSettled: () => setConfirmer(null),
              },
            )
          }
          title={t.titre}
          description={t.texte}
          confirmLabel={t.bouton}
          variant={confirmer === "terminer" ? "danger" : "default"}
          isLoading={geste.isPending}
        />
      )}
    </div>
  );
}

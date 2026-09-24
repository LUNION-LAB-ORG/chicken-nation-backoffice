import React, { useState } from "react";
import { CheckCircle2, FileSpreadsheet, FileText, Pause, Pencil, Play, Rocket, Users } from "lucide-react";
import { toast } from "react-hot-toast";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { campagneAPI } from "../../apis/campagne.api";
import { useGesteCampagneMutation } from "../../queries/campagne.query";
import { ICampagne } from "../../types/campagne.type";
import { Bouton } from "../commun/Champs";

type Confirmation = "lancer" | "terminer" | null;

const TEXTES = {
  lancer: {
    titre: "Lancer la campagne ?",
    texte: "Elle prend tous les prospects disponibles de sa population et les répartit dans l'équipe. La population ne pourra plus changer.",
    bouton: "Lancer",
  },
  terminer: {
    titre: "Terminer la campagne ?",
    texte: "Ses chiffres sont figés dans le rapport, et les prospects non convertis quittent leur agent pour la prochaine campagne.",
    bouton: "Terminer",
  },
};

/** Gestes autorisés selon le statut et le rôle (cahier §6.1 et §9). */
export function ActionsCampagne({
  c,
  estGestionnaire,
  estPilote,
  peutExporter,
  onModifier,
  onEquipe,
}: {
  c: ICampagne;
  estGestionnaire: boolean;
  estPilote: boolean;
  peutExporter: boolean;
  onModifier: () => void;
  onEquipe: () => void;
}) {
  const geste = useGesteCampagneMutation();
  const [confirmer, setConfirmer] = useState<Confirmation>(null);
  const pilotage = estGestionnaire || estPilote;

  const rapport = (format: "xlsx" | "pdf") =>
    campagneAPI.rapport(c.id, format).catch((e: Error) => toast.error(e.message));

  return (
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
      {c.status === "ACTIVE" && pilotage && (
        <Bouton onClick={() => geste.mutate({ id: c.id, geste: "suspendre" })} desactive={geste.isPending}>
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
      {(c.status === "ACTIVE" || c.status === "SUSPENDED") && pilotage && (
        <Bouton variante="danger" onClick={() => setConfirmer("terminer")}>
          <CheckCircle2 className="w-4 h-4" /> Terminer
        </Bouton>
      )}
      {c.status !== "PLANIFIED" && peutExporter && (
        <>
          <Bouton variante="discret" onClick={() => rapport("xlsx")}>
            <FileSpreadsheet className="w-4 h-4" /> Rapport Excel
          </Bouton>
          <Bouton variante="discret" onClick={() => rapport("pdf")}>
            <FileText className="w-4 h-4" /> PDF
          </Bouton>
        </>
      )}

      {confirmer && (
        <ConfirmDialog
          isOpen
          onClose={() => setConfirmer(null)}
          onConfirm={() => geste.mutate({ id: c.id, geste: confirmer }, { onSettled: () => setConfirmer(null) })}
          title={TEXTES[confirmer].titre}
          description={TEXTES[confirmer].texte}
          confirmLabel={TEXTES[confirmer].bouton}
          variant={confirmer === "terminer" ? "danger" : "default"}
          isLoading={geste.isPending}
        />
      )}
    </div>
  );
}

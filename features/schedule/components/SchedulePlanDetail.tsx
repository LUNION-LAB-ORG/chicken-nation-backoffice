"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AlertCircle, Loader2, Moon, MoreVertical, Sun, UserPlus, X } from "lucide-react";
import { toast } from "react-hot-toast";

import ConfirmDialog from "@/components/ui/ConfirmDialog";

import { useDroitsLivraison } from "../../livreurs/hook/use-droits-livraison";
import {
  useAddDelivererToPlanMutation,
  useArchivePlanMutation,
  useConfirmPlanMutation,
  useDeletePlanMutation,
  useLivreursAjoutablesQuery,
  useRemoveDelivererFromPlanMutation,
  useSchedulePlanDetailQuery,
  useSchedulePlanStatsQuery,
  useSendPlanMutation,
  useSetDelivererDayMutation,
} from "../queries/schedule.query";
import type { IShiftAssignment, ShiftAssignmentStatus, ShiftType } from "../types/schedule.types";
import {
  LIBELLE_GESTE,
  MESSAGE_GESTE,
  actionsPlanning,
  textesFenetres,
  type GestePrincipal,
} from "../utils/actions-planning";
import { grillePlanning, texteCreneau, type LigneGrille } from "../utils/grille-planning";
import {
  cleAujourdhui,
  estJourSansRepos,
  jourCourt,
  nomLivreur,
  periode,
  prenomLivreur,
} from "../utils/periode-planning";

import { EditDatesModal } from "./EditDatesModal";
import { PastillePlanning } from "./PastillePlanning";

/** Couleurs des réponses du livreur : ambre en attente, vert confirmé, rouge refusé. */
const COULEUR_REPONSE: Record<ShiftAssignmentStatus, { bg: string; color: string }> = {
  ASSIGNED: { bg: "#FEF3C7", color: "#92400E" },
  CONFIRMED: { bg: "#DCFCE7", color: "#166534" },
  REFUSED: { bg: "#FEE2E2", color: "#991B1B" },
};

type Fenetre =
  | { type: "ajout" }
  | { type: "retrait"; livreur: LigneGrille }
  | { type: "dates" }
  | { type: "suppression" };

/** Position d'une fenêtre accrochée à un élément (case, ⋮). */
interface Ancre {
  gauche: number;
  haut: number;
  bas: number;
}

const ancreDe = (e: React.MouseEvent<HTMLElement>): Ancre => {
  const r = e.currentTarget.getBoundingClientRect();
  return { gauche: r.left, haut: r.top, bas: r.bottom };
};

interface Props {
  planId: string;
  /** « Modifier les dates » refait le planning sous un nouvel identifiant. */
  onPlanRefait: (planId: string) => void;
  onPlanSupprime: () => void;
}

/**
 * Détail d'un planning (conception du 24/10, 10.3) : en-tête, gestes selon
 * l'état et le droit, grille livreurs × jours.
 *
 * Gestes : un seul endroit, l'en-tête. Brouillon : une case bascule tout de
 * suite. Envoyé, Confirmé : une fenêtre accrochée à la case dit que le
 * livreur sera prévenu. Archivé : que c'est noté au journal. LIVRAISON_OPS
 * ne voit aucun bouton et les cases ne réagissent pas.
 */
export function SchedulePlanDetail({ planId, onPlanRefait, onPlanSupprime }: Props) {
  const { data: plan, isLoading, isError, isFetching, refetch } = useSchedulePlanDetailQuery(planId);
  const { data: stats } = useSchedulePlanStatsQuery(planId);
  const droits = useDroitsLivraison();

  const sendMut = useSendPlanMutation();
  const confirmMut = useConfirmPlanMutation();
  const archiveMut = useArchivePlanMutation();
  const deleteMut = useDeletePlanMutation();
  const dayMut = useSetDelivererDayMutation();
  const removeMut = useRemoveDelivererFromPlanMutation();

  const [fenetre, setFenetre] = useState<Fenetre | null>(null);
  const [jourOuvert, setJourOuvert] = useState<
    { livreur: LigneGrille; jour: string; travaille: boolean; ancre: Ancre } | null
  >(null);
  const [menu, setMenu] = useState<{ ancre: Ancre; livreur: LigneGrille | null } | null>(null);

  const grille = useMemo(() => (plan ? grillePlanning(plan) : null), [plan]);

  if (isLoading) return <SqueletteDetail />;

  if (!plan || !grille) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Impossible de charger le plan.</span>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="ml-auto shrink-0 text-[#F17922] underline disabled:opacity-50"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  const statut = plan.status;
  const restaurantId = plan.restaurant?.id ?? plan.restaurant_id;
  const actions = actionsPlanning({
    statut,
    restaurantId,
    droits,
    retraitDisponible: grille.serveurAJour,
  });
  const textes = textesFenetres(statut);
  const joursSansRepos = plan.regles?.jours_sans_repos;
  const aujourdhui = cleAujourdhui();
  const unBouton = actions.principal || actions.modifierDates || actions.ajouterLivreur || actions.supprimer;

  const mutationPrincipale = (g: GestePrincipal) =>
    g === "envoyer" ? sendMut : g === "confirmer" ? confirmMut : archiveMut;
  const lancer = (g: GestePrincipal) =>
    mutationPrincipale(g).mutate(planId, { onSuccess: () => toast.success(MESSAGE_GESTE[g]) });

  const toucherCase = (
    e: React.MouseEvent<HTMLButtonElement>,
    livreur: LigneGrille,
    jour: string,
    travaille: boolean,
  ) => {
    if (!actions.changerJour) return;
    if (!actions.jourSansFenetre) {
      setJourOuvert({ livreur, jour, travaille, ancre: ancreDe(e) });
      return;
    }
    if (travaille && estJourSansRepos(jour, joursSansRepos)) {
      toast.error("Repos interdit ce jour-là.");
      return;
    }
    dayMut.mutate(
      { planId, delivererId: livreur.id, date: jour, mode: travaille ? "REST" : "WORK" },
      { onSuccess: () => toast.success("Jour enregistré") },
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* En-tête */}
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <h3 className="text-lg font-bold text-gray-900 truncate" title={plan.restaurant?.name}>
                {plan.restaurant?.name}
              </h3>
              <PastillePlanning statut={statut} />
            </div>
            <p className="text-xs text-gray-500">{periode(plan.period_start, plan.period_end)}</p>
          </div>
          {stats && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <StatChip label="Confirmés" count={stats.confirmed} color="#166534" bg="#DCFCE7" />
              <StatChip label="En attente" count={stats.pending} color="#92400E" bg="#FEF3C7" />
              <StatChip label="Refusés" count={stats.refused} color="#991B1B" bg="#FEE2E2" />
            </div>
          )}
        </div>

        {unBouton && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {actions.principal && (
              <button
                type="button"
                onClick={() => lancer(actions.principal!)}
                disabled={mutationPrincipale(actions.principal).isPending}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#F17922] text-white text-xs font-semibold px-3 py-2 hover:bg-[#D8631F] disabled:opacity-60 whitespace-nowrap"
              >
                {mutationPrincipale(actions.principal).isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {LIBELLE_GESTE[actions.principal]}
              </button>
            )}
            {actions.modifierDates && (
              <BoutonSecondaire onClick={() => setFenetre({ type: "dates" })}>Dates</BoutonSecondaire>
            )}
            {actions.ajouterLivreur && (
              <BoutonSecondaire
                onClick={() => setFenetre({ type: "ajout" })}
                title="Ajouter un livreur rattaché après la génération du plan"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Livreur
              </BoutonSecondaire>
            )}
            {actions.supprimer && (
              <button
                type="button"
                aria-label="Autres actions"
                onClick={(e) => setMenu({ ancre: ancreDe(e), livreur: null })}
                className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {isError && (
        <p className="px-5 py-1.5 text-[11px] text-red-600 bg-red-50 border-b border-red-100">
          Connexion perdue, nouvel essai en cours
        </p>
      )}

      {grille.livreurs.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-sm text-gray-500">Aucune affectation dans ce plan.</p>
          {actions.ajouterLivreur && (
            <button
              type="button"
              onClick={() => setFenetre({ type: "ajout" })}
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#F17922] hover:underline"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Ajouter un livreur
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-3 py-2 font-semibold text-gray-600 sticky left-0 bg-gray-50 z-10 min-w-[150px]">
                    Livreur
                  </th>
                  {grille.jours.map((jour) => {
                    const estAujourdhui = jour === aujourdhui;
                    return (
                      <th
                        key={jour}
                        className={`px-1 py-2 font-semibold min-w-[84px] align-top ${
                          estAujourdhui ? "bg-orange-50 text-[#F17922]" : "text-gray-600"
                        }`}
                      >
                        <span className="block whitespace-nowrap">{jourCourt(jour)}</span>
                        <span className="block h-3 text-[10px] font-normal text-gray-400">
                          {estJourSansRepos(jour, joursSansRepos) ? "repos interdit" : ""}
                        </span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {grille.livreurs.map((l) => (
                  <tr key={l.id} className="border-t border-gray-100">
                    <td className="px-3 py-1 sticky left-0 bg-white z-10">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-medium text-gray-800 truncate max-w-[130px]" title={nomLivreur(l)}>
                          {nomLivreur(l)}
                        </span>
                        {actions.retirerLivreur && (
                          <button
                            type="button"
                            aria-label={`Actions sur ${nomLivreur(l)}`}
                            onClick={(e) => setMenu({ ancre: ancreDe(e), livreur: l })}
                            className="shrink-0 h-6 w-6 inline-flex items-center justify-center rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                    {grille.jours.map((jour) => (
                      <CaseJour
                        key={jour}
                        matin={grille.affectation(l.id, jour, "MORNING")}
                        soir={grille.affectation(l.id, jour, "EVENING")}
                        reposDuLivreur={grille.repos(l.id, jour) === "MANUAL_DELIVERER"}
                        aujourdhui={jour === aujourdhui}
                        touchable={actions.changerJour}
                        occupe={dayMut.isPending}
                        onToucher={(e, travaille) => toucherCase(e, l, jour, travaille)}
                      />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Legende horaires={grille.horaires} />
        </>
      )}

      {/* Changer un jour (envoyé, confirmé, archivé) */}
      {jourOuvert && (
        <FenetreJour
          key={`${jourOuvert.livreur.id}|${jourOuvert.jour}`}
          prenom={prenomLivreur(jourOuvert.livreur)}
          jour={jourOuvert.jour}
          travaille={jourOuvert.travaille}
          sansRepos={estJourSansRepos(jourOuvert.jour, joursSansRepos)}
          pied={textesFenetres(statut, prenomLivreur(jourOuvert.livreur)).jour}
          ancre={jourOuvert.ancre}
          enCours={dayMut.isPending}
          onFermer={() => setJourOuvert(null)}
          onEnregistrer={(mode) =>
            dayMut.mutate(
              { planId, delivererId: jourOuvert.livreur.id, date: jourOuvert.jour, mode },
              {
                onSuccess: () => {
                  toast.success("Jour enregistré");
                  setJourOuvert(null);
                },
              },
            )
          }
        />
      )}

      {/* ⋮ de l'en-tête (Supprimer) ou d'une ligne (Retirer du planning) */}
      {menu && (
        <MenuFlottant
          ancre={menu.ancre}
          onFermer={() => setMenu(null)}
          libelle={menu.livreur ? "Retirer du planning" : "Supprimer"}
          onChoisir={() => {
            setFenetre(menu.livreur ? { type: "retrait", livreur: menu.livreur } : { type: "suppression" });
            setMenu(null);
          }}
        />
      )}

      {fenetre?.type === "ajout" && (
        <FenetreAjout
          planId={planId}
          restaurantId={restaurantId}
          dejaSurLePlanning={grille.livreurs.map((l) => l.id)}
          pied={textes.ajout}
          onFermer={() => setFenetre(null)}
        />
      )}

      <ConfirmDialog
        isOpen={fenetre?.type === "retrait"}
        onClose={() => setFenetre(null)}
        title={
          fenetre?.type === "retrait" ? `Retirer ${prenomLivreur(fenetre.livreur)} du planning ?` : ""
        }
        description={textes.retrait}
        confirmLabel="Retirer"
        variant="danger"
        isLoading={removeMut.isPending}
        onConfirm={() => {
          if (fenetre?.type !== "retrait") return;
          const livreur = fenetre.livreur;
          removeMut.mutate(
            { planId, delivererId: livreur.id },
            {
              onSuccess: () => {
                toast.success(`${prenomLivreur(livreur)} retiré du planning`);
                setFenetre(null);
              },
            },
          );
        }}
      />

      <ConfirmDialog
        isOpen={fenetre?.type === "suppression"}
        onClose={() => setFenetre(null)}
        title="Supprimer ce plan ?"
        description={textes.suppression}
        confirmLabel="Supprimer"
        variant="danger"
        isLoading={deleteMut.isPending}
        onConfirm={() =>
          deleteMut.mutate(planId, {
            onSuccess: () => {
              toast.success("Plan supprimé");
              setFenetre(null);
              onPlanSupprime();
            },
          })
        }
      />

      <EditDatesModal
        isOpen={fenetre?.type === "dates"}
        plan={plan}
        onClose={() => setFenetre(null)}
        onRegenerated={(nouveauId) => {
          toast.success("Plan régénéré pour les nouvelles dates");
          setFenetre(null);
          onPlanRefait(nouveauId);
        }}
      />
    </div>
  );
}

// ============================================================
// SOUS-COMPOSANTS
// ============================================================

const BoutonSecondaire: React.FC<{ onClick: () => void; children: React.ReactNode; title?: string }> = ({
  onClick,
  children,
  title,
}) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 text-xs font-semibold px-3 py-2 hover:bg-gray-50 whitespace-nowrap"
  >
    {children}
  </button>
);

const StatChip: React.FC<{ label: string; count: number; color: string; bg: string }> = ({
  label,
  count,
  color,
  bg,
}) => (
  <span
    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold whitespace-nowrap"
    style={{ backgroundColor: bg, color }}
  >
    {label} {count}
  </span>
);

const IconeCreneau: Record<ShiftType, React.FC<{ className?: string }>> = { MORNING: Sun, EVENING: Moon };

/** Mini-pastille d'un créneau : soleil (Matin) ou lune (Soir), couleur de la réponse. */
const MiniPastille: React.FC<{ type: ShiftType; affectation: IShiftAssignment }> = ({ type, affectation }) => {
  const c = COULEUR_REPONSE[affectation.status];
  const Icone = IconeCreneau[type];
  return (
    <span
      className="inline-flex h-5 w-6 items-center justify-center rounded"
      style={{ backgroundColor: c.bg, color: c.color }}
      title={texteCreneau(type, affectation)}
    >
      <Icone className="w-3 h-3" />
    </span>
  );
};

const CaseJour: React.FC<{
  matin: IShiftAssignment | undefined;
  soir: IShiftAssignment | undefined;
  reposDuLivreur: boolean;
  aujourdhui: boolean;
  touchable: boolean;
  occupe: boolean;
  onToucher: (e: React.MouseEvent<HTMLButtonElement>, travaille: boolean) => void;
}> = ({ matin, soir, reposDuLivreur, aujourdhui, touchable, occupe, onToucher }) => {
  const travaille = !!matin || !!soir;
  const contenu = travaille ? (
    <span className="inline-flex items-center gap-1">
      {matin && <MiniPastille type="MORNING" affectation={matin} />}
      {soir && <MiniPastille type="EVENING" affectation={soir} />}
    </span>
  ) : (
    <span className="text-[11px] text-gray-400" title={reposDuLivreur ? "Repos (livreur)" : undefined}>
      Repos
    </span>
  );

  return (
    <td className={`p-1 text-center ${aujourdhui ? "bg-orange-50/60" : ""}`}>
      {touchable ? (
        <button
          type="button"
          disabled={occupe}
          onClick={(e) => onToucher(e, travaille)}
          className="w-full h-8 rounded-md inline-flex items-center justify-center hover:bg-orange-100/60 disabled:cursor-wait"
        >
          {contenu}
        </button>
      ) : (
        <div className="w-full h-8 inline-flex items-center justify-center">{contenu}</div>
      )}
    </td>
  );
};

const Legende: React.FC<{ horaires: Partial<Record<ShiftType, string>> }> = ({ horaires }) => {
  const creneaux = [
    horaires.MORNING ? `Matin ${horaires.MORNING}` : null,
    horaires.EVENING ? `Soir ${horaires.EVENING}` : null,
  ].filter(Boolean);
  const pastilles: { label: string; bg: string; color: string }[] = [
    { label: "En attente", ...COULEUR_REPONSE.ASSIGNED },
    { label: "Confirmé", ...COULEUR_REPONSE.CONFIRMED },
    { label: "Refusé", ...COULEUR_REPONSE.REFUSED },
    { label: "Repos", bg: "#F4F4F5", color: "#71717A" },
  ];
  return (
    <div className="px-5 py-3 border-t border-gray-100 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-gray-500">
      {creneaux.length > 0 && <span>{creneaux.join(" · ")}</span>}
      <span className="inline-flex flex-wrap items-center gap-3">
        {pastilles.map((p) => (
          <span key={p.label} className="inline-flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: p.bg, border: `1px solid ${p.color}` }} />
            {p.label}
          </span>
        ))}
      </span>
    </div>
  );
};

/** Place une fenêtre de `largeur` × `hauteur` sous l'ancre, ou au-dessus si la page manque. */
function placer(ancre: Ancre, largeur: number, hauteur: number) {
  const gauche = Math.max(8, Math.min(ancre.gauche, window.innerWidth - largeur - 8));
  const dessous = ancre.bas + 4;
  const haut = dessous + hauteur > window.innerHeight ? Math.max(8, ancre.haut - hauteur - 4) : dessous;
  return { left: gauche, top: haut };
}

/** Ferme à la touche Échap. */
function useEchap(onFermer: () => void, actif = true) {
  useEffect(() => {
    if (!actif) return;
    const surTouche = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFermer();
    };
    window.addEventListener("keydown", surTouche);
    return () => window.removeEventListener("keydown", surTouche);
  }, [onFermer, actif]);
}

const MenuFlottant: React.FC<{
  ancre: Ancre;
  libelle: string;
  onChoisir: () => void;
  onFermer: () => void;
}> = ({ ancre, libelle, onChoisir, onFermer }) => {
  useEchap(onFermer);
  return (
    <>
      <div className="fixed inset-0 z-[55]" onClick={onFermer} />
      <div
        role="menu"
        className="fixed z-[56] w-48 rounded-xl border border-gray-200 bg-white py-1 shadow-xl"
        style={placer(ancre, 192, 44)}
      >
        <button
          type="button"
          role="menuitem"
          onClick={onChoisir}
          className="w-full text-left px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
        >
          {libelle}
        </button>
      </div>
    </>
  );
};

const FenetreJour: React.FC<{
  prenom: string;
  jour: string;
  travaille: boolean;
  sansRepos: boolean;
  pied: string | null;
  ancre: Ancre;
  enCours: boolean;
  onFermer: () => void;
  onEnregistrer: (mode: "WORK" | "REST") => void;
}> = ({ prenom, jour, travaille, sansRepos, pied, ancre, enCours, onFermer, onEnregistrer }) => {
  const [mode, setMode] = useState<"WORK" | "REST">(travaille ? "WORK" : "REST");
  useEchap(onFermer, !enCours);
  const inchange = mode === (travaille ? "WORK" : "REST");

  return (
    <>
      <div className="fixed inset-0 z-[55]" onClick={enCours ? undefined : onFermer} />
      <div
        role="dialog"
        aria-label={`${prenom} · ${jourCourt(jour)}`}
        className="fixed z-[56] w-[260px] rounded-xl border border-gray-200 bg-white p-4 shadow-xl"
        style={placer(ancre, 260, 200)}
      >
        <p className="text-sm font-bold text-gray-900 truncate">
          {prenom} · {jourCourt(jour)}
        </p>
        <div className="mt-3 space-y-2 text-sm text-gray-800">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="mode-jour"
              checked={mode === "WORK"}
              onChange={() => setMode("WORK")}
              className="accent-[#F17922]"
            />
            Au travail
          </label>
          <label
            className={`flex items-center gap-2 ${sansRepos ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            title={sansRepos ? "Repos interdit ce jour-là" : undefined}
          >
            <input
              type="radio"
              name="mode-jour"
              checked={mode === "REST"}
              disabled={sansRepos}
              onChange={() => setMode("REST")}
              className="accent-[#F17922]"
            />
            Repos
          </label>
        </div>
        {pied && <p className="mt-3 text-xs text-gray-500">{pied}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onFermer}
            disabled={enCours}
            className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() => onEnregistrer(mode)}
            disabled={enCours || inchange}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#F17922] rounded-lg hover:bg-[#D8631F] disabled:opacity-50"
          >
            {enCours && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Enregistrer
          </button>
        </div>
      </div>
    </>
  );
};

/** « Ajouter un livreur » : livreurs actifs du restaurant qui ne sont pas sur le planning. */
const FenetreAjout: React.FC<{
  planId: string;
  restaurantId: string;
  dejaSurLePlanning: string[];
  pied: string | null;
  onFermer: () => void;
}> = ({ planId, restaurantId, dejaSurLePlanning, pied, onFermer }) => {
  const { data, isLoading, isError, isFetching, refetch } = useLivreursAjoutablesQuery({
    id: planId,
    restaurantId,
    dejaSurLePlanning,
  });
  const addMut = useAddDelivererToPlanMutation();
  useEchap(onFermer, !addMut.isPending);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={addMut.isPending ? undefined : onFermer}
    >
      <div
        role="dialog"
        aria-labelledby="titre-ajout-livreur"
        className="bg-white rounded-2xl w-full max-w-sm max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h4 id="titre-ajout-livreur" className="font-bold text-gray-900">
            Ajouter un livreur
          </h4>
          <button
            type="button"
            aria-label="Fermer"
            onClick={onFermer}
            disabled={addMut.isPending}
            className="text-gray-400 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-3 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-1">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-10 rounded-lg bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : isError ? (
            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Impossible de lire les livreurs.</span>
              <button
                type="button"
                onClick={() => refetch()}
                disabled={isFetching}
                className="ml-auto shrink-0 text-[#F17922] underline disabled:opacity-50"
              >
                Réessayer
              </button>
            </div>
          ) : !data || data.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8 px-2">
              Aucun livreur à ajouter (tous déjà dans le plan).
            </p>
          ) : (
            <ul className="flex flex-col gap-1">
              {data.map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg hover:bg-orange-50">
                  <span className="text-sm font-medium text-gray-800 truncate" title={nomLivreur(l)}>
                    {nomLivreur(l)}
                  </span>
                  <button
                    type="button"
                    disabled={addMut.isPending}
                    onClick={() =>
                      addMut.mutate(
                        { planId, delivererId: l.id },
                        {
                          onSuccess: () => {
                            toast.success(`${prenomLivreur(l)} ajouté au planning`);
                            onFermer();
                          },
                        },
                      )
                    }
                    className="shrink-0 text-xs font-semibold text-[#F17922] hover:underline disabled:opacity-50"
                  >
                    Ajouter
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {pied && <p className="px-5 py-3 border-t border-gray-100 text-xs text-gray-500">{pied}</p>}
      </div>
    </div>
  );
};

const SqueletteDetail = () => (
  <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
    <div className="px-5 py-4 border-b border-gray-100 space-y-2">
      <div className="h-5 w-48 rounded bg-gray-100 animate-pulse" />
      <div className="h-3 w-32 rounded bg-gray-100 animate-pulse" />
    </div>
    <div className="p-3 space-y-2">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="h-8 rounded bg-gray-100 animate-pulse" />
      ))}
    </div>
  </div>
);

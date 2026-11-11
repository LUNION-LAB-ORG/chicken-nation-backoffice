import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { incidentAPI } from "../apis/incident.api";
import type {
  AssignerIncidentDTO,
  Bareme,
  CloturerIncidentDTO,
  IncidentFiche,
  IncidentPole,
  ResoudreIncidentDTO,
  RouvrirIncidentDTO,
  SignalerIncidentDTO,
} from "../types/incident.types";
import { estDoublon, formatMontant, messageErreurIncident } from "../utils/incident";
import { incidentKeys } from "./incident.query";

/**
 * Gestes sur un incident. Chaque réponse est la fiche à jour : elle remplace
 * le cache de la fiche, puis tableau, listes et compteurs sont relus. Un
 * conflit (409 : un collègue a fait avancer l'incident) affiche le message du
 * serveur et recharge.
 */
function useGesteIncident<V>(
  geste: (id: string, v: V) => Promise<IncidentFiche>,
  succes: (fiche: IncidentFiche, v: V) => string,
  /** Autres écrans à relire après ce geste (l'avis du site lié, par exemple). */
  aussi: readonly (readonly string[])[] = [],
) {
  const queryClient = useQueryClient();
  const relire = () => queryClient.invalidateQueries({ queryKey: incidentKeys.tout, exact: false });
  return useMutation({
    mutationFn: ({ id, valeur }: { id: string; valeur: V }) => geste(id, valeur),
    onSuccess: (fiche, { id, valeur }) => {
      queryClient.setQueryData(incidentKeys.fiche(id), fiche);
      relire();
      aussi.forEach((queryKey) => queryClient.invalidateQueries({ queryKey, exact: false }));
      toast.success(succes(fiche, valeur));
    },
    onError: (e) => {
      toast.error(messageErreurIncident(e));
      // Conflit, ou SMS non parti (le bon existe) : la fiche a pu changer.
      relire();
    },
  });
}

/**
 * Signaler. Un doublon (409 `INCIDENT_DOUBLON`) n'est pas une erreur à
 * afficher en rouge : la fenêtre relit les incidents de la commande et
 * propose d'ouvrir celui qui existe.
 */
export const useSignalerIncidentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: SignalerIncidentDTO) => incidentAPI.signaler(dto),
    onSuccess: (fiche) => {
      queryClient.setQueryData(incidentKeys.fiche(fiche.id), fiche);
      queryClient.invalidateQueries({ queryKey: incidentKeys.tout, exact: false });
      // L'avis ou la note d'origine montrent maintenant leur incident.
      queryClient.invalidateQueries({ queryKey: ["avis-prives"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["comments"], exact: false });
      toast.success(`Incident ${fiche.code} signalé`);
    },
    onError: (e) => {
      queryClient.invalidateQueries({ queryKey: incidentKeys.tout, exact: false });
      if (!estDoublon(e)) toast.error(messageErreurIncident(e));
    },
  });
};

export const usePrendreIncidentMutation = () =>
  useGesteIncident<AssignerIncidentDTO>((id, dto) => incidentAPI.assigner(id, dto), () => "Incident pris en charge");

export const useAssignerIncidentMutation = () =>
  useGesteIncident<AssignerIncidentDTO>((id, dto) => incidentAPI.assigner(id, dto), () => "Responsable enregistré");

export const useResoudreIncidentMutation = () =>
  useGesteIncident<ResoudreIncidentDTO>(
    (id, dto) => incidentAPI.resoudre(id, dto),
    (fiche) => {
      if (fiche.bon_a_creer) return "Incident résolu. Le bon n'a pas pu être créé.";
      if (fiche.bon && fiche.geste === "BON") {
        return fiche.bon.message_canal === "SMS"
          ? `Incident résolu. Bon de ${formatMontant(fiche.bon.montant)} envoyé par SMS.`
          : `Incident résolu. Bon de ${formatMontant(fiche.bon.montant)} créé, SMS non parti.`;
      }
      return "Incident résolu";
    },
  );

const AVIS = [["avis-prives"]] as const;

/** L'avis du site lié est résolu avec son incident : sa fiche est relue. */
export const useCloturerIncidentMutation = () =>
  useGesteIncident<CloturerIncidentDTO>((id, dto) => incidentAPI.cloturer(id, dto), () => "Incident clôturé", AVIS);

export const useRouvrirIncidentMutation = () =>
  useGesteIncident<RouvrirIncidentDTO>((id, dto) => incidentAPI.rouvrir(id, dto), () => "Incident rouvert", AVIS);

export const useNoterIncidentMutation = () => useGesteIncident<string>((id, note) => incidentAPI.noter(id, note), () => "Note ajoutée");

export const useCreerBonIncidentMutation = () =>
  useGesteIncident<void>((id) => incidentAPI.creerBon(id), (fiche) => (fiche.bon ? `Bon de ${formatMontant(fiche.bon.montant)} créé` : "Bon créé"));

export const useRenvoyerSmsIncidentMutation = () => useGesteIncident<void>((id) => incidentAPI.renvoyerSms(id), () => "SMS renvoyé");

// ─── Réglages (administrateur) ───────────────────────────────────────────────

function useReglage<V>(geste: (v: V) => Promise<unknown>, succes: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: geste,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: incidentKeys.reglages });
      toast.success(succes);
    },
    onError: (e) => toast.error(messageErreurIncident(e)),
  });
}

export const useEnregistrerReglagesIncidentsMutation = () =>
  useReglage<{ bareme?: Bareme; validite_jours?: number; bon_restaurant?: boolean }>(
    (dto) => incidentAPI.enregistrerReglages(dto),
    "Réglages enregistrés",
  );

export const useCreerCategorieIncidentMutation = () =>
  useReglage<{ nom: string; pole: IncidentPole; delai_heures: number }>((dto) => incidentAPI.creerCategorie(dto), "Catégorie ajoutée");

export const useModifierCategorieIncidentMutation = () =>
  useReglage<{ id: string; valeur: Partial<{ nom: string; pole: IncidentPole; delai_heures: number; actif: boolean }> }>(
    ({ id, valeur }) => incidentAPI.modifierCategorie(id, valeur),
    "Catégorie enregistrée",
  );

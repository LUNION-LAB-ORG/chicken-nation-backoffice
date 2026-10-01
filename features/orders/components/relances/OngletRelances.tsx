"use client";

import React, { useEffect, useMemo, useState } from "react";
import { EyeOff, Loader2, Volume2 } from "lucide-react";
import { toast } from "react-hot-toast";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useDashboardStore } from "@/store/dashboardStore";
import { useAuthStore } from "../../../users/hook/authStore";
import { useHorlogeRelances } from "../../hooks/useHorlogeRelances";
import { activerSonRelances } from "../../hooks/useSonRelances";
import { useRelancesQuery } from "../../queries/relance.query";
import { usePrendreRelance } from "../../queries/relance.mutation";
import { getOrderById } from "../../services/order-service";
import { useRelanceUiStore } from "../../stores/relance-ui.store";
import { GroupeRelance } from "../../types/relance.types";
import { OrderTable } from "../../types/ordersTable.types";
import { mapApiOrderToUiOrder } from "../../utils/orderMapper";
import { reglesDe } from "../../utils/relance";
import { InterrupteurSonRelances } from "./InterrupteurSonRelances";
import { LigneRelance } from "./LigneRelance";
import { ListeIgnorees } from "./ListeIgnorees";
import { ModaleIgnorerRelance } from "./ModaleIgnorerRelance";

interface Props {
  /** Ouvre le tiroir de la commande, comme un clic dans le tableau. */
  onOuvrir: (orderId: string) => void;
  /** Ouvre « Modifier la commande » sur la commande reprise au téléphone. */
  onReprendre: (commande: OrderTable) => void;
}

const Section = ({
  titre,
  sousTitre,
  children,
}: {
  titre: string;
  sousTitre?: string;
  children: React.ReactNode;
}) => (
  <section className="space-y-2">
    <div>
      <h3 className="text-sm font-bold text-gray-800">{titre}</h3>
      {sousTitre && <p className="text-xs text-gray-500">{sousTitre}</p>}
    </div>
    <div className="space-y-2">{children}</div>
  </section>
);

/**
 * Onglet « À relancer » de la page Commandes (ADMIN, centre d'appels) : les
 * paniers de l'application restés sans paiement, regroupés par client.
 * L'état de chaque groupe vient du serveur ; l'écran ne filtre que par
 * restaurant (une seule lecture « tous restaurants » pour toute l'interface).
 */
export function OngletRelances({ onOuvrir, onReprendre }: Props) {
  const { data, isLoading, isError, refetch } = useRelancesQuery();
  const restaurantId = useDashboardStore((s) => s.selectedRestaurantId);
  const estAdmin = String(useAuthStore((s) => s.user?.role)) === "ADMIN";
  const sonBloque = useRelanceUiStore((s) => s.sonBloque);
  const setOngletVisible = useRelanceUiStore((s) => s.setOngletVisible);
  const maintenant = useHorlogeRelances();

  const [voirIgnorees, setVoirIgnorees] = useState(false);
  const [aIgnorer, setAIgnorer] = useState<GroupeRelance | null>(null);
  const [aReprendre, setAReprendre] = useState<GroupeRelance | null>(null);
  const [repriseCle, setRepriseCle] = useState<string | null>(null);
  const prendre = usePrendreRelance();

  // L'onglet à l'écran rend le bandeau global inutile.
  useEffect(() => {
    setOngletVisible(true);
    return () => setOngletVisible(false);
  }, [setOngletVisible]);

  const regles = reglesDe(data);
  const groupes = useMemo(
    () => (data?.groupes ?? []).filter((g) => !restaurantId || g.tete.restaurant?.id === restaurantId),
    [data?.groupes, restaurantId],
  );
  const miens = groupes.filter((g) => g.etat === "PRIS" && g.prise?.par_moi);
  const aRelancer = groupes.filter((g) => g.etat === "A_RELANCER");
  const equipe = groupes.filter((g) => g.etat === "PRIS" && !g.prise?.par_moi);
  const enCours = groupes.filter((g) => g.etat === "EN_COURS");

  /**
   * Reprise au téléphone, après la confirmation du client.
   *
   * La prise est (re)posée d'abord : elle prolonge celle de l'agent le
   * temps de la saisie, et un 409 (collègue, client qui vient de payer)
   * arrête tout. Puis « Modifier la commande » s'ouvre : c'est la bascule
   * vers le call center, à l'enregistrement, qui sort la commande des
   * relances.
   *
   * Limite connue : un paiement accepté par l'opérateur mais jamais signalé
   * (ni webhook ni retour de l'application) est invisible ici. Seul le
   * client peut dire s'il a été débité, d'où la confirmation.
   */
  const reprendre = async (g: GroupeRelance) => {
    setAReprendre(null);
    setRepriseCle(g.cle);
    try {
      try {
        await prendre.mutateAsync({ orderId: g.cle, reference: g.tete.reference, silencieux: true });
      } catch {
        return; // message déjà affiché par la prise
      }
      try {
        const commande = await getOrderById(g.tete.id);
        onReprendre(mapApiOrderToUiOrder(commande));
        toast("Prévenez le client : il ne doit plus payer dans l'application.", { icon: "📞", duration: 8000 });
      } catch (e) {
        toast.error((e as Error)?.message || "Impossible d'ouvrir la commande.");
      }
    } finally {
      setRepriseCle(null);
    }
  };

  const ligne = (g: GroupeRelance) => (
    <LigneRelance
      key={g.cle}
      groupe={g}
      maintenant={maintenant}
      estAdmin={estAdmin}
      onOuvrir={onOuvrir}
      onIgnorer={setAIgnorer}
      onReprendre={setAReprendre}
      repriseEnCours={repriseCle === g.cle}
    />
  );

  const nbIgnorees = data?.compteurs?.ignorees ?? 0;

  return (
    <div className="space-y-4">
      {/* Barre d'outils */}
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <p className="text-xs text-gray-500">
          Appel conseillé {regles.delai_minutes} min après la commande. Une commande prise se libère seule au bout de{" "}
          {regles.duree_prise_minutes} min.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {sonBloque && (
            <button
              type="button"
              onClick={() => void activerSonRelances()}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-[#F17922] bg-white text-[13px] font-semibold text-[#F17922] hover:bg-orange-50 cursor-pointer whitespace-nowrap"
            >
              <Volume2 className="w-4 h-4" />
              Activer le son
            </button>
          )}
          <InterrupteurSonRelances />
          <button
            type="button"
            onClick={() => setVoirIgnorees((v) => !v)}
            aria-pressed={voirIgnorees}
            className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border text-[13px] font-medium cursor-pointer whitespace-nowrap transition-colors ${
              voirIgnorees ? "border-[#F17922] bg-orange-50 text-[#F17922]" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            <EyeOff className="w-4 h-4" />
            {voirIgnorees ? "Retour aux relances" : `Voir les ignorées (${nbIgnorees})`}
          </button>
        </div>
      </div>

      {voirIgnorees ? (
        <ListeIgnorees maintenant={maintenant} restaurantId={restaurantId} />
      ) : isLoading && !data ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-[#F17922]" />
        </div>
      ) : isError && !data ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700 flex flex-wrap items-center gap-3">
          Impossible de charger les relances.
          <button type="button" onClick={() => void refetch()} className="font-semibold underline cursor-pointer">
            Réessayer
          </button>
        </div>
      ) : groupes.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
          Aucune commande à relancer. Les paniers non payés apparaissent ici {regles.delai_minutes} min après leur création.
        </p>
      ) : (
        <div className="space-y-6">
          {miens.length > 0 && <Section titre="Vous vous en occupez">{miens.map(ligne)}</Section>}
          {aRelancer.length > 0 && <Section titre={`À relancer (${aRelancer.length})`}>{aRelancer.map(ligne)}</Section>}
          {equipe.length > 0 && <Section titre={`Prises par l'équipe (${equipe.length})`}>{equipe.map(ligne)}</Section>}
          {enCours.length > 0 && (
            <Section
              titre={`Paiement en cours (${enCours.length})`}
              sousTitre={`Le client est peut-être en train de payer. Pas d'appel avant ${regles.delai_minutes} min.`}
            >
              {enCours.map(ligne)}
            </Section>
          )}
        </div>
      )}

      <ModaleIgnorerRelance groupe={aIgnorer} onClose={() => setAIgnorer(null)} />

      <ConfirmDialog
        isOpen={!!aReprendre}
        onClose={() => setAReprendre(null)}
        onConfirm={() => aReprendre && void reprendre(aReprendre)}
        title="Le client confirme ne pas avoir été débité ?"
        description={
          <>
            <p>
              Demandez-lui de vérifier qu&apos;aucun débit n&apos;apparaît sur son téléphone pour{" "}
              {aReprendre?.tete.reference}.
            </p>
            <p className="mt-2">
              Un paiement accepté par l&apos;opérateur mais jamais signalé à l&apos;application ne se voit pas ici :
              s&apos;il a été débité, ne reprenez pas la commande et prévenez un administrateur.
            </p>
          </>
        }
        confirmLabel="Oui, reprendre la commande"
        cancelLabel="Annuler"
      />
    </div>
  );
}

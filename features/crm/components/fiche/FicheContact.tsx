import React from "react";
import { Eye, PartyPopper, Store } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { useAuthStore } from "../../../users/hook/authStore";
// Import RELATIF entre modules : `@/` désigne `src/`, et `features/` vit à la
// racine — `@/features/...` compile mais casse la construction de production.
import { ClientDetail } from "../../../customer/components/detail-customer";
import { Action, Modules } from "../../../users/types/auth.type";
import { useContactFicheQuery } from "../../queries/contact.query";
import { fmtDate, fmtMontant } from "../../utils/crm-ui";
import { Chargement, Erreur } from "../commun/Etats";
import { FicheContexte } from "./FicheContexte";
import { FicheEntete } from "./FicheEntete";
import { FicheHistorique } from "./FicheHistorique";
import { PanneauAgent } from "./PanneauAgent";
import { PanneauAppel } from "./PanneauAppel";
import { PanneauCoupon } from "./PanneauCoupon";

/**
 * Fiche contact (cahier §4.1) : à gauche ce qu'on sait du client, à droite
 * ce qu'on peut faire pour lui. Même disposition que les fiches Livreur et
 * Personnel du backoffice.
 */
export function FicheContact({
  id,
  telephone,
  onFermer,
  estGestionnaire,
}: {
  id: string | null;
  /** Numéro tapé pour un client qui appelle : ouvre en lecture la fiche d'un collègue. */
  telephone?: string;
  onFermer: () => void;
  estGestionnaire: boolean;
}) {
  const moi = useAuthStore((s) => s.user?.id);
  const { data: p, isError, error } = useContactFicheQuery(id, telephone);

  /**
   * FICHE CLIENT DANS LA FICHE CONTACT — « un écran, deux droits ».
   *
   * L'ancienne page Clients disparaît, mais son droit reste : le dossier du
   * client (commandes, adresses, favoris, avis, Carte Nation) s'ouvre derrière
   * `CLIENTS`, le panneau d'appel derrière `CRM`. Un caissier voit donc le
   * dossier sans voir le pipeline d'appels, et personne ne gagne ni ne perd
   * d'accès en supprimant la page.
   *
   * Absent quand le contact n'a pas de compte : un numéro relevé en caisse
   * n'a ni commandes, ni adresses, ni avis — un onglet vide vaudrait moins
   * que pas d'onglet.
   */
  const peutVoirLeDossier = useAuthStore((s) => s.can(Modules.CLIENTS, Action.READ));
  const compteId = p?.customer?.id ?? null;
  /**
   * ANNUAIRE : le serveur a déjà vidé la fiche de tout ce qui touche au
   * centre d'appels. Il n'y a donc pas deux vues à proposer, il n'y en a
   * qu'une — le dossier client. Pas d'onglets, pas de panneau d'appel.
   */
  const annuaire = p?.mode === "annuaire";
  const dossierPossible = peutVoirLeDossier && !!compteId;
  const [onglet, setOnglet] = React.useState<"crm" | "client">("crm");

  // Le contact change : on revient au suivi, et on ne garde pas un onglet
  // « Fiche client » ouvert sur une fiche qui, elle, n'en a pas.
  React.useEffect(() => {
    setOnglet("crm");
  }, [id]);

  const converti = p?.status === "CONVERTI";
  // Client d'un collègue, retrouvé par son numéro : on lit, on renvoie son coupon, rien d'autre.
  const lecture = p?.mode === "lecture";
  // Lecteur (marketing, manager) : tout voir, téléphone compris, sans aucun geste.
  const consultation = p?.mode === "consultation";
  const pilote = !consultation && !!p?.campagnes.some((m) => !m.released_at && m.campaign.lead_agent_id === moi);
  const sortie =
    p?.segment === "INACTIF" ? "De retour le" : p?.segment === "JAMAIS_COMMANDE" ? "Première commande le" : "A commandé en direct le";

  return (
    <Modal isOpen={!!id} onClose={onFermer} title="Fiche contact" size="large">
      {isError ? (
        <Erreur message={(error as Error)?.message} />
      ) : !p ? (
        <Chargement />
      ) : (
        <div className="space-y-5">
          <FicheEntete p={p} />

          {dossierPossible && !annuaire && (
            <div className="flex items-center gap-1 border-b border-gray-100">
              {([
                ["crm", "Suivi CRM"],
                ["client", "Fiche client"],
              ] as const).map(([cle, libelle]) => (
                <button
                  key={cle}
                  type="button"
                  onClick={() => setOnglet(cle)}
                  className={`relative px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
                    onglet === cle ? "text-[#F17922]" : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  {libelle}
                  {onglet === cle && (
                    <span className="absolute bottom-0 left-0 right-0 h-[3px] rounded-t bg-[#F17922]" />
                  )}
                </button>
              ))}
            </div>
          )}

          {annuaire && !compteId ? (
            <p className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
              Ce contact n&apos;a pas de compte sur l&apos;application : il n&apos;y a pas de dossier client à
              afficher. Son numéro a été relevé en caisse sur une commande Glovo ou Yango.
            </p>
          ) : (annuaire || onglet === "client") && compteId ? (
            <ClientDetail clientId={compteId} />
          ) : (
          <>
          {consultation && (
            <div className="flex items-start gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
              <Eye className="w-4 h-4 mt-0.5 shrink-0 text-gray-500" />
              <p>
                <span className="font-semibold">Consultation seule.</span> Les appels, les coupons et le choix de l&apos;agent
                restent à l&apos;équipe du CRM.
              </p>
            </div>
          )}
          {lecture && !converti && (
            <div className="flex items-start gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
              <Eye className="w-4 h-4 mt-0.5 shrink-0" />
              <p>
                {p.assigned_to
                  ? `Client suivi par ${p.assigned_to.fullname} : les appels restent à son agent.`
                  : "Ce client n'est confié à personne pour l'instant : demandez à la direction de vous l'attribuer."}
                {p.coupon?.etat === "ACTIF" && " Vous pouvez lui renvoyer son coupon s'il ne l'a pas reçu."}
              </p>
            </div>
          )}
          {p.mode === "commune" && !converti && (
            <div className="flex items-start gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-[#C2410C]">
              <Store className="w-4 h-4 mt-0.5 shrink-0" />
              <p>Client de la file commune Glovo/Yango : il devient le vôtre dès que vous enregistrez un appel ou envoyez un coupon.</p>
            </div>
          )}
          {/* Sur téléphone, les actions passent avant l'historique : l'agent qualifie son appel sans défiler. */}
          <div className="grid gap-6 md:grid-cols-5">
            <div className="md:col-span-3 space-y-4 min-w-0 order-2 md:order-1">
              <FicheHistorique p={p} />
              <FicheContexte p={p} />
            </div>

            <div className="md:col-span-2 space-y-5 bg-[#FBFBFB] rounded-2xl p-4 h-fit order-1 md:order-2">
              {converti ? (
                <div className="text-center py-6">
                  <PartyPopper className="w-8 h-8 text-emerald-600 mx-auto" />
                  <p className="font-semibold text-gray-900 mt-2">Client converti</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {sortie} {fmtDate(p.converted_at)}
                    {p.conversion_amount != null && `, ${fmtMontant(p.conversion_amount)}`}.
                  </p>
                  <p className="text-xs text-gray-400 mt-2">Il est sorti de la liste : plus aucun appel n&apos;est nécessaire.</p>
                </div>
              ) : consultation ? (
                <PanneauCoupon p={p} consultation />
              ) : lecture ? (
                <PanneauCoupon p={p} lectureSeule />
              ) : (
                <>
                  <PanneauAppel contactId={p.id} />
                  <div className="border-t border-gray-200" />
                  <PanneauCoupon p={p} />
                  {(estGestionnaire || pilote) && (
                    <>
                      <div className="border-t border-gray-200" />
                      <PanneauAgent key={p.assigned_to_id ?? "aucun"} p={p} />
                    </>
                  )}
                </>
              )}
            </div>
          </div>
          </>
          )}
        </div>
      )}
    </Modal>
  );
}

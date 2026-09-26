import React, { useEffect, useRef, useState } from "react";
import { ChevronDown, Info, ShoppingBag } from "lucide-react";
import StatsChartCard from "@/components/gestion/Statistiques/shared/StatsChartCard";
import { Pagination } from "@/components/ui/pagination";
import { useAuthStore } from "../../../users/hook/authStore";
import { Action, Modules } from "../../../users/types/auth.type";
import { useVentesCampagneQuery } from "../../queries/campagne.query";
import { IAutreCommande, IVenteCampagne, IVentesCampagne } from "../../types/campagne.type";
import { Public } from "../../types/contact.type";
import {
  ETAT_COMMANDE_META,
  PUBLICS,
  STATUT_COMMANDE,
  TYPE_COMMANDE,
  compter,
  fmtDate,
  fmtDateHeure,
  fmtMontant,
  fmtNombre,
  fmtTelephone,
  virgule,
} from "../../utils/crm-ui";
import { Bouton } from "../commun/Champs";
import { Chargement, Erreur } from "../commun/Etats";
import { Puce, PucePublic } from "../commun/Puces";
import { DetailCommande } from "./DetailCommande";
import { ONGLET_PUBLIC } from "./etat-campagne";

const LIMITE = 20;
const COLONNES = ["Client", "Public", "Agent", "Vente le", "Commande", "Restaurant", "Montant", "Coupon", "Délai"];
const sous = "block text-xs text-gray-500 font-normal";

/**
 * Référence d'une commande : ouvre son détail quand le compte a le droit de
 * lire les commandes. Une commande supprimée ne s'ouvre plus (le serveur
 * répond « introuvable ») : sa référence reste du texte.
 */
function Reference({
  id,
  reference,
  supprimee = false,
  onOuvrir,
}: {
  id: string;
  reference: string;
  supprimee?: boolean;
  onOuvrir?: (id: string) => void;
}) {
  if (supprimee) {
    return (
      <span className="font-medium text-gray-500" title="Commande supprimée : son détail ne s'ouvre plus">
        {reference}
      </span>
    );
  }
  if (!onOuvrir) return <span className="font-medium text-gray-800">{reference}</span>;
  return (
    <button
      type="button"
      onClick={() => onOuvrir(id)}
      title="Voir le détail de la commande"
      className="font-medium text-[#F17922] hover:underline text-left"
    >
      {reference}
    </button>
  );
}

/** Délai de la vente : depuis l'entrée dans la campagne, puis depuis l'entrée au CRM. */
function Delai({ v }: { v: IVenteCampagne }) {
  const campagne = v.delai_campagne_jours;
  const entree = v.delai_entree_jours;
  return (
    <>
      {/* Sous 24 h, « le jour même » serait faux pour une vente passée le lendemain matin. */}
      {campagne != null && (
        <>
          <span className="block text-gray-800 tabular-nums">{campagne < 1 ? "Moins d'un jour" : `${virgule(campagne)} j`}</span>
          <span className={sous}>après l&apos;entrée dans la campagne</span>
        </>
      )}
      {entree != null && (
        <span className="block text-xs text-gray-400">
          {entree < 1 ? "moins d'un jour depuis l'entrée au CRM" : `${virgule(entree)} j depuis l'entrée au CRM`}
        </span>
      )}
    </>
  );
}

function Coupon({ v, masque }: { v: IVenteCampagne; masque: boolean }) {
  const titre = masque ? "Code masqué en consultation" : undefined;
  if (v.coupon) {
    return (
      <>
        <span className="font-mono text-xs font-semibold text-gray-800" title={titre}>
          {v.coupon.code}
        </span>
        {v.coupon.offre && <span className={sous}>{v.coupon.offre}</span>}
        {v.coupon.hors_campagne && <span className="block text-xs text-amber-700">coupon hors campagne</span>}
      </>
    );
  }
  if (v.code_promo) {
    return (
      <span className="text-xs text-gray-600">
        code promo{" "}
        <span className="font-mono font-semibold text-gray-800" title={titre}>
          {v.code_promo}
        </span>
      </span>
    );
  }
  return <span className="text-xs text-gray-400">sans coupon</span>;
}

/** Autres commandes du client pendant la campagne ; celles qui ne sont pas valides restent hors total. */
function AutresCommandes({
  v,
  id,
  onOuvrirCommande,
}: {
  v: IVenteCampagne;
  id: string;
  onOuvrirCommande?: (id: string) => void;
}) {
  const { commandes, nombre, valides, montant, tronque } = v.autres;
  return (
    <div id={id} className="mt-2 rounded-xl border border-gray-100 bg-gray-50 overflow-x-auto">
      <table className="w-full text-xs">
        <caption className="sr-only">Autres commandes de {v.contact.nom} pendant la campagne</caption>
        <tbody>
          {commandes.map((a: IAutreCommande) => {
            const valide = a.etat === "VALIDE";
            return (
              <tr key={a.id} className="border-b border-gray-100 last:border-b-0">
                <td className="px-3 py-2 whitespace-nowrap text-gray-500 tabular-nums">{fmtDateHeure(a.cree_le)}</td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <Reference id={a.id} reference={a.reference} supprimee={a.etat === "SUPPRIMEE"} onOuvrir={onOuvrirCommande} />
                </td>
                <td className="px-3 py-2 text-gray-600">{a.restaurant ?? ""}</td>
                <td className="px-3 py-2 whitespace-nowrap text-gray-500">
                  {STATUT_COMMANDE[a.statut] ?? a.statut}
                  {TYPE_COMMANDE[a.type] && ` · ${TYPE_COMMANDE[a.type]}`}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {!valide && <Puce label={`${ETAT_COMMANDE_META[a.etat].label}, hors total`} className={ETAT_COMMANDE_META[a.etat].className} />}
                </td>
                <td className={`px-3 py-2 whitespace-nowrap text-right tabular-nums font-semibold ${valide ? "text-gray-800" : "text-gray-400"}`}>
                  {fmtMontant(a.montant)}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t border-gray-200">
            <td colSpan={5} className="px-3 py-2 text-gray-600">
              {valides > 0 ? `Total : ${compter(valides, "commande valide", "commandes valides")}` : "Aucune commande valide"}
              {tronque && (
                <span className="text-gray-400">
                  {" "}
                  · les {fmtNombre(commandes.length)} plus récentes sont affichées, sur {fmtNombre(nombre)}
                </span>
              )}
            </td>
            <td className="px-3 py-2 text-right tabular-nums font-semibold text-gray-800 whitespace-nowrap">{fmtMontant(montant)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function LigneVente({
  v,
  masque,
  ouvert,
  onBasculer,
  onOuvrirFiche,
  onOuvrirCommande,
}: {
  v: IVenteCampagne;
  masque: boolean;
  ouvert: boolean;
  onBasculer: () => void;
  onOuvrirFiche: (id: string, telephone?: string) => void;
  onOuvrirCommande?: (id: string) => void;
}) {
  const c = v.commande;
  const montantChange = !!c && Math.round(c.montant) !== Math.round(v.montant);
  const n = v.autres.nombre;
  const cellule = "px-4 pt-3 pb-1 align-top";

  return (
    <tbody className="border-t border-gray-100">
      <tr>
        <td className={`${cellule} min-w-[180px]`}>
          {v.contact.supprime ? (
            <span className="font-semibold text-gray-800">{v.contact.nom}</span>
          ) : (
            <button
              type="button"
              onClick={() => onOuvrirFiche(v.contact.id, v.contact.telephone || undefined)}
              title="Ouvrir la fiche du client"
              className="font-semibold text-gray-800 hover:text-[#F17922] text-left"
            >
              {v.contact.nom}
            </button>
          )}
          {v.contact.telephone && <span className={`${sous} tabular-nums whitespace-nowrap`}>{fmtTelephone(v.contact.telephone)}</span>}
          {v.contact.supprime && (
            <span className="block mt-1">
              <Puce label="fiche supprimée" className="bg-gray-100 text-gray-500" />
            </span>
          )}
        </td>
        <td className={cellule}>
          <PucePublic segment={v.segment} />
        </td>
        <td className={`${cellule} whitespace-nowrap`}>
          {v.agent ? <span className="text-gray-800">{v.agent.fullname}</span> : <span className="text-gray-400">Sans agent</span>}
        </td>
        <td className={`${cellule} whitespace-nowrap tabular-nums text-gray-700`}>{fmtDateHeure(v.vendu_le)}</td>
        <td className={`${cellule} whitespace-nowrap`}>
          {c ? (
            <>
              <Reference id={c.id} reference={c.reference} onOuvrir={onOuvrirCommande} />
              <span className={sous}>
                {STATUT_COMMANDE[c.statut] ?? c.statut}
                {TYPE_COMMANDE[c.type] && ` · ${TYPE_COMMANDE[c.type]}`}
              </span>
            </>
          ) : (
            // Une vente du CRM porte toujours sa commande : si elle manque, la commande a disparu (même libellé que le rapport).
            <span className="text-xs text-gray-400">commande introuvable</span>
          )}
        </td>
        <td className={`${cellule} text-gray-700 min-w-[120px]`}>{c?.restaurant ?? ""}</td>
        <td className={`${cellule} text-right whitespace-nowrap tabular-nums`}>
          <span className="font-semibold text-emerald-700">{fmtMontant(v.montant)}</span>
          {montantChange && (
            <span className={sous} title="Montant actuel de la commande ; la campagne compte celui du jour de la vente">
              commande : {fmtMontant(c!.montant)}
            </span>
          )}
        </td>
        <td className={`${cellule} min-w-[140px]`}>
          <Coupon v={v} masque={masque} />
        </td>
        <td className={`${cellule} min-w-[170px]`}>
          <Delai v={v} />
        </td>
      </tr>
      <tr>
        <td colSpan={COLONNES.length} className="px-4 pt-1 pb-3">
          {n === 0 ? (
            <span className="text-xs text-gray-400">Aucune autre commande pendant la campagne</span>
          ) : (
            <>
              <button
                type="button"
                onClick={onBasculer}
                aria-expanded={ouvert}
                aria-controls={ouvert ? `autres-${v.id}` : undefined}
                className="inline-flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-[#F17922]"
              >
                <ChevronDown aria-hidden className={`w-3.5 h-3.5 transition-transform ${ouvert ? "rotate-180" : ""}`} />
                {n === 1
                  ? ouvert
                    ? "Masquer son autre commande"
                    : "Voir son autre commande pendant la campagne"
                  : ouvert
                    ? "Masquer ses autres commandes"
                    : `Voir ses ${fmtNombre(n)} autres commandes pendant la campagne`}
                {!ouvert && v.autres.valides > 0 && (
                  <span className="font-normal text-gray-400">
                    {" "}
                    · {fmtMontant(v.autres.montant)} en {compter(v.autres.valides, "commande valide", "commandes valides")}
                  </span>
                )}
              </button>
              {ouvert && <AutresCommandes v={v} id={`autres-${v.id}`} onOuvrirCommande={onOuvrirCommande} />}
            </>
          )}
        </td>
      </tr>
    </tbody>
  );
}

/** Publics proposés au filtre : ceux de la campagne et ceux qui ont vendu, dans l'ordre d'affichage. */
function publicsDuFiltre(publics: Public[], r?: IVentesCampagne["resume"]): Public[] {
  const tous = new Set<Public>([...publics, ...(r?.par_public ?? []).map((p) => p.segment)]);
  return PUBLICS.filter((p) => tous.has(p));
}

/**
 * Clients qui ont commandé : une ligne par vente comptée pour la campagne,
 * mêmes règles que le compteur des conversions et le chiffre d'affaires
 * (une commande annulée ou supprimée en sort). Sous chaque vente, les autres
 * commandes du client pendant la campagne.
 */
export function VentesCampagne({
  campagneId,
  publics,
  synchro,
  onOuvrirFiche,
}: {
  campagneId: string;
  /** Publics visés par la campagne. */
  publics: Public[];
  /**
   * Horodatage des statistiques de la campagne : la liste se relit à chacun
   * de leurs rafraîchissements, pour que son total reste celui des cartes.
   */
  synchro?: number;
  onOuvrirFiche: (id: string, telephone?: string) => void;
}) {
  const peutVoirCommandes = useAuthStore((s) => s.can(Modules.COMMANDES, Action.READ));
  const [page, setPage] = useState(1);
  const [segment, setSegment] = useState<Public | undefined>();
  const [ouverts, setOuverts] = useState<Set<string>>(new Set());
  const [commandeId, setCommandeId] = useState<string | null>(null);
  const refSection = useRef<HTMLDivElement>(null);
  const { data, isPending, isError, error, isFetching, isPlaceholderData, refetch } = useVentesCampagneQuery(campagneId, {
    page,
    limit: LIMITE,
    segment,
  });

  // Les statistiques viennent d'être relues : la liste aussi, sans doubler une lecture déjà en cours.
  const derniereSynchro = useRef(synchro);
  useEffect(() => {
    if (synchro === derniereSynchro.current) return;
    derniereSynchro.current = synchro;
    void refetch({ cancelRefetch: false });
  }, [synchro, refetch]);

  // Une vente sortie entre deux rafraîchissements peut vider la page affichée : on revient à la dernière qui existe
  // (la première quand il n'y a plus aucune vente). Le total et la page sont lus par deux requêtes : si une vente sort
  // entre les deux, le total peut encore désigner la page vide ; on recule alors d'au moins une page, jamais sur place.
  const horsLimites = !!data && !isPlaceholderData && page > 1 && data.data.length === 0;
  const pageRepli = Math.max(1, Math.min(data?.meta.totalPages ?? 1, page - 1));
  useEffect(() => {
    if (horsLimites) setPage(pageRepli);
  }, [horsLimites, pageRepli]);

  const choix = publicsDuFiltre(publics, data?.resume);
  const parPublic = data?.resume.par_public ?? [];
  const ventesTous = segment ? parPublic.reduce((t, p) => t + p.ventes, 0) : (data?.resume.ventes ?? 0);
  const ligne = segment ? parPublic.find((p) => p.segment === segment) : undefined;
  const entete = data
    ? segment
      ? `${ONGLET_PUBLIC[segment]} : ${compter(ligne?.ventes ?? 0, "vente")} · ${fmtMontant(ligne?.ca ?? 0)}`
      : `${compter(data.resume.ventes, "vente")} · ${fmtMontant(data.resume.ca)}`
    : undefined;

  const filtrer = (p: Public | undefined) => {
    setSegment(p);
    setPage(1);
  };
  // Changer de page depuis le bas de la liste ramène au haut de la section, pas au milieu de la page suivante.
  const changerPage = (p: number) => {
    setPage(p);
    const section = refSection.current;
    if (section && section.getBoundingClientRect().top < 0) section.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const basculer = (id: string) =>
    setOuverts((s) => {
      const suite = new Set(s);
      if (suite.has(id)) suite.delete(id);
      else suite.add(id);
      return suite;
    });
  const ouvrirCommande = peutVoirCommandes ? setCommandeId : undefined;
  const fenetre = data?.fenetre;

  return (
    <div ref={refSection} className="scroll-mt-4">
      <StatsChartCard
        title="Clients qui ont commandé"
        subtitle="Chaque vente comptée pour la campagne, de la plus récente à la plus ancienne"
        icon={ShoppingBag}
        rightContent={entete && <span className="text-sm font-semibold text-emerald-700 whitespace-nowrap">{entete}</span>}
      >
        {choix.length > 1 && (
          <div className="flex flex-wrap gap-1 mb-3" role="group" aria-label="Filtrer par public">
            {([undefined, ...choix] as (Public | undefined)[]).map((p) => {
              const nombre = p ? (parPublic.find((x) => x.segment === p)?.ventes ?? 0) : ventesTous;
              return (
                <button
                  key={p ?? "TOUS"}
                  type="button"
                  onClick={() => filtrer(p)}
                  aria-pressed={segment === p}
                  className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
                    segment === p ? "bg-orange-50 text-[#F17922]" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {p ? ONGLET_PUBLIC[p] : "Tous"}
                  {data && <span className="ml-1 font-normal tabular-nums">{fmtNombre(nombre)}</span>}
                </button>
              );
            })}
          </div>
        )}

        {isError && !data ? (
          // Sans données, la pagination a disparu : on garde un moyen d'en sortir sans recharger l'écran.
          <div className="space-y-2">
            <Erreur message={(error as Error)?.message} />
            <div className="flex flex-wrap gap-2">
              <Bouton onClick={() => void refetch()} desactive={isFetching}>
                Réessayer
              </Bouton>
              {page > 1 && (
                <Bouton variante="discret" onClick={() => setPage(1)}>
                  Revenir à la première page
                </Bouton>
              )}
            </div>
          </div>
        ) : isPending || !data ? (
          <Chargement />
        ) : data.data.length === 0 ? (
          // Page d'avant encore affichée, ou page vidée qu'on quitte : on attend la bonne au lieu d'annoncer « aucune vente ».
          isPlaceholderData || horsLimites ? (
            <Chargement />
          ) : (
            <p className="text-sm text-gray-400 py-6 text-center">
              {segment ? "Aucune vente pour ce public" : data.fenetre.fin ? "Aucune vente pour cette campagne" : "Aucune vente pour l'instant"}
            </p>
          )
        ) : (
          <>
            <div
              aria-busy={isFetching && isPlaceholderData}
              className={`overflow-x-auto -mx-5 transition-opacity ${isFetching && isPlaceholderData ? "opacity-60" : ""}`}
            >
              <table className="w-full text-sm">
                <caption className="sr-only">Clients qui ont commandé pendant la campagne, une ligne par vente</caption>
                <thead>
                  <tr className="text-gray-500 text-xs uppercase">
                    {COLONNES.map((c) => (
                      <th key={c} scope="col" className={`font-semibold px-4 py-2 whitespace-nowrap ${c === "Montant" ? "text-right" : "text-left"}`}>
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                {data.data.map((v) => (
                  <LigneVente
                    key={v.id}
                    v={v}
                    masque={data.masque}
                    ouvert={ouverts.has(v.id)}
                    onBasculer={() => basculer(v.id)}
                    onOuvrirFiche={onOuvrirFiche}
                    onOuvrirCommande={ouvrirCommande}
                  />
                ))}
              </table>
            </div>
            {data.meta.totalPages > 1 && (
              <div className="mt-3">
                <Pagination currentPage={page} totalPages={data.meta.totalPages} onPageChange={changerPage} isLoading={isFetching} />
              </div>
            )}
          </>
        )}

        <p className="flex items-start gap-2 text-xs text-gray-500 mt-3">
          <Info aria-hidden className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>
            Une ligne par vente comptée dans les chiffres ci-dessus : une commande annulée ou supprimée en sort. Les autres commandes du
            client sont celles passées du lancement à la clôture, ou à aujourd&apos;hui tant que la campagne tourne ; les commandes
            annulées, supprimées ou en attente de paiement sont signalées et restent hors total.
            {fenetre?.debut &&
              (fenetre.fin
                ? ` Période retenue : du ${fmtDate(fenetre.debut)} au ${fmtDate(fenetre.fin)}.`
                : ` Période retenue : depuis le ${fmtDate(fenetre.debut)}.`)}
          </span>
        </p>

        {commandeId && <DetailCommande id={commandeId} onFermer={() => setCommandeId(null)} />}
      </StatsChartCard>
    </div>
  );
}

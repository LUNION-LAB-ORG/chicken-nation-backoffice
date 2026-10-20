"use client";

import React, { useState } from "react";
import { AlertTriangle, Ban, Banknote, ChevronDown, ChevronUp, CreditCard, Globe, Loader2, Phone, PhoneForwarded } from "lucide-react";
import { BoutonCopier } from "@/components/ui/BoutonCopier";
import { numeroACopier } from "@/utils/telephone";
import { fmtMontant, lienAppel } from "../../../crm/utils/crm-ui";
import { LIBELLE_TYPE } from "../../constantes/relance.constante";
import { demanderPermissionNotifications } from "../../hooks/useSonRelances";
import { useLibererRelance, usePrendreRelance } from "../../queries/relance.mutation";
import { BrouillonLigne, GroupeRelance } from "../../types/relance.types";
import { estDuSite } from "../../utils/canal-commande";
import { aLHeure, depuis, pastilleAnnulation, reste, texteCommandeRecente, textePaiementEnLigne } from "../../utils/relance";
import { actionsRelance } from "../../utils/relance-actions";

interface Props {
  groupe: GroupeRelance;
  maintenant: number;
  /** L'ADMIN peut libérer, ignorer ou annuler la commande prise par un agent. */
  estAdmin: boolean;
  onOuvrir: (orderId: string) => void;
  onIgnorer: (groupe: GroupeRelance) => void;
  /** « Annuler la commande » : commande du site à payer à la livraison, à confirmer. */
  onAnnuler: (groupe: GroupeRelance) => void;
  onReprendre: (groupe: GroupeRelance) => void;
  /** Une reprise est en cours sur ce groupe : ses boutons attendent. */
  repriseEnCours?: boolean;
}

const bouton =
  "inline-flex items-center justify-center gap-1.5 h-10 sm:h-9 px-3.5 rounded-xl text-[13px] font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap";
const principal = `${bouton} bg-[#F17922] text-white hover:bg-[#e06816]`;
const secondaire = `${bouton} border border-gray-200 bg-white text-gray-700 hover:bg-gray-50`;

const Pastille = ({
  children,
  ton,
}: {
  children: React.ReactNode;
  ton: "rouge" | "ambre" | "gris" | "bleu" | "sarcelle";
}) => (
  <span
    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
      {
        rouge: "bg-red-100 text-red-700",
        ambre: "bg-amber-100 text-amber-800",
        gris: "bg-gray-100 text-gray-600",
        bleu: "bg-sky-100 text-sky-700",
        // Panier du site : sarcelle, comme partout ailleurs (utils/canal-commande).
        sarcelle: "bg-teal-100 text-teal-800",
      }[ton]
    }`}
  >
    {children}
  </span>
);

/**
 * Référence, mode et restaurant d'un panier, sur une ligne qui passe à la
 * suivante si besoin. Un panier du site le dit : l'agent ne parle pas de
 * l'application à un client qui a commandé sur le site. Une commande à payer
 * à la livraison le dit aussi : personne n'a rien payé en ligne.
 */
const Commande = ({ b }: { b: BrouillonLigne }) => (
  <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-500">
    <span className="font-mono text-gray-700">{b.reference}</span>
    {estDuSite(b) && (
      <Pastille ton="sarcelle">
        <Globe className="w-3 h-3" />
        Site web
      </Pastille>
    )}
    {/* Serveur plus ancien : champ absent, aucune pastille. */}
    {b.paiement_a_la_livraison && (
      <Pastille ton="ambre">
        <Banknote className="w-3 h-3" />
        À la livraison
      </Pastille>
    )}
    <span>{LIBELLE_TYPE[b.type] ?? b.type}</span>
    <span className="truncate">{b.restaurant?.name}</span>
  </span>
);

/** Ce que l'état du groupe dit à l'agent, avec le temps restant de la prise. */
function texteEtat(g: GroupeRelance, maintenant: number): string {
  if (g.etat === "EN_COURS") return "Paiement en cours";
  // Personne n'est en train de payer : on appelle pour confirmer la commande.
  if (g.etat === "A_RELANCER" && g.a_confirmer) return "Paiement à la livraison : appeler pour confirmer";
  if (g.etat === "PRIS" && g.prise) {
    return g.prise.par_moi
      ? `Vous vous en occupez, encore ${reste(g.prise.expire_le, maintenant)}`
      : `Prise par ${g.prise.par.fullname}, libérée dans ${reste(g.prise.expire_le, maintenant)}`;
  }
  return "À relancer";
}

/**
 * Une relance : les paniers d'un même client, un seul appel. Carte lisible
 * à 375 px ; l'âge se lit sur la création du panier, jamais sur sa dernière
 * modification.
 */
export function LigneRelance({
  groupe,
  maintenant,
  estAdmin,
  onOuvrir,
  onIgnorer,
  onAnnuler,
  onReprendre,
  repriseEnCours,
}: Props) {
  const [deplie, setDeplie] = useState(false);
  const prendre = usePrendreRelance();
  const liberer = useLibererRelance();
  const { tete, autres, signaux, prise, etat } = groupe;

  const parMoi = etat === "PRIS" && !!prise?.par_moi;
  const occupe = prendre.isPending || liberer.isPending || !!repriseEnCours;
  const partiel = signaux.paiement_partiel;
  // Serveur plus ancien : champ absent, lu comme « non annulée ». Groupe à
  // confirmer : annulation d'une commande précédente, dite en gris.
  const annulee = pastilleAnnulation(groupe, maintenant);
  // Seulement sur une commande à confirmer : le client paie peut-être un autre panier.
  const enLigne = textePaiementEnLigne(groupe, maintenant);
  // Seulement sur une commande à confirmer ; absent d'un serveur plus ancien.
  const suivante = signaux.commande_suivante ?? null;
  // « A déjà payé » seulement si cette commande est payée.
  const recente = texteCommandeRecente(groupe, maintenant);
  const actions = actionsRelance(groupe, { estAdmin });

  return (
    <article
      className={`rounded-2xl border bg-white p-3 sm:p-4 ${
        parMoi ? "border-[#F17922] ring-1 ring-[#F17922]/30" : "border-gray-200"
      }`}
    >
      {/* Client, montant, âge */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-semibold text-gray-900 break-words">{tete.client_nom}</span>
            {autres.length > 0 && (
              <button
                type="button"
                onClick={() => setDeplie((d) => !d)}
                aria-expanded={deplie}
                className="inline-flex items-center gap-0.5 rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-semibold text-[#c55a10] cursor-pointer"
              >
                {autres.length + 1} paniers
                {deplie ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}
          </div>
          <Commande b={tete} />
        </div>
        <div className="shrink-0 text-right">
          <p className="font-semibold text-gray-900 whitespace-nowrap">{fmtMontant(tete.amount)}</p>
          <p className="text-xs text-gray-500 whitespace-nowrap">{depuis(tete.created_at, maintenant)}</p>
        </div>
      </div>

      {deplie && autres.length > 0 && (
        <ul className="mt-2 space-y-1 rounded-xl bg-gray-50 px-3 py-2">
          {autres.map((b) => (
            <li key={b.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5">
              <Commande b={b} />
              <span className="flex items-center gap-1.5 text-xs text-gray-500 whitespace-nowrap">
                {b.annulee_par_client && <Pastille ton="gris">Annulée</Pastille>}
                {fmtMontant(b.amount)}, {depuis(b.created_at, maintenant)}
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* Téléphone */}
      <div className="mt-3 flex items-center gap-2">
        {tete.telephone ? (
          <>
            <a
              href={lienAppel(tete.telephone)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
            >
              <Phone className="w-4 h-4 text-[#F17922]" />
              {tete.telephone}
            </a>
            <BoutonCopier valeur={numeroACopier(tete.telephone)} titre="Copier le numéro" />
          </>
        ) : (
          <span className="text-sm text-gray-500">Numéro absent</span>
        )}
      </div>

      {/* Signaux */}
      {(annulee || enLigne || signaux.paiement_refuse || partiel || recente || suivante || groupe.crm) && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {enLigne && (
            <Pastille ton="ambre">
              <CreditCard className="w-3 h-3" />
              {enLigne}
            </Pastille>
          )}
          {annulee && (
            <Pastille ton={annulee.ton}>
              <Ban className="w-3 h-3" />
              {annulee.texte}
            </Pastille>
          )}
          {signaux.paiement_refuse && (
            <Pastille ton="rouge">
              <AlertTriangle className="w-3 h-3" />
              Paiement refusé
            </Pastille>
          )}
          {partiel && (
            <Pastille ton="ambre">
              Paiement partiel : {fmtMontant(partiel.recu)} reçus sur {fmtMontant(partiel.montant)}
            </Pastille>
          )}
          {recente && <Pastille ton="ambre">{recente}</Pastille>}
          {suivante && (
            <Pastille ton="ambre">
              Autre commande {suivante.reference} {aLHeure(suivante.created_at, maintenant)} : doublon possible,
              vérifiez avec le client
            </Pastille>
          )}
          {groupe.crm && (
            <Pastille ton="bleu">Suivi CRM : {groupe.crm.agent || "sans agent"}</Pastille>
          )}
        </div>
      )}

      {/* État et actions */}
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className={`text-[13px] font-medium ${parMoi ? "text-[#F17922]" : etat === "A_RELANCER" ? "text-gray-900" : "text-gray-500"}`}>
          {texteEtat(groupe, maintenant)}
        </p>
        <div className="flex flex-wrap gap-2">
          {actions.map((action) => {
            switch (action) {
              case "prendre":
                return (
                  <button
                    key={action}
                    type="button"
                    disabled={occupe}
                    onClick={() => {
                      // Geste de l'agent : la permission des notifications se demande ici aussi.
                      demanderPermissionNotifications();
                      prendre.mutate({ orderId: groupe.cle, reference: tete.reference });
                    }}
                    className={principal}
                  >
                    {prendre.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                    Je m&apos;en occupe
                  </button>
                );
              case "reprendre":
                return (
                  <button key={action} type="button" disabled={occupe} onClick={() => onReprendre(groupe)} className={principal}>
                    {repriseEnCours ? <Loader2 className="w-4 h-4 animate-spin" /> : <PhoneForwarded className="w-4 h-4" />}
                    Reprendre au téléphone
                  </button>
                );
              case "liberer":
                return (
                  <button key={action} type="button" disabled={occupe} onClick={() => liberer.mutate(groupe.cle)} className={secondaire}>
                    {liberer.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                    Libérer
                  </button>
                );
              case "ignorer":
                return (
                  <button key={action} type="button" disabled={occupe} onClick={() => onIgnorer(groupe)} className={secondaire}>
                    Ignorer
                  </button>
                );
              case "annuler":
                return (
                  <button key={action} type="button" disabled={occupe} onClick={() => onAnnuler(groupe)} className={secondaire}>
                    Annuler la commande
                  </button>
                );
              case "ouvrir":
                return (
                  <button key={action} type="button" onClick={() => onOuvrir(tete.id)} className={secondaire}>
                    Ouvrir
                  </button>
                );
            }
          })}
        </div>
      </div>
    </article>
  );
}

"use client";

import React, { useState } from "react";
import { BadgeCheck, Loader2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { fmtMontant } from "../../../crm/utils/crm-ui";
import { LIBELLE_MOYEN, MESSAGE_TRANSACTION_ILLISIBLE, TRANSACTION_KKIAPAY } from "../../constantes/relance.constante";
import { useConfirmerPaiementRelance } from "../../queries/relance.mutation";
import { GroupeRelance } from "../../types/relance.types";
import { aLHeure, depuis, messageErreurConfirmation } from "../../utils/relance";
import { panierAConfirmerParDefaut, paniersAPayerEnLigne } from "../../utils/relance-actions";

interface Props {
  groupe: GroupeRelance | null;
  maintenant: number;
  onClose: () => void;
}

/**
 * « Confirmer le paiement ? » : le client a payé en ligne, mais le webhook
 * n'a pas confirmé la commande, restée en attente. L'agent donne
 * l'identifiant de la transaction KKiaPay ; le serveur interroge KKiaPay et ne
 * confirme que si le paiement a réussi et couvre la commande, qui part alors
 * au restaurant.
 *
 * Un paiement signalé par le webhook arrive déjà saisi. Sinon, seul le client
 * sait s'il a été débité, et l'identifiant se lit dans le tableau de bord
 * KKiaPay.
 *
 * Une nouvelle fenêtre par groupe (`key`) : rien ne reste du précédent.
 */
export function ModaleConfirmerPaiement({ groupe, maintenant, onClose }: Props) {
  if (!groupe) return null;
  return <Formulaire key={groupe.cle} groupe={groupe} maintenant={maintenant} onClose={onClose} />;
}

function Formulaire({ groupe, maintenant, onClose }: { groupe: GroupeRelance; maintenant: number; onClose: () => void }) {
  const confirmer = useConfirmerPaiementRelance();
  const paniers = paniersAPayerEnLigne(groupe);
  // Serveur plus ancien : signal absent.
  const signale = groupe.signaux.paiement_signale ?? null;
  const parDefaut = panierAConfirmerParDefaut(groupe);
  const [panierId, setPanierId] = useState(parDefaut?.id ?? "");
  const [transaction, setTransaction] = useState(
    signale && signale.order_id === parDefaut?.id ? signale.transaction_id : "",
  );
  const [erreur, setErreur] = useState<string | null>(null);

  const panier = paniers.find((b) => b.id === panierId) ?? null;
  const enCours = confirmer.isPending;
  const refus = erreur ?? (confirmer.error ? messageErreurConfirmation(confirmer.error) : null);

  const effacerRefus = () => {
    setErreur(null);
    if (confirmer.error) confirmer.reset();
  };

  // La transaction signalée suit son panier : choisie avec lui, retirée sans lui.
  const choisir = (id: string) => {
    setPanierId(id);
    effacerRefus();
    if (!signale) return;
    if (id === signale.order_id && !transaction.trim()) setTransaction(signale.transaction_id);
    else if (id !== signale.order_id && transaction.trim() === signale.transaction_id) setTransaction("");
  };

  const valider = () => {
    const identifiant = transaction.trim();
    if (!panier) {
      setErreur("Choisissez le panier que le client a payé.");
      return;
    }
    if (!TRANSACTION_KKIAPAY.test(identifiant)) {
      setErreur(MESSAGE_TRANSACTION_ILLISIBLE);
      return;
    }
    effacerRefus();
    confirmer.mutate({ orderId: panier.id, dto: { transaction_id: identifiant } }, { onSuccess: onClose });
  };

  const fermer = () => {
    if (!enCours) onClose();
  };

  return (
    <Modal isOpen onClose={fermer} title="Confirmer le paiement ?">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          valider();
        }}
      >
        <p className="text-sm text-gray-600 leading-relaxed">
          KKiaPay est interrogé avant toute confirmation : la commande n&apos;est confirmée que si ce paiement a réussi
          et couvre son montant. Elle part alors au restaurant, et le client est prévenu.
        </p>

        {signale ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm text-emerald-900">
            <p className="flex items-start gap-2 font-semibold">
              <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Paiement signalé par KKiaPay {aLHeure(signale.le, maintenant)} pour {signale.reference}
                {typeof signale.montant === "number" ? ` : ${fmtMontant(signale.montant)}` : ""}
                {signale.moyen ? ` par ${LIBELLE_MOYEN[signale.moyen] ?? signale.moyen}` : ""}.
              </span>
            </p>
            {signale.motif && (
              <p className="mt-1 pl-6 text-xs text-emerald-800">Resté sans confirmation : {signale.motif}</p>
            )}
          </div>
        ) : (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm text-amber-900 leading-relaxed">
            Aucun paiement n&apos;a été signalé pour ce client. Demandez-lui s&apos;il a bien été débité, puis
            saisissez l&apos;identifiant de la transaction : il figure sur la fiche de la transaction, dans le tableau de
            bord KKiaPay. À défaut, prévenez un administrateur.
          </p>
        )}

        {paniers.length > 1 ? (
          <fieldset className="space-y-2">
            <legend className="text-xs font-semibold text-gray-500 mb-1.5">Panier payé</legend>
            {paniers.map((b) => (
              <label
                key={b.id}
                className={`flex items-center gap-3 rounded-xl border px-3.5 py-2.5 cursor-pointer transition-colors ${
                  panierId === b.id ? "border-[#F17922] bg-orange-50" : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <input
                  type="radio"
                  name="panier-paye"
                  value={b.id}
                  checked={panierId === b.id}
                  onChange={() => choisir(b.id)}
                  disabled={enCours}
                  className="accent-[#F17922]"
                />
                <span className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-x-3 text-sm">
                  <span className="font-mono text-gray-800">{b.reference}</span>
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {fmtMontant(b.amount)}, {depuis(b.created_at, maintenant)}
                  </span>
                </span>
              </label>
            ))}
          </fieldset>
        ) : (
          panier && (
            <p className="text-sm text-gray-500">
              <span className="font-mono text-gray-700">{panier.reference}</span>, {fmtMontant(panier.amount)},{" "}
              {panier.client_nom}
            </p>
          )
        )}

        <div>
          <label htmlFor="transaction-kkiapay" className="text-xs font-semibold text-gray-500 mb-1.5 block">
            Identifiant de la transaction KKiaPay
          </label>
          <input
            id="transaction-kkiapay"
            type="text"
            value={transaction}
            onChange={(e) => {
              setTransaction(e.target.value);
              effacerRefus();
            }}
            autoComplete="off"
            spellCheck={false}
            maxLength={80}
            disabled={enCours}
            autoFocus={!transaction}
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 font-mono text-sm text-gray-800 focus:outline-none focus:border-[#F17922] disabled:opacity-50"
          />
        </div>

        {refus && (
          <p role="alert" className="text-sm text-red-600">
            {refus}
          </p>
        )}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={fermer}
            disabled={enCours}
            className="h-11 sm:h-10 px-4 rounded-xl border border-gray-300 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={enCours || !panier}
            className="h-11 sm:h-10 px-4 rounded-xl bg-[#F17922] text-sm font-semibold text-white hover:bg-[#e06816] disabled:opacity-50 cursor-pointer inline-flex items-center justify-center gap-2"
          >
            {enCours && <Loader2 className="w-4 h-4 animate-spin" />}
            {enCours ? "Vérification auprès de KKiaPay…" : "Confirmer le paiement"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

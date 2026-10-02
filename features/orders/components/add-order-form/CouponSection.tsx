"use client";

import React, { useState } from "react";
import { BadgeCheck, CircleAlert, Info, Loader2, Lock, TicketPercent, Undo2, Wallet, X } from "lucide-react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { CouponCommande, LONGUEUR_MAX_CODE } from "../../hooks/useCouponCommande";
import { formaterEcheance, formaterFrancs, phraseReduction } from "../../utils/couponFormat";

const INPUT_CLASS =
  "w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 pr-9 text-[13px] font-semibold uppercase tracking-wide text-[#595959] placeholder:font-normal placeholder:normal-case placeholder:tracking-normal placeholder:text-gray-400 focus:outline-none focus:border-[#F17922] focus:ring-2 focus:ring-[#F17922]/15 transition disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400";

const EnTete = ({ sousTitre }: { sousTitre: string }) => (
  <div className="flex items-center gap-2.5">
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-[#F17922]">
      <TicketPercent className="w-4 h-4" />
    </span>
    <div>
      <h3 className="text-[15px] font-bold text-gray-800">Réduction</h3>
      <p className="text-xs text-gray-400">{sousTitre}</p>
    </div>
  </div>
);

interface CouponSectionProps {
  coupon: CouponCommande;
  /** Total à payer une fois la réduction déduite (articles remisés + livraison). */
  totalApresRemise: number;
  /**
   * Commande en cours d'envoi : le code est déjà parti. « Retirer » ne
   * l'enlèverait plus de la commande, il ne ferait que le cacher à l'écran.
   */
  verrouille?: boolean;
  /**
   * Modification : le coupon en place sera rendu au client à l'enregistrement.
   * La carte le rappelle au-dessus de la saisie d'un éventuel remplaçant.
   */
  retraitPrevu?: { code: string | null; remise: number; annuler: () => void };
}

/**
 * Carte « Réduction » : un code promo OU un bon d'achat par commande. Tout
 * montant affiché ici vient du serveur ; l'écran ne calcule aucune remise.
 */
const CouponSection: React.FC<CouponSectionProps> = ({
  coupon,
  totalApresRemise,
  verrouille = false,
  retraitPrevu,
}) => {
  const { saisie, changerSaisie, etat, aide, contexteValide, aJour, bons, verifier, retirer } = coupon;

  const enVerification = etat.statut === "verification";
  // Bandeau : réduction obtenue, ou en cours de revérification après un changement.
  const apercuBandeau =
    etat.statut === "applique" ? etat.apercu : enVerification ? etat.precedent : undefined;

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Entrée dans le champ vérifie le code : elle n'enregistre pas la commande.
    if (e.key === "Enter") {
      e.preventDefault();
      if (!verrouille) verifier();
    }
  };

  const BOUTON_RETIRER =
    "shrink-0 rounded-lg border bg-white px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="space-y-4">
      <EnTete
        sousTitre={
          retraitPrevu
            ? "Le coupon sera retiré à l'enregistrement. Vous pouvez en appliquer un autre."
            : "Code promo ou bon d'achat dicté par le client, vérifié par le serveur."
        }
      />

      {retraitPrevu && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3">
          <Undo2 className="mt-0.5 w-4 h-4 shrink-0 text-amber-500" />
          <div className="flex-1 space-y-0.5">
            <p className="text-[13px] font-semibold text-amber-800">
              Retrait prévu :{" "}
              {retraitPrevu.code ? `code ${retraitPrevu.code}, ` : ""}−{formaterFrancs(retraitPrevu.remise)}
            </p>
            <p className="text-xs text-amber-700">
              Le bon ou le code sera rendu au client à l'enregistrement.
            </p>
          </div>
          <button
            type="button"
            onClick={retraitPrevu.annuler}
            disabled={verrouille}
            className={`${BOUTON_RETIRER} border-amber-300 text-amber-700 hover:bg-amber-100`}
          >
            Annuler le retrait
          </button>
        </div>
      )}

      {apercuBandeau ? (
        aJour ? (
          <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-3.5 py-3">
            <BadgeCheck className="mt-0.5 w-4 h-4 shrink-0 text-green-600" />
            <div className="flex-1 space-y-0.5">
              <p className="text-[13px] font-semibold text-green-800">{phraseReduction(apercuBandeau)}</p>
              <p className="text-xs text-green-700">
                Nouveau total à payer :{" "}
                <span className="font-semibold">{formaterFrancs(totalApresRemise)}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={retirer}
              disabled={verrouille}
              className={`${BOUTON_RETIRER} border-green-300 text-green-700 hover:bg-green-100`}
            >
              Retirer
            </button>
          </div>
        ) : (
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3">
            {contexteValide ? (
              <Loader2 className="mt-0.5 w-4 h-4 shrink-0 animate-spin text-amber-500" />
            ) : (
              <Info className="mt-0.5 w-4 h-4 shrink-0 text-amber-500" />
            )}
            <div className="flex-1 space-y-0.5">
              <p className="text-[13px] font-semibold text-amber-800">
                {contexteValide
                  ? "Panier modifié, nouvelle vérification"
                  : `Réduction suspendue. ${aide ?? ""}`}
              </p>
              <p className="text-xs text-amber-700">
                {apercuBandeau.type === "VOUCHER" ? "Bon" : "Code"} {apercuBandeau.code} : la
                réduction sera recalculée par le serveur.
              </p>
            </div>
            <button
              type="button"
              onClick={retirer}
              disabled={verrouille}
              className={`${BOUTON_RETIRER} border-amber-300 text-amber-700 hover:bg-amber-100`}
            >
              Retirer
            </button>
          </div>
        )
      ) : (
        <div className="space-y-2">
          <label htmlFor="code-reduction" className="text-xs font-semibold text-gray-500">
            Code promo ou bon
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <input
                id="code-reduction"
                type="text"
                value={saisie}
                onChange={(e) => changerSaisie(e.target.value)}
                onKeyDown={onKeyDown}
                maxLength={LONGUEUR_MAX_CODE}
                disabled={!contexteValide || enVerification || verrouille}
                autoComplete="off"
                spellCheck={false}
                placeholder="Saisissez le code dicté par le client"
                aria-invalid={etat.statut === "erreur"}
                aria-describedby="code-reduction-message"
                className={INPUT_CLASS}
              />
              {/* Reste accessible pendant une vérification : l'agent peut
                  l'abandonner et enregistrer la commande sans réduction. */}
              {saisie && !verrouille && (
                <button
                  type="button"
                  onClick={retirer}
                  aria-label={enVerification ? "Abandonner la vérification" : "Effacer le code"}
                  title={enVerification ? "Abandonner la vérification" : "Effacer le code"}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={verifier}
              disabled={!contexteValide || enVerification || verrouille || !saisie.trim()}
              className="inline-flex h-[42px] min-w-[120px] items-center justify-center gap-2 rounded-xl bg-[#F17922] px-5 text-[13px] font-semibold text-white transition hover:bg-[#F17922]/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {enVerification ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Vérification...
                </>
              ) : (
                "Vérifier"
              )}
            </button>
          </div>

          <div id="code-reduction-message" aria-live="polite">
            {etat.statut === "erreur" ? (
              <p role="alert" className="flex items-start gap-1.5 text-xs font-medium text-red-600">
                <CircleAlert className="mt-px w-3.5 h-3.5 shrink-0" />
                {etat.message}
              </p>
            ) : aide ? (
              <p className="flex items-start gap-1.5 text-xs text-gray-400">
                <Info className="mt-px w-3.5 h-3.5 shrink-0" />
                {aide}
              </p>
            ) : null}
          </div>
        </div>
      )}

      {/* Bons du client : code masqué (le client dicte le code complet). */}
      {!apercuBandeau && contexteValide && bons.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500">
            <span className="font-semibold">
              {bons.length > 1 ? `Ce client a ${bons.length} bons.` : "Ce client a un bon."}
            </span>{" "}
            Demandez-lui le code complet.
          </p>
          <ul className="flex flex-wrap gap-2">
            {bons.map((bon) => (
              <li
                key={bon.id}
                className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs text-[#595959]"
              >
                <Wallet className="w-3.5 h-3.5 text-[#F17922]" />
                <span className="font-mono font-semibold tracking-wide">{bon.code_masque}</span>
                <span className="text-gray-400">·</span>
                <span className="font-semibold">{formaterFrancs(bon.solde)}</span>
                <span className="text-gray-400">·</span>
                <span>{formaterEcheance(bon.expire_le)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

interface CouponLectureSeuleProps {
  code: string | null;
  remise: number;
  /** Sous-total actuel des articles : sous la réduction, le serveur refuse la mise à jour. */
  sousTotal?: number;
  /**
   * Pourquoi la réduction ne peut pas changer (commande payée, points...).
   * Affiché aux rôles qui pourraient autrement appliquer un coupon.
   */
  motif?: string | null;
  /** Retrait possible : ouvre une courte confirmation, puis prévient le parent. */
  onRetirer?: () => void;
  /** Enregistrement en cours : plus de changement. */
  verrouille?: boolean;
}

/**
 * Modification d'une commande : la réduction en place. Retirable quand le
 * parent le permet (`onRetirer`), figée sinon. Les refus du serveur (409)
 * connus d'avance sont annoncés ici, avant l'envoi.
 */
export const CouponLectureSeule: React.FC<CouponLectureSeuleProps> = ({
  code,
  remise,
  sousTotal,
  motif,
  onRetirer,
  verrouille = false,
}) => {
  const [confirmation, setConfirmation] = useState(false);
  const panierTropBas = remise > 0 && sousTotal !== undefined && sousTotal < remise;
  const retirable = !!onRetirer;
  return (
    <div className="space-y-4">
      <EnTete
        sousTitre={
          retirable
            ? "Appliquée à la création. Vous pouvez la retirer avant d'enregistrer."
            : "Fixée à la création de la commande."
        }
      />
      <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-3">
        <Lock className="mt-0.5 w-4 h-4 shrink-0 text-gray-400" />
        <div className="flex-1 space-y-0.5">
          <p className="text-[13px] text-gray-600">
            Réduction appliquée à la création :{" "}
            <span className="font-semibold text-gray-800">
              {code ? `Code ${code}, ` : ""}−{formaterFrancs(remise)}
            </span>
            {!retirable && " (non modifiable)"}
          </p>
          {motif && <p className="text-xs font-medium text-gray-600">{motif}</p>}
          {code && (
            <p className="text-xs text-gray-500">
              Le client de cette commande ne peut pas être changé. Pour un autre client, annulez la
              commande et créez-en une nouvelle.
            </p>
          )}
        </div>
        {retirable && (
          <button
            type="button"
            onClick={() => setConfirmation(true)}
            disabled={verrouille}
            className="shrink-0 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Retirer le coupon
          </button>
        )}
      </div>
      {retirable && (
        <ConfirmDialog
          isOpen={confirmation}
          onClose={() => setConfirmation(false)}
          onConfirm={() => {
            setConfirmation(false);
            onRetirer();
          }}
          title="Retirer le coupon ?"
          description="Le bon ou le code sera rendu au client à l'enregistrement."
          confirmLabel="Retirer"
        />
      )}
      {panierTropBas && (
        <p role="alert" className="flex items-start gap-1.5 text-xs font-medium text-red-600">
          <CircleAlert className="mt-px w-3.5 h-3.5 shrink-0" />
          Les articles ({formaterFrancs(sousTotal ?? 0)}) ne couvrent plus la réduction : la mise à jour
          sera refusée. Ajoutez des articles, ou annulez la commande et créez-en une nouvelle.
        </p>
      )}
    </div>
  );
};

/**
 * Modification d'une commande sans réduction sur laquelle on ne peut plus en
 * appliquer (commande payée) : la carte reste visible et dit pourquoi.
 */
export const CouponIndisponible: React.FC<{ motif: string }> = ({ motif }) => (
  <div className="space-y-4">
    <EnTete sousTitre="Aucune réduction sur cette commande." />
    <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-3">
      <Lock className="mt-0.5 w-4 h-4 shrink-0 text-gray-400" />
      <p className="text-[13px] text-gray-600">{motif}</p>
    </div>
  </div>
);

export default CouponSection;

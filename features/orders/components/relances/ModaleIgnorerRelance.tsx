"use client";

import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { RAISON_TEXTE_MAX, RAISONS_IGNORER } from "../../constantes/relance.constante";
import { useAnnulerRelance, useIgnorerRelance } from "../../queries/relance.mutation";
import { ignorerRelanceSchema } from "../../schemas/ignorer-relance.schema";
import { GroupeRelance, IgnorerRelanceDTO, RaisonIgnorer } from "../../types/relance.types";

interface Props {
  groupe: GroupeRelance | null;
  /**
   * `ignorer` (par défaut) : tout le groupe sort des alertes.
   * `annuler` : commande du site à payer à la livraison, à confirmer ; seule
   * la tête est annulée, avec une raison de la même liste.
   */
  mode?: "ignorer" | "annuler";
  onClose: () => void;
}

/**
 * « Ignorer cette commande ? » : la relance sort des alertes de TOUTE
 * l'équipe, avec le nom de l'agent et une raison courte. Elle reste
 * visible dans « Ignorées », d'où on peut la rétablir. Ignorer ne supprime
 * jamais la commande.
 *
 * « Annuler cette commande ? » : la commande à confirmer que le client ne
 * veut plus (ou qu'on ne joint pas) est annulée pour de bon. Le client le
 * voit dans son suivi ; le serveur lui rend le bon, le code et les cadeaux.
 */
export function ModaleIgnorerRelance({ groupe, mode = "ignorer", onClose }: Props) {
  const ignorer = useIgnorerRelance();
  const annuler = useAnnulerRelance();
  const [raison, setRaison] = useState<RaisonIgnorer | "">("");
  const [texte, setTexte] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);

  // Nouvelle commande, nouveau choix : rien ne reste de la précédente.
  useEffect(() => {
    setRaison("");
    setTexte("");
    setErreur(null);
  }, [groupe?.cle, mode]);

  if (!groupe) return null;
  const paniers = 1 + groupe.autres.length;
  const annulation = mode === "annuler";
  const enCours = ignorer.isPending || annuler.isPending;

  const valider = () => {
    const r = ignorerRelanceSchema.safeParse({ raison_code: raison || undefined, raison_texte: texte });
    if (!r.success) {
      setErreur(r.error.issues[0]?.message ?? "Choisissez une raison.");
      return;
    }
    setErreur(null);
    // Le schéma garantit la raison ; sans `strict`, zod la type quand même facultative.
    const dto = r.data as IgnorerRelanceDTO;
    // Annulation : sur la tête seulement, la commande à confirmer.
    if (annulation) annuler.mutate({ orderId: groupe.cle, dto }, { onSuccess: onClose });
    else ignorer.mutate({ orderId: groupe.cle, dto }, { onSuccess: onClose });
  };

  const fermer = () => {
    if (!enCours) onClose();
  };

  return (
    <Modal isOpen={!!groupe} onClose={fermer} title={annulation ? "Annuler cette commande ?" : "Ignorer cette commande ?"}>
      <div className="space-y-4">
        <div className="text-sm text-gray-600 leading-relaxed">
          {annulation ? (
            <>
              <p>Le client est prévenu dans son suivi. Le bon, le code et les cadeaux lui sont rendus.</p>
              {paniers > 1 && <p className="mt-1">Les autres paniers de ce client restent dans la liste.</p>}
            </>
          ) : (
            <>
              <p>Elle sortira des alertes de toute l&apos;équipe. Vous pourrez la rétablir.</p>
              {paniers > 1 && <p className="mt-1">Les {paniers} paniers de ce client seront ignorés.</p>}
            </>
          )}
          <p className="mt-2 text-gray-500">
            {groupe.tete.reference}, {groupe.tete.client_nom}
          </p>
        </div>

        <fieldset className="space-y-2">
          <legend className="text-xs font-semibold text-gray-500 mb-1.5">Raison</legend>
          {RAISONS_IGNORER.map((r) => (
            <label
              key={r.code}
              className={`flex items-center gap-3 rounded-xl border px-3.5 py-2.5 cursor-pointer transition-colors ${
                raison === r.code ? "border-[#F17922] bg-orange-50" : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              <input
                type="radio"
                name="raison-ignorer"
                value={r.code}
                checked={raison === r.code}
                onChange={() => {
                  setRaison(r.code);
                  setErreur(null);
                }}
                className="accent-[#F17922]"
              />
              <span className="text-sm text-gray-800">{r.libelle}</span>
            </label>
          ))}
        </fieldset>

        {raison === "AUTRE" && (
          <div>
            <label htmlFor="raison-texte" className="text-xs font-semibold text-gray-500 mb-1.5 block">
              Précisez ({RAISON_TEXTE_MAX} caractères au plus)
            </label>
            <textarea
              id="raison-texte"
              value={texte}
              maxLength={RAISON_TEXTE_MAX}
              rows={2}
              onChange={(e) => {
                setTexte(e.target.value);
                setErreur(null);
              }}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#F17922]"
            />
            <p className="mt-1 text-right text-[11px] text-gray-400">
              {texte.length} / {RAISON_TEXTE_MAX}
            </p>
          </div>
        )}

        {erreur && <p className="text-sm text-red-600">{erreur}</p>}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={fermer}
            disabled={enCours}
            className="h-11 sm:h-10 px-4 rounded-xl border border-gray-300 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
          >
            {/* « Annuler » à côté d'« Annuler la commande » prêterait à confusion. */}
            {annulation ? "Retour" : "Annuler"}
          </button>
          <button
            type="button"
            onClick={valider}
            disabled={enCours}
            className={`h-11 sm:h-10 px-4 rounded-xl text-sm font-semibold text-white disabled:opacity-50 cursor-pointer inline-flex items-center justify-center gap-2 ${
              annulation ? "bg-red-600 hover:bg-red-700" : "bg-[#F17922] hover:bg-[#e06816]"
            }`}
          >
            {enCours && <Loader2 className="w-4 h-4 animate-spin" />}
            {annulation ? "Annuler la commande" : "Ignorer"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

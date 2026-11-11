"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Loader2, Search } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { useSignalerIncidentMutation } from "../queries/incident.mutation";
import { useIncidentsCommandeQuery, useRechercheCommandesQuery, useReglagesIncidentsQuery } from "../queries/incident.query";
import { useIncidentsUi } from "../stores/incident-ui.store";
import type { ContexteCommande, DemandeSignalement, IncidentGravite, IncidentOrigine } from "../types/incident.types";
import {
  DESCRIPTION_MAX,
  GRAVITES,
  LIBELLE_GRAVITE,
  LIBELLE_ORIGINE,
  LIBELLE_POLE,
  LIBELLE_STATUT,
  LIBELLE_TYPE_COMMANDE,
  ORIGINES_SAISIES,
  doublonOuvert,
  estDoublon,
  formatJourHeure,
  formatMontant,
  manqueAuSignalement,
  messageErreurIncident,
  origineImposee,
} from "../utils/incident";
import { Choix, Zone, classeChamp } from "./Elements";

/** La commande choisie, en une ligne. */
function ResumeCommande({ commande, onChanger }: { commande: ContexteCommande; onChanger?: () => void }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg bg-[#FBF8F5] px-3 py-2.5">
      <div className="min-w-0 text-[13px]">
        <p className="font-semibold text-gray-900">
          {commande.reference} · {formatMontant(commande.montant)}
        </p>
        <p className="truncate text-gray-600">
          {commande.client.nom} · {commande.restaurant.name} · {LIBELLE_TYPE_COMMANDE[commande.type] ?? ""} ·{" "}
          {formatJourHeure(commande.created_at)}
        </p>
      </div>
      {onChanger && (
        <button type="button" onClick={onChanger} className="shrink-0 text-[13px] font-semibold text-[#F17922] hover:underline">
          Changer
        </button>
      )}
    </div>
  );
}

/** Recherche de la commande à signaler : référence, nom ou téléphone. */
function ChoixCommande({ onChoisir }: { onChoisir: (id: string) => void }) {
  const [saisie, setSaisie] = useState("");
  const [recherche, setRecherche] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setRecherche(saisie.trim()), 300);
    return () => clearTimeout(t);
  }, [saisie]);
  const { data, isFetching, isError } = useRechercheCommandesQuery(recherche);

  return (
    <div className="flex flex-col gap-2">
      <label className="relative block">
        <span className="mb-1.5 block text-xs font-semibold text-gray-600">Commande</span>
        <Search className="pointer-events-none absolute bottom-2.5 left-3 h-4 w-4 text-gray-400" />
        <input
          type="search"
          autoFocus
          value={saisie}
          onChange={(e) => setSaisie(e.target.value)}
          placeholder="Référence, nom ou téléphone du client"
          className={`${classeChamp} pl-9`}
        />
      </label>
      {recherche.length >= 2 && (
        <div className="max-h-56 overflow-y-auto rounded-lg border border-gray-100">
          {isFetching && !data ? (
            <p className="flex items-center gap-2 px-3 py-3 text-[13px] text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin text-[#F17922]" />
              Recherche…
            </p>
          ) : isError ? (
            <p className="px-3 py-3 text-[13px] text-rose-700">La recherche a échoué. Réessayez.</p>
          ) : !data || data.length === 0 ? (
            <p className="px-3 py-3 text-[13px] text-gray-500">Aucune commande des 60 derniers jours ne correspond.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {data.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => onChoisir(c.id)}
                    className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-[13px] hover:bg-orange-50"
                  >
                    <span className="font-semibold text-gray-900">
                      {c.reference} · {formatMontant(c.montant)}
                    </span>
                    <span className="text-gray-600">
                      {c.client.nom} · {c.restaurant.name} · {formatJourHeure(c.created_at)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * « SIGNALER UN INCIDENT » : la même fenêtre depuis le tiroir d'une commande,
 * un ticket, un retour privé, une note après commande ou l'onglet Incidents.
 *
 * La commande est donnée par l'écran d'où l'on vient, sinon cherchée ici.
 * Catégorie, gravité, origine (imposée quand le signalement vient d'un
 * ticket, d'un avis ou d'une note), description. Un incident déjà ouvert
 * pour cette commande et cette catégorie : on propose de l'ouvrir au lieu
 * d'en créer un second.
 *
 * Montée avec `key` par demande : chaque ouverture repart d'une fenêtre neuve.
 */
export function SignalerIncident({ demande, onFermer }: { demande: DemandeSignalement; onFermer: () => void }) {
  const ouvrirFiche = useIncidentsUi((s) => s.ouvrirFiche);
  const [orderId, setOrderId] = useState(demande.orderId ?? "");
  const [categorieId, setCategorieId] = useState("");
  const [gravite, setGravite] = useState<IncidentGravite | "">(demande.gravite ?? "");
  const [origine, setOrigine] = useState<IncidentOrigine | "">("");
  const [description, setDescription] = useState(demande.description ?? "");

  const imposee = origineImposee(demande);
  const { data: reglages, isLoading: reglagesEnCours } = useReglagesIncidentsQuery();
  const commandeQuery = useIncidentsCommandeQuery(orderId || null);
  const signaler = useSignalerIncidentMutation();

  const categories = useMemo(() => (reglages?.categories ?? []).filter((c) => c.actif), [reglages]);
  const categorie = categories.find((c) => c.id === categorieId) ?? null;
  const commande = commandeQuery.data?.commande ?? null;
  const dejaSignales = commandeQuery.data?.incidents ?? [];
  const doublon = doublonOuvert(dejaSignales, categorieId);
  const autres = dejaSignales.filter((i) => i.statut !== "CLOTURE" && i.id !== doublon?.id);
  const interdit = commandeQuery.data ? !commandeQuery.data.peut_signaler : false;

  const manque = manqueAuSignalement({ orderId, categorieId, gravite, origine, description }, imposee);
  const peutEnvoyer = !manque && !doublon && !interdit && !signaler.isPending;

  const ouvrir = (id: string) => {
    onFermer();
    ouvrirFiche(id);
  };

  const envoyer = () => {
    if (!peutEnvoyer || !gravite) return;
    signaler.mutate(
      {
        order_id: orderId,
        categorie_id: categorieId,
        gravite,
        description: description.trim(),
        ...(imposee ? {} : { origine: origine || undefined }),
        ...(demande.ticketId && { ticket_id: demande.ticketId }),
        ...(demande.avisId && { avis_id: demande.avisId }),
        ...(demande.commentId && { comment_id: demande.commentId }),
      },
      {
        onSuccess: (fiche) => {
          onFermer();
          // Qui peut le traiter enchaîne sur la fiche ; les autres reprennent leur écran.
          if (fiche.droits.prendre || fiche.droits.resoudre) ouvrirFiche(fiche.id);
        },
      },
    );
  };

  return (
    <Modal isOpen onClose={onFermer} title="Signaler un incident">
      <div className="flex flex-col gap-4">
        {!orderId ? (
          <ChoixCommande onChoisir={setOrderId} />
        ) : commandeQuery.isError ? (
          <p className="rounded-lg bg-rose-50 px-3 py-2.5 text-[13px] text-rose-700">
            {messageErreurIncident(commandeQuery.error, "Cette commande ne peut pas être lue.")}
          </p>
        ) : !commande ? (
          <p className="flex items-center gap-2 text-[13px] text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin text-[#F17922]" />
            Lecture de la commande…
          </p>
        ) : (
          <ResumeCommande commande={commande} onChanger={demande.orderId ? undefined : () => setOrderId("")} />
        )}

        {orderId && commande && (
          <>
            {interdit && (
              <p className="rounded-lg bg-amber-50 px-3 py-2.5 text-[13px] text-amber-800">
                Vous ne pouvez pas signaler d&apos;incident sur cette commande.
              </p>
            )}

            {autres.length > 0 && (
              <div className="rounded-lg border border-gray-100 px-3 py-2.5 text-[13px] text-gray-600">
                Déjà signalé sur cette commande :
                <ul className="mt-1 flex flex-col gap-0.5">
                  {autres.map((i) => (
                    <li key={i.id}>
                      <button type="button" onClick={() => ouvrir(i.id)} className="font-semibold text-[#F17922] hover:underline">
                        {i.categorie.nom}
                      </button>{" "}
                      ({LIBELLE_STATUT[i.statut].toLowerCase()})
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-gray-600">Catégorie</span>
              <select
                value={categorieId}
                onChange={(e) => setCategorieId(e.target.value)}
                disabled={reglagesEnCours}
                className={`${classeChamp} cursor-pointer`}
              >
                <option value="">Choisir</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom}
                  </option>
                ))}
              </select>
              {categorie && (
                <span className="text-xs text-gray-500">
                  Responsable : {LIBELLE_POLE[categorie.pole]} · à résoudre sous {categorie.delai_heures} h
                </span>
              )}
            </label>

            {doublon ? (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-[13px] text-amber-900">
                <span>
                  Un incident est déjà ouvert pour cette commande et cette catégorie : <strong>{doublon.code}</strong>.
                </span>
                <button
                  type="button"
                  onClick={() => ouvrir(doublon.id)}
                  className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 font-semibold hover:bg-amber-100"
                >
                  Ouvrir l&apos;incident
                </button>
              </div>
            ) : (
              <>
                <Choix<IncidentGravite>
                  label="Gravité"
                  valeur={gravite}
                  onChange={setGravite}
                  options={GRAVITES.map((g) => ({ valeur: g, libelle: LIBELLE_GRAVITE[g] }))}
                />
                {imposee ? (
                  <p className="text-[13px] text-gray-600">
                    Origine : <span className="font-semibold text-gray-900">{LIBELLE_ORIGINE[imposee]}</span>
                  </p>
                ) : (
                  <Choix<IncidentOrigine>
                    label="Origine du signalement"
                    valeur={origine}
                    onChange={setOrigine}
                    options={ORIGINES_SAISIES.map((o) => ({ valeur: o, libelle: LIBELLE_ORIGINE[o] }))}
                  />
                )}
                <Zone
                  label="Description"
                  valeur={description}
                  onChange={setDescription}
                  placeholder="Ce que le client dit, ou ce que vous avez constaté"
                  max={DESCRIPTION_MAX}
                  lignes={4}
                />
              </>
            )}
          </>
        )}

        {signaler.isError && estDoublon(signaler.error) && !doublon && (
          <p className="rounded-lg bg-amber-50 px-3 py-2.5 text-[13px] text-amber-900">
            Un collègue vient de signaler le même incident. Il apparaît dans la liste ci-dessus.
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-gray-500">{orderId && commande && !doublon && !interdit ? (manque ?? "") : ""}</span>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onFermer}
              className="h-10 rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={envoyer}
              disabled={!peutEnvoyer}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#F17922] px-4 text-sm font-semibold text-white hover:bg-[#e06a15] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {signaler.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Signaler l&apos;incident
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

"use client";

import React from "react";
import { Bike, Check, Phone, Timer } from "lucide-react";

import BoutonAppelerLivreur from "../../../calls/components/BoutonAppelerLivreur";
import { detailLivreur, livreurAAppeler } from "../../../calls/utils/appel-livreur";
import { useLivraisonCommandeQuery } from "../../queries/livraison-commande.query";
import {
  etatLivraison,
  libelleService,
  lignesFrise,
  livreurAffiche,
  sectionAAfficher,
  texteArret,
  texteTotal,
  type LigneFrise,
  type TonEtat,
} from "../../utils/suivi-livraison";

interface Props {
  commande: { id: string; type?: string | null; status?: string | null };
}

const TONS: Record<TonEtat, string> = {
  ambre: "bg-amber-50 text-amber-800 border-amber-200",
  bleu: "bg-blue-50 text-blue-700 border-blue-200",
  vert: "bg-green-50 text-green-700 border-green-200",
  rouge: "bg-red-50 text-red-700 border-red-200",
};

/**
 * Section « Livraison » de l'onglet Détails (demande du 24/10), sous la
 * progression, pour toute commande à livrer :
 *  - service, référence de la course et « Arrêt 2 sur 3 » s'il y a
 *    plusieurs commandes ;
 *  - livreur (nom, téléphone à appeler) et son état en une étiquette ;
 *    bouton « Appeler » pour l'appeler dans son appli (service client et
 *    admin, livreur Chicken Nation seulement) ;
 *  - frise verticale : une ligne par étape avec son heure, et entre deux
 *    étapes la durée (trajet vers le restaurant, attente au comptoir, trajet
 *    vers le client) ; étape en cours mise en avant, étapes à venir en gris
 *    avec l'heure prévue si le serveur la connaît ;
 *  - « Prête → livrée : 28 min » une fois livrée.
 *
 * Données : `GET /orders/:id/livraison`, relu en direct (socket) et toutes
 * les 20 s tant que la livraison n'est pas finie. Serveur pas encore à jour
 * ou erreur : la section ne s'affiche pas. Textes : `utils/suivi-livraison.ts`.
 */
export function SectionLivraison({ commande }: Props) {
  const aLivrer = commande.type === "DELIVERY";
  const { data: livraison } = useLivraisonCommandeQuery(commande.id, aLivrer);
  if (!aLivrer || !sectionAAfficher(livraison, commande.status)) return null;

  const service = libelleService(livraison.service);
  const course = livraison.course;
  const arret = course ? texteArret(course.rang_arret, course.nombre_commandes) : null;
  const etat = etatLivraison(livraison);
  const livreur = livreurAffiche(livraison);
  // Livreur Chicken Nation sur la commande : on peut l'appeler dans son appli.
  const aAppeler = livreurAAppeler(livraison);
  const lignes = lignesFrise(livraison);
  const total = texteTotal(livraison);

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 md:p-6">
      <div className="flex items-center gap-2.5 mb-4">
        <span className="w-8 h-8 rounded-xl bg-[#FFF0E4] text-[#F17922] flex items-center justify-center">
          <Bike className="w-4 h-4" />
        </span>
        <div className="min-w-0">
          <h3 className="text-[15px] font-bold text-gray-900">Livraison</h3>
          {(course?.reference || arret) && (
            <p className="text-[11px] text-gray-500 truncate">
              {course?.reference && <span className="font-mono font-semibold text-gray-700">{course.reference}</span>}
              {course?.reference && arret ? " · " : ""}
              {arret && <span className="font-semibold text-[#F17922]">{arret}</span>}
            </p>
          )}
        </div>
        {service && (
          <span className="ml-auto shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full border bg-gray-100 text-gray-700 border-gray-200">
            {service}
          </span>
        )}
      </div>

      {/* Livreur et son état */}
      <div className="flex items-center gap-3 rounded-2xl bg-gray-50 border border-gray-100 p-3">
        <div
          className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
            livreur ? "bg-gradient-to-br from-[#F17922] to-amber-500 text-white" : "bg-gray-200 text-gray-400"
          }`}
        >
          <Bike className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          {livreur ? (
            <>
              <p className="text-sm font-bold text-gray-900 truncate">{livreur.nom}</p>
              {livreur.telephone &&
                (livreur.lienAppel ? (
                  <a
                    href={livreur.lienAppel}
                    className="inline-flex items-center gap-1.5 text-xs text-[#F17922] font-semibold hover:underline"
                  >
                    <Phone className="w-3.5 h-3.5" /> {livreur.telephone}
                  </a>
                ) : (
                  <p className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                    <Phone className="w-3.5 h-3.5" /> {livreur.telephone}
                  </p>
                ))}
            </>
          ) : (
            <p className="text-sm font-semibold text-gray-700">{etat?.libelle ?? "Pas encore de livreur"}</p>
          )}
        </div>
        {(livreur && etat) || aAppeler ? (
          <div className="shrink-0 flex flex-col items-end gap-1.5">
            {livreur && etat && (
              <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${TONS[etat.ton]}`}>
                {etat.libelle}
              </span>
            )}
            {aAppeler && (
              <BoutonAppelerLivreur
                delivererId={aAppeler.delivererId}
                nom={livreur?.nom ?? aAppeler.nom}
                detail={detailLivreur(null, course?.reference)}
              />
            )}
          </div>
        ) : null}
      </div>

      {/* Frise des étapes */}
      {lignes.length > 0 && (
        <ol className="mt-5">
          {lignes.map((ligne, i) => (
            <Etape key={ligne.cle} ligne={ligne} suivante={lignes[i + 1] ?? null} />
          ))}
        </ol>
      )}

      {total && (
        <p className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-1.5 text-sm font-bold text-gray-900">
          <Timer className="w-4 h-4 text-[#F17922]" />
          {total}
        </p>
      )}
    </div>
  );
}

/**
 * Une ligne de la frise. Le trait qui la relie à la suivante porte la durée
 * de cette étape à la suivante (« 6 min de trajet »), orange une fois passée.
 */
function Etape({ ligne, suivante }: { ligne: LigneFrise; suivante: LigneFrise | null }) {
  const faite = ligne.statut === "faite";
  const enCours = ligne.statut === "en_cours";
  const heure = ligne.heure ?? ligne.prevue;
  return (
    <li className={`relative flex gap-3 ${suivante ? "pb-4" : ""}`}>
      {suivante && (
        <span
          aria-hidden
          className={`absolute left-[11px] top-6 bottom-0 w-0.5 rounded-full ${
            suivante.statut === "faite" ? "bg-[#F17922]" : "bg-gray-200"
          }`}
        />
      )}
      <span
        className={`relative z-10 mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
          faite
            ? "bg-[#F17922] text-white"
            : enCours
              ? "bg-white ring-2 ring-[#F17922]"
              : "bg-white ring-2 ring-gray-200"
        }`}
      >
        {faite ? (
          <Check className="w-3.5 h-3.5" strokeWidth={3} />
        ) : enCours ? (
          <span className="w-2.5 h-2.5 rounded-full bg-[#F17922] animate-pulse" />
        ) : null}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-3">
          <p
            className={`text-sm ${
              enCours ? "font-bold text-[#F17922]" : faite ? "font-semibold text-gray-900" : "text-gray-400"
            }`}
          >
            {ligne.libelle}
          </p>
          <p
            className={`shrink-0 text-sm tabular-nums ${
              faite && ligne.heure
                ? "font-semibold text-gray-900"
                : enCours && heure
                  ? "font-semibold text-[#F17922]"
                  : heure
                    ? "text-gray-400"
                    : "text-xs text-gray-400"
            }`}
          >
            {heure ?? (faite ? "non notée" : "")}
          </p>
        </div>
        {suivante?.duree && (
          <p className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-[11px] font-semibold text-[#C2570C]">
            <Timer className="w-3 h-3" />
            {suivante.duree}
          </p>
        )}
      </div>
    </li>
  );
}

'use client';

import { Copy, ExternalLink, MapPin, MessageCircle, Phone, UserRound, X } from 'lucide-react';
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-hot-toast';

import { useDashboardStore } from '@/store/dashboardStore';

// ⚠️ Import RELATIF entre features : `@/` pointe sur src/, `features/` est à la racine.
import BoutonAppelerLivreur from '../../calls/components/BoutonAppelerLivreur';
import { useDroitsLivraison } from '../hook/use-droits-livraison';
import { lienAppel, lienWhatsApp, telephoneLisible } from '../utils/telephone';

export interface LivreurRapide {
  id: string;
  prenom: string | null;
  nom: string | null;
  telephone: string | null;
}

/**
 * FICHE RAPIDE D'UN LIVREUR (demande du 10/11) : au clic sur son nom, une
 * petite fenêtre avec ce qui sert tout de suite, sans changer d'écran :
 *  - son numéro en grand, et de quoi l'appeler HORS de l'appli (téléphone,
 *    WhatsApp) ou copier le numéro ;
 *  - l'appel dans l'appli ;
 *  - « Voir sur la carte » et « Voir sa fiche ».
 *
 * Centrée sur grand écran, en feuille au bas de l'écran sur téléphone.
 * Fermée par la croix, Échap ou un clic à côté.
 */
export function FicheLivreurRapide({
  livreur,
  contexte,
  onFermer,
}: {
  livreur: LivreurRapide;
  /** Ligne sous le nom (« ANGRE · CRS-261110-17716 »). */
  contexte?: string | null;
  onFermer: () => void;
}) {
  const openEnDirect = useDashboardStore((s) => s.openEnDirect);
  const openLivreur = useDashboardStore((s) => s.openLivreur);
  // Carte et fiche : écrans du suivi des livraisons (un compte de restaurant ne les a pas).
  const { voirLivraison } = useDroitsLivraison();
  const nom = [livreur.prenom, livreur.nom].filter((x) => !!x && x.trim()).join(' ') || 'Livreur';
  const numero = telephoneLisible(livreur.telephone);
  const appel = lienAppel(livreur.telephone);
  const whatsapp = lienWhatsApp(livreur.telephone);

  useEffect(() => {
    const echap = (e: KeyboardEvent) => e.key === 'Escape' && onFermer();
    document.addEventListener('keydown', echap);
    return () => document.removeEventListener('keydown', echap);
  }, [onFermer]);

  const copier = async () => {
    if (!livreur.telephone) return;
    try {
      await navigator.clipboard.writeText(livreur.telephone);
      toast.success('Numéro copié');
    } catch {
      toast.error('Copie impossible : notez le numéro à la main.');
    }
  };

  if (typeof document === 'undefined') return null;
  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
      onClick={(e) => {
        e.stopPropagation();
        onFermer();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Livreur ${nom}`}
        onClick={(e) => e.stopPropagation()}
        className="w-full rounded-t-2xl bg-white p-5 shadow-2xl sm:max-w-sm sm:rounded-2xl"
      >
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange-50 text-base font-bold text-[#F17922]">
            {(livreur.prenom ?? '').trim().charAt(0).toUpperCase() || <UserRound className="h-5 w-5" />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-bold text-[#18181B]" title={nom}>
              {nom}
            </p>
            {contexte && <p className="truncate text-xs text-[#71717A]">{contexte}</p>}
          </div>
          <button
            type="button"
            onClick={onFermer}
            aria-label="Fermer"
            className="-mr-1 -mt-1 flex h-8 w-8 items-center justify-center rounded-full hover:bg-[#F4F4F5]"
          >
            <X className="h-4 w-4 text-[#52525B]" />
          </button>
        </div>

        <div className="mt-4 rounded-xl bg-[#FAFAFA] p-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[#71717A]">Téléphone</p>
          {numero ? (
            <>
              <p className="mt-0.5 select-all text-xl font-bold tabular-nums text-[#18181B]">{numero}</p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {appel && (
                  <a
                    href={appel}
                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-[#F17922] text-sm font-semibold text-white hover:opacity-90"
                  >
                    <Phone className="h-4 w-4" />
                    Appeler
                  </a>
                )}
                {whatsapp && (
                  <a
                    href={whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-[#E4E4E7] bg-white text-sm font-semibold text-[#18181B] hover:bg-[#F4F4F5]"
                  >
                    <MessageCircle className="h-4 w-4 text-[#16A34A]" />
                    WhatsApp
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => void copier()}
                  className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-[#E4E4E7] bg-white text-sm font-semibold text-[#18181B] hover:bg-[#F4F4F5]"
                >
                  <Copy className="h-4 w-4" />
                  Copier
                </button>
              </div>
            </>
          ) : (
            <p className="mt-0.5 text-sm text-[#71717A]">Aucun numéro enregistré.</p>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <BoutonAppelerLivreur delivererId={livreur.id} nom={nom} detail={contexte ?? null} />
          {voirLivraison && (
            <button
              type="button"
              onClick={() => {
                onFermer();
                openEnDirect(livreur.id);
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#E4E4E7] px-3 text-sm font-semibold text-[#18181B] hover:bg-[#F4F4F5]"
            >
              <MapPin className="h-4 w-4 text-[#F17922]" />
              Voir sur la carte
            </button>
          )}
          {voirLivraison && (
            <button
              type="button"
              onClick={() => {
                onFermer();
                openLivreur(livreur.id);
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#E4E4E7] px-3 text-sm font-semibold text-[#18181B] hover:bg-[#F4F4F5]"
            >
              <ExternalLink className="h-4 w-4 text-[#71717A]" />
              Voir sa fiche
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default FicheLivreurRapide;

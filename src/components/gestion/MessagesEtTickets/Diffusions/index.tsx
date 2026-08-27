"use client";

import React, { useMemo, useState } from 'react';
import { Megaphone, Plus, RefreshCw, Send, Users } from 'lucide-react';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { HasPermission } from '../../../../../features/users/components/HasPermission';
import { Action, Modules } from '../../../../../features/users/types/auth.type';
import CreationView from './CreationView';
import {
  useDiffusionsQuery,
  useEnvoyerDiffusionMutation,
  useReprendreDiffusionMutation,
} from '../../../../../features/message-broadcast/queries/broadcast.query';
import {
  LIBELLES_STATUT,
  type IDiffusion,
} from '../../../../../features/message-broadcast/types/broadcast.type';

const COULEUR_STATUT: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  scheduled: 'bg-blue-50 text-blue-700',
  sending: 'bg-amber-50 text-amber-800',
  sent: 'bg-green-50 text-green-700',
  failed: 'bg-red-50 text-red-700',
};

const LONGUEUR_MAX = 2000;

const dateCourte = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleString('fr-FR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

/** « 1 client recevra », « 4 clients recevront ». */
const accord = (n: number) =>
  n > 1 ? `${n} clients recevront` : `${n} client recevra`;

/**
 * LISTE DE DIFFUSION DE MESSAGES.
 *
 * Envoyer le même message à une liste de clients. Le message arrive dans le fil
 * Chicken Nation du client, pas en notification.
 *
 * ⚠️ Une diffusion partie ne se rattrape pas. D'où l'aperçu du nombre de
 * destinataires avant création, et une confirmation nominative avant l'envoi.
 */
export default function DiffusionsModule() {
  const [creation, setCreation] = useState(false);
  const { data, isLoading, isError, refetch } = useDiffusionsQuery();
  const diffusions = useMemo(() => data?.data ?? [], [data]);

  // ⚠️ Une PAGE, pas une fenêtre : rédiger un message qui partira à des
  // milliers de personnes demande de la place et un retour en arrière.
  if (creation) return <CreationView onRetour={() => setCreation(false)} />;

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-3 md:p-6 border-b border-slate-300 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="lg:text-2xl md:text-lg text-base font-bold text-[#F17922]">
            Diffusions
          </h1>
          <p className="text-[12px] text-gray-500 mt-0.5 truncate">
            Envoyer le même message à une liste de clients.
          </p>
        </div>
        <HasPermission module={Modules.MARKETING} action={Action.CREATE}>
          <button
            type="button"
            onClick={() => setCreation(true)}
            className="shrink-0 inline-flex h-[42px] items-center gap-1.5 rounded-xl bg-[#F17922] px-3 md:px-4 text-[13px] font-semibold text-white hover:bg-[#F17922]/90 cursor-pointer"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Nouvelle diffusion</span>
            <span className="sm:hidden">Nouvelle</span>
          </button>
        </HasPermission>
      </div>

      <div className="flex-1 overflow-y-auto p-3 md:p-6">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F17922]" />
          </div>
        ) : isError ? (
          /* Sans cet état, une liste en échec s'affichait comme une liste vide :
             le gestionnaire croyait n'avoir aucune diffusion. */
          <div className="text-center py-16">
            <p className="font-semibold text-gray-700">Chargement impossible</p>
            <p className="text-[13px] text-gray-400 mt-1">Vérifiez votre connexion.</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-4 h-[42px] px-4 rounded-xl border border-slate-300 text-[13px] font-semibold text-gray-700 cursor-pointer"
            >
              Réessayer
            </button>
          </div>
        ) : diffusions.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center mx-auto mb-4">
              <Megaphone className="text-[#F17922]" size={28} />
            </div>
            <p className="font-semibold text-gray-700">Aucune diffusion</p>
            <p className="text-[13px] text-gray-400 mt-1">
              Créez-en une pour annoncer une promotion ou une nouveauté.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {diffusions.map((d) => (
              <LigneDiffusion key={d.id} diffusion={d} />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

function LigneDiffusion({ diffusion }: { diffusion: IDiffusion }) {
  const [confirmation, setConfirmation] = useState(false);
  const envoyer = useEnvoyerDiffusionMutation();
  const reprendre = useReprendreDiffusionMutation();
  const s = diffusion.stats;
  const aRattraper = (s?.en_attente ?? 0) + (s?.echecs ?? 0) > 0;

  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-gray-900 truncate">{diffusion.name}</h3>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                COULEUR_STATUT[diffusion.status] ?? 'bg-gray-100 text-gray-700'
              }`}
            >
              {LIBELLES_STATUT[diffusion.status] ?? diffusion.status}
            </span>
          </div>

          <p className="text-[13px] text-gray-600 mt-1.5 line-clamp-2">{diffusion.body}</p>

          <div className="flex items-center gap-x-3 gap-y-1 mt-2 text-[12px] text-gray-500 flex-wrap">
            <span className="inline-flex items-center gap-1">
              <Users size={13} />
              {diffusion.total_targeted} destinataire{diffusion.total_targeted > 1 ? 's' : ''}
            </span>
            {s && (
              <>
                <span>{s.envoyes} envoyé{s.envoyes > 1 ? 's' : ''}</span>
                {s.en_attente > 0 && <span>{s.en_attente} en attente</span>}
                {s.echecs > 0 && (
                  <span className="text-red-600 font-semibold">{s.echecs} en échec</span>
                )}
              </>
            )}
            {diffusion.status === 'scheduled' && diffusion.scheduled_at && (
              <span className="text-blue-700">Départ le {dateCourte(diffusion.scheduled_at)}</span>
            )}
            <span className="text-gray-400">
              {dateCourte(diffusion.created_at)} · {diffusion.created_by}
            </span>
          </div>
        </div>

        <HasPermission module={Modules.MARKETING} action={Action.UPDATE}>
          <div className="shrink-0 flex flex-col gap-2">
            {(diffusion.status === 'draft' || diffusion.status === 'scheduled') && (
              <button
                type="button"
                disabled={envoyer.isPending}
                onClick={() => setConfirmation(true)}
                className="inline-flex h-[42px] items-center gap-1.5 rounded-xl bg-[#F17922] px-3 text-[13px] font-semibold text-white disabled:opacity-50 cursor-pointer"
              >
                <Send size={15} />
                Envoyer
              </button>
            )}

            {['sending', 'failed', 'sent'].includes(diffusion.status) && aRattraper && (
              <button
                type="button"
                disabled={reprendre.isPending}
                onClick={() => reprendre.mutate(diffusion.id)}
                className="inline-flex h-[42px] items-center gap-1.5 rounded-xl border border-slate-300 px-3 text-[13px] font-semibold text-gray-700 disabled:opacity-50 cursor-pointer"
                title="Renvoyer uniquement à ceux qui n'ont pas reçu"
              >
                <RefreshCw size={15} />
                Reprendre
              </button>
            )}
          </div>
        </HasPermission>
      </div>

      <ConfirmDialog
        isOpen={confirmation}
        onClose={() => setConfirmation(false)}
        onConfirm={() => {
          envoyer.mutate(diffusion.id);
          setConfirmation(false);
        }}
        title="Envoyer cette diffusion ?"
        description={
          <p>
            Le message partira à <b>{diffusion.total_targeted}</b> client
            {diffusion.total_targeted > 1 ? 's' : ''}. Une diffusion partie ne se
            rattrape pas.
          </p>
        }
        confirmLabel="Envoyer"
        isLoading={envoyer.isPending}
      />
    </div>
  );
}

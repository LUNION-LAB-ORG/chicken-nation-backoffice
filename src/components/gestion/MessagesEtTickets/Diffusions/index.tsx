"use client";

import React, { useMemo, useState } from 'react';
import { Megaphone, Plus, RefreshCw, Send, Users } from 'lucide-react';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import CustomDropdown from '@/components/ui/CustomDropdown';
import Modal from '@/components/ui/Modal';
import { HasPermission } from '../../../../../features/users/components/HasPermission';
import { Action, Modules } from '../../../../../features/users/types/auth.type';
import {
  useApercuAudienceMutation,
  useCreerDiffusionMutation,
  useDiffusionsQuery,
  useEnvoyerDiffusionMutation,
  useReprendreDiffusionMutation,
} from '../../../../../features/message-broadcast/queries/broadcast.query';
import {
  LIBELLES_STATUT,
  SEGMENTS_SYSTEME,
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

      <ModaleCreation ouverte={creation} onFermer={() => setCreation(false)} />
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

function ModaleCreation({ ouverte, onFermer }: { ouverte: boolean; onFermer: () => void }) {
  const [nom, setNom] = useState('');
  const [corps, setCorps] = useState('');
  const [segment, setSegment] = useState('all');
  const [quand, setQuand] = useState('');

  const apercu = useApercuAudienceMutation();
  const creer = useCreerDiffusionMutation();

  const valide = nom.trim().length >= 2 && corps.trim().length >= 2;

  /**
   * Le compte affiché appartient TOUJOURS au segment affiché : changer de
   * segment efface l'aperçu précédent. Sinon le gestionnaire lirait « 1 200
   * clients » sous un segment qui n'en vise que douze.
   */
  const changerSegment = (valeur: string) => {
    setSegment(valeur);
    apercu.reset();
  };

  const fermer = () => {
    apercu.reset();
    onFermer();
  };

  return (
    <Modal isOpen={ouverte} onClose={fermer} title="Nouvelle diffusion">
      <div className="p-4 md:p-6">
        <p className="text-[12px] text-gray-500">
          Le message arrive dans le fil Chicken Nation du client.
        </p>

        <label htmlFor="diffusion-nom" className="block mt-5 text-[13px] font-semibold text-gray-700">
          Nom, pour vous y retrouver
        </label>
        <input
          id="diffusion-nom"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          maxLength={120}
          placeholder="Ex : Promo week-end de mars"
          className="mt-1 w-full h-[42px] rounded-xl border border-[#D8D8D8] bg-white px-3 text-[13px] text-[#595959] focus:outline-none focus:ring-2 focus:ring-[#F17922]"
        />

        <label htmlFor="diffusion-corps" className="block mt-4 text-[13px] font-semibold text-gray-700">
          Message
        </label>
        <textarea
          id="diffusion-corps"
          value={corps}
          onChange={(e) => setCorps(e.target.value)}
          rows={4}
          maxLength={LONGUEUR_MAX}
          placeholder="Bonjour {{first_name}}, ce week-end les burgers sont à moins 20 pour cent."
          className="mt-1 w-full rounded-xl border border-[#D8D8D8] bg-white px-3 py-2 text-[13px] text-[#595959] focus:outline-none focus:ring-2 focus:ring-[#F17922]"
        />
        <div className="flex items-start justify-between gap-3 mt-1">
          <p className="text-[11px] text-gray-400">
            {'{{first_name}}'} est remplacé par le prénom du client, ou par rien
            s&apos;il n&apos;en a pas.
          </p>
          <span className="text-[11px] text-gray-400 shrink-0 tabular-nums">
            {corps.length} / {LONGUEUR_MAX}
          </span>
        </div>

        <label className="block mt-4 text-[13px] font-semibold text-gray-700">
          Destinataires
        </label>
        <div className="mt-1">
          <CustomDropdown
            options={SEGMENTS_SYSTEME.map((s) => ({ value: s.cle, label: s.libelle }))}
            value={segment}
            onChange={changerSegment}
          />
        </div>

        <button
          type="button"
          disabled={apercu.isPending}
          onClick={() =>
            apercu.mutate({ target_type: 'segment', target_config: { segment } })
          }
          className="mt-2 text-[12px] font-semibold text-[#F17922] cursor-pointer disabled:opacity-50"
        >
          {apercu.isPending ? 'Calcul en cours' : 'Combien de clients ?'}
        </button>
        {apercu.data && (
          <p className="text-[13px] text-gray-700 mt-1">
            <strong>{accord(apercu.data.total)}</strong> ce message.
          </p>
        )}
        {apercu.isError && (
          <p className="text-[12px] text-red-600 mt-1">Comptage impossible pour le moment.</p>
        )}

        <label htmlFor="diffusion-date" className="block mt-4 text-[13px] font-semibold text-gray-700">
          Départ différé, facultatif
        </label>
        <input
          id="diffusion-date"
          type="datetime-local"
          value={quand}
          min={new Date(Date.now() + 5 * 60 * 1000).toISOString().slice(0, 16)}
          onChange={(e) => setQuand(e.target.value)}
          className="mt-1 w-full h-[42px] rounded-xl border border-[#D8D8D8] bg-white px-3 text-[13px] text-[#595959] focus:outline-none focus:ring-2 focus:ring-[#F17922]"
        />
        <p className="text-[11px] text-gray-400 mt-1">
          Laissé vide, la diffusion reste en brouillon et part quand vous cliquez sur
          Envoyer.
        </p>

        <div className="flex justify-end gap-2 mt-6">
          <button
            type="button"
            onClick={fermer}
            className="h-[42px] px-5 rounded-xl bg-[#ECECEC] text-[13px] font-semibold text-[#9796A1] cursor-pointer"
          >
            Annuler
          </button>
          <button
            type="button"
            disabled={!valide || creer.isPending}
            onClick={() =>
              creer.mutate(
                {
                  name: nom.trim(),
                  body: corps.trim(),
                  target_type: 'segment',
                  target_config: { segment },
                  ...(quand ? { scheduled_at: new Date(quand).toISOString() } : {}),
                },
                { onSuccess: fermer },
              )
            }
            className="h-[42px] px-5 rounded-xl bg-[#F17922] text-[13px] font-semibold text-white disabled:opacity-50 cursor-pointer"
          >
            {creer.isPending ? 'Création en cours' : 'Créer'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

"use client";

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import { ArrowLeft, ImagePlus, Search, Users, X } from 'lucide-react';
import { CustomDropdown } from '@/components/ui/CustomDropdown';
import {
  useApercuAudienceMutation,
  useCreerDiffusionMutation,
  useRechercheClientsQuery,
} from '../../../../../features/message-broadcast/queries/broadcast.query';
import {
  SEGMENTS_SYSTEME,
  type IClientCible,
} from '../../../../../features/message-broadcast/types/broadcast.type';

const LONGUEUR_MAX = 2000;
const TAILLE_IMAGE_MAX = 5 * 1024 * 1024;

const nomClient = (c: IClientCible) =>
  [c.first_name, c.last_name].filter(Boolean).join(' ').trim() || c.phone;

/**
 * Création d'une diffusion, en PAGE et non en fenêtre.
 *
 * Rédiger un message qui partira à des milliers de personnes, choisir une
 * audience et joindre une image ne tient pas dans une boîte de dialogue : on a
 * besoin de place, de relire, et de revenir en arrière sans tout perdre.
 */
export default function CreationView({ onRetour }: { onRetour: () => void }) {
  const [nom, setNom] = useState('');
  const [corps, setCorps] = useState('');
  const [mode, setMode] = useState<'segment' | 'ids'>('segment');
  const [segment, setSegment] = useState('all');
  const [choisis, setChoisis] = useState<IClientCible[]>([]);
  const [terme, setTerme] = useState('');
  const [quand, setQuand] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [apercuImage, setApercuImage] = useState<string | null>(null);

  const apercu = useApercuAudienceMutation();
  const creer = useCreerDiffusionMutation();
  const recherche = useRechercheClientsQuery(terme);

  const cible = useMemo(
    () =>
      mode === 'segment'
        ? { target_type: 'segment' as const, target_config: { segment } }
        : { target_type: 'ids' as const, target_config: { ids: choisis.map((c) => c.id) } },
    [mode, segment, choisis],
  );

  const valide =
    nom.trim().length >= 2 &&
    corps.trim().length >= 2 &&
    (mode === 'segment' || choisis.length > 0);

  const changerCible = (fn: () => void) => {
    fn();
    // Le compte affiché appartient toujours à la cible affichée.
    apercu.reset();
  };

  const choisirImage = (fichier?: File | null) => {
    if (!fichier) return;
    if (fichier.size > TAILLE_IMAGE_MAX) {
      window.alert('Image trop lourde. 5 Mo au maximum.');
      return;
    }
    setImage(fichier);
    setApercuImage(URL.createObjectURL(fichier));
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-3 md:p-6 border-b border-slate-300 flex items-center gap-3">
        <button
          type="button"
          onClick={onRetour}
          className="shrink-0 h-[42px] w-[42px] rounded-xl border border-slate-300 flex items-center justify-center text-gray-600 cursor-pointer"
          aria-label="Retour aux diffusions"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="min-w-0">
          <h1 className="lg:text-2xl md:text-lg text-base font-bold text-[#F17922]">
            Nouvelle diffusion
          </h1>
          <p className="text-[12px] text-gray-500 mt-0.5 truncate">
            Le message arrive dans le fil Chicken Nation du client.
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-4 md:p-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Colonne rédaction */}
          <div>
            <label htmlFor="d-nom" className="block text-[13px] font-semibold text-gray-700">
              Nom, pour vous y retrouver
            </label>
            <input
              id="d-nom"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              maxLength={120}
              placeholder="Ex : Promo week-end de mars"
              className="mt-1 w-full h-[42px] rounded-xl border border-[#D8D8D8] bg-white px-3 text-[13px] text-[#595959] focus:outline-none focus:ring-2 focus:ring-[#F17922]"
            />

            <label htmlFor="d-corps" className="block mt-4 text-[13px] font-semibold text-gray-700">
              Message
            </label>
            <textarea
              id="d-corps"
              value={corps}
              onChange={(e) => setCorps(e.target.value)}
              rows={7}
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
              Image, facultative
            </label>
            {apercuImage ? (
              <div className="mt-1 relative w-full max-w-xs rounded-xl overflow-hidden border border-slate-200">
                <Image
                  src={apercuImage}
                  alt="Aperçu de l'image jointe"
                  width={320}
                  height={200}
                  className="w-full h-auto object-cover"
                  unoptimized
                />
                <button
                  type="button"
                  onClick={() => {
                    setImage(null);
                    setApercuImage(null);
                  }}
                  className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/95 shadow flex items-center justify-center cursor-pointer"
                  aria-label="Retirer l'image"
                >
                  <X size={15} />
                </button>
              </div>
            ) : (
              <label className="mt-1 flex items-center gap-2 h-[42px] px-3 rounded-xl border border-dashed border-[#D8D8D8] text-[13px] text-gray-500 cursor-pointer w-fit">
                <ImagePlus size={16} />
                Joindre une image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => choisirImage(e.target.files?.[0])}
                />
              </label>
            )}
          </div>

          {/* Colonne destinataires */}
          <div className="lg:border-l lg:border-slate-200 lg:pl-6">
            <p className="text-[13px] font-semibold text-gray-700">Destinataires</p>

            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => changerCible(() => setMode('segment'))}
                className={`flex-1 h-[38px] rounded-xl text-[12px] font-semibold cursor-pointer ${
                  mode === 'segment'
                    ? 'bg-[#F17922] text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                Un segment
              </button>
              <button
                type="button"
                onClick={() => changerCible(() => setMode('ids'))}
                className={`flex-1 h-[38px] rounded-xl text-[12px] font-semibold cursor-pointer ${
                  mode === 'ids' ? 'bg-[#F17922] text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                Clients choisis
              </button>
            </div>

            {mode === 'segment' ? (
              <div className="mt-3">
                <CustomDropdown
                  options={SEGMENTS_SYSTEME.map((s) => ({ value: s.cle, label: s.libelle }))}
                  value={segment}
                  onChange={(v) => changerCible(() => setSegment(v))}
                />
              </div>
            ) : (
              <div className="mt-3">
                <div className="flex items-center gap-2 h-[42px] rounded-xl border border-[#D8D8D8] px-3">
                  <Search size={15} className="text-gray-400 shrink-0" />
                  <input
                    value={terme}
                    onChange={(e) => setTerme(e.target.value)}
                    placeholder="Nom ou téléphone"
                    className="flex-1 min-w-0 text-[13px] outline-none bg-transparent"
                  />
                </div>

                {terme.trim().length >= 2 && (
                  <div className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-slate-200">
                    {recherche.isLoading ? (
                      <p className="p-3 text-[12px] text-gray-400">Recherche…</p>
                    ) : (recherche.data?.data ?? []).length === 0 ? (
                      <p className="p-3 text-[12px] text-gray-400">
                        Aucun client trouvé. Seuls ceux qui ont ouvert
                        l&apos;application peuvent recevoir un message.
                      </p>
                    ) : (
                      (recherche.data?.data ?? []).map((c) => {
                        const deja = choisis.some((x) => x.id === c.id);
                        return (
                          <button
                            key={c.id}
                            type="button"
                            disabled={deja}
                            onClick={() => changerCible(() => setChoisis((p) => [...p, c]))}
                            className="w-full text-left px-3 py-2 text-[13px] hover:bg-gray-50 disabled:opacity-40 cursor-pointer border-b border-slate-100 last:border-b-0"
                          >
                            {nomClient(c)}{' '}
                            <span className="text-gray-400">{c.phone}</span>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}

                {choisis.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {choisis.map((c) => (
                      <span
                        key={c.id}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-orange-50 text-[12px] text-[#F17922]"
                      >
                        {nomClient(c)}
                        <button
                          type="button"
                          onClick={() =>
                            changerCible(() =>
                              setChoisis((p) => p.filter((x) => x.id !== c.id)),
                            )
                          }
                          aria-label={`Retirer ${nomClient(c)}`}
                          className="cursor-pointer"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              disabled={apercu.isPending || (mode === 'ids' && choisis.length === 0)}
              onClick={() => apercu.mutate(cible)}
              className="mt-3 text-[12px] font-semibold text-[#F17922] cursor-pointer disabled:opacity-50"
            >
              {apercu.isPending ? 'Calcul en cours' : 'Combien de clients ?'}
            </button>

            {apercu.data && (
              <div className="mt-2 rounded-xl bg-gray-50 p-3">
                <p className="text-[13px] text-gray-800 inline-flex items-center gap-1.5">
                  <Users size={14} className="text-[#F17922]" />
                  <strong>{apercu.data.total}</strong> recevront ce message
                </p>
                {apercu.data.sans_application > 0 && (
                  <p className="text-[11px] text-gray-500 mt-1.5 leading-4">
                    Le ciblage désigne {apercu.data.cibles} clients, mais{' '}
                    {apercu.data.sans_application} n&apos;ont jamais ouvert
                    l&apos;application et ne verront rien. Un message s&apos;affiche
                    dans l&apos;application, il ne part ni par SMS ni par WhatsApp.
                  </p>
                )}
              </div>
            )}

            <label htmlFor="d-date" className="block mt-5 text-[13px] font-semibold text-gray-700">
              Départ différé, facultatif
            </label>
            <input
              id="d-date"
              type="datetime-local"
              value={quand}
              min={new Date(Date.now() + 5 * 60 * 1000).toISOString().slice(0, 16)}
              onChange={(e) => setQuand(e.target.value)}
              className="mt-1 w-full h-[42px] rounded-xl border border-[#D8D8D8] bg-white px-3 text-[13px] text-[#595959] focus:outline-none focus:ring-2 focus:ring-[#F17922]"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Laissé vide, la diffusion reste en brouillon et part quand vous cliquez
              sur Envoyer.
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 p-3 md:p-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onRetour}
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
                ...cible,
                ...(quand ? { scheduled_at: new Date(quand).toISOString() } : {}),
                image,
              },
              { onSuccess: onRetour },
            )
          }
          className="h-[42px] px-5 rounded-xl bg-[#F17922] text-[13px] font-semibold text-white disabled:opacity-50 cursor-pointer"
        >
          {creer.isPending ? 'Création en cours' : 'Créer la diffusion'}
        </button>
      </div>
    </div>
  );
}

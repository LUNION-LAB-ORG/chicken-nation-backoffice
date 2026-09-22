"use client";

import React, { useMemo, useState } from 'react';
import { Check, Loader2, LogOut, Pencil, UserPlus, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { SearchableDropdown } from '@/components/ui/SearchableDropdown';
import { useAuthStore } from '../../../../../features/users/hook/authStore';
import {
  useAjouterParticipantsMutation,
  useRetirerParticipantMutation,
  useRenommerGroupeMutation,
  useBasculerAlertesMutation,
} from '../../../../../features/messagerie';
import { useCollegues, ROLES_GESTION_GROUPE } from '../../../../../features/messagerie/hooks/use-collegues';

interface Membre {
  id: string;
  fullName: string;
  image?: string | null;
  role?: string;
}

interface GroupeMembresProps {
  conversationId: string;
  membres: Membre[];
  nomGroupe?: string | null;
  /** Ce groupe reçoit-il déjà les alertes du système ? */
  recoitAlertes?: boolean;
  /** Prévenir le parent qu'on vient de quitter : la conversation n'est plus à nous. */
  onQuitte?: () => void;
}

/**
 * Composition d'un GROUPE interne : ajouter, retirer, quitter, renommer.
 *
 * Sans cet écran, un groupe est figé à sa création et il faut le recréer à
 * chaque mouvement d'équipe. Les règles ne sont pas décidées ici : le serveur
 * refuse ce qui doit l'être, on se contente de ne pas proposer ce qui sera
 * refusé.
 */
function GroupeMembres({ conversationId, membres, nomGroupe, recoitAlertes = false, onQuitte }: GroupeMembresProps) {
  const { user } = useAuthStore();
  const peutGerer = ROLES_GESTION_GROUPE.includes(user?.role ?? '');

  const [ajoutOuvert, setAjoutOuvert] = useState(false);
  const [selection, setSelection] = useState<string[]>([]);
  const [renommage, setRenommage] = useState<string | null>(null);
  /**
   * Retirer quelqu'un, ou partir soi-même, ne doit pas tenir à un clic.
   * `aConfirmer` porte l'identifiant visé : le bouton demande confirmation
   * avant d'agir. `enCours` n'immobilise QUE la ligne concernée, et non toutes
   * les autres comme le faisait un indicateur unique.
   */
  const [aConfirmer, setAConfirmer] = useState<string | null>(null);
  const [enCours, setEnCours] = useState<string | null>(null);

  const idsMembres = useMemo(() => membres.map((m) => m.id), [membres]);
  // Chargé seulement quand on ouvre l'ajout : le panneau, lui, est toujours là.
  const { collegues, chargement, erreur } = useCollegues({
    exclureIds: idsMembres,
    actif: ajoutOuvert,
  });

  const ajouter = useAjouterParticipantsMutation();
  const retirer = useRetirerParticipantMutation();
  const renommer = useRenommerGroupeMutation();
  const basculerAlertes = useBasculerAlertesMutation();

  const confirmerAjout = async () => {
    if (selection.length === 0) return;
    try {
      await ajouter.mutateAsync({ conversationId, userIds: selection });
      toast.success(selection.length > 1 ? 'Membres ajoutés' : 'Membre ajouté');
      setSelection([]);
      setAjoutOuvert(false);
    } catch (e) {
      toast.error((e as Error)?.message || "L'ajout n'a pas abouti");
    }
  };

  const retirerMembre = async (membre: Membre) => {
    const estMoi = membre.id === user?.id;
    setEnCours(membre.id);
    try {
      await retirer.mutateAsync({ conversationId, userId: membre.id });
      toast.success(estMoi ? 'Vous avez quitté le groupe' : `${membre.fullName} a été retiré`);
      if (estMoi) onQuitte?.();
    } catch (e) {
      toast.error((e as Error)?.message || "Le retrait n'a pas abouti");
    } finally {
      setEnCours(null);
      setAConfirmer(null);
    }
  };

  /** Premier clic : demander. Second clic : agir. */
  const demanderOuRetirer = (membre: Membre) => {
    if (aConfirmer === membre.id) void retirerMembre(membre);
    else setAConfirmer(membre.id);
  };

  const confirmerRenommage = async () => {
    const nom = (renommage ?? '').trim();
    if (!nom) return;
    try {
      await renommer.mutateAsync({ conversationId, subject: nom });
      toast.success('Groupe renommé');
      setRenommage(null);
    } catch (e) {
      toast.error((e as Error)?.message || "Le nouveau nom n'a pas été enregistré");
    }
  };

  return (
    <div className="mt-6 border-t border-gray-100 pt-5">
      {/* Nom du groupe */}
      <div className="flex items-start justify-between gap-2 mb-4">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[#9796A1]">Groupe</p>
          {renommage === null ? (
            <p className="md:text-base text-sm font-semibold text-gray-900 break-words">
              {nomGroupe?.trim() || 'Sans nom'}
            </p>
          ) : (
            <div className="flex items-center gap-1.5 mt-1">
              <input
                autoFocus
                value={renommage}
                onChange={(e) => setRenommage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void confirmerRenommage();
                  if (e.key === 'Escape') setRenommage(null);
                }}
                className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-[#F17922]"
              />
              <button
                type="button"
                onClick={confirmerRenommage}
                disabled={renommer.isPending || !renommage.trim()}
                className="shrink-0 rounded-lg bg-[#F17922] p-1.5 text-white disabled:opacity-50 cursor-pointer"
                aria-label="Enregistrer le nom"
              >
                {renommer.isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              </button>
              <button
                type="button"
                onClick={() => setRenommage(null)}
                className="shrink-0 rounded-lg border border-gray-200 p-1.5 text-gray-500 cursor-pointer"
                aria-label="Annuler"
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>
        {peutGerer && renommage === null && (
          <button
            type="button"
            onClick={() => setRenommage(nomGroupe ?? '')}
            className="shrink-0 rounded-lg border border-gray-200 p-1.5 text-gray-500 hover:border-[#F17922]/60 cursor-pointer"
            aria-label="Renommer le groupe"
          >
            <Pencil size={13} />
          </button>
        )}
      </div>

      {/* Canal d'alertes */}
      {peutGerer && (
        <div className="mb-4 rounded-xl bg-gray-50 p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-gray-800">
                Alertes du système
              </p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-[#9796A1]">
                Le système écrit ici quand un paiement est encaissé sans que la
                commande se confirme, qu&apos;une commande se termine sans être
                payée ou avec un paiement partiel, ou que les notifications de
                paiement sont refusées.
              </p>
            </div>
            <button
              type="button"
              onClick={async () => {
                try {
                  await basculerAlertes.mutateAsync({ conversationId, recevoir: !recoitAlertes });
                  toast.success(
                    recoitAlertes
                      ? 'Ce groupe ne recevra plus les alertes'
                      : 'Ce groupe recevra les alertes du système',
                  );
                } catch (e) {
                  toast.error((e as Error)?.message || "Le réglage n'a pas été enregistré");
                }
              }}
              disabled={basculerAlertes.isPending}
              aria-label="Recevoir les alertes du système"
              className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 cursor-pointer ${
                recoitAlertes ? 'bg-[#F17922]' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  recoitAlertes ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      )}

      {/* Ajout de membres */}
      {peutGerer && (
        <div className="mb-4">
          {!ajoutOuvert ? (
            <button
              type="button"
              onClick={() => setAjoutOuvert(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-[12px] font-medium text-[#F17922] hover:border-[#F17922]/60 cursor-pointer"
            >
              <UserPlus size={13} /> Ajouter des membres
            </button>
          ) : (
            <div className="rounded-xl bg-gray-50 p-3">
              <SearchableDropdown
                label="Nouveaux membres"
                placeholder="Rechercher un collègue, ou son rôle…"
                options={collegues}
                value={selection}
                onChange={(v) => setSelection(Array.isArray(v) ? (v as string[]) : v ? [v as string] : [])}
                isLoading={chargement}
                error={erreur ?? undefined}
                multiSelect
              />
              <div className="mt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAjoutOuvert(false);
                    setSelection([]);
                  }}
                  className="rounded-lg px-3 py-1.5 text-[12px] font-medium text-gray-500 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={confirmerAjout}
                  disabled={ajouter.isPending || selection.length === 0}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#F17922] px-3 py-1.5 text-[12px] font-semibold text-white disabled:opacity-50 cursor-pointer"
                >
                  {ajouter.isPending && <Loader2 size={13} className="animate-spin" />}
                  Ajouter
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Retrait : proposé sur chaque membre, sauf soi-même (bouton dédié) */}
      {peutGerer && membres.length > 2 && (
        <div className="mb-3 space-y-1.5">
          {membres
            .filter((m) => m.id !== user?.id)
            .map((membre) => (
              <div key={membre.id} className="flex items-center justify-between gap-2">
                <span className="truncate text-[13px] text-gray-700">{membre.fullName}</span>
                <button
                  type="button"
                  onClick={() => demanderOuRetirer(membre)}
                  onBlur={() => setAConfirmer((v) => (v === membre.id ? null : v))}
                  disabled={enCours === membre.id}
                  className={`shrink-0 rounded-lg border px-2 py-1 text-[11px] font-medium disabled:opacity-50 cursor-pointer ${
                    aConfirmer === membre.id
                      ? 'border-[#C0392B] bg-[#FDECEA] text-[#C0392B]'
                      : 'border-gray-200 text-[#C0392B] hover:border-[#C0392B]/50'
                  }`}
                >
                  {enCours === membre.id
                    ? 'Retrait…'
                    : aConfirmer === membre.id
                      ? 'Confirmer ?'
                      : 'Retirer'}
                </button>
              </div>
            ))}
        </div>
      )}

      {/* Quitter : ouvert à tout membre, sans condition de rôle. */}
      <button
        type="button"
        onClick={() => {
          const moi = membres.find((m) => m.id === user?.id);
          if (moi) demanderOuRetirer(moi);
        }}
        onBlur={() => setAConfirmer((v) => (v === user?.id ? null : v))}
        disabled={enCours === user?.id || !membres.some((m) => m.id === user?.id)}
        className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#C0392B] hover:underline disabled:opacity-50 cursor-pointer"
      >
        <LogOut size={13} />
        {enCours === user?.id
          ? 'Sortie du groupe…'
          : aConfirmer === user?.id
            ? 'Confirmer la sortie ?'
            : 'Quitter le groupe'}
      </button>
    </div>
  );
}

export default GroupeMembres;

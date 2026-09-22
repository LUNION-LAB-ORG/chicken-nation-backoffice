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
function GroupeMembres({ conversationId, membres, nomGroupe, onQuitte }: GroupeMembresProps) {
  const { user } = useAuthStore();
  const peutGerer = ROLES_GESTION_GROUPE.includes(user?.role ?? '');

  const [ajoutOuvert, setAjoutOuvert] = useState(false);
  const [selection, setSelection] = useState<string[]>([]);
  const [renommage, setRenommage] = useState<string | null>(null);

  const idsMembres = useMemo(() => membres.map((m) => m.id), [membres]);
  // Chargé seulement quand on ouvre l'ajout : le panneau, lui, est toujours là.
  const { collegues, chargement, erreur } = useCollegues({
    exclureIds: idsMembres,
    actif: ajoutOuvert,
  });

  const ajouter = useAjouterParticipantsMutation();
  const retirer = useRetirerParticipantMutation();
  const renommer = useRenommerGroupeMutation();

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
    try {
      await retirer.mutateAsync({ conversationId, userId: membre.id });
      toast.success(estMoi ? 'Vous avez quitté le groupe' : `${membre.fullName} a été retiré`);
      if (estMoi) onQuitte?.();
    } catch (e) {
      toast.error((e as Error)?.message || "Le retrait n'a pas abouti");
    }
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
                  onClick={() => retirerMembre(membre)}
                  disabled={retirer.isPending}
                  className="shrink-0 rounded-lg border border-gray-200 px-2 py-1 text-[11px] font-medium text-[#C0392B] hover:border-[#C0392B]/50 disabled:opacity-50 cursor-pointer"
                >
                  Retirer
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
          if (moi) void retirerMembre(moi);
        }}
        disabled={retirer.isPending || !membres.some((m) => m.id === user?.id)}
        className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#C0392B] hover:underline disabled:opacity-50 cursor-pointer"
      >
        <LogOut size={13} /> Quitter le groupe
      </button>
    </div>
  );
}

export default GroupeMembres;

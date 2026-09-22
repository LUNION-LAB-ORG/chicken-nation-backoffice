"use client";

import React from 'react';
import Image from 'next/image';
import { Mail, Phone, X } from 'lucide-react';
import { formatImageUrl } from '@/utils/imageHelpers';

// Types pour les participants
interface Participant {
  id: string;
  name: string;
  role: string;
  avatar: string;
}

import { useAuthStore } from '../../../../../features/users/hook/authStore';
import GroupeMembres from './GroupeMembres';

// Données mockées pour les participants - remplacées par l'utilisateur connecté

interface ConversationParticipant {
  id: string;
  fullName: string;
  image?: string | null;
  role: string;
}

interface InboxRightbarProps {
  conversationId: string | null;
  clientName?: string;
  clientEmail?: string;
  clientImage?: string;
  clientPhone?: string;
  isInternal?: boolean;
  participants?: ConversationParticipant[];
  /** Groupe interne : ouvre la gestion de la composition. */
  isGroup?: boolean;
  groupName?: string | null;
  recoitAlertes?: boolean;
  /** Ferme le panneau. Indispensable depuis qu'il s'ouvre sur demande. */
  onClose?: () => void;
  onQuitteGroupe?: () => void;
}

function InboxRightbar({
  conversationId,
  clientName,
  clientEmail,
  clientImage,
  clientPhone,
  isInternal = false,
  participants = [],
  isGroup = false,
  groupName,
  recoitAlertes = false,
  onClose,
  onQuitteGroupe
}: InboxRightbarProps) {
  const { user } = useAuthStore();

  if (!conversationId) {
    return null;
  }

  // Créer le participant basé sur l'utilisateur connecté
  const currentParticipant: Participant = {
    id: user?.id || '1',
    name: user?.fullname || 'Utilisateur',
    role: user?.role || 'Support',
    avatar: user?.image ? formatImageUrl(user.image) : '/icons/imageprofile.png'
  };

  const titre = isGroup
    ? 'Infos du groupe'
    : isInternal
      ? 'Infos de la discussion'
      : 'Infos du contact';

  return (
    <div className="h-full md:w-80 w-64 bg-white border-l border-slate-300 flex flex-col">
      {/*
        Barre de titre fixe, à la manière de WhatsApp : l'intitulé dit de quoi
        il s'agit, la croix ferme. Hors du défilement, pour rester atteignable
        quelle que soit la longueur de la liste des membres.
      */}
      <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-4 py-3 shrink-0">
        <span className="text-[13px] font-semibold uppercase tracking-wide text-[#9796A1]">
          {titre}
        </span>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="h-7 w-7 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 cursor-pointer"
          >
            <X size={15} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto md:p-6 p-4">
        <h3 className="lg:text-lg md:text-base text-sm font-regular text-[#F17922] md:mb-4 mb-3">
          {isInternal
            ? (isGroup && groupName?.trim() ? groupName.trim() : 'Discussion interne')
            : 'Informations client'}
        </h3>

        {!isInternal && (
          /* Info client */
          <div className="md:mb-6 mb-4">
            <div className="flex items-center md:space-x-3 space-x-2 md:mb-4 mb-3">
              <div className="md:w-12 md:h-12 w-10 h-10 rounded-full">
                <Image
                  src={clientImage ? formatImageUrl(clientImage) : "/icons/imageprofile.png"}
                  alt={clientName || "Client"}
                  width={48}
                  height={48}
                  className="md:w-12 md:h-12 w-10 h-10 rounded-full object-cover"
                />
              </div>
              <div>
                <h4 className="md:text-base text-sm font-semibold text-gray-900">
                  {clientName || 'Nom non disponible'}
                </h4>
                <p className="md:text-sm text-xs text-gray-500">Client</p>
              </div>
            </div>

            <div className="md:space-y-3 space-y-2">
              {clientEmail && (
                <div className="flex items-center md:space-x-2 space-x-1 md:text-sm text-xs">
                  <Mail className="md:w-4 md:h-4 w-3 h-3 text-gray-400" />
                  <span className="text-gray-600">{clientEmail}</span>
                </div>
              )}
              {clientPhone && (
                <div className="flex items-center md:space-x-2 space-x-1 md:text-sm text-xs">
                  <Phone className="md:w-4 md:h-4 w-3 h-3 text-gray-400" />
                  <span className="text-gray-600">{clientPhone}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Participants */}
        <div>
          <h4 className="lg:text-base md:text-sm text-xs font-regular text-[#F17922] md:mb-4 mb-3">
            Participants ({Math.max(1, participants.length)})
          </h4>
          <div className="md:space-y-3 space-y-2">
            {participants.length > 0 ? (
              participants.map((participant) => (
                <div key={participant.id} className="flex items-center md:space-x-3 space-x-2">
                  <div className="md:w-8 md:h-8 w-6 h-6 rounded-full">
                    <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center border-2 border-white overflow-hidden">
                      {participant.image ? (
                        <Image
                          src={formatImageUrl(participant.image)}
                          alt={participant.fullName}
                          width={32}
                          height={32}
                          className="md:w-8 md:h-8 w-6 h-6 rounded-full object-cover"
                        />
                      ) : (
                        <span className="md:text-xs text-xs font-bold text-gray-600 uppercase">
                          {participant.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="md:text-base text-sm font-medium text-gray-900">{participant.fullName}</p>
                    <p className="md:text-sm text-xs text-gray-500">{participant.role}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center md:space-x-3 space-x-2">
                <div className="md:w-8 md:h-8 w-6 h-6 rounded-full">
                  <Image
                    src={currentParticipant.avatar}
                    alt={currentParticipant.name}
                    width={32}
                    height={32}
                    className="md:w-8 md:h-8 w-6 h-6 rounded-full object-cover"
                  />
                </div>
                <div>
                  <p className="md:text-base text-sm font-medium text-gray-900">{currentParticipant.name}</p>
                  <p className="md:text-sm text-xs text-gray-500">{currentParticipant.role}</p>
                </div>
              </div>
            )}
          </div>

          {/* Composition du groupe : ajouter, retirer, quitter, renommer. */}
          {isGroup && conversationId && (
            <GroupeMembres
              // `key` : repartir de zéro en changeant de groupe, sinon un nom
              // en cours de saisie s'appliquerait au groupe suivant.
              key={conversationId}
              conversationId={conversationId}
              membres={participants}
              nomGroupe={groupName}
              recoitAlertes={recoitAlertes}
              onQuitte={onQuitteGroupe}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default InboxRightbar;

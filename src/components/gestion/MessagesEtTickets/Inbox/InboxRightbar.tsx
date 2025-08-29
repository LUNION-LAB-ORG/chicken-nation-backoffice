"use client";

import React from 'react';
import Image from 'next/image';
import { Mail, Phone } from 'lucide-react';
import { formatImageUrl } from '@/utils/imageHelpers';

// Types pour les participants
interface Participant {
  id: string;
  name: string;
  role: string;
  avatar: string;
}

import { useAuthStore } from '@/store/authStore';

// Données mockées pour les participants - remplacées par l'utilisateur connecté

interface InboxRightbarProps {
  conversationId: string | null;
  clientName?: string;
  clientEmail?: string;
  clientImage?: string;
  clientPhone?: string;
}

function InboxRightbar({
  conversationId,
  clientName,
  clientEmail,
  clientImage,
  clientPhone
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

  return (
    <div className="md:w-80 w-64 bg-white border-l border-slate-300">
      <div className="md:p-6 p-4">
        <h3 className="lg:text-lg md:text-base text-sm font-regular text-orange-500 md:mb-4 mb-3">Informations client</h3>

        {/* Info client */}
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

        {/* Participants */}
        <div>
          <h4 className="lg:text-base md:text-sm text-xs font-regular text-orange-500 md:mb-4 mb-3">Participants</h4>
          <div className="md:space-y-3 space-y-2">
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
          </div>
        </div>
      </div>
    </div>
  );
}

export default InboxRightbar;

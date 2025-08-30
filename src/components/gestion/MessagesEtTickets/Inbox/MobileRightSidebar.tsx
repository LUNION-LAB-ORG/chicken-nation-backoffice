"use client";

import React from 'react';
import Image from 'next/image';
import { X, Mail, Phone } from 'lucide-react';
import { formatImageUrl } from '@/utils/imageHelpers';

// Types pour les participants
interface Participant {
  id: string;
  name: string;
  role: string;
  avatar: string;
}

// Données mockées pour les participants
const mockParticipants: Participant[] = [
  {
    id: '1',
    name: 'Jean Martin',
    role: 'Caisse',
    avatar: '/icons/imageprofile.png'
  }
];

interface ConversationParticipant {
  id: string;
  fullName: string;
  image?: string | null;
  role: string;
}

interface MobileRightSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string | null;
  clientName?: string;
  clientEmail?: string;
  clientImage?: string;
  clientPhone?: string;
  isInternal?: boolean;
  participants?: ConversationParticipant[];
}

function MobileRightSidebar({ 
  isOpen, 
  onClose, 
  conversationId, 
  clientName, 
  clientEmail, 
  clientImage, 
  clientPhone,
  isInternal = false,
  participants = []
}: MobileRightSidebarProps) {
  if (!isOpen || !conversationId) {
    return null;
  }

  return (
    <>
      {/* Overlay avec flou */}
      <div 
        className="fixed inset-0 backdrop-blur-sm bg-white/10 z-40 xl:hidden"
        onClick={onClose}
      />
      
      {/* Sidebar qui slide depuis la droite */}
      <div className={`
        fixed top-0 right-0 h-full w-80 bg-white z-50 shadow-xl
        transform transition-transform duration-300 ease-in-out xl:hidden
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        {/* Header avec bouton fermer */}
        <div className="flex items-center justify-between p-4 border-b border-slate-300">
          <h3 className="text-lg font-semibold text-orange-500">
            {isInternal ? 'Discussion interne' : 'Informations client'}
          </h3>
          <button
            onClick={onClose}
            title="Fermer les informations"
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Contenu de la sidebar */}
        <div className="p-4 overflow-y-auto h-full pb-20">
          {!isInternal && (
            /* Info client */
            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 rounded-full">
                  <Image
                    src={clientImage ? formatImageUrl(clientImage) : "/icons/imageprofile.png"}
                    alt={clientName || "Client"}
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-gray-900">
                    {clientName || 'Nom non disponible'}
                  </h4>
                  <p className="text-sm text-gray-500">Client</p>
                </div>
              </div>
              
              <div className="space-y-3">
                {clientEmail && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">{clientEmail}</span>
                  </div>
                )}
                {clientPhone && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">{clientPhone}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Participants */}
          <div>
            <h4 className="text-base font-semibold text-orange-500 mb-4">
              Participants ({Math.max(1, participants.length)})
            </h4>
            <div className="space-y-3">
              {participants.length > 0 ? (
                participants.map((participant) => (
                  <div key={participant.id} className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full">
                      <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center border-2 border-white overflow-hidden">
                        {participant.image ? (
                          <Image
                            src={formatImageUrl(participant.image)}
                            alt={participant.fullName}
                            width={32}
                            height={32}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-xs font-bold text-gray-600 uppercase">
                            {participant.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-base font-medium text-gray-900">{participant.fullName}</p>
                      <p className="text-sm text-gray-500">{participant.role}</p>
                    </div>
                  </div>
                ))
              ) : (
                mockParticipants.map((participant) => (
                  <div key={participant.id} className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full">
                      <Image
                        src={participant.avatar}
                        alt={participant.name}
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="text-base font-medium text-gray-900">{participant.name}</p>
                      <p className="text-sm text-gray-500">{participant.role}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default MobileRightSidebar;

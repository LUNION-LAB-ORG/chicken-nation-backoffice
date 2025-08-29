"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Ticket, ArrowLeft, Eye, EyeOff, Send } from 'lucide-react';
import { CustomDropdown } from '@/components/ui/CustomDropdown';

interface TicketViewProps {
  ticketId: string | null;
  onBack?: () => void;
}

// Types pour les messages
interface Message {
  id: string;
  sender: 'client' | 'agent';
  senderName: string;
  content: string;
  timestamp: string;
  avatar: string;
}

const mockMessages: Message[] = [
  {
    id: '1',
    sender: 'client',
    senderName: 'Karima Traoré',
    content: 'Bonjour, j\'ai un problème avec ma commande #12345. Mon burger était froid quand je l\'ai reçu.',
    timestamp: 'il y a environ 2 heures',
    avatar: '/icons/imageprofile.png'
  },
  {
    id: '2',
    sender: 'agent',
    senderName: 'Marie Dubois',
    content: 'Nous avons contacté le livreur qui n\'arrive pas à trouver votre adresse. Pouvez-vous vérifier ?',
    timestamp: 'il y a 20 minutes',
    avatar: '/icons/imageprofile.png'
  }
];

// Données mockées pour les tickets
const getTicketData = (ticketId: string) => {
  const tickets = {
    'ticket-1': {
      id: 'ticket-1',
      title: 'Commande froide - Demande de remboursement',
      status: 'Ouvert',
      priority: 'Élevé',
      assignedTo: 'Karima Traoré'
    },
    'ticket-2': {
      id: 'ticket-2', 
      title: 'Problème de livraison - Adresse introuvable',
      status: 'En cours',
      priority: 'Moyen',
      assignedTo: 'Marie Dubois'
    },
    'ticket-3': {
      id: 'ticket-3',
      title: 'Allergie non prise en compte',
      status: 'Résolu',
      priority: 'Élevé',
      assignedTo: 'Marie Dubois'
    }
  };

  return tickets[ticketId as keyof typeof tickets] || null;
};

function TicketView({ ticketId, onBack }: TicketViewProps) {
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'public' | 'internal'>('public');
  
  // États pour les dropdowns
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [selectedAssignee, setSelectedAssignee] = useState('');

  // Récupération des données du ticket
  const ticket = ticketId ? getTicketData(ticketId) : null;

  // Initialiser les états avec les données du ticket
  useEffect(() => {
    if (ticket) {
      setSelectedStatus(ticket.status);
      setSelectedPriority(ticket.priority);
      setSelectedAssignee(ticket.assignedTo);
    }
  }, [ticket]);

  // Options pour les dropdowns
  const statusOptions = [
    { value: 'Ouvert', label: 'Ouvert' },
    { value: 'En cours', label: 'En cours' },
    { value: 'Résolu', label: 'Résolu' }
  ];

  const priorityOptions = [
    { value: 'Urgent', label: 'Urgent' },
    { value: 'Élevé', label: 'Élevé' },
    { value: 'Moyen', label: 'Moyen' },
    { value: 'Faible', label: 'Faible' }
  ];

  const assigneeOptions = [
    { value: 'Marie Dubois', label: 'Marie Dubois' },
    { value: 'Ahmed', label: 'Ahmed' },
    { value: 'Sophie Martin', label: 'Sophie Martin' },
    { value: 'Lucas Bernard', label: 'Lucas Bernard' }
  ];
  
  if (!ticketId) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-400">
        <div className="mb-4">
          <Ticket className="w-16 h-16 mx-auto text-gray-300" />
        </div>
        <h3 className="text-lg font-medium text-gray-600 mb-2">Sélectionnez un ticket</h3>
        <p className="text-sm text-gray-400">Choisissez un ticket dans la liste pour voir les détails</p>
      </div>
    );
  }

  if (!ticket) return null;

  const handleSendMessage = () => {
    if (message.trim()) {
      // Ici on pourrait envoyer le message
      console.log('Message envoyé:', message);
      console.log('Type:', messageType);
      setMessage('');
    }
  };

  // Fonction pour obtenir la couleur du statut
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ouvert':
        return 'bg-red-100 text-red-700';
      case 'En cours':
        return 'bg-orange-100 text-orange-700';
      case 'Résolu':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Fonction pour obtenir la couleur de priorité
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Élevé':
        return 'bg-red-100 text-red-700';
      case 'Moyen':
        return 'bg-orange-100 text-orange-700';
      case 'Faible':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="flex-1 bg-white flex flex-col">
      {/* Header */}
      <div className="px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-6 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-3 sm:mb-4 md:mb-6">
          <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
            {/* Bouton retour - responsive */}
            {onBack && (
              <button 
                onClick={onBack}
                title="Retour à la liste"
                className="p-1 sm:p-1.5 md:p-2 hover:bg-gray-100 rounded-full"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
              </button>
            )}
            
            <div>
              <h1 className="text-base sm:text-xl md:text-2xl font-medium text-orange-500 mb-1 break-words leading-tight">
                {ticket.title}
              </h1>
              <p className="text-xs sm:text-sm md:text-base text-gray-500">Ticket #{ticket.id.replace('ticket-', '')}</p>
            </div>
          </div>

          {/* Partie droite - Badges colorés responsive */}
          <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3">
            <span className={`px-2 py-1 sm:px-3 sm:py-1.5 md:px-6 md:py-2 rounded-full text-white font-medium text-xs sm:text-sm md:text-base ${
              selectedStatus === 'Ouvert' ? 'bg-red-500' : 
              selectedStatus === 'En cours' ? 'bg-orange-500' : 
              'bg-green-500'
            }`}>
              {selectedStatus}
            </span>
            <span className={`px-2 py-1 sm:px-3 sm:py-1.5 md:px-6 md:py-2 rounded-full text-white font-medium text-xs sm:text-sm md:text-base ${
              selectedPriority === 'Urgent' ? 'bg-red-500' : 
              selectedPriority === 'Élevé' ? 'bg-orange-500' : 
              selectedPriority === 'Moyen' ? 'bg-yellow-500' : 
              'bg-green-500'
            }`}>
              {selectedPriority}
            </span>
          </div>
        </div>
        
        {/* Controls - 3 dropdowns responsive */}
        <div className="flex items-start space-x-2 sm:items-center sm:space-x-4 md:space-x-8">
          {/* Statut */}
          <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 md:space-x-3">
            <span className="text-xs sm:text-sm md:text-base text-gray-800 font-normal whitespace-nowrap">Statut:</span>
            <CustomDropdown
              options={statusOptions}
              value={selectedStatus}
              onChange={setSelectedStatus}
              className="min-w-[60px] sm:min-w-[100px] md:min-w-[120px] text-xs sm:text-sm md:text-base"
            />
          </div>
          
          {/* Priorité */}
          <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 md:space-x-3">
            <span className="text-xs sm:text-sm md:text-base text-gray-800 font-normal whitespace-nowrap">Priorité:</span>
            <CustomDropdown
              options={priorityOptions}
              value={selectedPriority}
              onChange={setSelectedPriority}
              className="min-w-[60px] sm:min-w-[100px] md:min-w-[120px] text-xs sm:text-sm md:text-base"
            />
          </div>
          
          {/* Assigné à */}
          <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 md:space-x-3">
            <span className="text-xs sm:text-sm md:text-base text-gray-800 font-normal whitespace-nowrap">Assigné:</span>
            <CustomDropdown
              options={assigneeOptions}
              value={selectedAssignee}
              onChange={setSelectedAssignee}
              className="min-w-[70px] sm:min-w-[130px] md:min-w-[150px] text-xs sm:text-sm md:text-base"
            />
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 bg-gray-50">
        {/* Boutons Public/Interne */}
        <div className="m-4">
          <div className="bg-slate-100 p-2 rounded-2xl">
            {/* Version mobile - compacte */}
            <div className="flex sm:hidden gap-2">
              <button
                onClick={() => setMessageType('public')}
                className={`flex-1 flex items-center justify-center px-3 py-2 text-xs font-medium rounded-xl transition-colors ${
                  messageType === 'public' 
                    ? 'bg-white text-gray-700 shadow-sm' 
                    : 'text-gray-600'
                }`}
              >
                <Eye className="w-3 h-3 mr-1" />
                Public
              </button>
              <button
                onClick={() => setMessageType('internal')}
                className={`flex-1 flex items-center justify-center px-3 py-2 text-xs font-medium rounded-xl transition-colors ${
                  messageType === 'internal' 
                    ? 'bg-white text-gray-700 shadow-sm' 
                    : 'text-gray-600'
                }`}
              >
                <EyeOff className="w-3 h-3 mr-1" />
                Interne
              </button>
            </div>
            
            {/* Version tablette/desktop - normale */}
            <div className="hidden sm:flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => setMessageType('public')}
                className={`flex-1 flex items-center justify-center px-4 py-3 text-sm font-medium rounded-2xl transition-colors ${
                  messageType === 'public' 
                    ? 'bg-white text-gray-700 shadow-sm' 
                    : 'text-gray-600'
                }`}
              >
                <Eye className="w-4 h-4 mr-2" />
                Public (client voit)
              </button>
              <button
                onClick={() => setMessageType('internal')}
                className={`flex-1 flex items-center justify-center px-4 py-3 text-sm font-medium rounded-2xl transition-colors ${
                  messageType === 'internal' 
                    ? 'bg-white text-gray-700 shadow-sm' 
                    : 'text-gray-600'
                }`}
              >
                <EyeOff className="w-4 h-4 mr-2" />
                Interne (client ne voit pas)
              </button>
            </div>
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto bg-gray-50 md:px-6 md:py-4 px-4 py-3">
          <div className="md:space-y-6 space-y-4">
            {mockMessages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'agent' ? 'justify-end' : 'justify-start'}`}>
                {msg.sender === 'client' ? (
                  /* Message client à gauche */
                  <div className="flex items-start md:space-x-3 space-x-2 md:max-w-2xl max-w-xs">
                    <div className="md:w-10 md:h-10 w-8 h-8 rounded-full flex-shrink-0">
                      <Image
                        src={msg.avatar}
                        alt={msg.senderName}
                        width={40}
                        height={40}
                        className="md:w-10 md:h-10 w-8 h-8 rounded-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center md:space-x-2 space-x-1 mb-1">
                        <span className="md:text-sm text-xs font-medium text-gray-900">{msg.senderName}</span>
                        <span className="md:text-sm text-xs text-gray-400">{msg.timestamp}</span>
                      </div>
                      <div className="bg-white text-gray-900 md:px-4 md:py-3 px-3 py-2 rounded-2xl">
                        <p className="md:text-sm text-xs leading-relaxed">{msg.content}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Message agent à droite */
                  <div className="flex items-start md:space-x-3 space-x-2 md:max-w-2xl max-w-xs">
                    <div className="flex-1">
                      <div className="flex items-center justify-end md:space-x-2 space-x-1 mb-1">
                        <span className="md:text-sm text-xs font-medium text-gray-500">{msg.senderName}</span>
                        <span className="md:text-sm text-xs text-gray-500">manager</span>
                        <span className="md:text-sm text-xs text-gray-400">{msg.timestamp}</span>
                      </div>
                      <div className="bg-orange-500 text-white md:px-4 md:py-3 px-3 py-2 rounded-2xl ml-auto max-w-fit">
                        <p className="md:text-sm text-xs leading-relaxed">{msg.content}</p>
                      </div>
                    </div>
                    <div className="md:w-10 md:h-10 w-8 h-8 rounded-full flex-shrink-0">
                      <Image
                        src={msg.avatar}
                        alt={msg.senderName}
                        width={40}
                        height={40}
                        className="md:w-10 md:h-10 w-8 h-8 rounded-full object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Zone de saisie - Copiée exactement de ConversationView */}
      <div className="md:px-6 md:py-4 px-4 py-3 bg-white border-t border-slate-300">
        {/* Boutons Public/Interne */}
        <div className="flex md:mb-4 mb-3">
          <button
            onClick={() => setMessageType('public')}
            className={`flex items-center md:px-4 md:py-2 px-3 py-2 rounded-full md:text-sm text-xs font-medium md:mr-3 mr-2 ${
              messageType === 'public'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Eye className="md:w-4 md:h-4 w-3 h-3 md:mr-2 mr-1" />
            Public
          </button>
          <button
            onClick={() => setMessageType('internal')}
            className={`flex items-center md:px-4 md:py-2 px-3 py-2 rounded-full md:text-sm text-xs font-medium ${
              messageType === 'internal'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <EyeOff className="md:w-4 md:h-4 w-3 h-3 md:mr-2 mr-1" />
            Interne
          </button>
        </div>
        
        {/* Champ de saisie */}
        <div className="flex items-start md:space-x-3 space-x-2">
          <div className="flex-1">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={messageType === 'public' ? "Écrire un message public..." : "Écrire un message interne..."}
              className="w-full md:px-4 md:py-3 px-3 py-2 border border-gray-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent md:text-sm text-xs bg-gray-50"
              rows={3}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
          </div>
          <button
            title="Envoyer le message"
            onClick={handleSendMessage}
            disabled={!message.trim()}
            className="bg-orange-500 text-white md:p-3 p-2 rounded-full hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            <Send className="md:w-5 md:h-5 w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default TicketView;

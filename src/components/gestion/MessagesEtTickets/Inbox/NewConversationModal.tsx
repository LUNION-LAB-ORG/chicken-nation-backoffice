"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { X, Users, Loader2 } from 'lucide-react';
import { SearchableDropdown } from '@/components/ui/SearchableDropdown';
import { getRestaurantCustomers } from '@/services/customerService';
import { getAllUsers } from '../../../../../features/users/services/user.service';
import { useAuthStore } from '../../../../../features/users/hook/authStore';
import { useCollegues } from '../../../../../features/messagerie/hooks/use-collegues';
import toast from 'react-hot-toast';

interface NewConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateConversation: (conversationData: ConversationData) => void;
}

interface ConversationData {
  type: string;
  clientId?: string;
  restaurantId?: string;
  subject: string;
  initialMessage?: string;
  participantId?: string | null;
  /** Tous les participants d'un groupe interne, hors créateur. */
  participantIds?: string[];
}

// Types pour les options des dropdowns
interface ClientOption {
  id: string;
  label: string;
  email?: string;
  phone?: string;
  image?: string;
}



interface UserOption {
  id: string;
  label: string;
  email?: string;
  phone?: string;
  image?: string;
}

function NewConversationModal({ isOpen, onClose, onCreateConversation }: NewConversationModalProps) {
  // Récupérer l'utilisateur connecté
  const { user } = useAuthStore();

  // États du formulaire
  // ✅ Problème 3 : Définir le type par défaut selon le rôle
  const [conversationType, setConversationType] = useState(user?.role === 'ADMIN' ? 'Interne' : 'Avec client');
  /**
   * Seuls les responsables ouvrent un GROUPE : un groupe alerte tous ses
   * membres à chaque message. Le serveur applique la même règle, celle-ci
   * n'est là que pour ne pas proposer ce qui sera refusé.
   */
  const peutCreerGroupe = ['ADMIN', 'MANAGER', 'ASSISTANT_MANAGER'].includes(user?.role ?? '');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<string[]>([]);
  /** Deux destinataires ou plus, donc un groupe : le créateur s'y ajoute. */
  const estGroupe =
    conversationType === 'Interne' && selectedParticipantIds.length >= 2;
  const [subject, setSubject] = useState('');
  const [initialMessage, setInitialMessage] = useState('');

  // États des données
  const [clients, setClients] = useState<ClientOption[]>([]);
  const { collegues: users, chargement: isLoadingUsers } = useCollegues();

  // États de chargement
  const [isLoadingClients, setIsLoadingClients] = useState(false);


  // États de recherche
  const [clientSearchTerm, setClientSearchTerm] = useState('');


  // États d'erreur
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isCreating, setIsCreating] = useState(false);



  const loadClients = useCallback(async () => {
    if (!user?.restaurant_id) {
      setClients([]);
      return;
    }
    setIsLoadingClients(true);
    try {
      const clientsData = await getRestaurantCustomers(user.restaurant_id, {
        status: 'ACTIVE',
        search: clientSearchTerm.trim() || undefined
      });

      const formattedClients = clientsData.map(client => ({
        id: client.id,
        label: `${client.first_name || ''} ${client.last_name || ''}`.trim() || client.email || client.id,
        email: client.email || undefined,
        phone: client.phone || undefined,
        image: client.image || undefined
      }));

      setClients(formattedClients);
    } catch (error) {
      console.error('Erreur lors du chargement des clients:', error);
      setErrors(prev => ({ ...prev, clients: 'Erreur lors du chargement des clients' }));
      toast.error('Chargement des clients impossible');
    } finally {
      setIsLoadingClients(false);
    }
  }, [clientSearchTerm, user?.restaurant_id]);

  /**
   * La liste des collègues sélectionnables vient d'un point unique
   * (`useCollegues`) : la règle est subtile — un administrateur doit voir TOUT
   * le personnel, un responsable de point de vente seulement son équipe — et
   * elle a déjà été fausse une fois, les agents de terrain étant alors
   * invisibles. Une seule copie, un seul endroit à corriger.
   */

  // Charger les données au montage du composant
  useEffect(() => {
    if (isOpen) {
      // Ne charger les clients que si l'utilisateur n'est pas admin
      if (user?.role !== 'ADMIN') {
        loadClients();
      }
    }
  }, [isOpen, loadClients, user?.role]);

  // Recherche avec debounce pour les clients
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (clientSearchTerm.trim() && conversationType === 'Avec client' && user?.role !== 'ADMIN') {
        loadClients();
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [clientSearchTerm, conversationType, loadClients, user?.role]);

  // Validation du formulaire
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!subject.trim()) {
      newErrors.subject = 'Le sujet est obligatoire';
    }

    if (conversationType === 'Avec client') {
      if (!selectedClientId) {
        newErrors.client = 'Veuillez sélectionner un client';
      }
      if (!user?.restaurant_id) {
        newErrors.restaurant = 'Aucun restaurant associé à votre compte';
      }
    }

    if (conversationType === 'Interne' && selectedParticipantIds.length === 0) {
      newErrors.participants = 'Veuillez sélectionner un participant';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateConversation = async () => {
    if (!validateForm()) return;

    setIsCreating(true);
    try {
      const conversationData: ConversationData = {
        type: conversationType,
        subject,
        initialMessage: initialMessage.trim() || undefined,
        ...(conversationType === 'Avec client' && {
          clientId: selectedClientId,
          restaurantId: user?.restaurant_id
        }),
        ...(conversationType === 'Interne' && {
          // La liste ENTIERE : un seul identifiant fait une conversation à deux,
          // deux ou plus font un groupe. C'est le serveur qui tranche.
          participantIds: selectedParticipantIds,
          participantId: selectedParticipantIds[0] || undefined,
          restaurantId: user?.restaurant_id
        })
      };

      console.log('🔄 [NewConversationModal] Données du formulaire:', conversationData);
      await onCreateConversation(conversationData);

      // Réinitialiser et fermer
      resetForm();
      onClose();
      toast.success('Conversation créée');
    } catch (error) {
      console.error('Erreur lors de la création de la conversation:', error);
      toast.error("La conversation n'a pas pu être créée");
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancel = () => {
    onClose();
    resetForm();
  };

  const resetForm = () => {
    // ✅ Problème 3 : Réinitialiser selon le rôle
    setConversationType(user?.role === 'ADMIN' ? 'Interne' : 'Avec client');
    setSelectedClientId('');
    setSelectedParticipantIds([]);
    setSubject('');
    setInitialMessage('');
    setErrors({});
    setClientSearchTerm('');
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-2xl md:w-[800px] lg:w-[900px] xl:w-[1000px] w-[95%] max-w-[1000px] mx-4 max-h-[95vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between md:p-6 p-4 pb-0">
          <h2 className="text-xl font-semibold text-[#F17922]">
            Nouvelle conversation
          </h2>
          <button
            onClick={onClose}
            title="Fermer"
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="md:w-6 md:h-6 w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="md:p-6 p-4 pt-2">
          <p className="text-black md:text-sm text-xs mb-6">
            Créer une nouvelle conversation avec un client ou une conversation interne.
          </p>

          {/* Messages d'erreur globaux */}
          {(errors.clients || errors.restaurants) && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              {errors.clients && <p className="text-red-600 text-sm">{errors.clients}</p>}
              {errors.restaurants && <p className="text-red-600 text-sm">{errors.restaurants}</p>}
            </div>
          )}

          {/* Type de conversation - Boutons horizontaux */}
          {/* ✅ Problème 3 : Masquer "Avec client" pour les admins */}
          {user?.role !== 'ADMIN' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-black mb-3">
                Type de conversation
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setConversationType('Avec client')}
                  className={`px-6 py-2.5 rounded-xl border-2 transition-all  font-medium text-sm ${conversationType === 'Avec client'
                    ? 'border-[#F17922] bg-gradient-to-r from-[#F17922] to-orange-600 text-white'
                    : 'border-gray-200 bg-white cursor-pointer text-black hover:border-gray-300 hover:bg-gray-50'
                    }`}
                >
                  Avec client
                </button>
                <button
                  type="button"
                  onClick={() => setConversationType('Interne')}
                  className={`px-6 py-2.5 rounded-xl border-2 transition-all font-medium text-sm flex items-center justify-center gap-2 ${conversationType === 'Interne'
                    ? 'border-[#F17922] bg-gradient-to-r from-[#F17922] to-orange-600 text-white'
                    : 'border-gray-200 bg-white cursor-pointer text-black hover:border-gray-300 hover:bg-gray-50'
                    }`}
                >
                  <Users className="w-4 h-4" />
                  Interne
                </button>
              </div>
            </div>
          )}

          {/* Champs conditionnels selon le type */}
          {conversationType === 'Avec client' ? (
            <>
              {/* Client avec recherche */}
              <SearchableDropdown
                label="Client"
                placeholder="Rechercher un client..."
                options={clients}
                value={selectedClientId}
                onChange={(value) => setSelectedClientId(Array.isArray(value) ? (value[0] as string) ?? '' : (value as string) ?? '')}
                onSearchChange={setClientSearchTerm}
                isLoading={isLoadingClients}
                error={errors.client}
                required
                className="mb-6"
              />

              {/* Pas de participants pour les conversations avec client */}
            </>
          ) : (
            // Conversation interne
            <>
              {/* Participants avec recherche */}
              <SearchableDropdown
                label={peutCreerGroupe ? 'Participants' : 'Destinataire'}
                placeholder="Rechercher des employés..."
                options={users}
                value={peutCreerGroupe ? selectedParticipantIds : selectedParticipantIds[0] || ''}
                onChange={(value) =>
                  setSelectedParticipantIds(
                    Array.isArray(value)
                      ? (value as string[])
                      : value
                        ? [value as string]
                        : [],
                  )
                }
                isLoading={isLoadingUsers}
                error={errors.participants}
                required
                multiSelect={peutCreerGroupe}
                className="mb-2"
              />
              <p className="md:text-xs text-[11px] text-[#9796A1] mb-6">
                {peutCreerGroupe
                  ? estGroupe
                    ? `Groupe de ${selectedParticipantIds.length + 1} personnes, vous compris. Donnez-lui un nom ci-dessous.`
                    : 'Choisissez deux collègues ou plus pour créer un groupe.'
                  : 'Conversation à deux.'}
              </p>
            </>
          )}

          {/* Sujet */}
          <div className="mb-6">
            <label className="block md:text-sm text-xs font-medium text-black mb-2">
              {estGroupe ? 'Nom du groupe' : 'Sujet de la conversation'}
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ex: Problème avec commande #12345"
              className={`w-full md:px-4 md:py-4 px-3 py-3 border rounded-xl md:text-sm text-xs text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F17922] ${errors.subject ? 'border-red-500' : 'border-gray-300'
                }`}
            />
            {errors.subject && (
              <p className="mt-1 text-xs text-red-500">{errors.subject}</p>
            )}
          </div>

          {/* Message initial */}
          <div className="mb-16">
            <label className="block md:text-sm text-xs font-medium text-black mb-2">
              Message initial (optionnel)
            </label>
            <textarea
              value={initialMessage}
              onChange={(e) => setInitialMessage(e.target.value)}
              placeholder="Tapez votre message initial..."
              rows={4}
              className="w-full md:px-4 md:py-4 px-3 py-3 border border-gray-300 rounded-xl md:text-sm text-xs text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F17922] focus:border-[#F17922] resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={handleCancel}
              disabled={isCreating}
              className="md:px-6 md:py-3 px-4 py-2 cursor-pointer  border border-gray-300 text-black rounded-xl md:text-sm text-xs font-medium hover:text-white hover:border-white hover:bg-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Annuler
            </button>
            <button
              onClick={handleCreateConversation}
              disabled={isCreating || !subject.trim()}
              className="md:px-6 md:py-3 px-4 py-2 cursor-pointer bg-[#F17922] text-white rounded-xl md:text-sm text-xs font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Création...
                </>
              ) : (
                'Créer la conversation'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NewConversationModal;

"use client";

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { CustomDropdown } from '@/components/ui/CustomDropdown';
import { useQuery } from '@tanstack/react-query';
import { useCreateTicketMutation } from '@/hooks/useTicketsQuery';
import { useTicketCategoriesQuery } from '@/hooks/useTicketCategoriesQuery';
import { useCustomersQuery } from '@/hooks/useCustomersQuery';
import { useAuthStore } from '@/store/authStore';
import { getRestaurantUsers } from '@/services/restaurantService';
import { CreateTicketRequest, TicketPriority } from '@/types/tickets';
import { TICKET_PRIORITY_LABELS, TICKET_CATEGORY_LABELS } from '@/types/tickets';

interface NewTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId?: string;
  clientId?: string;
  clientName?: string;
}

function NewTicketModal({
  isOpen,
  onClose,
  conversationId,
  clientId,
  clientName
}: NewTicketModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('MEDIUM');
  const [category, setCategory] = useState('');
  const [selectedClientId, setSelectedClientId] = useState(clientId || '');
  const [assignedToId, setAssignedToId] = useState('');

  // Hooks pour les données
  const { user } = useAuthStore();
  const { data: categoriesData, isLoading: isLoadingCategories, error: categoriesError } = useTicketCategoriesQuery();
  const { customers: customersData, isLoading: isLoadingCustomers } = useCustomersQuery({});

  // Hook pour récupérer les utilisateurs du restaurant
  const { data: restaurantUsers, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['restaurant-users', user?.restaurant_id],
    queryFn: () => getRestaurantUsers(user!.restaurant_id!),
    enabled: !!user?.restaurant_id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const createTicketMutation = useCreateTicketMutation();

  // Réinitialiser le formulaire quand le modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDescription('');
      setPriority('MEDIUM');
      setCategory('');
      setSelectedClientId(clientId || '');
      setAssignedToId('');
    }
  }, [isOpen, clientId]);

  // Options pour les dropdowns
  const priorityOptions = Object.entries(TICKET_PRIORITY_LABELS).map(([value, label]) => ({
    value: value as TicketPriority,
    label
  }));

  const categoryOptions = Array.isArray(categoriesData)
    ? categoriesData.map(cat => ({
      value: cat.id,
      label: cat.name
    }))
    : categoriesData?.data?.map(cat => ({
      value: cat.id,
      label: cat.name
    })) || [];

  const customerOptions = customersData?.map(customer => ({
    value: customer.id,
    label: `${customer.first_name} ${customer.last_name}`.trim() || customer.email || customer.phone
  })) || [];

  // Agents disponibles (utilisateurs du restaurant)
  const agentOptions = restaurantUsers?.map(user => ({
    value: user.id,
    label: `${user.fullname} (${user.role})`
  })) || [];

  const handleSubmit = async () => {
    if (!title.trim()) {
      alert('Le titre est obligatoire');
      return;
    }

    if (!selectedClientId) {
      alert('Veuillez sélectionner un client');
      return;
    }

    if (!category) {
      alert('Veuillez sélectionner une catégorie');
      return;
    }

    const ticketData: CreateTicketRequest = {
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      category: category as any, // Sera mappé selon vos types
      clientId: selectedClientId,
      assignedToId: assignedToId || undefined,
      conversationId: conversationId || undefined,
    };

    console.log('🎯 [NewTicketModal] Données du ticket à créer:', ticketData);
    console.log('🎯 [NewTicketModal] Catégorie sélectionnée:', category);
    console.log('🎯 [NewTicketModal] Client sélectionné:', selectedClientId);

    try {
      await createTicketMutation.mutateAsync(ticketData);
      onClose();
      // Optionnel : afficher une notification de succès
    } catch (error) {
      console.error('Erreur lors de la création du ticket:', error);
      // Optionnel : afficher une notification d'erreur
    }
  };

  const handleCancel = () => {
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/70 bg-opacity-40 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-2xl md:w-[700px] lg:w-[750px] xl:w-[800px] w-[90%] max-w-[800px] mx-4 max-h-[96vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between md:p-6 p-4 pb-4">
          <h2 className="md:text-xl text-lg font-semibold text-[#F17922]">
            {conversationId ? 'Escalader en ticket' : 'Créer un nouveau ticket'}
          </h2>
          <button
            onClick={onClose}
            title="Fermer le modal"
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="md:w-6 md:h-6 w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="md:p-6 p-4 pt-2">
          {conversationId && (
            <p className="text-gray-600 md:text-sm text-xs mb-6">
              Créer un ticket pour cette conversation permettra un suivi plus structuré.
            </p>
          )}

          {/* Titre du ticket */}
          <div className="mb-6">
            <label className="block md:text-sm text-xs font-medium text-gray-700 mb-2">
              Titre du ticket *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Problème de qualité produit"
              className="w-full md:px-4 md:py-3 px-3 py-2.5 text-gray-700 border border-gray-300 rounded-xl md:text-sm text-xs placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F17922] focus:border-[#F17922]"
            />
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block md:text-sm text-xs font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez le problème en détail..."
              rows={4}
              className="w-full md:px-4 md:py-3 text-gray-700 px-3 py-2.5 border border-gray-300 rounded-xl md:text-sm text-xs placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F17922] focus:border-[#F17922] resize-none"
            />
          </div>

          {/* Client */}
          {!clientId && (
            <div className="mb-6">
              <CustomDropdown
                label="Client *"
                options={customerOptions}
                value={selectedClientId}
                onChange={setSelectedClientId}
                placeholder={isLoadingCustomers ? "Chargement..." : "Sélectionner un client"}
                className="w-full"
                disabled={isLoadingCustomers}
              />
            </div>
          )}

          {clientName && (
            <div className="mb-6">
              <label className="block md:text-sm text-xs font-medium text-gray-700 mb-2">
                Client
              </label>
              <div className="w-full md:px-4 md:py-3 px-3 py-2.5 border border-gray-200 rounded-xl md:text-sm text-xs bg-gray-50 text-gray-700">
                {clientName}
              </div>
            </div>
          )}

          {/* Priorité */}
          <div className="mb-6">
            <CustomDropdown
              label="Priorité *"
              options={priorityOptions}
              value={priority}
              onChange={(value) => setPriority(value as TicketPriority)}
              placeholder="Sélectionner une priorité"
              className="w-full"
            />
          </div>

          {/* Catégorie */}
          <div className="mb-6">
            <CustomDropdown
              label="Catégorie *"
              options={categoryOptions}
              value={category}
              onChange={setCategory}
              placeholder={isLoadingCategories ? "Chargement..." : "Sélectionner une catégorie"}
              className="w-full"
              disabled={isLoadingCategories}
            />
          </div>

          {/* Assigner à */}
          <div className="mb-8">
            <CustomDropdown
              label="Assigner à"
              options={agentOptions}
              value={assignedToId}
              onChange={setAssignedToId}
              placeholder={isLoadingUsers ? "Chargement..." : "Sélectionner un agent (optionnel)"}
              className="w-full"
              disabled={isLoadingUsers}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={handleCancel}
              disabled={createTicketMutation.isPending}
              className="md:px-6 md:py-3 px-4 py-2 cursor-pointer border border-gray-300 text-gray-700 rounded-xl md:text-sm text-xs font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={!title.trim() || !selectedClientId || !category || createTicketMutation.isPending}
              className="md:px-6 md:py-3 px-4 py-2 cursor-pointer bg-[#F17922] text-white rounded-xl md:text-sm text-xs font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {createTicketMutation.isPending ? 'Création...' : 'Créer le ticket'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NewTicketModal;
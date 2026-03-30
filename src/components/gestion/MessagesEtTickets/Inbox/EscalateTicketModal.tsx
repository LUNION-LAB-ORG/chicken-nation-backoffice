"use client";

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { CustomDropdown } from '@/components/ui/CustomDropdown';
import { useEscaladerConversationMutation } from '../../../../../features/messagerie';
import { useTicketCategoriesQuery } from '@/hooks/useTicketCategoriesQuery';
import type { TicketPriorite } from '../../../../../features/messagerie';
import toast from 'react-hot-toast';

interface EscalateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  clientName?: string;
}

const PRIORITY_MAP: Record<string, TicketPriorite> = {
  'LOW': 'LOW',
  'MEDIUM': 'MEDIUM',
  'HIGH': 'HIGH',
};

function EscalateTicketModal({ isOpen, onClose, conversationId, clientName }: EscalateTicketModalProps) {
  const [ticketSubject, setTicketSubject] = useState('');
  const [priority, setPriority] = useState<string>('MEDIUM');
  const [categoryId, setCategoryId] = useState('');

  const escalateMutation = useEscaladerConversationMutation();
  const { data: categoriesData } = useTicketCategoriesQuery({}, isOpen);

  const categories = categoriesData?.data || [];

  const priorityOptions = [
    { value: 'LOW', label: 'Faible' },
    { value: 'MEDIUM', label: 'Moyen' },
    { value: 'HIGH', label: 'Élevé' },
  ];

  const categoryOptions = categories.map((cat: any) => ({
    value: cat.id,
    label: cat.name,
  }));

  const handleCreateTicket = async () => {
    if (!ticketSubject.trim()) {
      toast.error('Le sujet du ticket est requis');
      return;
    }

    try {
      await escalateMutation.mutateAsync({
        conversationId,
        title: ticketSubject.trim(),
        priority: PRIORITY_MAP[priority] || 'MEDIUM',
        category: categoryId || undefined,
      } as any);

      toast.success('Conversation escaladée en ticket');
      onClose();
      resetForm();
    } catch (error) {
      console.error('Erreur lors de l\'escalation:', error);
      toast.error('Impossible d\'escalader la conversation');
    }
  };

  const resetForm = () => {
    setTicketSubject('');
    setPriority('MEDIUM');
    setCategoryId('');
  };

  const handleCancel = () => {
    onClose();
    resetForm();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/70 bg-opacity-40 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-2xl md:w-[700px] lg:w-[750px] xl:w-[800px] w-[90%] max-w-[800px] mx-4 max-h-[96vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between md:p-6 p-4 pb-4 ">
          <h2 className="md:text-xl text-lg font-semibold text-[#F17922]">
            Escalader en ticket
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
          <p className="text-gray-600 md:text-sm text-xs mb-6">
            Créer un ticket pour cette conversation{clientName ? ` avec ${clientName}` : ''} permettra un suivi plus structuré.
          </p>

          {/* Sujet du ticket */}
          <div className="mb-6">
            <label className="block md:text-sm text-xs font-medium text-gray-700 mb-2">
              Sujet du ticket
            </label>
            <input
              type="text"
              value={ticketSubject}
              onChange={(e) => setTicketSubject(e.target.value)}
              placeholder="Ex: Problème de qualité produit"
              className="w-full md:px-4 md:py-3 px-3 py-2.5 border border-gray-300 rounded-xl md:text-sm text-xs placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F17922] focus:border-[#F17922]"
            />
          </div>

          {/* Priorité */}
          <div className="mb-6">
            <CustomDropdown
              label="Priorité"
              options={priorityOptions}
              value={priority}
              onChange={setPriority}
              placeholder="Sélectionner une priorité"
              className="w-full"
            />
          </div>

          {/* Catégorie */}
          {categoryOptions.length > 0 && (
            <div className="mb-6">
              <CustomDropdown
                label="Catégorie"
                options={categoryOptions}
                value={categoryId}
                onChange={setCategoryId}
                placeholder="Sélectionner une catégorie"
                className="w-full"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 mt-8">
            <button
              onClick={handleCancel}
              className="md:px-6 md:py-3 px-4 py-2 cursor-pointer border border-gray-300 text-gray-700 rounded-xl md:text-sm text-xs font-medium hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleCreateTicket}
              disabled={!ticketSubject.trim() || escalateMutation.isPending}
              className="md:px-6 md:py-3 px-4 py-2 cursor-pointer bg-[#F17922] text-white rounded-xl md:text-sm text-xs font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {escalateMutation.isPending ? 'Création...' : 'Créer le ticket'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EscalateTicketModal;

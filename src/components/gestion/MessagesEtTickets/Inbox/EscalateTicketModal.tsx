"use client";

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { CustomDropdown } from '@/components/ui/CustomDropdown';

interface EscalateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  clientName?: string;
}

function EscalateTicketModal({ isOpen, onClose  }: EscalateTicketModalProps) {
  const [ticketSubject, setTicketSubject] = useState('');
  const [priority, setPriority] = useState('Moyen');
  const [category, setCategory] = useState('');
  const [assignedTo, setAssignedTo] = useState('');

  // Données mockées pour les options
  const priorities = ['Faible', 'Moyen', 'Élevé', 'Urgent'];
  const categories = [
    'Qualité produit',
    'Livraison', 
    'Service client',
    'Facturation', 
    'Autre'
  ];
  const employees = [
    'Ahmed Hassan', 
    'Jean Martin'
  ];

  // Préparer les options pour les dropdowns
  const priorityOptions = priorities.map(p => ({ value: p, label: p }));
  const categoryOptions = categories.map(cat => ({ value: cat, label: cat }));
  const employeeOptions = employees.map(emp => ({ value: emp, label: emp }));

  const handleCreateTicket = () => {
    if (!ticketSubject.trim()) {
   
      return;
    }

 

    // Fermer le modal et réinitialiser
    onClose();
    setTicketSubject('');
    setPriority('Moyen');
    setCategory('');
    setAssignedTo('');
  };

  const handleCancel = () => {
    onClose();
    // Réinitialiser les champs
    setTicketSubject('');
    setPriority('Moyen');
    setCategory('');
    setAssignedTo('');
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/70 bg-opacity-40 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-2xl md:w-[700px] lg:w-[750px] xl:w-[800px] w-[90%] max-w-[800px] mx-4 max-h-[96vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between md:p-6 p-4 pb-4 ">
          <h2 className="md:text-xl text-3xl font-semibold text-primary-500">
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
            Créer un ticket pour cette conversation permettra un suivi plus structuré.
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
              className="w-full md:px-4 md:py-3 px-3 py-2.5 border border-gray-300 rounded-xl md:text-sm text-xs placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
          <div className="mb-6">
            <CustomDropdown
              label="Catégorie"
              options={categoryOptions}
              value={category}
              onChange={setCategory}
              placeholder="Sélectionner une catégorie"
              className="w-full"
            />
          </div>

          {/* Assigner à */}
          <div className="mb-20">
            <CustomDropdown
              label="Assigner à"
              options={employeeOptions}
              value={assignedTo}
              onChange={setAssignedTo}
              placeholder="Sélectionner un employé"
              className="w-full"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3  ">
            <button
              onClick={handleCancel}
              className="md:px-6 md:py-3 px-4 py-2 cursor-pointer border border-gray-300 text-gray-700 rounded-xl md:text-sm text-xs font-medium hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleCreateTicket}
              disabled={!ticketSubject.trim()}
              className="md:px-6 md:py-3 px-4 py-2 cursor-pointer bg-primary-500 text-white rounded-xl md:text-sm text-xs font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Créer le ticket
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EscalateTicketModal;

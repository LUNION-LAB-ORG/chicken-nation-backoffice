"use client";

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useCreateTicketCategoryMutation } from '@/hooks/useTicketCategoriesQuery';

interface NewCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function NewCategoryModal({ isOpen, onClose }: NewCategoryModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const createCategoryMutation = useCreateTicketCategoryMutation();

  // Réinitialiser le formulaire quand le modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      setName('');
      setDescription('');
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      alert('Le nom de la catégorie est obligatoire');
      return;
    }

    const categoryData = {
      name: name.trim(),
      description: description.trim() || undefined,
    };

    console.log('🎯 [NewCategoryModal] Tentative de création de catégorie:', categoryData);

    try {
      const result = await createCategoryMutation.mutateAsync(categoryData);
      console.log('✅ [NewCategoryModal] Catégorie créée avec succès:', result);
      onClose();
      alert('Catégorie créée avec succès !');
    } catch (error) {
      console.error('❌ [NewCategoryModal] Erreur lors de la création de la catégorie:', error);
      
      // Gestion spécifique des erreurs
      let errorMessage = 'Erreur inconnue';
      
      if (error instanceof Error) {
        if (error.message.includes('409') || error.message.includes('Conflict')) {
          errorMessage = `La catégorie "${name}" existe déjà. Choisissez un autre nom.`;
        } else if (error.message.includes('401')) {
          errorMessage = 'Vous n\'êtes pas autorisé à créer des catégories.';
        } else if (error.message.includes('403')) {
          errorMessage = 'Accès refusé. Vérifiez vos permissions.';
        } else {
          errorMessage = error.message;
        }
      }
      
      alert(`Erreur: ${errorMessage}`);
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
      <div className="bg-white rounded-2xl md:w-[600px] lg:w-[650px] w-[90%] max-w-[650px] mx-4 max-h-[96vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between md:p-6 p-4 pb-4">
          <h2 className="md:text-xl text-lg font-semibold text-[#F17922]">
            Créer une catégorie de ticket
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
            Créez une nouvelle catégorie pour organiser vos tickets de support.
          </p>

          {/* Nom de la catégorie */}
          <div className="mb-6">
            <label className="block md:text-sm text-xs font-medium text-gray-700 mb-2">
              Nom de la catégorie *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Livraison, Qualité produit, Service client..."
              className="w-full md:px-4 md:py-3 px-3 py-2.5 border text-slate-700 border-gray-300 rounded-xl md:text-sm text-xs placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F17922] focus:border-[#F17922]"
              maxLength={100}
            />
            <div className="text-right text-xs text-gray-400 mt-1">
              {name.length}/100
            </div>
          </div>

          {/* Description */}
          <div className="mb-8">
            <label className="block md:text-sm text-xs font-medium text-gray-700 mb-2">
              Description (optionnelle)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez le type de problèmes que cette catégorie couvre..."
              rows={4}
              className="w-full md:px-4 md:py-3 px-3 py-2.5 text-slate-700 border border-gray-300 rounded-xl md:text-sm text-xs placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F17922] focus:border-[#F17922] resize-none"
              maxLength={500}
            />
            <div className="text-right text-xs text-gray-400 mt-1">
              {description.length}/500
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={handleCancel}
              disabled={createCategoryMutation.isPending}
              className="md:px-6 md:py-3 px-4 py-2 cursor-pointer border border-gray-300 text-gray-700 rounded-xl md:text-sm text-xs font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={!name.trim() || createCategoryMutation.isPending}
              className="md:px-6 md:py-3 px-4 py-2 cursor-pointer bg-[#F17922] text-white rounded-xl md:text-sm text-xs font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {createCategoryMutation.isPending ? 'Création...' : 'Créer la catégorie'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NewCategoryModal;
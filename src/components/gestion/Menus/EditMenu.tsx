import React from 'react'
import { MenuItem } from '@/types'
import EditMenuForm from './EditMenuForm';

interface EditMenuProps {
  menu: MenuItem;
  onCancel?: () => void;
  onSave?: (updatedMenu: MenuItem) => void;
}

const EditMenu = ({ menu, onCancel, onSave }: EditMenuProps) => {
  console.log('🔄 EditMenu rendu avec:', {
    id: menu.id,
    nom: menu.name,
    prix: menu.price,
    prixReduit: menu.promotion_price,
    promotion: menu.is_promotion
  });

  // Fonction wrapper pour logger les mises à jour
  const handleSave = (updatedMenu: MenuItem) => {
    console.log('📝 handleSave appelé avec:', {
      id: updatedMenu.id,
      nom: updatedMenu.name,
      prix: updatedMenu.price,
      prixReduit: updatedMenu.promotion_price,
      promotion: updatedMenu.is_promotion
    });

    if (!onSave) {
      console.warn('⚠️ Aucune fonction onSave fournie');
      return;
    }

    try {
      console.log('💾 Tentative de sauvegarde...');
      onSave(updatedMenu);
      console.log('✅ Sauvegarde réussie');
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde:', error);
    }
  };

  const handleCancel = () => {
    console.log('❌ Annulation demandée');
    onCancel?.();
  };

  return (
    <EditMenuForm
      initialData={menu}
      onCancel={handleCancel}
      onSubmit={handleSave}
    />
  )
}

export default EditMenu
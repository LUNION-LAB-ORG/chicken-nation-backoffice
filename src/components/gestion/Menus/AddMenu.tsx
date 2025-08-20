import React from 'react'
import { MenuItem } from '@/types'
import AddMenuForm from './AddMenuForm';

interface AddMenuProps {
  onCancel?: () => void;
  onSave?: (newMenu: MenuItem) => void;
}

const AddMenu = ({ onCancel, onSave }: AddMenuProps) => {
  return (
    <AddMenuForm
      onCancel={onCancel}
      onSubmit={onSave || (() => {})}
    />
  )
}

export default AddMenu
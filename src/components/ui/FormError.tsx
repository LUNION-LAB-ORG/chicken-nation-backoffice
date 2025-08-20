import React from 'react';
import { AlertCircle } from 'lucide-react';

// Composant pour afficher les erreurs de validation
export const FormError = ({ errors }: { errors: string[] }) => {
  if (!errors || errors.length === 0) return null;
  
  return (
    <div className="flex items-center mt-1 text-red-500 text-xs">
      <AlertCircle className="w-3 h-3 mr-1" />
      <span>{errors[0]}</span>
    </div>
  );
};

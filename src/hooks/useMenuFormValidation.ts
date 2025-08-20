import { useState } from 'react';
import { z } from 'zod';
import { toast } from 'react-hot-toast';

// Type pour les erreurs de validation
export type ValidationErrors = Record<string, string[]>;

// Schéma de validation pour le formulaire de menu
const menuFormSchema = z.object({
  title: z.string().min(1, 'Le titre est requis'),
  description: z.string().min(1, 'La description est requise'),
  price: z.string().min(1, 'Le prix est requis'),
  reducedPrice: z.string().optional(),
  reduction: z.boolean(),
  category: z.array(z.string()).min(1, 'La catégorie est requise'),
  restaurant: z.string().min(1, 'Le restaurant est requis'),
  supplements: z.record(z.any()).optional(),
});

// Hook personnalisé pour la validation du formulaire
export const useMenuFormValidation = () => {
  const [errors, setErrors] = useState<ValidationErrors>({});

  // Fonction pour valider le formulaire
  const validateForm = (data: unknown): boolean => {
    const validationResult = menuFormSchema.safeParse(data);

    if (!validationResult.success) {
      // Formater les erreurs de validation
      const formattedErrors: ValidationErrors = {};
      validationResult.error.errors.forEach(error => {
        const path = error.path.join('.');
        if (!formattedErrors[path]) {
          formattedErrors[path] = [];
        }
        formattedErrors[path].push(error.message);
      });

      setErrors(formattedErrors);
      toast.error('Veuillez corriger les erreurs dans le formulaire');
      return false;
    }

     setErrors({});
    return true;
  };

  return {
    errors,
    setErrors,
    validateForm
  };
};

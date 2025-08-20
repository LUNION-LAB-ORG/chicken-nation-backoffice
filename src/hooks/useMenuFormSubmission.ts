import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { MenuItem } from '@/types';

interface FormData {
  title: string;
  description: string;
  price: string;
  reducedPrice: string;
  reduction: boolean;
  category: string[];
  restaurant: string;
}

interface SupplementOption {
  value: string;
  label: string;
  image?: string;
}

interface SubmissionData {
  formData: FormData;
  selectedIngredients: string[];
  selectedAccompagnements: string[];
  selectedBoissons: string[];
  ingredientQuantities: Record<string, number>;
  accompagnementQuantities: Record<string, number>;
  boissonQuantities: Record<string, number>;
  ingredientOptions: SupplementOption[];
  accompagnementOptions: SupplementOption[];
  boissonOptions: SupplementOption[];
  selectedRestaurants: string[];
  imageData: {
    image: string;
    imageUrl: string;
  };
}

export const useMenuFormSubmission = (initialData?: MenuItem) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const prepareDishSupplements = (data: SubmissionData) => {
    const dishSupplements = [
      ...data.selectedIngredients.map(id => {
        const option = data.ingredientOptions.find(opt => opt.value === id);
        return {
          supplement_id: id,
          quantity: data.ingredientQuantities[id] || 1,
          supplement: {
            id,
            name: option?.label || '',
            type: 'ACCESSORY'
          }
        };
      }),
      ...data.selectedAccompagnements.map(id => {
        const option = data.accompagnementOptions.find(opt => opt.value === id);
        return {
          supplement_id: id,
          quantity: data.accompagnementQuantities[id] || 1,
          supplement: {
            id,
            name: option?.label || '',
            type: 'FOOD'
          }
        };
      }),
      ...data.selectedBoissons.map(id => {
        const option = data.boissonOptions.find(opt => opt.value === id);
        return {
          supplement_id: id,
          quantity: data.boissonQuantities[id] || 1,
          supplement: {
            id,
            name: option?.label || '',
            type: 'DRINK'
          }
        };
      })
    ];

    return dishSupplements;
  };

  const prepareSupplementsStructure = (data: SubmissionData) => {
    return {
      ACCESSORY: data.selectedIngredients.map(id => {
        const option = data.ingredientOptions.find(opt => opt.value === id);
        return {
          id,
          name: option?.label || '',
          price: '0',
          quantity: data.ingredientQuantities[id] || 1,
          category: 'ACCESSORY' as const,
          isAvailable: true
        };
      }),
      FOOD: data.selectedAccompagnements.map(id => {
        const option = data.accompagnementOptions.find(opt => opt.value === id);
        return {
          id,
          name: option?.label || '',
          price: '0',
          quantity: data.accompagnementQuantities[id] || 1,
          category: 'FOOD' as const,
          isAvailable: true
        };
      }),
      DRINK: data.selectedBoissons.map(id => {
        const option = data.boissonOptions.find(opt => opt.value === id);
        return {
          id,
          name: option?.label || '',
          price: '0',
          quantity: data.boissonQuantities[id] || 1,
          category: 'DRINK' as const,
          isAvailable: true
        };
      })
    };
  };

  const validateSubmissionData = (data: SubmissionData): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!data.formData.title?.trim()) {
      errors.push('Le titre est obligatoire');
    }

    if (!data.formData.price?.trim()) {
      errors.push('Le prix est obligatoire');
    }

    if (data.formData.reduction && (!data.formData.reducedPrice || Number(data.formData.reducedPrice) >= Number(data.formData.price))) {
      errors.push('Le prix réduit doit être inférieur au prix normal');
    }

    return {
      isValid: errors.length === 0,
      errors
    };  };

  const transformToMenuItem = (data: SubmissionData): MenuItem => {
    const dishSupplements = prepareDishSupplements(data);
    const supplements = prepareSupplementsStructure(data);
    
    return {
      id: initialData?.id || '',
      name: data.formData.title,
      categoryId: data.formData.category[0],
      price: data.formData.price,
      description: data.formData.description,
      image: data.imageData.image,
      imageUrl: data.imageData.imageUrl,
      isAvailable: true,
      isNew: false,
      restaurant: '',
      restaurantId: data.selectedRestaurants.length > 0 ? data.selectedRestaurants[0] :
                   (data.formData.restaurant || ''),
      supplements,
      reviews: [],
      totalReviews: 0,
      is_promotion: data.formData.reduction === true,
      promotion_price: data.formData.reduction ? data.formData.reducedPrice : '0',
      dish_supplements: dishSupplements
    };
  };

  const submitForm = async (
    data: SubmissionData, 
    onSubmit: (menuData: MenuItem) => void
  ): Promise<boolean> => {
    if (isSubmitting) {
      return false;
    }

    setIsSubmitting(true);

    try {
      // Validation des données
      const validation = validateSubmissionData(data);
      if (!validation.isValid) {
        validation.errors.forEach(error => toast.error(error));
        return false;
      }

      // Transformation des données
      const menuData = transformToMenuItem(data);

 

      // Soumission
      onSubmit(menuData);
      return true;

    } catch (error) {
      console.error('Erreur lors de la soumission du formulaire:', error);
      toast.error('Une erreur est survenue lors de la soumission du formulaire');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    submitForm,
    validateSubmissionData,
    transformToMenuItem,
    prepareDishSupplements,
    prepareSupplementsStructure
  };
};

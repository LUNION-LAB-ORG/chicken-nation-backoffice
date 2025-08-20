import { useState, useEffect } from 'react';
import { getAllRestaurants } from '@/services/restaurantService';

export interface RestaurantOption {
  value: string;
  label: string;
}
 
export const useRestaurants = (initialSelectedIds: string[] = []) => {
  const defaultRestaurants = [
    { value: 'zone4', label: 'Chicken Nation Zone 4' },
    { value: 'angre', label: 'Chicken Nation Angré' },
  ];
  
  // États pour les restaurants
  const [restaurants, setRestaurants] = useState<RestaurantOption[]>(defaultRestaurants);
  const [selectedRestaurants, setSelectedRestaurants] = useState<string[]>(initialSelectedIds);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Fonction pour gérer la sélection des restaurants
  const handleRestaurantChange = (selectedIds: string[]) => {
 
    const uniqueIds = [...new Set(selectedIds)];
    setSelectedRestaurants(uniqueIds);
  };
  
   const isRestaurantSelected = (id: string): boolean => {
    return selectedRestaurants.includes(id);
  };
  
   const validateRestaurants = (): boolean => {
    return selectedRestaurants.length > 0;
  };
  
   const addRestaurantsToFormData = (formData: FormData): FormData => {
     selectedRestaurants.forEach(id => {
      formData.append('restaurant_ids[]', id);
    });
    
    return formData;
  };
  
   useEffect(() => {
    const loadRestaurants = async () => {
      setIsLoading(true);
      try {
        const restaurantsData = await getAllRestaurants();
        // Transform Restaurant[] to RestaurantOption[]
        const formattedRestaurants: RestaurantOption[] = restaurantsData.map(restaurant => ({
          value: restaurant.id,
          label: restaurant.name
        }));
        setRestaurants(formattedRestaurants);
      } catch (error) {
        console.error('❌ Erreur lors du chargement des restaurants:', error);
        setError(error as Error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRestaurants();
  }, [selectedRestaurants]);
  
  return {
    restaurants,
    selectedRestaurants, 
    handleRestaurantChange,
    setSelectedRestaurants, 
    isRestaurantSelected,
    addRestaurantsToFormData,
    validateRestaurants,
    isLoading,
    error
  };
};

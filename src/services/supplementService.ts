import { API_URL } from '@/config';

 
export interface Supplement {
  id: string;
  name: string;
  price: number;
  category: 'FOOD' | 'DRINK' | 'ACCESSORY';
  image?: string;
  available?: boolean;
  description?: string;
}

 export const getSupplementsByCategory = async (category: string): Promise<Supplement[]> => {
  try {
    const response = await fetch(`${API_URL}/api/v1/supplements?category=${category}`);
    if (!response.ok) {
      throw new Error(`Erreur: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Erreur lors de la récupération des suppléments de catégorie ${category}:`, error);
    throw error;
  }
};

 export const getAllSupplements = async (): Promise<Record<string, Supplement[]>> => {
  try {
    const response = await fetch(`${API_URL}/api/v1/supplements`);
    if (!response.ok) {
      throw new Error(`Erreur: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Erreur lors de la récupération des suppléments:', error);
    throw error;
  }
};

 export const convertSupplementsToOptions = (supplements: Supplement[]) => {
  return supplements.map(supplement => ({
    value: supplement.id,
    label: supplement.name,
    price: `${supplement.price} XOF`,
    image: supplement.image ? 
      (supplement.image.startsWith('http') || supplement.image.startsWith('/') 
        ? supplement.image 
        : `https://chicken.turbodeliveryapp.com/${supplement.image}`)
      : '/images/plat.png',
    category: supplement.category,
    available: supplement.available
  }));
};

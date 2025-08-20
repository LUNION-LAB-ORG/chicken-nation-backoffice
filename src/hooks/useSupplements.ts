import { useState, useEffect, useMemo } from 'react';
import { getAllSupplements, convertSupplementsToOptions } from '@/services/supplementService';
import { MAX_SUPPLEMENTS_PER_TYPE, SUPPLEMENT_TYPE } from '@/constants/menuConstants';
import { toast } from 'react-hot-toast';

export interface SupplementItem {
  id: string;
  name: string;
  price: number;
  image?: string;
  quantity?: number;
  category: string;
  isSelected?: boolean;
}

export interface SupplementOption {
  value: string;
  label: string;
  image?: string;
  price?: number | string;
  category?: string;
}

// ✅ TYPE POUR LES SUPPLÉMENTS INITIAUX
interface InitialSupplementData {
  id: string;
  quantity?: number;
}

export const useSupplements = (initialSupplements: Record<string, InitialSupplementData[]> = {}) => {
  // ✅ PERFORMANCE: Mémoriser les états initiaux pour éviter les re-créations
  const initialSupplementOptions = useMemo(() => ({
    [SUPPLEMENT_TYPE.ACCESSORY]: [],
    [SUPPLEMENT_TYPE.FOOD]: [],
    [SUPPLEMENT_TYPE.DRINK]: []
  }), []);

  const initialSelectedSupplements = useMemo(() => ({
    [SUPPLEMENT_TYPE.ACCESSORY]: [],
    [SUPPLEMENT_TYPE.FOOD]: [],
    [SUPPLEMENT_TYPE.DRINK]: []
  }), []);

  const initialSupplementQuantities = useMemo(() => ({
    [SUPPLEMENT_TYPE.ACCESSORY]: {},
    [SUPPLEMENT_TYPE.FOOD]: {},
    [SUPPLEMENT_TYPE.DRINK]: {}
  }), []);

  const [supplementOptions, setSupplementOptions] = useState<Record<string, SupplementOption[]>>(initialSupplementOptions);
  const [selectedSupplements, setSelectedSupplements] = useState<Record<string, string[]>>(initialSelectedSupplements);
  const [supplementQuantities, setSupplementQuantities] = useState<Record<string, Record<string, number>>>(initialSupplementQuantities);

  // État de chargement
  const [isLoading, setIsLoading] = useState(false);

   const handleSupplementSelection = (type: SUPPLEMENT_TYPE, selectedIds: string[]) => {
     const limitedSelection = selectedIds.slice(0, MAX_SUPPLEMENTS_PER_TYPE);

    setSelectedSupplements(prev => ({
      ...prev,
      [type]: limitedSelection
    }));
  };

   const handleSupplementQuantityChange = (type: SUPPLEMENT_TYPE, supplementId: string, change: number) => {
    setSupplementQuantities(prev => {
      const currentQuantity = prev[type]?.[supplementId] || 1;
      const newQuantity = Math.max(1, currentQuantity + change);

      return {
        ...prev,
        [type]: {
          ...prev[type],
          [supplementId]: newQuantity
        }
      };
    });
  };

   const isSupplementSelected = (id: string, type: SUPPLEMENT_TYPE): boolean => {
    return selectedSupplements[type]?.includes(id) || false;
  };

   const getSupplementQuantity = (id: string, type: SUPPLEMENT_TYPE): number => {
    return supplementQuantities[type]?.[id] || 1;
  };

   const formatSupplementsForApi = (): { ids: string[], quantities: Record<string, number> } => {
    const ids: string[] = [
      ...(selectedSupplements[SUPPLEMENT_TYPE.ACCESSORY] || []),
      ...(selectedSupplements[SUPPLEMENT_TYPE.FOOD] || []),
      ...(selectedSupplements[SUPPLEMENT_TYPE.DRINK] || [])
    ];

    const quantities: Record<string, number> = {};

     Object.values(SUPPLEMENT_TYPE).forEach(type => {
      Object.entries(supplementQuantities[type] || {}).forEach(([id, quantity]) => {
        if (ids.includes(id)) {
          quantities[id] = quantity;
        }
      });
    });

    return { ids, quantities };
  };

   const addSupplementsToFormData = (formData: FormData): FormData => {
    const { ids, quantities } = formatSupplementsForApi();

    // Ajouter les IDs des suppléments
    ids.forEach(id => {
      formData.append('supplement_ids[]', id);
    });

    // Ajouter les quantités des suppléments
    Object.entries(quantities).forEach(([id, quantity]) => {
      formData.append(`supplement_quantities[${id}]`, quantity.toString());
    });

    return formData;
  };

   const initializeSupplements = (supplements: Record<string, InitialSupplementData[]>) => {
    if (!supplements) return;

     const extractSupplementData = (items: InitialSupplementData[]) => {
      if (!Array.isArray(items)) return { ids: [], quantities: {} };

      const ids: string[] = [];
      const quantities: Record<string, number> = {};

      items.forEach(item => {
        if (item && item.id) {
          ids.push(item.id);
          if (item.quantity && item.quantity > 0) {
            quantities[item.id] = item.quantity;
          }
        }
      });

      return { ids, quantities };
    };

     Object.values(SUPPLEMENT_TYPE).forEach(type => {
      if (supplements[type]) {
        const { ids, quantities } = extractSupplementData(supplements[type]);

        if (ids.length > 0) {
          setSelectedSupplements(prev => ({
            ...prev,
            [type]: ids
          }));

          if (Object.keys(quantities).length > 0) {
            setSupplementQuantities(prev => ({
              ...prev,
              [type]: quantities
            }));
          }
        }
      }
    });
  };

   useEffect(() => {
    const fetchSupplements = async () => {
      setIsLoading(true);

      try {
        const data = await getAllSupplements();

         const options: Record<string, SupplementOption[]> = {
          [SUPPLEMENT_TYPE.ACCESSORY]: [],
          [SUPPLEMENT_TYPE.FOOD]: [],
          [SUPPLEMENT_TYPE.DRINK]: []
        };

        if (data.ACCESSORY) {
          options[SUPPLEMENT_TYPE.ACCESSORY] = convertSupplementsToOptions(data.ACCESSORY);
        }

        if (data.FOOD) {
          options[SUPPLEMENT_TYPE.FOOD] = convertSupplementsToOptions(data.FOOD);
        }

        if (data.DRINK) {
          options[SUPPLEMENT_TYPE.DRINK] = convertSupplementsToOptions(data.DRINK);
        }

        setSupplementOptions(options);

         if (initialSupplements && Object.keys(initialSupplements).length > 0) {
          initializeSupplements(initialSupplements);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des suppléments:', error);
        toast.error('Erreur lors du chargement des suppléments');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSupplements();
  }, [initialSupplements]);

  return {
    supplementOptions,
    selectedSupplements,
    supplementQuantities,
    handleSupplementSelection,
    handleSupplementQuantityChange,
    isSupplementSelected,
    getSupplementQuantity,
    formatSupplementsForApi,
    addSupplementsToFormData,
    initializeSupplements,

    // État
    isLoading
  };
};

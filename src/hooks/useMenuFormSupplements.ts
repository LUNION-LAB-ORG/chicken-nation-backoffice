import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { getAllSupplements, convertSupplementsToOptions } from '@/services/supplementService';
import { sanitizeMenuInput } from '@/schemas/menuSchemas';

// ✅ TYPES STRICTS POUR LE HOOK
interface SupplementOption {
  value: string;
  label: string;
  image?: string;
}

interface SupplementData {
  supplement?: {
    id: string;
    name?: string;
    type?: string;
    [key: string]: unknown;
  };
  supplement_id?: string;
  quantity?: number;
  type?: string;
  [key: string]: unknown;
}

 
// const extractSupplementIds = (supplements: unknown, type: string): string[] => {
//   try {
//     if (!supplements || typeof supplements !== 'object' || !supplements[type as keyof typeof supplements]) {
//       return [];
//     }

//     const supplementsObj = supplements as Record<string, unknown>;
//     const typeSupplements = supplementsObj[type];

//     if (!typeSupplements || typeof typeSupplements !== 'object') {
//       return [];
//     }

//     return Object.keys(typeSupplements)
//       .filter(id => {
//         if (!id || typeof id !== 'string') return false;
//         const sanitizedId = sanitizeMenuInput(id);
//         return sanitizedId.length > 0 && sanitizedId !== 'undefined' && sanitizedId !== 'null';
//       })
//       .map(id => sanitizeMenuInput(id))
//       .filter(id => /^[a-zA-Z0-9\-_]+$/.test(id));
//   } catch (error) {
//     console.warn('Erreur lors de l\'extraction des IDs de suppléments:', error);
//     return [];
//   }
// };

// ✅ FONCTION UTILITAIRE SÉCURISÉE POUR EXTRAIRE LES QUANTITÉS
const extractSupplementQuantities = (supplements: unknown, type: string): Record<string, number> => {
  try {
    if (!supplements || typeof supplements !== 'object' || !supplements[type as keyof typeof supplements]) {
      return {};
    }

    const supplementsObj = supplements as Record<string, unknown>;
    const typeSupplements = supplementsObj[type];

    if (!typeSupplements || typeof typeSupplements !== 'object') {
      return {};
    }

    return Object.entries(typeSupplements)
      .filter(([id]) => {
        if (!id || typeof id !== 'string') return false;
        const sanitizedId = sanitizeMenuInput(id);
        return sanitizedId.length > 0 && sanitizedId !== 'undefined' && sanitizedId !== 'null';
      })
      .reduce((acc: Record<string, number>, [id, quantity]: [string, unknown]) => {
        const sanitizedId = sanitizeMenuInput(id);
        if (/^[a-zA-Z0-9\-_]+$/.test(sanitizedId)) {
          const numQuantity = typeof quantity === 'number' ? quantity :
                             typeof quantity === 'string' ? parseFloat(quantity) : 1;
          acc[sanitizedId] = Math.min(Math.max(1, Math.floor(numQuantity) || 1), 10);
        }
        return acc;
      }, {});
  } catch (error) {
    console.warn('Erreur lors de l\'extraction des quantités de suppléments:', error);
    return {};
  }
};

// ✅ TYPE POUR LES DONNÉES INITIALES
interface InitialMenuData {
  dish_supplements?: Array<{
    supplement_id?: string;
    supplement?: {
      id?: string;
      type?: string;
      name?: string;
    };
    type?: string;
    quantity?: number;
  }>;
  supplements?: {
    ACCESSORY?: unknown;
    FOOD?: unknown;
    DRINK?: unknown;
  };
}

// ✅ HOOK SÉCURISÉ POUR LA GESTION DES SUPPLÉMENTS DE MENU
export const useMenuFormSupplements = (initialData?: InitialMenuData) => {

  // ✅ FONCTION SÉCURISÉE D'EXTRACTION DES SUPPLÉMENTS DEPUIS LES DONNÉES INITIALES
  const extractSupplementsFromInitialData = () => {
    try {
      if (!initialData || typeof initialData !== 'object') {
        return {
          accessoryIds: [],
          foodIds: [],
          drinkIds: []
        };
      }

      interface InitialDataWithSupplements {
        dish_supplements?: Array<{
          supplement_id?: string;
          supplement?: {
            id?: string;
            type?: string;
            name?: string;
          };
          type?: string;
          quantity?: number;
        }>;
      }

      const data = initialData as InitialDataWithSupplements;

      if (!data.dish_supplements || !Array.isArray(data.dish_supplements)) {
        return {
          accessoryIds: [],
          foodIds: [],
          drinkIds: []
        };
      }

      const accessoryIds: string[] = [];
      const foodIds: string[] = [];
      const drinkIds: string[] = [];

      // ✅ Traitement sécurisé de chaque relation de supplément
      for (const relation of data.dish_supplements) {
        try {
          if (!relation || typeof relation !== 'object') continue;

          const supplementData = relation as SupplementData;

          // ✅ Extraction sécurisée de l'ID
          const id = supplementData.supplement_id ||
                    (supplementData.supplement?.id) ||
                    '';

          if (!id || typeof id !== 'string') continue;

          const sanitizedId = sanitizeMenuInput(id);
          if (sanitizedId.length === 0 || !/^[a-zA-Z0-9\-_]+$/.test(sanitizedId)) continue;

          // ✅ Détermination sécurisée du type
          const type = supplementData.supplement?.type || supplementData.type;

          switch (type) {
            case 'ACCESSORY':
              if (!accessoryIds.includes(sanitizedId)) {
                accessoryIds.push(sanitizedId);
              }
              break;
            case 'FOOD':
              if (!foodIds.includes(sanitizedId)) {
                foodIds.push(sanitizedId);
              }
              break;
            case 'DRINK':
              if (!drinkIds.includes(sanitizedId)) {
                drinkIds.push(sanitizedId);
              }
              break;
            default:
              // ✅ Détection automatique basée sur le nom (sécurisée)
              if (supplementData.supplement?.name && typeof supplementData.supplement.name === 'string') {
                const sanitizedName = sanitizeMenuInput(supplementData.supplement.name).toLowerCase();
                if (sanitizedName.includes('boisson') || sanitizedName.includes('drink') || sanitizedName.includes('soda')) {
                  if (!drinkIds.includes(sanitizedId)) {
                    drinkIds.push(sanitizedId);
                  }
                } else if (sanitizedName.includes('frite') || sanitizedName.includes('riz') || sanitizedName.includes('accompagnement')) {
                  if (!foodIds.includes(sanitizedId)) {
                    foodIds.push(sanitizedId);
                  }
                } else {
                  if (!accessoryIds.includes(sanitizedId)) {
                    accessoryIds.push(sanitizedId);
                  }
                }
              }
          }
        } catch (relationError) {
          console.warn('Relation de supplément ignorée:', relationError);
        }
      }

      return {
        accessoryIds: accessoryIds.slice(0, 3), // Limiter à 3 maximum
        foodIds: foodIds.slice(0, 3),
        drinkIds: drinkIds.slice(0, 3)
      };
    } catch (error) {
      console.error('Erreur lors de l\'extraction des suppléments depuis les données initiales:', error);
      return {
        accessoryIds: [],
        foodIds: [],
        drinkIds: []
      };
    }
  };

   const { accessoryIds, foodIds, drinkIds } = extractSupplementsFromInitialData();

   const [selectedIngredients, setSelectedIngredients] = useState<string[]>(accessoryIds);
  const [selectedAccompagnements, setSelectedAccompagnements] = useState<string[]>(foodIds);
  const [selectedBoissons, setSelectedBoissons] = useState<string[]>(drinkIds);

   const [ingredientQuantities, setIngredientQuantities] = useState<Record<string, number>>(() => {
     if (initialData?.dish_supplements && Array.isArray(initialData.dish_supplements)) {
      console.log(' Initialisation des quantités d\'ingrédients depuis dish_supplements');
      return initialData.dish_supplements
        .filter((relation) =>
          relation.supplement?.type === 'ACCESSORY' ||
          (relation.type === 'ACCESSORY')
        )
        .reduce((acc: Record<string, number>, relation) => {
          const id = relation.supplement_id || (relation.supplement?.id || '');
          if (id) {
            acc[id] = relation.quantity || 1;
          }
          return acc;
        }, {});
    }

     if (initialData?.supplements?.ACCESSORY) {
      console.log(' Initialisation des quantités d\'ingrédients depuis supplements.ACCESSORY');
      return extractSupplementQuantities(initialData.supplements, 'ACCESSORY');
    }

    return {};
  });

  const [accompagnementQuantities, setAccompagnementQuantities] = useState<Record<string, number>>(() => {
     if (initialData?.dish_supplements && Array.isArray(initialData.dish_supplements)) {
      console.log(' Initialisation des quantités d\'accompagnements depuis dish_supplements');
      return initialData.dish_supplements
        .filter((relation) =>
          relation.supplement?.type === 'FOOD' ||
          (relation.type === 'FOOD')
        )
        .reduce((acc: Record<string, number>, relation) => {
          const id = relation.supplement_id || (relation.supplement?.id || '');
          if (id) {
            acc[id] = relation.quantity || 1;
          }
          return acc;
        }, {});
    }

     if (initialData?.supplements?.FOOD) {
      console.log(' Initialisation des quantités d\'accompagnements depuis supplements.FOOD');
      return extractSupplementQuantities(initialData.supplements, 'FOOD');
    }

    return {};
  });

  const [boissonQuantities, setBoissonQuantities] = useState<Record<string, number>>(() => {
     if (initialData?.dish_supplements && Array.isArray(initialData.dish_supplements)) {
      console.log(' Initialisation des quantités de boissons depuis dish_supplements');
      return initialData.dish_supplements
        .filter((relation) =>
          relation.supplement?.type === 'DRINK' ||
          (relation.type === 'DRINK')
        )
        .reduce((acc: Record<string, number>, relation) => {
          const id = relation.supplement_id || (relation.supplement?.id || '');
          if (id) {
            acc[id] = relation.quantity || 1;
          }
          return acc;
        }, {});
    }

     if (initialData?.supplements?.DRINK) {
      if (process.env.NODE_ENV === 'development') {
        console.log(' Initialisation des quantités de boissons depuis supplements.DRINK');
      }
      return extractSupplementQuantities(initialData.supplements, 'DRINK');
    }

    return {};
  });

  // États pour les options de suppléments
  const [ingredientOptions, setIngredientOptions] = useState<SupplementOption[]>([]);
  const [accompagnementOptions, setAccompagnementOptions] = useState<SupplementOption[]>([]);
  const [boissonOptions, setBoissonOptions] = useState<SupplementOption[]>([]);

  // État de chargement
  const [isLoadingSupplements, setIsLoadingSupplements] = useState(true);
  const [supplementsLoaded, setSupplementsLoaded] = useState(false);

   useEffect(() => {
     if (supplementsLoaded) return;

    const fetchSupplements = async () => {
      setIsLoadingSupplements(true);

      try {
        console.log(' Chargement de TOUS les suppléments depuis l\'API...');
        const data = await getAllSupplements();

        // Convertir les suppléments en options pour les sélecteurs
        if (data.ACCESSORY) {
          const accessoryOptions = convertSupplementsToOptions(data.ACCESSORY);
          setIngredientOptions(accessoryOptions);

          // Vérifier si les ingrédients sélectionnés existent dans les options
          if (selectedIngredients.length > 0) {
            console.log(' Vérification des ingrédients sélectionnés:', selectedIngredients);

            // Ajouter les suppléments manquants aux options si nécessaire
            if (initialData?.dish_supplements && Array.isArray(initialData.dish_supplements)) {
              const missingIngredients = initialData.dish_supplements
                .filter((relation) =>
                  (relation.supplement?.type === 'ACCESSORY' || relation.type === 'ACCESSORY') &&
                  relation.supplement &&
                  !accessoryOptions.some(opt => opt.value === (relation.supplement_id || relation.supplement?.id))
                )
                .map((relation) => relation.supplement)
                .filter((supplement): supplement is NonNullable<typeof supplement> => supplement != null);

              if (missingIngredients.length > 0) {
                console.log(' Ajout des ingrédients manquants aux options:', missingIngredients);
                // Convertir les suppléments partiels en options
                const additionalOptions = missingIngredients.map(supplement => ({
                  value: supplement.id || '',
                  label: supplement.name || 'Supplément inconnu',
                  image: '/images/plat.png'
                })).filter(option => option.value);
                setIngredientOptions([...accessoryOptions, ...additionalOptions]);
              }
            }

             const validIngredientIds = selectedIngredients.filter(id =>
              accessoryOptions.some(option => option.value === id) ||
              (initialData?.dish_supplements && Array.isArray(initialData.dish_supplements) &&
               initialData.dish_supplements.some((relation) =>
                 (relation.supplement_id === id || relation.supplement?.id === id) &&
                 (relation.supplement?.type === 'ACCESSORY' || relation.type === 'ACCESSORY')
               ))
            );

            if (validIngredientIds.length !== selectedIngredients.length) {
              console.warn(' Certains ingrédients sélectionnés n\'existent pas dans les options:',
                selectedIngredients.filter(id => !validIngredientIds.includes(id))
              );
              setSelectedIngredients(validIngredientIds);
            }
          }
        }

        if (data.FOOD) {
          const foodOptions = convertSupplementsToOptions(data.FOOD);
          setAccompagnementOptions(foodOptions);

           if (selectedAccompagnements.length > 0) {

             if (initialData?.dish_supplements && Array.isArray(initialData.dish_supplements)) {
              const missingAccompagnements = initialData.dish_supplements
                .filter((relation) =>
                  (relation.supplement?.type === 'FOOD' || relation.type === 'FOOD') &&
                  relation.supplement &&
                  !foodOptions.some(opt => opt.value === (relation.supplement_id || relation.supplement?.id))
                )
                .map((relation) => relation.supplement)
                .filter((supplement): supplement is NonNullable<typeof supplement> => supplement != null);

              if (missingAccompagnements.length > 0) {
                console.log(' Ajout des accompagnements manquants aux options:', missingAccompagnements);
                // Convertir les suppléments partiels en options
                const additionalOptions = missingAccompagnements.map(supplement => ({
                  value: supplement.id || '',
                  label: supplement.name || 'Supplément inconnu',
                  image: '/images/plat.png'
                })).filter(option => option.value);
                setAccompagnementOptions([...foodOptions, ...additionalOptions]);
              }
            }

            // Vérifier si les IDs sélectionnés existent dans les options
            const validAccompagnementIds = selectedAccompagnements.filter(id =>
              foodOptions.some(option => option.value === id) ||
              (initialData?.dish_supplements && Array.isArray(initialData.dish_supplements) &&
               initialData.dish_supplements.some((relation) =>
                 (relation.supplement_id === id || relation.supplement?.id === id) &&
                 (relation.supplement?.type === 'FOOD' || relation.type === 'FOOD')
               ))
            );

            if (validAccompagnementIds.length !== selectedAccompagnements.length) {
              console.warn(' Certains accompagnements sélectionnés n\'existent pas dans les options:',
                selectedAccompagnements.filter(id => !validAccompagnementIds.includes(id))
              );
              setSelectedAccompagnements(validAccompagnementIds);
            }
          }
        }

        if (data.DRINK) {
          const drinkOptions = convertSupplementsToOptions(data.DRINK);
          setBoissonOptions(drinkOptions);

          // Vérifier si les boissons sélectionnées existent dans les options
          if (selectedBoissons.length > 0) {
            console.log(' Vérification des boissons sélectionnées:', selectedBoissons);

            // Ajouter les suppléments manquants aux options si nécessaire
            if (initialData?.dish_supplements && Array.isArray(initialData.dish_supplements)) {
              const missingBoissons = initialData.dish_supplements
                .filter((relation) =>
                  (relation.supplement?.type === 'DRINK' || relation.type === 'DRINK') &&
                  relation.supplement &&
                  !drinkOptions.some(opt => opt.value === (relation.supplement_id || relation.supplement?.id))
                )
                .map((relation) => relation.supplement)
                .filter((supplement): supplement is NonNullable<typeof supplement> => supplement != null);

              if (missingBoissons.length > 0) {
                console.log(' Ajout des boissons manquantes aux options:', missingBoissons);
                // Convertir les suppléments partiels en options
                const additionalOptions = missingBoissons.map(supplement => ({
                  value: supplement.id || '',
                  label: supplement.name || 'Supplément inconnu',
                  image: '/images/plat.png'
                })).filter(option => option.value);
                setBoissonOptions([...drinkOptions, ...additionalOptions]);
              }
            }

            // Vérifier si les IDs sélectionnés existent dans les options
            const validBoissonIds = selectedBoissons.filter(id =>
              drinkOptions.some(option => option.value === id) ||
              (initialData?.dish_supplements && Array.isArray(initialData.dish_supplements) &&
               initialData.dish_supplements.some((relation) =>
                 (relation.supplement_id === id || relation.supplement?.id === id) &&
                 (relation.supplement?.type === 'DRINK' || relation.type === 'DRINK')
               ))
            );

            if (validBoissonIds.length !== selectedBoissons.length) {
              console.warn(' Certaines boissons sélectionnées n\'existent pas dans les options:',
                selectedBoissons.filter(id => !validBoissonIds.includes(id))
              );
              setSelectedBoissons(validBoissonIds);
            }
          }
        }

        // Marquer les suppléments comme chargés
        setSupplementsLoaded(true);
        if (process.env.NODE_ENV === 'development') {
          console.log(' Tous les suppléments chargés avec succès');
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error(' Erreur lors du chargement des suppléments:', error);
        }
        toast.error('Impossible de charger les suppléments');
      } finally {
        setIsLoadingSupplements(false);
      }
    };

    fetchSupplements();
  }, [supplementsLoaded, selectedIngredients, selectedAccompagnements, selectedBoissons, initialData]);

   useEffect(() => {

  }, [
    selectedIngredients,
    selectedAccompagnements,
    selectedBoissons,
    ingredientQuantities,
    accompagnementQuantities,
    boissonQuantities
  ]);

  // Fonctions de gestion des changements
  const handleIngredientChange = (selected: string[]) => {
    // Limiter à 3 éléments maximum
    const limitedSelection = selected.slice(0, 3);
    setSelectedIngredients(limitedSelection);
  };

  const handleAccompagnementChange = (selected: string[]) => {
    // Limiter à 3 éléments maximum
    const limitedSelection = selected.slice(0, 3);
    setSelectedAccompagnements(limitedSelection);
  };

  const handleBoissonChange = (selected: string[]) => {
    // Limiter à 3 éléments maximum
    const limitedSelection = selected.slice(0, 3);
    setSelectedBoissons(limitedSelection);
  };

  // Fonction pour gérer le changement de quantité
  const handleProductQuantityChange = (category: 'ingredients' | 'accompagnements' | 'boissons', productId: string, change: number) => {
    if (category === 'ingredients') {
      setIngredientQuantities(prev => ({
        ...prev,
        [productId]: Math.max(0, (prev[productId] || 0) + change)
      }));
    } else if (category === 'accompagnements') {
      setAccompagnementQuantities(prev => ({
        ...prev,
        [productId]: Math.max(0, (prev[productId] || 0) + change)
      }));
    } else if (category === 'boissons') {
      setBoissonQuantities(prev => ({
        ...prev,
        [productId]: Math.max(0, (prev[productId] || 0) + change)
      }));
    }
  };

  // Fonction pour ajouter les suppléments au FormData
  const addSupplementsToFormData = (formData: FormData) => {
    // Ajouter les ingrédients
    selectedIngredients.forEach(id => {
      formData.append('supplements[ACCESSORY][' + id + ']', (ingredientQuantities[id] || 1).toString());
    });

    // Ajouter les accompagnements
    selectedAccompagnements.forEach(id => {
      formData.append('supplements[FOOD][' + id + ']', (accompagnementQuantities[id] || 1).toString());
    });

    // Ajouter les boissons
    selectedBoissons.forEach(id => {
      formData.append('supplements[DRINK][' + id + ']', (boissonQuantities[id] || 1).toString());
    });
  };

  return {
    selectedIngredients,
    selectedAccompagnements,
    selectedBoissons,
    ingredientQuantities,
    accompagnementQuantities,
    boissonQuantities,
    ingredientOptions,
    accompagnementOptions,
    boissonOptions,
    isLoadingSupplements,
    supplementsLoaded,
    handleIngredientChange,
    handleAccompagnementChange,
    handleBoissonChange,
    handleProductQuantityChange,
    addSupplementsToFormData
  };
};

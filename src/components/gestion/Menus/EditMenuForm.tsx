"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Checkbox from "@/components/ui/Checkbox";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { MenuItem, SupplementItem } from "@/types";
import {
  getAllSupplements,
  convertSupplementsToOptions,
} from "@/services/supplementService";
import { getAllCategories } from "@/services/categoryService";
import { getAllRestaurants } from "@/services/restaurantService";
import { toast } from "react-hot-toast";
import { formatImageUrl } from "@/utils/imageHelpers";
import SelectWithCheckboxes from "@/components/ui/SelectWithCheckboxes";
import SelectWithCheckboxesAndImages from "@/components/ui/SelectWithCheckboxesAndImages";
import SimpleSelect from "@/components/ui/SimpleSelect";
import { validateMenuItem, sanitizeMenuInput } from "@/schemas/menuSchemas";

// ✅ INTERFACES STRICTES POUR LE FORMULAIRE
interface MenuFormData {
  title: string;
  description: string;
  price: string;
  reducedPrice: string;
  reduction: boolean;
  category: string[];
  restaurant: string;
  supplements: {
    ingredients: {
      category: string;
      quantity: number;
    };
    accompagnements: {
      category: string;
      quantity: number;
    };
    boissons: {
      category: string;
      quantity: number;
    };
  };
  is_alway_epice: boolean; // ✅ Nom corrigé sans "s"
}

interface EditMenuFormProps {
  initialData: MenuItem; // Obligatoire pour l'édition
  onCancel?: () => void;
  onSubmit: (menuData: MenuItem) => void;
}

// ✅ TYPES STRICTS POUR LES OPTIONS
interface OptionItem {
  value: string;
  label: string;
  image?: string;
}

interface CategoryOption {
  value: string;
  label: string;
}

interface RestaurantOption {
  value: string;
  label: string;
}

// ✅ COMPOSANT POUR L'ÉDITION DE MENUS
const EditMenuForm = ({
  initialData,
  onCancel,
  onSubmit,
}: EditMenuFormProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ✅ INITIALISATION POUR L'ÉDITION AVEC LES DONNÉES EXISTANTES
  const [formData, setFormData] = useState<MenuFormData>({
    title: "",
    description: "",
    price: "",
    reducedPrice: "",
    reduction: false,
    category: [],
    restaurant: "",
    supplements: {
      ingredients: { category: "", quantity: 0 },
      accompagnements: { category: "", quantity: 0 },
      boissons: { category: "", quantity: 0 },
    },
    is_alway_epice: false, // ✅ Valeur par défaut
  });

  // Mise à jour avec les données existantes
  useEffect(() => {
    try {
      const validatedData = validateMenuItem(initialData);
      setFormData({
        title: sanitizeMenuInput(validatedData.name || ""),
        description: sanitizeMenuInput(validatedData.description || ""),
        price: validatedData.price || "",
        reducedPrice: String(validatedData.promotion_price || ""),
        reduction: validatedData.is_promotion || false,
        category: validatedData.categoryId ? [validatedData.categoryId] : [],
        restaurant:
          typeof validatedData.restaurantId === "string"
            ? validatedData.restaurantId
            : "",
        supplements: {
          ingredients: { category: "", quantity: 0 },
          accompagnements: { category: "", quantity: 0 },
          boissons: { category: "", quantity: 0 },
        },
        is_alway_epice:
          (validatedData as unknown as { is_alway_epice?: boolean })
            .is_alway_epice ?? false,
      });
    } catch (error) {
      console.error("Erreur lors de l'initialisation du formulaire:", error);
      // Fallback avec les données brutes
      setFormData({
        title: initialData.name || "",
        description: initialData.description || "",
        price: initialData.price || "",
        reducedPrice: String(initialData.promotion_price || ""),
        reduction: initialData.is_promotion || false,
        category: initialData.categoryId ? [initialData.categoryId] : [],
        restaurant: "",
        supplements: {
          ingredients: { category: "", quantity: 0 },
          accompagnements: { category: "", quantity: 0 },
          boissons: { category: "", quantity: 0 },
        },
        is_alway_epice:
          (initialData as unknown as { is_alway_epice?: boolean })
            .is_alway_epice ?? false,
      });
    }
  }, [initialData]);

  // ✅ ÉTATS POUR L'ÉDITION
  const [imagePreview, setImagePreview] = useState<string | null>(() => {
    try {
      return initialData.image ? formatImageUrl(initialData.image) : null;
    } catch {
      return null;
    }
  });

  const [imageError, setImageError] = useState<string | null>(null);
  const [selectedRestaurants, setSelectedRestaurants] = useState<string[]>([]);

  // ✅ OPTIONS DE SUPPLÉMENTS AVEC TYPES STRICTS (supprimé car non utilisé)

  // ✅ SÉLECTIONS DE SUPPLÉMENTS
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [selectedAccompagnements, setSelectedAccompagnements] = useState<
    string[]
  >([]);
  const [selectedBoissons, setSelectedBoissons] = useState<string[]>([]);

  // ✅ OPTIONS AVEC TYPES STRICTS
  const [ingredientOptions, setIngredientOptions] = useState<OptionItem[]>([]);
  const [accompagnementOptions, setAccompagnementOptions] = useState<
    OptionItem[]
  >([]);
  const [boissonOptions, setBoissonOptions] = useState<OptionItem[]>([]);

  // ✅ QUANTITÉS AVEC VALIDATION
  const [ingredientQuantities, setIngredientQuantities] = useState<
    Record<string, number>
  >({});
  const [accompagnementQuantities, setAccompagnementQuantities] = useState<
    Record<string, number>
  >({});
  const [boissonQuantities, setBoissonQuantities] = useState<
    Record<string, number>
  >({});

  // ✅ ÉTATS DE CHARGEMENT
  const [isLoadingSupplements, setIsLoadingSupplements] = useState(false);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [restaurants, setRestaurants] = useState<RestaurantOption[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ FONCTION SÉCURISÉE POUR LES URLS D'IMAGES
  const getSafeImageUrl = (imageUrl: string | null): string => {
    try {
      if (!imageUrl || typeof imageUrl !== "string")
        return "/images/burger.png";
      if (imageUrl.startsWith("data:")) return imageUrl;
      return formatImageUrl(imageUrl);
    } catch {
      return "/images/burger.png";
    }
  };

  // ✅ INITIALISATION DES RESTAURANTS POUR L'ÉDITION
  const initializeSelectedRestaurants = useCallback(
    (availableRestaurants: RestaurantOption[]) => {
      try {
        const selectedIds: string[] = [];

        // ✅ Extraction des restaurants depuis les données existantes
        if (
          initialData.dish_restaurants &&
          Array.isArray(initialData.dish_restaurants) &&
          initialData.dish_restaurants.length > 0
        ) {
          for (const relation of initialData.dish_restaurants) {
            try {
              let restaurantId: string | null = null;

              if (relation && typeof relation === "object") {
                const relationObj = relation as Record<string, unknown>;
                restaurantId =
                  (typeof relationObj.restaurant_id === "string"
                    ? relationObj.restaurant_id
                    : null) ||
                  (relationObj.restaurant &&
                  typeof relationObj.restaurant === "object" &&
                  typeof (relationObj.restaurant as Record<string, unknown>)
                    .id === "string"
                    ? ((relationObj.restaurant as Record<string, unknown>)
                        .id as string)
                    : null) ||
                  (typeof relationObj.id === "string"
                    ? relationObj.id
                    : null) ||
                  null;
              } else if (typeof relation === "string") {
                restaurantId = relation;
              }

              if (restaurantId && typeof restaurantId === "string") {
                const sanitizedId = sanitizeMenuInput(restaurantId);
                if (
                  sanitizedId.length > 0 &&
                  /^[a-zA-Z0-9\-_]+$/.test(sanitizedId)
                ) {
                  selectedIds.push(sanitizedId);
                }
              }
            } catch (relationError) {
              console.warn("Relation restaurant ignorée:", relationError);
            }
          }
        }
        // ✅ Fallback vers restaurantId
        else if (initialData.restaurantId) {
          if (Array.isArray(initialData.restaurantId)) {
            for (const id of initialData.restaurantId) {
              if (typeof id === "string") {
                const sanitizedId = sanitizeMenuInput(id);
                if (
                  sanitizedId.length > 0 &&
                  /^[a-zA-Z0-9\-_]+$/.test(sanitizedId)
                ) {
                  selectedIds.push(sanitizedId);
                }
              }
            }
          } else if (typeof initialData.restaurantId === "string") {
            const sanitizedId = sanitizeMenuInput(initialData.restaurantId);
            if (
              sanitizedId.length > 0 &&
              /^[a-zA-Z0-9\-_]+$/.test(sanitizedId)
            ) {
              selectedIds.push(sanitizedId);
            }
          }
        }

        // ✅ Fallback si aucun restaurant trouvé
        if (selectedIds.length === 0 && availableRestaurants.length > 0) {
          const firstRestaurant = availableRestaurants[0];
          if (
            firstRestaurant.value &&
            typeof firstRestaurant.value === "string"
          ) {
            const sanitizedId = sanitizeMenuInput(firstRestaurant.value);
            if (sanitizedId.length > 0) {
              selectedIds.push(sanitizedId);
            }
          }
        }

        setSelectedRestaurants([...new Set(selectedIds)]);
      } catch (error) {
        console.error(
          "Erreur lors de l'initialisation des restaurants:",
          error
        );
        setSelectedRestaurants([]);
      }
    },
    [initialData]
  );

  // ✅ INITIALISATION DES SUPPLÉMENTS AVEC OPTIONS FOURNIES
  const initializeSupplementsWithOptions = useCallback(
    (
      dishSupplements: unknown[],
      ingredientOpts: OptionItem[],
      accompagnementOpts: OptionItem[],
      boissonOpts: OptionItem[]
    ) => {
      try {
        // ✅ Validation stricte des paramètres d'entrée
        if (
          !dishSupplements ||
          !Array.isArray(dishSupplements) ||
          dishSupplements.length === 0
        ) {
          return;
        }

        // ✅ Initialisation sécurisée des structures de données
        const ingredients: string[] = [];
        const ingredientsQty: Record<string, number> = {};
        const accompagnements: string[] = [];
        const accompagnementsQty: Record<string, number> = {};
        const boissons: string[] = [];
        const boissonsQty: Record<string, number> = {};

        // ✅ Utilisation de Sets pour éviter les doublons
        const ingredientSet = new Set<string>();
        const accompagnementSet = new Set<string>();
        const boissonSet = new Set<string>();

        // ✅ Traitement sécurisé de chaque supplément
        for (const item of dishSupplements) {
          try {
            // ✅ Validation de l'élément
            if (!item || typeof item !== "object") continue;

            const supplementItem = item as Record<string, unknown>;

            // ✅ Extraction sécurisée de l'ID du supplément
            const supplementId =
              supplementItem.supplement_id ||
              (supplementItem.supplement &&
                typeof supplementItem.supplement === "object" &&
                (supplementItem.supplement as Record<string, unknown>).id) ||
              "";

            if (!supplementId || typeof supplementId !== "string") continue;

            // ✅ Sanitisation de l'ID
            const sanitizedId = sanitizeMenuInput(supplementId);
            if (
              sanitizedId.length === 0 ||
              !/^[a-zA-Z0-9\-_]+$/.test(sanitizedId)
            )
              continue;

            // ✅ Validation et sanitisation de la quantité
            let quantity = 1;
            if (
              typeof supplementItem.quantity === "number" &&
              supplementItem.quantity > 0
            ) {
              quantity = Math.min(
                Math.max(1, Math.floor(supplementItem.quantity)),
                10
              );
            }

            // ✅ Détermination sécurisée du type
            const type =
              (supplementItem.supplement &&
                typeof supplementItem.supplement === "object" &&
                (supplementItem.supplement as Record<string, unknown>)
                  .category) ||
              (supplementItem.supplement &&
                typeof supplementItem.supplement === "object" &&
                (supplementItem.supplement as Record<string, unknown>).type) ||
              supplementItem.type;

            // ✅ Classification sécurisée par type ou par recherche dans les options
            if (
              type === "ACCESSORY" ||
              ingredientOpts.some((opt) => opt.value === sanitizedId)
            ) {
              if (!ingredientSet.has(sanitizedId)) {
                ingredientSet.add(sanitizedId);
                ingredients.push(sanitizedId);
                ingredientsQty[sanitizedId] = quantity;
              }
            } else if (
              type === "FOOD" ||
              accompagnementOpts.some((opt) => opt.value === sanitizedId)
            ) {
              if (!accompagnementSet.has(sanitizedId)) {
                accompagnementSet.add(sanitizedId);
                accompagnements.push(sanitizedId);
                accompagnementsQty[sanitizedId] = quantity;
              }
            } else if (
              type === "DRINK" ||
              boissonOpts.some((opt) => opt.value === sanitizedId)
            ) {
              if (!boissonSet.has(sanitizedId)) {
                boissonSet.add(sanitizedId);
                boissons.push(sanitizedId);
                boissonsQty[sanitizedId] = quantity;
              }
            }
          } catch (itemError) {
            console.warn("Supplément ignoré lors du traitement:", itemError);
          }
        }

        // ✅ Limitation sécurisée à 3 éléments maximum par catégorie
        const limitedIngredients = ingredients.slice(0, 3);
        const limitedAccompagnements = accompagnements.slice(0, 3);
        const limitedBoissons = boissons.slice(0, 3);

        // ✅ Mise à jour sécurisée des états avec les valeurs limitées
        setSelectedIngredients(limitedIngredients);
        setIngredientQuantities(ingredientsQty);
        setSelectedAccompagnements(limitedAccompagnements);
        setAccompagnementQuantities(accompagnementsQty);
        setSelectedBoissons(limitedBoissons);
        setBoissonQuantities(boissonsQty);
      } catch (error) {
        console.error(
          "Erreur lors de l'initialisation des suppléments:",
          error
        );
        // ✅ Fallback sécurisé en cas d'erreur
        setSelectedIngredients([]);
        setIngredientQuantities({});
        setSelectedAccompagnements([]);
        setAccompagnementQuantities({});
        setSelectedBoissons([]);
        setBoissonQuantities({});
      }
    },
    []
  );

  // ✅ CHARGEMENT SÉCURISÉ DES CATÉGORIES ET RESTAURANTS
  useEffect(() => {
    const fetchCategoriesAndRestaurants = async () => {
      // ✅ Charger les catégories de manière sécurisée
      setIsLoadingCategories(true);
      try {
        const categoriesData = await getAllCategories();

        if (categoriesData && Array.isArray(categoriesData)) {
          if (categoriesData.length > 0) {
            const formattedCategories: CategoryOption[] = [];

            for (const cat of categoriesData) {
              try {
                // ✅ Validation et sanitisation de chaque catégorie
                if (cat && typeof cat === "object") {
                  const id = cat.id || cat.name;
                  const name = cat.name;

                  if (
                    id &&
                    name &&
                    typeof id === "string" &&
                    typeof name === "string"
                  ) {
                    const sanitizedId = sanitizeMenuInput(id);
                    const sanitizedName = sanitizeMenuInput(name);

                    if (sanitizedId.length > 0 && sanitizedName.length > 0) {
                      formattedCategories.push({
                        value: sanitizedId,
                        label: sanitizedName,
                      });
                    }
                  }
                }
              } catch (categoryError) {
                console.warn(
                  "Catégorie ignorée lors du formatage:",
                  categoryError
                );
              }
            }

            setCategories(formattedCategories);

            // ✅ Validation de la catégorie initiale
            if (initialData && initialData.categoryId) {
              const categoryExists = formattedCategories.some(
                (cat) => cat.value === initialData.categoryId
              );
              if (!categoryExists) {
                console.warn(
                  `La catégorie ${initialData.categoryId} n'existe pas dans les options disponibles`
                );
              }
            }
          } else {
            console.warn("Aucune catégorie trouvée");
            setCategories([]);
          }
        } else {
          console.error("Format de catégories invalide:", categoriesData);
          setCategories([]);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des catégories:", error);
        setCategories([]);
        toast.error("Impossible de charger les catégories");
      } finally {
        setIsLoadingCategories(false);
      }

      // ✅ Charger les restaurants de manière sécurisée
      try {
        const restaurantsData = await getAllRestaurants();

        if (
          restaurantsData &&
          Array.isArray(restaurantsData) &&
          restaurantsData.length > 0
        ) {
          const formattedRestaurants: RestaurantOption[] = [];

          for (const restaurant of restaurantsData) {
            try {
              // ✅ Validation et sanitisation de chaque restaurant
              if (restaurant && typeof restaurant === "object") {
                const id = restaurant.id;
                const name = restaurant.name;

                if (
                  id &&
                  name &&
                  typeof id === "string" &&
                  typeof name === "string"
                ) {
                  const sanitizedId = sanitizeMenuInput(id);
                  const sanitizedName = sanitizeMenuInput(name);

                  if (sanitizedId.length > 0 && sanitizedName.length > 0) {
                    formattedRestaurants.push({
                      value: sanitizedId,
                      label: sanitizedName,
                    });
                  }
                }
              }
            } catch (restaurantError) {
              console.warn(
                "Restaurant ignoré lors du formatage:",
                restaurantError
              );
            }
          }

          setRestaurants(formattedRestaurants);
          initializeSelectedRestaurants(formattedRestaurants);
        } else {
          console.warn("Aucun restaurant trouvé");
          setRestaurants([]);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des restaurants:", error);
        setRestaurants([]);
        toast.error("Impossible de charger les restaurants");
      }
    };

    fetchCategoriesAndRestaurants();
  }, [initialData, initializeSelectedRestaurants]);

  // ✅ CHARGEMENT DES SUPPLÉMENTS (OPTIMISÉ SANS GLITCH)
  useEffect(() => {
    const fetchSupplements = async () => {
      setIsLoadingSupplements(true);
      try {
        const data = await getAllSupplements();

        let newIngredientOptions: OptionItem[] = [];
        let newAccompagnementOptions: OptionItem[] = [];
        let newBoissonOptions: OptionItem[] = [];

        // ✅ Validation et initialisation sécurisée des options
        if (data && typeof data === "object") {
          // ✅ Traitement sécurisé des ingrédients (ACCESSORY)
          if (data.ACCESSORY && Array.isArray(data.ACCESSORY)) {
            try {
              const convertedOptions = convertSupplementsToOptions(
                data.ACCESSORY
              );
              if (Array.isArray(convertedOptions)) {
                newIngredientOptions = convertedOptions;
                setIngredientOptions(convertedOptions);
              }
            } catch (conversionError) {
              console.warn(
                "Erreur lors de la conversion des ingrédients:",
                conversionError
              );
              setIngredientOptions([]);
            }
          }

          // ✅ Traitement sécurisé des accompagnements (FOOD)
          if (data.FOOD && Array.isArray(data.FOOD)) {
            try {
              const convertedOptions = convertSupplementsToOptions(data.FOOD);
              if (Array.isArray(convertedOptions)) {
                newAccompagnementOptions = convertedOptions;
                setAccompagnementOptions(convertedOptions);
              }
            } catch (conversionError) {
              console.warn(
                "Erreur lors de la conversion des accompagnements:",
                conversionError
              );
              setAccompagnementOptions([]);
            }
          }

          // ✅ Traitement sécurisé des boissons (DRINK)
          if (data.DRINK && Array.isArray(data.DRINK)) {
            try {
              const convertedOptions = convertSupplementsToOptions(data.DRINK);
              if (Array.isArray(convertedOptions)) {
                newBoissonOptions = convertedOptions;
                setBoissonOptions(convertedOptions);
              }
            } catch (conversionError) {
              console.warn(
                "Erreur lors de la conversion des boissons:",
                conversionError
              );
              setBoissonOptions([]);
            }
          }
        }

        // ✅ INITIALISATION IMMÉDIATE DES SUPPLÉMENTS EXISTANTS
        const dishSupplements = initialData?.dish_supplements;
        if (
          dishSupplements &&
          Array.isArray(dishSupplements) &&
          dishSupplements.length > 0
        ) {
          initializeSupplementsWithOptions(
            dishSupplements,
            newIngredientOptions,
            newAccompagnementOptions,
            newBoissonOptions
          );
        } else {
          // ✅ Pas de suppléments existants
          setSelectedIngredients([]);
          setIngredientQuantities({});
          setSelectedAccompagnements([]);
          setAccompagnementQuantities({});
          setSelectedBoissons([]);
          setBoissonQuantities({});
        }
      } catch (error) {
        console.error("Erreur lors du chargement des suppléments:", error);
        toast.error("Impossible de charger les suppléments");

        // ✅ Fallback sécurisé en cas d'erreur
        setIngredientOptions([]);
        setAccompagnementOptions([]);
        setBoissonOptions([]);
      } finally {
        setIsLoadingSupplements(false);
      }
    };

    fetchSupplements();
  }, [initialData?.dish_supplements, initializeSupplementsWithOptions]); // ✅ Dépendances nécessaires

  // ✅ Gestion des changements des ingrédients
  const handleIngredientChange = (selectedIds: string[]) => {
    setSelectedIngredients(selectedIds);

    // Mettre à jour les quantités pour les nouveaux ingrédients
    const newQuantities = { ...ingredientQuantities };
    selectedIds.forEach((id) => {
      if (!newQuantities[id]) {
        newQuantities[id] = 1;
      }
    });
    setIngredientQuantities(newQuantities);
  };

  // ✅ Gestion des changements des accompagnements
  const handleAccompagnementChange = (selectedIds: string[]) => {
    setSelectedAccompagnements(selectedIds);

    // Mettre à jour les quantités pour les nouveaux accompagnements
    const newQuantities = { ...accompagnementQuantities };
    selectedIds.forEach((id) => {
      if (!newQuantities[id]) {
        newQuantities[id] = 1;
      }
    });
    setAccompagnementQuantities(newQuantities);
  };

  // ✅ Gestion des changements des boissons
  const handleBoissonChange = (selectedIds: string[]) => {
    setSelectedBoissons(selectedIds);

    // Mettre à jour les quantités pour les nouvelles boissons
    const newQuantities = { ...boissonQuantities };
    selectedIds.forEach((id) => {
      if (!newQuantities[id]) {
        newQuantities[id] = 1;
      }
    });
    setBoissonQuantities(newQuantities);
  };
  // ✅ Fonctions de gestion des suppléments supprimées car non utilisées dans ce composant

  // ✅ FONCTION DE SOUMISSION SÉCURISÉE
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      // ✅ VALIDATION STRICTE DES DONNÉES D'ENTRÉE

      // Validation et sanitisation du titre
      const sanitizedTitle = sanitizeMenuInput(formData.title || "");
      if (sanitizedTitle.length === 0) {
        toast.error("Le titre est obligatoire");
        setIsSubmitting(false);
        return;
      }
      if (sanitizedTitle.length > 100) {
        toast.error("Le titre ne doit pas dépasser 100 caractères");
        setIsSubmitting(false);
        return;
      }

      // Validation du prix
      if (!formData.price || formData.price.trim() === "") {
        toast.error("Le prix est obligatoire");
        setIsSubmitting(false);
        return;
      }
      if (!/^\d+(\.\d{1,2})?$/.test(formData.price)) {
        toast.error("Format de prix invalide");
        setIsSubmitting(false);
        return;
      }
      const priceValue = parseFloat(formData.price);
      if (priceValue <= 0 || priceValue > 1000000) {
        toast.error("Le prix doit être entre 0 et 1,000,000 XOF");
        setIsSubmitting(false);
        return;
      }

      // Validation de la catégorie
      if (!formData.category[0] || formData.category[0].trim() === "") {
        toast.error("Veuillez sélectionner une catégorie");
        setIsSubmitting(false);
        return;
      }

      // Validation des restaurants
      if (selectedRestaurants.length === 0) {
        toast.error("Veuillez sélectionner au moins un restaurant");
        setIsSubmitting(false);
        return;
      }

      // Validation de la réduction
      if (formData.reduction) {
        if (!formData.reducedPrice || formData.reducedPrice.trim() === "") {
          toast.error(
            "Le prix réduit est obligatoire quand la réduction est activée"
          );
          setIsSubmitting(false);
          return;
        }
        if (!/^\d+(\.\d{1,2})?$/.test(formData.reducedPrice)) {
          toast.error("Format de prix réduit invalide");
          setIsSubmitting(false);
          return;
        }
        const reducedPriceValue = parseFloat(formData.reducedPrice);
        if (reducedPriceValue <= 0 || reducedPriceValue >= priceValue) {
          toast.error(
            "Le prix réduit doit être positif et inférieur au prix normal"
          );
          setIsSubmitting(false);
          return;
        }
      }

      // Validation de la description
      const sanitizedDescription = sanitizeMenuInput(
        formData.description || ""
      );
      if (sanitizedDescription.length > 500) {
        toast.error("La description ne doit pas dépasser 500 caractères");
        setIsSubmitting(false);
        return;
      }

      // ✅ PRÉPARATION SÉCURISÉE DES SUPPLÉMENTS
      interface DishSupplement {
        supplement_id: string;
        quantity: number;
        supplement: {
          id: string;
          name: string;
          type: string;
        };
      }
      const dishSupplements: DishSupplement[] = [];

      // ✅ Traitement sécurisé des ingrédients
      for (const id of selectedIngredients) {
        try {
          const sanitizedId = sanitizeMenuInput(id);
          if (sanitizedId.length > 0 && /^[a-zA-Z0-9\-_]+$/.test(sanitizedId)) {
            const option = ingredientOptions.find(
              (opt) => opt.value === sanitizedId
            );
            const quantity = Math.min(
              Math.max(1, ingredientQuantities[sanitizedId] || 1),
              10
            );

            dishSupplements.push({
              supplement_id: sanitizedId,
              quantity,
              supplement: {
                id: sanitizedId,
                name: sanitizeMenuInput(option?.label || ""),
                type: "ACCESSORY",
              },
            });
          }
        } catch (error) {
          console.warn("Ingrédient ignoré lors de la préparation:", error);
        }
      }

      // ✅ Traitement sécurisé des accompagnements
      for (const id of selectedAccompagnements) {
        try {
          const sanitizedId = sanitizeMenuInput(id);
          if (sanitizedId.length > 0 && /^[a-zA-Z0-9\-_]+$/.test(sanitizedId)) {
            const option = accompagnementOptions.find(
              (opt) => opt.value === sanitizedId
            );
            const quantity = Math.min(
              Math.max(1, accompagnementQuantities[sanitizedId] || 1),
              10
            );

            dishSupplements.push({
              supplement_id: sanitizedId,
              quantity,
              supplement: {
                id: sanitizedId,
                name: sanitizeMenuInput(option?.label || ""),
                type: "FOOD",
              },
            });
          }
        } catch (error) {
          console.warn("Accompagnement ignoré lors de la préparation:", error);
        }
      }

      // ✅ Traitement sécurisé des boissons
      for (const id of selectedBoissons) {
        try {
          const sanitizedId = sanitizeMenuInput(id);
          if (sanitizedId.length > 0 && /^[a-zA-Z0-9\-_]+$/.test(sanitizedId)) {
            const option = boissonOptions.find(
              (opt) => opt.value === sanitizedId
            );
            const quantity = Math.min(
              Math.max(1, boissonQuantities[sanitizedId] || 1),
              10
            );

            dishSupplements.push({
              supplement_id: sanitizedId,
              quantity,
              supplement: {
                id: sanitizedId,
                name: sanitizeMenuInput(option?.label || ""),
                type: "DRINK",
              },
            });
          }
        } catch (error) {
          console.warn("Boisson ignorée lors de la préparation:", error);
        }
      }

      // ✅ CONSTRUCTION DES SUPPLÉMENTS DANS LA STRUCTURE ATTENDUE
      const supplementsStructure = {
        boissons: undefined,
        sauces: undefined,
        portions: undefined,
        ACCESSORY: [] as SupplementItem[],
        FOOD: [] as SupplementItem[],
        DRINK: [] as SupplementItem[],
      };

      // Ajouter les ingrédients (ACCESSORY)
      selectedIngredients.forEach((id) => {
        const option = ingredientOptions.find((opt) => opt.value === id);
        const quantity = ingredientQuantities[id] || 1;
        if (option) {
          supplementsStructure.ACCESSORY.push({
            id: id,
            name: option.label,
            price: "0",
            quantity: quantity,
            category: "ACCESSORY" as const,
            isAvailable: true,
          });
        }
      });

      // Ajouter les accompagnements (FOOD)
      selectedAccompagnements.forEach((id) => {
        const option = accompagnementOptions.find((opt) => opt.value === id);
        const quantity = accompagnementQuantities[id] || 1;
        if (option) {
          supplementsStructure.FOOD.push({
            id: id,
            name: option.label,
            price: "0",
            quantity: quantity,
            category: "FOOD" as const,
            isAvailable: true,
          });
        }
      });

      // Ajouter les boissons (DRINK)
      selectedBoissons.forEach((id) => {
        const option = boissonOptions.find((opt) => opt.value === id);
        const quantity = boissonQuantities[id] || 1;
        if (option) {
          supplementsStructure.DRINK.push({
            id: id,
            name: option.label,
            price: "0",
            quantity: quantity,
            category: "DRINK" as const,
            isAvailable: true,
          });
        }
      });

      // ✅ MISE À JOUR DE L'OBJET MENUITEM EXISTANT
      const menuData = {
        ...initialData, // Conserver toutes les données existantes
        id: initialData.id,
        name: sanitizedTitle,
        categoryId: formData.category[0],
        price: formData.price,
        description: sanitizedDescription,
        image: imagePreview || initialData.image || "",
        imageUrl: initialData.imageUrl || initialData.image || "",
        restaurantId:
          selectedRestaurants.length > 0
            ? selectedRestaurants[0]
            : initialData.restaurantId,
        selectedRestaurants: selectedRestaurants, // ✅ TOUS les restaurants sélectionnés
        supplements: supplementsStructure, // ✅ Structure des suppléments pour handleSaveEdit
        is_promotion: formData.reduction === true,
        promotion_price: formData.reduction ? formData.reducedPrice : "0",
        dish_supplements: dishSupplements,
        is_alway_epice: formData.is_alway_epice, // ✅ Nom corrigé sans "s"
      };

      // ✅ Soumission sécurisée des données
      onSubmit(menuData as unknown as MenuItem);
    } catch (error) {
      console.error("Erreur lors de la soumission du formulaire:", error);
      toast.error(
        "Une erreur est survenue lors de la soumission du formulaire"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Zone de téléchargement d'image */}
      <motion.div
        className="w-full lg:w-1/2 bg-[#F5F5F5] rounded-xl flex items-center justify-start min-h-[300px] relative overflow-hidden"
        whileHover={{ scale: 1.01 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <AnimatePresence>
          {imagePreview ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative w-full h-[300px] border border-orange-200 hover:border-[#F17922]
              transition-colors rounded-xl"
            >
              <Image
                src={getSafeImageUrl(imagePreview)}
                alt="Prévisualisation du menu"
                className="w-full rounded-xl h-full object-conain"
                width={140}
                height={120}
              />
              <motion.div
                onClick={() => setImagePreview(null)}
                className="absolute top-3 right-3 p-1 bg-white cursor-pointer rounded-xl text-[#F17922]
                 border-[#F17922] border-1 hover:border-[#F17922] text-sm px-[10px]"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                Modifier
              </motion.div>
            </motion.div>
          ) : (
            <motion.label
              htmlFor="image-upload"
              className="cursor-pointer flex items-center justify-center h-full w-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="p-2 px-3 bg-[#D9D9D9] rounded-xl">
                <p className="text-sm text-gray-600">
                  Ajouter une photo du menu
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                id="image-upload"
                className="hidden"
                accept="image/*"
                aria-label="Ajouter une photo du menu"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  if (!file.type.startsWith("image/")) {
                    setImageError("Veuillez sélectionner une image valide");
                    return;
                  }

                  if (file.size > 5 * 1024 * 1024) {
                    setImageError("L'image ne doit pas dépasser 5MB");
                    return;
                  }

                  const reader = new FileReader();
                  reader.onloadend = () => {
                    setImagePreview(reader.result as string);
                    setImageError(null);
                  };
                  reader.onerror = () => {
                    setImageError("Erreur lors de la lecture du fichier");
                  };
                  reader.readAsDataURL(file);
                }}
              />
            </motion.label>
          )}
        </AnimatePresence>
      </motion.div>

      {imageError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-500 text-sm text-center"
        >
          {imageError}
        </motion.div>
      )}

      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {/* Colonne gauche */}
        <div className="space-y-6">
          {/* Titre */}
          <motion.div
            className="w-full px-3 py-2 border-2 border-[#D9D9D9]/50 rounded-2xl focus-within:outline-none focus-within:ring-2 focus-within:ring-[#F17922] focus-within:border-transparent"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full py-2 text-[13px] focus:outline-none focus:border-transparent text-[#595959] font-semibold"
              placeholder="Ajouter un titre"
            />
          </motion.div>

          {/* Prix de vente */}
          <motion.div
            className="w-full px-3 py-2 border-2 border-[#D9D9D9]/50 rounded-2xl focus-within:outline-none focus-within:ring-2 focus-within:ring-[#F17922] focus-within:border-transparent"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <div className="relative">
              <input
                type="number"
                id="price"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                className="w-full py-2 text-[13px] focus:outline-none focus:border-transparent text-[#595959] font-semibold"
                placeholder="0.00"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-[#acacac] font-semibold bg-[#D9D9D9] p-1 px-4 rounded-xl">
                XOF
              </span>
            </div>
          </motion.div>

          <div className="flex flex-row items-center justify-between w-full gap-3 ">
            {/* Réduction */}
            <motion.div
              className="space-y-2 w-full px-3 py-2 border-2 border-[#D9D9D9]/50 rounded-2xl focus-within:outline-none focus-within:ring-2 focus-within:ring-[#F17922] focus-within:border-transparent"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex items-center">
                <Checkbox
                  id="reduction"
                  checked={formData.reduction}
                  onChange={(checked) => {
                    setFormData((prev) => ({
                      ...prev,
                      reduction: checked,
                      reducedPrice: checked ? prev.reducedPrice || "" : "",
                    }));
                  }}
                />
                <label
                  htmlFor="reduction"
                  className="ml-2 text-[13px] font-semibold text-gray-700"
                >
                  Réduction
                </label>
              </div>
              <AnimatePresence>
                {formData.reduction && (
                  <motion.div
                    className="relative"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <input
                      type="number"
                      value={formData.reducedPrice}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (
                          value === "" ||
                          (Number(value) >= 0 &&
                            Number(value) < Number(formData.price))
                        ) {
                          setFormData((prev) => ({
                            ...prev,
                            reducedPrice: value,
                          }));
                        }
                      }}
                      className="w-full px-2 py-2 text-[13px] focus:outline-none text-[#595959] font-semibold focus:border-transparent"
                      placeholder="0.00"
                      min="0"
                      max={formData.price}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-[#acacac] font-semibold bg-[#D9D9D9] p-1 px-4 rounded-xl">
                      XOF
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
            {/* Epice*/}
            <motion.div
              className="space-y-2 w-full px-3 py-2 border-2 border-[#D9D9D9]/50 rounded-2xl focus-within:outline-none focus-within:ring-2 focus-within:ring-[#F17922] focus-within:border-transparent"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex items-center">
                <Checkbox
                  id="is_alway_epice"
                  checked={formData.is_alway_epice}
                  onChange={(checked) => {
                    setFormData((prev) => ({
                      ...prev,
                      is_alway_epice: checked,
                    }));
                  }}
                />
                <label
                  htmlFor="is_alway_epice"
                  className="ml-2 text-[13px] font-semibold text-gray-700"
                >
                  Déjà épicé
                </label>
              </div>
            </motion.div>
          </div>
          {/* Description */}
          <motion.div
            className=" w-full px-3 py-2 border-2 border-[#D9D9D9]/50 rounded-2xl focus-within:ring-2 focus-within:ring-[#F17922] focus-within:border-transparent"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full text-[#595959] font-semibold text-[13px] py-2 focus:outline-none
              focus:border-transparent"
              rows={4}
              placeholder="4 Morceaux,
                       1 Portion, de frites,
                       1 Coleslaw,
                       1 crème à l'ail,
                       1 sauce cheddar"
            />
          </motion.div>
        </div>

        {/* Colonne droite */}
        <div className="space-y-6">
          {/* Catégorie */}
          <motion.div
            className="  px-3 py-4 border-2 border-[#D9D9D9]/50 flex items-center justify-between rounded-2xl
           "
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <span className="text-lg text-[#595959] font-semibold">
              Catégorie
            </span>

            <div className="ml-2 min-w-0 w-52 relative z-50">
              {isLoadingCategories ? (
                <div className="bg-[#d8d8d8] text-[#595959] font-semibold px-4 py-2 rounded-xl text-sm">
                  Chargement...
                </div>
              ) : (
                <SimpleSelect
                  options={categories}
                  value={formData.category[0] || ""}
                  onChange={(value) =>
                    setFormData({ ...formData, category: [value] })
                  }
                  placeholder="Choisissez une catégorie"
                />
              )}
            </div>
          </motion.div>

          {/* Restaurant */}
          <motion.div
            className="w-full px-3 py-2 border-2 border-[#d8d8d8] rounded-2xl focus-within:outline-none focus-within:ring-2 focus-within:ring-[#F17922] focus-within:border-transparent"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <h3 className="text-lg font-medium text-[#595959] mb-2">
              Choisissez les restaurants
            </h3>
            <SelectWithCheckboxes
              value={selectedRestaurants}
              onChange={setSelectedRestaurants}
              options={restaurants}
              placeholder="Sélectionnez les restaurants"
              className=""
            />
          </motion.div>

          {/* Suppléments */}
          <div className="border-2 border-[#D9D9D9]/50 rounded-2xl p-4 space-y-4">
            <h3 className="text-lg font-medium text-[#595959]">Produits</h3>

            {/* Ingrédients */}
            <motion.div
              className="w-full px-3 py-2 border-2 border-[#d8d8d8] rounded-2xl focus-within:outline-none focus-within:ring-2 focus-within:ring-[#F17922] focus-within:border-transparent relative"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="w-full flex items-center">
                <div className="flex-grow">
                  <SelectWithCheckboxesAndImages
                    value={selectedIngredients}
                    onChange={handleIngredientChange}
                    options={isLoadingSupplements ? [] : ingredientOptions}
                    placeholder="Sélectionnez des suppléments"
                  />
                </div>

                <div className="ml-2 text-[13px] text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
                  {selectedIngredients.length}
                </div>
              </div>
            </motion.div>

            {/* Accompagnements */}
            <motion.div
              className="w-full px-3 py-2 border-2 border-[#d8d8d8] rounded-2xl focus-within:outline-none focus-within:ring-2 focus-within:ring-[#F17922] focus-within:border-transparent"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="w-full flex items-center">
                <div className="flex-grow">
                  <SelectWithCheckboxesAndImages
                    value={selectedAccompagnements}
                    onChange={handleAccompagnementChange}
                    options={isLoadingSupplements ? [] : accompagnementOptions}
                    placeholder="Sélectionnez des sauces"
                  />
                </div>

                <div className="ml-2 text-[13px] text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
                  {selectedAccompagnements.length}
                </div>
              </div>
            </motion.div>

            {/* Boissons */}
            <motion.div
              className="w-full px-3 py-2 border-2 border-[#d8d8d8] rounded-2xl focus-within:outline-none focus-within:ring-2 focus-within:ring-[#F17922] focus-within:border-transparent"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="w-full flex items-center">
                <div className="flex-grow">
                  <SelectWithCheckboxesAndImages
                    value={selectedBoissons}
                    onChange={handleBoissonChange}
                    options={isLoadingSupplements ? [] : boissonOptions}
                    placeholder="Sélectionnez des boissons"
                  />
                </div>

                <div className="ml-2 text-[13px] text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
                  {selectedBoissons.length}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Boutons d'action */}
      <div className="flex items-center justify-center gap-4 mt-6">
        <motion.button
          type="button"
          className="h-[32px] text-[#9796A1] px-8 rounded-[10px] bg-[#ECECEC] text-[13px] items-center justify-center hover:bg-gray-100 min-w-[160px]"
          onClick={() => onCancel?.()}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Annuler
        </motion.button>
        <motion.button
          type="submit"
          className="h-[32px] px-8 rounded-[10px] bg-[#F17922] hover:bg-[#F17922]/90 text-white text-[13px] min-w-[170px]"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={isSubmitting}
        >
          Modifier
        </motion.button>
      </div>
    </motion.form>
  );
};

export default EditMenuForm;

"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Checkbox from "@/components/ui/Checkbox";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { MenuItem } from "@/types";
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
import { sanitizeMenuInput } from "@/schemas/menuSchemas";

// ✅ INTERFACES POUR LE FORMULAIRE DE CRÉATION
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
  is_alway_epice: boolean;
  private: boolean;
}

interface AddMenuFormProps {
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

// ✅ COMPOSANT POUR LA CRÉATION DE MENUS
const AddMenuForm = ({ onCancel, onSubmit }: AddMenuFormProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ✅ INITIALISATION POUR LA CRÉATION (VALEURS VIDES)
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
    is_alway_epice: false, // ✅ Nom corrigé sans "s"
    private: false,
  });

  // ✅ ÉTATS POUR LA CRÉATION
  const [imagePreview, setImagePreview] = useState<string | null>(null);

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

  // ✅ INITIALISATION DES RESTAURANTS POUR LA CRÉATION
  const initializeSelectedRestaurants = useCallback(
    (availableRestaurants: RestaurantOption[]) => {
      try {
        // ✅ Pour la création, sélectionner le premier restaurant par défaut
        if (availableRestaurants.length > 0) {
          const firstRestaurant = availableRestaurants[0];
          if (
            firstRestaurant.value &&
            typeof firstRestaurant.value === "string"
          ) {
            const sanitizedId = sanitizeMenuInput(firstRestaurant.value);
            if (sanitizedId.length > 0) {
              setSelectedRestaurants([sanitizedId]);
              return;
            }
          }
        }

        // ✅ Fallback si aucun restaurant disponible
        setSelectedRestaurants([]);
      } catch (error) {
        console.error(
          "Erreur lors de l'initialisation des restaurants:",
          error
        );
        setSelectedRestaurants([]);
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
  }, [initializeSelectedRestaurants]);

  // ✅ CHARGEMENT SÉCURISÉ DES SUPPLÉMENTS
  useEffect(() => {
    const fetchSupplements = async () => {
      setIsLoadingSupplements(true);
      try {
        const data = await getAllSupplements();

        // ✅ Validation et initialisation sécurisée des options
        if (data && typeof data === "object") {
          // ✅ Traitement sécurisé des ingrédients (ACCESSORY)
          if (data.ACCESSORY && Array.isArray(data.ACCESSORY)) {
            try {
              const convertedOptions = convertSupplementsToOptions(
                data.ACCESSORY
              );
              if (Array.isArray(convertedOptions)) {
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

        // ✅ Mode création : initialiser avec des états vides
        setSelectedIngredients([]);
        setIngredientQuantities({});
        setSelectedAccompagnements([]);
        setAccompagnementQuantities({});
        setSelectedBoissons([]);
        setBoissonQuantities({});
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
  }, []);

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

      // ✅ CRÉATION DE L'OBJET MENUITEM POUR NOUVEAU MENU
      const menuData = {
        id: "", // Nouveau menu, pas d'ID
        name: sanitizedTitle,
        categoryId: formData.category[0],
        price: formData.price,
        description: sanitizedDescription,
        image: imagePreview || "",
        imageUrl: "", // Nouveau menu, pas d'URL existante
        isAvailable: true,
        isNew: true, // Nouveau menu
        restaurant: "",
        restaurantId:
          selectedRestaurants.length > 0 ? selectedRestaurants[0] : "",
        selectedRestaurants: selectedRestaurants,
        rating: 0,
        supplements: {},
        reviews: [],
        totalReviews: 0,
        is_promotion: formData.reduction === true,
        promotion_price: formData.reduction ? formData.reducedPrice : "0",
        dish_supplements: dishSupplements,
        is_alway_epice: formData.is_alway_epice,
        private: formData.private,
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
                 border-[#F17922] border hover:border-[#F17922] text-sm px-[10px]"
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

          <div className="flex flex-row justify-between items-center w-full gap-2">
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
            {/* Epicé */}
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
          <div>
            <motion.div
              className="space-y-2 w-full px-3 py-2 border-2 border-[#D9D9D9]/50 rounded-2xl focus-within:outline-none focus-within:ring-2 focus-within:ring-[#F17922] focus-within:border-transparent"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex items-center">
                <Checkbox
                  id="private"
                  checked={formData.private}
                  onChange={(checked) => {
                    setFormData((prev) => ({
                      ...prev,
                      private: checked,
                    }));
                  }}
                />
                <label
                  htmlFor="private"
                  className="ml-2 text-[13px] font-semibold text-gray-700"
                >
                  Privé
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
          Enregistrer
        </motion.button>
      </div>
    </motion.form>
  );
};

export default AddMenuForm;

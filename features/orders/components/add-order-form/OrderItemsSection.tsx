"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Checkbox from "@/components/ui/Checkbox";
import {
  OrderFormData,
  OrderItemFormData,
  SupplementItem,
  SupplementOption,
} from "../../types/order-form.types";
import { Dish } from "../../../menus/types/dish.types";
import { useCategoryListQuery } from "../../../menus/queries/category/category-list.query";
import { useCategoryOneQuery } from "../../../menus/queries/category/category-one.query";
import { Edit2, Trash } from "lucide-react";
import { useDishListQuery } from "../../../menus/queries/dish-list.query";
import { OrderType } from "../../types/order.types";
import { formatImageUrl } from "@/utils/imageHelpers";

interface OrderItemsSectionProps {
  formData: OrderFormData;
  items: OrderItemFormData[];
  onItemsChange: (items: OrderItemFormData[]) => void;
}

const OrderItemsSection: React.FC<OrderItemsSectionProps> = ({
  formData,
  items,
  onItemsChange,
}) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [selectedDishForConfig, setSelectedDishForConfig] =
    useState<Dish | null>(null);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [tempQuantity, setTempQuantity] = useState(1);
  const [tempSupplements, setTempSupplements] = useState<SupplementItem[]>([]);
  const [tempEpice, setTempEpice] = useState(false);

  // Récupérer tous les plats
  const { data: allDishes } = useDishListQuery();
  // Récupérer toutes les catégories
  const { data: categoriesData, isLoading: isLoadingCategories } =
    useCategoryListQuery();
  const categories = categoriesData || [];

  // Récupérer les plats de la catégorie sélectionnée
  const { data: categoryData, isLoading: isLoadingDishes } =
    useCategoryOneQuery(selectedCategoryId);

  const dishes = categoryData?.dishes || [];

  const addItemToCart = () => {
    if (!selectedDishForConfig) return;

    if (editingItemIndex !== null) {
      // Modifier l'article existant
      const newItems = [...items];
      newItems[editingItemIndex] = {
        dish_id: selectedDishForConfig.id,
        quantity: tempQuantity,
        supplements: tempSupplements.filter((s) => s.quantity > 0),
        epice: tempEpice,
      };
      onItemsChange(newItems);
      setEditingItemIndex(null);
    } else {
      // Ajouter un nouvel article
      onItemsChange([
        ...items,
        {
          dish_id: selectedDishForConfig.id,
          quantity: tempQuantity,
          supplements: tempSupplements.filter((s) => s.quantity > 0),
          epice: selectedDishForConfig.is_alway_epice ? true : tempEpice,
        },
      ]);
    }

    // Réinitialiser
    setSelectedDishForConfig(null);
    setTempQuantity(1);
    setTempSupplements([]);
    setTempEpice(false);
  };

  const removeItem = (index: number) => {
    onItemsChange(items.filter((_, i) => i !== index));
  };

  const editItem = (index: number) => {
    const item = items[index];
    const dish = getDishById(item.dish_id);
    if (!dish) return;

    setSelectedDishForConfig(dish);
    setEditingItemIndex(index);
    setTempQuantity(item.quantity);
    setTempSupplements(item.supplements);
    setTempEpice(item.epice);
  };

  const getDishById = (dishId: string): Dish | undefined => {
    if (!allDishes) return undefined;
    return allDishes.find((dish: Dish) => dish.id === dishId);
  };

  const getSupplementsOptions = (dish: Dish): SupplementOption[] => {
    if (!dish.dish_supplements) return [];

    return dish.dish_supplements.map((ds) => ({
      value: ds.supplement_id,
      label: ds.supplement?.name || "",
      price: ds.supplement?.price || 0,
      image: formatImageUrl(ds?.supplement?.image),
      type: ds.supplement?.category || "ACCESSORY",
    }));
  };

  // Grouper les suppléments par catégorie
  const groupedSupplements = useMemo(() => {
    if (!selectedDishForConfig) return { FOOD: [], DRINK: [], ACCESSORY: [] };

    const supplements = getSupplementsOptions(selectedDishForConfig);
    return supplements.reduce(
      (acc, supp) => {
        const category = supp.type as "FOOD" | "DRINK" | "ACCESSORY";
        if (!acc[category]) acc[category] = [];
        acc[category].push(supp);
        return acc;
      },
      { FOOD: [], DRINK: [], ACCESSORY: [] } as Record<
        "FOOD" | "DRINK" | "ACCESSORY",
        SupplementOption[]
      >
    );
  }, [selectedDishForConfig]);

  const calculateItemTotal = (item: OrderItemFormData): number => {
    const dish = getDishById(item.dish_id);
    if (!dish) return 0;

    const basePrice =
      dish.is_promotion && dish.promotion_price
        ? dish.promotion_price
        : dish.price;

    const supplementsPrice = item.supplements.reduce((sum, supp) => {
      const supplement = dish.dish_supplements?.find(
        (ds) => ds.supplement_id === supp.id
      )?.supplement;
      return sum + (supplement?.price || 0) * supp.quantity;
    }, 0);

    return basePrice * item.quantity + supplementsPrice;
  };

  // Calculer le prix actuel en temps réel dans le modal
  const calculateTempTotal = (): number => {
    if (!selectedDishForConfig) return 0;

    const basePrice =
      selectedDishForConfig.is_promotion &&
      selectedDishForConfig.promotion_price
        ? selectedDishForConfig.promotion_price
        : selectedDishForConfig.price;

    const supplementsPrice = tempSupplements.reduce((sum, supp) => {
      const supplement = selectedDishForConfig.dish_supplements?.find(
        (ds) => ds.supplement_id === supp.id
      )?.supplement;
      return sum + (supplement?.price || 0) * supp.quantity;
    }, 0);

    return basePrice * tempQuantity + supplementsPrice;
  };

  // Helpers pour gérer la quantité des suppléments
  const getSupplementQuantity = (suppId: string): number => {
    const found = tempSupplements.find((s) => s.id === suppId);
    return found ? found.quantity : 0;
  };

  const updateSupplementQuantity = (suppId: string, delta: number) => {
    const existing = tempSupplements.find((s) => s.id === suppId);
    if (existing) {
      const newQty = existing.quantity + delta;
      if (newQty <= 0) {
        // Supprimer le supplément
        setTempSupplements(tempSupplements.filter((s) => s.id !== suppId));
      } else {
        setTempSupplements(
          tempSupplements.map((s) =>
            s.id === suppId ? { ...s, quantity: newQty } : s
          )
        );
      }
    } else if (delta > 0) {
      // Ajouter un nouveau supplément
      setTempSupplements([...tempSupplements, { id: suppId, quantity: delta }]);
    }
  };

  const totalCart = items.reduce(
    (sum, item) => sum + calculateItemTotal(item),
    0
  );

  const categoryLabels = {
    FOOD: { label: "🧂 Sauces", icon: "🧂" },
    DRINK: { label: "🥤 Boissons", icon: "🥤" },
    ACCESSORY: { label: "🍟 Suppléments", icon: "🍟" },
  };

  // Frais de livraison depuis le formData (auto-rempli par DeliveryInfoSection)
  const isDelivery = formData.type === OrderType.DELIVERY;
  const currentDeliveryFee = isDelivery ? (formData.delivery_fee || 0) : 0;
  const grandTotal = totalCart + currentDeliveryFee;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-[#595959]">
        Articles commandés *
      </h3>

      {/* Layout principal: Catégories + Plats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Colonne gauche: Catégories */}
        <div className="lg:col-span-3">
          <div className="bg-white border-2 border-[#D9D9D9]/50 rounded-2xl p-4 sticky top-4">
            <h4 className="text-sm font-semibold text-[#595959] mb-3">
              📂 Catégories
            </h4>

            {isLoadingCategories ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-12 bg-gray-200 rounded-xl animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {categories.map((category: any) => (
                  <motion.button
                    key={category.id}
                    type="button"
                    onClick={() => setSelectedCategoryId(category.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
                      selectedCategoryId === category.id
                        ? "bg-[#F17922] text-white shadow-md"
                        : "bg-[#F5F5F5] text-[#595959] hover:bg-[#F17922]/10"
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-2">
                      {category.image && (
                        <Image
                          src={formatImageUrl(category.image)}
                          alt={category.name}
                          width={32}
                          height={32}
                          className="rounded-lg object-cover"
                        />
                      )}
                      <span className="text-sm font-semibold truncate">
                        {category.name}
                      </span>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Colonne droite: Plats */}
        <div className="lg:col-span-9">
          <div className="bg-white border-2 border-[#D9D9D9]/50 rounded-2xl p-4">
            <h4 className="text-sm font-semibold text-[#595959] mb-3">
              🍽️ Plats
            </h4>

            {!selectedCategoryId ? (
              <div className="text-center py-12 text-gray-400">
                <p>Sélectionnez une catégorie pour voir les plats</p>
              </div>
            ) : isLoadingDishes ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-32 bg-gray-200 rounded-xl animate-pulse"
                  />
                ))}
              </div>
            ) : dishes.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p>Aucun plat disponible dans cette catégorie</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto">
                {dishes.map((dish: Dish) => (
                  <motion.div
                    key={dish.id}
                    className="border-2 border-[#D9D9D9]/50 rounded-xl p-3 hover:border-[#F17922] transition-all cursor-pointer"
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setSelectedDishForConfig(dish);
                      setEditingItemIndex(null);
                      setTempQuantity(1);
                      setTempSupplements([]);
                      setTempEpice(false);
                    }}
                  >
                    {dish.image && (
                      <Image
                        src={formatImageUrl(dish.image)}
                        alt={dish.name}
                        width={120}
                        height={80}
                        className="w-full h-32 object-cover rounded-lg mb-2"
                      />
                    )}
                    <h5 className="font-semibold text-[#595959] text-sm mb-1">
                      {dish.name}
                    </h5>
                    <div className="flex items-center justify-between">
                      <span className="text-[#F17922] font-bold text-sm">
                        {dish.is_promotion && dish.promotion_price ? (
                          <>
                            <span className="line-through text-gray-400 text-xs mr-1">
                              {dish.price} XOF
                            </span>
                            {dish.promotion_price} XOF
                          </>
                        ) : (
                          `${dish.price} XOF`
                        )}
                      </span>
                      {dish.is_alway_epice && (
                        <span className="text-xs">🌶️</span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de configuration du plat */}
      <AnimatePresence>
        {selectedDishForConfig && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => {
              setSelectedDishForConfig(null);
              setEditingItemIndex(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-4">
                <h4 className="text-lg font-semibold text-[#595959]">
                  {editingItemIndex !== null
                    ? "Modifier l'article"
                    : "Configuration du plat"}
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDishForConfig(null);
                    setEditingItemIndex(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {/* Image et infos du plat */}
              <div className="mb-4">
                {selectedDishForConfig.image && (
                  <Image
                    src={formatImageUrl(selectedDishForConfig.image)}
                    alt={selectedDishForConfig.name}
                    width={400}
                    height={200}
                    className="w-full h-48 object-cover rounded-xl mb-3"
                  />
                )}
                <h5 className="font-semibold text-[#595959] text-lg mb-1">
                  {selectedDishForConfig.name}
                </h5>
                <p className="text-sm text-gray-600 mb-2">
                  {selectedDishForConfig.description}
                </p>
                <p className="text-[#F17922] font-bold">
                  {selectedDishForConfig.is_promotion &&
                  selectedDishForConfig.promotion_price ? (
                    <>
                      <span className="line-through text-gray-400 text-sm mr-2">
                        {selectedDishForConfig.price} XOF
                      </span>
                      {selectedDishForConfig.promotion_price} XOF
                    </>
                  ) : (
                    `${selectedDishForConfig.price} XOF`
                  )}
                </p>
              </div>

              {/* Quantité */}
              <div className="mb-4">
                <label className="text-sm font-semibold text-[#595959] mb-2 block">
                  Quantité
                </label>
                <div className="flex items-center gap-3">
                  <motion.button
                    type="button"
                    onClick={() =>
                      setTempQuantity(Math.max(1, tempQuantity - 1))
                    }
                    className="w-10 h-10 bg-[#F5F5F5] rounded-lg font-semibold text-[#595959] hover:bg-[#F17922] hover:text-white"
                    whileTap={{ scale: 0.9 }}
                  >
                    −
                  </motion.button>
                  <span className="text-lg font-semibold text-[#595959] min-w-[40px] text-center">
                    {tempQuantity}
                  </span>
                  <motion.button
                    type="button"
                    onClick={() => setTempQuantity(tempQuantity + 1)}
                    className="w-10 h-10 bg-[#F5F5F5] rounded-lg font-semibold text-[#595959] hover:bg-[#F17922] hover:text-white"
                    whileTap={{ scale: 0.9 }}
                  >
                    +
                  </motion.button>
                </div>
              </div>

              {/* Suppléments groupés par catégorie — avec sélecteur de quantité ± */}
              {(groupedSupplements.FOOD.length > 0 ||
                groupedSupplements.DRINK.length > 0 ||
                groupedSupplements.ACCESSORY.length > 0) && (
                <div className="mb-4 space-y-4">
                  <label className="text-sm font-semibold text-[#595959] block">
                    Suppléments
                  </label>

                  {(["FOOD", "DRINK", "ACCESSORY"] as const).map((cat) =>
                    groupedSupplements[cat].length > 0 ? (
                      <div key={cat} className="border-2 border-[#D9D9D9]/50 rounded-xl p-3">
                        <h6 className="text-sm font-semibold text-[#595959] mb-2">
                          {categoryLabels[cat].label}
                        </h6>
                        <div className="grid grid-cols-2 gap-2">
                          {groupedSupplements[cat].map((supp) => {
                            const qty = getSupplementQuantity(supp.value);
                            return (
                              <div
                                key={supp.value}
                                className={`flex items-center gap-2 p-2 rounded-lg border-2 transition-all ${
                                  qty > 0
                                    ? "border-[#F17922] bg-[#F17922]/10"
                                    : "border-[#D9D9D9]/50 hover:border-[#F17922]/50"
                                }`}
                              >
                                {supp.image && (
                                  <Image
                                    src={supp.image}
                                    alt={supp.label}
                                    width={32}
                                    height={32}
                                    className="rounded object-cover"
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-[#595959] truncate">
                                    {supp.label}
                                  </p>
                                  <p className="text-xs text-[#F17922] font-bold">
                                    {qty > 0
                                      ? `+${supp.price * qty} XOF`
                                      : `+${supp.price} XOF`}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1">
                                  <motion.button
                                    type="button"
                                    onClick={() => updateSupplementQuantity(supp.value, -1)}
                                    className={`w-7 h-7 rounded-md font-semibold text-sm flex items-center justify-center ${
                                      qty > 0
                                        ? "bg-[#F17922] text-white"
                                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                                    }`}
                                    whileTap={qty > 0 ? { scale: 0.9 } : undefined}
                                    disabled={qty === 0}
                                  >
                                    −
                                  </motion.button>
                                  <span className="text-sm font-semibold text-[#595959] min-w-[20px] text-center">
                                    {qty}
                                  </span>
                                  <motion.button
                                    type="button"
                                    onClick={() => updateSupplementQuantity(supp.value, 1)}
                                    className="w-7 h-7 bg-[#F17922] text-white rounded-md font-semibold text-sm flex items-center justify-center"
                                    whileTap={{ scale: 0.9 }}
                                  >
                                    +
                                  </motion.button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : null
                  )}
                </div>
              )}

              {/* Épicé */}
              {!selectedDishForConfig.is_alway_epice && (
                <div className="mb-4">
                  <div className="flex items-center">
                    <Checkbox
                      id="temp-epice"
                      checked={tempEpice}
                      onChange={setTempEpice}
                    />
                    <label
                      htmlFor="temp-epice"
                      className="ml-2 text-sm font-semibold text-gray-700 cursor-pointer"
                    >
                      🌶️ Épicé
                    </label>
                  </div>
                </div>
              )}

              {selectedDishForConfig.is_alway_epice && (
                <div className="mb-4 px-3 py-2 bg-orange-50 border border-orange-200 rounded-xl">
                  <span className="text-sm text-orange-600">
                    🌶️ Ce plat est toujours épicé
                  </span>
                </div>
              )}

              {/* Prix total en temps réel */}
              <div className="mb-4 p-3 bg-[#F5F5F5] rounded-xl">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-[#595959]">
                    Prix total
                  </span>
                  <span className="text-xl font-bold text-[#F17922]">
                    {calculateTempTotal()} XOF
                  </span>
                </div>
              </div>

              {/* Bouton Ajouter/Modifier */}
              <motion.button
                type="button"
                onClick={addItemToCart}
                className="w-full py-3 bg-[#F17922] text-white rounded-xl font-semibold hover:bg-[#F17922]/90"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {editingItemIndex !== null
                  ? "✓ Modifier l'article"
                  : "Ajouter au panier"}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Panier */}
      {items.length > 0 && (
        <div className="bg-gradient-to-br from-white to-[#FFF8F3] border-2 border-[#F17922]/20 rounded-2xl overflow-hidden">
          {/* Header du panier */}
          <div className="bg-[#F17922] px-4 sm:px-6 py-3 flex items-center justify-between">
            <h4 className="text-white font-bold text-sm sm:text-base flex items-center gap-2">
              <span>🛒</span>
              Panier
            </h4>
            <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full">
              {items.length} article{items.length > 1 ? "s" : ""}
            </span>
          </div>

          {/* Liste des items */}
          <div className="p-4 sm:p-6 space-y-3">
            {items.map((item, index) => {
              const dish = getDishById(item.dish_id);
              if (!dish) return null;

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white rounded-xl border border-[#D9D9D9]/30 shadow-sm hover:shadow-md transition-shadow"
                >
                  {dish.image && (
                    <Image
                      src={formatImageUrl(dish.image)}
                      alt={dish.name}
                      width={72}
                      height={72}
                      className="rounded-xl object-cover w-16 h-16 sm:w-[72px] sm:h-[72px] flex-shrink-0"
                    />
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#595959] text-sm sm:text-base truncate">
                      {dish.name}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <span className="inline-flex items-center bg-[#F5F5F5] text-[#595959] text-xs font-semibold px-2 py-0.5 rounded-md">
                        x{item.quantity}
                      </span>
                      {item.epice && (
                        <span className="inline-flex items-center bg-red-50 text-red-500 text-xs font-semibold px-2 py-0.5 rounded-md">
                          🌶️ Épicé
                        </span>
                      )}
                      {item.supplements.length > 0 && (
                        <span className="inline-flex items-center bg-blue-50 text-blue-600 text-xs font-semibold px-2 py-0.5 rounded-md">
                          +{item.supplements.reduce((sum, s) => sum + s.quantity, 0)} supp.
                        </span>
                      )}
                    </div>
                    <p className="text-[#F17922] font-bold text-sm sm:text-base mt-1">
                      {calculateItemTotal(item).toLocaleString()} XOF
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-1">
                    <motion.button
                      type="button"
                      onClick={() => editItem(index)}
                      className="text-[#F17922] hover:bg-[#F17922]/10 p-2 rounded-lg transition-colors"
                      whileTap={{ scale: 0.9 }}
                    >
                      <Edit2 size={18} />
                    </motion.button>
                    <motion.button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="text-red-400 hover:bg-red-50 hover:text-red-600 p-2 rounded-lg transition-colors"
                      whileTap={{ scale: 0.9 }}
                    >
                      <Trash size={18} />
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Résumé de prix */}
          <div className="bg-white border-t-2 border-[#F17922]/10 px-4 sm:px-6 py-4 sm:py-6 space-y-3">
            {/* Sous-total */}
            <div className="flex justify-between items-center">
              <span className="text-sm sm:text-base text-[#71717A] font-medium">
                Sous-total articles
              </span>
              <span className="text-sm sm:text-base font-semibold text-[#595959]">
                {totalCart.toLocaleString()} XOF
              </span>
            </div>

            {/* Frais de livraison */}
            <div className="flex justify-between items-center">
              <span className="text-sm sm:text-base text-[#71717A] font-medium">
                Frais de livraison
              </span>
              {isDelivery ? (
                <span className="text-sm sm:text-base font-semibold text-[#595959]">
                  {currentDeliveryFee > 0
                    ? `${currentDeliveryFee.toLocaleString()} XOF`
                    : "Non calculé"}
                </span>
              ) : (
                <span className="text-sm sm:text-base font-semibold text-green-600">
                  Non applicable
                </span>
              )}
            </div>

            {/* Séparateur */}
            <div className="border-t-2 border-dashed border-[#D9D9D9]/50 my-2" />

            {/* Total */}
            <div className="flex justify-between items-center">
              <span className="text-base sm:text-lg font-bold text-[#595959]">
                Total à payer
              </span>
              <div className="text-right">
                <span className="text-xl sm:text-2xl font-extrabold text-[#F17922]">
                  {grandTotal.toLocaleString()}
                </span>
                <span className="text-sm sm:text-base font-bold text-[#F17922] ml-1">
                  XOF
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {items.length === 0 && (
        <div className="text-center py-12 text-gray-400 border-2 border-dashed border-[#D9D9D9]/50 rounded-2xl bg-[#FAFAFA]">
          <div className="text-4xl mb-3">🛒</div>
          <p className="font-semibold text-[#595959]">Votre panier est vide</p>
          <p className="text-sm mt-1 text-gray-400">Sélectionnez une catégorie puis ajoutez des plats</p>
        </div>
      )}
    </div>
  );
};

export default OrderItemsSection;

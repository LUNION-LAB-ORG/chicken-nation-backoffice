"use client";

import React, { useState, useRef, useMemo, useEffect } from "react";
import Image from "next/image";
import { ChevronDown, Eye, Menu } from "lucide-react";
import Checkbox from "@/components/ui/Checkbox";
import Toggle from "@/components/ui/Toggle";
import SupplementActionsMenu from "./SupplementActionsMenu";
import { createPortal } from "react-dom";
import { Pagination } from "@/components/ui/pagination";
import { formatImageUrl } from "@/utils/imageHelpers";
import BadgeDisponibilite from "./BadgeDisponibilite";

type ProductCategory = "all" | "FOOD" | "DRINK" | "ACCESSORY";

// Type pour les produits dans la vue
interface ProductViewItem {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  image: string;
  available: boolean;
}

/**
 * Chaque geste d'écriture n'apparaît que si l'écran parent passe son rappel,
 * et il ne le passe que si le profil en a le droit. Sans `onUpdateAvailability`,
 * la disponibilité s'affiche en badge ; sans aucune action, la colonne
 * « Actions » disparaît et `onView` ouvre la fiche en lecture.
 */
interface ProductsViewProps {
  selectedTab: ProductCategory;
  onEdit?: (product: ProductViewItem) => void;
  /** Fiche en lecture seule, pour un profil qui ne peut pas modifier. */
  onView?: (product: ProductViewItem) => void;
  onCreateProduct?: () => void;
  products: ProductViewItem[];
  onUpdateAvailability?: (productId: string, available: boolean) => void;
  onDeleteProduct?: (productId: string) => void;
  onDelete?: (product: ProductViewItem) => void;
  searchQuery?: string;
  // ✅ Props de pagination
  totalItems?: number;
  totalPages?: number;
  currentPage?: number;
  isLoading?: boolean;
  onPageChange?: (page: number) => void;
}

export default function SupplementView({
  // selectedTab,
  onEdit,
  onView,
  onCreateProduct,
  products = [],
  onUpdateAvailability,
  onDeleteProduct,
  onDelete,
  searchQuery = "",
  // ✅ Props de pagination
  // totalItems = 0,
  totalPages = 1,
  currentPage = 1,
  isLoading = false,
  onPageChange,
}: ProductsViewProps) {
  const [selectedProduct, setSelectedProduct] =
    useState<ProductViewItem | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const safeProducts = useMemo(() => {
    const result = Array.isArray(products) ? products : [];

    return result;
  }, [products]);

  // Fonction pour traduire les catégories avec sécurité
  const translateCategory = (
    category:
      | string
      | { name?: string; id?: string; type?: string }
      | null
      | undefined
  ): string => {
    // ✅ Sécurité : extraire la valeur correcte de la catégorie
    let categoryStr = "";

    if (typeof category === "string") {
      categoryStr = category;
    } else if (category && typeof category === "object") {
      categoryStr =
        category.name || category.id || category.type || String(category);
    } else {
      categoryStr = String(category || "");
    }

    const translations: Record<string, string> = {
      FOOD: "Sauces",
      DRINK: "Boissons",
      ACCESSORY: "Suppléments",
      all: "Tous les produits",
    };
    return translations[categoryStr] || categoryStr;
  };

  // Fonction pour sécuriser l'affichage des chaînes
  const safeString = (
    value: string | number | object | null | undefined
  ): string => {
    if (value === null || value === undefined) return "";
    if (typeof value === "string") return value;
    if (typeof value === "number") return String(value);
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };

  // Filtrer les produits basé sur la recherche
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) {
      return safeProducts;
    }

    return safeProducts.filter(
      (product) =>
        product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.price?.toString().includes(searchQuery)
    );
  }, [safeProducts, searchQuery]);

  // ✅ Plus de pagination côté client - utiliser directement les produits filtrés
  const paginatedProducts = filteredProducts;

  // Fonctions de gestion de la sélection
  const toggleItemSelection = (itemId: string) => {
    setSelectedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const toggleAllSelection = () => {
    if (selectedItems.length === filteredProducts.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(paginatedProducts.map((product) => product.id));
    }
  };

  const isAllSelected =
    selectedItems.length === paginatedProducts.length &&
    paginatedProducts.length > 0;

  // Le menu d'actions ne s'ouvre que s'il contient au moins un geste permis.
  const aDesActions = Boolean(onEdit || onDelete || onDeleteProduct);
  const colonneActions = aDesActions || Boolean(onView);

  const handleMenuOpen = (productId: string, event: React.MouseEvent) => {
    event.stopPropagation();

    if (menuOpenId === productId) {
      setMenuOpenId(null);
      setMenuPosition(null);
    } else {
      setMenuPosition({
        top: event.clientY,
        left: event.clientX - 150,
      });
      setMenuOpenId(productId);
    }
  };

  useEffect(() => {
    if (!menuOpenId) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && menuRef.current.contains(e.target as Node)) return;
      setMenuOpenId(null);
      setMenuPosition(null);
    };
    const handleClose = () => {
      setMenuOpenId(null);
      setMenuPosition(null);
    };
    window.addEventListener("scroll", handleClose, true);
    window.addEventListener("resize", handleClose);
    window.addEventListener("click", handleClick);
    return () => {
      window.removeEventListener("scroll", handleClose, true);
      window.removeEventListener("resize", handleClose);
      window.removeEventListener("click", handleClick);
    };
  }, [menuOpenId]);

  return (
    <div className="w-full">
      <div className="flex flex-col lg:flex-row gap-6 rounded-2xl">
        <div className="flex-1 hidden md:block">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {/* Colonne de sélection - conditionnelle */}
                <th className="w-10 pl-6">
                  <Checkbox
                    checked={isAllSelected}
                    onChange={toggleAllSelection}
                  />
                </th>
                <th className="w-16"></th>
                <th className="text-left py-4 text-[14px] text-[#71717A] font-bold w-[250px]">
                  <div className="flex items-center">
                    Produits
                    <ChevronDown className="ml-2 w-4 h-4" />
                  </div>
                </th>
                <th className="text-left py-4 text-[14px] text-[#71717A] font-bold w-[200px]">
                  <div className="flex items-center">
                    Catégorie
                    <ChevronDown className="ml-2 w-4 h-4" />
                  </div>
                </th>
                <th className="text-right py-4 text-[14px] text-[#71717A] font-bold w-[250px]">
                  <div className="flex items-center justify-end">
                    Prix XOF
                    <ChevronDown className="ml-2 w-4 h-4" />
                  </div>
                </th>
                {/* Colonne Disponible - conditionnelle */}
                <th className="text-center py-4 text-[14px] text-[#71717A] font-bold w-[300px]">
                  <div className="flex items-center justify-center">
                    Disponible
                    <ChevronDown className="ml-2 w-4 h-4" />
                  </div>
                </th>
                {/* Colonne Actions - conditionnelle */}
                {colonneActions && (
                  <th className="text-center py-4 text-[14px] text-[#71717A] font-bold w-[100px]">
                    <div className="flex items-center justify-center">
                      {aDesActions ? "Actions" : "Fiche"}
                    </div>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {paginatedProducts
                .filter(
                  (product) =>
                    product && typeof product === "object" && product.id
                )
                .map((product) => (
                  <tr
                    key={product.id}
                    onClick={() => {
                      setSelectedProduct(product);
                      onView?.(product);
                    }}
                    className={`border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                      selectedProduct?.id === product.id ? "bg-gray-50" : ""
                    }`}
                  >
                    {/* Cellule de sélection - conditionnelle */}
                    <td
                      className="py-4 pl-6"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        checked={selectedItems.includes(product.id)}
                        onChange={() => toggleItemSelection(product.id)}
                      />
                    </td>
                    <td className="py-4 pl-10">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 mr-20">
                        <Image
                          src={
                            product.image
                              ? formatImageUrl(product.image)
                              : "/images/plat.png"
                          }
                          alt={product.name || "Image du produit"}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover "
                        />
                      </div>
                    </td>
                    <td className="py-4 text-[13px] text-gray-900  ">
                      {safeString(product.name)}
                    </td>
                    <td className="py-4 text-gray-900">
                      {translateCategory(product.category) || "Non catégorisé"}
                    </td>
                    <td className="py-4 text-[13px] text-gray-900 text-right pr-8">
                      {product.price === 0 ? (
                        <span className="text-[#F17922] font-medium">
                          Gratuit
                        </span>
                      ) : (
                        `${product.price} XOF`
                      )}
                    </td>
                    {/* Cellule Disponible - conditionnelle */}
                    <td className="py-4 px-4">
                      <div
                        className="flex items-center justify-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {onUpdateAvailability ? (
                          <Toggle
                            checked={product.available || false}
                            onChange={(checked) =>
                              onUpdateAvailability(product.id, checked)
                            }
                          />
                        ) : (
                          <BadgeDisponibilite
                            disponible={product.available || false}
                          />
                        )}
                      </div>
                    </td>
                    {/* Cellule Actions - conditionnelle */}
                    {colonneActions && (
                      <td className="text-center">
                        {aDesActions ? (
                          <button
                            onClick={(e) => handleMenuOpen(product.id, e)}
                            className="px-2 py-2 text-[14px] cursor-pointer hover:bg-gray-100  rounded-full transition-colors"
                            aria-label="Actions"
                          >
                            <Menu
                              size={20}
                              className="text-slate-500 hover:text-slate-600"
                            />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onView?.(product);
                            }}
                            className="px-2 py-2 text-[14px] cursor-pointer hover:bg-gray-100  rounded-full transition-colors"
                            aria-label="Voir la fiche"
                            title="Voir la fiche"
                          >
                            <Eye
                              size={20}
                              className="text-slate-500 hover:text-slate-600"
                            />
                          </button>
                        )}
                        {aDesActions &&
                          menuOpenId === product.id &&
                          menuPosition &&
                          createPortal(
                            <SupplementActionsMenu
                              menuPosition={menuPosition}
                              menuRef={menuRef}
                              productId={product.id}
                              onEdit={
                                onEdit
                                  ? () => {
                                      setMenuOpenId(null);
                                      onEdit(product);
                                    }
                                  : undefined
                              }
                              onDelete={
                                onDeleteProduct || onDelete
                                  ? () => {
                                      setMenuOpenId(null);
                                      if (onDeleteProduct) {
                                        onDeleteProduct(product.id);
                                      } else if (onDelete) {
                                        onDelete(product);
                                      }
                                    }
                                  : undefined
                              }
                            />,
                            document.body
                          )}
                      </td>
                    )}
                  </tr>
                ))}
              {paginatedProducts.length === 0 &&
                filteredProducts.length === 0 && (
                  <tr key="empty-supplements-row">
                    <td
                      colSpan={colonneActions ? 7 : 6}
                      className="py-8 text-center"
                    >
                      <div className="flex items-center justify-center flex-col gap-4">
                        <span className="text-[14px] text-[#F17922]">
                          Aucun produit trouvé
                        </span>
                        {onCreateProduct && (
                          <button
                            onClick={onCreateProduct}
                            className="px-4 py-2 text-[14px] cursor-pointer bg-[#F17922] text-white font-medium rounded-xl 
                        hover:bg-[#F17922]/90 transition-colors"
                          >
                            Ajouter un produit
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>

        {/* Cards mobile */}
        <div className="flex flex-col gap-4 md:hidden">
          {paginatedProducts
            .filter(
              (product) => product && typeof product === "object" && product.id
            )
            .map((product) => (
              <div
                key={product.id}
                className={`bg-white rounded-xl shadow-sm border border-[#ECECEC] p-4 flex items-center gap-4 transition ${
                  onEdit || onView ? "cursor-pointer hover:bg-[#FFF6E9]/60" : ""
                }`}
                onClick={() => (onEdit ? onEdit(product) : onView?.(product))}
              >
                <div className="w-14 h-14 rounded-lg bg-[#FFF6E9] flex items-center justify-center overflow-hidden">
                  <Image
                    src={
                      product.image
                        ? formatImageUrl(product.image)
                        : "/images/plat.png"
                    }
                    alt={product.name || "Image du produit"}
                    width={56}
                    height={56}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center flex-row justify-between gap-2">
                    <span className="text-[13px] text-[#232323] font-semibold truncate">
                      {safeString(product.name)}
                    </span>
                    <span className="bg-[#FBDBA7] text-[#7A3502] text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {translateCategory(product.category)}
                    </span>
                  </div>
                  <div className="text-[12px] text-[#71717A] truncate">
                    {product.price === 0 ? (
                      <span className="text-[#F17922] font-medium">
                        Gratuit
                      </span>
                    ) : (
                      `${product.price} XOF`
                    )}
                  </div>
                  {/* Section disponibilité - conditionnelle */}
                  <div className="flex items-center justify-between mt-2">
                    <div className="text-[11px] text-[#F17922] font-medium">
                      {product.available ? "Disponible" : "Non disponible"}
                    </div>
                    {/* L'interrupteur n'ouvre plus la modification de la
                        carte : un seul toucher faisait les deux. */}
                    {onUpdateAvailability && (
                      <div onClick={(e) => e.stopPropagation()}>
                        <Toggle
                          checked={product.available || false}
                          onChange={(checked) =>
                            onUpdateAvailability(product.id, checked)
                          }
                        />
                      </div>
                    )}
                  </div>
                </div>
                {/* Menu actions - conditionnel */}
                {aDesActions ? (
                  <span
                    className="text-[#71717A] text-lg cursor-pointer select-none px-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMenuOpen(product.id, e);
                    }}
                  >
                    <Menu size={20} />
                  </span>
                ) : onView ? (
                  <span
                    className="text-[#71717A] text-lg cursor-pointer select-none px-2"
                    aria-label="Voir la fiche"
                  >
                    <Eye size={20} />
                  </span>
                ) : null}
              </div>
            ))}

          {paginatedProducts.length === 0 && filteredProducts.length === 0 && (
            <div
              key="empty-supplements-mobile"
              className="bg-white rounded-xl shadow-sm border border-[#ECECEC] p-6 flex flex-col items-center justify-center"
            >
              <span className="text-[14px] text-[#F17922] mb-4">
                Aucun produit trouvé
              </span>
              {onCreateProduct && (
                <button
                  onClick={onCreateProduct}
                  className="px-4 py-2 text-[14px] cursor-pointer bg-[#F17922] text-white font-medium rounded-xl 
                hover:bg-[#F17922]/90 transition-colors"
                >
                  Ajouter un produit
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Pagination serveur avec statistiques */}
      <div className="flex flex-col items-center py-4 px-2 border-t border-gray-200 mt-4 space-y-2">
        {/* Statistiques */}
        <div className="text-sm text-gray-600"></div>

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={Math.max(1, totalPages)}
          onPageChange={onPageChange || (() => {})}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}

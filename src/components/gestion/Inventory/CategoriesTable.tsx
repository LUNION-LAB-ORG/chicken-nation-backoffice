"use client";

import React, { useState } from "react";
import Image from "next/image";
import { MoreHorizontal, Loader2, Menu, ChevronDown } from "lucide-react";
import { Category as ApiCategory } from "@/services";
import { Pagination } from "@/components/ui/pagination";
import { useCategoriesQuery } from "@/hooks/useCategoriesQuery";
import { useRBAC } from "@/hooks/useRBAC";
import { formatImageUrl } from "@/utils/imageHelpers";

// Adapter l'interface Category de l'API pour le composant
interface Category extends ApiCategory {
  productCount?: number;
}

interface CategoriesTableProps {
  onEdit?: (category: Category) => void;
  onDelete?: (category: Category) => void;
  onCreateCategory?: () => void;
  searchQuery?: string;
}

export default function CategoriesTable({
  onEdit,
  onDelete,
  onCreateCategory,
  searchQuery = "",
}: CategoriesTableProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const { canUpdateCategory, canDeleteCategory } = useRBAC();

  // ✅ Utiliser TanStack Query pour les catégories
  const { categories, totalPages, currentPage, isLoading, setCurrentPage } =
    useCategoriesQuery({
      searchQuery,
    });

  // ✅ Déterminer si la colonne Actions doit être affichée
  const showActionsColumn =
    canUpdateCategory() || canDeleteCategory() || Boolean(onEdit || onDelete);

  // Fonction pour gérer le changement de page
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      setCurrentPage(page);
    }
  };

  // Fonction pour traduire les catégories avec sécurité
  const translateCategory = (
    category:
      | string
      | { name?: string; id?: string; type?: string }
      | null
      | undefined
  ): string => {
    // ✅ Sécurité : s'assurer que category est une chaîne
    const categoryStr =
      typeof category === "string" ? category : String(category || "");

    const translations: Record<string, string> = {
      FOOD: "Accompagnements",
      DRINK: "Boissons",
      ACCESSORY: "Ingrédients",
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

  // Fonction pour obtenir l'URL de l'image avec fallback

  return (
    <div className="w-full">
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-[#F17922] animate-spin" />
          <span className="ml-3 text-[14px] text-gray-600">
            Chargement des catégories...
          </span>
        </div>
      ) : (
        <>
          {/* Vue mobile (affichage en cartes) */}
          <div className="md:hidden">
            {categories.length === 0 ? (
              <div className="flex items-center justify-center flex-col gap-4 py-8">
                <span className="text-[14px] text-[#F17922]">
                  Aucune catégorie trouvée
                </span>
                {onCreateCategory && (
                  <button
                    onClick={onCreateCategory}
                    className="px-4 py-2 text-[14px] cursor-pointer bg-[#F17922] text-white font-medium rounded-xl 
                    hover:bg-[#F17922]/90 transition-colors"
                  >
                    Ajouter une catégorie
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {categories
                  .filter(
                    (category) =>
                      category && typeof category === "object" && category.id
                  )
                  .map((category) => (
                    <div
                      key={category.id}
                      className="bg-white rounded-xl shadow-sm border border-gray-100 p-4"
                    >
                      <div className="flex items-center">
                        {/* Image de la catégorie */}
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 mr-3 flex-shrink-0">
                          <Image
                            src={formatImageUrl(category.image)}
                            alt={category.name}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Informations de la catégorie */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-[14px] font-medium text-gray-900 truncate">
                            {translateCategory(category.name)}
                          </h3>
                          <p className="text-[12px] text-gray-500">
                            {category.productCount || 0} produit
                            {(category.productCount || 0) > 1 ? "s" : ""}
                          </p>
                          <p className="text-[12px] text-gray-500">
                            {category.private ? "Privée" : "Publique"}
                          </p>
                        </div>

                        {/* Menu d'actions - conditionnel */}
                        {showActionsColumn && (
                          <div className="relative">
                            <button
                              onClick={() =>
                                setOpenMenuId(
                                  openMenuId === category.id
                                    ? null
                                    : category.id
                                )
                              }
                              className="p-2 hover:bg-gray-50 rounded-full"
                              aria-label="Options de catégorie"
                              title="Options de catégorie"
                            >
                              <MoreHorizontal className="h-5 w-5 text-gray-500" />
                            </button>

                            {/* Dropdown menu */}
                            {openMenuId === category.id && (
                              <div className="absolute right-0 mt-1 w-48 bg-white rounded-[10px] shadow-lg py-1 z-10">
                                {canUpdateCategory && onEdit && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onEdit(category);
                                      setOpenMenuId(null);
                                    }}
                                    className="w-full px-4 py-2 text-left text-[13px] text-gray-900 hover:bg-gray-50"
                                  >
                                    Modifier cette catégorie
                                  </button>
                                )}
                                {canDeleteCategory && onDelete && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onDelete(category);
                                      setOpenMenuId(null);
                                    }}
                                    className="w-full px-4 py-2 text-left text-[13px] text-red-600 hover:bg-gray-50"
                                  >
                                    Supprimer
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Description (si disponible) */}
                      {category.description && (
                        <p className="text-[12px] text-gray-600 mt-2 line-clamp-2">
                          {safeString(category.description) || "--"}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Vue desktop (affichage en tableau) */}
          <div className="hidden md:block">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="w-16"></th>
                  <th className="text-left py-4 text-[14px] text-[#71717A] font-bold w-[300px] ">
                    <div className="flex items-center">Catégorie</div>
                  </th>
                  <th className="text-left py-4 text-[14px] text-[#71717A] font-bold w-[300px]">
                    <div className="flex items-center">Nombre de produits</div>
                  </th>
                  <th className="text-left py-4 text-[14px] text-[#71717A] font-bold w-[300px]">
                    <div className="flex items-center">Description</div>
                  </th>
                  <th className="text-left py-4 text-[14px] text-[#71717A] font-bold w-[300px]">
                    <div className="flex items-center">Visibilité</div>
                  </th>
                  {/* Colonne Actions - conditionnelle */}
                  {showActionsColumn && (
                    <th className="text-center py-4 text-[14px] text-[#71717A] font-bold w-[100px]">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {categories.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5 + (showActionsColumn ? 1 : 0)}
                      className="text-center py-8"
                    >
                      <div className="flex items-center justify-center flex-col gap-4">
                        <span className="text-[14px] text-[#F17922]">
                          Aucune catégorie trouvée
                        </span>
                        {onCreateCategory && (
                          <button
                            onClick={onCreateCategory}
                            className="px-4 py-2 text-[14px] cursor-pointer bg-[#F17922] text-white font-medium rounded-xl 
                            hover:bg-[#F17922]/90 transition-colors"
                          >
                            Ajouter une catégorie
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  categories
                    .filter(
                      (category) =>
                        category && typeof category === "object" && category.id
                    )
                    .map((category) => (
                      <tr
                        key={category.id}
                        className="border-b border-gray-100"
                      >
                        <td className="py-4">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 mx-auto">
                            <Image
                              src={formatImageUrl(category.image)}
                              alt={category.name}
                              width={40}
                              height={40}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </td>
                        <td className="py-4 text-[13px] text-gray-900">
                          {translateCategory(category.name)}
                        </td>
                        <td className="py-4 text-[13px] text-gray-900">
                          {category.productCount || 0}
                        </td>
                        <td className="py-4 text-[13px] text-gray-900">
                          {safeString(category.description) || "--"}
                        </td>
                        <td className="py-4 text-[13px] text-gray-900">
                          {category.private ? "Privée" : "Publique"}
                        </td>
                        {/* Cellule Actions - conditionnelle */}
                        {showActionsColumn && (
                          <td className="py-4 relative text-center">
                            <button
                              onClick={() =>
                                setOpenMenuId(
                                  openMenuId === category.id
                                    ? null
                                    : category.id
                                )
                              }
                              className="p-1 cursor-pointer hover:bg-gray-50 rounded"
                              aria-label="Options de catégorie"
                              title="Options de catégorie"
                            >
                              <Menu
                                size={20}
                                className="text-slate-500 hover:text-slate-600"
                              />
                            </button>

                            {/* Dropdown menu */}
                            {openMenuId === category.id && (
                              <div className="absolute right-0 mt-1 w-48 bg-white rounded-[10px] shadow-lg py-1 z-10">
                                {canUpdateCategory && onEdit && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onEdit(category);
                                      setOpenMenuId(null);
                                    }}
                                    className="w-full px-4 py-2 text-left text-[13px] text-gray-900 hover:bg-gray-50"
                                  >
                                    Modifier cette catégorie
                                  </button>
                                )}
                                {canDeleteCategory && onDelete && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onDelete(category);
                                      setOpenMenuId(null);
                                    }}
                                    className="w-full px-4 py-2 text-left text-[13px] text-red-600 hover:bg-gray-50"
                                  >
                                    Supprimer
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Pagination avec statistiques */}
      <div className="flex flex-col items-center py-4 px-2 border-t border-gray-200 space-y-2">
        {/* Statistiques */}
        <div className="text-sm text-gray-600"></div>

        <Pagination
          currentPage={currentPage}
          totalPages={Math.max(1, totalPages)}
          onPageChange={handlePageChange}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}

"use client"

import Image from "next/image"
import { MenuItem as MenuItemType } from "@/types"
import MenuItemCard from "@/components/ui/MenuItem"
import { Loader2 } from "lucide-react" 
import { Pagination } from "@/components/ui/pagination"
import { useMenusQuery } from "@/hooks/useMenusQuery"

interface BestSellersProps {
  menus: MenuItemType[]
  onEditMenu: (menu: MenuItemType) => void
  onViewMenu?: (menu: MenuItemType) => void
}

export default function BestSellers({ onEditMenu, onViewMenu }: BestSellersProps) {
  // ✅ Utiliser TanStack Query pour les menus
  const {
    menus,
    totalPages,
    currentPage,
    isLoading: loading,
    error,
    setCurrentPage,
  } = useMenusQuery({});

  // ✅ Plus besoin de useEffect et logique de chargement - TanStack Query gère tout
  const currentMenus = menus;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div className="flex items-center">
          <Image src="/icons/chicken.png" alt="menu" width={12} height={12} className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5" />
          <h2 className="text-xs sm:text-sm font-medium text-[#F17922] pl-1.5 sm:pl-2">Les plus vendus</h2>
        </div>

       
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 text-[#F17922] animate-spin" />
        </div>
      ) : error ? (
        <div className="flex justify-center items-center h-40">
          <p className="text-red-500">Erreur de chargement des menus</p>
        </div>
      ) : menus.length === 0 ? (
        <div className="flex justify-center items-center h-40">
          <p className="text-gray-500">Aucun plat disponible</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3 md:gap-4 lg:gap-6">
            {currentMenus.map((menu) => (
              <MenuItemCard
                key={menu.id}
                menu={menu as unknown as MenuItemType}
                onEdit={() => onEditMenu(menu as unknown as MenuItemType)}
                onView={() => onViewMenu?.(menu as unknown as MenuItemType)}
              />
            ))}
          </div>

          {/* ✅ Pagination - Toujours affichée, même avec 1 seule page */}
          <div className="flex flex-col items-center py-4 px-2 border-t border-gray-200 space-y-2">
           
            <div className="text-sm text-gray-600 flex items-center gap-2">
             

              {loading && (
                <div className="flex items-center gap-1 text-orange-500">
                  <div className="w-3 h-3 border border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs">Chargement...</span>
                </div>
              )}
            </div>

            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={Math.max(1, totalPages)}
              onPageChange={setCurrentPage}
              isLoading={loading}
            />
          </div>
        </>
      )}
      <div className="w-full h-px bg-gray-100 mt-8" />
    </div>
  )
}

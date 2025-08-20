"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import Image from "next/image"
import { MenuItem as MenuItemType, Category } from "@/types"
import MenuItemCard from "@/components/ui/MenuItem"
import Filter from "@/components/ui/Filter"
import { getAllCategories, getMenusByCategoryId } from "@/services/categoryService"

interface MenuCategoriesProps {
  categories: Category[]
  menuItems: MenuItemType[]
  onEditMenu: (menu: MenuItemType) => void
  onViewMenu?: (menu: MenuItemType) => void
}

export default function MenuCategories({ categories: propCategories, onEditMenu, onViewMenu }: Omit<MenuCategoriesProps, 'menuItems'>) {
  // États pour les catégories
  const [categories, setCategories] = useState<Category[]>(propCategories || [])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]) 
  const [activeCategory, setActiveCategory] = useState<string>('')
  const [activeCategoryId, setActiveCategoryId] = useState<string>('')
  
  // États pour les plats
  const [categoryMenus, setCategoryMenus] = useState<MenuItemType[]>([])
  const [allMenus, setAllMenus] = useState<MenuItemType[]>([])
  const [activePage, setActivePage] = useState(1)
  
  // États de chargement
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [loadingMenus, setLoadingMenus] = useState(false)
  const [error, setError] = useState<string | null>(null)

  
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true); 
        
        const apiCategories = await getAllCategories();
        
        if (apiCategories && apiCategories.length > 0) {
          setCategories(apiCategories);
          setActiveCategory(apiCategories[0].name); 
          setActiveCategoryId(apiCategories[0].id);
        } else {
          setError('Aucune catégorie trouvée');
        }
      } catch {
        setError('Erreur lors du chargement des catégories');
      } finally {
        setLoadingCategories(false);
      }
    };
    
    fetchCategories();
  }, []);
  
  // Charger les plats de la catégorie active
  useEffect(() => {
    const fetchMenusByCategory = async () => {
      if (!activeCategoryId) return;
      
      try {
        setLoadingMenus(true); 
        
        const menus = await getMenusByCategoryId(activeCategoryId);
        
        setCategoryMenus(menus);
        setError(null);
      } catch {
        setError('Erreur lors du chargement des plats');
      } finally {
        setLoadingMenus(false);
      }
    };
    
    fetchMenusByCategory();
  }, [activeCategoryId]);

  // Charger tous les menus des catégories sélectionnées
  useEffect(() => {
    const fetchMenusForSelectedCategories = async () => {
      if (selectedCategories.length <= 1) return; // Si 0 ou 1 catégorie, on utilise l'effet ci-dessus
      
      try {
        setLoadingMenus(true);
        
        // Trouver les IDs des catégories sélectionnées
        const selectedCategoryIds = categories
          .filter(cat => selectedCategories.includes(cat.name))
          .map(cat => cat.id);
        
        // Charger les menus pour chaque catégorie et les combiner
        const allMenuPromises = selectedCategoryIds.map(id => getMenusByCategoryId(id));
        const menuArrays = await Promise.all(allMenuPromises);
        
        // Fusionner tous les tableaux de menus en un seul
        const combinedMenus = menuArrays.flat();
        
        setAllMenus(combinedMenus);
        setError(null);
      } catch {
        setError('Erreur lors du chargement des plats');
      } finally {
        setLoadingMenus(false);
      }
    };
    
    fetchMenusForSelectedCategories();
  }, [selectedCategories, categories]);

  // Filtrer les plats si des catégories sont sélectionnées dans le filtre
  const filteredMenus = selectedCategories.length > 1
    ? allMenus
    : categoryMenus;

  // Pagination
  const totalPages = Math.ceil(filteredMenus.length / 5)
  const paginatedMenus = filteredMenus.slice((activePage - 1) * 5, activePage * 5)

  // Afficher un indicateur de chargement si les catégories sont en cours de chargement
  if (loadingCategories) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex justify-center items-center h-40">
          <p className="text-gray-500">Chargement des catégories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Section Catégories */}
      <section>
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center">
            <Image src="/icons/chicken.png" alt="menu" width={12} height={12} className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5" />
            <h2 className="text-xs sm:text-sm font-medium text-[#F17922] pl-1.5 sm:pl-2">Catégories</h2>
          </div>
          <div className="w-48">
            <Filter
              options={categories}
              selectedOptions={selectedCategories}
              onChange={(selected) => {
                setSelectedCategories(selected)
              
                if (selected.length === 1) {
                  // Si une seule catégorie est sélectionnée, l'activer
                  const selectedCategory = categories.find(cat => cat.name === selected[0]);
                  if (selectedCategory) {
                    setActiveCategory(selectedCategory.name);
                    setActiveCategoryId(selectedCategory.id);
                  }
                } else if (selected.length === 0 && categories.length > 0) {
                  // Si aucune catégorie n'est sélectionnée, revenir à la première catégorie
                  setActiveCategory(categories[0].name);
                  setActiveCategoryId(categories[0].id);
                } else if (selected.length > 1) {
                  // Si plusieurs catégories sont sélectionnées, désactiver la catégorie active
                  setActiveCategory('');
                }
                
                setActivePage(1);
              }}
            />
          </div>
        </div>

        {/* Navigation des catégories */}
        <div className="w-full overflow-x-auto mb-6 bg-[#F4F4F4] p-2 pb-0">
          <div className="flex justify-self gap-6 min-w-max md:min-w-0 md:flex-wrap gap-y-2">
            {categories.map((category) => (
              <button
                key={category.id}
                className={`whitespace-nowrap text-xs uppercase sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 rounded-t-xl transition-colors flex-shrink-0 md:flex-shrink ${
                  activeCategory === category.name
                    ? "bg-[#F17922] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                onClick={() => {
                  setActiveCategory(category.name)
                  setActiveCategoryId(category.id)
                  // Mettre à jour selectedCategories pour qu'il contienne uniquement la catégorie sélectionnée
                  setSelectedCategories([category.name])
                  setActivePage(1)
                }}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Liste des produits */}
        {loadingMenus ? (
          <div className="flex justify-center items-center h-40">
            <p className="text-gray-500">Chargement des plats...</p>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-40">
            <p className="text-red-500">{error}</p>
          </div>
        ) : filteredMenus.length === 0 ? (
          <div className="flex justify-center items-center h-40">
            <p className="text-gray-500">Aucun plat disponible dans cette catégorie</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3 md:gap-4 lg:gap-6">
            {paginatedMenus.map((menu) => (
              <MenuItemCard 
                key={menu.id} 
                menu={menu} 
                onEdit={onEditMenu}
                onView={onViewMenu}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center mt-6 space-x-1 sm:space-x-2">
            <button
              onClick={() => setActivePage(Math.max(1, activePage - 1))}
              disabled={activePage === 1}
              className="p-1 rounded-full bg-gray-100 disabled:opacity-50"
            >
              <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>

            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index}
                onClick={() => setActivePage(index + 1)}
                className={`w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full text-xs ${
                  activePage === index + 1 ? "bg-[#FF5722] text-white" : "bg-gray-100 text-gray-700"
                }`}
              >
                {index + 1}
              </button>
            ))}

            <button
              onClick={() => setActivePage(Math.min(totalPages, activePage + 1))}
              disabled={activePage === totalPages}
              className="p-1 rounded-full bg-gray-100 disabled:opacity-50"
            >
              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          </div>
        )}
      </section>
    </div>
  )
}

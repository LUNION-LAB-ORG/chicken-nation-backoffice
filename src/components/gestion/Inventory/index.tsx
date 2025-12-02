"use client"

import React, { useState } from 'react';
import AddSupplement from './AddSupplement';
import EditSupplement from './EditSupplement';
import AddCategory from './AddCategory';
import Modal from '@/components/ui/Modal';
import { ChevronDown } from 'lucide-react';
import DashboardPageHeader from '@/components/ui/DashboardPageHeader';
import CategoriesTable from './CategoriesTable';
import SupplementView from './SupplementView';
import SupplementTabs, { TabItem } from './SupplementTabs';
import { toast } from 'react-hot-toast';
import { Dish } from '@/types/dish';
import DeleteSupplementModal from './DeleteSupplementModal';
import DeleteCategoryModal from './DeleteCategoryModal';
import EditCategory from './EditCategory';
import { deleteSupplement } from '@/services/dishService';
import { deleteCategory as deleteCategoryApi, Category as ApiCategory } from '@/services/categoryService';
import { useDishesQuery } from '@/hooks/useDishesQuery';
import { useRBAC } from '@/hooks/useRBAC';

type ViewType = 'products' | 'categories';
type ProductCategory = 'all' | 'FOOD' | 'DRINK' | 'ACCESSORY';

interface ProductViewProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  image: string;
  available: boolean;
}

export default function Inventory() {
  const [currentView, setCurrentView] = useState<ViewType>('products');
  const [selectedTab, setSelectedTab] = useState<ProductCategory>('all');
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showEditSupplementModal, setShowEditSupplementModal] = useState(false);
  const [showDeleteSupplementModal, setShowDeleteSupplementModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Dish | null>(null);
  const [productToDelete, setProductToDelete] = useState<ProductViewProduct | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<ApiCategory | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<ApiCategory | null>(null);
  const [isEditCategoryModalOpen, setIsEditCategoryModalOpen] = useState(false);
  const [isDeleteCategoryModalOpen, setIsDeleteCategoryModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // État pour la recherche
  const [searchQuery, setSearchQuery] = useState('');

  // ✅ Utiliser TanStack Query pour les plats/produits
  const {
    dishes: products,
    totalItems,
    totalPages,
    currentPage,
    isLoading: dishesLoading,
    setCurrentPage,
    refetch: refetchDishes
  } = useDishesQuery({
    searchQuery,
    selectedCategory: selectedTab !== 'all' ? selectedTab : undefined
  });

  // Fonction pour gérer la recherche
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Fonction pour traduire les catégories en français
  const translateCategory = (category: string): string => {
    switch (category) {
      case 'FOOD':
        return 'Sauces';
      case 'DRINK':
        return 'Boissons';
      case 'ACCESSORY':
        return 'Suppléments';
      case 'all':
        return 'Tous les produits';
      default:
        return category;
    }
  };

  // ✅ Pas de filtrage côté client - tout est géré côté serveur par TanStack Query
  // Mapper les Dish vers ProductViewProduct avec la propriété stock
  const filteredProducts: ProductViewProduct[] = products.map(dish => ({
    id: dish.id,
    name: dish.name,
    category: dish.category,
    price: Number(dish.price) || 0,
    stock: typeof dish.stock === 'number' ? dish.stock : (dish.available ? 1 : 0), // Garantir un number
    image: dish.image || '/images/default-menu.png',
    available: dish.available
  }));

  const tabs: TabItem[] = [
    { id: 'all', label: translateCategory('all') },
    { id: 'FOOD', label: translateCategory('FOOD') },
    { id: 'DRINK', label: translateCategory('DRINK') },
    { id: 'ACCESSORY', label: translateCategory('ACCESSORY') },
  ];

  // ✅ Plus besoin de useEffect - TanStack Query gère tout

  // ✅ Plus besoin de fetchCategories - TanStack Query gère tout dans CategoriesTable

  const handleCreateProduct = () => {
    // ✅ RBAC: Seuls les utilisateurs avec permission peuvent créer des produits
    if (!canCreateSupplement()) {
      toast.error('Vous n\'avez pas les permissions pour créer des produits');
      return;
    }
    setShowAddProductModal(true);
  };

  const handleCreateCategory = () => {
    // ✅ RBAC: Seuls les utilisateurs avec permission peuvent créer des catégories
    if (!canCreateCategory()) {
      toast.error('Vous n\'avez pas les permissions pour créer des catégories');
      return;
    }
    setShowAddCategoryModal(true);
  };

  const handleEditCategory = (category: ApiCategory) => {
    // ✅ RBAC: Seuls les utilisateurs avec permission peuvent modifier des catégories
    if (!canUpdateCategory()) {
      toast.error('Vous n\'avez pas les permissions pour modifier des catégories');
      return;
    }
    setCategoryToEdit(category);
    setIsEditCategoryModalOpen(true);
  };

  const handleDeleteCategory = (category: ApiCategory) => {
    // ✅ RBAC: Seuls les utilisateurs avec permission peuvent supprimer des catégories
    if (!canDeleteCategory()) {
      toast.error('Vous n\'avez pas les permissions pour supprimer des catégories');
      return;
    }
    setCategoryToDelete(category);
    setIsDeleteCategoryModalOpen(true);
  };

  const confirmDeleteCategory = async (category: ApiCategory) => {
    setIsLoading(true);
    try {
      await deleteCategoryApi(category.id);

      // ✅ Les catégories se rafraîchissent automatiquement avec TanStack Query

      toast.success('Catégorie supprimée avec succès');
    } catch (error) {
      console.error('Erreur lors de la suppression de la catégorie:', error);
      if (error instanceof Error) {
        if (error.message.includes('Authentication required')) {
          toast.error('Authentification requise. Veuillez vous reconnecter.');
        } else {
          toast.error(`Erreur: ${error.message}`);
        }
      } else {
        toast.error('Une erreur est survenue lors de la suppression de la catégorie');
      }
    } finally {
      setIsLoading(false);
      setIsDeleteCategoryModalOpen(false);
      setCategoryToDelete(null);
    }
  };

  const handleSaveEditedCategory = async () => {
    try {
      toast.success('Catégorie mise à jour avec succès');
    } catch (error) {
      console.error('Erreur lors du rafraîchissement des catégories:', error);
    } finally {
      setIsEditCategoryModalOpen(false);
      setCategoryToEdit(null);
    }
  };

  const handleEditProduct = (product: ProductViewProduct) => {
    // ✅ RBAC: Seuls les utilisateurs avec permission peuvent modifier des produits
    if (!canUpdateSupplement()) {
      toast.error('Vous n\'avez pas les permissions pour modifier des produits');
      return;
    }

    // Convert ProductViewProduct to Dish format for the edit modal
    const dishForEdit: Dish = {
      id: product.id,
      name: product.name,
      price: product.price,
      available: product.available,
      image: product.image,
      category: product.category,
      category_id: '', // Will be set properly in the edit component
      created_at: '', // Will be set properly in the edit component
      updated_at: '' // Will be set properly in the edit component
    };
    setSelectedProduct(dishForEdit);
    setShowEditSupplementModal(true);
  };

  // Fonction pour mettre à jour la disponibilité d'un produit
  const handleUpdateAvailability = async (productId: string, available: boolean) => {
    // ✅ RBAC: Seuls les utilisateurs avec permission peuvent modifier la disponibilité
    if (!canUpdateSupplement()) {
      toast.error('Vous n\'avez pas les permissions pour modifier la disponibilité des produits');
      return;
    }

    try {
      setIsLoading(true);
      const { updateSupplementAvailability } = await import('@/services/dishService');
      await updateSupplementAvailability(productId, available);

      // ✅ Rafraîchir avec TanStack Query
      refetchDishes();

      toast.success(`Disponibilité mise à jour avec succès !`);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la disponibilité:', error);
      toast.error('Erreur lors de la mise à jour de la disponibilité');
    } finally {
      setIsLoading(false);
    }
  };

  // Supprimer un produit
  const handleDeleteProduct = async (productId: string) => {
    // ✅ RBAC: Seuls les utilisateurs avec permission peuvent supprimer des produits
    if (!canDeleteSupplement()) {
      toast.error('Vous n\'avez pas les permissions pour supprimer des produits');
      return;
    }

    try {
      await deleteSupplement(productId);
      toast.success('produit supprimé avec succès');

      // ✅ Rafraîchir avec TanStack Query
      refetchDishes();

      setShowDeleteSupplementModal(false);
      setProductToDelete(null);
    } catch (error) {
      console.error('Erreur lors de la suppression du produit:', error);
      toast.error('Impossible de supprimer le produit');
    }
  };

  // Afficher le modal de confirmation de suppression
  const confirmDeleteProduct = (product: ProductViewProduct) => {
    setProductToDelete(product);
    setShowDeleteSupplementModal(true);
  };

  // Fonction pour gérer la mise à jour d'un produit
  const handleUpdateSupplement = async () => {
    try {
      setIsLoading(true);

      // ✅ Rafraîchir avec TanStack Query
      refetchDishes();

      toast.success(`produit mis à jour avec succès !`);
      setShowEditSupplementModal(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du produit:', error);
      toast.error('Erreur lors de la mise à jour du produit');
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Plus besoin de fonctions refresh - TanStack Query gère tout

  // ✅ RBAC Hook
  const {
    canCreateCategory,
    canUpdateCategory,
    canDeleteCategory,
    canCreateSupplement,
    canUpdateSupplement,
    canDeleteSupplement
  } = useRBAC();

  return (
    <div className="flex-1 overflow-auto p-4">
      <DashboardPageHeader
        mode="list"
        title="Inventaires"
        searchConfig={{
          placeholder: "Rechercher un menu",
          buttonText: "Chercher",
          onSearch: handleSearch,
          realTimeSearch: true  // ✅ Activer la recherche en temps réel
        }}
        actions={[
          // ✅ RBAC: Bouton de création de catégorie seulement si permission
          ...(canCreateCategory() ? [{
            label: "Créer une catégorie",
            onClick: handleCreateCategory,
            variant: "secondary" as const,
            className: "bg-white border border-[#F17922] text-[#F17922] hover:bg-white hover:opacity-80"
          }] : []),
          // ✅ RBAC: Bouton d'ajout de produit seulement si permission
          ...(canCreateSupplement() ? [{
            label: "Ajouter un produit",
            onClick: handleCreateProduct,
            variant: "primary" as const
          }] : [])
        ]}
      />

      <div className="bg-white rounded-[20px] p-4 mt-4 shadow-sm">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">

          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-2 bg-[#F4F4F5] rounded-[10px] px-4 py-2 cursor-pointer"
            >
              <span className="text-[10px] lg:text-[14px] text-[#9796A1]">
                {currentView === 'products' ? 'Produits' : 'Catégories'}
              </span>
              <ChevronDown className="h-4 w-4 text-gray-500 " />
            </button>


            {isDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-full bg-white rounded-[10px] shadow-lg py-1 z-10">
                <button
                  onClick={() => {
                    setCurrentView('products');
                    setIsDropdownOpen(false);
                  }}
                  className="w-full px-4 py-2 hover:text-primary-500 cursor-pointer text-left text-[10px] lg:text-[14px] text-gray-900 hover:bg-gray-50"
                >
                  Produits
                </button>
                <button
                  onClick={() => {
                    setCurrentView('categories');
                    setIsDropdownOpen(false);
                  }}
                  className="w-full px-4 py-2 hover:text-primary-500 cursor-pointer text-left text-[10px] lg:text-[14px] text-gray-900 hover:bg-gray-50"
                >
                  Catégories
                </button>
              </div>
            )}
          </div>


          {currentView === 'categories' ? (
            <div />
          ) : (
            <SupplementTabs
              tabs={tabs}
              selectedTab={selectedTab}
              onTabChange={(tabId) => setSelectedTab(tabId as ProductCategory)}
            />
          )}


          <div className="w-[120px]"></div>
        </div>


        {currentView === 'categories' ? (
          <CategoriesTable
            onEdit={canUpdateCategory() ? handleEditCategory : undefined}
            onDelete={canDeleteCategory() ? handleDeleteCategory : undefined}
            onCreateCategory={canCreateCategory() ? handleCreateCategory : undefined}
            searchQuery={searchQuery}
          />
        ) : (
          <SupplementView
            products={filteredProducts}
            selectedTab={selectedTab}
            onEdit={canUpdateSupplement() ? handleEditProduct : undefined}
            onCreateProduct={canCreateSupplement() ? handleCreateProduct : undefined}
            onDelete={canDeleteSupplement() ? confirmDeleteProduct : undefined}
            onUpdateAvailability={canUpdateSupplement() ? handleUpdateAvailability : undefined}
            searchQuery={searchQuery}
            totalItems={totalItems}
            totalPages={totalPages}
            currentPage={currentPage}
            isLoading={dishesLoading}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      <Modal
        isOpen={showAddProductModal}
        onClose={() => setShowAddProductModal(false)}
        title="Ajouter un produit"
      >
        <AddSupplement
          onCancel={() => setShowAddProductModal(false)}
          onSuccess={() => {
            refetchDishes();
            setShowAddProductModal(false);
          }}
        />
      </Modal>

      <Modal
        isOpen={showAddCategoryModal}
        onClose={() => setShowAddCategoryModal(false)}
        title="Ajouter une catégorie"
      >
        <AddCategory
          onCancel={() => setShowAddCategoryModal(false)}
          onSuccess={() => {
            setShowAddCategoryModal(false);
          }}
        />
      </Modal>

      <Modal
        isOpen={showEditSupplementModal}
        onClose={() => setShowEditSupplementModal(false)}
        title="Modifier un produit"
      >
        <EditSupplement
          onCancel={() => setShowEditSupplementModal(false)}
          onSuccess={handleUpdateSupplement}
          product={selectedProduct}
        />
      </Modal>

      <Modal
        isOpen={showDeleteSupplementModal}
        onClose={() => setShowDeleteSupplementModal(false)}
        title="Supprimer un produit"
      >
        <DeleteSupplementModal
          onCancel={() => setShowDeleteSupplementModal(false)}
          onDelete={handleDeleteProduct}
          product={productToDelete!}
        />
      </Modal>

      <Modal
        isOpen={isDeleteCategoryModalOpen}
        onClose={() => setIsDeleteCategoryModalOpen(false)}
        title="Supprimer une catégorie"
      >
        {categoryToDelete && (
          <DeleteCategoryModal
            category={categoryToDelete as ApiCategory}
            onClose={() => setIsDeleteCategoryModalOpen(false)}
            onConfirm={confirmDeleteCategory}
            isLoading={isLoading}
          />
        )}
      </Modal>

      <Modal
        isOpen={isEditCategoryModalOpen}
        onClose={() => setIsEditCategoryModalOpen(false)}
        title="Modifier une catégorie"
      >
        {categoryToEdit && (
          <EditCategory
            onClose={() => setIsEditCategoryModalOpen(false)}
            onSave={handleSaveEditedCategory}
            category={categoryToEdit as ApiCategory}
          />
        )}
      </Modal>
    </div>
  );
}
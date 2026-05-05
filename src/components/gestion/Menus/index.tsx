"use client";

import React, { useState } from "react";
import Image from "next/image";
import MenuHeader from "./MenuHeader";
import BestSellers from "./BestSellers";
import MenuCategories from "./MenuCategories";
import AddMenuForm from "./AddMenuForm";
import EditMenuForm from "./EditMenuForm";
import DetailsMenu from "./DetailsMenu";
import MenuItemCard from "@/components/ui/MenuItem";
import { MenuItem } from "@/types";
import {
  getMenuById,
  updateMenu,
  menuToFormData,
  deleteMenu,
  formatMenuFromApi,
} from "@/services/menuService";
import { useMenusSearchQuery } from "@/hooks/useMenusSearchQuery";

import {
  addRestaurantToDish,
  deleteDishRestaurantRelation,
} from "@/services/dishRestaurantService";
import {
  addSupplementToDish,
  updateSupplementQuantity,
  removeSupplementFromDish,
} from "@/services/dishSupplementService";
import { toast } from "react-hot-toast";
import {
  validateMenuItem,
  sanitizeMenuInput,
  ValidatedMenuItem,
} from "@/schemas/menuSchemas";
import MenuRightSide from "./MenuRightSide";

interface MenuState {
  view: "list" | "create" | "edit" | "view";
  selectedMenu?: ValidatedMenuItem;
  loadingMenu: boolean;
  saving: boolean;
}

const Menus = () => {
  const [menuState, setMenuState] = useState<MenuState>({
    view: "list",
    loadingMenu: false,
    saving: false,
  });

  // État pour la recherche côté serveur
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // ✅ Hook pour la recherche côté serveur
  const {
    menus: searchResults,
    isLoading: searchLoading,
    refetch,
  } = useMenusSearchQuery({
    searchQuery: isSearching ? searchQuery : undefined, // ✅ Seulement rechercher si en mode recherche
  });

  // ✅ FONCTION DE RECHERCHE SÉCURISÉE
  const handleSearch = (query: string) => {
    // ✅ Sanitisation de la requête de recherche
    const sanitizedQuery = sanitizeMenuInput(query || "");
    setSearchQuery(sanitizedQuery);
    setIsSearching(sanitizedQuery.length > 0);
  };

  // ✅ Les résultats de recherche viennent directement du serveur
  const filteredMenus = searchResults;

  const handleViewChange = (
    view: "list" | "create" | "edit" | "view",
    menu?: MenuItem
  ) => {
    setMenuState({
      view,
      selectedMenu: menu,
      loadingMenu: false,
      saving: false,
    });
  };

  // ✅ FONCTION D'ÉDITION SÉCURISÉE
  const handleEditMenu = (menu: MenuItem) => {
    try {
      // ✅ Validation du menu d'entrée
      const validatedMenu = validateMenuItem(menu);

      setMenuState({ ...menuState, loadingMenu: true });

      getMenuById(validatedMenu.id)
        .then((menuData) => {
          try {
            // ✅ Gestion sécurisée de la catégorie
            const menuDataWithCategory = menuData as unknown as MenuItem & {
              category_id?: string;
              category?: string | { id: string };
            };

            if (
              !menuDataWithCategory.category_id &&
              menuDataWithCategory.category
            ) {
              if (
                typeof menuDataWithCategory.category === "object" &&
                menuDataWithCategory.category &&
                "id" in menuDataWithCategory.category
              ) {
                const categoryObj = menuDataWithCategory.category as {
                  id: string;
                };
                if (categoryObj.id && typeof categoryObj.id === "string") {
                  menuDataWithCategory.category_id = sanitizeMenuInput(
                    categoryObj.id
                  );
                }
              } else if (typeof menuDataWithCategory.category === "string") {
                menuDataWithCategory.category_id = sanitizeMenuInput(
                  menuDataWithCategory.category
                );
              }
            }

            // ✅ Gestion sécurisée des restaurants
            if (
              menuData.dish_restaurants &&
              Array.isArray(menuData.dish_restaurants) &&
              menuData.dish_restaurants.length > 0
            ) {
              const restaurantIds: string[] = [];

              for (const r of menuData.dish_restaurants) {
                try {
                  let id: string | null = null;

                  // ✅ Extraction sécurisée de l'ID restaurant
                  if (typeof r === "object" && r !== null) {
                    const restaurantObj = r as {
                      restaurant_id?: string;
                      restaurant?: { id: string };
                      [key: string]: unknown;
                    };
                    id =
                      restaurantObj.restaurant_id ||
                      (restaurantObj.restaurant &&
                        typeof restaurantObj.restaurant === "object" &&
                        restaurantObj.restaurant.id) ||
                      null;
                  } else if (typeof r === "string") {
                    id = r;
                  }

                  // ✅ Validation et sanitisation de l'ID
                  if (id && typeof id === "string") {
                    const sanitizedId = sanitizeMenuInput(id);
                    if (
                      sanitizedId.length > 0 &&
                      /^[a-zA-Z0-9\-_]+$/.test(sanitizedId)
                    ) {
                      restaurantIds.push(sanitizedId);
                    }
                  }
                } catch (error) {
                  console.warn("Restaurant ignoré lors du traitement:", error);
                }
              }

              // ✅ Assignation sécurisée des IDs restaurant
              if (restaurantIds.length > 0) {
                // Correction: restaurant_id doit être string selon notre interface
                (
                  menuData as unknown as MenuItem & { restaurant_id?: string }
                ).restaurant_id = restaurantIds[0]; // Prendre le premier restaurant
                if (restaurantIds.length > 1) {
                  console.warn(
                    "Plusieurs restaurants trouvés, seul le premier sera utilisé"
                  );
                }
              }
            }

            // ✅ Gestion sécurisée des suppléments
            if (
              menuData.dish_supplements &&
              Array.isArray(menuData.dish_supplements) &&
              menuData.dish_supplements.length > 0
            ) {
              interface ProcessedSupplement {
                supplement?: {
                  id: string;
                  name?: string;
                  type?: string;
                  [key: string]: unknown;
                };
                supplement_id?: string;
                quantity?: number;
                [key: string]: unknown;
              }
              const processedSupplements: ProcessedSupplement[] = [];

              for (const supp of menuData.dish_supplements) {
                try {
                  if (!supp || typeof supp !== "object") continue;

                  const supplementObj = supp as {
                    supplement?: {
                      id: string;
                      name?: string;
                      type?: string;
                      [key: string]: unknown;
                    };
                    supplement_id?: string;
                    quantity?: number;
                    [key: string]: unknown;
                  };

                  // ✅ Traitement sécurisé du supplément
                  if (
                    supplementObj.supplement &&
                    typeof supplementObj.supplement === "object"
                  ) {
                    // ✅ Détermination sécurisée du type
                    if (!supplementObj.supplement.type) {
                      if (
                        supplementObj.supplement.name &&
                        typeof supplementObj.supplement.name === "string"
                      ) {
                        const sanitizedName = sanitizeMenuInput(
                          supplementObj.supplement.name
                        ).toLowerCase();
                        if (
                          sanitizedName.includes("boisson") ||
                          sanitizedName.includes("drink") ||
                          sanitizedName.includes("soda")
                        ) {
                          supplementObj.supplement.type = "DRINK";
                        } else if (
                          sanitizedName.includes("frite") ||
                          sanitizedName.includes("riz") ||
                          sanitizedName.includes("accompagnement")
                        ) {
                          supplementObj.supplement.type = "FOOD";
                        } else {
                          supplementObj.supplement.type = "ACCESSORY";
                        }
                      } else {
                        supplementObj.supplement.type = "ACCESSORY";
                      }
                    }

                    // ✅ Validation et sanitisation de l'ID
                    if (
                      !supplementObj.supplement_id &&
                      supplementObj.supplement.id &&
                      typeof supplementObj.supplement.id === "string"
                    ) {
                      const sanitizedId = sanitizeMenuInput(
                        supplementObj.supplement.id
                      );
                      if (
                        sanitizedId.length > 0 &&
                        /^[a-zA-Z0-9\-_]+$/.test(sanitizedId)
                      ) {
                        supplementObj.supplement_id = sanitizedId;
                      }
                    }
                  } else if (
                    supplementObj.supplement_id &&
                    typeof supplementObj.supplement_id === "string" &&
                    !supplementObj.supplement
                  ) {
                    // ✅ Création sécurisée d'un objet supplément manquant
                    const sanitizedId = sanitizeMenuInput(
                      supplementObj.supplement_id
                    );
                    if (
                      sanitizedId.length > 0 &&
                      /^[a-zA-Z0-9\-_]+$/.test(sanitizedId)
                    ) {
                      supplementObj.supplement = {
                        id: sanitizedId,
                        name: `Supplément #${sanitizedId}`,
                        type: "ACCESSORY",
                      };
                    }
                  }

                  // ✅ Validation de la quantité
                  if (
                    !supplementObj.quantity ||
                    typeof supplementObj.quantity !== "number" ||
                    supplementObj.quantity < 1
                  ) {
                    supplementObj.quantity = 1;
                  }

                  processedSupplements.push(supplementObj);
                } catch (error) {
                  console.warn("Supplément ignoré lors du traitement:", error);
                }
              }

              menuData.dish_supplements = processedSupplements;
            } else {
              menuData.dish_supplements = [];
            }

            // ✅ Conversion sécurisée des données API en MenuItem
            const convertedMenu = formatMenuFromApi(menuData);

            setMenuState({
              view: "edit",
              selectedMenu: convertedMenu,
              loadingMenu: false,
              saving: false,
            });
          } catch (processingError) {
            console.error(
              "Erreur lors du traitement des données du menu:",
              processingError
            );
            toast.error("Erreur lors du traitement des données du menu");
            setMenuState({
              ...menuState,
              loadingMenu: false,
              saving: false,
            });
          }
        })
        .catch((apiError) => {
          console.error(
            "Erreur lors du chargement du menu depuis l'API:",
            apiError
          );
          toast.error("Erreur lors du chargement du menu");
          setMenuState({
            ...menuState,
            loadingMenu: false,
            saving: false,
          });
        });
    } catch (validationError) {
      console.error("Erreur de validation du menu:", validationError);
      toast.error("Données de menu invalides");
      setMenuState({
        ...menuState,
        loadingMenu: false,
        saving: false,
      });
    }
  };

  // ✅ FONCTION DE VISUALISATION SÉCURISÉE
  const handleViewMenu = (menu: MenuItem) => {
    try {
      // ✅ Validation basique de l'ID seulement
      if (
        !menu.id ||
        typeof menu.id !== "string" ||
        menu.id.trim().length === 0
      ) {
        throw new Error("ID de menu invalide");
      }

      setMenuState({ ...menuState, loadingMenu: true });

      getMenuById(menu.id)
        .then((menuData) => {
          try {
            // ✅ Conversion sécurisée des données API en MenuItem
            const convertedMenu = formatMenuFromApi(menuData);

            setMenuState({
              view: "view",
              selectedMenu: convertedMenu,
              loadingMenu: false,
              saving: false,
            });
          } catch (processingError) {
            console.error(
              "Erreur lors du traitement des données du menu:",
              processingError
            );
            toast.error("Erreur lors du traitement des données du menu");
            setMenuState({
              ...menuState,
              loadingMenu: false,
              saving: false,
            });
          }
        })
        .catch((apiError) => {
          console.error(
            "Erreur lors du chargement du menu depuis l'API:",
            apiError
          );
          toast.error("Erreur lors du chargement du menu");
          setMenuState({
            ...menuState,
            loadingMenu: false,
            saving: false,
          });
        });
    } catch (validationError) {
      console.error("Erreur de validation du menu:", validationError);
      toast.error("Données de menu invalides");
      setMenuState({
        ...menuState,
        loadingMenu: false,
        saving: false,
      });
    }
  };

  const handleSaveEdit = async (updatedMenu: MenuItem) => {
    if (!menuState.selectedMenu) return;

    setMenuState({ ...menuState, saving: true });

    try {
      // 1. Mettre à jour les informations de base du menu
      const formData = menuToFormData(updatedMenu, true); // ✅ Indiquer qu'il s'agit d'un UPDATE
      await updateMenu(menuState.selectedMenu.id, formData);

      // 2. Préparer les données pour la mise à jour des relations

      // Extraire les IDs et IDs de relation des restaurants actuels
      const currentRestaurants = menuState.selectedMenu.dish_restaurants
        ? menuState.selectedMenu.dish_restaurants.map((r) => ({
            id: r.restaurant_id || (r.restaurant && r.restaurant.id) || "",
            relationId: r.id,
          }))
        : [];

      // Extraire les IDs des nouveaux restaurants
      const menuWithRestaurants = updatedMenu as MenuItem & {
        selectedRestaurants?: string[];
      };
      const newRestaurantIds =
        menuWithRestaurants.selectedRestaurants &&
        Array.isArray(menuWithRestaurants.selectedRestaurants)
          ? menuWithRestaurants.selectedRestaurants
          : updatedMenu.restaurantId
          ? Array.isArray(updatedMenu.restaurantId)
            ? updatedMenu.restaurantId
            : [updatedMenu.restaurantId]
          : [];

      // Extraire les suppléments actuels avec leurs quantités et IDs de relation
      const currentSupplements = menuState.selectedMenu.dish_supplements
        ? menuState.selectedMenu.dish_supplements.map((s) => ({
            id: s.supplement_id || (s.supplement && s.supplement.id) || "",
            quantity: s.quantity || 1,
            relationId: s.id,
          }))
        : [];

      // Extraire les nouveaux suppléments avec leurs quantités
      const newSupplements: Array<{ id: string; quantity: number }> = [];

      // Ajouter les ingrédients (ACCESSORY)
      if (updatedMenu.supplements?.ACCESSORY) {
        updatedMenu.supplements.ACCESSORY.forEach((supp) => {
          newSupplements.push({
            id: supp.id,
            quantity: (supp as unknown as { quantity?: number }).quantity || 1,
          });
        });
      }

      // Ajouter les accompagnements (FOOD)
      if (updatedMenu.supplements?.FOOD) {
        updatedMenu.supplements.FOOD.forEach((supp) => {
          newSupplements.push({
            id: supp.id,
            quantity: (supp as unknown as { quantity?: number }).quantity || 1,
          });
        });
      }

      // Ajouter les boissons (DRINK)
      if (updatedMenu.supplements?.DRINK) {
        updatedMenu.supplements.DRINK.forEach((supp) => {
          newSupplements.push({
            id: supp.id,
            quantity: (supp as unknown as { quantity?: number }).quantity || 1,
          });
        });
      }

      const restaurantPromises = [];

      // Ajouter les nouveaux restaurants
      for (const newRestaurantId of newRestaurantIds) {
        // Vérifier si ce restaurant existe déjà
        const exists = currentRestaurants.some((r) => r.id === newRestaurantId);
        if (!exists) {
          restaurantPromises.push(
            addRestaurantToDish(menuState.selectedMenu.id, newRestaurantId)
          );
        }
      }

      for (const currentResto of currentRestaurants) {
        if (currentResto.id && currentResto.relationId) {
          const stillExists = newRestaurantIds.includes(currentResto.id);
          if (!stillExists) {
            restaurantPromises.push(
              deleteDishRestaurantRelation(currentResto.relationId)
            );
          }
        }
      }

      const supplementPromises = [];

      for (const newSupplement of newSupplements) {
        const existingSupp = currentSupplements.find(
          (s) => s.id === newSupplement.id
        );
        if (!existingSupp) {
          supplementPromises.push(
            addSupplementToDish(
              menuState.selectedMenu.id,
              newSupplement.id,
              newSupplement.quantity
            )
          );
        } else if (existingSupp.quantity !== newSupplement.quantity) {
          // Mettre à jour la quantité si elle a changé
          if (existingSupp.relationId) {
            supplementPromises.push(
              updateSupplementQuantity(
                existingSupp.relationId,
                newSupplement.quantity
              )
            );
          } else {
          }
        }
      }

      for (const currentSupp of currentSupplements) {
        if (currentSupp.id && currentSupp.relationId) {
          const stillExists = newSupplements.some(
            (s) => s.id === currentSupp.id
          );
          if (!stillExists) {
            supplementPromises.push(
              removeSupplementFromDish(currentSupp.relationId)
            );
          }
        }
      }

      await Promise.all([
        Promise.all(restaurantPromises),
        Promise.all(supplementPromises),
      ]);

      toast.success("Menu mis à jour avec succès !");
      refetch(); // Recharger les données
      setMenuState({
        view: "list",
        selectedMenu: undefined,
        loadingMenu: false,
        saving: false,
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour du menu:", error);
      toast.error("Erreur lors de la mise à jour du menu");
      setMenuState({ ...menuState, saving: false });
    }
  };

  // ✅ FONCTION DE SUPPRESSION SÉCURISÉE
  const handleDeleteMenu = async (menu: MenuItem) => {
    try {
      // ✅ Validation basique de l'ID et du nom
      if (
        !menu.id ||
        typeof menu.id !== "string" ||
        menu.id.trim().length === 0
      ) {
        toast.error("ID de menu invalide");
        return;
      }

      if (!menu.name || typeof menu.name !== "string") {
        toast.error("Nom de menu invalide");
        return;
      }

      // ✅ Sanitisation du nom pour l'affichage
      const sanitizedName = sanitizeMenuInput(menu.name);

      // ✅ Demander confirmation avec nom sécurisé
      const confirmed = window.confirm(
        `Êtes-vous sûr de vouloir désactiver le menu "${sanitizedName}" ? Il ne sera plus visible dans l'application mais restera archivé.`
      );

      if (!confirmed) return;

      setMenuState({ ...menuState, saving: true });

      // ✅ Soft-delete : entity_status passe à DELETED côté backend
      await deleteMenu(menu.id);

      toast.success("Menu désactivé avec succès !");

      // Recharger les données API
      refetch();

      // Retourner à la liste
      setMenuState({
        view: "list",
        selectedMenu: undefined,
        loadingMenu: false,
        saving: false,
      });
    } catch (error) {
      console.error("Erreur lors de la désactivation du menu:", error);
      toast.error("Erreur lors de la désactivation du menu");
      setMenuState({ ...menuState, saving: false });
    }
  };

  return (
    <div className="flex-1 overflow-auto p-4">
      <MenuHeader
        currentView={menuState.view}
        onBack={() => handleViewChange("list")}
        onCreateMenu={() => handleViewChange("create")}
        onSearch={handleSearch}
      />
      {menuState.view === "list" && (
        <div className="bg-white rounded-xl sm:rounded-2xl overflow-hidden">
          {searchLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="text-gray-500">Chargement des données...</div>
            </div>
          ) : isSearching ? (
            // Affichage des résultats de recherche basés sur les données API
            <div className="p-4 sm:p-6 lg:p-8">
              <div className="flex items-center mb-6">
                <Image
                  src="/icons/chicken.png"
                  alt="menu"
                  width={12}
                  height={12}
                  className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5"
                />
                <h2 className="text-xs sm:text-sm font-medium text-[#F17922] pl-1.5 sm:pl-2">
                  Résultats de recherche pour &ldquo;{searchQuery}&rdquo; (
                  {filteredMenus.length} résultat
                  {filteredMenus.length > 1 ? "s" : ""})
                </h2>
              </div>

              {filteredMenus.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40">
                  <p className="text-gray-500 mb-2">
                    Aucun plat trouvé pour &ldquo;{searchQuery}&rdquo;
                  </p>
                  <p className="text-gray-400 text-sm">
                    Essayez avec d&apos;autres mots-clés
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3 md:gap-4 lg:gap-6">
                  {filteredMenus.map((menu) => (
                    <MenuItemCard
                      key={menu.id}
                      menu={menu as unknown as MenuItem}
                      onView={() => handleViewMenu(menu as unknown as MenuItem)}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            // Affichage normal avec BestSellers et MenuCategories (qui chargent leurs propres données API)
            <>
              <BestSellers
                menus={[]}
                onEditMenu={handleEditMenu}
                onViewMenu={handleViewMenu}
              />
              <div className="border-t border-gray-100 mt-4"></div>
              <MenuCategories
                categories={[]}
                onEditMenu={handleEditMenu}
                onViewMenu={handleViewMenu}
              />
            </>
          )}
        </div>
      )}
      {menuState.view === "create" && (
        <div className="flex flex-col lg:flex-row gap-4 bg-white rounded-xl p-4 lg:p-6 border-2 border-[#D8D8D8]/30">
          <div className="w-full min-[1620px]:mr-56">
            <AddMenuForm
              onCancel={() => handleViewChange("list")}
              onSubmit={async (newMenu: MenuItem) => {
                try {
                  // ✅ DEBUG: Vérifier les données reçues dans index.tsx
                  console.log("🔍 DEBUG index.tsx - Menu reçu:", {
                    selectedRestaurants: (
                      newMenu as MenuItem & { selectedRestaurants?: string[] }
                    ).selectedRestaurants,
                    restaurantId: newMenu.restaurantId,
                    dish_supplements: newMenu.dish_supplements?.length || 0,
                    supplements: newMenu.supplements,
                  });

                  // ✅ Import sécurisé des services
                  const { createMenu, menuToFormData } = await import(
                    "@/services/menuService"
                  );

                  // ✅ Conversion sécurisée en FormData pour création
                  const formData = menuToFormData(newMenu, false);

                  // ✅ DEBUG: Vérifier le FormData
                  console.log("🔍 DEBUG index.tsx - FormData créé:", {
                    restaurant_ids: formData.getAll("restaurant_ids"),
                    supplement_ids: formData.getAll("supplement_ids"),
                    supplement_quantities: formData.getAll(
                      "supplement_quantities"
                    ),
                  });

                  // ✅ Création sécurisée du menu
                  await createMenu(formData);

                  toast.success("Menu créé avec succès");
                  refetch(); // Recharger les données
                  handleViewChange("list");
                } catch (error) {
                  console.error("Erreur lors de la création du menu:", error);
                  toast.error("Erreur lors de la création du menu");
                }
              }}
            />
          </div>
        </div>
      )}
      {menuState.view === "edit" && menuState.selectedMenu && (
        <div className="flex flex-col lg:flex-row gap-4 bg-white rounded-xl p-4 lg:p-6 border-2 border-[#D8D8D8]/30">
          <div className="w-full min-[1620px]:mr-56">
            {menuState.loadingMenu ? (
              <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#F17922]"></div>
              </div>
            ) : (
              <EditMenuForm
                initialData={menuState.selectedMenu as unknown as MenuItem}
                onCancel={() => handleViewChange("list")}
                onSubmit={handleSaveEdit}
              />
            )}
          </div>
        </div>
      )}
      {menuState.view === "view" && menuState.selectedMenu && (
        <div className="flex flex-col xl:flex-row gap-4">
          <div className="flex-1">
            {menuState.loadingMenu ? (
              <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#F17922]"></div>
              </div>
            ) : (
              <DetailsMenu
                menu={menuState.selectedMenu as unknown as MenuItem}
                onEdit={() =>
                  handleEditMenu(menuState.selectedMenu! as unknown as MenuItem)
                }
                onDelete={() =>
                  handleDeleteMenu(
                    menuState.selectedMenu! as unknown as MenuItem
                  )
                }
              />
            )}
          </div>
          <div className="xl:w-1/3">
            <MenuRightSide
              similarMenus={
                searchResults
                  .filter(
                    (item) =>
                      item.categoryId ===
                      (menuState.selectedMenu?.categoryId || "")
                  )
                  .slice(0, 3) as unknown as MenuItem[]
              }
              onEditMenu={handleEditMenu}
              onViewMenu={handleViewMenu}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Menus;

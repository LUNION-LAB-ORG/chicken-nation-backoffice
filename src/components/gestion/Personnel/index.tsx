"use client";

import {
  getAllRestaurants,
  getRestaurantUsers,
  Restaurant,
} from "@/services/restaurantService";
import { getHumanReadableError } from "@/utils/errorMessages";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { useAuthStore } from "../../../../features/users/hook/authStore";
import { getAllUsers } from "../../../../features/users/services/user.service";
import { User, UserRole } from "../../../../features/users/types/user.types";
import AddMember from "./AddMember";
import EditMember from "./EditMember";
import MemberView from "./MemberView";
import PersonnelHeader from "./PersonnelHeader";
import PersonnelTabs from "./PersonnelTabs";

interface MemberForView {
  id: string;
  fullname: string;
  email: string;
  role: string;
  image?: string;
  restaurant?: string | { id: string; name: string };
  phone?: string;
  address?: string;
  entity_status?: "NEW" | "ACTIVE" | "INACTIVE" | "DELETED";
}

export default function Personnel() {
  const { user: currentUser } = useAuthStore();
  const [openAdd, setOpenAdd] = useState(false);
  const [selectedTab, setSelectedTab] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabs, setTabs] = useState<string[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedMember, setSelectedMember] = useState<MemberForView | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [tabsInitialized, setTabsInitialized] = useState(false);

  const refreshUsers = () => {
    setRefreshTrigger(Date.now());
  };

  // Récupérer les restaurants pour générer les tabs dynamiquement
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const restaurantData = await getAllRestaurants();
        const activeRestaurants = restaurantData.filter(
          (restaurant) => restaurant.active
        );

        setRestaurants(activeRestaurants);

        // Générer les tabs selon le rôle de l'utilisateur connecté
        if (currentUser?.role === "MANAGER" && currentUser?.restaurant_id) {
          // Manager : seulement son restaurant
          const managerRestaurant = activeRestaurants.find(
            (r) => r.id === currentUser.restaurant_id
          );
          if (managerRestaurant) {
            setTabs([managerRestaurant.name]);
            setSelectedTab(managerRestaurant.name);
          } else {
            setTabs(["Mon Restaurant"]);
            setSelectedTab("Mon Restaurant");
          }
        } else if (currentUser?.role === "ADMIN") {
          // Admin : tous les restaurants + filtre Back Office
          setTabs([
            "Tous",
            "Back Office",
            ...activeRestaurants.map((r) => r.name),
          ]);
          setSelectedTab("Tous"); // Définir le tab par défaut pour Admin
        } else {
          // Autres rôles : accès limité
          setTabs(["Tous"]);
          setSelectedTab("Tous"); // Définir le tab par défaut pour autres rôles
        }

        // Marquer que les tabs sont initialisés
        setTabsInitialized(true);
      } catch (error) {
        console.error("Erreur lors de la récupération des restaurants:", error);
        const userMessage = getHumanReadableError(error);
        toast.error(userMessage);
        // En cas d'erreur, on garde les tabs par défaut
        setTabs(["Tous"]);
        setSelectedTab("Tous");
        setRestaurants([]);
        setTabsInitialized(true);
      }
    };

    if (currentUser) {
      fetchRestaurants();
    }
  }, [currentUser]);

  useEffect(() => {
    // Ne pas exécuter fetchUsers si les tabs ne sont pas encore initialisés
    if (!tabsInitialized || !currentUser || !selectedTab) {
      return;
    }

    const fetchUsers = async () => {
      setLoading(true);
      setError(null);

      try {
        let data: User[] = [];

        // Si c'est un manager, on utilise l'endpoint spécifique
        if (currentUser?.role === "MANAGER" && currentUser?.restaurant_id) {
          const allRestaurantUsers = await getRestaurantUsers(
            currentUser.restaurant_id
          );
          // Filtrer pour exclure le manager lui-même
          data = allRestaurantUsers.filter(
            (user) => user.id !== currentUser.id
          ) as User[];
        } else {
          // Pour les autres utilisateurs, on récupère selon l'onglet sélectionné
          if (selectedTab === "Tous") {
            // Récupérer tous les users
            data = await getAllUsers();
          } else if (selectedTab === "Back Office") {
            // Récupérer tous les users et filtrer par type BACKOFFICE (EXCLURE les MANAGER)
            const allUsers = await getAllUsers();
            data = allUsers.filter(
              (user) => user.type === "BACKOFFICE" && user.role !== "MANAGER"
            );
          } else {
            // Trouver l'ID du restaurant sélectionné
            let selectedRestaurant = restaurants.find(
              (r) => r.name === selectedTab
            );

            // Si pas trouvé, essayer avec trim() pour éliminer les espaces
            if (!selectedRestaurant) {
              const trimmedTab = selectedTab.trim();
              const foundRestaurant = restaurants.find(
                (r) => r.name.trim() === trimmedTab
              );
              if (foundRestaurant) {
                selectedRestaurant = foundRestaurant;
              }
            }

            if (selectedRestaurant?.id) {
              // Récupérer les users de ce restaurant spécifique
              const restaurantUsers = await getRestaurantUsers(
                selectedRestaurant.id
              );

              // S'assurer que restaurantUsers est un tableau
              const usersArray = Array.isArray(restaurantUsers)
                ? restaurantUsers
                : [];

              // Ajouter les SuperAdmin qui doivent apparaître partout
              const allUsers = await getAllUsers();
              const superAdmins = allUsers.filter(
                (user) => user.role === UserRole.ADMIN
              );

              data = [...superAdmins, ...usersArray] as User[];
            }
          }
        }

        // S'assurer que data est un tableau avant de l'assigner
        setUsers(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching users:", err);
        const userMessage = getHumanReadableError(err);
        setError(userMessage);
        toast.error(userMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [refreshTrigger, currentUser, selectedTab, restaurants, tabsInitialized]);

  // Convertir les users (type User from service) en format MemberForView pour MemberView
  const mappedMembersForView: MemberForView[] = users.map((user) => ({
    id: user.id,
    fullname: user.fullname || "",
    email: user.email,
    role: user.role,
    image: user.image || "",
    restaurant:
      typeof user.restaurant === "object" && user.restaurant !== null
        ? { id: user.restaurant.id, name: user.restaurant.name }
        : typeof user.restaurant === "string"
        ? user.restaurant
        : "",
    phone: user.phone || "",
    address: user.address || "",
    entity_status: user.entity_status || "ACTIVE",
  }));

  // Fonction de recherche
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Filtrage du personnel en temps réel avec useMemo
  const finalFilteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return mappedMembersForView;

    const lowerQuery = searchQuery.toLowerCase().trim();

    return mappedMembersForView.filter((member) => {
      // Tous les champs de recherche pour le personnel
      const searchableFields = [
        member.fullname || "",
        member.email || "",
        member.role || "",
        member.phone || "",
        member.address || "",
        member.id || "",
        // Restaurant (string ou objet)
        typeof member.restaurant === "string"
          ? member.restaurant
          : member.restaurant?.name || "",
        // Statut d'entité
        member.entity_status || "",
        member.entity_status === "ACTIVE" ? "actif" : "",
        member.entity_status === "INACTIVE" ? "inactif" : "",
        member.entity_status === "NEW" ? "nouveau" : "",
        // Traduction des rôles
        member.role === "ADMIN" ? "administrateur" : "",
        member.role === "MANAGER" ? "gestionnaire" : "",
        member.role === "CAISSIER" ? "caissier" : "",
        member.role === "CALL_CENTER" ? "centre d'appel" : "",
        member.role === "CUISINE" ? "cuisine" : "",
        member.role === "MARKETING" ? "marketing" : "",
        member.role === "COMPTABLE" ? "comptable" : "",
      ];

      return searchableFields.some((field) =>
        field.toLowerCase().includes(lowerQuery)
      );
    });
  }, [mappedMembersForView, searchQuery]);

  // Vérifier les permissions d'accès
  const hasAccess =
    currentUser?.role === "ADMIN" || currentUser?.role === "MANAGER";
  const isReadOnly =
    currentUser?.role === "MARKETING" || currentUser?.role === "COMPTABLE";
  const isRestaurantEmployee = ["CAISSIER", "CALL_CENTER", "CUISINE"].includes(
    currentUser?.role || ""
  );

  // Bloquer complètement l'accès pour les employés de restaurant
  if (isRestaurantEmployee) {
    return (
      <div className="flex flex-col h-full w-full items-center justify-center">
        <div className="text-center p-8">
          <div className="text-red-500 text-lg font-semibold mb-2">
            Accès non autorisé
          </div>
          <div className="text-gray-600">
            Vous n&apos;avez pas les permissions nécessaires pour accéder à
            cette section.
          </div>
          <div className="text-sm text-gray-500 mt-2">
            Rôle détecté: {currentUser?.role}
          </div>
        </div>
      </div>
    );
  }

  // Vérifier les autres permissions
  if (!hasAccess && !isReadOnly) {
    return (
      <div className="flex flex-col h-full w-full items-center justify-center">
        <div className="text-center p-8">
          <div className="text-red-500 text-lg font-semibold mb-2">
            Accès non autorisé
          </div>
          <div className="text-gray-600">
            Vous n&apos;avez pas les permissions nécessaires pour accéder à
            cette section.
          </div>
          <div className="text-sm text-gray-500 mt-2">
            Rôle détecté: {currentUser?.role}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full p-4">
      <PersonnelHeader
        onAddPersonnel={hasAccess ? () => setOpenAdd(true) : undefined}
        onSearch={handleSearch}
        isReadOnly={isReadOnly}
      />
      <div className="flex-1 overflow-y-auto ">
        <div className="bg-white border border-[#E4E4E7] rounded-xl p-2  ">
          <PersonnelTabs
            tabs={tabs}
            selected={selectedTab}
            onSelect={setSelectedTab}
          />
          {loading ? (
            <div className="p-4 text-center text-gray-500">Chargement...</div>
          ) : error ? (
            <div className="p-4 text-center text-red-500">{error}</div>
          ) : (
            <MemberView
              members={finalFilteredMembers}
              onRefresh={refreshUsers}
              isReadOnly={isReadOnly}
              // @ts-expect-error - Type mismatch between MemberForView and expected type
              onEdit={
                hasAccess
                  ? (member: MemberForView) => {
                      const originalUser = users.find(
                        (u) => u.id === member.id
                      );
                      if (originalUser) {
                        setSelectedMember(originalUser);
                        setOpenAdd(true);
                      } else {
                        const userToEdit: MemberForView = {
                          id: member.id,
                          fullname: member.fullname,
                          email: member.email,
                          role: member.role,
                          image: member.image,
                          restaurant:
                            typeof member.restaurant === "object"
                              ? {
                                  id: member.restaurant.id,
                                  name: member.restaurant.name,
                                }
                              : undefined,
                          phone: member.phone,
                          address: member.address,
                          entity_status: member.entity_status,
                        };
                        setSelectedMember(userToEdit);
                        setOpenAdd(true);
                      }
                    }
                  : undefined
              }
            />
          )}
        </div>
      </div>
      {openAdd &&
        (selectedMember ? (
          <EditMember
            existingMember={selectedMember}
            onCancel={() => {
              setOpenAdd(false);
              setSelectedMember(null);
            }}
            onSuccess={(updatedMember) => {
              setUsers((prevUsers) =>
                prevUsers.map((user) =>
                  user.id === updatedMember.id
                    ? { ...user, ...updatedMember }
                    : user
                )
              );
              setOpenAdd(false);
              setSelectedMember(null);
              refreshUsers();
            }}
          />
        ) : (
          <AddMember
            onCancel={() => setOpenAdd(false)}
            onSuccess={() => {
              setOpenAdd(false);
              refreshUsers();
            }}
          />
        ))}
    </div>
  );
}

"use client";

import {
  getAllRestaurants,
  getRestaurantUsers,
  Restaurant,
} from "@/services/restaurantService";
import { getHumanReadableError } from "@/utils/errorMessages";
import { useDashboardStore } from "@/store/dashboardStore";
import { ChevronLeft } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { useAuthStore } from "../../../../features/users/hook/authStore";
import { getAllUsers } from "../../../../features/users/services/user.service";
import { User } from "../../../../features/users/types/user.types";
import AddMember from "./AddMember";
import EditMember from "./EditMember";
import MemberDetail from "./MemberDetail";
import MemberView, { Member } from "./MemberView";
import PersonnelHeader from "./PersonnelHeader";
import PersonnelTabs from "./PersonnelTabs";

// Convertit un User complet en Member pour la page de détail (affichage).
function userToMember(u: User): Member {
  const resto =
    typeof u.restaurant === "object" && u.restaurant
      ? { id: u.restaurant.id, name: u.restaurant.name }
      : "";
  const isPrincipal =
    typeof u.restaurant === "object" &&
    u.restaurant !== null &&
    (u.restaurant as { manager?: string }).manager === u.id;
  return {
    id: u.id,
    fullname: u.fullname || "",
    email: u.email,
    role: u.role,
    image: u.image || "",
    restaurant: resto,
    phone: u.phone || "",
    address: u.address || "",
    entity_status: u.entity_status || "ACTIVE",
    isPrincipal,
  };
}

export default function Personnel() {
  const { user: currentUser } = useAuthStore();
  const {
    personnel: { view, selectedItem },
    setSectionView,
    setSelectedItem,
  } = useDashboardStore();

  const [selectedTab, setSelectedTab] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabs, setTabs] = useState<string[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [tabsInitialized, setTabsInitialized] = useState(false);

  const refreshUsers = () => setRefreshTrigger(Date.now());

  // Toujours démarrer sur la liste (évite un détail/édition figé au remount).
  useEffect(() => {
    setSectionView("personnel", "list");
    setSelectedItem("personnel", null);
  }, [setSectionView, setSelectedItem]);

  // --- Navigation (pages, plus de modal) ---
  const selectedUser = selectedItem as User | null;
  const openDetail = (u: User) => {
    setSelectedItem("personnel", u);
    setSectionView("personnel", "view");
  };
  const openEdit = (u: User) => {
    setSelectedItem("personnel", u);
    setSectionView("personnel", "edit");
  };
  const backToList = () => setSectionView("personnel", "list");
  const handleOpenDetail = (m: Member) => {
    const u = users.find((x) => x.id === m.id);
    if (u) openDetail(u);
  };
  const handleOpenEdit = (m: Member) => {
    const u = users.find((x) => x.id === m.id);
    if (u) openEdit(u);
  };

  // Récupérer les restaurants pour générer les tabs dynamiquement
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const restaurantData = await getAllRestaurants();
        const activeRestaurants = restaurantData.filter((r) => r.active);
        setRestaurants(activeRestaurants);

        if (currentUser?.role === "MANAGER" && currentUser?.restaurant_id) {
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
          setTabs(["Tous", "Back Office", ...activeRestaurants.map((r) => r.name)]);
          setSelectedTab("Tous");
        } else {
          setTabs(["Tous"]);
          setSelectedTab("Tous");
        }
        setTabsInitialized(true);
      } catch (err) {
        console.error("Erreur lors de la récupération des restaurants:", err);
        toast.error(getHumanReadableError(err));
        setTabs(["Tous"]);
        setSelectedTab("Tous");
        setRestaurants([]);
        setTabsInitialized(true);
      }
    };
    if (currentUser) fetchRestaurants();
  }, [currentUser]);

  useEffect(() => {
    if (!tabsInitialized || !currentUser || !selectedTab) return;

    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        let data: User[] = [];
        if (currentUser?.role === "MANAGER" && currentUser?.restaurant_id) {
          const allRestaurantUsers = await getRestaurantUsers(
            currentUser.restaurant_id
          );
          data = allRestaurantUsers.filter(
            (u) => u.id !== currentUser.id
          ) as User[];
        } else if (selectedTab === "Tous") {
          data = await getAllUsers();
        } else if (selectedTab === "Back Office") {
          data = await getAllUsers({ type: "BACKOFFICE" });
        } else {
          let selectedRestaurant = restaurants.find(
            (r) => r.name === selectedTab
          );
          if (!selectedRestaurant) {
            const trimmedTab = selectedTab.trim();
            selectedRestaurant = restaurants.find(
              (r) => r.name.trim() === trimmedTab
            );
          }
          if (selectedRestaurant?.id) {
            data = await getAllUsers({ restaurantId: selectedRestaurant.id });
          }
        }
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

  const mappedMembersForView: Member[] = users.map((user) => userToMember(user));

  const handleSearch = (query: string) => setSearchQuery(query);

  const finalFilteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return mappedMembersForView;
    const lowerQuery = searchQuery.toLowerCase().trim();
    return mappedMembersForView.filter((member) => {
      const searchableFields = [
        member.fullname || "",
        member.email || "",
        member.role || "",
        member.phone || "",
        member.address || "",
        member.id || "",
        typeof member.restaurant === "string"
          ? member.restaurant
          : member.restaurant?.name || "",
        member.entity_status || "",
        member.entity_status === "ACTIVE" ? "actif" : "",
        member.entity_status === "INACTIVE" ? "inactif" : "",
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

  // Permissions d'accès
  const hasAccess =
    currentUser?.role === "ADMIN" || currentUser?.role === "MANAGER";
  const isReadOnly =
    currentUser?.role === "MARKETING" || currentUser?.role === "COMPTABLE";
  const isRestaurantEmployee = ["CAISSIER", "CALL_CENTER", "CUISINE"].includes(
    currentUser?.role || ""
  );

  if (isRestaurantEmployee || (!hasAccess && !isReadOnly)) {
    return (
      <div className="flex flex-col h-full w-full items-center justify-center">
        <div className="text-center p-8">
          <div className="text-red-500 text-lg font-semibold mb-2">
            Accès non autorisé
          </div>
          <div className="text-gray-600">
            Vous n&apos;avez pas les permissions nécessaires pour accéder à cette
            section.
          </div>
          <div className="text-sm text-gray-500 mt-2">
            Rôle détecté: {currentUser?.role}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-4">
      {view === "list" ? (
        <>
          <div className="-mt-10">
            <PersonnelHeader
              onAddPersonnel={hasAccess ? () => setSectionView("personnel", "create") : undefined}
              onSearch={handleSearch}
              isReadOnly={isReadOnly}
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="bg-white border border-[#E4E4E7] rounded-xl p-2">
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
                  onOpenDetail={handleOpenDetail}
                  onOpenEdit={handleOpenEdit}
                />
              )}
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Barre de retour — seulement sur la page détail (édition/création
              ont leur propre en-tête avec fermeture). */}
          {view === "view" && (
            <div className="flex items-center gap-3 mb-4">
              <button
                type="button"
                onClick={backToList}
                className="inline-flex items-center gap-1 text-[#F17922] hover:text-orange-600 font-medium text-sm cursor-pointer"
              >
                <ChevronLeft size={18} /> Retour
              </button>
              <span className="text-[#5D5C5C] font-semibold">Détail du membre</span>
            </div>
          )}

          {view === "view" && selectedUser && (
            <MemberDetail
              member={userToMember(selectedUser)}
              onEdit={() => openEdit(selectedUser)}
              onBack={backToList}
              onRefresh={refreshUsers}
              isReadOnly={isReadOnly}
            />
          )}

          {view === "edit" && selectedUser && (
            <EditMember
              asPage
              existingMember={selectedUser}
              onCancel={() => openDetail(selectedUser)}
              onSuccess={(updated) => {
                setUsers((prev) =>
                  prev.map((u) =>
                    u.id === updated.id ? { ...u, ...updated } : u
                  )
                );
                setSelectedItem("personnel", updated);
                setSectionView("personnel", "view");
                refreshUsers();
              }}
            />
          )}

          {view === "create" && (
            <AddMember
              asPage
              onCancel={backToList}
              onSuccess={() => {
                backToList();
                refreshUsers();
              }}
            />
          )}
        </>
      )}
    </div>
  );
}

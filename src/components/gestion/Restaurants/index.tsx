"use client"

import React, { useState, useEffect, useMemo } from 'react'
import RestaurantHeader from './RestaurantHeader'
import AddRestaurant from './AddRestaurant'
import EditRestaurant from './EditRestaurant'
import RestaurantView from '../Restaurants/RestaurantView'
import RestaurantDetail from '../Restaurants/RestaurantDetail'
import RestaurantDeleteModal from '../Restaurants/RestaurantDeleteModal'
import ManagerCredentialsCustomModal from '../Restaurants/ManagerCredentialsCustomModal'
import { toast } from 'react-hot-toast'
import Modal from '@/components/ui/Modal'
import { Restaurant, getAllRestaurants, deleteRestaurant } from '@/services/restaurantService'


interface Schedule {
  [day: string]: string;
}

export default function Restaurants() {
  const [openAdd, setOpenAdd] = useState(false)
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null)
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>('')
  const [openDetail, setOpenDetail] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [restaurantToDelete, setRestaurantToDelete] = useState<Restaurant | null>(null)
  const [managerCredentials, setManagerCredentials] = useState<{ email: string; password: string } | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Fonction pour charger les restaurants
  const fetchRestaurants = async () => {
    setIsLoading(true)
    try {
      const data = await getAllRestaurants();
      setRestaurants(data);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Impossible de charger les restaurants';
      toast.error(`Erreur: ${errorMessage}`);

      setRestaurants([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Charger les restaurants au chargement du composant
  useEffect(() => {
    fetchRestaurants();
  }, []);

   // const handleToggleActive = async (restaurantId: string, active: boolean) => {
  //   try {
  //     await updateRestaurantStatus(restaurantId, active);


  //     setRestaurants(prevRestaurants =>
  //       prevRestaurants.map(restaurant =>
  //         restaurant.id === restaurantId ? { ...restaurant, active } : restaurant
  //       )
  //     );

  //     toast.success(`Restaurant ${active ? 'activé' : 'désactivé'} avec succès`);
  //   } catch (error: unknown) {
  //     const errorMessage = error instanceof Error ? error.message : 'Impossible de mettre à jour le statut du restaurant';
  //     toast.error(`Erreur: ${errorMessage}`);
  //   }
  // };

   const formatSchedule = (schedule: Schedule[]) => {
    if (!Array.isArray(schedule)) {
      return 'Horaires non disponibles';
    }

    const daysMap: {[key: string]: string} = {
      '1': 'Lun',
      '2': 'Mar',
      '3': 'Mer',
      '4': 'Jeu',
      '5': 'Ven',
      '6': 'Sam',
      '7': 'Dim'
    };

    return schedule.map(item => {
      const day = Object.keys(item)[0];
      return `${daysMap[day]}: ${item[day]}`;
    }).join(' | ');
  };

   const handleAddRestaurant = () => {
    setOpenAdd(true);
  };

   const handleRestaurantAdded = (restaurant: Restaurant) => {
     if (restaurant.manager && typeof restaurant.manager === 'object' &&
        restaurant.manager.email && restaurant.manager.password) {
      setManagerCredentials({
        email: restaurant.manager.email,
        password: restaurant.manager.password
      });
    }

    setRestaurants(prev => [...prev, restaurant]);
    setOpenAdd(false);
    fetchRestaurants();
  };

   const handleDeleteRestaurant = async (restaurantId: string) => {
     const restaurant = restaurants.find(r => r.id === restaurantId);
    if (restaurant) {
      setRestaurantToDelete(restaurant);
      setDeleteModalOpen(true);
    }
  };

   const confirmDeleteRestaurant = async () => {
    if (!restaurantToDelete || !restaurantToDelete.id) return;

    try {
      await deleteRestaurant(restaurantToDelete.id);

       setRestaurants(prevRestaurants =>
        prevRestaurants.filter(restaurant => restaurant.id !== restaurantToDelete.id)
      );

      toast.success('Restaurant supprimé avec succès');
      setDeleteModalOpen(false);
      setRestaurantToDelete(null);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Impossible de supprimer le restaurant';
      toast.error(`Erreur: ${errorMessage}`);
    }
  };

   const handleViewRestaurant = (restaurantId: string) => {
    setSelectedRestaurantId(restaurantId);
    setOpenDetail(true);
  };

   const handleEditRestaurant = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setOpenAdd(true);
    setOpenDetail(false);
  };

  // Fonction de recherche
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Filtrage des restaurants en temps réel avec useMemo
  const filteredRestaurants = useMemo(() => {
    if (!searchQuery.trim()) return restaurants;

    const query = searchQuery.toLowerCase().trim();

    return restaurants.filter(restaurant => {
      // Tous les champs de recherche pour les restaurants
      const searchableFields = [
        restaurant.name || '',
        restaurant.address || '',
        restaurant.phone || '',
        restaurant.email || '',
        restaurant.managerFullname || '',
        restaurant.managerEmail || '',
        (restaurant as { city?: string }).city || '',
        restaurant.description || '',
        // Statut du restaurant
        restaurant.active ? 'actif' : 'inactif',
        restaurant.active ? 'ouvert' : 'fermé',
        // ID pour utilisateurs avancés
        restaurant.id || '',
        // Recherche par horaires si disponibles
        restaurant.schedule ? formatSchedule(restaurant.schedule) : ''
      ];

      return searchableFields.some(field =>
        field.toLowerCase().includes(query)
      );
    });
  }, [restaurants, searchQuery]);

  return (
    <div className="flex flex-col h-full w-full">
      <RestaurantHeader
        onAddRestaurant={handleAddRestaurant}
        onSearch={handleSearch}
      />

      <RestaurantView
        onAdd={handleAddRestaurant}
        onEdit={handleEditRestaurant}
        onView={handleViewRestaurant}
        onDelete={handleDeleteRestaurant}
        restaurants={filteredRestaurants}
        isLoading={isLoading}
      />

      <Modal
        isOpen={openAdd}
        onClose={() => {
          setOpenAdd(false);
          setSelectedRestaurant(null);
        }}
        title={`${selectedRestaurant ? 'Modifier' : 'Ajouter'} un restaurant`}
        size="large"
      >
        {selectedRestaurant ? (
          <EditRestaurant
            restaurantId={selectedRestaurant.id || ''}
            onCancel={() => {
              setOpenAdd(false);
              setSelectedRestaurant(null);
            }}
            onSuccess={(updatedRestaurant) => {

              setRestaurants(prevRestaurants =>
                prevRestaurants.map(restaurant =>
                  restaurant.id === updatedRestaurant.id ? updatedRestaurant : restaurant
                )
              );

              toast.success('Restaurant mis à jour avec succès');
              setOpenAdd(false);
              setSelectedRestaurant(null);
            }}
          />
        ) : (
          <AddRestaurant
            onCancel={() => {
              setOpenAdd(false);
              setSelectedRestaurant(null);
            }}
            onSuccess={handleRestaurantAdded}
            restaurant={null}
          />
        )}
      </Modal>

      <RestaurantDetail
        open={openDetail}
        restaurantId={selectedRestaurantId}
        onClose={() => setOpenDetail(false)}
        onEdit={handleEditRestaurant}
      />

      <RestaurantDeleteModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDeleteRestaurant}
        restaurant={restaurantToDelete}
      />


      {/* ✅ UTILISATION DU MODAL CUSTOM POUR LES CREDENTIALS */}
      {managerCredentials && (
        <ManagerCredentialsCustomModal
          open={!!managerCredentials}
          email={managerCredentials.email}
          password={managerCredentials.password}
          onClose={() => setManagerCredentials(null)}
        />
      )}
    </div>
  )
}
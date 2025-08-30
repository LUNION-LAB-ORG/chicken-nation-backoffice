"use client"

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { toast } from 'react-hot-toast'
import RestaurantActionsMenu from './RestaurantActionsMenu'
import { createPortal } from 'react-dom'
// import { updateRestaurantStatus } from '@/services/restaurantService'
import { useDashboardNavigation } from '@/hooks/useDashboardNavigation'
import { useRBAC } from '@/hooks/useRBAC'
import { Menu } from 'lucide-react'

interface Schedule {
  [day: string]: string;
}

interface Restaurant {
  id?: string;
  name: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  email: string;
  schedule: Schedule[];
  managerFullname?: string;
  managerEmail?: string;
  managerPhone?: string;
  image?: string;
  active?: boolean;
  createdAt?: string;
}

interface RestaurantViewProps {
  onAdd: () => void;
  onEdit: (restaurant: Restaurant) => void;
  onView: (restaurantId: string) => void;
  onDelete: (restaurantId: string) => void;
  restaurants?: Restaurant[];
  isLoading?: boolean;
}

export default function RestaurantView({
  // onAdd, // Non utilisé actuellement
  onEdit,
  onView,
  onDelete,
  restaurants = []
  // isLoading = false
}: RestaurantViewProps) {
  const [filter] = useState<'all' | 'active' | 'inactive'>('all')
  const { navigateToRestaurantDashboard, canViewRestaurantDashboard } = useDashboardNavigation()
  const { canViewRestaurant, canUpdateRestaurant, canDeleteRestaurant } = useRBAC()

  const [menuOpen, setMenuOpen] = useState<boolean>(false)
  const [menuPosition, setMenuPosition] = useState<{top: number, left: number}|null>(null)
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null)
  const menuBtnRef = useRef<HTMLSpanElement|null>(null)
  const menuRef = useRef<HTMLDivElement|null>(null)
 

  const filteredRestaurants = restaurants.filter(restaurant => {
    if (filter === 'all') return true;
    if (filter === 'active') return restaurant.active === true;
    if (filter === 'inactive') return restaurant.active === false;
    return true;
  });

  // Fonction pour naviguer vers le dashboard du restaurant
  const handleDashboardClick = (restaurant: Restaurant) => {
    if (restaurant.id && canViewRestaurantDashboard()) {
      navigateToRestaurantDashboard(restaurant.id);
    } else {
      toast.error("Vous n'avez pas accès au dashboard de ce restaurant");
    }
  };

  const handleMenuOpen = (event: React.MouseEvent, restaurant: Restaurant) => {
    event.stopPropagation();

    if (menuOpen) {

      setMenuOpen(false);
      setMenuPosition(null);
      setSelectedRestaurant(null);
    } else {

      setMenuPosition({
        top: event.clientY,
        left: event.clientX
      });
      setSelectedRestaurant(restaurant);
      setMenuOpen(true);
    }
  }

  useEffect(() => {
    if (!menuOpen) return

    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && menuRef.current.contains(e.target as Node)) return;
      setMenuOpen(false); setMenuPosition(null); setSelectedRestaurant(null);
    }
    const handleClose = () => { setMenuOpen(false); setMenuPosition(null); setSelectedRestaurant(null) }
    window.addEventListener('scroll', handleClose, true)
    window.addEventListener('resize', handleClose)
    window.addEventListener('click', handleClick)
    return () => {
      window.removeEventListener('scroll', handleClose, true)
      window.removeEventListener('resize', handleClose)
      window.removeEventListener('click', handleClick)
    }
  }, [menuOpen])

  return (
    <div className="flex-1 bg-white border-[1px]  border-[#ECECEC] rounded-[15px] p-6 flex-col h-full w-full">
      {/* Tableau des restaurants */}
    {
      filteredRestaurants.map((restaurant) => (
        <div key={restaurant.id || Math.random().toString()} className="bg-white p-4 py-3 border-[1px] border-[#ECECEC]/50 rounded-2xl shadow-sm flex justify-between items-center mb-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 relative">
            <Image
              src="/icons/restaurant.png"
              alt="Chicken Nation"
              width={48}
              height={48}
              className="object-contain"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-[#F17922] text-sm lg:text-2xl font-regular -mt-1">{restaurant.name}</span>
          </div>
        
        </div>
        <div className="flex gap-2 items-center">
          <button
            type="button"
            onClick={() => handleDashboardClick(restaurant)}
            className="bg-[#F17922] text-white px-4 py-2 rounded-full text-xs lg:text-sm hover:bg-[#e06a15] transition-colors"
          >
            Tableau de bord
          </button>
        
          {(canViewRestaurant() || canUpdateRestaurant() || canDeleteRestaurant()) && (
            <span
              className="text-[#71717A] text-lg cursor-pointer select-none px-2 ml-1"
              ref={menuBtnRef}
              onClick={(e) => handleMenuOpen(e, restaurant)}
            >
             <Menu size={20} />
            </span>
          )}
        </div>
      </div>
      ))
      }

      {menuOpen && menuPosition && selectedRestaurant && typeof document !== 'undefined' && createPortal(
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            top: `${menuPosition.top}px`,
            left: `${menuPosition.left - 150}px`,
            zIndex: 100,
          }}
        >
          <RestaurantActionsMenu
            onView={() => {
              onView(selectedRestaurant.id || '');
              setMenuOpen(false);
              setMenuPosition(null);
              setSelectedRestaurant(null);
            }}
            onEdit={() => {
              onEdit(selectedRestaurant);
              setMenuOpen(false);
              setMenuPosition(null);
              setSelectedRestaurant(null);
            }}
            onDelete={() => {
              onDelete(selectedRestaurant.id || '');
              setMenuOpen(false);
              setMenuPosition(null);
              setSelectedRestaurant(null);
            }}

          />
        </div>,
        document.body
      )}
    </div>
  )
}
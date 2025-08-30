"use client"

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Input from '../../ui/Input'  
import Button from '../../ui/Button'    
import Toggle from '@/components/ui/Toggle'
import ScheduleSelector from './ScheduleSelector'
import { ImageIcon, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { updateRestaurant, getRestaurantById, Restaurant, Schedule } from '@/services/restaurantService'
import RestaurantMap from './RestaurantMap'

interface EditRestaurantProps {
  restaurantId: string;
  onCancel: () => void;
  onSuccess?: (restaurant: Restaurant) => void;
}

export default function EditRestaurant({ restaurantId, onCancel, onSuccess }: EditRestaurantProps) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [formErrors] = useState<Record<string, string>>({});
  const [schedule, setSchedule] = useState<Schedule[]>([]);
  
  // Charger les détails du restaurant
  useEffect(() => {
    const fetchRestaurantDetails = async () => {
      if (!restaurantId) return;
      
      setIsLoading(true);
      try {
        const data = await getRestaurantById(restaurantId);
        setRestaurant(data);
        
        // Initialiser les horaires
        if (data.schedule) {
          setSchedule(data.schedule);
        }
        
         if (data.image) {
           if (data.image.startsWith('http')) {
            setImagePreview(data.image);
          } else {
             const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
             const imageUrl = data.image.startsWith('/') ? data.image : `/${data.image}`;
            setImagePreview(`${apiUrl}${imageUrl}`);
          }
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Impossible de charger les détails du restaurant';
        toast.error(`Erreur: ${errorMessage}`);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRestaurantDetails();
  }, [restaurantId]);
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
     if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image valide');
      return;
    }
    
     if (file.size > 5 * 1024 * 1024) {
      toast.error('L\'image ne doit pas dépasser 5MB');
      return;
    }
    
    setImageFile(file);
    
    // Créer un aperçu de l'image
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!restaurant) {
      toast.error('Aucun restaurant à modifier');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const formData = new FormData();
      
      const form = e.target as HTMLFormElement;
      const name = (form.querySelector('[name="name"]') as HTMLInputElement)?.value;
      const description = (form.querySelector('[name="description"]') as HTMLTextAreaElement)?.value;
      const address = (form.querySelector('[name="address"]') as HTMLInputElement)?.value;
      const latitude = parseFloat((form.querySelector('[name="latitude"]') as HTMLInputElement)?.value || '0');
      const longitude = parseFloat((form.querySelector('[name="longitude"]') as HTMLInputElement)?.value || '0');
      const phone = (form.querySelector('[name="phone"]') as HTMLInputElement)?.value;
      const email = (form.querySelector('[name="email"]') as HTMLInputElement)?.value;
      const active = (form.querySelector('[name="active"]') as HTMLInputElement)?.checked;
      
      // Validation des coordonnées
      if (isNaN(latitude) || isNaN(longitude)) {
        toast.error('Les coordonnées GPS sont invalides');
        setIsSubmitting(false);
        return;
      }
      
      // Ajouter tous les champs au FormData
      formData.append('name', name);
      formData.append('description', description);
      formData.append('address', address);
      formData.append('latitude', latitude.toString());
      formData.append('longitude', longitude.toString());
      formData.append('phone', phone);
      formData.append('email', email);
      formData.append('active', active ? 'true' : 'false');
      
      if (imageFile) {
        formData.append('image', imageFile);
      }
      
      formData.append('schedule', JSON.stringify(schedule));
      
      const result = await updateRestaurant(restaurantId, formData);
      
      toast.success('Restaurant mis à jour avec succès');
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      onCancel();
    } catch (error) {
      console.error('Erreur lors de la mise à jour du restaurant:', error);
      toast.error('Erreur lors de la mise à jour du restaurant');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 text-[#F17922] animate-spin" />
        <p className="ml-2 text-gray-600">Chargement des données du restaurant...</p>
      </div>
    );
  }
  
  if (!restaurant) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-600">Restaurant non trouvé</p>
      </div>
    );
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Colonne de gauche */}
          <div className="space-y-6">
            {/* Informations générales */}
            <div>
              <h3 className="text-lg font-semibold text-[#595959] mb-4">Informations générales</h3>
              
              <div className="space-y-4">
                {/* Nom */}
                <div>
                  <label className="block text-sm text-[#595959] font-light mb-2">
                    Nom du restaurant*
                  </label>
                  <Input
                    name="name"
                    type="text"
                    defaultValue={restaurant.name}
                    required
                    placeholder="Nom du restaurant"
                    className={`w-full h-[42px] rounded-xl bg-white border ${formErrors.name ? 'border-red-500' : 'border-[#D8D8D8]'} px-4 text-[13px] placeholder-gray-400`}
                  />
                  {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
                </div>
                
                {/* Description */}
                <div>
                  <label className="block text-sm text-[#595959] font-light mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    defaultValue={restaurant.description}
                    placeholder="Description du restaurant"
                    rows={3}
                    className={`w-full rounded-xl text-gray-600 bg-white border-1 ${formErrors.description ? 'border-red-500' : 'border-gray-300'} px-4 py-2 text-[13px] placeholder-gray-400`}
                  />
                </div>
                
               
                {/* Carte */}
                <div>
                  <label className="block text-sm text-[#595959] font-light mb-2">
                    Localisation
                  </label>
                  <RestaurantMap
                    initialLat={restaurant.latitude}
                    initialLng={restaurant.longitude}
                    onLocationChange={(lat, lng, address) => {
                      // Mettre à jour le champ d'adresse
                      const addressInput = document.querySelector('[name="address"]') as HTMLInputElement;
                      if (addressInput) {
                        addressInput.value = address;
                      }
                      
                      // Mettre à jour les champs de latitude et longitude
                      const latInput = document.querySelector('[name="latitude"]') as HTMLInputElement;
                      const lngInput = document.querySelector('[name="longitude"]') as HTMLInputElement;
                      if (latInput && lngInput) {
                        latInput.value = lat.toString();
                        lngInput.value = lng.toString();
                      }
                    }}
                  />
                  
                  {/* Champs cachés pour les coordonnées et l'adresse */}
                  <input type="hidden" name="latitude" value={restaurant.latitude} />
                  <input type="hidden" name="longitude" value={restaurant.longitude} />
                  <input type="hidden" name="address" defaultValue={restaurant.address} />
                </div>
                
                {/* Contact */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-[#595959] font-light mb-2">
                      Téléphone*
                    </label>
                    <Input
                      name="phone"
                      type="text"
                      defaultValue={restaurant.phone}
                      required
                      placeholder="+225 XX XX XX XX"
                      className={`w-full h-[42px] rounded-xl bg-white border ${formErrors.phone ? 'border-red-500' : 'border-[#D8D8D8]'} px-4 text-[13px] placeholder-gray-400`}
                    />
                    {formErrors.phone && <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>}
                  </div>
                  <div>
                    <label className="block text-sm text-[#595959] font-light mb-2">
                      Email*
                    </label>
                    <Input
                      name="email"
                      type="email"
                      defaultValue={restaurant.email}
                      required
                      placeholder="email@restaurant.com"
                      className={`w-full h-[42px] rounded-xl bg-white border ${formErrors.email ? 'border-red-500' : 'border-[#D8D8D8]'} px-4 text-[13px] placeholder-gray-400`}
                    />
                    {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
                  </div>
                </div>
                
                {/* Statut */}
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-[#595959] font-light">
                    Actif
                  </label>
                  <Toggle
                    checked={restaurant.active || false}
                    onChange={() => {
                      // Fonction non implémentée actuellement
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
          {/* Colonne de droite */}
          <div className="space-y-6">
            {/* Horaires */}
            <div>
              <ScheduleSelector 
                schedule={schedule} 
                onChange={(newSchedule) => {
                  setSchedule(newSchedule);
                }}
              />
            </div>
                {/* Photo */}
                <div>
              <label className="block text-sm text-[#595959] font-light mb-2">
                Photo du restaurant
              </label>
              <div 
                className="w-full h-[170px] border-2 border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => document.getElementById('restaurant-image-upload')?.click()}
              >
                {imagePreview ? (
                  <div className="relative w-full h-full rounded-xl overflow-hidden">
                    <Image 
                      src={imagePreview} 
                      alt="Aperçu du restaurant"
                      fill
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <>
                    <ImageIcon className="w-8 h-8 text-gray-400 mb-1" />
                    <p className="text-[11px] text-gray-500 text-center px-2">
                      Télécharger une image ici
                    </p>
                  </>
                )}
                <input
                  type="file"
                  id="restaurant-image-upload"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                  aria-label="Télécharger une photo du restaurant"
                />
              </div>
            </div>
            
          </div>
        </div>
      </div>
      
      <div className="flex justify-end space-x-3 mt-6">
        <Button
          type="button"
          onClick={onCancel}
          className="h-[32px] text-[#9796A1] px-12 rounded-[10px] bg-[#ECECEC] text-[13px] items-center justify-center hover:bg-gray-100 min-w-[160px]"
        >
          Annuler
        </Button>
        <Button 
          type="submit"
          disabled={isSubmitting}
          className="h-[32px] px-12 rounded-[10px] bg-[#F17922] hover:bg-[#F17922]/90 text-white text-[13px] min-w-[160px] lg:min-w-[280px] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Modification en cours...
            </>
          ) : (
            'Modifier le restaurant'
          )}
        </Button>
      </div>
    </form>
  );
}
"use client"

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Input from '../../ui/Input'  
import Button from '../../ui/Button'    
import Select from '@/components/ui/Select' 
import Toggle from '@/components/ui/Toggle'
import { Dish } from '@/types/dish'
import { ImageIcon } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { validateCreateSupplement } from '@/schemas/supplementSchemas'

interface AddProductProps {
  onCancel: () => void
  onSuccess?: (dish: Dish) => void
  dish?: Dish | null
}

// Types de suppléments disponibles
const SUPPLEMENT_CATEGORIES = [
  { value: 'FOOD', label: 'Accompagnement' },
  { value: 'DRINK', label: 'Boisson' },
  { value: 'ACCESSORY', label: 'Accessoire/Ingrédient' }
];

export default function AddSupplement({ onCancel, onSuccess, dish }: AddProductProps) {
  const [formData, setFormData] = useState<{
    name: string;
    price: number;
    description?: string;
    image?: File;
    available: boolean;
    category: string;
  }>({
    name: '', 
    price: 0,
    description: '',
    image: undefined,
    available: true, 
    category: '',
  })
  
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Initialiser le formulaire si un plat est fourni pour modification
  useEffect(() => {
    if (dish) {
      setFormData({
        name: dish.name,
        price: dish.price,
        description: dish.description,
        image: undefined,
        available: dish.available,
        category: dish.category || 'FOOD',
      })
      
      if (dish.image) {
        setImagePreview(dish.image)
      }
    }
  }, [dish])

  const validateForm = (): boolean => {
    try {
      // ✅ SÉCURITÉ: Validation avec Zod
      const validationData = {
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
        price: formData.price,
        category: formData.category,
        available: formData.available
      };

      validateCreateSupplement(validationData);
      setFormErrors({});
      return true;
    } catch (error: unknown) {
      const errors: Record<string, string> = {};

      if (error && typeof error === 'object' && 'errors' in error) {
        // Erreurs Zod
        const zodError = error as { errors: Array<{ path: Array<string | number>; message: string }> };
        zodError.errors.forEach((err) => {
          const field = err.path[0];
          if (field && typeof field === 'string' && !errors[field]) {
            errors[field] = err.message;
          }
        });
      } else {
        errors.general = 'Données invalides';
      }

      setFormErrors(errors);
      return false;
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { name: string; value: string } } | string
  ) => {
    if (typeof e === 'string') {
      // Gestion du Select pour la catégorie
      setFormData(prev => ({
        ...prev,
        category: e
      }))
      setFormErrors(prev => ({ ...prev, category: '' }))
    } else {
      // Gestion des inputs et textarea
      const { name, value } = e.target
      
      if (name === 'price') {
        // Convertir en nombre pour les champs de prix
        const numValue = value === '' ? 0 : Number(value)
        setFormData(prev => ({
          ...prev,
          [name]: numValue
        }))
        setFormErrors(prev => ({ ...prev, [name]: '' }))
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: value
        }))
        setFormErrors(prev => ({ ...prev, [name]: '' }))
      }
    }
  }

  const handleToggleChange = (name: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData(prev => ({
        ...prev,
        image: file
      }))
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        setImagePreview(result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('Veuillez corriger les erreurs du formulaire')
      return
    }
    
    setIsLoading(true)
    
    try {
      const fd = new FormData()
      fd.append('name', formData.name)
      fd.append('price', formData.price.toString())
      fd.append('category', formData.category)
      fd.append('available', formData.available ? 'true' : 'false')
      
      if (formData.description) {
        fd.append('description', formData.description)
      }
      
      if (formData.image instanceof File) {
        fd.append('image', formData.image)
      }
      
      // Utiliser le client API centralisé qui gère automatiquement l'authentification
      const { api } = await import('@/services/api')
      
      // Envoyer la requête avec le client API
      const newSupplement = await api.post<Dish>('/api/v1/supplements', fd)
      
      toast.success('Supplément créé avec succès')
      
      if (onSuccess) {
        onSuccess(newSupplement)
      }
      onCancel()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Impossible de créer le supplément';
      toast.error(`Erreur: ${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      <div>
        <label className="block text-sm text-[#595959] font-light mb-2">
          Nom du supplément
        </label>
        <Input
          name="name"
          type="text"
          value={formData.name}
          onChange={handleChange}
          required
          placeholder="Nom du supplément"
          className={`w-full h-[42px] rounded-xl bg-white border ${formErrors.name ? 'border-red-500' : 'border-[#D8D8D8]'} px-4 text-[13px] placeholder-gray-400`}
        />
        {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
      </div>

      {/* Prix */}
      <div className="w-full">
        <label className="block text-sm text-[#595959] font-light mb-2">
          Prix
        </label>
        <div className="relative w-full">
          <span className="absolute z-44 left-4 top-1/2 -translate-y-1/2 text-gray-400 text-[14px]">
            XOF
          </span>
          <Input
            name="price"
            type="number"
            value={formData.price.toString()}
            onChange={handleChange}
            min="0"
            step="1"
            placeholder="0"
            required
            className={`w-full h-[42px] rounded-xl bg-white border ${formErrors.price ? 'border-red-500' : 'border-[#D8D8D8]'} pl-13 pr-4 text-[13px] placeholder-gray-400`}
          />
        </div>
        {formErrors.price && <p className="text-red-500 text-xs mt-1">{formErrors.price}</p>}
        <p className="text-gray-500 text-xs mt-1">Un prix de 0 CFA sera considéré comme gratuit.</p>
      </div>

      <div>
        <label className="block text-sm text-[#595959] font-light mb-2">
          Type de supplément
        </label>
        <Select
          options={SUPPLEMENT_CATEGORIES}
          value={formData.category}
          onChange={handleChange}
          placeholder="Sélectionnez un type de supplément"
          className={`w-full h-[42px] rounded-xl bg-white border ${formErrors.category ? 'border-red-500' : 'border-[#D8D8D8]'} px-4 text-[13px]`}
        />
        {formErrors.category && <p className="text-red-500 text-xs mt-1">{formErrors.category}</p>}
      </div>

 
      <div className="mt-4">
       <div className='flex-1 flex items-center justify-between'>
        <span>Disponible</span>
        <Toggle 
          checked={formData.available || false} 
          onChange={(checked) => handleToggleChange('available', checked)}
        />
        </div>

        <div>
          <label className="block text-sm text-[#595959] font-light mb-2">
            Photo du supplément
          </label>
          <div 
            className="w-[192px] h-[166px] border-2 border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => document.getElementById('product-image-upload')?.click()}
          >
            {imagePreview ? (
              <div className="relative w-full h-full rounded-xl overflow-hidden">
                <Image 
                  src={imagePreview} 
                  alt="Aperçu du supplément"
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
              id="product-image-upload" 
              accept="image/*" 
              className="hidden" 
              onChange={handleImageChange}
              aria-label="Télécharger une image du supplément"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3 mt-6">
        <Button
          type="button"
          onClick={onCancel}
          className="h-[32px] cursor-pointer text-[#9796A1] px-12 rounded-[10px] bg-[#ECECEC] text-[13px] items-center justify-center hover:bg-gray-100 min-w-[160px]"
        >
          Annuler
        </Button>
        <Button 
          type="submit"
          disabled={isLoading}
          className="h-[32px] cursor-pointer px-12 rounded-[10px] bg-[#F17922] hover:bg-[#F17922]/90 text-white text-[13px] min-w-[160px] lg:min-w-[280px] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Ajout en cours...' : 'Ajouter un supplément'}
        </Button>
      </div>
    </form>
  )
}

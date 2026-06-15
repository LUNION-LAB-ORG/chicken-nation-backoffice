"use client"

import React, { useState, useRef, useEffect, useMemo } from 'react'
import Image from 'next/image'
import Input from '../../ui/Input'
import Button from '../../ui/Button'
import {updateMember, softDeleteUser, updateUserPassword, getUserById } from '../../../../features/users/services/user.service'
import toast from 'react-hot-toast'
import type { Member } from './MemberView'
import { useAuthStore } from '../../../../features/users/hook/authStore'
import { getAllRestaurants, Restaurant } from '@/services/restaurantService'

// Rôles « point de vente » : ils exigent un restaurant de rattachement.
const STORE_ROLES = ['MANAGER', 'ASSISTANT_MANAGER', 'CAISSIER', 'CUISINE']
import { formatImageUrl } from '@/utils/imageHelpers'
import { getHumanReadableError, getPersonnelSuccessMessage, getInfoMessage } from '@/utils/errorMessages'
import { User } from '../../../../features/users/types/user.types'
import { LoginResponse } from '../../../../features/users/types/auth.type'

// Type qui accepte soit un User soit un Member

type UserOrMember = (User & { image?: string }) | (Member & {
  fullname?: string;
  phone?: string;
  address?: string;
});

// Type pour les données de mise à jour

interface UpdateUserData {
  fullname: string;
  email: string;
  phone: string;
  address: string;
  role: string;
  restaurant_id?: string;
}

interface EditMemberProps {
  onCancel: () => void
  onSuccess?: (member: User) => void
  existingMember: UserOrMember
}

export default function EditMember({ onCancel, onSuccess, existingMember }: EditMemberProps) {
  const { user: currentUser, setUser } = useAuthStore();

  // État initial avec valeurs par défaut sécurisées
  // Initialiser avec des valeurs par défaut, puis mettre à jour dans useEffect
  const [formData, setFormData] = useState<{ fullname: string; email: string; phone: string; address: string; image?: File }>({
    fullname: ('fullname' in existingMember && typeof existingMember.fullname === 'string') ? existingMember.fullname :
             ('name' in existingMember && typeof existingMember.name === 'string') ? existingMember.name : '',
    email: existingMember.email || '',
    phone: ('phone' in existingMember && typeof existingMember.phone === 'string') ? existingMember.phone : '',
    address: ('address' in existingMember && typeof existingMember.address === 'string') ? existingMember.address : '',
    image: undefined
  })

  // Stocker les valeurs initiales pour comparer lors de la soumission
  const [, setInitialValues] = useState({
    fullname: ('fullname' in existingMember && typeof existingMember.fullname === 'string') ? existingMember.fullname :
             ('name' in existingMember && typeof existingMember.name === 'string') ? existingMember.name : '',
    email: existingMember.email || '',
    phone: ('phone' in existingMember && typeof existingMember.phone === 'string') ? existingMember.phone : '',
    address: ('address' in existingMember && typeof existingMember.address === 'string') ? existingMember.address : '',
    role: 'role' in existingMember ? existingMember.role : ''
  })
  
  
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [role, setRole] = useState('role' in existingMember ? existingMember.role : '')
  const [showRoleDropdown, setShowRoleDropdown] = useState(false)
  const roleDropdownRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showSoftDeleteConfirm, setShowSoftDeleteConfirm] = useState(false)
  const [showDangerZone, setShowDangerZone] = useState(false)
  
  // États pour les mots de passe
  const [passwordData, setPasswordData] = useState({
    password: '',
    confirmPassword: ''
  })
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({})
  const [showPasswordSection, setShowPasswordSection] = useState(false)

  const roleOptions = useMemo(() => {
    if (currentUser?.role === 'ADMIN') {
      return [
        { value: 'ADMIN', label: 'ADMINISTRATEUR' },
        { value: 'MARKETING', label: 'MARKETING' },
        { value: 'COMPTABLE', label: 'COMPTABLE' },
        { value: 'CALL_CENTER', label: 'CALL CENTER' },
        { value: 'MANAGER', label: 'MANAGER' },
        { value: 'ASSISTANT_MANAGER', label: 'ASSISTANT MANAGER' },
        { value: 'CAISSIER', label: 'CAISSIER' },
        { value: 'CUISINE', label: 'CUISINE' },
      ];
    } else if (currentUser?.role === 'MANAGER') {
      return [
        { value: 'ASSISTANT_MANAGER', label: 'ASSISTANT MANAGER' },
        { value: 'CAISSIER', label: 'CAISSIER' },
        { value: 'CUISINE', label: 'CUISINE' },
      ];
    }
    return [];
  }, [currentUser]);

  // Sélection du restaurant (admin éditant un rôle point de vente).
  const initialRestaurantId =
    (typeof (existingMember as { restaurant?: unknown }).restaurant === 'object' &&
      (existingMember as { restaurant?: { id?: string } }).restaurant?.id) || '';
  const [restaurantId, setRestaurantId] = useState<string>(initialRestaurantId);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  useEffect(() => {
    let active = true;
    getAllRestaurants()
      .then((list) => { if (active) setRestaurants(list.filter((r) => r.active)); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const isStoreRole = STORE_ROLES.includes(role);
  const isAdmin = currentUser?.role === 'ADMIN';
  const needsRestaurantPicker = isStoreRole && isAdmin;
  const resolvedRestaurantId = isStoreRole
    ? restaurantId ||
      (currentUser?.role === 'MANAGER' ? currentUser?.restaurant_id || undefined : undefined)
    : undefined;

  useEffect(() => {
    if (roleOptions.length > 0 && !role) {
      setRole(roleOptions[0].value);
    }
  }, [roleOptions, role]);

  useEffect(() => {
    const newFormData = {
      fullname: ('fullname' in existingMember && typeof existingMember.fullname === 'string') ? existingMember.fullname :
               ('name' in existingMember && typeof existingMember.name === 'string') ? existingMember.name : '',
      email: existingMember.email || '',
      phone: ('phone' in existingMember && typeof existingMember.phone === 'string') ? existingMember.phone : '',
      address: ('address' in existingMember && typeof existingMember.address === 'string') ? existingMember.address : '',
      image: undefined
    };

    const memberRole = 'role' in existingMember ? existingMember.role : '';

    const newInitialValues = {
      fullname: newFormData.fullname,
      email: newFormData.email,
      phone: newFormData.phone,
      address: newFormData.address,
      role: memberRole
    };

    // Mettre à jour les données du formulaire
    setFormData(newFormData);

    // Mettre à jour les valeurs initiales
    setInitialValues(newInitialValues);

    // Mise à jour du rôle
    setRole(memberRole);

  }, [existingMember, imageFile])

  useEffect(() => {
    if (!showRoleDropdown) return
    const handleClickOutside = (e: MouseEvent) => {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(e.target as Node)) {
        setShowRoleDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showRoleDropdown])

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    if (!formData.fullname.trim()) errors.fullname = 'Le nom est requis'
    if (!formData.email.trim()) errors.email = 'L\'email est requis'
    else if (!/^\S+@\S+\.\S+$/.test(formData.email)) errors.email = 'Email invalide'
    if (!formData.phone.trim()) errors.phone = 'Le téléphone est requis'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setFormErrors(prev => ({ ...prev, [name]: '' }))
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordData(prev => ({ ...prev, [name]: value }))
    setPasswordErrors(prev => ({ ...prev, [name]: '' }))
  }

  const validatePassword = (): boolean => {
    const errors: Record<string, string> = {}
    
    if (!passwordData.password.trim()) {
      errors.password = 'Le mot de passe est requis'
    } else if (passwordData.password.length < 6) {
      errors.password = 'Le mot de passe doit contenir au moins 6 caractères'
    }
    
    if (!passwordData.confirmPassword.trim()) {
      errors.confirmPassword = 'La confirmation du mot de passe est requise'
    } else if (passwordData.password !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Les mots de passe ne correspondent pas'
    }
    
    setPasswordErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handlePasswordSubmit = async () => {
    if (!validatePassword()) return

    setIsLoading(true)

    // Toast de chargement
    toast.loading(getInfoMessage('saving'));

    try {
      const updatedUser = await updateUserPassword({
        password: passwordData.password,
        confirmPassword: passwordData.confirmPassword
      })
     

      toast.success(getPersonnelSuccessMessage('update'))

      // Recharge l'utilisateur depuis le backend pour garantir la bonne valeur
      let freshUser = updatedUser;
      try {
        freshUser = await getUserById(updatedUser.id);

      } catch {
        // fallback sur updatedUser si l'appel échoue
      }

      // Réinitialiser les champs du mot de passe
      setPasswordData({
        password: '',
        confirmPassword: ''
      })


      setUser(freshUser as LoginResponse)

      if (onSuccess) {
        onSuccess(freshUser)
      }
    } catch (err: unknown) {
      const userMessage = getHumanReadableError(err);
      toast.error(userMessage);
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return;

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image valide (JPG, PNG, WebP)');
      return;
    }

    // Vérifier la taille du fichier (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('L\'image ne doit pas dépasser 5MB');
      return;
    }

    // Stocker le fichier pour l'upload
    setImageFile(file);

    // Créer un aperçu de l'image
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setSelectedImagePreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsLoading(true)

    // Toast de chargement
    toast.loading(getInfoMessage('saving'));

    try {
    
      let isOwnProfile = false;

      // Use user from store to check if it's own profile
      if (currentUser && currentUser.id === existingMember.id) {
        isOwnProfile = true;
      }

      // Permissions : l'ADMIN édite n'importe quel membre ; les autres seulement
      // leur propre profil. (Le backend revérifie : PATCH /users/:id.)
      if (!isOwnProfile && !isAdmin) {
        toast.error('Vous n\'avez pas les droits pour modifier ce membre.');
        setIsLoading(false);
        return;
      }

      // Un rôle point de vente exige un restaurant de rattachement.
      if (isStoreRole && !resolvedRestaurantId) {
        toast.error('Sélectionnez un restaurant pour ce rôle (point de vente).');
        setIsLoading(false);
        return;
      }

      // Utiliser FormData pour tout (comme createUser)
      const baseData: UpdateUserData = {
        fullname: formData.fullname,
        email: formData.email,
        phone: formData.phone || '',
        address: formData.address || '',
        role: role,
        ...(resolvedRestaurantId ? { restaurant_id: resolvedRestaurantId } : {}),
      };

      let updatedUser: User;

      if (imageFile) {
     
        const dataWithImage = {
          fullname: baseData.fullname,
          email: baseData.email,
          phone: baseData.phone,
          address: baseData.address,
          role: baseData.role,
          ...(resolvedRestaurantId ? { restaurant_id: resolvedRestaurantId } : {}),
          image: imageFile as File
        };

        updatedUser = await updateMember(existingMember.id, dataWithImage);
      } else {

        updatedUser = await updateMember(existingMember.id, baseData);
      }

      toast.success(getPersonnelSuccessMessage('update'));

      // Ne rafraîchir la SESSION que si l'utilisateur a édité SON propre profil
      // (sinon on remplacerait l'identité connectée par celle du membre édité).
      if (isOwnProfile) {
        setUser(updatedUser as LoginResponse);
      }

      if (onSuccess) {
        onSuccess(updatedUser);
      }
    } catch (err: unknown) {
      const userMessage = getHumanReadableError(err);
      toast.error(userMessage);
    } finally {
      setIsLoading(false);
    }
  }

  const handleSoftDelete = async () => {
    try {
      setIsLoading(true);
      toast.loading(getInfoMessage('deleting'));
      await softDeleteUser(existingMember.id);
      toast.success(getPersonnelSuccessMessage('delete'));
      setShowSoftDeleteConfirm(false);
      if (onSuccess) {
        // Réactualiser la liste ou fermer le modal
        onCancel();
      }
    } catch (error: unknown) {
      const userMessage = getHumanReadableError(error);
      toast.error(userMessage);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-2 md:p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-[760px] mx-0 md:mx-0 p-0 max-h-[95vh] md:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="relative flex items-center justify-center px-0 pt-0 pb-0 bg-[#FFF3E3] rounded-t-2xl h-[40px]">
          <h2 className="text-base font-semibold text-[#F17922] mx-auto text-center">Modifier votre profil</h2>
          <Image src="/icons/close.png" width={20} height={20} alt="Fermer" onClick={onCancel}
            className="absolute cursor-pointer right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-4xl font-bold" />
        </div>
        {/* MOBILE */}
        <form onSubmit={handleSubmit} className="block md:hidden w-full flex-1 overflow-y-auto">
          <div className="px-4 pt-4 pb-6 flex flex-col gap-3">
            <div className="flex flex-col items-center gap-2">
              <div className="w-[96px] h-[96px] rounded-full bg-[#F4F4F5] flex items-center justify-center overflow-hidden cursor-pointer" onClick={() => document.getElementById('edit-image-upload')?.click()}>
                <Image
                  src={selectedImagePreview || formatImageUrl(currentUser?.image || undefined) || "/icons/header/default-avatar.png"}
                  alt="Aperçu du membre"
                  width={96}
                  height={96}
                  className="object-cover w-full h-full rounded-full"
                  unoptimized={!currentUser?.image || currentUser?.image?.startsWith('/icons/')}
                />
                <input
                  id="edit-image-upload"
                  type="file"
                  accept="image/*"
                  className="absolute invisible"
                  onChange={handleImageChange}
                  aria-label="Changer la photo de profil"
                />
              </div>
              <button type="button" className="text-[#F17922] text-xs font-semibold mt-1" onClick={() => document.getElementById('edit-image-upload')?.click()}>Changer la photo</button>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[#71717A] text-sm">Nom et prénom(s)</label>
              <Input name="fullname" value={formData.fullname} onChange={handleChange}
                className="h-[40px] rounded-lg border-[#ECECEC] bg-white text-[15px] text-slate-700"
                error={formErrors.fullname} />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[#71717A] text-sm">E-mail</label>
              <Input name="email" value={formData.email} onChange={handleChange}
                className="h-[40px] rounded-lg border-[#ECECEC] bg-white text-[15px] text-slate-700"
                error={formErrors.email} />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[#71717A] text-sm">Téléphone</label>
              <Input name="phone" value={formData.phone} onChange={handleChange}
                className="h-[40px] rounded-lg border-[#ECECEC] bg-white text-[15px] text-slate-700"
                error={formErrors.phone} />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[#71717A] text-sm">Adresse</label>
              <Input name="address" value={formData.address} onChange={handleChange}
                className="h-[40px] rounded-lg border-[#ECECEC] bg-white text-[15px] text-slate-700" />
            </div>
            <div className="relative" ref={roleDropdownRef}>
              <div className="text-[#595959] text-[15px] mb-1">Rôle</div>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={roleOptions.length === 0}
                className="w-full h-[44px] rounded-lg border border-[#ECECEC] bg-white px-4 text-[15px] text-[#71717A] font-semibold disabled:bg-gray-50"
              >
                {role && !roleOptions.some((o) => o.value === role) && (
                  <option value={role}>{role}</option>
                )}
                {roleOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            {needsRestaurantPicker && (
              <div>
                <div className="text-[#595959] text-[15px] mb-1">Restaurant</div>
                <select
                  value={restaurantId}
                  onChange={(e) => setRestaurantId(e.target.value)}
                  className="w-full h-[44px] rounded-lg border border-[#ECECEC] bg-white px-4 text-[15px] text-[#71717A] font-semibold"
                >
                  <option value="">Choisissez un restaurant</option>
                  {restaurants.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Section mot de passe */}
            <div className="mt-3 border-t border-gray-200 pt-3">
              <button
                type="button"
                onClick={() => setShowPasswordSection(!showPasswordSection)}
                className="flex items-center justify-between w-full text-left text-[#F17922] hover:text-[#F17922]/80 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[#F17922]">🔒</span>
                  <span className="font-medium text-sm">Changer le mot de passe</span>
                </div>
                <span className={`transform transition-transform text-sm ${showPasswordSection ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>
              
              {showPasswordSection && (
                <div className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-2">
                      <label className="text-[#71717A] text-sm">Nouveau mot de passe</label>
                      <Input 
                        type="password"
                        name="password" 
                        value={passwordData.password} 
                        onChange={handlePasswordChange}
                        className="h-[40px] rounded-lg border-[#ECECEC] bg-white text-[15px] text-slate-700"
                        error={passwordErrors.password}
                        placeholder="Minimum 8 caractères"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[#71717A] text-sm">Confirmer le nouveau mot de passe</label>
                      <Input 
                        type="password"
                        name="confirmPassword" 
                        value={passwordData.confirmPassword} 
                        onChange={handlePasswordChange}
                        className="h-[40px] rounded-lg border-[#ECECEC] bg-white text-[15px] text-slate-700"
                        error={passwordErrors.confirmPassword}
                        placeholder="Retapez le nouveau mot de passe"
                      />
                    </div>
                    <Button 
                      type="button"
                      onClick={handlePasswordSubmit}
                      disabled={isLoading}
                      className="w-full bg-[#F17922] text-white hover:bg-[#F17922]/90 border-0 mt-2"
                    >
                      {isLoading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Zone dangereuse */}
            <div className="mt-4 border-t border-red-200 pt-3">
              <button
                type="button"
                onClick={() => setShowDangerZone(!showDangerZone)}
                className="flex items-center justify-between w-full text-left text-red-600 hover:text-red-700 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-red-500">⚠️</span>
                  <span className="font-medium">Zone dangereuse</span>
                </div>
                <span className={`transform transition-transform ${showDangerZone ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>
              
              {showDangerZone && (
                <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-sm text-red-700 mb-3">
                    Cette action supprimera le compte utilisateur. L&apos;action peut être annulée par un administrateur.
                  </p>
                  <Button 
                    type="button" 
                    onClick={() => setShowSoftDeleteConfirm(true)}
                    className="w-full bg-red-600 text-white hover:bg-red-700 border-0"
                    disabled={isLoading}
                  >
                    🗑️ Supprimer définitivement ce compte
                  </Button>
                </div>
              )}
            </div>
            
            <div className="flex gap-2 mt-3">
              <Button type="button" onClick={onCancel} className="flex-1 bg-[#ECECEC]">Annuler</Button>
              <Button type="submit" disabled={isLoading} className="flex-1 bg-[#F17922] text-white">{isLoading ? 'Enregistrement...' : 'Enregistrer'}</Button>
            </div>
          </div>
        </form>
        {/* DESKTOP */}
        <form onSubmit={handleSubmit} className="hidden md:block w-full min-w-[600px] flex-1 overflow-y-auto">
          <div className="px-12 pt-5"><span className="text-xs text-[#F17922] font-semibold">Informations basiques</span></div>
          <div className="flex flex-row items-center justify-between px-12 pt-3 pb-2 gap-3">
            <span className="text-[15px] text-[#71717A] font-medium">Photo de profil</span>
            <div className="flex items-center gap-3">
              <div
                className="w-[88px] h-[88px] bg-[#F4F4F5] rounded-full flex flex-col items-center justify-center
                cursor-pointer hover:bg-gray-50 transition-colors overflow-hidden"
                onClick={() => document.getElementById('edit-image-upload-desktop')?.click()}
              >
                <Image
                  src={selectedImagePreview || formatImageUrl(currentUser?.image || undefined) || "/icons/header/default-avatar.png"}
                  alt="Aperçu du membre"
                  width={88}
                  height={88}
                  className="object-cover w-full h-full rounded-full"
                  unoptimized={!currentUser?.image || currentUser?.image?.startsWith('/icons/')}
                />
                <input
                  id="edit-image-upload-desktop"
                  type="file"
                  accept="image/*"
                  className="absolute invisible"
                  onChange={handleImageChange}
                  aria-label="Changer la photo de profil (desktop)"
                />
              </div>
              <span className="text-[15px] text-[#9796A1] font-normal ml-2 cursor-pointer select-none"
              onClick={() => document.getElementById('edit-image-upload-desktop')?.click()}>Télécharger une image</span>
            </div>
            <div className="w-32" />
          </div>
          <div className="flex flex-col gap-0 px-12">
            <div className="flex flex-row items-center border-b border-[#ECECEC] h-[54px]">
              <label className="text-[#71717A] w-[160px] text-[15px] font-normal">Nom et prénom(s)</label>
              <Input name="fullname" value={formData.fullname} onChange={handleChange}
              className="h-[40px] border-none bg-transparent font-bold ml-2  text-slate-700 " style={{width:'520px'}} error={formErrors.fullname}
              />
              </div>
            <div className="flex flex-row items-center border-b border-[#ECECEC] h-[54px]">
              <label className="text-[#71717A] w-[160px] text-[15px] font-normal">E-mail</label><Input name="email" value={formData.email} onChange={handleChange}
              className="h-[40px] border-none bg-transparent font-bold ml-2 text-slate-700"
              style={{width:'520px'}} error={formErrors.email} />

            </div>

            <div className="flex flex-row items-center border-b border-[#ECECEC] h-[54px]">
              <label className="text-[#71717A] w-[160px] text-[15px] font-normal">Téléphone</label>
              <Input name="phone" value={formData.phone} onChange={handleChange}
              className="h-[40px] border-none bg-transparent font-bold ml-2  text-slate-700 "  style={{width:'520px'}}
               error={formErrors.phone} />
               </div>

            <div className="flex flex-row items-center border-b border-[#ECECEC] h-[54px]">
              <label className="text-[#71717A] w-[160px] text-[15px] font-normal">Adresse</label>
              <Input name="address" value={formData.address} onChange={handleChange}
              className="h-[40px] border-none bg-transparent font-bold ml-2 text-slate-700" style={{width:'520px'}} />
            </div>

            <div className="flex flex-row items-center border-b border-[#ECECEC] h-[54px]">
              <label className="text-[#71717A] w-[157px] text-[15px] font-normal">Rôle</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={roleOptions.length === 0}
                className="ml-2 flex-1 bg-transparent font-semibold text-slate-700 outline-none h-[40px] cursor-pointer disabled:cursor-default"
              >
                {role && !roleOptions.some((o) => o.value === role) && (
                  <option value={role}>{role}</option>
                )}
                {roleOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            {needsRestaurantPicker && (
              <div className="flex flex-row items-center border-b border-[#ECECEC] h-[54px]">
                <label className="text-[#71717A] w-[157px] text-[15px] font-normal">Restaurant</label>
                <select
                  value={restaurantId}
                  onChange={(e) => setRestaurantId(e.target.value)}
                  className="ml-2 flex-1 bg-transparent font-semibold text-slate-700 outline-none h-[40px] cursor-pointer"
                >
                  <option value="">Choisissez un restaurant</option>
                  {restaurants.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Section mot de passe pour desktop */}
            <div className="mt-6 border-t border-gray-200 pt-4">
              <button
                type="button"
                onClick={() => setShowPasswordSection(!showPasswordSection)}
                className="flex items-center justify-between w-full text-left text-[#F17922] hover:text-[#F17922]/80 transition-colors mb-4"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[#F17922]">🔒</span>
                  <span className="font-medium text-[15px]">Changer le mot de passe</span>
                </div>
                <span className={`transform transition-transform text-sm ${showPasswordSection ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>
              
              {showPasswordSection && (
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-row items-center h-[54px]">
                      <label className="text-[#71717A] w-[160px] text-[15px] font-normal">Nouveau mot de passe</label>
                      <Input 
                        type="password"
                        name="password" 
                        value={passwordData.password} 
                        onChange={handlePasswordChange}
                        className="h-[40px] border border-[#ECECEC] rounded-lg bg-white font-normal ml-2 text-slate-700"
                        style={{width:'520px'}}
                        error={passwordErrors.password}
                        placeholder="Minimum 8 caractères"
                      />
                    </div>
                    <div className="flex flex-row items-center h-[54px]">
                      <label className="text-[#71717A] w-[160px] text-[15px] font-normal">Confirmer mot de passe</label>
                      <Input 
                        type="password"
                        name="confirmPassword" 
                        value={passwordData.confirmPassword} 
                        onChange={handlePasswordChange}
                        className="h-[40px] border border-[#ECECEC] rounded-lg bg-white font-normal ml-2 text-slate-700"
                        style={{width:'520px'}}
                        error={passwordErrors.confirmPassword}
                        placeholder="Retapez le nouveau mot de passe"
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button 
                        type="button" 
                        onClick={handlePasswordSubmit}
                        disabled={isLoading}
                        className="h-[32px] cursor-pointer px-6 rounded-[10px] bg-[#F17922] hover:bg-[#F17922]/90 text-white text-[13px] min-w-[200px] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Zone dangereuse */}
            <div className="mt-6 mx-12 border-t border-red-200 pt-6">
              <button
                type="button"
                onClick={() => setShowDangerZone(!showDangerZone)}
                className="flex items-center justify-between w-full text-left text-red-600 hover:text-red-700 transition-colors mb-4"
              >
                <div className="flex items-center gap-2">
                  <span className="text-red-500">⚠️</span>
                  <span className="font-medium text-[15px]">Zone dangereuse</span>
                </div>
                <span className={`transform transition-transform text-sm ${showDangerZone ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>
              
              {showDangerZone && (
                <div className="p-4 justify-items-center bg-red-50 rounded-lg border border-red-200">
                  <p className="text-sm text-center text-red-700 mb-4">
                    ⚠️ <strong>Attention :</strong> Cette action supprimera votre compte et vous ne pourrez plus y accéder sans l&apos;aide d&apos;un administrateur.

                  </p>
                  <Button 
                    type="button" 
                    onClick={() => setShowSoftDeleteConfirm(true)}
                    className="h-[36px] items-center justify-center cursor-pointer px-6 rounded-[10px] bg-red-600 hover:bg-red-700 text-white text-[13px] font-medium border-0"
                    disabled={isLoading}
                  >
                    🗑️ Supprimer mon compte
                  </Button>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6 px-12 pb-6">
              <Button type="button" onClick={onCancel}  className="h-[32px] cursor-pointer text-[#9796A1] px-12 rounded-[10px] bg-[#ECECEC] text-[13px] items-center
              justify-center hover:bg-gray-100 min-w-[120px]">Annuler</Button>

              <Button type="submit" disabled={isLoading}   className="h-[32px] cursor-pointer px-12 rounded-[10px] bg-[#F17922] hover:bg-[#F17922]/90 text-white
              text-[13px] min-w-[230px] disabled:opacity-50 disabled:cursor-not-allowed">
                {isLoading ? 'Enregistrement...' : 'Enregistrer'}</Button>
            </div>
          </div>
        </form>
      </div>
      
      {/* Modal de confirmation pour soft delete */}
      {showSoftDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Supprimer ce compte ?
              </h3>
              
              <div className="text-left bg-red-50 p-4 rounded-lg mb-6 border-l-4 border-red-400">
                <h4 className="font-medium text-red-800 mb-2">⚠️ Cette action va :</h4>
                <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
                  <li>Désactiver l&apos;accès de l&apos;utilisateur</li>
                  <li>Marquer le compte comme supprimé</li>
                  <li>Conserver les données pour audit</li>
                </ul>
                <p className="text-xs text-red-600 mt-2 font-medium">
                  💡 Un administrateur peut annuler cette action plus tard
                </p>
              </div>
              
              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={() => setShowSoftDeleteConfirm(false)}
                  className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200 border-0"
                  disabled={isLoading}
                >
                  Non, annuler
                </Button>
                <Button
                  type="button"
                  onClick={handleSoftDelete}
                  className="flex-1 bg-red-600 text-white hover:bg-red-700 border-0"
                  disabled={isLoading}
                >
                  {isLoading ? 'Suppression...' : 'Oui, supprimer'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

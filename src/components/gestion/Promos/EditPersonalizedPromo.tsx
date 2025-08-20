"use client"

import React, { useState, useEffect } from 'react'
import {  ImageIcon } from 'lucide-react'
import { PromoCardData } from './PromoCard'
import Image from 'next/image'
import styles from './PersonalizedPromo.module.css'
import DatePicker from '../Orders/DatePicker'
import { toast } from 'react-hot-toast'
import {
  createPromotion,
  PromotionFormData,
  updatePromotionFromUnified,
  UnifiedPromoFormData,
  PromoTransitData
} from '@/services/promotionService'
import { formatPromotionImageUrl } from '@/utils/imageHelpers'
import { getHumanReadableError, getPromotionSuccessMessage, getInfoMessage } from '@/utils/errorMessages'

interface EditPersonalizedPromoProps {
  promoData?: PromoTransitData
  onSave?: (promo: PromoCardData) => void
  onCancel?: () => void
  className?: string
}

const EditPersonalizedPromo = ({ promoData, onSave, onCancel, className = '' }: EditPersonalizedPromoProps) => {
  const [formData, setFormData] = useState({
    title: 'Titre',
    target: 'Public',
    startDate: 'Sélectionnez une date',
    expirationDate: 'Sélectionnez une date',
    background_color: '#6B7280',
    text_color: '#FFFFFF',
    expiration_color: '#FFFFFF',
    cubeRotationX: -40,
    cubeRotationY: 50,
    description: 'Description'
  })

  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [uploadedImageFile, setUploadedImageFile] = useState<File | null>(null) // ✅ AJOUT DE LA VARIABLE MANQUANTE
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showExpirationDatePicker, setShowExpirationDatePicker] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  // Initialisation des données pour l'édition
  useEffect(() => {
    if (promoData) {

      setFormData(prev => ({
        ...prev,
        title: promoData.title || prev.title,
        description: promoData.description || prev.description,
        startDate: promoData.startDate || prev.startDate,
        expirationDate: promoData.expirationDate || prev.expirationDate,
        background_color: promoData.backgroundColor || prev.background_color,
        text_color: promoData.textColor || prev.text_color,
      }));

      // ✅ CORRECTION : Gérer l'image existante et réinitialiser les variables
      if (promoData.couponImageUrl) {
        const formattedUrl = formatPromotionImageUrl(promoData.couponImageUrl);
        if (isValidImageUrl(formattedUrl)) {
          setUploadedImage(formattedUrl);
          setUploadedImageFile(null); // Pas de fichier, c'est une URL existante
          setUploadedFileName(null); // Pas de nom de fichier pour une URL existante
        } else {
          setUploadedImage(null);
          setUploadedImageFile(null);
          setUploadedFileName(null);
        }
      } else {
        // Pas d'image existante, réinitialiser toutes les variables
        setUploadedImage(null);
        setUploadedImageFile(null);
        setUploadedFileName(null);
      }
    }
  }, [promoData]);

  // Helper function to validate image URL for Next.js Image component
  const isValidImageUrl = (url: string | null): boolean => {
    if (!url) return false;

    try {
      // Check if it's a data URL (base64)
      if (url.startsWith('data:')) return true;

      // Check if it's an absolute URL
      if (url.startsWith('http://') || url.startsWith('https://')) return true;

      // Check if it's a valid path starting with '/'
      if (url.startsWith('/')) return true;

      // If it's a relative path like 'image-1748482035238.jpg', it's invalid for Next.js Image
      return false;
    } catch {
      return false;
    }
  };

  const formatTitleForCard = (title: string) => {
    const words = title.split(' ')
    const lines: string[] = []
    let currentLine = ''

    for (const word of words) {
      // Si ajouter ce mot dépasse 10 caractères
      if ((currentLine + ' ' + word).trim().length > 10) {
        // Si on a déjà une ligne, on pousse la ligne actuelle
        if (currentLine.trim()) {
          lines.push(currentLine.trim())
          currentLine = word
        } else {
          // Si le mot seul dépasse 10 caractères, on le tronque
          currentLine = word.length > 10 ? word.substring(0, 10) + '...' : word
        }
      } else {
        currentLine = currentLine ? currentLine + ' ' + word : word
      }
    }

    // Ajouter la dernière ligne si elle existe
    if (currentLine.trim()) {
      lines.push(currentLine.trim())
    }

    // Limiter à 2 lignes maximum
    if (lines.length > 2) {
      lines.splice(2) // Garder seulement les 2 premières lignes
    }

    // Si la deuxième ligne dépasse 10 caractères, la tronquer avec "..."
    if (lines.length === 2 && lines[1].length > 10) {
      lines[1] = lines[1].substring(0, 10) + '...'
    }

    return lines
  }

  // Fonction pour formater la description avec limitation de caractères
  const formatDescriptionForCard = (description: string) => {
    const words = description.split(' ')
    const lines: string[] = []
    let currentLine = ''

    for (const word of words) {
      // Si ajouter ce mot dépasse 20 caractères
      if ((currentLine + ' ' + word).trim().length > 20) {
        // Si on a déjà une ligne, on pousse la ligne actuelle
        if (currentLine.trim()) {
          lines.push(currentLine.trim())
          currentLine = word
        } else {
          // Si le mot seul dépasse 20 caractères, on le tronque
          currentLine = word.length > 20 ? word.substring(0, 20) + '...' : word
        }
      } else {
        currentLine = currentLine ? currentLine + ' ' + word : word
      }
    }

    // Ajouter la dernière ligne si elle existe
    if (currentLine.trim()) {
      lines.push(currentLine.trim())
    }

    // Limiter à 2 lignes maximum
    if (lines.length > 2) {
      lines.splice(2) // Garder seulement les 2 premières lignes
    }

    // Si la deuxième ligne dépasse 20 caractères, la tronquer avec "..."
    if (lines.length === 2 && lines[1].length > 20) {
      lines[1] = lines[1].substring(0, 20) + '...'
    }

    return lines
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // ✅ VALIDATION DU FICHIER (comme dans PersonalizedPromo.tsx)
      if (!file.type.startsWith('image/')) {
        toast.error('Veuillez sélectionner une image valide');
        return;
      }

      // Vérifier la taille du fichier (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('L\'image ne doit pas dépasser 5MB');
        return;
      }

      // ✅ STOCKER LE FILE DIRECTEMENT (comme PersonalizedPromo.tsx)
      setUploadedImageFile(file);
      setUploadedFileName(file.name);

      // Créer une prévisualisation pour l'UI
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setUploadedImage(result);
      }

      reader.onerror = () => {
        toast.error('Erreur lors du chargement de l\'image');
      };

      reader.readAsDataURL(file)
    }
  }

  const handleStartDateChange = (date: Date) => {
    const formattedDate = date.toISOString().split('T')[0]
    setFormData(prev => ({ ...prev, startDate: formattedDate }))
    setShowDatePicker(false)
  }

  const handleExpirationDateChange = (date: Date) => {
    const formattedDate = date.toISOString().split('T')[0]
    setFormData(prev => ({ ...prev, expirationDate: formattedDate }))
    setShowExpirationDatePicker(false)
  }

  const getCurrentStartDate = () => {
    if (formData.startDate !== 'Sélectionnez une date' && formData.startDate.trim() !== '') {
      return new Date(formData.startDate)
    }
    return new Date()
  }

  const getCurrentExpirationDate = () => {
    if (formData.expirationDate !== 'Sélectionnez une date' && formData.expirationDate.trim() !== '') {
      return new Date(formData.expirationDate)
    }
    return new Date()
  }

  // ✅ FONCTION CORRIGÉE : Convertir promoData vers UnifiedPromoFormData
  const prepareUnifiedFormData = (): UnifiedPromoFormData => {
    // Déterminer le type de discount et la valeur basés sur promoData
    let discountType: 'percentage' | 'fixed' | 'buyXgetY' = 'percentage';
    let discountValue = 10;

    if (promoData) {
      switch (promoData.promoType) {
        case 'percentage':
          discountType = 'percentage';
          discountValue = parseFloat(promoData.percentageValue || '10') || 10;
          break;
        case 'fixed':
          discountType = 'fixed';
          discountValue = parseFloat(promoData.fixedAmountValue || '1000') || 1000;
          break;
        case 'buyXgetY':
          discountType = 'buyXgetY';
          discountValue = parseFloat(promoData.buyQuantity || '1') || 1;
          break;
        default:
          // ✅ CORRIGÉ : Utiliser le champ discountValue de PromoTransitData
          discountValue = promoData.discountValue || 10;
          break;
      }
    }

    // Déterminer le type de cible
    let targetType: 'all' | 'specific' | 'categories' = 'all';
    if (promoData?.productTarget) {
      switch (promoData.productTarget) {
        case 'specific':
          targetType = 'specific';
          break;
        case 'categories':
          targetType = 'categories';
          break;
        default:
          targetType = 'all';
          break;
      }
    }

    // ✅ CORRIGÉ : Déterminer la visibilité avec les champs de PromoTransitData
    let selectedPublicTypes = ['Public'];
    let visibility = 'public';
    let targetStandard = true;
    let targetPremium = true;
    let targetGold = true;

    if (promoData?.visibility === 'PRIVATE') {
      visibility = 'private';
      selectedPublicTypes = [];
      targetStandard = promoData.targetStandard || false;
      targetPremium = promoData.targetPremium || false;
      targetGold = promoData.targetGold || false;

      if (targetStandard) selectedPublicTypes.push('Utilisateur Standard');
      if (targetPremium) selectedPublicTypes.push('Utilisateur Premium');
      if (targetGold) selectedPublicTypes.push('Utilisateur Gold');
    }

    return {
      id: promoData?.id,
      title: formData.title,
      description: formData.description,
      discountType,
      discountValue,
      targetType,
      startDate: formData.startDate,
      expirationDate: formData.expirationDate,
      backgroundColor: formData.background_color,
      textColor: formData.text_color,
      couponImageUrl: uploadedImage || '',
      selectedPublicTypes,
      visibility,
      targetStandard,
      targetPremium,
      targetGold,
      status: 'ACTIVE',
      isActive: true,
      // ✅ PROPRIÉTÉS CORRIGÉES - Plus de type assertions dangereuses
      percentageValue: promoData?.percentageValue || '',
      fixedAmountValue: promoData?.fixedAmountValue || '',
      productTarget: promoData?.productTarget || 'all',
      selectedRestaurants: promoData?.selectedRestaurants || [],
      maxUsagePerClient: promoData?.maxUsagePerClient || '',
      // Champs optionnels de promoData
      selectedMenus: promoData?.selectedMenus || [],
      selectedCategories: promoData?.selectedCategories || [],
      selectedRewardMenus: promoData?.selectedRewardMenus || [],
      buyQuantity: promoData?.buyQuantity || '',
      getQuantity: promoData?.getQuantity || '',
      discountCeiling: promoData?.discountCeiling || '',
      minOrderAmount: promoData?.minOrderAmount || '',
      maxTotalUsage: promoData?.maxTotalUsage || ''
    };
  }

  const preparePromotionFormData = (): PromotionFormData => {
    // Déterminer le type de discount et la valeur basés sur promoData
    let discountType: 'percentage' | 'fixed' | 'buyXgetY' = 'percentage';
    let discountValue = 10; // Default value

    if (promoData) {
      let tempDiscountValueStr: string | undefined;
      let defaultDiscountValueForType = 10;

      switch (promoData.promoType) {
        case 'percentage':
          discountType = 'percentage';
          tempDiscountValueStr = promoData.percentageValue;
          defaultDiscountValueForType = 10;
          break;
        case 'fixed':
          discountType = 'fixed';
          tempDiscountValueStr = promoData.fixedAmountValue;
          defaultDiscountValueForType = 1000;
          break;
        case 'buyXgetY':
          discountType = 'buyXgetY';
          tempDiscountValueStr = promoData.buyQuantity;
          defaultDiscountValueForType = 1;
          break;
        default:
          // ✅ CORRIGÉ : Utiliser le champ discountValue de PromoTransitData
          if (typeof promoData.discountValue === 'number' && !isNaN(promoData.discountValue)) {
            discountValue = promoData.discountValue;
          } else {
            // Si promoData.discountValue n'est pas un nombre valide, utiliser la valeur par défaut
            discountValue = 10;
          }
          // Marquer comme traité pour éviter le parsing supplémentaire
          tempDiscountValueStr = undefined;
          break;
      }

      // This block will only execute if tempDiscountValueStr was set in the switch (i.e., not the default case that directly assigned discountValue)
      if (tempDiscountValueStr !== undefined) {
        if (String(tempDiscountValueStr).trim() !== '') {
          const parsedVal = parseFloat(String(tempDiscountValueStr));
          if (!isNaN(parsedVal)) {
            discountValue = parsedVal;
          } else {
            // If parsing results in NaN (e.g., from "   " or non-numeric string)
            discountValue = defaultDiscountValueForType;
          }
        } else {
          // If tempDiscountValueStr is an empty string or undefined (and not handled by switch's default)
          discountValue = defaultDiscountValueForType;
        }
      }
    } else {
      // If !promoData, use the general default discountValue initialized at the start
      // discountValue remains 10 (or whatever it was initialized to)
    }

    // Déterminer le type de cible
    let targetType: 'all' | 'specific' | 'categories' = 'all'
    let targetedDishIds: string[] = []

    if (promoData?.productTarget) {
      switch (promoData.productTarget) {
        case 'all':
          targetType = 'all'
          break
        case 'specific':
          targetType = 'specific'
          targetedDishIds = promoData.selectedMenus || []
          break
        case 'categories':
          targetType = 'categories'
          targetedDishIds = promoData.selectedCategories || []
          break
      }
    }

    // ✅ CORRIGÉ : Construire l'objet PromotionFormData complet
    const promotionFormData: PromotionFormData = {
      title: formData.title,
      description: formData.description,
      discountType: discountType,
      discountValue: discountValue,
      targetType: targetType,
      startDate: formData.startDate,
      expirationDate: formData.expirationDate,
      targetedDishIds: targetedDishIds,
      isActive: true,

      // ✅ CHAMPS MANQUANTS AJOUTÉS
      id: promoData?.id,
      maxUsagePerUser: parseFloat(promoData?.maxUsagePerClient || '0') || undefined,
      maxTotalUsage: parseFloat(promoData?.maxTotalUsage || '0') || undefined,
      minOrderAmount: parseFloat(promoData?.minOrderAmount || '0') || undefined,
      maxDiscountAmount: parseFloat(promoData?.discountCeiling || '0') || undefined,

      // Visibilité et ciblage
      visibility: promoData?.visibility,
      targetStandard: promoData?.targetStandard,
      targetPremium: promoData?.targetPremium,
      targetGold: promoData?.targetGold,

      // Champs visuels
      backgroundColor: formData.background_color,
      textColor: formData.text_color,

      // ✅ GESTION DE L'IMAGE : File ou URL
      couponImageFile: uploadedImageFile || undefined,
      couponImageUrl: !uploadedImageFile ? (uploadedImage || undefined) : undefined,

      // Métadonnées
      currentUsage: promoData?.currentUsage,
      status: promoData?.status,
      createdAt: promoData?.createdAt,
      updatedAt: promoData?.updatedAt,
      createdById: promoData?.createdById
    }

    // Ajouter les données optionnelles
    if (promoData?.selectedRewardMenus) {
      promotionFormData.offeredDishes = promoData.selectedRewardMenus.map(menuId => ({
        dishId: menuId,
        quantity: 1 // Default quantity to 1, adjust if needed
      }))
    }

    if (promoData?.buyQuantity && String(promoData.buyQuantity).trim() !== '') {
      const parsedBuyQuantity = parseFloat(String(promoData.buyQuantity));
      if (!isNaN(parsedBuyQuantity)) {
        promotionFormData.buyQuantity = parsedBuyQuantity;
      }
    }

    if (promoData?.getQuantity && String(promoData.getQuantity).trim() !== '') {
      const parsedGetQuantity = parseFloat(String(promoData.getQuantity));
      if (!isNaN(parsedGetQuantity)) {
        promotionFormData.getQuantity = parsedGetQuantity;
      }
    }

    if (promoData?.discountCeiling && String(promoData.discountCeiling).trim() !== '') {
      const parsedMaxDiscount = parseFloat(String(promoData.discountCeiling));
      if (!isNaN(parsedMaxDiscount)) {
        promotionFormData.maxDiscount = parsedMaxDiscount;
      }
    }

    if (promoData?.minOrderAmount && String(promoData.minOrderAmount).trim() !== '') {
      const parsedMinOrderValue = parseFloat(String(promoData.minOrderAmount));
      if (!isNaN(parsedMinOrderValue)) {
        promotionFormData.minOrderValue = parsedMinOrderValue;
      }
    }

    if (promoData?.maxTotalUsage && String(promoData.maxTotalUsage).trim() !== '') {
      const parsedUsageLimit = parseFloat(String(promoData.maxTotalUsage));
      if (!isNaN(parsedUsageLimit)) {
        promotionFormData.usageLimit = parsedUsageLimit;
      }
    }

    return promotionFormData
  }

  const handleSubmit = async () => {
    if (isSubmitting) return

    try {
      setIsSubmitting(true)
      setErrors([])

      // Validation des champs obligatoires
      const validationErrors: string[] = []

      if (!formData.title || formData.title.trim() === '' || formData.title === 'Titre') {
        validationErrors.push('Le titre est requis')
      }

      if (formData.startDate === 'Sélectionnez une date') {
        validationErrors.push('La date de début est requise')
      }

      if (formData.expirationDate === 'Sélectionnez une date') {
        validationErrors.push('La date de fin est requise')
      }

      if (validationErrors.length > 0) {
        setErrors(validationErrors)
        toast.error('Veuillez corriger les erreurs dans le formulaire')
        return
      }

      // ✅ PRÉPARER LES DONNÉES UNIFIÉES (comme PersonalizedPromo.tsx)
      const unifiedData = prepareUnifiedFormData()

      // Toast de chargement
      toast.loading(getInfoMessage('saving'));

      // ✅ UTILISER LA NOUVELLE FONCTION UNIFIÉE (comme PersonalizedPromo.tsx)
      let backendResponse;
      if (promoData?.id) {
        // Mode modification - utiliser updatePromotionFromUnified
        backendResponse = await updatePromotionFromUnified(
          promoData.id,
          unifiedData,
          uploadedImageFile,
          'ACTIVE'
        );
      } else {
        // Mode création (ne devrait pas arriver dans EditPersonalizedPromo, mais garde pour sécurité)
        backendResponse = await createPromotion(preparePromotionFormData())
      }



      // Créer l'objet pour l'interface utilisateur basé sur la réponse backend
      const newPromo: PromoCardData = {
        id: backendResponse.id || promoData?.id || Date.now().toString(),
        title: backendResponse.title || formData.title,
        discount: promoData?.discountType || '10%',
        description: backendResponse.description || formData.description,
        background: backendResponse.background_color || formData.background_color,
        textColor: backendResponse.text_color || formData.text_color,
        caracter: backendResponse.text_color || formData.text_color,
        type: 'percentage',
        status: (backendResponse.status === 'ACTIVE' ? 'active' : 'expired') as 'active' | 'expired' | 'upcoming',
        validUntil: backendResponse.expiration_date || formData.expirationDate
      }

      toast.success(getPromotionSuccessMessage('update'))

      if (onSave) {
        onSave(newPromo)
      }
    } catch (error) {
      console.error('❌ [EditPersonalizedPromo] Erreur lors de la modification:', error)
      const userMessage = getHumanReadableError(error);
      toast.error(userMessage);
    } finally {
      setIsSubmitting(false)
    }
  }
  return (
    <div className={`bg-white rounded-xl text-gray-900 ${className}`}>
      <div className="  p-6">
        {/* Section gauche - Prévisualisation */}
        <div>


          {/* Prévisualisation de la carte */}
          <div className="relative flex gap-6 items-center  ">
         <div className='flex w-110 lg:flex-row items-center lg:justify-between'>
          {/* Using CSS custom properties for dynamic styling */}
             <div
              className={`w-full h-max-width xl:h-58 lg:h-50 md:h-45 sm:h-50 xs:h-45  rounded-3xl p-6 relative overflow-hidden border-6 ${styles.promoCard}`}
              ref={(el) => {
                if (el) {
                  el.style.setProperty('--card-background-color', formData.background_color);
                  el.style.setProperty('--card-border-color', formData.text_color);
                  el.style.setProperty('--cube-face-forward-color', `${formData.text_color}40`);
                  el.style.setProperty('--cube-face-top-color', `${formData.text_color}50`);
                  el.style.setProperty('--cube-face-left-color', `${formData.text_color}30`);
                  el.style.setProperty('--cube-face-bottom-color', `${formData.text_color}15`);
                  el.style.setProperty('--circle-background-color', formData.text_color);
                  el.style.setProperty('--discount-text-color', formData.text_color);
                  el.style.setProperty('--expiration-text-color', formData.expiration_color);
                  el.style.setProperty('--cube-rotation-x', `${formData.cubeRotationX}deg`);
                  el.style.setProperty('--cube-rotation-y', `${formData.cubeRotationY}deg`);
                }
              }}
            >
              {/* Cube 3D complet */}
              <div className={styles.cubeContainer}>
                {/* Face avant du cube */}
                <div className={styles.cubeFaceForward} />

                {/* Face du dessus du cube */}
                <div className={styles.cubeFaceTop} />

                {/* Face gauche du cube */}
                <div className={styles.cubeFaceLeft} />

                {/* Face du dessous du cube */}
                <div className={styles.cubeFaceBottom} />
              </div>


              {/* Badge "Cible" en haut à droite */}
              <div className="absolute top-4 right-4 z-10">
                <div className="bg-white rounded-xl lg:px-2 md:px-1 sm:px-2 sm:py-2 2xl:px-6 xl:px-4 2xl:py-1.5 py-[1px] px-1       xl:py-[1px] shadow-sm">
                  <span className="text-orange-400 2xl:text-sm lg:text-[10px] text-xs font-medium">{formData.target}</span>
                </div>
              </div>

              {/* Contenu texte en position absolue */}
              <div className="relative z-10">
                {/* Section du titre*/}
                <div className="mb-4">
                  <div
                    className={`2xl:text-[58px] xl:text-5xl lg:text-4xl md:text-3xl sm:text-3xl xs:text-2xl font-blocklyn-grunge font-black leading-none ${styles.discountText} ${styles.formattedTitle}`}
                  >
                    {formData.title !== 'Titre' && formData.title.trim() !== '' ? (
                      formatTitleForCard(formData.title).map((line, index) => (
                        <div key={index} className={styles.formattedLine}>{line}</div>
                      ))
                    ) : (
                      promoData?.discountType?.split(' ')[0] || '10%'
                    )}
                  </div>
                  <div
                    className={`2xl:text-[18px] xl:text-lg lg:text-[20px] font-blocklyn-grunge tracking-wider mt-2 ${styles.discountSubtext} ${styles.formattedDescription}`}
                  >
                    {formData.description !== 'Description' && formData.description.trim() !== '' ? (
                      formatDescriptionForCard(formData.description).map((line, index) => (
                        <div key={index} className={styles.formattedLine}>{line}</div>
                      ))
                    ) : (
                      'DE RÉDUCTION ----------'
                    )}
                  </div>
                </div>

                {/* Section expiration en bas */}
                <div className="absolute 2xl:top-34 xl:top-34 lg:top-28 md:top-22 sm:top-26 xs:top-10 top-8 left-0">
                  <div
                    className={`text-lg 2xl:mt-8 mt-6 z-99 md:text-sm sm:text-xs font-medium ${styles.expirationText}`}
                  >
                    {formData.expirationDate !== 'Sélectionnez une date' && formData.expirationDate.trim() !== ''
                      ? `Expire le ${new Date(formData.expirationDate).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}`
                      : 'Expire --'
                    }
                  </div>
                </div>
              </div>


              {/* Rectangle pour l'image - couvre la partie droite et bas gauche */}
              <div
                className="absolute top-8 sm:top-10 md:top-12 lg:top-8 xl:top-12 2xl:top-10 -right-4 sm:-right-6 md:-right-8 lg:-right-10 xl:-right-14 2xl:-right-20 -bottom-16 sm:-bottom-18 md:-bottom-20 lg:-bottom-22 xl:-bottom-24 2xl:-bottom-28 w-32 sm:w-36 md:w-40 lg:w-44 xl:w-48 2xl:w-56 overflow-hidden"

              >
                {uploadedImage && (
                  <Image
                    src={uploadedImage.startsWith('data:') ? uploadedImage : formatPromotionImageUrl(uploadedImage)}
                    alt="Promo"
                    className=" 2xl:w-[70%] 2xl:h-[70%] xl:h-[70%] xl:mt-4 xl:w-[100%] lg:w-[100%] mt-6 lg:h-[90%] md:h-[90%] sm:h-[70%] xs:h-[90%] md:-mt-4 sm:-mb-4 w-full h-full object-contain "
                    width={100}
                    height={100}
                    onError={() => {
                      setUploadedImage(null);
                    }}
                  />
                )}
              </div>

              {/* Masques circulaires - positionnés plus haut */}
              {/* Cercle gauche */}
              <div className={styles.circleLeft}></div>

              {/* Cercle droit */}
              <div className={styles.circleRight}></div>
            </div>
          </div>

            {/* Texte d'aperçu à droite */}
            <div className="hidden lg:block">
              <div className="text-gray-500 2xl:text-lg text-xs font-medium whitespace-nowrap">
                Aperçu du coupon sur<br />
                l&apos;application
              </div>
            </div>
          </div>
        </div>

        {/* Section - Formulaire */}
        <div className="space-y-8 grid grid-cols-1 lg:grid-cols-2 gap-26 mt-16">

          {/* Partie Gauche */}
       <div className='space-y-6'>
           {/* Upload d'image */}
          <div>
            <h4 className="text-md font-medium text-[#F17922] mb-2">Image</h4>
            <div className={`border-2 flex border-gray-300 rounded-2xl p-3 text-center hover:border-gray-400 transition-colors ${uploadedImage ? 'border-green-400 bg-green-50' : ''}`}>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label className="flex-1 cursor-pointer" htmlFor="image-upload">
                <div className="flex items-center mx-auto gap-2">
                  <ImageIcon className={`w-6 h-8 ${uploadedImage ? 'text-green-600' : 'text-gray-500'}`} />
                  <div className="text-left">
                    {uploadedImage && uploadedFileName ? (
                      <>
                        <p className="text-md text-green-700 font-medium">✅ Image uploadée</p>
                        <p className="text-sm text-green-600">{uploadedFileName}</p>
                        <p className="text-xs text-gray-500">Cliquez pour changer</p>
                      </>
                    ) : (
                      <p className="text-md text-gray-600">
                        Déposer une image ici (1080 x 1080px ou 2000 x 2000 px en format .jpg ou .png)
                      </p>
                    )}
                  </div>
                </div>
              </label>
            </div>
          </div>
          {/* Titre */}
          <div>
            <label htmlFor="promo-title" className="block text-md font-medium text-[#F17922] mb-2">Titre</label>
            <input
              id="promo-title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 border-2 flex border-gray-300 rounded-2xl p-3 text-gray-900 bg-white hover:border-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
            />
          </div>
                    {/* Description */}
             <div>
            <label htmlFor="promo-description" className="block text-md font-medium text-[#F17922] mb-2">Description</label>
            <input
              id="promo-description"
              type="text"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full  h-20 px-3 border-2 flex border-gray-300 rounded-2xl p-3 text-gray-900 bg-white hover:border-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
            />
          </div>

                {/* Date de début */}
          <div className="relative">
            <label className="block text-md font-medium text-[#F17922] mb-2">Date de début</label>
            <button
              type="button"
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="w-full px-3 py-3  border-2 border-gray-300 rounded-2xl text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <span className={formData.startDate !== 'Sélectionnez une date' ? 'text-gray-900 text-center' : 'text-center text-gray-500'}>
                {formData.startDate !== 'Sélectionnez une date' && formData.startDate.trim() !== ''
                  ? new Date(formData.startDate).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })
                  : 'Sélectionnez une date'
                }
              </span>

            </button>

            {showDatePicker && (
              <DatePicker
                selectedDate={getCurrentStartDate()}
                onChange={handleStartDateChange}
                onClose={() => setShowDatePicker(false)}
              />
            )}
          </div>


           {/* Date d'expiration */}
          <div className="relative">
            <label className="block text-md font-medium text-[#F17922] mb-2">Date d&apos;expiration</label>
            <button
              type="button"
              onClick={() => setShowExpirationDatePicker(!showExpirationDatePicker)}
              className="w-full px-3 py-3  border-2 border-gray-300 rounded-2xl text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <span className={formData.expirationDate !== 'Sélectionnez une date' ? 'text-gray-900 text-center' : 'text-center text-gray-500'}>
                {formData.expirationDate !== 'Sélectionnez une date' && formData.expirationDate.trim() !== ''
                  ? new Date(formData.expirationDate).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })
                  : 'Sélectionnez une date'
                }
              </span>

            </button>

            {showExpirationDatePicker && (
              <DatePicker
                selectedDate={getCurrentExpirationDate()}
                onChange={handleExpirationDateChange}
                onClose={() => setShowExpirationDatePicker(false)}
              />
            )}
          </div>


     </div>

       <div className=' '>




          {/* Couleurs */}
          <div >
            <label className="block text-sm font-medium text-[#F17922] mb-4">Couleurs</label>
            <div className="space-y-3">
              <div className="flex items-center justify-between border-2 border-gray-300 rounded-2xl p-3  hover:border-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent">
                <label htmlFor="text-color" className="text-sm text-gray-600 ">Couleur du texte</label>
                <div className="flex items-center space-x-2  ">
                  <div className={styles.colorPickerWrapper}>
                    <input
                      id="text-color"
                      type="color"
                      value={formData.text_color}
                      onChange={(e) => setFormData(prev => ({ ...prev, text_color: e.target.value }))}
                      className={styles.colorPickerInput}
                      aria-label="Couleur du texte (titre et description)"
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between border-2  border-gray-300 rounded-2xl p-3  hover:border-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent">
                <label htmlFor="background-color" className="text-sm text-gray-600">Arrière plan</label>
                <div className="flex items-center space-x-2">
                  <div className={styles.colorPickerWrapper}>
                    <input
                      id="background-color"
                      type="color"
                      value={formData.background_color}
                      onChange={(e) => setFormData(prev => ({ ...prev, background_color: e.target.value }))}
                      className={styles.colorPickerInput}
                      aria-label="Couleur de l'arrière-plan"
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between border-2  border-gray-300 rounded-2xl p-3  hover:border-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent">
                <label htmlFor="expiration-color" className="text-sm text-gray-600">Couleur expiration</label>
                <div className="flex items-center space-x-2">
                  <div className={styles.colorPickerWrapper}>
                    <input
                      id="expiration-color"
                      type="color"
                      value={formData.expiration_color}
                      onChange={(e) => setFormData(prev => ({ ...prev, expiration_color: e.target.value }))}
                      className={styles.colorPickerInput}
                      aria-label="Couleur du texte d'expiration"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

       </div>

        </div>

        {/* Affichage des erreurs */}
        {errors.length > 0 && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="text-red-800 font-medium mb-2">Erreurs à corriger :</h4>
            <ul className="text-red-700 text-sm space-y-1">
              {errors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}

          {/* Boutons d'action */}
          <div className="flex justify-end space-x-4 pt-6">
            <button
              type="button"
              onClick={onCancel}
              className="  px-6 py-3 bg-gray-200 text-gray-500 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Enregistrer comme brouillon
            </button>
                <button
              type="button"
              onClick={onCancel}
              className=" w-70 px-6 py-3 bg-gray-200 text-gray-500 rounded-lg hover:bg-gray-400 transition-colors font-medium"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-70  px-6 py-3 bg-gradient-to-r from-[#F17922] to-[#FA6345] text-white rounded-lg hover:opacity-90 transition-opacity font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Enregistrement...' : (promoData?.id ? 'Modifier' : 'Enregistrer')}
            </button>
          </div>
      </div>
    </div>
  )
}

export default EditPersonalizedPromo

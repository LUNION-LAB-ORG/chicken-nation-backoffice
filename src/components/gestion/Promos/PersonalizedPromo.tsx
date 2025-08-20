"use client"

import React, { useState, useEffect } from 'react'
import {  ImageIcon } from 'lucide-react'
import { PromoCardData } from './PromoCard'
import Image from 'next/image'
import styles from './PersonalizedPromo.module.css'
import DatePicker from '../Orders/DatePicker'
import { toast } from 'react-hot-toast'
import {
  createPromotionFromUnified,
  updatePromotionFromUnified,
  UnifiedPromoFormData,
  PromoTransitData,
  createEmptyUnifiedFormData,
  convertTransitDataToUnifiedFormData,
  validateCompletePromoData
} from '@/services/promotionService'
import { formatPromotionImageUrl } from '@/utils/imageHelpers'
import { getHumanReadableError, getPromotionSuccessMessage, getInfoMessage } from '@/utils/errorMessages'

interface PersonalizedPromoProps {
  promoData?: PromoTransitData
  onSave?: (promo: PromoCardData) => void
  onCancel?: () => void
  className?: string
}

const PersonalizedPromo = ({ promoData, onSave, onCancel, className = '' }: PersonalizedPromoProps) => {
  // ✅ ÉTAT UNIFIÉ - Remplace formData et autres états séparés
  const [unifiedFormData, setUnifiedFormData] = useState<UnifiedPromoFormData>(createEmptyUnifiedFormData())

  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [uploadedImageFile, setUploadedImageFile] = useState<File | null>(null)
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showExpirationDatePicker, setShowExpirationDatePicker] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  // ✅ FONCTIONS HELPER POUR ACCÉDER AUX DONNÉES UNIFIÉES
  const updateFormData = (updates: Partial<UnifiedPromoFormData>) => {
    setUnifiedFormData(prev => ({ ...prev, ...updates }))
  }

  // ✅ CORRECTION CRITIQUE : Calculer la cible dynamiquement depuis selectedPublicTypes
  const calculateTarget = () => {
    if (!unifiedFormData.selectedPublicTypes || unifiedFormData.selectedPublicTypes.length === 0) {
      return 'Public'; // Par défaut
    }

    if (unifiedFormData.selectedPublicTypes.includes('Public')) {
      return 'Public';
    }

    // Si c'est privé, afficher les types sélectionnés
    const privateTypes = unifiedFormData.selectedPublicTypes.filter(type =>
      ['Utilisateur Standard', 'Utilisateur Premium', 'Utilisateur Gold'].includes(type)
    );

    if (privateTypes.length === 0) {
      return 'Public'; // Fallback
    }

    if (privateTypes.length === 1) {
      return privateTypes[0].replace('Utilisateur ', '');
    }

    return `Privé (${privateTypes.length} types)`;
  };

  // Getters pour compatibilité avec l'UI existante
  const formData = {
    title: unifiedFormData.title || 'Titre',
    target: calculateTarget(),
    startDate: unifiedFormData.startDate || 'Sélectionnez une date',
    expirationDate: unifiedFormData.expirationDate || 'Sélectionnez une date',
    background_color: unifiedFormData.backgroundColor || '#6B7280',
    text_color: unifiedFormData.textColor || '#FFFFFF',
    expiration_color: '#FFFFFF',
    cubeRotationX: -40,
    cubeRotationY: 50,
    description: unifiedFormData.description || 'Description'
  }

  const setFormData = (updater: (prev: Record<string, unknown>) => Record<string, unknown>) => {
    const newData = updater(formData)
    updateFormData({
      title: typeof newData.title === 'string' ? newData.title : undefined,
      description: typeof newData.description === 'string' ? newData.description : undefined,
      startDate: typeof newData.startDate === 'string' ? newData.startDate : undefined,
      expirationDate: typeof newData.expirationDate === 'string' ? newData.expirationDate : undefined,
      backgroundColor: typeof newData.background_color === 'string' ? newData.background_color : undefined,
      textColor: typeof newData.text_color === 'string' ? newData.text_color : undefined
    })
  }

  // ✅ INITIALISATION SIMPLIFIÉE - Utilise les fonctions de mapping unifiées
  useEffect(() => {
    if (promoData) {
      try {
        // Convertir PromoTransitData vers UnifiedPromoFormData
        const mappedData = convertTransitDataToUnifiedFormData(promoData);

        // Appliquer les données mappées
        setUnifiedFormData(mappedData);

        // Gérer l'image uploadée
        if (promoData.couponImageUrl) {
          setUploadedImage(promoData.couponImageUrl);
        }

      } catch (error) {
        console.error('Erreur lors du mapping:', error);
        // En cas d'erreur, garder les données par défaut
      }
    }
  }, [promoData]);
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
      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
        toast.error('Veuillez sélectionner une image valide');
        return;
      }

      // Vérifier la taille du fichier (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('L\'image ne doit pas dépasser 5MB');
        return;
      }

      // ✅ STOCKER LE FILE DIRECTEMENT (comme les autres services)
      setUploadedImageFile(file);
      setUploadedFileName(file.name);

      // Créer une prévisualisation pour l'UI
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setUploadedImage(result);
      }

      reader.onerror = (error) => {
        console.error('Erreur lors de la lecture du fichier:', error);
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

  // ✅ FONCTION DE PRÉPARATION DIRECTE - Utilise directement les données unifiées
  const prepareUnifiedFormData = (): UnifiedPromoFormData => {
    try {
      // Mettre à jour les données unifiées avec l'image uploadée
      const finalUnifiedData = {
        ...unifiedFormData,
        couponImageUrl: uploadedImage || unifiedFormData.couponImageUrl || ''
      };

      return finalUnifiedData;

    } catch {

      // Fallback vers une structure minimale en cas d'erreur
      return {
        ...unifiedFormData,
        title: formData.title || 'Titre par défaut',
        description: formData.description || 'Description par défaut',
        discountType: 'percentage',
        discountValue: 10,
        targetType: 'all',
        startDate: formData.startDate,
        expirationDate: formData.expirationDate,
        backgroundColor: formData.background_color,
        textColor: formData.text_color,
        couponImageUrl: uploadedImage || ''
      };
    }
  }

  // ✅ FONCTION DE SOUMISSION AMÉLIORÉE - Gère création ET édition avec statuts
  const handleSubmit = async (targetStatus: 'ACTIVE' | 'DRAFT' = 'ACTIVE') => {
    if (isSubmitting) return

    try {
      setIsSubmitting(true)
      setErrors([])

      // Mettre à jour les données unifiées avec l'image uploadée
      const finalUnifiedData = {
        ...unifiedFormData,
        couponImageUrl: uploadedImage || unifiedFormData.couponImageUrl || '',
        status: targetStatus,
        isActive: targetStatus === 'ACTIVE'
      };

      // Toast de chargement
      toast.loading(getInfoMessage('saving'));

      // ✅ VALIDATION COMPLÈTE - Utilise la fonction de validation unifiée
      const validation = validateCompletePromoData(finalUnifiedData);
      if (!validation.isValid) {
        setErrors(validation.errors);
        toast.error('Veuillez corriger les erreurs dans le formulaire');
        return;
      }

      // Préparer les données unifiées pour l'API
      const unifiedPromotionData = prepareUnifiedFormData()

      // Déterminer si c'est une création ou une édition
      const isEditing = !!(promoData?.id || finalUnifiedData.id);



      // ✅ GESTION CRÉATION VS ÉDITION avec nouvelles fonctions unifiées
      let backendResponse;
      if (isEditing) {
        // Mode édition - utiliser updatePromotionFromUnified
        const promoId = promoData?.id || finalUnifiedData.id;
        if (!promoId) {
          throw new Error('ID de promotion manquant pour la mise à jour');
        }

        backendResponse = await updatePromotionFromUnified(
          promoId,
          unifiedPromotionData,
          uploadedImageFile,
          targetStatus
        );
      } else {
        // Mode création - utiliser createPromotionFromUnified
        backendResponse = await createPromotionFromUnified(
          unifiedPromotionData,
          uploadedImageFile,
          targetStatus
        );
      }

      // Créer l'objet pour l'interface utilisateur basé sur la réponse backend
      const discountDisplay = finalUnifiedData.discountType === 'percentage'
        ? `${finalUnifiedData.percentageValue}%`
        : finalUnifiedData.discountType === 'fixed'
        ? `${finalUnifiedData.fixedAmountValue}€`
        : `${finalUnifiedData.buyQuantity} + ${finalUnifiedData.getQuantity}`;

      // ✅ GESTION DES STATUTS DANS L'UI
      let uiStatus: 'active' | 'expired' | 'upcoming' = 'active';
      if (backendResponse.status === 'DRAFT') {
        uiStatus = 'upcoming'; // Les brouillons sont affichés comme "à venir"
      } else if (backendResponse.status === 'ACTIVE') {
        // Vérifier les dates pour déterminer le statut réel
        const now = new Date();
        const startDate = new Date(backendResponse.start_date);
        const endDate = new Date(backendResponse.expiration_date);

        if (now < startDate) {
          uiStatus = 'upcoming';
        } else if (now > endDate) {
          uiStatus = 'expired';
        } else {
          uiStatus = 'active';
        }
      } else {
        uiStatus = 'expired'; // Autres statuts considérés comme expirés
      }

      const newPromo: PromoCardData = {
        id: backendResponse.id || Date.now().toString(),
        title: backendResponse.title || finalUnifiedData.title,
        discount: discountDisplay,
        description: backendResponse.description || finalUnifiedData.description,
        background: backendResponse.background_color || finalUnifiedData.backgroundColor,
        textColor: backendResponse.text_color || finalUnifiedData.textColor,
        caracter: backendResponse.text_color || finalUnifiedData.textColor,
        type: finalUnifiedData.discountType === 'buyXgetY' ? 'percentage' : finalUnifiedData.discountType,
        status: uiStatus,
        validUntil: backendResponse.expiration_date || finalUnifiedData.expirationDate
      }

      // ✅ MESSAGES DE SUCCÈS SELON LE CONTEXTE
      if (isEditing) {
        if (targetStatus === 'DRAFT') {
          toast.success(getPromotionSuccessMessage('draft'));
        } else {
          toast.success(getPromotionSuccessMessage('update'));
        }
      } else {
        if (targetStatus === 'DRAFT') {
          toast.success(getPromotionSuccessMessage('draft'));
        } else {
          toast.success(getPromotionSuccessMessage('create'));
        }
      }

      if (onSave) {
        onSave(newPromo)
      }
    } catch (error) {
      console.error('❌ [PersonalizedPromo] Erreur lors de la gestion:', error);
      const userMessage = getHumanReadableError(error);
      setErrors([userMessage]);
      toast.error(userMessage);
    } finally {
      setIsSubmitting(false)
    }
  }

  // ✅ FONCTIONS SPÉCIALISÉES POUR CHAQUE ACTION
  const handleSaveAsActive = () => handleSubmit('ACTIVE');
  const handleSaveAsDraft = () => handleSubmit('DRAFT');

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
                    className={`2xl:text-[18px] xl:text-lg lg:text-20px]  font-blocklyn-grunge tracking-wider mt-2 ${styles.discountSubtext} ${styles.formattedDescription}`}
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
                <div className="absolute 2xl:top-34 xl:top-34 lg:top-28 md:top-22 sm:top-26 xs:top-10 top- left-0">
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
              onClick={handleSaveAsDraft}
              disabled={isSubmitting}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Sauvegarde...' : 'Enregistrer comme brouillon'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="w-70 px-6 py-3 bg-gray-200 text-gray-500 rounded-lg hover:bg-gray-400 transition-colors font-medium"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSaveAsActive}
              disabled={isSubmitting}
              className="w-70 px-6 py-3 bg-gradient-to-r from-[#F17922] to-[#FA6345] text-white rounded-lg hover:opacity-90 transition-opacity font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
      </div>
    </div>
  )
}

export default PersonalizedPromo

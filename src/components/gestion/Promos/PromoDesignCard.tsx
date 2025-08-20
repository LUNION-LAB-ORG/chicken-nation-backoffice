"use client"

import React, { useState } from 'react'
// import { Upload } from 'lucide-react'
import { PromoCardData } from './PromoCard'
import Image from 'next/image'
// import { formatImageUrl } from '@/utils/imageHelpers'

interface PersonalizedPromoProps {
  promoData?: { discountType: string }
  onSave?: (promo: PromoCardData) => void
  onCancel?: () => void
  className?: string
}

const PromoDesignCard = ({ promoData, onSave /* onCancel */, className = '' }: PersonalizedPromoProps) => {
  const [formData /* setFormData */] = useState({
    title: 'Titre',
    target: 'Public',
    expirationDate: 'Sélectionnez une date',
    backgroundColor: '#6B7280',
    textColor: '#FFFFFF',
    titleColor: '#FFFFFF',
    targetColor: '#FFFFFF',
    cubeRotationX: -40,
    cubeRotationY: 50
  })

  const [uploadedImage, setUploadedImage] = useState<string | null>(null)

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }
  // Commented out unused function
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _handleImageUpload = handleImageUpload;

  const handleSubmit = () => {
    if (onSave) {
      const newPromo: PromoCardData = {
        id: Date.now().toString(),
        title: formData.title,
        discount: promoData?.discountType || '10%',
        description: formData.target,
        background: formData.backgroundColor,
        textColor: formData.textColor,
        type: 'percentage',
        status: 'active',
        validUntil: formData.expirationDate
      }
      onSave(newPromo)
    }
  }
  // Commented out unused function
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _handleSubmit = handleSubmit;

  return (
    <div className={`bg-white rounded-xl ${className}`}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6">
        {/* Section gauche - Prévisualisation */}
        <div>
          <h3 className="text-2xl font-medium text-orange-500 mb-6">Personnaliser le thème du coupon</h3>

          {/* Prévisualisation de la carte */}
          <div className="relative flex gap-6 items-center  ">
         <div className='flex w-110 lg:flex-row items-center lg:justify-between'>

             <div
              className="w-full h-max-width   xl:h-46 rounded-3xl p-6 relative overflow-hidden border-6"
              style={{
                backgroundColor: formData.backgroundColor,
                borderColor: formData.textColor
              }}
            >
              {/* Cube 3D complet */}
              <div
                className='absolute -left-[50%] top-[180px] xs:-left-[60%] xs:top-[190px] sm:-left-[30%] sm:top-[160px] md:-left-30 md:top-[160px] lg:-left-63 lg:top-[180px] xl:-left-50 xl:top-[190px] 2xl:-left-35 2xl:top-[200px] w-0 h-0'
                style={{
                  transformStyle: 'preserve-3d',
                  transform: `rotateX(${formData.cubeRotationX}deg) rotateY(${formData.cubeRotationY}deg)`,
                }}
              >
                {/* Face avant du cube */}
                <div
                  className='absolute w-100 h-100  '
                  style={{
                    backgroundColor: `${formData.textColor}40`,
                    transform: 'translateZ(160px)'
                  }}
                />

            

                {/* Face du dessus du cube */}
                <div
                  className='absolute w-100 h-80 border-b-4 border-r-1 border-white/20'
                  style={{
                    backgroundColor: `${formData.textColor}50`,
                    transform: 'rotateX(90deg) translateZ(160px)'
                  }}
                />

            

                {/* Face gauche du cube */}
                <div
                  className='absolute w-80 h-80 '
                  style={{
                    backgroundColor: `${formData.textColor}30`,
                    transform: 'rotateY(-90deg) translateZ(160px)'
                  }}
                />

                {/* Face du dessous du cube */}
                <div
                  className='absolute w-80 h-80  '
                  style={{
                    backgroundColor: `${formData.textColor}15`,
                    transform: 'rotateX(-90deg) translateZ(160px)'
                  }}
                />
              </div>


              {/* Badge "Cible" en haut à droite */}
              <div className="absolute top-4 right-4 z-10">
                <div className="bg-white rounded-xl lg:px-2 md:px-1 sm:px-2 sm:py-2 2xl:px-6 xl:px-4 2xl:py-1.5 py-[1px] px-1   xl:py-[1px] shadow-sm">
                  <span className="text-gray-400 2xl:text-sm lg:text-[10px] text-xs font-medium">{formData.target}</span>
                </div>
              </div>

              {/* Contenu texte en position absolue */}
              <div className="relative z-10">
                {/* Section du pourcentage */}
                <div className="mb-4">
                  <div
                    className="2xl:text-7xl xl:text-5xl lg:text-2xl md:text-xl sm:text-lg font-blocklyn-grunge font-black leading-none"
                    style={{ color: formData.textColor }}
                  >
                    {promoData?.discountType?.split(' ')[0] || '10%'}
                  </div>
                  <div
                    className="2xl:text-lg xl:text-xs lg:text-[10px] font-blocklyn-grunge tracking-wider mt-2"
                    style={{ color: formData.textColor }}
                  >
                    DE RÉDUCTION ----------
                  </div>
                </div>

                {/* Section expiration en bas */}
                <div className="absolute 2xl:top-20 xl:top-22 lg:top-8 md:top-10 sm:top-10  top-8 left-0">
                  <div
                    className=" text-lg 2xl:mt-8 mt-6 z-99 md:text-sm sm:text-xs font-medium"
                    style={{ color: formData.textColor }}
                  >
                    Expire --
                  </div>
                </div>
              </div>


              {/* Rectangle pour l'image - couvre la partie droite et bas gauche */}
              <div
                className="absolute top-8 sm:top-10 md:top-12 lg:top-8 xl:top-12 2xl:top-10 -right-4 sm:-right-6 md:-right-8 lg:-right-10 xl:-right-14 2xl:-right-20 -bottom-16 sm:-bottom-18 md:-bottom-20 lg:-bottom-22 xl:-bottom-24 2xl:-bottom-28 w-32 sm:w-36 md:w-40 lg:w-44 xl:w-48 2xl:w-56 overflow-hidden"

              >
                {uploadedImage && (
                  <Image
                    src={uploadedImage}
                    alt="Promo"
                    className=" 2xl:w-[70%] 2xl:h-[70%] xl:h-[60%] xl:mt-4 xl:w-[100%] lg:w-[100%] -mt-4 lg:h-[50%] md:-mt-4 sm:-mb-4 w-full h-full object-contain"
                    width={100}
                    height={100}
                  />
                )}
              </div>

              {/* Masques circulaires - positionnés plus haut */}
              {/* Cercle gauche */}
              <div
                className="absolute 2xl:bottom-6 2xl:-left-7 -left-8 2xl:w-12 2xl:h-10 h-8 w-12 bottom-5 rounded-full"
                style={{ backgroundColor: formData.textColor }}
              ></div>

              {/* Cercle droit */}
              <div
                className="absolute 2xl:bottom-6  -right-7  2xl:w-12 2xl:h-10 h-8 w-12 bottom-5 rounded-full "
                style={{ backgroundColor: formData.textColor }}
              ></div>
            </div>
          </div>

          
          </div>
        </div>

       
      </div>
    </div>
  )
}

export default PromoDesignCard

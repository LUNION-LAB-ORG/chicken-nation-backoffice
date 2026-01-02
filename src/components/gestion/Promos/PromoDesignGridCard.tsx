"use client"

import React from 'react'
import { PromoCardData } from './PromoCard'
import Image from 'next/image'
import { formatImageUrl } from '@/utils/imageHelpers'

interface PromoDesignGridCardProps {
  promo: PromoCardData
  onClick?: (promo: PromoCardData) => void
  className?: string
}

const PromoDesignGridCard = ({ promo, onClick, className = '' }: PromoDesignGridCardProps) => {
  const handleClick = () => {
    if (onClick) {
      onClick(promo)
    }
  }

  // EXACTEMENT comme dans PersonalizedPromo
  const cubeRotationX = -50
  const cubeRotationY = 50 

  // Fonction pour formater les dates d'expiration
  const formatExpirationDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  return (
    <div
      className={`cursor-pointer ${className}`}
      onClick={handleClick}
    >
      <div
        className="w-full h-max-width xl:h-50 rounded-3xl p-6 relative overflow-hidden border-6"
        style={{
          backgroundColor: promo.background_color || promo.background || '#F17922',
          borderColor: promo.text_color || promo.textColor || '#FFFFFF'
        }}
      >
        {/* Cube 3D complet */}
        <div
          className='absolute -left-[50%] top-[180px] xs:-left-[60%] xs:top-[190px] sm:-left-[30%] sm:top-[160px] md:-left-30 md:top-[160px] lg:-left-63 lg:top-[180px] xl:-left-50 xl:top-[190px] 2xl:-left-48 2xl:top-[240px] w-0 h-0'
          style={{
            transformStyle: 'preserve-3d',
            transform: `rotateX(${cubeRotationX}deg) rotateY(${cubeRotationY}deg)`,
          }}
        >
          {/* Face avant du cube */}
          <div
            className='absolute w-100 h-100  '
            style={{
              backgroundColor: `${promo.text_color || promo.textColor || '#FFFFFF'}30`,
              transform: 'translateZ(160px)'
            }}
          />

          {/* Face du dessus du cube */}
          <div
            className='absolute w-100 h-80 border-b-4 border-r-1 border-white/20'
            style={{
              backgroundColor: `${promo.text_color || promo.textColor || '#FFFFFF'}35`,
              transform: 'rotateX(90deg) translateZ(160px)'
            }}
          />

          {/* Face gauche du cube */}
          <div
            className='absolute w-80 h-80 '
            style={{
              backgroundColor: `${promo.text_color || promo.textColor || '#FFFFFF'}30`,
              transform: 'rotateY(-90deg) translateZ(160px)'
            }}
          />

          {/* Face du dessous du cube */}
          <div
            className='absolute w-80 h-80  '
            style={{
              backgroundColor: `${promo.text_color || promo.textColor || '#FFFFFF'}15`,
              transform: 'rotateX(-90deg) translateZ(160px)'
            }}
          />
        </div>

        {/* Badge "Cible" en haut à droite */}
        {promo.visibility && (
          <div className="absolute top-4 right-4 z-10">
            <div className="bg-white rounded-xl lg:px-1.5 lg:py-1 md:px-1 sm:px-2 sm:py-2 2xl:px-4 xl:px-4 2xl:py-1 py-[1px] px-2 xl:py-[1px] shadow-sm">
              <span className="text-[#F17922] 2xl:text-xs lg:text-[8px] text-[8px] font-medium">{promo.visibility}</span>
            </div>
          </div>
        )}

        {/* Contenu texte en position absolue */}
        <div className="relative z-10">
          {/* Section du titre */}
          <div className="mb-4">
            {promo.title && (
              <div
                className="2xl:text-[44px] xl:text-3xl lg:text-xl md:text-lg sm:text-md font-blocklyn-grunge font-black leading-none"
                style={{ color: promo.text_color || promo.textColor || '#FFFFFF' }}
              >
                <span className="lg:text-2xl text-lg">{promo.title}</span>
              </div>
            )}
            <div
              className="2xl:text-[15px] xl:text-xs md:text-[14px] lg:text-[10px] font-blocklyn-grunge tracking-wider mt-2"
              style={{ color: promo.text_color || promo.textColor || '#FFFFFF' }}
            >
              {(() => {
                // Fonction pour formater la description avec découpage intelligent par mots
                const formatDescription = (text?: string): string | React.ReactElement => {
                  if (!text) return '';

                  // Longueur maximale par ligne (en caractères)
                  const maxLineLength = 22;

                  // Si le texte est plus court que la limite, le retourner tel quel
                  if (text.length <= maxLineLength) return text;

                  // Découpage par mots
                  const words = text.split(' ');
                  let firstLine = '';
                  let secondLine = '';
                  let currentLineLength = 0;

                  // Parcourir tous les mots
                  for (let i = 0; i < words.length; i++) {
                    const word = words[i];
                    const wordWithSpace = (currentLineLength > 0 ? ' ' : '') + word;

                    // Si on travaille encore sur la première ligne
                    if (secondLine === '') {
                      // Vérifier si le mot peut être ajouté à la première ligne
                      if (currentLineLength + wordWithSpace.length <= maxLineLength) {
                        firstLine += wordWithSpace;
                        currentLineLength += wordWithSpace.length;
                      } else {
                        // Si le mot est trop long pour la première ligne, commencer la deuxième
                        secondLine = word;
                        currentLineLength = word.length;
                      }
                    }
                    // Si on travaille sur la deuxième ligne
                    else {
                      // Vérifier si on peut ajouter le mot à la deuxième ligne
                      if (secondLine.length + 1 + word.length <= maxLineLength) {
                        secondLine += ' ' + word;
                      } else {
                        // Pas assez de place, ajouter des points de suspension et arrêter
                        secondLine += '...';
                        break;
                      }
                    }
                  }

                  // Renvoyer le texte formaté
                  if (secondLine) {
                    return (
                      <>
                        {firstLine}<br />
                        {secondLine}
                      </>
                    );
                  } else {
                    return firstLine;
                  }
                };

                return formatDescription(promo.description);
              })()}
            </div>
          </div>

          {/* Section expiration en bas */}
          {(promo.expiration_date || promo.validUntil) && (
            <div className="absolute 2xl:top-20 xl:top-22 lg:top-20 md:top-23 sm:top-23  top-22 left-0">
              <div
                className="text-lg xl:text-md lg:text-[10px] 2xl:mt-12 mt-6 z-99 md:text-xs sm:text-[12px] font-medium"
                style={{ color: promo.text_color || promo.textColor || '#FFFFFF' }}
              >
                 Expire le {formatExpirationDate(promo.expiration_date || promo.validUntil)}
              </div>
            </div>
          )}
        </div>

        {/* Image positionnée à droite et en bas, légèrement immergée */}
        {promo.coupon_image_url && (
          <div className="absolute -bottom-1 -mt-4 -right-1 w-16 h-16 sm:w-26 sm:h-26 md:w-24 md:h-24 lg:w-28 lg:h-28 xl:w-32 xl:h-32 2xl:w-36 2xl:h-36">
            <Image
              src={formatImageUrl(promo.coupon_image_url)}
              alt="Promo"
              className="w-full h-full object-contain"
              width={144}
              height={144}
              onError={(e) => {
                // Masquer l'image en cas d'erreur
                (e.target as HTMLImageElement).style.display = 'none';
              }}
              onLoad={() => {
                // Image chargée avec succès
              }}
            />
          </div>
        )}
        {/* Masques circulaires */}
        {(promo.text_color || promo.textColor) && (
          <>
            <div
              className="absolute 2xl:bottom-6 2xl:-left-7 -left-8 2xl:w-12 2xl:h-10 h-8 w-12 bottom-5 rounded-full"
              style={{ backgroundColor: promo.text_color || promo.textColor || '#FFFFFF' }}
            />
            <div
              className="absolute 2xl:bottom-6  -right-7  2xl:w-12 2xl:h-10 h-8 w-12 bottom-5 rounded-full "
              style={{ backgroundColor: promo.text_color || promo.textColor || '#FFFFFF' }}
            />
          </>
        )}

        {/* Indicateur de statut */}
        {promo.status === 'expired' && (
          <div className="absolute inset-0 bg-black/50 rounded-3xl flex items-center justify-center">
            <span className="text-white font-bold text-xs sm:text-sm">EXPIRÉ</span>
          </div>
        )}
        {promo.status === 'upcoming' && (
          <div className="absolute inset-0 bg-blue-500/50 rounded-3xl flex items-center justify-center">
            <span className="text-white font-bold text-xs sm:text-sm">À VENIR</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default PromoDesignGridCard
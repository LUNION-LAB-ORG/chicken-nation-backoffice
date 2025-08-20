import React from 'react'

interface Cube3DProps {
  /** Couleur de base du cube (format hex) */
  color: string
  /** Rotation X en degrés */
  rotationX: number
  /** Rotation Y en degrés */
  rotationY: number
  /** Classes CSS additionnelles pour le positionnement */
  className?: string
  /** Taille du cube - affecte toutes les dimensions */
  size?: 'small' | 'medium' | 'large' | 'xlarge'
}

const Cube3D: React.FC<Cube3DProps> = ({
  color,
  rotationX,
  rotationY,
  className = '',
  size = 'medium'
}) => {
  // Configuration des tailles
  const sizeConfig = {
    small: {
      container: 'w-8 h-8 xs:w-10 xs:h-10 sm:w-12 sm:h-12',
      faces: 'w-8 h-8 xs:w-10 xs:h-10 sm:w-12 sm:h-12',
      depth: '16px'
    },
    medium: {
      container: 'w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24',
      faces: 'w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24',
      depth: '32px'
    },
    large: {
      container: 'w-28 h-28 lg:w-32 lg:h-32 xl:w-40 xl:h-40',
      faces: 'w-28 h-28 lg:w-32 lg:h-32 xl:w-40 xl:h-40',
      depth: '56px'
    },
    xlarge: {
      container: 'w-100 h-100',
      faces: 'w-100 h-100',
      depth: '160px'
    }
  }

  const config = sizeConfig[size]

  return (
    <div
      className={`${config.container} ${className}`}
      style={{
        transformStyle: 'preserve-3d',
        transform: `rotateX(${rotationX}deg) rotateY(${rotationY}deg)`,
      }}
    >
      {/* Face avant */}
      <div
        className={`absolute ${config.faces} border-2 border-white`}
        style={{
          backgroundColor: `${color}40`,
          transform: `translateZ(${config.depth})`
        }}
      />

      {/* Face droite */}
      <div
        className={`absolute ${config.faces} border-2 border-white`}
        style={{
          backgroundColor: `${color}25`,
          transform: `rotateY(90deg) translateZ(${config.depth})`
        }}
      />

      {/* Face du dessus */}
      <div
        className={`absolute ${config.faces} border-2 border-white`}
        style={{
          backgroundColor: `${color}50`,
          transform: `rotateX(90deg) translateZ(${config.depth})`
        }}
      />

      {/* Face arrière */}
      <div
        className={`absolute ${config.faces} border-2 border-white`}
        style={{
          backgroundColor: `${color}20`,
          transform: `rotateY(180deg) translateZ(${config.depth})`
        }}
      />

      {/* Face gauche */}
      <div
        className={`absolute ${config.faces} border-2 border-white`}
        style={{
          backgroundColor: `${color}30`,
          transform: `rotateY(-90deg) translateZ(${config.depth})`
        }}
      />

      {/* Face du dessous */}
      <div
        className={`absolute ${config.faces} border-2 border-white`}
        style={{
          backgroundColor: `${color}15`,
          transform: `rotateX(-90deg) translateZ(${config.depth})`
        }}
      />
    </div>
  )
}

export default Cube3D

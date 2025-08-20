import Image from "next/image"
import { LucideIcon } from "lucide-react"
import React from "react"
import { formatImageUrl } from '@/utils/imageHelpers'

interface CircularProgressProps {
  percentage: number
  color?: string
  size?: number
  strokeWidth?: number
}

// ✅ Server Component - Logique pure de rendu
const CircularProgress: React.FC<CircularProgressProps> = ({
  percentage,
  color = "#FFC107",
  size = 40,
  strokeWidth = 6
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Cercle de fond */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#F5F5F5"
          strokeWidth={strokeWidth}
        />
        {/* Cercle de progression */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinejoin="round"
        />
      </svg>
      <div className="absolute text-xs font-regular text-[#F17922]" >
        {percentage}%
      </div>
    </div>
  )
}

interface GenericStatCardServerProps {
  title: string
  value: string | number
  unit?: string
  badgeColor?: string
  badgeText?: string
  icon?: LucideIcon
  iconColor?: string
  iconImage?: string
  trend?: {
    value: number
    isPositive: boolean
  }
  objective?: {
    value: string
    percentage: number
  }
  className?: string
}

/**
 * Version Server Component pure de GenericStatCard
 * Rendu statique sans interactions - pour performance optimale
 */
export function GenericStatCardServer({
  title,
  value,
  unit = "",
  badgeColor = "#EA4335",
  badgeText,
  icon: Icon,
  iconColor = "#F17922",
  iconImage,
  objective,
  className = ""
}: GenericStatCardServerProps) {
  const cardClasses = `w-full rounded-3xl relative border border-gray-100 bg-white p-0 shadow-sm overflow-hidden ${className}`;

  return (
    <div className={cardClasses}>
      {/* Badge en haut */}
      {badgeText && (
        <div
          className="py-[3px] px-4 text-[#fdf3ec] font-regular rounded-b-xl absolute top-0 left-4"
          style={{ backgroundColor: badgeColor }}
        >
          <span className="text-sm">{badgeText}</span>
        </div>
      )}

      {/* Contenu principal */}
      <div className="pt-10 pb-2 px-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[20px] font-medium text-[#9796a1]">
              {value} {unit}
            </h2>
            {title && title !== badgeText && (
              <p className="text-sm text-gray-500 mt-1">{title}</p>
            )}
          </div>

          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ color: iconColor }}>
            {Icon && <Icon size={30} strokeWidth={2} />}
            {iconImage && (
              <Image
                src={formatImageUrl(iconImage)}
                alt={title}
                width={36}
                height={36}
                onError={(e) => {
                  console.warn('Erreur de chargement de l\'icône:', iconImage);
                  (e.target as HTMLImageElement).src = '/icons/circle.png';
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Section objectif avec fond beige */}
      {objective && (
        <div className="bg-[#FFF8EE] p-3 py-2 flex items-center justify-between">
          <span className="text-sm text-gray-700">{objective.value}</span>
          <CircularProgress percentage={objective.percentage} />
        </div>
      )}
    </div>
  );
} 
"use client"

import React from 'react'
import { Ad } from '@/types/ad'
import Image from 'next/image'

interface AdCardProps {
  ad: Ad
  onClick?: (ad: Ad) => void
}

export default function AdCard({ ad, onClick }: AdCardProps) {
  // Formater la date manuellement
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const day = date.getDate()
    const month = new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(date)
    const year = date.getFullYear()
    return `${day} ${month}, ${year}`
  }

  // Formater l'heure manuellement
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  }



  return (
    <div
      className="border border-gray-200 rounded-lg p-3 sm:p-4 cursor-pointer hover:shadow-md transition-shadow h-full"
      onClick={() => onClick && onClick(ad)}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-start gap-2 sm:gap-3">
          <div className="flex-shrink-0">
            <Image
              src="/icons/start.png"
              alt="calendar"
              width={20}
              height={20}
              className="w-5 h-5 object-contain"
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
              <h3 className="text-gray-500 font-medium text-[11px] truncate">{ad.title}</h3>
            </div>
            <div className="text-gray-400 text-[11px] font-semibold flex gap-1 sm:gap-2 mt-1 flex-wrap">
              <span className="whitespace-nowrap">{formatDate(ad.createdAt)}</span>
              <span className="hidden sm:inline">|</span>
              <span className="whitespace-nowrap">{formatTime(ad.createdAt)}</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-100 rounded-lg sm:rounded-2xl p-3 sm:p-4 my-2 sm:my-3 flex-grow">
          <p className="text-gray-700 text-[12px] line-clamp-3">{ad.content}</p>
        </div>

        <div className="flex flex-col gap-1 text-[11px] sm:text-[12px] text-gray-500">
          <p className="flex justify-between">
            <span>Envoyé à :</span>
            <span className="font-medium">{ad.stats?.sentTo || 0} clients</span>
          </p>
          <p className="flex justify-between">
            <span>Lecture :</span>
            <span className="font-medium">{ad.stats?.readBy || 0} clients</span>
          </p>
        </div>

        <div className="mt-3 text-center">
          <button
            type="button"
            className="text-[#F17922] border border-[#F17922] rounded-full px-3 sm:px-4 py-1 text-[11px] sm:text-[12px] hover:bg-orange-50 w-full transition-colors"
          >
            Voir les informations
          </button>
        </div>
      </div>
    </div>
  )
}

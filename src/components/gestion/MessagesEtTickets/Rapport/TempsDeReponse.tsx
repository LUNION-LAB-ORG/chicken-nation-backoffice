"use client";

import React from 'react';
import Image from 'next/image';

// Types pour les données mockées
interface TempsReponseData {
  id: string;
  label: string;
  value: string;
  type: 'time' | 'count';
  badgeColor: string;
  badgeTextColor: string;
}

// Données mockées
const mockTempsReponse: TempsReponseData[] = [
  {
    id: '1',
    label: 'Temps moyen',
    value: '2h 15min',
    type: 'time',
    badgeColor: '',
    badgeTextColor: 'text-orange-500'
  },
  {
    id: '2',
    label: 'En retard',
    value: '3 tickets',
    type: 'count',
    badgeColor: 'bg-red-500',
    badgeTextColor: 'text-white'
  }
];

// Composant pour un item de temps de réponse
interface TempsReponseItemProps {
  item: TempsReponseData;
}

function TempsReponseItem({ item }: TempsReponseItemProps) {
  return (
    <div className="py-1 px-2 md:px-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="md:text-sm lg:text-sm text-xs text-gray-600 font-medium">
            {item.label}
          </p>
        </div>
        <div className="ml-4">
          {item.badgeColor ? (
            <span className={`inline-flex items-center px-2 md:px-3 py-1 rounded-full md:text-[10px] text-[10px] font-medium ${item.badgeColor} ${item.badgeTextColor}`}>
              {item.value}
            </span>
          ) : (
            <span className={`md:text-sm lg:text-sm text-xs font-medium ${item.badgeTextColor}`}>
              {item.value}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function TempsDeReponse() {
  return (
    <div className="bg-white rounded-2xl  border-0 overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="p-3 md:p-6">
        <div className="flex items-center justify-between">
          <h3 className="lg:text-2xl md:text-base text-md font-semibold text-gray-900 flex items-center">
            <Image
              src="/icons/rapport/clock.png"
              alt="Temps de réponse"
              width={24}
              height={24}
              className="mr-2 self-center mt-1"
            />
            Temps de réponse
          </h3>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 flex-1 overflow-y-auto">
        <div className="space-y-0">
          {mockTempsReponse.map((item) => (
            <TempsReponseItem 
              key={item.id} 
              item={item} 
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default TempsDeReponse;

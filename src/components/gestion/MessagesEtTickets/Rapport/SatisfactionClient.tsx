"use client";

import Image from 'next/image';
import React from 'react';

// Types pour les données mockées
interface SatisfactionData {
  id: string;
  label: string;
  value: string;
  type: 'rating' | 'percentage';
  badgeColor: string;
  badgeTextColor: string;
}

// Données mockées
const mockSatisfaction: SatisfactionData[] = [
  {
    id: '1',
    label: 'Note moyenne',
    value: '4.2/5',
    type: 'rating',
    badgeColor: '',
    badgeTextColor: 'text-[#F17922]'
  },
  {
    id: '2',
    label: 'Très satisfait',
    value: '72%',
    type: 'percentage',
    badgeColor: 'bg-green-500',
    badgeTextColor: 'text-white'
  },
  {
    id: '3',
    label: 'Amélioration requise',
    value: '12%',
    type: 'percentage',
    badgeColor: 'bg-red-500',
    badgeTextColor: 'text-white'
  }
];

// Composant pour un item de satisfaction
interface SatisfactionItemProps {
  item: SatisfactionData;
}

function SatisfactionItem({ item }: SatisfactionItemProps) {
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

function SatisfactionClient() {
  return (
    <div className="bg-white rounded-2xl  border-0 overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="p-3 md:p-6">
        <div className="flex items-center justify-start">
          <div className='flex items-center gap-2'>
           <Image src='/icons/rapport/satisfaction.png' width={24} height={24} alt="statisfaction" className='mt-1' />
          <h3 className="lg:text-2xl md:text-base text-md font-semibold text-gray-900"> 
            Satisfaction client
          </h3>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 flex-1 overflow-y-auto">
        <div className="space-y-0">
          {mockSatisfaction.map((item) => (
            <SatisfactionItem 
              key={item.id} 
              item={item} 
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default SatisfactionClient;

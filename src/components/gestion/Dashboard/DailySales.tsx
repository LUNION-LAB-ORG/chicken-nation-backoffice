"use client"

import Image from 'next/image';
import React from 'react';
import { DailySalesData } from '@/services/dashboardService';
import { useDailySalesQuery } from '@/hooks/useDailySalesQuery';
import './DailySales.css';
 

interface DailySalesProps {
  title?: string;
  subtitle?: string;
  restaurantId?: string;
  period?: 'today' | 'week' | 'month' | 'lastMonth' | 'year';
}

const DailySales: React.FC<DailySalesProps> = ({
  title = "Revenu journalier actualisé",
  subtitle = "Affichage mensuel",
  restaurantId,
  period = 'today'
}) => {
  // ✅ TanStack Query pour les données de ventes journalières
  const {
    data: salesData,
    isLoading,
    error
  } = useDailySalesQuery({
    restaurantId,
    period,
    enabled: true
  });

  // ✅ Données par défaut si pas de données
  const defaultSalesData: DailySalesData[] = [
    { label: "Mobile Money", value: "0 XOF", color: "#3B82F6", percentage: 0 },
    { label: "Espèces", value: "0 XOF", color: "#10B981", percentage: 0 },
    { label: "Carte bancaire", value: "0 XOF", color: "#F59E0B", percentage: 0 },
    { label: "Autres", value: "0 XOF", color: "#8B5CF6", percentage: 0 },
  ];

  // ✅ Utiliser les données de la query ou fallback
  const finalSalesData = salesData && salesData.length > 0 ? salesData : defaultSalesData;
 
  // Calculer la largeur totale pour s'assurer que les pourcentages s'additionnent à 100%
  const totalPercentage = finalSalesData.reduce((sum, item) => sum + item.percentage, 0);

  // Si tous les pourcentages sont à 0, donner une largeur égale à chaque catégorie pour l'affichage
  const displayData = totalPercentage === 0
    ? finalSalesData.map(item => ({ ...item, displayPercentage: 25 })) // 100% / 4 catégories = 25% chacune
    : finalSalesData.map(item => ({ ...item, displayPercentage: item.percentage }));

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center">
        <Image className='mt-1' src="/icons/chicken.png" alt="circle" width={14} height={14} />
          <h3 className="text-[#F17922] font-bold text-[15px] ml-2">{title}</h3>
        </div>
        <div className="flex items-center text-gray-500">
          <span className="text-sm">{subtitle}</span>
          <svg className="ml-1 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500">Chargement des ventes journalières...</div>
        </div>
      ) : (
        <>
          {/* Barre de progression avec segments colorés et pourcentages */}
          <div className="w-full h-10 rounded-2xl overflow-hidden flex mb-8 relative">
            {displayData.map((item, index) => (
          <div
            key={index}
            className="daily-sales-segment"
            style={{
              width: `${item.displayPercentage}%`,
              backgroundColor: item.color,
            }}
          >
            <span className="daily-sales-percentage-text">
              {totalPercentage === 0 ? '0%' : `${item.percentage}%`}
            </span>
          </div>
            ))}
          </div>

          {/* Liste des catégories avec valeurs */}
          <div className="space-y-4">
            {finalSalesData.map((item, index) => (
              <div key={index} className="flex items-center">
                <div className="flex items-center w-1/2">
                  <div
                    className="daily-sales-color-indicator"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-[#9796A1] font-light">{item.label}</span>
                </div>
                <div className="w-1/2 text-[#9796A1] font-bold">
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default DailySales;

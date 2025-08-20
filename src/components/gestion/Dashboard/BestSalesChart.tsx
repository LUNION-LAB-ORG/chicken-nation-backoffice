"use client"

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import './Dashboard.css';
import { getBestSalesData, BestSalesItem } from '@/services/dashboardService';
import { formatImageUrl } from '@/utils/imageHelpers';

interface MenuItem {
  id: string;
  name: string;
  count: number;
  image: string;
  percentage: number;
  interestedPercentage: string;
}

interface BestSalesChartProps {
  title: string;
  items?: MenuItem[];
  restaurantId?: string;
  period?: 'today' | 'week' | 'month' | 'lastMonth' | 'year';
}

interface CircularProgressProps {
  value: number;
}

const CircularProgress: React.FC<CircularProgressProps> = ({ value }) => {
  const radius = 12;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg width="50" height="50" viewBox="0 0 32 32">
        <circle
          cx="16"
          cy="16"
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="3"
        />
        <circle
          cx="16"
          cy="16"
          r={radius}
          fill="none"
          stroke="#FFC107"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 16 16)"
        />
      </svg>
      <div className="absolute text-[14px] font-medium text-[#FFC107]">
        {value}%
      </div>
    </div>
  );
};

const MiniBarChart: React.FC<{ count: number }> = ({ count }) => {
  return (
    <div className="flex gap-2 flex-row items-center justify-center">
      <div className="flex items-end h-6 gap-[2px]">
        <div className="w-[3px] h-3 bg-[#F17922] rounded-sm"></div>
        <div className="w-[3px] h-6 bg-[#F17922] rounded-sm"></div>
        <div className="w-[3px] h-4 bg-[#F17922] rounded-sm"></div>
        <div className="w-[3px] h-2 bg-[#F17922] rounded-sm"></div>
      </div>
      <span className="text-[16px] text-[#9796A1] font-medium mt-1">{count}</span>
    </div>
  );
};

const BestSalesChart: React.FC<BestSalesChartProps> = ({ title, items, restaurantId, period = 'month' }) => {
  const [bestSalesData, setBestSalesData] = useState<BestSalesItem[]>(items || [])
  const [isLoading, setIsLoading] = useState(false)

  // Charger les données depuis l'API
  useEffect(() => {
    const loadBestSalesData = async () => {
      if (items && items.length > 0) {
        // Si des données sont passées en props, les utiliser
        setBestSalesData(items)
        return
      }

      setIsLoading(true)
      try {
        const apiData = await getBestSalesData(restaurantId, period)
        setBestSalesData(apiData)
      } catch (error) {
        console.error('Erreur lors du chargement des meilleures ventes:', error)
        setBestSalesData([])
      } finally {
        setIsLoading(false)
      }
    }

    loadBestSalesData()
  }, [restaurantId, items, period])

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center mx-2 mb-4">
        <div className="flex items-center  ">
        <Image className='mt-1' src="/icons/chicken.png" alt="circle" width={14} height={14} />
          <h3 className="text-[#F17922] font-bold text-[15px] ml-2">{title}</h3>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500">Chargement des meilleures ventes...</div>
        </div>
      ) : bestSalesData.length === 0 ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500">Aucune donnée de vente disponible</div>
        </div>
      ) : (
        <div className="space-y-4">
          {bestSalesData.map((item) => (
          <div key={item.id} className="flex items-center justify-between py-2  border-b-[1px] border-[#E6E6E6]  ">
            <div className="flex items-center mx-2">
              <div className="lg:w-26 lg:h-20 w-16 h-16 mr-3 rounded-2xl border-[2px] mb-2 border-[#ffeacd]">
                <Image
                  src={formatImageUrl(item.image)}
                  alt={item.name}
                  width={200}
                  height={200}
                  className="object-cover"
                  onError={(e) => {
                    console.warn('Erreur de chargement de l\'image du menu:', item.image);
                    (e.target as HTMLImageElement).src = '/images/placeholder-food.jpg';
                  }}
                />
              </div>
              <div>
                <h4 className="lg:text-[13px] text-[10px] font-bold text-[#595959] lg:line-clamp-2 line-clamp-3 lg:w-60 w-26 mr-4">{item.name}</h4>
                <div className="flex items-center gap-1 mt-1">
                <Image className='mt-1 contain-content lg:w-4 lg:h-4 w-3 h-3' src="/icons/stonk.png" alt="circle" width={14} height={14} />
                  <span className="lg:text-xs text-[10px] line-clamp-2 lg:line-clamp-1 lg:w-50 w-20 text-[#F17922]">{item.interestedPercentage}</span>
                </div>
              </div>
            </div>
           <div className='lg:mr-50'>
           <MiniBarChart count={item.count} />
           </div>
            <CircularProgress value={item.percentage} />
          </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BestSalesChart;

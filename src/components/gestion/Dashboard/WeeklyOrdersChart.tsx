"use client"

import React, { useState } from 'react'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js'
import { ChevronDown } from 'lucide-react'
import './WeeklyOrdersChart.css'
import Image from 'next/image'
import { useWeeklyOrdersQuery } from '@/hooks/useWeeklyOrdersQuery'
import { generateWeekRanges } from '@/utils/dateUtils'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

interface WeeklyOrdersChartProps {
  restaurantId?: string;
  data?: Array<{
    name: string
    value: number
  }>;
  period?: 'today' | 'week' | 'month' | 'lastMonth' | 'year';
}

const WeeklyOrdersChart: React.FC<WeeklyOrdersChartProps> = ({ restaurantId, data, period = 'week' }) => {
  // ✅ Générer les plages de dates dynamiquement
  const dateRanges = generateWeekRanges(4);
  const [selectedDateRange, setSelectedDateRange] = useState(() => dateRanges[0].value)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

      // ✅ TanStack Query pour les données hebdomadaires
    const {
      data: weeklyData,
      isLoading,
    } = useWeeklyOrdersQuery({
    restaurantId,
    dateRange: selectedDateRange, // ✅ Utiliser la date sélectionnée
    period, // ✅ Passer la période
    enabled: !data  
  });

  // ✅ Calculer l'échelle dynamique
  const dataValues = weeklyData && weeklyData.length > 0
    ? weeklyData.map(item => item.value)
    : [0, 0, 0, 0, 0, 0, 0];

  const maxValue = Math.max(...dataValues);
  const dynamicMax = maxValue === 0 ? 10 : Math.ceil(maxValue * 1.2); // 20% de marge au-dessus

  const chartData = {
    labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
    datasets: [
      {
        label: 'Commandes',
        data: dataValues,
        backgroundColor: '#F17922',
        borderRadius: 4,
        barThickness: 30,
        borderSkipped: false,
      },
    ],
  }

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#333',
        bodyColor: '#333',
        bodyFont: {
          size: 14,
        },
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: function(context) {
            return `${context.parsed.y} commandes`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#9796A1',
        }
      },
      y: {
        min: 0,
        max: dynamicMax, // ✅ Échelle dynamique

        grid: {
          color: 'rgba(241, 121, 34, 0.1)',
          drawTicks: false,
          lineWidth: 2,
        },
        border: {
          display: false,
        },
        ticks: {
          color: '#9796A1',
          font: {
            size: 12,
          },
          padding: 10,
          stepSize: Math.max(1, Math.ceil(dynamicMax / 5)), // ✅ Étapes dynamiques
        },
      },
    },
  }

  return (
    <div className="weekly-orders-chart">
      <div className="weekly-orders-header">
        <div className="weekly-orders-title">
        <Image className='mt-1' src="/icons/chicken.png" alt="circle" width={14} height={14} />
          <h3 className="text-[#F17922] font-bold text-[15px] ml-2">Commandes évaluées cette semaine</h3>
        </div>

        <div className="date-selector">
          <button
            type="button"
            className="date-selector-button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            {dateRanges.find(range => range.value === selectedDateRange)?.label || selectedDateRange}
            <ChevronDown size={16} className="ml-2" />
          </button>

          {isDropdownOpen && (
            <div className="date-selector-dropdown">
              {dateRanges.map((range, index) => (
                <div
                  key={index}
                  className="date-option dark:text-gray-700"
                  onClick={() => {
                    setSelectedDateRange(range.value)
                    setIsDropdownOpen(false)
                  }}
                >
                  {range.label}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center" style={{ height: 200 }}>
          <div className="text-gray-500">Chargement des commandes hebdomadaires...</div>
        </div>
      ) : false ? (
        <div className="flex items-center justify-center" style={{ height: 200 }}>
          <div className="text-gray-500">Aucune donnée de commande disponible</div>
        </div>
      ) : (
        <div style={{ width: '100%', height: 200 }}>
          <Bar
            key={`chart-${selectedDateRange}`}
            data={chartData}
            options={options}
          />
        </div>
      )}
    </div>
  )
}

export default WeeklyOrdersChart

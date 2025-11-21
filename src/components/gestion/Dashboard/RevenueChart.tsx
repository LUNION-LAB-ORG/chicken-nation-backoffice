"use client"

import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
  ChartOptions,
} from 'chart.js';
import Image from 'next/image';
import { useRevenueDataQuery } from '@/hooks/useRevenueDataQuery';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

interface RevenueChartProps {
  data?: Array<{
    name: string;
    value: number;
  }>;
  restaurantId?: string;
  period?: 'today' | 'week' | 'month' | 'lastMonth' | 'year';
}

const RevenueChart: React.FC<RevenueChartProps> = ({ restaurantId, period = 'month' }) => {
  // ✅ Utiliser TanStack Query pour récupérer les données de revenus
  const {
    data: revenueData,
    isLoading,
    error
  } = useRevenueDataQuery({
    restaurantId,
    period // ✅ Passer la période au hook
  });


  // Données mockées pour correspondre à l'image
  const timeLabels = ['08.00', '09.00', '10.00', '11.00', '12.00', '13.00', '14.00', '15.00', '16.00', '17.00'];
  const revenueValues = [0, 0, 0, 0, 0, 0, 27, 27, 26, 20];
  
  const chartData = {
    labels: timeLabels,
    datasets: [
      {
        fill: true,
        label: 'Revenu',
        data: revenueValues,
        borderColor: 'transparent', 
        backgroundColor: (context: { chart: { ctx: CanvasRenderingContext2D } }) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, '#FA6345'); // Orange foncé en haut
          gradient.addColorStop(0.5, '#ff6200'); // Orange clair au milieu
          gradient.addColorStop(0.57, 'rgba(253, 233, 218, 0)'); // Transparent en bas
          return gradient;
        },
        tension: 0.4,
        pointRadius: 0,
      },
     
      {
        data: [null, null, null, null, null, 25, null, null, null, null],
        borderColor: 'transparent',
        backgroundColor: 'transparent',
        pointRadius: 0,
        tension: 0,
        fill: false,
      }
    ],
  };

  const options: ChartOptions<'line'> = {
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
            return `${context.parsed.y} xof`;
          }
        }
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#9796A1',
          font: {
            size: 12,
          },
          padding: 10,
        },
        border: {
          display: false,
        },
      },
      y: {
        min: 20,
        max: 30,
        grid: {
          color: (context) => {
            const value = context.tick?.value;
            if ([20, 25, 30].includes(value)) {
              return 'rgba(241, 121, 34, 0.1)';
            }
            return 'transparent';
          },
          drawTicks: false,
          lineWidth: 2
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
          stepSize: 1, // Force tous les ticks de 20 à 30
          autoSkip: false, // N'en saute aucun
          callback: function(value) {
            // Afficher uniquement 20, 22, 24, 26, 28, 30
            const allowed = [20, 22, 24, 26, 28, 30];
            return allowed.includes(Number(value)) ? value : '';
          }
        },
      },
    },
    elements: {
      line: {
        tension: 0.4,
      },
    },
    layout: {
      padding: {
        top: 20,
        right: 20,
        bottom: 10,
        left: 10,
      },
    },
  };

  return (
    <div className="bg-white rounded-3xl p-3 shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-4 mx-4">
        <div className="flex items-center ">
           <Image className='mt-1' src="/icons/chicken.png" alt="circle" width={14} height={14} />
          <h3 className="text-[#F17922] font-bold text-[15px] ml-2">Revenu journalier actualisé</h3>
        </div>
        <div className="text-right">
          {isLoading ? (
            <div className="text-[14px] font-bold text-[#9796A1]">Chargement...</div>
          ) : error ? (
            <div className="text-[14px] font-bold text-red-500">Erreur</div>
          ) : (
            <>
              <div className="text-[14px] font-bold text-[#9796A1]">
                {revenueData?.total || "0 XOF"}
              </div>
              <div className={`text-[10px] font-regular ${
                revenueData?.trend.isPositive ? 'text-green-500' : 'text-red-500'
              }`}>
                {revenueData?.trend.percentage || "0%"}
                <span className="text-[#9796A1]"> | que {revenueData?.trend.comparedTo || "hier"}</span>
              </div>
            </>
          )}
        </div>
      </div>
      
      <div style={{ width: '100%', height: 220 }}>
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};

export default RevenueChart;

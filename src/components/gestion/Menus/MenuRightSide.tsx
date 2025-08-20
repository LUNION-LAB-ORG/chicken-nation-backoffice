/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import React, { useState } from 'react'
import Image from 'next/image'
import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'
import MenuItemSimple from '@/components/ui/MenuItemSimple'   
import { MenuItem as MenuItemType } from '@/types'
import Select from '@/components/ui/Select'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

interface MenuRightSideProps {
  similarMenus: MenuItemType[]
  onEditMenu: (menu: MenuItemType) => void
  onViewMenu: (menu: MenuItemType) => void
}

const MenuRightSide = ({ similarMenus, onEditMenu, onViewMenu }: MenuRightSideProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState('cette-semaine')

  const data = {
    labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
    datasets: [
      {
        label: 'Commandes',
        data: [40, 20, 40, 35, 38, 100, 0],
        backgroundColor: '#F17922',
      },
    ],
  }

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true, 
        font: {
          size: 16,
        },
      },
    },
    elements: {
      point: {
        radius: 8,
        hoverRadius: 8,
        backgroundColor: "#F17922",
        borderColor: "#fff",
        borderWidth: 2,
      },
      line: {
        tension: 0.4,
        borderWidth: 2,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { 
          color: (context: any) => {
            if (context.tick.value === 50 || context.tick.value === 100) {
              return '#f178225b'
            }
            return 'rgba(0, 0, 0, 0.05)'
          },
          drawTicks: false,
          lineWidth: (context: any) => {
            if (context.tick.value === 0 || context.tick.value === 50 || context.tick.value === 100) {
              return 1
            }
            return 0.5
          },
        },
        ticks: {
          padding: 10,
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          padding: 5,
        },
      },
    },
  }

  const periodOptions = [
    { value: 'semaine-derniere', label: 'La semaine dernière' },
    { value: 'cette-semaine', label: 'Cette semaine' }
  ]

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-xl sm:rounded-2xl shadow-sm">
        <div className='flex items-center justify-between gap-2 mb-4 xs:mb-2'>
          <div className="flex items-center gap-2 flex-shrink min-w-0 w-2/3">
            <Image 
              src="/icons/chicken.png" 
              alt="menu" 
              width={16}
              height={16}
              className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4 mt-0.5 flex-shrink-0" 
            />
            <h3 className="text-base sm:text-lg font-bold text-[#F17922] truncate">Aperçu des commandes</h3>
          </div>
          <div className="w-1/3 min-w-[120px] flex-shrink-0">
            <Select 
              placeholder='Cette semaine' 
              options={periodOptions}
              value={selectedPeriod}
              onChange={setSelectedPeriod}
            />
          </div>
        </div>
        <div className="w-full h-[200px] xs:h-[250px] sm:h-[300px]">
          <Bar data={data} options={{...options, maintainAspectRatio: false}} />
        </div>
      </div>

      <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-xl sm:rounded-2xl shadow-sm">
        <div className='flex gap-2 items-center mb-3 sm:mb-4'>
          <Image 
            src="/icons/chicken.png" 
            alt="menu" 
            width={16}
            height={16}
            className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4 mt-0.5" 
          />
          <h3 className="text-base sm:text-lg font-bold text-[#F17922]">Même catégorie</h3>
        </div>
        <div className="grid grid-cols-2 gap-2 xs:gap-3">
          {similarMenus.map((menu) => (
            <MenuItemSimple 
              key={menu.id} 
              menu={menu} 
              onEdit={() => onEditMenu(menu)}
              onView={() => onViewMenu(menu)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default MenuRightSide

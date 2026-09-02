/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import React, { useState } from 'react'
import Image from 'next/image'
import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'
import MenuItemSimple from '@/components/ui/MenuItemSimple'   
import { MenuItem as MenuItemType } from '@/types'
import Select from '@/components/ui/Select'
import { useSalesTrendQuery } from '../../../../features/statistics/queries/statistics-products.query'
import type { ProductsStatsQueryParams } from '../../../../features/statistics/types/products-stats.types'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

interface MenuRightSideProps {
  similarMenus: MenuItemType[]
  onEditMenu: (menu: MenuItemType) => void
  onViewMenu: (menu: MenuItemType) => void
  /** Plat consulté : sans lui, la tendance agrégerait tout le catalogue. */
  dishId?: string
}

type Periode = NonNullable<ProductsStatsQueryParams['period']>

/**
 * ⚠️ Le graphique affichait des valeurs ECRITES EN DUR
 * (`[40, 20, 40, 35, 38, 100, 0]`) et le sélecteur de période ne faisait
 * RIEN : il changeait un état que personne ne lisait. Autrement dit, ce bloc
 * racontait la même histoire quel que soit le plat et quelle que soit la
 * période.
 *
 * Il consomme désormais la vraie tendance de ventes, restreinte à ce plat.
 */
const MenuRightSide = ({ similarMenus, onEditMenu, onViewMenu, dishId }: MenuRightSideProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState<Periode>('week')

  const { data: tendance, isLoading, isError } = useSalesTrendQuery(
    { dishId, period: selectedPeriod },
    // Inutile d'interroger le serveur tant qu'on ne sait pas de quel plat il s'agit.
    Boolean(dishId),
  )

  /**
   * Sur une année, le serveur rend un point PAR JOUR, soit plus de trois cents
   * barres : illisible. On regroupe donc par mois au delà de six semaines. En
   * deçà, le détail quotidien est ce qui intéresse.
   */
  const points = React.useMemo(() => {
    const jours = tendance?.dailyData ?? []
    if (jours.length <= 42) {
      return jours.map((j) => ({ label: j.label, valeur: j.totalQuantity }))
    }
    const parMois = new Map<string, { label: string; valeur: number }>()
    for (const j of jours) {
      const cle = j.date.slice(0, 7)
      const libelle = new Date(`${cle}-01T00:00:00`).toLocaleDateString('fr-FR', {
        month: 'short',
        year: '2-digit',
      })
      const existant = parMois.get(cle)
      if (existant) existant.valeur += j.totalQuantity
      else parMois.set(cle, { label: libelle, valeur: j.totalQuantity })
    }
    return [...parMois.values()]
  }, [tendance])

  const data = {
    labels: points.map((p) => p.label),
    datasets: [
      {
        label: 'Quantité commandée',
        data: points.map((p) => p.valeur),
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

  /**
   * Les sept périodes que le serveur sait réellement calculer. L'écran n'en
   * proposait que deux, dont aucune n'était appliquée.
   */
  const periodOptions: { value: Periode; label: string }[] = [
    { value: 'today', label: "Aujourd'hui" },
    { value: 'yesterday', label: 'Hier' },
    { value: 'week', label: 'Cette semaine' },
    { value: 'lastWeek', label: 'La semaine dernière' },
    { value: 'month', label: 'Ce mois-ci' },
    { value: 'lastMonth', label: 'Le mois dernier' },
    { value: 'year', label: 'Cette année' },
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
              onChange={(valeur) => setSelectedPeriod(valeur as Periode)}
            />
          </div>
        </div>
        <div className="w-full h-[200px] xs:h-[250px] sm:h-[300px]">
          {/*
            Trois états distincts, parce qu'un graphique vide ne dit pas
            pourquoi il est vide : chargement, échec, ou aucune vente sur la
            période. Sans cette distinction, une panne se lit comme un plat qui
            ne se vend pas.
          */}
          {isLoading ? (
            <div className="h-full w-full rounded-xl bg-gray-50 animate-pulse" />
          ) : isError ? (
            <div className="h-full flex items-center justify-center text-center px-4">
              <p className="text-xs text-red-500">
                Les ventes n&apos;ont pas pu être chargées.
              </p>
            </div>
          ) : points.length === 0 || points.every((p) => p.valeur === 0) ? (
            <div className="h-full flex items-center justify-center text-center px-4">
              <p className="text-xs text-gray-400">
                Aucune vente de ce plat sur la période choisie.
              </p>
            </div>
          ) : (
            <Bar data={data} options={{...options, maintainAspectRatio: false}} />
          )}
        </div>
        {!isLoading && !isError && (tendance?.totalQuantity ?? 0) > 0 && (
          <p className="mt-2 text-[11px] text-gray-500">
            <span className="font-bold text-gray-700">{tendance?.totalQuantity}</span>{' '}
            unité{(tendance?.totalQuantity ?? 0) > 1 ? 's' : ''} vendue
            {(tendance?.totalQuantity ?? 0) > 1 ? 's' : ''} sur la période, pour{' '}
            <span className="font-bold text-gray-700">
              {(tendance?.totalRevenue ?? 0).toLocaleString('fr-FR')} FCFA
            </span>
            .
          </p>
        )}
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

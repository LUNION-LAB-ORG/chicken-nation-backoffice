"use client"

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useDashboardStore, type PeriodFilter } from '@/store/dashboardStore';

interface PeriodOption {
  value: PeriodFilter;
  label: string;
  description: string;
}

const periodOptions: PeriodOption[] = [
  { value: 'today', label: 'Aujourd\'hui', description: 'Données du jour' },
  { value: 'week', label: 'Cette semaine', description: '7 derniers jours' },
  { value: 'month', label: 'Ce mois', description: '30 derniers jours' },
  { value: 'lastMonth', label: 'Mois précédent', description: 'Le mois dernier complet' },
  { value: 'year', label: 'Cette année', description: '12 derniers mois' },
];

export const DashboardPeriodFilter: React.FC = () => {
  const { selectedPeriod, setSelectedPeriod } = useDashboardStore();
  const [isOpen, setIsOpen] = useState(false);

  const currentOption = periodOptions.find(option => option.value === selectedPeriod) || periodOptions[2];

  const handlePeriodChange = (period: PeriodFilter) => {
    setSelectedPeriod(period);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex justify-center items-center gap-2 px-4 py-1 cursor-pointer bg-[#F17922] border border-white rounded-xl hover:bg-[#f17522] transition-colors shadow-xs"
      >
        <div className="flex flex-col items-start">
          <span className="text-sm font-medium text-white">
            {currentOption.label}
          </span>

        </div>
        <ChevronDown
          size={16}
          className={`text-white transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <>
          {/* Overlay pour fermer le dropdown */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown menu */}
          <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
            {periodOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handlePeriodChange(option.value)}
                className={`w-full px-4 py-3 text-left cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 ${selectedPeriod === option.value
                    ? 'bg-orange-50 border-orange-100'
                    : ''
                  }`}
              >
                <div className="flex flex-col">
                  <span className={`text-sm font-medium ${selectedPeriod === option.value
                      ? 'text-[#F17922]'
                      : 'text-gray-700'
                    }`}>
                    {option.label}
                  </span>
                  <span className="text-xs text-gray-500 mt-0.5">
                    {option.description}
                  </span>
                </div>


              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
